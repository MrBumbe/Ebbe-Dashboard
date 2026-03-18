interface EbbeLogoProps {
  size?: number
}

export default function EbbeLogo({ size = 32 }: EbbeLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Star */}
      <path
        d="M50,10 L57,32 L80,32 L62,46 L69,68 L50,54 L31,68 L38,46 L20,32 L43,32 Z"
        fill="#F5A623"
      />
      {/* Checkmark inside star */}
      <path
        d="M37,46 L48,58 L64,36"
        stroke="white"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Horizon line */}
      <line
        x1="20" y1="80"
        x2="80" y2="80"
        stroke="#F5A623"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* Arc — sits just below star, above horizon line */}
      <path
        d="M24,80 A28,22 0 0,1 76,80"
        stroke="#F5A623"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
