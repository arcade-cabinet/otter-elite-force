/**
 * usePointerInput — unified pointer/touch input hook for the Konva canvas.
 *
 * Handles mouse + touch via browser PointerEvent API. Routes gestures
 * through GestureDetector → SelectionManager / CommandDispatcher.
 *
 * Gesture mapping (mobile-first):
 * - Tap on unit → select (SelectionManager.selectAt)
 * - Tap on ground with selection → context command (move/attack/gather)
 * - One-finger drag → box selection rectangle
 * - Two-finger drag → camera pan
 * - Pinch → camera zoom
 * - Long press → context command + radial menu event
 * - Right-click (desktop) → context command
 * - Mouse wheel → zoom
 * - Shift+click → additive selection
 *
 * Coordinate transform: screenX + camX = worldX (camera has no zoom scaling
 * in the current useCamera implementation — offset only).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { World } from "koota";
import { CommandDispatcher } from "@/input/commandDispatcher";
import { GestureDetector, GestureType, type PointerState } from "@/input/gestureDetector";
import { SelectionManager } from "@/input/selectionManager";
import type { CameraState } from "./useCamera";
import type { DragSelectState } from "./OverlayLayer";

// ─── Types ───

export interface UsePointerInputOptions {
  world: World;
  camera: CameraState;
  pan: (dx: number, dy: number) => void;
  setZoom: (zoom: number) => void;
  enabled?: boolean;
}

export interface UsePointerInputResult {
  /** Spread these props onto the container div wrapping the Stage. */
  containerProps: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onWheel: (e: React.WheelEvent) => void;
    onContextMenu: (e: React.MouseEvent) => void;
  };
  /** Current drag-select rectangle for OverlayLayer. */
  dragSelect: DragSelectState;
  /** Access the selection manager for external queries. */
  selection: SelectionManager;
  /** Access the command dispatcher for external queries. */
  commands: CommandDispatcher;
}

// ─── Constants ───

/** Wheel zoom speed factor. */
const WHEEL_ZOOM_FACTOR = 0.001;

// ─── Hook ───

export function usePointerInput({
  world,
  camera,
  pan,
  setZoom,
  enabled = true,
}: UsePointerInputOptions): UsePointerInputResult {
  const selectionManager = useMemo(() => new SelectionManager(world), [world]);
  const commandDispatcher = useMemo(() => new CommandDispatcher(world), [world]);
  const gestureDetector = useMemo(() => new GestureDetector(), []);

  // Mutable refs for values that change every frame
  const cameraRef = useRef(camera);
  cameraRef.current = camera;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  // Active pointers map (pointerId → PointerState)
  const pointersRef = useRef(new Map<number, PointerState>());

  // Drag-select state (exposed for OverlayLayer)
  const dragSelectRef = useRef<DragSelectState>({
    active: false, startX: 0, startY: 0, endX: 0, endY: 0,
  });

  // Force re-render when drag state changes (for OverlayLayer)
  const [, setDragTick] = useState(0);

  // Track active pointer captures for cleanup
  const capturedPointersRef = useRef<Set<number>>(new Set());

  // Cleanup on unmount — release pointer captures and destroy managers
  useEffect(() => {
    return () => {
      selectionManager.destroy();
      commandDispatcher.destroy();
      // Release any lingering pointer captures
      capturedPointersRef.current.clear();
    };
  }, [selectionManager, commandDispatcher]);

  // ─── Helpers ───

  /** Convert a React PointerEvent to our framework-agnostic PointerState. */
  const toPointerState = useCallback(
    (e: React.PointerEvent): PointerState => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const cam = cameraRef.current;
      return {
        id: e.pointerId,
        x: screenX,
        y: screenY,
        worldX: screenX + cam.x,
        worldY: screenY + cam.y,
        isDown: e.pressure > 0,
        time: e.timeStamp,
      };
    },
    [],
  );

  /** Get array of all currently-tracked pointers. */
  const getActivePointers = useCallback((): PointerState[] => {
    return Array.from(pointersRef.current.values());
  }, []);

  /** Update drag-select rect and trigger re-render for OverlayLayer. */
  const updateDragSelect = useCallback(
    (active: boolean, startX = 0, startY = 0, endX = 0, endY = 0) => {
      const prev = dragSelectRef.current;
      if (
        prev.active === active &&
        prev.startX === startX &&
        prev.startY === startY &&
        prev.endX === endX &&
        prev.endY === endY
      ) {
        return; // No change
      }
      dragSelectRef.current = { active, startX, startY, endX, endY };
      setDragTick((t) => t + 1);
    },
    [setDragTick],
  );

  // ─── Event handlers ───

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!enabledRef.current) return;

      // Right-click → smart context command (desktop)
      if (e.button === 2) {
        const ps = toPointerState(e);
        commandDispatcher.issueSmartCommand(ps.worldX, ps.worldY);
        return;
      }

      // Track this pointer
      const ps = toPointerState(e);
      pointersRef.current.set(e.pointerId, ps);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

      gestureDetector.onPointerDown(getActivePointers());
    },
    [world, commandDispatcher, gestureDetector, toPointerState, getActivePointers],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!enabledRef.current) return;
      if (!pointersRef.current.has(e.pointerId)) return;

      // Update tracked pointer position
      const ps = toPointerState(e);
      pointersRef.current.set(e.pointerId, ps);

      const pointers = getActivePointers();
      const gesture = gestureDetector.onPointerMove(pointers);
      if (!gesture) return;

      switch (gesture.type) {
        case GestureType.TwoFingerDrag:
          pan(-(gesture.deltaX ?? 0), -(gesture.deltaY ?? 0));
          break;

        case GestureType.Pinch: {
          const newZoom = cameraRef.current.zoom * (gesture.scale ?? 1);
          setZoom(newZoom);
          break;
        }

        case GestureType.OneFingerDrag:
          // Show selection box in screen-space
          updateDragSelect(
            true,
            (gesture.startWorldX ?? 0) - cameraRef.current.x,
            (gesture.startWorldY ?? 0) - cameraRef.current.y,
            ps.x,
            ps.y,
          );
          break;
      }
    },
    [gestureDetector, pan, setZoom, toPointerState, getActivePointers, updateDragSelect],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!enabledRef.current) return;
      if (!pointersRef.current.has(e.pointerId)) return;

      const ps = toPointerState(e);
      pointersRef.current.delete(e.pointerId);

      // Clear the selection rectangle
      updateDragSelect(false);

      // Check if the gesture was a drag-select → finalize box selection
      if (gestureDetector.wasDragSelect) {
        selectionManager.selectBox(
          gestureDetector.lastDragStartWorldX,
          gestureDetector.lastDragStartWorldY,
          ps.worldX,
          ps.worldY,
          e.shiftKey,
        );
        gestureDetector.clearDragState();
        gestureDetector.onPointerUp([ps]);
        return;
      }

      const gesture = gestureDetector.onPointerUp([ps]);
      if (!gesture) return;

      switch (gesture.type) {
        case GestureType.Tap: {
          const wx = gesture.currentWorldX ?? 0;
          const wy = gesture.currentWorldY ?? 0;

          // If tapping on a friendly unit → select it
          if (selectionManager.hasFriendlyAt(wx, wy)) {
            selectionManager.selectAt(wx, wy, e.shiftKey);
          } else {
            // Smart command: resource→swarm gather, enemy→swarm attack, ground→move/build
            commandDispatcher.issueSmartCommand(wx, wy);
          }
          break;
        }

        case GestureType.LongPress: {
          const wx = gesture.currentWorldX ?? 0;
          const wy = gesture.currentWorldY ?? 0;
          // Long press → smart command (mobile alternative to right-click)
          commandDispatcher.issueSmartCommand(wx, wy);
          break;
        }
      }
    },
    [world, selectionManager, commandDispatcher, gestureDetector, toPointerState, updateDragSelect],
  );

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!enabledRef.current) return;
      const cam = cameraRef.current;
      const delta = -e.deltaY * WHEEL_ZOOM_FACTOR;
      setZoom(cam.zoom + delta);
    },
    [setZoom],
  );

  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // ─── Edge scroll + arrow keys ───

  // Track mouse position for edge scroll — starts at center (no edge scroll until mouse moves)
  const mouseScreenRef = useRef({ x: Math.round(window.innerWidth / 2), y: Math.round(window.innerHeight / 2) });
  const mouseEnteredRef = useRef(false);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseScreenRef.current = { x: e.clientX, y: e.clientY };
      mouseEnteredRef.current = true;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Edge scroll + arrow keys via rAF
  useEffect(() => {
    const EDGE_THRESHOLD = 20;
    const SCROLL_SPEED = 8; // pixels per frame
    const keysDown = new Set<string>();

    const onKeyDown = (e: KeyboardEvent) => keysDown.add(e.key);
    const onKeyUp = (e: KeyboardEvent) => keysDown.delete(e.key);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    let raf = 0;
    const tick = () => {
      let dx = 0;
      let dy = 0;

      // Arrow keys
      if (keysDown.has("ArrowLeft") || keysDown.has("a")) dx -= SCROLL_SPEED;
      if (keysDown.has("ArrowRight") || keysDown.has("d")) dx += SCROLL_SPEED;
      if (keysDown.has("ArrowUp") || keysDown.has("w")) dy -= SCROLL_SPEED;
      if (keysDown.has("ArrowDown") || keysDown.has("s")) dy += SCROLL_SPEED;

      // Edge scroll (mouse at viewport edges) — only after mouse has entered
      if (mouseEnteredRef.current) {
        const { x, y } = mouseScreenRef.current;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        if (x < EDGE_THRESHOLD) dx -= SCROLL_SPEED;
        if (x > vw - EDGE_THRESHOLD) dx += SCROLL_SPEED;
        if (y < EDGE_THRESHOLD) dy -= SCROLL_SPEED;
        if (y > vh - EDGE_THRESHOLD) dy += SCROLL_SPEED;
      }

      if (dx !== 0 || dy !== 0) {
        pan(dx, dy);
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [pan]);

  // ─── Return ───

  return {
    containerProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onWheel,
      onContextMenu,
    },
    dragSelect: dragSelectRef.current,
    selection: selectionManager,
    commands: commandDispatcher,
  };
}