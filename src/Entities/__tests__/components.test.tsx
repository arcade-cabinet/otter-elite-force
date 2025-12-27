/**
 * Entity Component Rendering Tests
 *
 * Tests that components can be rendered without throwing errors.
 * Uses mocks for React Three Fiber to avoid WebGL context requirements.
 */

import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import * as THREE from "three";

// Mock React Three Fiber completely
vi.mock("@react-three/fiber", () => ({
	Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="canvas">{children}</div>,
	useFrame: vi.fn(),
	useThree: vi.fn(() => ({
		camera: new THREE.PerspectiveCamera(),
		scene: new THREE.Scene(),
		gl: { domElement: document.createElement("canvas") },
		size: { width: 800, height: 600 },
	})),
	extend: vi.fn(),
}));

// Mock drei
vi.mock("@react-three/drei", () => ({
	useGLTF: vi.fn(() => ({ scene: new THREE.Group() })),
	Environment: () => null,
	Sky: () => null,
	Html: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	Text: () => null,
	Billboard: ({ children }: { children: React.ReactNode }) => <group>{children}</group>,
	useTexture: vi.fn(() => new THREE.Texture()),
}));

describe("Entity Components Rendering", () => {
	describe("BaseBuilding components", () => {
		it("should render BaseFloor without error", async () => {
			const { BaseFloor } = await import("../BaseBuilding");
			expect(() => {
				render(
					<group>
						<BaseFloor position={[0, 0, 0]} />
					</group>,
				);
			}).not.toThrow();
		});

		it("should render BaseWall without error", async () => {
			const { BaseWall } = await import("../BaseBuilding");
			expect(() => {
				render(
					<group>
						<BaseWall position={[0, 0, 0]} />
					</group>,
				);
			}).not.toThrow();
		});

		it("should render BaseRoof without error", async () => {
			const { BaseRoof } = await import("../BaseBuilding");
			expect(() => {
				render(
					<group>
						<BaseRoof position={[0, 0, 0]} />
					</group>,
				);
			}).not.toThrow();
		});

		it("should render BaseStilt without error", async () => {
			const { BaseStilt } = await import("../BaseBuilding");
			expect(() => {
				render(
					<group>
						<BaseStilt position={[0, 0, 0]} />
					</group>,
				);
			}).not.toThrow();
		});
	});

	describe("SimpleHut component", () => {
		it("should render without error", async () => {
			const { SimpleHut } = await import("../SimpleHut");
			expect(() => {
				render(
					<group>
						<SimpleHut position={[0, 0, 0]} />
					</group>,
				);
			}).not.toThrow();
		});
	});

	describe("Healer component", () => {
		it("should render without error", async () => {
			const { Healer } = await import("../Healer");
			expect(() => {
				render(
					<group>
						<Healer position={new THREE.Vector3(0, 0, 0)} />
					</group>,
				);
			}).not.toThrow();
		});
	});

	describe("PrisonCage component", () => {
		it("should render without error", async () => {
			const { PrisonCage } = await import("../PrisonCage");
			expect(() => {
				render(
					<group>
						<PrisonCage position={new THREE.Vector3(0, 0, 0)} />
					</group>,
				);
			}).not.toThrow();
		});
	});
});

describe("Environment Components Rendering", () => {
	// Note: BurntTrees, Debris, FloatingDrums, Lilypads, Mangroves, Reeds
	// use instancedMesh.setMatrixAt which requires WebGL context

	it("should render Platform without error", async () => {
		const { Platform } = await import("../Environment/Platform");
		expect(() => {
			render(
				<group>
					<Platform position={new THREE.Vector3(0, 0, 0)} />
				</group>,
			);
		}).not.toThrow();
	});

	it("should render MudPit without error", async () => {
		const { MudPit } = await import("../Environment/MudPit");
		expect(() => {
			render(
				<group>
					<MudPit position={new THREE.Vector3(0, 0, 0)} />
				</group>,
			);
		}).not.toThrow();
	});

	it("should render ToxicSludge without error", async () => {
		const { ToxicSludge } = await import("../Environment/ToxicSludge");
		expect(() => {
			render(
				<group>
					<ToxicSludge position={new THREE.Vector3(0, 0, 0)} />
				</group>,
			);
		}).not.toThrow();
	});

	it("should render OilSlick without error", async () => {
		const { OilSlick } = await import("../Environment/OilSlick");
		expect(() => {
			render(
				<group>
					<OilSlick position={new THREE.Vector3(0, 0, 0)} />
				</group>,
			);
		}).not.toThrow();
	});
});

describe("Objective Components Rendering", () => {
	it("should render Clam without error", async () => {
		const { Clam } = await import("../Objectives/Clam");
		expect(() => {
			render(
				<group>
					<Clam position={new THREE.Vector3(0, 0, 0)} />
				</group>,
			);
		}).not.toThrow();
	});

	it("should render Clam when carried", async () => {
		const { Clam } = await import("../Objectives/Clam");
		expect(() => {
			render(
				<group>
					<Clam position={new THREE.Vector3(0, 0, 0)} isCarried={true} />
				</group>,
			);
		}).not.toThrow();
	});

	it("should render ExtractionPoint from Clam module", async () => {
		const { ExtractionPoint } = await import("../Objectives/Clam");
		expect(() => {
			render(
				<group>
					<ExtractionPoint position={new THREE.Vector3(0, 0, 0)} />
				</group>,
			);
		}).not.toThrow();
	});

	it("should render Siphon without error", async () => {
		const { Siphon } = await import("../Objectives/Siphon");
		expect(() => {
			render(
				<group>
					<Siphon position={new THREE.Vector3(0, 0, 0)} />
				</group>,
			);
		}).not.toThrow();
	});

	it("should render Siphon when secured", async () => {
		const { Siphon } = await import("../Objectives/Siphon");
		expect(() => {
			render(
				<group>
					<Siphon position={new THREE.Vector3(0, 0, 0)} secured={true} />
				</group>,
			);
		}).not.toThrow();
	});
});

describe("Villager Component", () => {
	it("should render Villager without error", async () => {
		const { Villager } = await import("../Villager");
		expect(() => {
			render(
				<group>
					<Villager position={new THREE.Vector3(0, 0, 0)} />
				</group>,
			);
		}).not.toThrow();
	});

	it("should render Hut without error", async () => {
		const { Hut } = await import("../Villager");
		expect(() => {
			render(
				<group>
					<Hut position={new THREE.Vector3(0, 0, 0)} />
				</group>,
			);
		}).not.toThrow();
	});
});

describe("Weapon Component", () => {
	it("should render Weapon without error", async () => {
		const { Weapon } = await import("../Weapon");
		const muzzleRef = { current: new THREE.Group() };
		expect(() => {
			render(
				<group>
					<Weapon weaponId="service-pistol" muzzleRef={muzzleRef} />
				</group>,
			);
		}).not.toThrow();
	});

	it("should render Weapon when firing", async () => {
		const { Weapon } = await import("../Weapon");
		const muzzleRef = { current: new THREE.Group() };
		expect(() => {
			render(
				<group>
					<Weapon weaponId="scatter-shell" muzzleRef={muzzleRef} isFiring={true} />
				</group>,
			);
		}).not.toThrow();
	});
});

describe("ExtractionPoint Component", () => {
	it("should render ExtractionPoint without error", async () => {
		const { ExtractionPoint } = await import("../ExtractionPoint");
		expect(() => {
			render(
				<group>
					<ExtractionPoint position={new THREE.Vector3(0, 0, 0)} isActive={true} />
				</group>,
			);
		}).not.toThrow();
	});

	it("should render ExtractionPoint when inactive", async () => {
		const { ExtractionPoint } = await import("../ExtractionPoint");
		expect(() => {
			render(
				<group>
					<ExtractionPoint position={new THREE.Vector3(0, 0, 0)} isActive={false} />
				</group>,
			);
		}).not.toThrow();
	});
});

describe("ModularHut Component", () => {
	it("should render ModularHut without error", async () => {
		const { ModularHut } = await import("../ModularHut");
		expect(() => {
			render(
				<group>
					<ModularHut position={new THREE.Vector3(0, 0, 0)} seed={123} />
				</group>,
			);
		}).not.toThrow();
	});

	it("should render ModularHut as healer hut", async () => {
		const { ModularHut } = await import("../ModularHut");
		expect(() => {
			render(
				<group>
					<ModularHut position={new THREE.Vector3(0, 0, 0)} seed={456} isHealerHut={true} />
				</group>,
			);
		}).not.toThrow();
	});
});
