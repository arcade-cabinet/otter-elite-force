import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BriefingShell, CommandPostShell, TacticalShell } from "@/ui/layout/shells";

describe("shell layout contracts", () => {
	it("renders explicit command-post and briefing layout data attributes", () => {
		const commandHtml = renderToStaticMarkup(
			<CommandPostShell title="Command" layout="wide">
				<div>content</div>
			</CommandPostShell>,
		);
		const briefingHtml = renderToStaticMarkup(
			<BriefingShell title="Briefing" layout="stacked">
				<div>content</div>
			</BriefingShell>,
		);

		expect(commandHtml).toContain('data-shell-layout="wide"');
		expect(briefingHtml).toContain('data-shell-layout="stacked"');
	});

	it("renders tactical hud regions with an explicit mobile layout", () => {
		const html = renderToStaticMarkup(
			<TacticalShell
				hudLayout="mobile"
				hudTop={<div>top</div>}
				alerts={<div>alerts</div>}
				leftDock={<div>left</div>}
				centerDock={<div>center</div>}
				rightDock={<div>right</div>}
			>
				<div>battlefield</div>
			</TacticalShell>,
		);

		expect(html).toContain('data-hud-layout="mobile"');
		expect(html).toContain('data-hud-region="hud-top"');
		expect(html).toContain('data-hud-region="alerts"');
		expect(html).toContain('data-hud-region="left-dock"');
		expect(html).toContain('data-hud-region="battlefield-well"');
		expect(html).toContain('data-hud-region="center-dock"');
		expect(html).toContain('data-hud-region="right-dock"');
	});
});
