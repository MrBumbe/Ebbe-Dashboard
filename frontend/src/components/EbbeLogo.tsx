/**
 * EbbeLogo — concept G: 5-pointed star (with white checkmark) rising above
 * a semicircular arc and horizon line, all in Ebbe amber (#F5A623).
 *
 * Works at any size from 16 px (favicon) to 512 px (splash screen).
 * No background — looks good on both light and dark surfaces.
 *
 * Geometry (viewBox 0 0 64 64):
 *   Star   — center (32,26), outer radius 14, inner radius 5.6
 *   Arc    — center (32,50), radius 24; top lands exactly at star centre
 *   Line   — horizon at y=50
 *   Check  — white polyline inside the star
 */

interface EbbeLogoProps {
  size?: number;
  className?: string;
}

export default function EbbeLogo({ size = 32, className = '' }: EbbeLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Ebbe"
      fill="none"
      className={className}
    >
      {/*
        5-pointed star — alternating outer (R=14) and inner (r=5.6) vertices
        centred at (32, 26), starting at the top (-90°) and rotating CW.

        Outer vertices:
          P0  32,12       (top,        -90°)
          P1  45.31,21.67 (upper-right, -18°)
          P2  40.23,37.33 (lower-right,  54°)
          P3  23.77,37.33 (lower-left,  126°)
          P4  18.69,21.67 (upper-left,  198°)

        Inner vertices (offset +36°):
          Q0  35.29,21.47 (upper-right, -54°)
          Q1  37.33,27.73 (right,        18°)
          Q2  32,31.60    (bottom,        90°)
          Q3  26.67,27.73 (left,         162°)
          Q4  28.71,21.47 (upper-left,  234°)
      */}
      <polygon
        points="32,12 35.29,21.47 45.31,21.67 37.33,27.73 40.23,37.33 32,31.60 23.77,37.33 26.67,27.73 18.69,21.67 28.71,21.47"
        fill="#F5A623"
      />

      {/* White checkmark — starts lower-left, pivots at bottom, sweeps upper-right */}
      <polyline
        points="26.5,28 30,32.5 39,19.5"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/*
        Sunrise arc — semicircle centred at (32,50), radius 24.
        The arc top lands at exactly (32,26) = the star's centre,
        giving the "star rising from the horizon" visual.
      */}
      <path
        d="M 8,50 A 24,24 0 0 1 56,50"
        stroke="#F5A623"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Horizon line */}
      <line
        x1="4" y1="50" x2="60" y2="50"
        stroke="#F5A623"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
