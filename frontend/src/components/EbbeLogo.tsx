/**
 * EbbeLogo — concept G (v2): large dominant star with white checkmark,
 * rising above a tall arc and horizon line, all in Ebbe amber (#F5A623).
 *
 * Works at any size from 16 px (favicon) to 512 px (splash screen).
 * No background — looks good on both light and dark surfaces.
 *
 * Geometry (viewBox 0 0 100 100):
 *   Star   — large 5-pointed path, centered at (50,47), dominant element
 *   Arc    — A32,32 semicircle; taller than wide, rises clearly above centre
 *   Line   — horizon at y=72
 *   Check  — white path inside the star
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
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Ebbe"
      fill="none"
      className={className}
    >
      {/* Horizon line */}
      <line
        x1="18" y1="72" x2="82" y2="72"
        stroke="#F5A623" strokeWidth="6" strokeLinecap="round"
      />

      {/* Arc — taller than wide, rises clearly above centre */}
      <path
        d="M22,72 A32,32 0 0,1 78,72"
        stroke="#F5A623" strokeWidth="6" strokeLinecap="round"
      />

      {/* Star — large, centered, dominant */}
      <path
        d="M50,18 L57,40 L82,40 L62,54 L69,76 L50,62 L31,76 L38,54 L18,40 L43,40 Z"
        fill="#F5A623"
      />

      {/* Checkmark inside star */}
      <path
        d="M38,54 L48,66 L65,42"
        stroke="white" strokeWidth="6"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}
