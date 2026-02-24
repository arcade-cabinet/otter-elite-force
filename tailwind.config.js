/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.js",
    "./index.html"
  ],
  theme: {
    extend: {
      colors: {
        // === VIETNAM-ERA PALETTE ===
        // Jungle & Environment
        'jungle-dark': '#0f1108',      // Deep jungle shadow
        'jungle-night': '#1a1f12',     // Night jungle
        'jungle-canopy': '#2d3d19',    // Dense foliage
        'jungle-moss': '#3d5016',      // Moss/lichen
        'jungle-fern': '#4a6b24',      // Fern green
        
        // River & Water
        'river-murk': '#2a3320',       // Murky river water
        'river-silt': '#4a5438',       // Copper-silt sediment
        'river-foam': '#8b9a7e',       // Water foam
        
        // Military Equipment
        'olive-drab': '#4a5225',       // M1967 OG-107 uniform
        'canvas-tan': '#c4b59d',       // Canvas/webbing
        'gunmetal': '#36454f',         // Weapon finish
        'brass-case': '#b5a642',       // Spent brass
        'cordite-gray': '#717568',     // Smoke/haze
        
        // URA Faction (Player)
        'ura-orange': '#ff8800',       // Signal orange (high vis)
        'ura-cream': '#f4e8d0',        // Patch backing
        'ura-blood': '#8b0000',        // Injury indicator
        
        // Scale-Guard Militia (Enemy)
        'scale-emerald': '#1a4d2e',    // Reptile camouflage
        'scale-venom': '#39ff14',      // Bioluminescence (danger)
        'scale-rust': '#a0522d',       // Industrial pollution
        
        // UI & Feedback
        'chalk-white': '#e8dcc4',      // Chalk/paper
        'typewriter-black': '#0d0d0d', // Typewriter ribbon
        'stencil-spray': '#3a3a3a',    // Stenciled text
        'warning-amber': '#ffbf00',    // Caution tape
        'haze-yellow': '#d4c4a8',      // Jungle haze/humidity
        
        // Fire & Explosions
        'muzzle-flash': '#ffdd44',     // Weapon discharge
        'tracer-red': '#ff3300',       // Tracer rounds
        'napalm-orange': '#ff6600',    // Incendiary
      },
      
      fontFamily: {
        // Military typewriter (reports, briefings)
        'typewriter': ['"Special Elite"', 'Courier New', 'monospace'],
        
        // Stencil letters (equipment markings)
        'stencil': ['"Rubik Mono One"', 'Impact', 'sans-serif'],
        
        // Retro pixel (HUD, stats)
        'pixel': ['"Press Start 2P"', 'monospace'],
        
        // Terminal/radar (technical readouts)
        'terminal': ['"VT323"', 'Consolas', 'monospace'],
      },
      
      fontSize: {
        // Hierarchical military text sizes
        'briefing': ['14px', { lineHeight: '1.6', letterSpacing: '0.02em' }],
        'report': ['12px', { lineHeight: '1.5', letterSpacing: '0.01em' }],
        'stencil-sm': ['16px', { lineHeight: '1', letterSpacing: '0.1em' }],
        'stencil-lg': ['32px', { lineHeight: '1', letterSpacing: '0.15em' }],
      },
      
      boxShadow: {
        'haze': '0 0 40px rgba(212, 196, 168, 0.3)',      // Humid air glow
        'chopper': '0 8px 32px rgba(0, 0, 0, 0.6)',       // Helicopter shadow
        'muzzle': '0 0 20px rgba(255, 221, 68, 0.8)',     // Muzzle flash
        'blood': '0 0 10px rgba(139, 0, 0, 0.5)',         // Blood splatter
      },
      
      backgroundImage: {
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
        'jungle-camo': 'repeating-linear-gradient(45deg, #2d3d19 0px, #2d3d19 10px, #1a1f12 10px, #1a1f12 20px)',
      },
      
      animation: {
        'chopper-wobble': 'chopper 4s ease-in-out infinite',
        'heat-wave': 'heatwave 8s ease-in-out infinite',
        'radio-static': 'static 0.1s steps(2) infinite',
      },
      
      keyframes: {
        chopper: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '25%': { transform: 'translateY(-3px) rotate(-0.5deg)' },
          '75%': { transform: 'translateY(3px) rotate(0.5deg)' },
        },
        heatwave: {
          '0%, 100%': { filter: 'blur(0px)' },
          '50%': { filter: 'blur(1px)' },
        },
        static: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.95' },
        },
      },
    },
  },
  plugins: [],
}
