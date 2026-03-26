/**
 * GameLayout — POC-style responsive game layout with diegetic action panel.
 *
 * Mobile portrait: canvas on top, UI panel at bottom (flex-col-reverse).
 * Desktop/landscape: UI panel on left, canvas on right (md:flex-row).
 *
 * The UI panel contains three sections: Minimap, Selection Info, Action Panel.
 * A resource bar overlays the top of the game canvas area.
 */

import { useQuery, useTrait, useWorld } from "koota/react";
import { type ReactNode, useEffect, useRef } from "react";
import { Health } from "@/ecs/traits/combat";
import { Faction, IsBuilding, IsResource, Selected, UnitType } from "@/ecs/traits/identity";
import { Objectives, PopulationState, ResourcePool } from "@/ecs/traits/state";
import { Position } from "@/ecs/traits/spatial";
import { ALL_BUILDINGS, ALL_HEROES, ALL_UNITS } from "@/entities/registry";
import { getEntity } from "@/entities/registry";
import { EventBus } from "@/game/EventBus";
import { BossHealthBar } from "@/ui/hud/BossHealthBar";
import { cn } from "@/ui/lib/utils";

// ---------------------------------------------------------------------------
// GameLayout — main responsive container
// ---------------------------------------------------------------------------

export function GameLayout({ children }: { children: ReactNode }) {
	return (
		<div className="flex flex-col-reverse md:flex-row h-screen w-screen text-sm text-slate-200">
			{/* UI Panel: bottom on mobile, left on desktop */}
			<div className="w-full md:w-64 h-48 md:h-full flex flex-row md:flex-col z-20 shadow-2xl flex-shrink-0 border-t-4 md:border-t-0 md:border-r-4 border-slate-600 bg-slate-800">
				<MinimapSection />
				<SelectionInfoSection />
				<ActionPanelSection />
			</div>

			{/* Main game area */}
			<div className="flex-1 relative cursor-crosshair overflow-hidden bg-black">
				<ResourceStrip />
				<BossHealthBar />
				{children}
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Minimap — real-time fog-of-war minimap with entity dots
// ---------------------------------------------------------------------------

function MinimapSection() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const entities = useQuery(Position, Faction);

	// Redraw minimap every 500ms
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const draw = () => {
			const w = canvas.width;
			const h = canvas.height;

			// Dark fog base — minimap starts as unexplored
			ctx.fillStyle = "#0a0f1a";
			ctx.fillRect(0, 0, w, h);

			// Determine map size from current mission terrain
			// Read from CurrentMission or infer from entity positions
			let mapW = 128;
			let mapH = 96;
			for (const entity of entities) {
				const pos = entity.get(Position);
				if (pos) {
					mapW = Math.max(mapW, Math.ceil(pos.x) + 1);
					mapH = Math.max(mapH, Math.ceil(pos.y) + 1);
				}
			}
			const sx = w / mapW;
			const sy = h / mapH;

			// Only draw terrain around player units (explored area)
			for (const entity of entities) {
				const pos = entity.get(Position);
				const faction = entity.get(Faction);
				if (!pos || !faction) continue;
				if (faction.id !== "ura") continue;

				// Reveal terrain in a radius around player units
				const radius = 8;
				const cx = pos.x * sx;
				const cy = pos.y * sy;
				const r = radius * Math.max(sx, sy);
				ctx.fillStyle = "#14532d";
				ctx.beginPath();
				ctx.arc(cx, cy, r, 0, Math.PI * 2);
				ctx.fill();
			}

			// Draw entity dots (only player + nearby visible)
			for (const entity of entities) {
				const pos = entity.get(Position);
				const faction = entity.get(Faction);
				if (!pos || !faction) continue;

				const px = pos.x * sx;
				const py = pos.y * sy;

				// Only show enemy/resource entities near player units
				if (faction.id !== "ura") {
					let nearPlayer = false;
					for (const pe of entities) {
						if (pe.get(Faction)?.id !== "ura") continue;
						const pp = pe.get(Position);
						if (!pp) continue;
						const dx = pos.x - pp.x;
						const dy = pos.y - pp.y;
						if (dx * dx + dy * dy < 100) { nearPlayer = true; break; }
					}
					if (!nearPlayer) continue;
				}

				if (entity.has(IsResource)) {
					ctx.fillStyle = "#eab308";
					ctx.fillRect(px - 1, py - 1, 2, 2);
				} else if (entity.has(IsBuilding)) {
					ctx.fillStyle = faction.id === "ura" ? "#22c55e" : "#ef4444";
					ctx.fillRect(px - 2, py - 2, 4, 4);
				} else if (faction.id === "ura") {
					ctx.fillStyle = "#4ade80";
					ctx.fillRect(px - 1, py - 1, 3, 3);
				} else if (faction.id !== "neutral") {
					ctx.fillStyle = "#f87171";
					ctx.fillRect(px - 1, py - 1, 3, 3);
				}
			}
		};

		draw();
		const interval = setInterval(draw, 500);
		return () => clearInterval(interval);
	}, [entities]);

	return (
		<div className="w-1/3 md:w-full md:h-48 p-1 md:p-2 bg-black flex justify-center items-center border-r-2 md:border-r-0 md:border-b-4 border-slate-700">
			<canvas
				ref={canvasRef}
				width={192}
				height={176}
				className="w-full h-full border border-slate-700"
				style={{ imageRendering: "pixelated" }}
			/>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Selection Info — reads Selected + Health traits from ECS
// ---------------------------------------------------------------------------

function SelectionInfoSection() {
	const selected = useQuery(Selected);
	const entity = selected.length > 0 ? selected[0] : null;

	if (!entity) {
		return (
			<div className="w-1/3 md:w-full flex-1 p-2 md:p-4 border-r-2 md:border-r-0 md:border-b-4 border-slate-700 flex flex-col gap-1 md:gap-2 overflow-y-auto bg-slate-900">
				<h2 className="text-sm md:text-base font-bold text-slate-400 leading-tight uppercase tracking-wider">
					Recon
				</h2>
				<p className="text-slate-500 text-[10px] md:text-xs leading-snug">
					Click units to select. Click resources to harvest. Click enemies to engage.
				</p>
			</div>
		);
	}

	return <SelectedInfo entity={entity} />;
}

function SelectedInfo({ entity }: { entity: Parameters<typeof useTrait>[0] }) {
	const unitType = useTrait(entity, UnitType);
	const health = useTrait(entity, Health);
	const type = unitType?.type ?? "";
	const entityInfo = getEntity(type);
	const name =
		ALL_HEROES[type]?.name ?? ALL_UNITS[type]?.name ?? ALL_BUILDINGS[type]?.name
		?? entityInfo?.def?.name ?? type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
	const role = ALL_UNITS[type]?.category ?? ALL_HEROES[type]?.category ?? "";
	const hpPct = health ? Math.round((health.current / Math.max(health.max, 1)) * 100) : 0;
	const hpBarColor = hpPct > 60 ? "bg-green-500" : hpPct > 30 ? "bg-yellow-500" : "bg-red-500";

	return (
		<div className="w-1/3 md:w-full flex-1 p-2 md:p-4 border-r-2 md:border-r-0 md:border-b-4 border-slate-700 flex flex-col gap-1 md:gap-2 overflow-y-auto bg-slate-900">
			<h2 className="text-sm md:text-lg font-bold text-sky-300 leading-tight">{name}</h2>
			{role && <p className="text-[10px] md:text-xs text-slate-400 leading-tight">{role}</p>}
			{health && (
				<>
					<div className="w-full h-2.5 md:h-3 bg-red-900/60 border border-slate-800 mt-1">
						<div
							className={cn("h-full transition-all duration-200", hpBarColor)}
							style={{ width: `${hpPct}%` }}
						/>
					</div>
					<p className="text-slate-400 text-[10px] md:text-xs">
						{health.current}/{health.max}
					</p>
				</>
			)}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Contextual Panel — build grid by default, hints when units selected
// ---------------------------------------------------------------------------

/** Buildings the player can construct (from mission unlocks). */
const BUILD_GRID = [
	{ id: "command_post", name: "Command Post", icon: "🏛", cost: { fish: 200, timber: 100 } },
	{ id: "barracks", name: "Barracks", icon: "⚔", cost: { fish: 150, timber: 75 } },
	{ id: "watchtower", name: "Watchtower", icon: "🗼", cost: { timber: 100 } },
	{ id: "fish_trap", name: "Fish Trap", icon: "🐟", cost: { timber: 50 } },
	{ id: "burrow", name: "Burrow", icon: "🏠", cost: { fish: 75, timber: 50 } },
	{ id: "sandbag_wall", name: "Sandbag", icon: "🧱", cost: { timber: 25 } },
] as const;

function ActionPanelSection() {
	const selected = useQuery(Selected);
	const hasSelection = selected.length > 0;

	if (hasSelection) {
		return <ContextHints />;
	}

	return <BuildGrid />;
}

function BuildGrid() {
	return (
		<div className="w-1/3 md:w-full h-full md:flex-1 p-1 md:p-2 bg-slate-800 overflow-y-auto">
			<div className="text-[9px] uppercase tracking-widest text-slate-500 mb-1 px-1">Build</div>
			<div className="grid grid-cols-2 gap-1">
				{BUILD_GRID.map((b) => (
					<button
						key={b.id}
						type="button"
						className="flex flex-col items-center gap-0.5 p-1.5 bg-slate-700/80 hover:bg-slate-600 active:bg-slate-500 border border-slate-600 text-[10px] text-slate-300 transition-colors min-h-[40px]"
						onClick={() => EventBus.emit("start-build-placement", { buildingType: b.id })}
					>
						<span className="text-base leading-none">{b.icon}</span>
						<span className="font-bold uppercase tracking-wider leading-tight">{b.name}</span>
						<span className="text-slate-400 text-[8px]">
							{Object.entries(b.cost).map(([r, v]) => `${v}${r[0].toUpperCase()}`).join(" ")}
						</span>
					</button>
				))}
			</div>
		</div>
	);
}

function ContextHints() {
	const world = useWorld();
	return (
		<div className="w-1/3 md:w-full h-full md:flex-1 p-2 md:p-3 bg-slate-800 flex flex-col gap-2 text-[10px] md:text-xs text-slate-400">
			<div className="text-[9px] uppercase tracking-widest text-slate-500">Commands</div>
			<div className="space-y-1.5">
				<div>👆 <span className="text-slate-300">Click ground</span> — move</div>
				<div>🪵 <span className="text-slate-300">Click resource</span> — harvest</div>
				<div>⚔️ <span className="text-slate-300">Click enemy</span> — attack</div>
				<div>🏗️ <span className="text-slate-300">Click open terrain</span> — build</div>
			</div>
			<button
				type="button"
				className="mt-auto min-h-[36px] px-2 py-1 bg-red-900/40 hover:bg-red-800/50 border border-red-800/30 text-red-400 font-bold uppercase tracking-wider text-[10px] transition-colors"
				onClick={() => world.query(Selected).forEach((e) => e.remove(Selected))}
			>
				Deselect [Esc]
			</button>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Resource Strip — absolute-positioned top bar over the game canvas
// ---------------------------------------------------------------------------

function ResourceStrip() {
	const world = useWorld();
	const resources = useTrait(world, ResourcePool);
	const population = useTrait(world, PopulationState);

	const fish = resources?.fish ?? 0;
	const timber = resources?.timber ?? 0;
	const salvage = resources?.salvage ?? 0;
	const popCurrent = population?.current ?? 0;
	const popMax = population?.max ?? 0;

	return (
		<div
			role="status"
			aria-label={`Resources: ${fish} Fish, ${timber} Timber, ${salvage} Salvage. Population: ${popCurrent} of ${popMax}`}
			className="absolute top-0 left-0 w-full h-10 md:h-12 bg-slate-800/95 border-b-2 md:border-b-4 border-slate-600 flex items-center justify-between px-2 md:px-6 z-20 text-xs md:text-sm"
		>
			<div className="flex space-x-3 md:space-x-6">
				<ResourceIcon color="bg-sky-400 border-sky-300 rounded-full" label="Fish" value={fish} />
				<ResourceIcon color="bg-amber-700 border-amber-500" label="Timber" value={timber} />
				<ResourceIcon color="bg-orange-500 border-orange-400 rounded-sm" label="Salvage" value={salvage} />
			</div>
			<div className="flex items-center space-x-3 md:space-x-6">
				<ObjectiveBadge />
				<span className="text-sky-200 font-bold">
					Pop: {popCurrent}/{popMax}
				</span>
			</div>
		</div>
	);
}

function ResourceIcon({
	color,
	label,
	value,
}: { color: string; label: string; value: number }) {
	return (
		<div className="flex items-center space-x-1 md:space-x-2">
			<div className={cn("w-3 h-3 md:w-4 md:h-4 border shadow-sm", color)} />
			<span className="hidden md:inline">{label}: </span>
			<span className="text-slate-200 font-bold">{value}</span>
		</div>
	);
}

function ObjectiveBadge() {
	const world = useWorld();
	const objectives = useTrait(world, Objectives);
	if (!objectives || objectives.list.length === 0) return null;

	const primary = objectives.list.filter((o) => !o.bonus);
	const completed = primary.filter((o) => o.status === "completed").length;
	const total = primary.length;

	return (
		<span className="hidden sm:inline text-green-400 font-bold text-xs">
			{completed}/{total}
		</span>
	);
}

