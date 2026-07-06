import React from 'react';

interface RinkLinesProps {
  className?: string;
}

// Dekorativ, stiliserad hockeyrink sedd uppifrån — används som subtilt
// bakgrundsmönster för att ge sektionerna en omisskännlig hockeykänsla.
// Ritas med currentColor-oberoende färger i låg opacitet ovanpå mörk bakgrund.
export default function RinkLines({ className = '' }: RinkLinesProps) {
  return (
    <svg
      className={`pointer-events-none select-none ${className}`}
      viewBox="0 0 1200 520"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      {/* Sargen */}
      <rect x="30" y="30" width="1140" height="460" rx="120" stroke="rgba(148,199,255,0.35)" strokeWidth="3" />

      {/* Mittlinje (röd) */}
      <line x1="600" y1="30" x2="600" y2="490" stroke="rgba(248,113,113,0.4)" strokeWidth="5" />

      {/* Blålinjer */}
      <line x1="420" y1="30" x2="420" y2="490" stroke="rgba(96,165,250,0.4)" strokeWidth="8" />
      <line x1="780" y1="30" x2="780" y2="490" stroke="rgba(96,165,250,0.4)" strokeWidth="8" />

      {/* Mittcirkel */}
      <circle cx="600" cy="260" r="80" stroke="rgba(96,165,250,0.35)" strokeWidth="3" />
      <circle cx="600" cy="260" r="6" fill="rgba(96,165,250,0.5)" />

      {/* Tekningscirklar */}
      {[
        [200, 140], [200, 380], [1000, 140], [1000, 380],
      ].map(([cx, cy]) => (
        <g key={`${cx}-${cy}`}>
          <circle cx={cx} cy={cy} r="60" stroke="rgba(248,113,113,0.3)" strokeWidth="3" />
          <circle cx={cx} cy={cy} r="5" fill="rgba(248,113,113,0.4)" />
        </g>
      ))}

      {/* Målområden */}
      <path d="M 30 200 A 70 70 0 0 1 30 320" stroke="rgba(248,113,113,0.3)" strokeWidth="3" transform="translate(40 0)" />
      <path d="M 1170 320 A 70 70 0 0 1 1170 200" stroke="rgba(248,113,113,0.3)" strokeWidth="3" transform="translate(-40 0)" />
      <line x1="70" y1="30" x2="70" y2="490" stroke="rgba(248,113,113,0.25)" strokeWidth="3" />
      <line x1="1130" y1="30" x2="1130" y2="490" stroke="rgba(248,113,113,0.25)" strokeWidth="3" />
    </svg>
  );
}
