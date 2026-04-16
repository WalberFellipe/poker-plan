import { useId } from "react";
import { cn } from "@/lib/utils";

export function HeroIllustration({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 800 640"
      role="img"
      aria-hidden
      className={cn("block h-auto w-full", className)}
    >
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ecf4ff" />
          <stop offset="100%" stopColor="#daeafa" />
        </linearGradient>
        <linearGradient id={`${uid}-card`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f3f7ff" />
        </linearGradient>
        <filter id={`${uid}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="18"
            stdDeviation="22"
            floodColor="#0e1d29"
            floodOpacity="0.18"
          />
        </filter>
      </defs>
      <rect width="800" height="640" rx="28" fill={`url(#${uid}-bg)`} />
      <g filter={`url(#${uid}-shadow)`}>
        <rect
          x="40"
          y="40"
          width="720"
          height="560"
          rx="24"
          fill={`url(#${uid}-card)`}
          stroke="#c7d9f2"
          strokeWidth={1}
        />
      </g>
      <g fill="#0e1d29" opacity={0.92}>
        <circle cx="220" cy="260" r="34" />
        <rect x="186" y="294" width="68" height="92" rx="18" />
        <circle cx="400" cy="240" r="38" />
        <rect x="362" y="278" width="76" height="108" rx="20" />
        <circle cx="580" cy="270" r="34" />
        <rect x="546" y="304" width="68" height="92" rx="18" />
      </g>
      <g fill="#ffffff" stroke="#94a3b8" strokeWidth={1.2}>
        <path d="M300 150c0-18 14-32 32-32h180c18 0 32 14 32 32v46c0 18-14 32-32 32H360l-28 30v-30c-18 0-32-14-32-32z" />
        <path d="M520 120c0-16 13-28 29-28h140c16 0 29 12 29 28v40c0 16-13 28-29 28H560l-22 24v-24c-16 0-29-12-29-28z" />
      </g>
      <g
        fill="#0e1d29"
        opacity={0.78}
        fontFamily="ui-sans-serif, system-ui, Segoe UI, Arial"
        fontSize={14}
      >
        <text x="320" y="188">
          …
        </text>
        <text x="560" y="158">
          ≈
        </text>
      </g>
      <circle cx="400" cy="420" r="10" fill="#3b82f6" opacity={0.18} />
      <circle cx="400" cy="420" r="4" fill="#2563eb" />
    </svg>
  );
}
