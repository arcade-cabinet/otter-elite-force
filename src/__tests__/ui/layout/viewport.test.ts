import { describe, expect, it } from "vitest";
import {
	classifyViewport,
	resolveBriefingShellLayout,
	resolveCommandShellLayout,
	resolveTacticalHudLayout,
} from "@/ui/layout/viewport";

describe("viewport layout contract", () => {
	it("classifies phone portrait viewports", () => {
		const profile = classifyViewport(390, 844);

		expect(profile.tier).toBe("phone");
		expect(profile.isPhone).toBe(true);
		expect(profile.isPortrait).toBe(true);
		expect(resolveCommandShellLayout(profile)).toBe("stacked");
		expect(resolveBriefingShellLayout(profile)).toBe("stacked");
		expect(resolveTacticalHudLayout(profile)).toBe("mobile");
	});

	it("classifies tablet landscape viewports", () => {
		const profile = classifyViewport(1180, 820);

		expect(profile.tier).toBe("tablet");
		expect(profile.isTablet).toBe(true);
		expect(profile.isLandscape).toBe(true);
		expect(resolveCommandShellLayout(profile)).toBe("split");
		expect(resolveBriefingShellLayout(profile)).toBe("stacked");
		expect(resolveTacticalHudLayout(profile)).toBe("tablet");
	});

	it("classifies desktop layouts as wide/split desktop HUD", () => {
		const profile = classifyViewport(1440, 900);

		expect(profile.tier).toBe("desktop");
		expect(profile.isDesktop).toBe(true);
		expect(resolveCommandShellLayout(profile)).toBe("wide");
		expect(resolveBriefingShellLayout(profile)).toBe("split");
		expect(resolveTacticalHudLayout(profile)).toBe("desktop");
	});
});
