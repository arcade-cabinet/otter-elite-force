#!/usr/bin/env python3
"""
Generate procedural biome transition tiles that blend between exact fill tile colors.

Replaces Kenney edge tiles (grass_sand_tl, grass_water_t, water_edge_bl, etc.)
which are hue-rotated from teal and DON'T match the hand-painted fill tiles.

Output: 32x32 PNG tiles named blend_{a}_{b}_{dir}.png
  where `a` is the "inside" terrain (center of the tile) and `b` is the
  "outside" terrain (the neighbor encroaching from that edge).

Directions: tl, t, tr, l, r, bl, b, br
  - t  = outside terrain is on the top edge
  - bl = outside terrain is on the bottom-left corner
  - etc.
"""

from __future__ import annotations

import os
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

# ── Exact fill-tile colors (sampled from the hand-painted PNGs) ──

FILL_COLORS: dict[str, tuple[int, int, int]] = {
    "grass":    (18, 65, 30),
    "mangrove": (10, 45, 14),
    "water":    (12, 30, 40),
    "dirt":     (90, 60, 28),
    "mud":      (60, 42, 28),
    "beach":    (170, 130, 82),
    "bridge":   (120, 88, 38),
}

# ── Terrain pairs that can be adjacent ──

TERRAIN_PAIRS: list[tuple[str, str]] = [
    ("grass", "water"),       # riverbanks — most important
    ("grass", "beach"),       # coastline
    ("grass", "dirt"),        # trails
    ("grass", "mud"),         # swamp edges
    ("grass", "mangrove"),    # jungle canopy transition
    ("water", "beach"),       # shoreline
    ("dirt",  "beach"),       # sandy trails
]

# ── Transition directions ──

# Each direction defines a gradient mask: (dx, dy) is the unit vector
# pointing FROM the outside terrain INTO the inside terrain.
# For corners, both axes contribute.

SIZE = 32

DIRECTIONS: dict[str, tuple[float, float]] = {
    "t":  (0.0,  1.0),   # outside above  -> gradient goes down
    "b":  (0.0, -1.0),   # outside below  -> gradient goes up
    "l":  (1.0,  0.0),   # outside left   -> gradient goes right
    "r":  (-1.0, 0.0),   # outside right  -> gradient goes left
    "tl": (0.707, 0.707),
    "tr": (-0.707, 0.707),
    "bl": (0.707, -0.707),
    "br": (-0.707, -0.707),
}


def lerp_color(
    c1: tuple[int, int, int],
    c2: tuple[int, int, int],
    t: float,
) -> tuple[int, int, int]:
    """Linearly interpolate between two RGB colors."""
    return (
        int(c1[0] + (c2[0] - c1[0]) * t),
        int(c1[1] + (c2[1] - c1[1]) * t),
        int(c1[2] + (c2[2] - c1[2]) * t),
    )


def generate_blend_tile(
    inside_color: tuple[int, int, int],
    outside_color: tuple[int, int, int],
    direction: str,
    seed: int,
) -> Image.Image:
    """
    Generate a 32x32 blend tile.

    1. Fill with the inside terrain color
    2. Apply a smooth gradient mask from the outside terrain
    3. Add noise scatter at the transition edge for organic feel
    """
    rng = random.Random(seed)
    dx, dy = DIRECTIONS[direction]
    is_corner = direction in ("tl", "tr", "bl", "br")

    img = Image.new("RGB", (SIZE, SIZE), inside_color)
    pixels = img.load()

    # Build a gradient mask: 0.0 = fully inside, 1.0 = fully outside
    # The gradient runs from the outside edge into the tile center.
    for y in range(SIZE):
        for x in range(SIZE):
            # Normalize coordinates to [-1, 1]
            nx = (x / (SIZE - 1)) * 2 - 1  # -1 = left, +1 = right
            ny = (y / (SIZE - 1)) * 2 - 1  # -1 = top,  +1 = bottom

            # Project onto the direction vector
            if is_corner:
                # For corners, use a radial-ish gradient from the corner
                # The corner point is determined by the direction
                corner_x = -1.0 if dx > 0 else 1.0
                corner_y = -1.0 if dy > 0 else 1.0
                dist = ((nx - corner_x) ** 2 + (ny - corner_y) ** 2) ** 0.5
                # Normalize: dist ranges from 0 (at corner) to ~2.83 (opposite corner)
                # We want blend zone ~0 to 1.5
                t = 1.0 - min(1.0, dist / 1.6)
            else:
                # For edges, project onto the normal direction
                proj = nx * (-dx) + ny * (-dy)
                # proj ranges from -1 (far from outside) to +1 (at the outside edge)
                # Map to blend factor: 0 = no outside, 1 = full outside
                # Transition zone covers about 60% of the tile
                t = max(0.0, min(1.0, (proj + 0.2) / 1.2))

            # Apply a smoothstep curve for natural blending
            t = t * t * (3 - 2 * t)

            # Add noise to break up the transition edge
            noise = (rng.random() - 0.5) * 0.18
            t = max(0.0, min(1.0, t + noise))

            color = lerp_color(inside_color, outside_color, t)
            pixels[x, y] = color

    # Add extra scatter dots at the transition edge for organic feel
    draw = ImageDraw.Draw(img)
    scatter_count = 60 if is_corner else 80

    for _ in range(scatter_count):
        sx = rng.randint(0, SIZE - 1)
        sy = rng.randint(0, SIZE - 1)

        # Only scatter near the transition zone
        nx = (sx / (SIZE - 1)) * 2 - 1
        ny = (sy / (SIZE - 1)) * 2 - 1

        if is_corner:
            corner_x = -1.0 if dx > 0 else 1.0
            corner_y = -1.0 if dy > 0 else 1.0
            dist = ((nx - corner_x) ** 2 + (ny - corner_y) ** 2) ** 0.5
            edge_t = 1.0 - min(1.0, dist / 1.6)
        else:
            proj = nx * (-dx) + ny * (-dy)
            edge_t = max(0.0, min(1.0, (proj + 0.2) / 1.2))

        # Only scatter in the middle of the transition zone (0.2 to 0.8)
        if 0.15 < edge_t < 0.85:
            use_outside = rng.random() < 0.5
            color = outside_color if use_outside else inside_color
            # Vary the dot color slightly for texture
            r, g, b = color
            r = max(0, min(255, r + rng.randint(-8, 8)))
            g = max(0, min(255, g + rng.randint(-8, 8)))
            b = max(0, min(255, b + rng.randint(-8, 8)))

            dot_size = rng.choice([1, 1, 2])
            draw.rectangle(
                [sx, sy, sx + dot_size - 1, sy + dot_size - 1],
                fill=(r, g, b),
            )

    # Gentle blur to soften any harsh pixel edges
    img = img.filter(ImageFilter.GaussianBlur(radius=0.5))

    return img


def main() -> None:
    script_dir = Path(__file__).resolve().parent
    project_root = script_dir.parent
    output_dir = project_root / "public" / "assets" / "tiles" / "terrain"
    output_dir.mkdir(parents=True, exist_ok=True)

    generated = 0
    seed_base = 42

    for inside_name, outside_name in TERRAIN_PAIRS:
        inside_color = FILL_COLORS[inside_name]
        outside_color = FILL_COLORS[outside_name]

        for dir_name in DIRECTIONS:
            # Naming: blend_{inside}_{outside}_{direction}.png
            # "inside" is the terrain this tile belongs to
            # "outside" is the neighbor terrain encroaching from that direction
            filename = f"blend_{inside_name}_{outside_name}_{dir_name}.png"
            filepath = output_dir / filename

            seed = seed_base + hash((inside_name, outside_name, dir_name)) % 10000
            tile = generate_blend_tile(inside_color, outside_color, dir_name, seed)
            tile.save(filepath, "PNG")
            generated += 1

        # Also generate the reverse direction (outside looking at inside)
        # e.g. water tile next to grass: blend_water_grass_{dir}.png
        for dir_name in DIRECTIONS:
            filename = f"blend_{outside_name}_{inside_name}_{dir_name}.png"
            filepath = output_dir / filename

            seed = seed_base + hash((outside_name, inside_name, dir_name)) % 10000
            tile = generate_blend_tile(outside_color, inside_color, dir_name, seed)
            tile.save(filepath, "PNG")
            generated += 1

    print(f"Generated {generated} blend tiles in {output_dir}")


if __name__ == "__main__":
    main()
