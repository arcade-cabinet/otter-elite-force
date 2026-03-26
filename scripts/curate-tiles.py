#!/usr/bin/env python3
"""
Tile Curation — visually verified tile mappings from Kenney packs.
Copies tiles into game-organized directories with 2x scale (16→32px).
"""

import json
import shutil
from pathlib import Path
from PIL import Image

SRC_MED = Path("/Volumes/home/assets/2DLowPoly/RTS Medieval (Pixel)/Tiles")
SRC_BAT = Path("/Volumes/home/assets/2DLowPoly/Tiny Battle/Tiles")
SRC_FOREST = Path("/Volumes/home/assets/2DLowPoly/Tilesets/lonesome-forest")
DST = Path("public/assets/tiles")

manifest = {}
S = 2  # 16px → 32px


def tile(src_dir, tile_id, category, name):
    src = src_dir / f"tile_{tile_id:04d}.png"
    dst_dir = DST / category
    dst_dir.mkdir(parents=True, exist_ok=True)
    dst = dst_dir / f"{name}.png"
    if not src.exists():
        print(f"  WARN: tile_{tile_id:04d}.png not found in {src_dir.name}")
        return
    img = Image.open(src).convert("RGBA")
    img = img.resize((img.width * S, img.height * S), Image.NEAREST)
    img.save(dst)
    manifest[name] = {"path": f"/assets/tiles/{category}/{name}.png", "category": category, "tile_id": tile_id}


def sheet(src_path, category, name):
    dst_dir = DST / category
    dst_dir.mkdir(parents=True, exist_ok=True)
    dst = dst_dir / f"{name}.png"
    shutil.copy2(src_path, dst)
    manifest[name] = {"path": f"/assets/tiles/{category}/{name}.png", "category": category}


def main():
    # Clean output
    for d in ["terrain", "buildings", "props", "resources", "ui"]:
        (DST / d).mkdir(parents=True, exist_ok=True)

    print("=== Curating tiles (visually verified) ===\n")

    # ────── TERRAIN (RTS Medieval) ──────
    print("Terrain...")

    # Base tiles (row 0 of tilemap: 23 cols)
    tile(SRC_MED, 0, "terrain", "ice_1")
    tile(SRC_MED, 1, "terrain", "ice_2")
    tile(SRC_MED, 2, "terrain", "ice_3")
    tile(SRC_MED, 3, "terrain", "sand_1")
    tile(SRC_MED, 4, "terrain", "sand_2")

    # Path/road pieces (brown dirt paths)
    for i, n in [(5, "path_corner_tl"), (6, "path_t_down"), (7, "path_t_right"),
                 (8, "path_turn_1"), (9, "path_turn_2"), (10, "path_h"),
                 (11, "path_corner_bl"), (12, "path_t_up"), (13, "path_t_left")]:
        tile(SRC_MED, i, "terrain", n)

    # Green grass + sand transitions
    tile(SRC_MED, 14, "terrain", "grass_sand_tl")
    tile(SRC_MED, 15, "terrain", "grass_sand_t")
    tile(SRC_MED, 16, "terrain", "grass_sand_tr")
    tile(SRC_MED, 17, "terrain", "grass_1")
    tile(SRC_MED, 18, "terrain", "grass_2")
    tile(SRC_MED, 19, "terrain", "grass_3")
    tile(SRC_MED, 20, "terrain", "grass_dark_1")
    tile(SRC_MED, 21, "terrain", "grass_dark_2")
    tile(SRC_MED, 22, "terrain", "grass_dark_3")

    # Row 1: more terrain transitions
    tile(SRC_MED, 23, "terrain", "dirt_1")
    tile(SRC_MED, 24, "terrain", "dirt_2")
    tile(SRC_MED, 25, "terrain", "dirt_3")
    tile(SRC_MED, 26, "terrain", "dirt_sand_1")
    tile(SRC_MED, 27, "terrain", "dirt_sand_2")
    for i, n in [(28, "path_v"), (29, "path_cross"), (30, "path_end_r"),
                 (31, "path_end_b"), (32, "path_end_l"), (33, "path_end_t"),
                 (34, "path_dot")]:
        tile(SRC_MED, i, "terrain", n)
    tile(SRC_MED, 35, "terrain", "grass_sand_bl")
    tile(SRC_MED, 36, "terrain", "grass_sand_b")
    tile(SRC_MED, 37, "terrain", "grass_sand_br")
    tile(SRC_MED, 38, "terrain", "grass_sand_l")
    tile(SRC_MED, 39, "terrain", "grass_sand_r")
    tile(SRC_MED, 40, "terrain", "sand_dark_1")
    tile(SRC_MED, 41, "terrain", "sand_dark_2")
    tile(SRC_MED, 42, "terrain", "sand_dark_3")
    tile(SRC_MED, 43, "terrain", "sand_edge_tl")
    tile(SRC_MED, 44, "terrain", "sand_edge_tr")
    tile(SRC_MED, 45, "terrain", "sand_edge_bl")

    # Row 2: water + more
    tile(SRC_MED, 46, "terrain", "water_light")
    tile(SRC_MED, 47, "terrain", "water_base")
    tile(SRC_MED, 48, "terrain", "water_dark")
    tile(SRC_MED, 49, "terrain", "water_edge_tl")
    tile(SRC_MED, 50, "terrain", "water_edge_t")
    tile(SRC_MED, 51, "terrain", "water_edge_tr")
    for i, n in [(52, "dirt_path_1"), (53, "dirt_path_2"), (54, "dirt_path_3")]:
        tile(SRC_MED, i, "terrain", n)
    tile(SRC_MED, 55, "terrain", "grass_water_tl")
    tile(SRC_MED, 56, "terrain", "grass_water_t")
    tile(SRC_MED, 57, "terrain", "grass_water_tr")
    tile(SRC_MED, 58, "terrain", "water_edge_l")
    tile(SRC_MED, 59, "terrain", "water_center")
    tile(SRC_MED, 60, "terrain", "water_edge_r")
    tile(SRC_MED, 61, "terrain", "sand_edge_br")
    tile(SRC_MED, 62, "terrain", "grass_water_l")
    tile(SRC_MED, 63, "terrain", "grass_water_r")
    tile(SRC_MED, 64, "terrain", "water_edge_bl")
    tile(SRC_MED, 65, "terrain", "water_edge_b")
    tile(SRC_MED, 66, "terrain", "water_edge_br")
    tile(SRC_MED, 67, "terrain", "grass_water_bl")
    tile(SRC_MED, 68, "terrain", "grass_water_br")

    # ────── PROPS (trees, rocks, decoration) ──────
    print("Props...")

    # Trees (single-tile)
    tile(SRC_MED, 69, "props", "tree_pine_sm")
    tile(SRC_MED, 70, "props", "tree_pine_lg")
    tile(SRC_MED, 71, "props", "tree_round_sm")
    tile(SRC_MED, 72, "props", "tree_round_lg")

    # Tree clusters (2-wide or dense)
    tile(SRC_MED, 73, "props", "tree_cluster_1")
    tile(SRC_MED, 74, "props", "tree_tall_1")
    tile(SRC_MED, 75, "props", "tree_tall_2")
    tile(SRC_MED, 76, "props", "tree_pine_tall")

    # Stump, grave, pillar
    tile(SRC_MED, 77, "props", "stump")
    tile(SRC_MED, 78, "props", "gravestone")
    tile(SRC_MED, 79, "props", "pillar")

    # Mushrooms, items
    tile(SRC_MED, 80, "props", "mushroom")
    tile(SRC_MED, 81, "props", "chest")
    tile(SRC_MED, 82, "props", "potion")

    # Dense forest tiles
    tile(SRC_MED, 92, "props", "forest_sparse")
    tile(SRC_MED, 93, "props", "forest_dense_1")
    tile(SRC_MED, 94, "props", "forest_dense_2")
    tile(SRC_MED, 95, "props", "forest_full")

    # Rocks
    tile(SRC_MED, 96, "props", "rock_gray_1")
    tile(SRC_MED, 97, "props", "rock_gray_2")
    tile(SRC_MED, 98, "props", "rock_gray_lg")
    tile(SRC_MED, 99, "props", "rock_cluster")
    tile(SRC_MED, 100, "props", "rock_crystal_1")
    tile(SRC_MED, 101, "props", "rock_crystal_2")
    tile(SRC_MED, 102, "props", "bush_green")

    # Mushroom clusters
    tile(SRC_MED, 124, "props", "mushroom_cluster_1")
    tile(SRC_MED, 125, "props", "mushroom_cluster_2")
    tile(SRC_MED, 126, "props", "mushroom_cluster_3")

    # Campfire
    tile(SRC_MED, 181, "props", "campfire_1")
    tile(SRC_MED, 206, "props", "campfire_2")

    # ────── BUILDINGS (OEF — green/teal) ──────
    print("OEF Buildings...")

    tile(SRC_MED, 143, "buildings", "command_post")    # green tent/HQ
    tile(SRC_MED, 168, "buildings", "barracks")         # teal military building
    tile(SRC_MED, 147, "buildings", "armory")            # house with window
    tile(SRC_MED, 146, "buildings", "watchtower")        # castle tower (stone)
    tile(SRC_MED, 144, "buildings", "fish_trap")         # house with oven → re-skin as fish trap
    tile(SRC_MED, 145, "buildings", "burrow")            # house → small shelter
    tile(SRC_MED, 165, "buildings", "dock")              # orange-roof house → dock building
    tile(SRC_MED, 166, "buildings", "field_hospital")    # teal building
    tile(SRC_MED, 193, "buildings", "sandbag_wall")      # fence/wall segment
    tile(SRC_MED, 175, "buildings", "stone_wall")        # stone wall piece
    tile(SRC_MED, 164, "buildings", "gun_tower")         # stone castle piece
    tile(SRC_MED, 169, "buildings", "minefield")         # market/tent → repurpose

    # ────── BUILDINGS (Scale-Guard — orange/red from Tiny Battle) ──────
    print("Scale-Guard Buildings...")

    # Tiny Battle tiles (let me check those separately)
    # For now use RTS Medieval orange/red variants
    tile(SRC_MED, 173, "buildings", "flag_post")         # orange wall piece
    tile(SRC_MED, 171, "buildings", "fuel_tank")         # market stall
    tile(SRC_MED, 185, "buildings", "great_siphon")      # castle wall piece → large structure
    tile(SRC_MED, 186, "buildings", "sludge_pit")        # castle continuation
    tile(SRC_MED, 190, "buildings", "spawning_pool")     # small shop building
    tile(SRC_MED, 191, "buildings", "venom_spire")       # stone building
    tile(SRC_MED, 188, "buildings", "siphon")            # town building
    tile(SRC_MED, 196, "buildings", "scale_wall")        # fence section
    tile(SRC_MED, 189, "buildings", "shield_generator")  # building variant

    # ────── RESOURCES ──────
    print("Resources...")

    tile(SRC_MED, 81, "resources", "salvage_cache")      # chest
    tile(SRC_MED, 82, "resources", "supply_crate")       # potion bottle → remap
    tile(SRC_MED, 80, "resources", "intel_marker")       # mushroom → sign marker
    # fish_spot and mangrove_tree keep procedural (they're nature features)

    # ────── FLOOR TILES (for building interiors/placement zones) ──────
    print("Floors...")

    tile(SRC_MED, 138, "terrain", "floor_wood_1")
    tile(SRC_MED, 139, "terrain", "floor_wood_2")
    tile(SRC_MED, 140, "terrain", "floor_wood_dark")
    tile(SRC_MED, 141, "terrain", "floor_stone")
    tile(SRC_MED, 142, "terrain", "floor_checker")

    # ────── UI INDICATORS ──────
    print("UI...")

    tile(SRC_MED, 176, "ui", "arrow_down_red")
    tile(SRC_MED, 177, "ui", "arrow_up_red")
    tile(SRC_MED, 178, "ui", "arrow_right_red_1")
    tile(SRC_MED, 179, "ui", "arrow_right_red_2")
    tile(SRC_MED, 180, "ui", "arrow_left_red")
    tile(SRC_MED, 203, "ui", "arrow_up_orange")
    tile(SRC_MED, 204, "ui", "arrow_right_orange")

    # ────── LONESOME FOREST SHEETS (props overlay) ──────
    print("Forest detail sheets...")

    for name in ["Lonesome_Forest_DETAIL_OBJECTS", "Lonesome_Forest_RIVER_and_WATER_EDGES"]:
        src = SRC_FOREST / "Summer Tileset" / f"{name}.png"
        if src.exists():
            sheet(src, "props", name.lower())

    trees = SRC_FOREST / "Trees-Expanded_TEMPERATE.png"
    if trees.exists():
        sheet(trees, "props", "forest_trees_sheet")

    # ────── SAVE MANIFEST ──────
    manifest_path = DST / "tile-manifest.json"
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)

    cats = {}
    for v in manifest.values():
        cats[v["category"]] = cats.get(v["category"], 0) + 1
    print(f"\n=== Summary ===")
    for c, n in sorted(cats.items()):
        print(f"  {c}: {n}")
    print(f"  Total: {len(manifest)}")


if __name__ == "__main__":
    main()
