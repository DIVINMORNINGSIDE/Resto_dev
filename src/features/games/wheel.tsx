"use client";

import { useState, useTransition } from "react";
import { Spinner } from "@/components/ui/spinner";
import { Notice, primaryButton } from "@/features/student/ui";
import { spinWheel } from "./actions";
import type { WheelPlay } from "./queries";

const COLORS = ["#fde6cf", "#cde6f7", "#f6c6e2", "#e3f49a"];
const SIZE = 280;
const R = SIZE / 2;

// Angle (en degrés, sens horaire depuis le haut) du milieu d'un segment.
function centerOf(segment: number, count: number): number {
  return (segment + 0.5) * (360 / count);
}

function slicePath(i: number, count: number): string {
  const a0 = ((i * 360) / count - 90) * (Math.PI / 180);
  const a1 = (((i + 1) * 360) / count - 90) * (Math.PI / 180);
  const x0 = R + R * Math.cos(a0);
  const y0 = R + R * Math.sin(a0);
  const x1 = R + R * Math.cos(a1);
  const y1 = R + R * Math.sin(a1);
  return `M${R},${R} L${x0},${y0} A${R},${R} 0 0 1 ${x1},${y1} Z`;
}

// Roue de la chance : le tirage est fait par le serveur, la roue tourne
// ensuite jusqu'au segment gagné.
export function Wheel({ segments, play }: { segments: number[]; play: WheelPlay | null }) {
  const count = segments.length;
  const [rotation, setRotation] = useState(play ? -centerOf(play.segment, count) : 0);
  const [result, setResult] = useState<WheelPlay | null>(play);
  const [spinning, setSpinning] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const done = Boolean(result) && !spinning;

  function launch() {
    setError(undefined);
    startTransition(async () => {
      const r = await spinWheel();
      if (r.error || r.segment === undefined) {
        setError(r.error);
        return;
      }
      const won = { segment: r.segment, points: r.points ?? 0 };
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      // Cinq tours complets, puis arrêt au milieu du segment tiré.
      setRotation(360 * 5 - centerOf(won.segment, count));
      setResult(won);
      setSpinning(!reduced);
    });
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          width={SIZE}
          height={SIZE}
          role="img"
          aria-label={`Roue de la chance : ${segments.map((p) => (p ? `${p} point${p > 1 ? "s" : ""}` : "perdu")).join(", ")}`}
          className="drop-shadow-2xl transition-transform duration-[4000ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
          style={{ transform: `rotate(${rotation}deg)` }}
          onTransitionEnd={() => setSpinning(false)}
        >
          {segments.map((points, i) => {
            const mid = ((centerOf(i, count) - 90) * Math.PI) / 180;
            return (
              <g key={i}>
                <path d={slicePath(i, count)} fill={points >= 5 ? "#f6cf1f" : COLORS[i % COLORS.length]} stroke="#17110f" strokeWidth={2} />
                <text
                  x={R + R * 0.66 * Math.cos(mid)}
                  y={R + R * 0.66 * Math.sin(mid)}
                  fill="#17110f"
                  fontSize={points ? 26 : 16}
                  fontFamily="var(--font-display)"
                  textAnchor="middle"
                  dominantBaseline="central"
                  transform={`rotate(${centerOf(i, count)} ${R + R * 0.66 * Math.cos(mid)} ${R + R * 0.66 * Math.sin(mid)})`}
                >
                  {points ? `+${points}` : "RATÉ"}
                </text>
              </g>
            );
          })}
          <circle cx={R} cy={R} r={18} fill="#17110f" stroke="#f6cf1f" strokeWidth={3} />
        </svg>
        {/* Repère fixe en haut de la roue */}
        <svg viewBox="0 0 24 24" className="absolute -top-3 left-1/2 size-8 -translate-x-1/2 drop-shadow" aria-hidden="true">
          <path d="M12 22 3 4h18z" fill="#f6cf1f" stroke="#17110f" strokeWidth={2} />
        </svg>
      </div>

      <div aria-live="polite" className="min-h-12 text-center">
        {done && result ? (
          <p role="status" className={`text-lg font-semibold ${result.points > 0 ? "text-accent" : "text-cream/80"}`}>
            {result.points > 0
              ? `Gagné : +${result.points} point${result.points > 1 ? "s" : ""} !`
              : "Pas de chance cette fois. Reviens demain !"}
          </p>
        ) : null}
      </div>

      {!result ? (
        <button type="button" onClick={launch} disabled={pending} className={primaryButton}>
          {pending ? <Spinner label="Tirage en cours" /> : null}
          {pending ? "Tirage…" : "Lancer la roue"}
        </button>
      ) : null}
      <Notice message={error} />
    </div>
  );
}
