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
import type { ReactNode } from "react";
import { Health } from "@/ecs/traits/combat";
import { Selected, UnitType } from "@/ecs/traits/identity";
import { PopulationState, ResourcePool } from "@/ecs/traits/state";
import { ALL_BUILDINGS } from "@/data/buildings";
import { ALL_HEROES, ALL_UNITS } from "@/data/units";
import { EventBus } from "@/game/EventBus";
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
				{children}
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Minimap placeholder
// ---------------------------------------------------------------------------

function MinimapSection() {
	return (
		<div className="w-1/3 md:w-full md:h-64 p-1 md:p-2 bg-black flex justify-center items-center border-r-2 md:border-r-0 md:border-b-4 border-slate-700">
			<div className="relative w-full h-full max-w-[200px] max-h-[200px] border-2 border-slate-600 bg-slate-900 flex items-center justify-center">
				<span className="text-[10px] uppercase tracking-widest text-slate-500">
					Minimap
				</span>
			</div>
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
				<h2 className="text-base md:text-xl font-bold text-sky-300 leading-tight">
					No Selection
				</h2>
				<p className="text-slate-400 text-xs md:text-sm">
					Click a unit or structure to inspect.
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
	const name =
		ALL_HEROES[type]?.name ?? ALL_UNITS[type]?.name ?? ALL_BUILDINGS[type]?.name ?? "Unknown";
	const hpPct = health ? Math.round((health.current / Math.max(health.max, 1)) * 100) : 0;

	return (
		<div className="w-1/3 md:w-full flex-1 p-2 md:p-4 border-r-2 md:border-r-0 md:border-b-4 border-slate-700 flex flex-col gap-1 md:gap-2 overflow-y-auto bg-slate-900">
			<h2 className="text-base md:text-xl font-bold text-sky-300 leading-tight">{name}</h2>
			{health && (
				<>
					<div className="w-full h-3 md:h-4 bg-red-900 border border-slate-900 mt-1">
						<div
							className="h-full bg-green-500 transition-all duration-200"
							style={{ width: `${hpPct}%` }}
						/>
					</div>
					<p className="text-slate-300 text-xs md:text-sm mt-1">
						HP: {health.current}/{health.max}
					</p>
				</>
			)}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Action Panel — command buttons with deselect
// ---------------------------------------------------------------------------

function ActionPanelSection() {
	const selected = useQuery(Selected);
	const hasSelection = selected.length > 0;

	return (
		<div className="w-1/3 md:w-full h-full md:h-64 p-1 md:p-3 grid grid-cols-1 sm:grid-cols-2 gap-1 md:gap-2 bg-slate-800 overflow-y-auto content-start">
			{hasSelection ? (
				<>
					<ActionButton label="Move" command="move" />
					<ActionButton label="Attack" command="attack" />
					<ActionButton label="Stop" command="stop" />
					<ActionButton label="Build" command="build" />
					<DeselectButton />
				</>
			) : (
				<div className="col-span-full flex items-center justify-center h-full">
					<span className="text-[10px] uppercase tracking-widest text-slate-500">
						Select units to issue orders
					</span>
				</div>
			)}
		</div>
	);
}

function ActionButton({ label, command }: { label: string; command: string }) {
	return (
		<button
			type="button"
			className="min-h-[44px] min-w-[44px] px-2 py-1 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 border border-slate-500 text-xs md:text-sm font-bold uppercase tracking-wider text-slate-200 transition-colors"
			onClick={() => EventBus.emit("ui-command", { command })}
		>
			{label}
		</button>
	);
}

function DeselectButton() {
	const world = useWorld();
	return (
		<button
			type="button"
			className="min-h-[44px] min-w-[44px] px-2 py-1 bg-red-900/60 hover:bg-red-800/70 active:bg-red-700/80 border border-red-700/50 text-xs md:text-sm font-bold uppercase tracking-wider text-red-300 transition-colors col-span-full"
			onClick={() => {
				world.query(Selected).forEach((e) => e.remove(Selected));
			}}
		>
			Deselect
		</button>
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
				<ResourceIcon color="bg-slate-300 border-slate-100 rounded-full" label="Clams" value={fish} />
				<ResourceIcon color="bg-amber-700 border-amber-500" label="Twigs" value={timber} />
				<ResourceIcon color="bg-red-600 border-red-400 rounded-sm" label="Food" value={salvage} />
			</div>
			<div className="flex items-center space-x-3 md:space-x-6">
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

