/**
 * OTTER: ELITE FORCE - Design Tokens
 * Vietnam-Era Tactical Aesthetic
 * 
 * "Full Metal Jacket" meets "Wind in the Willows"
 * Gritty realism. Analog technology. Humid jungle heat.
 */

export const DESIGN_TOKENS = {
	// === BRAND IDENTITY ===
	brand: {
		name: 'OTTER: ELITE FORCE',
		tagline: 'DEFEND THE COPPER-SILT REACH',
		motto: 'LIBERATE. OCCUPY. SURVIVE.',
		missionStatement: 'Tactical riverine warfare in hostile wetlands.',
	},

	// === IMMERSION GUIDELINES ===
	immersion: {
		atmosphere: {
			climate: 'Oppressive jungle humidity',
			soundscape: 'Distant chopper blades, river current, insect drone',
			visualHaze: 'Golden-hour heat shimmer through dense canopy',
			tension: 'Constant threat of ambush',
		},
		
		technology: {
			era: '1960s-1970s Vietnam War',
			aesthetic: 'Analog instrumentation, mechanical devices',
			materials: 'Canvas, metal, wood, rope',
			finish: 'Worn, weathered, battle-scarred',
		},
		
		mood: {
			player: 'Professional soldier, heightened awareness',
			environment: 'Beautiful but deadly wilderness',
			conflict: 'Asymmetric guerrilla warfare',
			stakes: 'Liberation vs. industrial exploitation',
		},
	},

	// === COLOR PSYCHOLOGY ===
	colorMeaning: {
		'jungle-dark': 'Shadow, concealment, safety in darkness',
		'jungle-canopy': 'Dense vegetation, natural camouflage',
		'river-murk': 'Tactical waterways, uncertainty',
		'olive-drab': 'Military professionalism, discipline',
		'ura-orange': 'High visibility, rescue, friendly forces',
		'scale-emerald': 'Enemy faction, reptilian threat',
		'scale-venom': 'Danger, toxicity, bioluminescence',
		'muzzle-flash': 'Combat, violence, firepower',
		'haze-yellow': 'Humid air, golden hour, nostalgia',
	},

	// === TYPOGRAPHY USAGE ===
	typography: {
		typewriter: {
			font: 'Special Elite',
			use: 'Mission briefings, character dialogue, reports',
			feeling: 'Official military documentation',
		},
		stencil: {
			font: 'Rubik Mono One',
			use: 'Equipment labels, UI titles, faction names',
			feeling: 'Spray-painted military stencils',
		},
		pixel: {
			font: 'Press Start 2P',
			use: 'HUD stats, kill counts, scores',
			feeling: 'Digital readouts, primitive computers',
		},
		terminal: {
			font: 'VT323',
			use: 'Radar, map coordinates, technical data',
			feeling: 'CRT terminal, green phosphor displays',
		},
	},

	// === UI PATTERNS ===
	ui: {
		buttons: {
			primary: 'Olive drab background, stencil text, canvas texture',
			danger: 'Warning amber border, typewriter font',
			disabled: 'Faded gray, scratched out appearance',
		},
		
		overlays: {
			menu: 'Semi-transparent jungle dark, noise texture',
			hud: 'Minimal, corners only, terminal font',
			dialogue: 'Typewriter on aged paper background',
		},
		
		feedback: {
			success: 'URA orange flash, brief',
			damage: 'Blood red vignette, screen shake',
			warning: 'Amber pulse, radio static sound',
			death: 'Desaturate, slow motion, fade to black',
		},
	},

	// === AUDIO AESTHETIC ===
	audio: {
		ambient: {
			jungle: 'Cicadas, distant birds, rustling leaves',
			river: 'Flowing water, occasional splash',
			weather: 'Rain on foliage, thunder rolls',
			distance: 'Helicopter rotors fading in/out',
		},
		
		weapons: {
			rifle: 'Sharp crack echoing through jungle',
			reload: 'Metallic click and magazine slap',
			empty: 'Hollow click of empty chamber',
			brass: 'Ejected shells hitting mud',
		},
		
		radio: {
			static: 'Constant low hiss',
			transmission: 'Compressed, filtered voice',
			squelch: 'Sharp burst when keying mic',
			morse: 'Beeps for important signals',
		},
	},

	// === VISUAL EFFECTS ===
	effects: {
		haze: {
			intensity: 'Medium-heavy atmospheric scattering',
			color: 'Warm golden yellow',
			animation: 'Slow undulation, heat waves',
		},
		
		lighting: {
			time: 'Golden hour (dawn/dusk)',
			quality: 'Dappled through canopy',
			shadows: 'Long and dramatic',
			fog: 'Low-lying mist over water',
		},
		
		postProcessing: {
			grain: 'Film grain texture overlay',
			vignette: 'Dark corners, focus center',
			colorGrade: 'Slightly desaturated, warm shadows',
			bloom: 'Subtle on bright sources only',
		},
	},

	// === INTERACTION FEEDBACK ===
	interaction: {
		hover: {
			visual: 'Subtle scale increase, shadow deepens',
			audio: 'Soft mechanical click',
			duration: '150ms',
		},
		
		press: {
			visual: 'Quick scale down, haptic feedback',
			audio: 'Typewriter key strike',
			duration: '100ms',
		},
		
		disabled: {
			visual: 'Grayed out, scratched texture',
			audio: 'Dull thud or no sound',
			cursor: 'Not-allowed',
		},
	},

	// === PERFORMANCE TARGETS ===
	performance: {
		fps: {
			target: 60,
			minimum: 30,
			mobile: 'Reduce effects below 45fps',
		},
		
		loadTime: {
			target: '3 seconds',
			maximum: '5 seconds',
			progressive: 'Show loading screen with tips',
		},
	},

	// === ACCESSIBILITY ===
	accessibility: {
		contrast: {
			text: 'Minimum 4.5:1 for body, 3:1 for large',
			ui: 'High contrast mode option',
		},
		
		motion: {
			reduce: 'Respect prefers-reduced-motion',
			toggle: 'Setting to disable screen shake',
		},
		
		audio: {
			captions: 'Subtitles for all dialogue',
			visual: 'Visual indicators for sound cues',
		},
	},
} as const;

// === DESIGN TOKEN TYPES ===
export type DesignTokens = typeof DESIGN_TOKENS;

// === HELPER FUNCTIONS ===
export const getColorByMood = (mood: 'tense' | 'calm' | 'danger' | 'victory') => {
	const moodColors = {
		tense: 'jungle-dark',
		calm: 'river-foam',
		danger: 'scale-venom',
		victory: 'ura-orange',
	};
	return moodColors[mood];
};

export const getFontByContext = (context: 'briefing' | 'stencil' | 'hud' | 'technical') => {
	const contextFonts = {
		briefing: 'font-typewriter',
		stencil: 'font-stencil',
		hud: 'font-pixel',
		technical: 'font-terminal',
	};
	return contextFonts[context];
};

// === EXPORT DEFAULT ===
export default DESIGN_TOKENS;
