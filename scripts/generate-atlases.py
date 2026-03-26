#!/usr/bin/env python3
"""
Sprite Atlas Generator — generates Aseprite-format JSON atlases for all
purchased sprite sheets using visually verified frame sizes.

Usage: python3 scripts/generate-atlases.py
"""

import json
from pathlib import Path
from PIL import Image
import numpy as np

SPRITES_DIR = Path("public/assets/sprites")

# ─── Visually verified frame sizes and animation row names ───

SHEET_SPECS: dict[str, dict] = {
    # Crocodile already has atlas — skip
    "boar": {
        "frame_w": 32, "frame_h": 32,
        "rows": [
            "Idle", "Walk", "Run", "Charge",
            "Attack", "Hurt", "Death",
            "Eat", "Dig", "Sniff",
            "Idle2", "Special",
        ],
    },
    "cobra": {
        "frame_w": 32, "frame_h": 32,
        "rows": [
            "Idle", "Slither", "Strike", "Spit", "Hurt",
        ],
    },
    "fox": {
        "frame_w": 64, "frame_h": 32,
        "rows": [
            "Idle", "Run", "Pounce", "Attack", "Hurt", "Death", "Sniff",
        ],
    },
    "hedgehog": {
        "frame_w": 32, "frame_h": 32,
        "rows": [
            "Idle", "Walk", "Curl", "Roll",
        ],
    },
    "naked_mole_rat": {
        "frame_w": 32, "frame_h": 32,
        "rows": [
            "Idle", "Walk", "Dig", "Attack",
            "Hurt", "Death", "Burrow", "Emerge",
        ],
    },
    "porcupine": {
        "frame_w": 32, "frame_h": 32,
        "rows": [
            "Idle", "Walk", "QuillShot", "Hurt", "Death",
        ],
    },
    "skunk": {
        "frame_w": 32, "frame_h": 32,
        "rows": [
            "Idle", "Walk", "Spray", "Attack", "Hurt",
        ],
    },
    "snake": {
        "frame_w": 32, "frame_h": 32,
        "rows": [
            "Idle", "Slither", "Lunge", "Coil",
            "Strike", "Hurt", "Death", "Hiss",
            "Burrow", "Emerge",
        ],
    },
    "squirrel": {
        "frame_w": 32, "frame_h": 32,
        "rows": [
            "Idle", "Run", "Jump", "Attack",
            "Hurt", "Death", "Gather",
        ],
    },
    "vulture": {
        "frame_w": 40, "frame_h": 40,
        "rows": [
            "Perch", "Fly", "Dive", "Peck",
        ],
    },
}


def generate_atlas(name: str, spec: dict) -> None:
    """Generate an Aseprite-format JSON atlas for a sprite sheet."""
    png_path = SPRITES_DIR / f"{name}.png"
    json_path = SPRITES_DIR / f"{name}.json"

    if json_path.exists():
        print(f"  {name}: atlas exists, overwriting")

    img = Image.open(png_path).convert("RGBA")
    arr = np.array(img)
    alpha = arr[:, :, 3]
    img_w, img_h = img.size
    fw, fh = spec["frame_w"], spec["frame_h"]
    cols = img_w // fw
    total_rows = img_h // fh

    print(f"  {name}: {img_w}x{img_h} → {fw}x{fh} grid, {cols} cols × {total_rows} rows")

    row_names = spec.get("rows", [])
    frames = {}
    frame_tags = []
    frame_idx = 0

    display_name = name.replace("_", " ").title()

    for r in range(total_rows):
        # Count non-empty frames in this row
        row_frames = []
        for c in range(cols):
            x = c * fw
            y = r * fh
            cell = alpha[y:y + fh, x:x + fw]
            if cell.max() > 0:
                row_frames.append({"x": x, "y": y, "w": fw, "h": fh})

        if not row_frames:
            continue

        anim_name = row_names[len(frame_tags)] if len(frame_tags) < len(row_names) else f"Row{r}"
        start_idx = frame_idx

        for i, f in enumerate(row_frames):
            key = f"{display_name} ({anim_name}) {i}.ase"
            frames[key] = {
                "frame": {"x": f["x"], "y": f["y"], "w": f["w"], "h": f["h"]},
                "rotated": False,
                "trimmed": False,
                "spriteSourceSize": {"x": 0, "y": 0, "w": f["w"], "h": f["h"]},
                "sourceSize": {"w": f["w"], "h": f["h"]},
                "duration": 100,
            }
            frame_idx += 1

        frame_tags.append({
            "name": anim_name,
            "from": start_idx,
            "to": frame_idx - 1,
            "direction": "forward",
        })

    atlas = {
        "frames": frames,
        "meta": {
            "app": "atlas-generator",
            "version": "1.0",
            "image": f"{name}.png",
            "format": "RGBA8888",
            "size": {"w": img_w, "h": img_h},
            "scale": "1",
            "frameTags": frame_tags,
        },
    }

    with open(json_path, "w") as f:
        json.dump(atlas, f, indent=2)

    total = sum(1 for _ in frames)
    anims = ", ".join(t["name"] + "(" + str(t["to"] - t["from"] + 1) + ")" for t in frame_tags)
    print(f"    {total} frames, animations: {anims}")


def pack_otter_frames() -> None:
    """Combine individual otter PNGs into a single sprite sheet + atlas."""
    otter_dir = SPRITES_DIR / "otter"
    if not otter_dir.exists():
        print("  No otter directory found, skipping")
        return

    # Group frames by animation
    anim_groups: dict[str, list[tuple[int, Path]]] = {}
    for f in sorted(otter_dir.glob("otter_*.png")):
        stem = f.stem
        parts = stem.split("_")
        frame_num = int(parts[-1])
        anim_name = "_".join(parts[1:-1])
        if anim_name not in anim_groups:
            anim_groups[anim_name] = []
        anim_groups[anim_name].append((frame_num, f))

    for key in anim_groups:
        anim_groups[key].sort(key=lambda x: x[0])

    # Find global content bounding box
    global_left, global_top = 9999, 9999
    global_right, global_bottom = 0, 0
    for anim_name, frame_list in anim_groups.items():
        for _, path in frame_list:
            img = Image.open(path).convert("RGBA")
            bbox = img.getbbox()
            if bbox:
                global_left = min(global_left, bbox[0])
                global_top = min(global_top, bbox[1])
                global_right = max(global_right, bbox[2])
                global_bottom = max(global_bottom, bbox[3])

    content_w = global_right - global_left + 4
    content_h = global_bottom - global_top + 4
    frame_w = ((content_w + 7) // 8) * 8
    frame_h = ((content_h + 7) // 8) * 8

    print(f"  Content: ({global_left},{global_top})-({global_right},{global_bottom}) → {frame_w}x{frame_h} frames")

    anim_order = ["idle", "idle_alt", "run", "jump", "land", "spin", "sleep"]
    anim_order = [a for a in anim_order if a in anim_groups]
    for name in anim_groups:
        if name not in anim_order:
            anim_order.append(name)

    max_cols = max(len(anim_groups[a]) for a in anim_order)
    sheet_w = max_cols * frame_w
    sheet_h = len(anim_order) * frame_h

    sheet = Image.new("RGBA", (sheet_w, sheet_h), (0, 0, 0, 0))
    frames_data = {}
    frame_tags = []
    frame_idx = 0

    for row, anim_name in enumerate(anim_order):
        start_idx = frame_idx
        for col, (_, path) in enumerate(anim_groups[anim_name]):
            img = Image.open(path).convert("RGBA")
            cropped = img.crop((global_left - 2, global_top - 2,
                                global_left - 2 + frame_w, global_top - 2 + frame_h))
            x = col * frame_w
            y = row * frame_h
            sheet.paste(cropped, (x, y))

            display_name = anim_name.replace("_", " ").title()
            key = f"Otter ({display_name}) {col}.ase"
            frames_data[key] = {
                "frame": {"x": x, "y": y, "w": frame_w, "h": frame_h},
                "rotated": False,
                "trimmed": False,
                "spriteSourceSize": {"x": 0, "y": 0, "w": frame_w, "h": frame_h},
                "sourceSize": {"w": frame_w, "h": frame_h},
                "duration": 100,
            }
            frame_idx += 1

        display_name = anim_name.replace("_", " ").title()
        frame_tags.append({
            "name": display_name,
            "from": start_idx,
            "to": frame_idx - 1,
            "direction": "forward",
        })

    sheet.save(SPRITES_DIR / "otter.png", "PNG")
    atlas = {
        "frames": frames_data,
        "meta": {
            "app": "atlas-generator",
            "version": "1.0",
            "image": "otter.png",
            "format": "RGBA8888",
            "size": {"w": sheet_w, "h": sheet_h},
            "scale": "1",
            "frameTags": frame_tags,
        },
    }
    with open(SPRITES_DIR / "otter.json", "w") as f:
        json.dump(atlas, f, indent=2)

    anims = ", ".join(t["name"] + "(" + str(t["to"] - t["from"] + 1) + ")" for t in frame_tags)
    print(f"  Sheet: {sheet_w}x{sheet_h}, {frame_idx} frames")
    print(f"  Animations: {anims}")


def main():
    print("=== Sprite Atlas Generator ===\n")

    for name, spec in SHEET_SPECS.items():
        print(f"Processing {name}...")
        generate_atlas(name, spec)

    print(f"\nPacking otter frames...")
    pack_otter_frames()

    # Verify all atlases exist
    print("\n=== Verification ===")
    all_sprites = ["boar", "cobra", "crocodile", "fox", "hedgehog",
                   "naked_mole_rat", "otter", "porcupine", "skunk",
                   "snake", "squirrel", "vulture"]
    for name in all_sprites:
        png = SPRITES_DIR / f"{name}.png"
        atlas = SPRITES_DIR / f"{name}.json"
        status = "✓" if png.exists() and atlas.exists() else "✗"
        print(f"  {status} {name}: PNG={'yes' if png.exists() else 'NO'} Atlas={'yes' if atlas.exists() else 'NO'}")

    print("\nDone.")


if __name__ == "__main__":
    main()
