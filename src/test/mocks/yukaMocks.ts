import { vi } from "vitest";

/**
 * Setup Yuka global mocks
 */
export function setupYukaMocks() {
	vi.mock("yuka", () => {
		class MockVector3 {
			x = 0;
			y = 0;
			z = 0;
			constructor(x = 0, y = 0, z = 0) {
				this.x = x;
				this.y = y;
				this.z = z;
			}
			set(x: number, y: number, z: number) {
				this.x = x;
				this.y = y;
				this.z = z;
				return this;
			}
			copy(v: MockVector3) {
				this.x = v.x;
				this.y = v.y;
				this.z = v.z;
				return this;
			}
			clone() {
				return new MockVector3(this.x, this.y, this.z);
			}
			add(v: MockVector3) {
				this.x += v.x;
				this.y += v.y;
				this.z += v.z;
				return this;
			}
			sub(v: MockVector3) {
				this.x -= v.x;
				this.y -= v.y;
				this.z -= v.z;
				return this;
			}
			multiplyScalar(s: number) {
				this.x *= s;
				this.y *= s;
				this.z *= s;
				return this;
			}
			length() {
				return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);
			}
			normalize() {
				const len = this.length();
				if (len > 0) this.multiplyScalar(1 / len);
				return this;
			}
			distanceTo(v: MockVector3) {
				return Math.sqrt((this.x - v.x) ** 2 + (this.y - v.y) ** 2 + (this.z - v.z) ** 2);
			}
			squaredDistanceTo(v: MockVector3) {
				return (this.x - v.x) ** 2 + (this.y - v.y) ** 2 + (this.z - v.z) ** 2;
			}
		}

		class MockQuaternion {
			x = 0;
			y = 0;
			z = 0;
			w = 1;
		}

		class MockGameEntity {
			uuid = crypto.randomUUID();
			position = new MockVector3();
			rotation = new MockQuaternion();
			velocity = new MockVector3();
			boundingRadius = 1;
			active = true;
			update = vi.fn();
		}

		class MockVehicle extends MockGameEntity {
			maxSpeed = 1;
			maxForce = 1;
			mass = 1;
			steering = {
				add: vi.fn(),
				remove: vi.fn(),
				clear: vi.fn(),
				behaviors: [],
			};
		}

		class MockSteeringBehavior {
			active = true;
			weight = 1;
		}

		class MockSeekBehavior extends MockSteeringBehavior {
			target = new MockVector3();
		}

		class MockFleeBehavior extends MockSteeringBehavior {
			target = new MockVector3();
			panicDistance = 10;
		}

		class MockWanderBehavior extends MockSteeringBehavior {
			radius = 1;
			distance = 1;
			jitter = 0.5;
		}

		class MockArriveBehavior extends MockSteeringBehavior {
			target = new MockVector3();
			deceleration = 3;
		}

		class MockPursuitBehavior extends MockSteeringBehavior {
			evader: MockVehicle | null = null;
		}

		class MockEvadeBehavior extends MockSteeringBehavior {
			pursuer: MockVehicle | null = null;
			panicDistance = 10;
		}

		class MockEntityManager {
			entities: MockGameEntity[] = [];
			add = vi.fn((entity: MockGameEntity) => {
				this.entities.push(entity);
				return this;
			});
			remove = vi.fn((entity: MockGameEntity) => {
				const idx = this.entities.indexOf(entity);
				if (idx > -1) this.entities.splice(idx, 1);
				return this;
			});
			update = vi.fn();
			clear = vi.fn(() => {
				this.entities = [];
				return this;
			});
		}

		class MockStateMachine {
			owner: MockGameEntity;
			currentState: { name: string } | null = null;
			globalState: { name: string } | null = null;
			states = new Map();
			constructor(owner: MockGameEntity) {
				this.owner = owner;
			}
			add = vi.fn((name: string, state: { name: string }) => {
				this.states.set(name, state);
				return this;
			});
			changeTo = vi.fn((name: string) => {
				this.currentState = this.states.get(name) || { name };
			});
			update = vi.fn();
			handleMessage = vi.fn(() => false);
		}

		class MockState {
			name = "MockState";
			enter = vi.fn();
			execute = vi.fn();
			exit = vi.fn();
			onMessage = vi.fn(() => false);
		}

		const MockTime = {
			delta: 0.016,
			elapsed: 0,
			update: vi.fn(),
		};

		return {
			Vector3: MockVector3,
			Quaternion: MockQuaternion,
			GameEntity: MockGameEntity,
			Vehicle: MockVehicle,
			SteeringBehavior: MockSteeringBehavior,
			SeekBehavior: MockSeekBehavior,
			FleeBehavior: MockFleeBehavior,
			WanderBehavior: MockWanderBehavior,
			ArriveBehavior: MockArriveBehavior,
			PursuitBehavior: MockPursuitBehavior,
			EvadeBehavior: MockEvadeBehavior,
			EntityManager: MockEntityManager,
			StateMachine: MockStateMachine,
			State: MockState,
			Time: MockTime,
		};
	});
}
