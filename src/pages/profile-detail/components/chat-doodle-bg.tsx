export function ChatDoodleBg() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="wa-doodles"
          x="0"
          y="0"
          width="300"
          height="300"
          patternUnits="userSpaceOnUse"
        >
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.07"
          >
            {/* phone */}
            <rect x="20" y="15" width="16" height="26" rx="3" />
            <line x1="26" y1="36" x2="30" y2="36" />

            {/* chat bubble */}
            <path d="M70 20h30a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4H80l-6 6v-6h-4a4 4 0 0 1-4-4V24a4 4 0 0 1 4-4z" />
            <line x1="76" y1="28" x2="94" y2="28" />
            <line x1="76" y1="34" x2="88" y2="34" />

            {/* clock */}
            <circle cx="155" cy="30" r="14" />
            <polyline points="155,20 155,30 163,34" />

            {/* camera */}
            <rect x="210" y="22" width="28" height="20" rx="3" />
            <circle cx="224" cy="32" r="6" />
            <rect x="218" y="18" width="12" height="6" rx="1" />

            {/* heart */}
            <path d="M28 80c0-5 4-9 9-9s9 4 9 9c0 5-4 9-9 9s-9-4-9-9z" />
            <path d="M37 80c0-5 4-9 9-9s9 4 9 9c0 5-4 9-9 9s-9-4-9-9z" />
            <path d="M28 80l18 16 18-16" />

            {/* music note */}
            <circle cx="85" cy="95" r="5" />
            <line x1="90" y1="95" x2="90" y2="70" />
            <path d="M90 70c4 0 10 2 10 6" />

            {/* star */}
            <polygon points="150,68 154,80 167,80 157,88 160,100 150,92 140,100 143,88 133,80 146,80" />

            {/* envelope */}
            <rect x="205" y="72" width="28" height="20" rx="2" />
            <polyline points="205,72 219,86 233,72" />

            {/* smiley */}
            <circle cx="30" cy="160" r="14" />
            <circle cx="25" cy="156" r="1.5" fill="currentColor" />
            <circle cx="35" cy="156" r="1.5" fill="currentColor" />
            <path d="M23 164c3 4 11 4 14 0" />

            {/* globe */}
            <circle cx="90" cy="160" r="14" />
            <ellipse cx="90" cy="160" rx="7" ry="14" />
            <line x1="76" y1="160" x2="104" y2="160" />

            {/* thumbs up */}
            <path d="M145 148v22h6v-22z" />
            <path d="M151 156h10c2 0 4 2 3 4l-2 8c0 1-1 2-3 2h-8" />

            {/* lock */}
            <rect x="210" y="155" width="16" height="14" rx="2" />
            <path d="M213 155v-5a5 5 0 0 1 10 0v5" />
            <circle cx="218" cy="163" r="2" fill="currentColor" />

            {/* wifi */}
            <path d="M25 225c8-8 22-8 30 0" />
            <path d="M30 230c5-5 15-5 20 0" />
            <path d="M35 235c3-3 8-3 10 0" />
            <circle cx="40" cy="238" r="1.5" fill="currentColor" />

            {/* photo/image */}
            <rect x="75" y="220" width="28" height="22" rx="2" />
            <circle cx="83" cy="228" r="3" />
            <polyline points="78,242 88,232 95,238 100,234 103,238" />

            {/* paper plane */}
            <path d="M150 222l20-4-8 12z" />
            <line x1="150" y1="222" x2="162" y2="230" />
            <line x1="155" y1="234" x2="162" y2="230" />

            {/* headphones */}
            <path d="M210 240v-10a14 14 0 0 1 28 0v10" />
            <rect x="207" y="236" width="7" height="12" rx="2" />
            <rect x="234" y="236" width="7" height="12" rx="2" />

            {/* document */}
            <rect x="260" y="15" width="20" height="26" rx="2" />
            <line x1="264" y1="23" x2="276" y2="23" />
            <line x1="264" y1="28" x2="276" y2="28" />
            <line x1="264" y1="33" x2="272" y2="33" />

            {/* pin / location */}
            <path d="M270 90a8 8 0 1 0 0-1l-8 15 8-14z" />
            <circle cx="270" cy="82" r="3" />

            {/* video camera */}
            <rect x="250" y="150" width="22" height="16" rx="2" />
            <polygon points="272,153 284,148 284,168 272,163" />

            {/* pencil */}
            <line x1="255" y1="240" x2="275" y2="220" />
            <line x1="260" y1="245" x2="280" y2="225" />
            <line x1="255" y1="240" x2="260" y2="245" />
            <line x1="275" y1="220" x2="280" y2="225" />
            <line x1="252" y1="248" x2="255" y2="240" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#wa-doodles)" />
    </svg>
  );
}
