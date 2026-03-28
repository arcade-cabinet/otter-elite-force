/**
 * Quick governor playtest script — run all 16 missions and report results.
 * Usage: npx tsx scripts/run-governor-all.ts
 */

import { CAMPAIGN } from "../src/entities/missions/index.ts";
import { runGovernorPlaytest } from "../src/engine/playtester/runner.ts";

const MAX_TICKS = 30000;

console.log("Running governor playtest for all 16 missions...\n");

const results: Array<{
	id: string;
	name: string;
	outcome: string;
	ticks: number;
	objectives: string;
	army: number;
	trained: number;
	buildings: number;
	fish: number;
	timber: number;
	salvage: number;
	actions: number;
}> = [];

for (const mission of CAMPAIGN) {
	try {
		const report = runGovernorPlaytest(mission.id, { difficulty: "beginner" }, MAX_TICKS);
		const r = {
			id: mission.id,
			name: mission.name,
			outcome: report.outcome,
			ticks: report.durationTicks,
			objectives: `${report.objectivesCompleted}/${report.objectivesTotal}`,
			army: report.peakArmySize,
			trained: report.unitsTrainedCount,
			buildings: report.buildingsBuiltCount,
			fish: report.resourcesGathered.fish,
			timber: report.resourcesGathered.timber,
			salvage: report.resourcesGathered.salvage,
			actions: report.timeline.length,
		};
		results.push(r);
		console.log(
			`  ${r.id} (${r.name}): ${r.outcome} @ ${r.ticks} ticks | obj=${r.objectives} army=${r.army} trained=${r.trained} buildings=${r.buildings} fish=${r.fish} timber=${r.timber} salvage=${r.salvage} actions=${r.actions}`,
		);
	} catch (err) {
		console.error(`  ${mission.id} (${mission.name}): CRASH - ${err instanceof Error ? err.message : err}`);
		results.push({
			id: mission.id,
			name: mission.name,
			outcome: "crash",
			ticks: 0,
			objectives: "0/0",
			army: 0,
			trained: 0,
			buildings: 0,
			fish: 0,
			timber: 0,
			salvage: 0,
			actions: 0,
		});
	}
}

console.log("\n=== SUMMARY ===");
console.log("Mission | Outcome | Objectives | Peak Army | Trained | Buildings | Resources");
console.log("--------|---------|------------|-----------|---------|-----------|----------");
for (const r of results) {
	console.log(
		`${r.id} ${r.name.padEnd(20)} | ${r.outcome.padEnd(7)} | ${r.objectives.padEnd(10)} | ${String(r.army).padStart(9)} | ${String(r.trained).padStart(7)} | ${String(r.buildings).padStart(9)} | F:${r.fish} T:${r.timber} S:${r.salvage}`,
	);
}

const victories = results.filter((r) => r.outcome === "victory").length;
const defeats = results.filter((r) => r.outcome === "defeat").length;
const timeouts = results.filter((r) => r.outcome === "timeout").length;
const crashes = results.filter((r) => r.outcome === "crash").length;
console.log(`\nVictories: ${victories}, Defeats: ${defeats}, Timeouts: ${timeouts}, Crashes: ${crashes}`);
