interface EbbeLogoProps {
  size?: number
}

export default function EbbeLogo({ size = 32 }: EbbeLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 110 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Horizon line */}
      <line
        x1="11" y1="55"
        x2="99" y2="55"
        stroke="#F5A623"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      {/* Semicircle — exact half circle, radius 44, meets horizon at 90 degrees */}
      <path
        d="M11,55 A44,44 0 0,1 99,55"
        stroke="#F5A623"
        strokeWidth="5.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Star — top point touches top of semicircle at y=11 */}
      <path
        d="M55,11 L63,37 L89,37 L69,51 L75,79 L55,66 L35,79 L41,51 L21,37 L47,37 Z"
        fill="#F5A623"
      />
      {/* Checkmark inside star */}
      <path
        d="M44,53 L54,67 L70,44"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
