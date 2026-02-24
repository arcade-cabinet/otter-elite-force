/**
 * SVG Military Decorations & Flourishes
 * Vietnam-Era Tactical Aesthetic
 */

export const SVG_DECORATIONS = {
	// === URA FACTION INSIGNIA ===
	uraInsignia: `
		<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
			<!-- Shield base -->
			<path d="M50 5 L85 25 L85 60 Q85 80 50 95 Q15 80 15 60 L15 25 Z" 
				fill="#3d2b1f" stroke="#ff8800" stroke-width="2"/>
			
			<!-- Otter silhouette -->
			<ellipse cx="50" cy="45" rx="15" ry="8" fill="#ff8800"/>
			<circle cx="45" cy="42" r="2" fill="#0d0d0d"/>
			<circle cx="55" cy="42" r="2" fill="#0d0d0d"/>
			<path d="M35 48 Q50 55 65 48" stroke="#ff8800" stroke-width="2" fill="none"/>
			
			<!-- Stars -->
			<path d="M50 20 L52 26 L58 26 L53 30 L55 36 L50 32 L45 36 L47 30 L42 26 L48 26 Z" fill="#ffbf00"/>
			
			<!-- Banner -->
			<path d="M20 75 L80 75 L80 85 L50 80 L20 85 Z" fill="#c4b59d"/>
			<text x="50" y="82" font-family="monospace" font-size="6" text-anchor="middle" fill="#0d0d0d">ELITE FORCE</text>
		</svg>
	`,

	// === TACTICAL CROSSHAIR ===
	crosshair: `
		<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
			<!-- Outer circle -->
			<circle cx="50" cy="50" r="45" fill="none" stroke="#ff8800" stroke-width="1" opacity="0.6"/>
			<circle cx="50" cy="50" r="35" fill="none" stroke="#ff8800" stroke-width="1" opacity="0.4"/>
			
			<!-- Cross lines -->
			<line x1="50" y1="5" x2="50" y2="30" stroke="#ff8800" stroke-width="2"/>
			<line x1="50" y1="70" x2="50" y2="95" stroke="#ff8800" stroke-width="2"/>
			<line x1="5" y1="50" x2="30" y2="50" stroke="#ff8800" stroke-width="2"/>
			<line x1="70" y1="50" x2="95" y2="50" stroke="#ff8800" stroke-width="2"/>
			
			<!-- Center dot -->
			<circle cx="50" cy="50" r="3" fill="#ff8800"/>
			
			<!-- Range markers -->
			<circle cx="50" cy="50" r="15" fill="none" stroke="#ffbf00" stroke-width="0.5" stroke-dasharray="2,2"/>
		</svg>
	`,

	// === HELICOPTER SILHOUETTE ===
	helicopter: `
		<svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
			<!-- Rotor blades -->
			<rect x="30" y="25" width="140" height="3" fill="#36454f" opacity="0.3"/>
			
			<!-- Fuselage -->
			<ellipse cx="100" cy="50" rx="35" ry="12" fill="#36454f"/>
			<rect x="65" y="45" width="70" height="10" fill="#36454f"/>
			
			<!-- Cockpit -->
			<ellipse cx="120" cy="48" rx="15" ry="8" fill="#717568"/>
			
			<!-- Tail -->
			<rect x="135" y="48" width="40" height="4" fill="#36454f"/>
			<rect x="170" y="35" width="3" height="15" fill="#36454f"/>
			
			<!-- Skids -->
			<rect x="70" y="60" width="60" height="2" fill="#36454f"/>
			<rect x="72" y="58" width="2" height="5" fill="#36454f"/>
			<rect x="126" y="58" width="2" height="5" fill="#36454f"/>
		</svg>
	`,

	// === COMPASS ROSE ===
	compassRose: `
		<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
			<!-- Outer circle -->
			<circle cx="50" cy="50" r="48" fill="none" stroke="#c4b59d" stroke-width="1"/>
			
			<!-- Cardinal points -->
			<path d="M50 5 L55 20 L50 15 L45 20 Z" fill="#ff8800"/>
			<text x="50" y="10" font-family="monospace" font-size="8" text-anchor="middle" fill="#c4b59d">N</text>
			
			<path d="M95 50 L80 55 L85 50 L80 45 Z" fill="#c4b59d"/>
			<text x="90" y="53" font-family="monospace" font-size="6" text-anchor="middle" fill="#c4b59d">E</text>
			
			<path d="M50 95 L45 80 L50 85 L55 80 Z" fill="#c4b59d"/>
			<text x="50" y="95" font-family="monospace" font-size="6" text-anchor="middle" fill="#c4b59d">S</text>
			
			<path d="M5 50 L20 45 L15 50 L20 55 Z" fill="#c4b59d"/>
			<text x="10" y="53" font-family="monospace" font-size="6" text-anchor="middle" fill="#c4b59d">W</text>
			
			<!-- Center star -->
			<circle cx="50" cy="50" r="5" fill="#ff8800"/>
		</svg>
	`,

	// === RANK CHEVRON ===
	chevron: `
		<svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg">
			<!-- Three chevrons stacked -->
			<path d="M10 30 L30 10 L50 30" fill="none" stroke="#ffbf00" stroke-width="3"/>
			<path d="M10 25 L30 5 L50 25" fill="none" stroke="#ffbf00" stroke-width="3"/>
			<path d="M10 20 L30 0 L50 20" fill="none" stroke="#ffbf00" stroke-width="3"/>
		</svg>
	`,

	// === BARBED WIRE BORDER ===
	barbedWire: `
		<svg viewBox="0 0 200 20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
			<!-- Wire lines -->
			<line x1="0" y1="10" x2="200" y2="10" stroke="#717568" stroke-width="1"/>
			
			<!-- Barbs -->
			${Array.from({ length: 10 }, (_, i) => {
				const x = i * 20 + 10;
				return `
					<line x1="${x - 3}" y1="7" x2="${x}" y2="10" stroke="#717568" stroke-width="0.5"/>
					<line x1="${x + 3}" y1="7" x2="${x}" y2="10" stroke="#717568" stroke-width="0.5"/>
					<line x1="${x - 3}" y1="13" x2="${x}" y2="10" stroke="#717568" stroke-width="0.5"/>
					<line x1="${x + 3}" y1="13" x2="${x}" y2="10" stroke="#717568" stroke-width="0.5"/>
				`;
			}).join('')}
		</svg>
	`,

	// === RADIO WAVES ===
	radioWaves: `
		<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
			<!-- Concentric arcs -->
			<path d="M30 50 Q40 30 50 30 Q60 30 70 50" fill="none" stroke="#39ff14" stroke-width="1" opacity="0.6"/>
			<path d="M20 50 Q35 20 50 20 Q65 20 80 50" fill="none" stroke="#39ff14" stroke-width="1" opacity="0.4"/>
			<path d="M10 50 Q30 10 50 10 Q70 10 90 50" fill="none" stroke="#39ff14" stroke-width="1" opacity="0.2"/>
			
			<!-- Transmitter -->
			<circle cx="50" cy="50" r="5" fill="#39ff14"/>
			<rect x="48" y="55" width="4" height="15" fill="#36454f"/>
		</svg>
	`,

	// === DOG TAG ===
	dogTag: `
		<svg viewBox="0 0 60 80" xmlns="http://www.w3.org/2000/svg">
			<!-- Tag shape -->
			<rect x="10" y="15" width="40" height="55" rx="3" fill="#717568" stroke="#36454f" stroke-width="1"/>
			<circle cx="30" cy="10" r="5" fill="none" stroke="#36454f" stroke-width="2"/>
			
			<!-- Embossed text -->
			<text x="30" y="30" font-family="monospace" font-size="6" text-anchor="middle" fill="#0d0d0d">URA</text>
			<text x="30" y="40" font-family="monospace" font-size="5" text-anchor="middle" fill="#0d0d0d">ELITE FORCE</text>
			<text x="30" y="50" font-family="monospace" font-size="4" text-anchor="middle" fill="#0d0d0d">O POS</text>
			<text x="30" y="58" font-family="monospace" font-size="4" text-anchor="middle" fill="#0d0d0d">NO PREF</text>
		</svg>
	`,

	// === TACTICAL MAP GRID ===
	mapGrid: `
		<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
			<!-- Grid lines -->
			${Array.from({ length: 9 }, (_, i) => {
				const pos = (i + 1) * 20;
				return `
					<line x1="0" y1="${pos}" x2="200" y2="${pos}" stroke="#3d5016" stroke-width="0.5" opacity="0.3"/>
					<line x1="${pos}" y1="0" x2="${pos}" y2="200" stroke="#3d5016" stroke-width="0.5" opacity="0.3"/>
				`;
			}).join('')}
			
			<!-- Border -->
			<rect x="1" y="1" width="198" height="198" fill="none" stroke="#c4b59d" stroke-width="2"/>
			
			<!-- Coordinates -->
			<text x="10" y="15" font-family="monospace" font-size="8" fill="#c4b59d">A1</text>
		</svg>
	`,

	// === BULLET HOLE ===
	bulletHole: `
		<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
			<!-- Impact crater -->
			<circle cx="25" cy="25" r="20" fill="#0d0d0d" opacity="0.6"/>
			<circle cx="25" cy="25" r="15" fill="#0d0d0d" opacity="0.4"/>
			<circle cx="25" cy="25" r="8" fill="#0d0d0d"/>
			
			<!-- Cracks -->
			<line x1="25" y1="25" x2="5" y2="5" stroke="#0d0d0d" stroke-width="1" opacity="0.5"/>
			<line x1="25" y1="25" x2="45" y2="10" stroke="#0d0d0d" stroke-width="1" opacity="0.5"/>
			<line x1="25" y1="25" x2="40" y2="40" stroke="#0d0d0d" stroke-width="1" opacity="0.5"/>
		</svg>
	`,

	// === STENCILED STAR ===
	stencilStar: `
		<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
			<!-- Five-pointed star -->
			<path d="M50 10 L61 40 L92 40 L67 58 L78 88 L50 70 L22 88 L33 58 L8 40 L39 40 Z" 
				fill="#c4b59d" stroke="#3a3a3a" stroke-width="2"/>
		</svg>
	`,
};

// === SVG COMPONENT HELPERS ===
export const SVGDecoration = ({ 
	type, 
	className = '', 
	style = {} 
}: { 
	type: keyof typeof SVG_DECORATIONS; 
	className?: string; 
	style?: React.CSSProperties;
}) => {
	return (
		<div 
			className={className}
			style={style}
			dangerouslySetInnerHTML={{ __html: SVG_DECORATIONS[type] }}
		/>
	);
};

export default SVG_DECORATIONS;
