import { vi } from "vitest";

/**
 * Setup Three.js, WebGL, and R3F global mocks
 */
export function setupThreeMocks() {
	// Mock WebGL context
	HTMLCanvasElement.prototype.getContext = vi
		.fn()
		.mockImplementation(
			(
				contextType: string,
			): RenderingContext | WebGLRenderingContext | WebGL2RenderingContext | null => {
				if (contextType === "webgl" || contextType === "webgl2") {
					return {
						canvas: document.createElement("canvas"),
						drawingBufferWidth: 800,
						drawingBufferHeight: 600,
						drawingBufferColorSpace: "srgb",
						getParameter: vi.fn(() => 4096),
						getExtension: vi.fn(() => ({})),
						createProgram: vi.fn(() => ({})),
						createShader: vi.fn(() => ({})),
						shaderSource: vi.fn(),
						compileShader: vi.fn(),
						getShaderParameter: vi.fn(() => true),
						attachShader: vi.fn(),
						linkProgram: vi.fn(),
						getProgramParameter: vi.fn(() => true),
						useProgram: vi.fn(),
						getUniformLocation: vi.fn(() => ({})),
						getAttribLocation: vi.fn(() => 0),
						uniform1f: vi.fn(),
						uniform1i: vi.fn(),
						uniform2f: vi.fn(),
						uniform3f: vi.fn(),
						uniform4f: vi.fn(),
						uniformMatrix3fv: vi.fn(),
						uniformMatrix4fv: vi.fn(),
						viewport: vi.fn(),
						clearColor: vi.fn(),
						clear: vi.fn(),
						enable: vi.fn(),
						disable: vi.fn(),
						blendFunc: vi.fn(),
						depthFunc: vi.fn(),
						cullFace: vi.fn(),
						createBuffer: vi.fn(() => ({})),
						bindBuffer: vi.fn(),
						bufferData: vi.fn(),
						createTexture: vi.fn(() => ({})),
						bindTexture: vi.fn(),
						texImage2D: vi.fn(),
						texParameteri: vi.fn(),
						activeTexture: vi.fn(),
						generateMipmap: vi.fn(),
						createFramebuffer: vi.fn(() => ({})),
						bindFramebuffer: vi.fn(),
						framebufferTexture2D: vi.fn(),
						createRenderbuffer: vi.fn(() => ({})),
						bindRenderbuffer: vi.fn(),
						renderbufferStorage: vi.fn(),
						framebufferRenderbuffer: vi.fn(),
						checkFramebufferStatus: vi.fn(() => 36053), // FRAMEBUFFER_COMPLETE
						deleteBuffer: vi.fn(),
						deleteTexture: vi.fn(),
						deleteFramebuffer: vi.fn(),
						deleteRenderbuffer: vi.fn(),
						deleteProgram: vi.fn(),
						deleteShader: vi.fn(),
						getContextAttributes: vi.fn(() => ({
							alpha: true,
							antialias: true,
							depth: true,
							stencil: false,
							powerPreference: "default",
						})),
						getShaderInfoLog: vi.fn(() => ""),
						getProgramInfoLog: vi.fn(() => ""),
						enableVertexAttribArray: vi.fn(),
						vertexAttribPointer: vi.fn(),
						drawArrays: vi.fn(),
						drawElements: vi.fn(),
						pixelStorei: vi.fn(),
						scissor: vi.fn(),
						colorMask: vi.fn(),
						depthMask: vi.fn(),
						stencilMask: vi.fn(),
						frontFace: vi.fn(),
						lineWidth: vi.fn(),
						polygonOffset: vi.fn(),
						blendEquation: vi.fn(),
						blendFuncSeparate: vi.fn(),
						blendEquationSeparate: vi.fn(),
						isContextLost: vi.fn(() => false),
					} as unknown as WebGLRenderingContext;
				}
				if (contextType === "2d") {
					return {
						fillRect: vi.fn(),
						clearRect: vi.fn(),
						getImageData: vi.fn(() => ({
							data: new Uint8ClampedArray(0),
						})),
						putImageData: vi.fn(),
						createImageData: vi.fn(() => ({
							data: new Uint8ClampedArray(0),
						})),
						setTransform: vi.fn(),
						drawImage: vi.fn(),
						save: vi.fn(),
						restore: vi.fn(),
						beginPath: vi.fn(),
						moveTo: vi.fn(),
						lineTo: vi.fn(),
						closePath: vi.fn(),
						stroke: vi.fn(),
						fill: vi.fn(),
						translate: vi.fn(),
						scale: vi.fn(),
						rotate: vi.fn(),
						arc: vi.fn(),
						fillText: vi.fn(),
						measureText: vi.fn(() => ({ width: 0 })),
						canvas: document.createElement("canvas"),
					} as unknown as CanvasRenderingContext2D;
				}
				return null;
			},
		);

	// Mock Three.js components
	vi.mock("three", async (importOriginal) => {
		const actual = await importOriginal<typeof import("three")>();
		return {
			...actual,
			WebGLRenderer: vi.fn().mockImplementation(() => ({
				setSize: vi.fn(),
				setPixelRatio: vi.fn(),
				render: vi.fn(),
				dispose: vi.fn(),
				domElement: document.createElement("canvas"),
				shadowMap: { enabled: false, type: 0 },
				outputColorSpace: "srgb",
				toneMapping: 0,
				toneMappingExposure: 1,
				info: { render: { calls: 0, triangles: 0 } },
			})),
		};
	});

	// Mock @react-three/fiber
	vi.mock("@react-three/fiber", async (importOriginal) => {
		const actual = await importOriginal<typeof import("@react-three/fiber")>();
		const React = await import("react");

		return {
			...actual,
			Canvas: ({ children: _children }: { children: React.ReactNode }) => {
				return React.createElement("div", { "data-testid": "r3f-canvas" });
			},
			useFrame: vi.fn(),
			useThree: vi.fn(() => ({
				camera: {
					position: { x: 0, y: 10, z: 20, set: vi.fn(), copy: vi.fn() },
					lookAt: vi.fn(),
					updateProjectionMatrix: vi.fn(),
				},
				scene: { add: vi.fn(), remove: vi.fn() },
				gl: { domElement: document.createElement("canvas") },
				size: { width: 800, height: 600 },
				viewport: { width: 800, height: 600 },
				clock: { getElapsedTime: () => 0 },
			})),
		};
	});

	// Mock @react-three/drei
	vi.mock("@react-three/drei", () => {
		return {
			Environment: () => null,
			Sky: () => null,
			OrbitControls: () => null,
			PerspectiveCamera: () => null,
			Text: () => null,
			Html: () => null,
			useTexture: vi.fn(() => null),
			useGLTF: vi.fn(() => ({ scene: {}, nodes: {}, materials: {} })),
			useProgress: vi.fn(() => ({ progress: 100, loaded: true })),
			Billboard: () => null,
			Float: () => null,
			Center: () => null,
			Sparkles: () => null,
			Stars: () => null,
			Cloud: () => null,
			Clouds: () => null,
		};
	});
}
