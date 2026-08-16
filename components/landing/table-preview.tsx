"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * Miniatura da mesa usada no hero.
 *
 * É estática de propósito: é uma vitrine do produto, não uma sala de verdade.
 * A geometria dos assentos é a mesma da mesa real (elipse com ângulo
 * `90° + i·360°/n`) para que o preview não minta sobre o que a pessoa vai ver.
 */

const SEATS = [
  { name: "Você", vote: "5", mine: true },
  { name: "Ana", vote: "8" },
  { name: "Rui", vote: "5" },
  { name: "Kim", vote: "3" },
  { name: "Léo", vote: "5" },
];

const CHIPS = [
  { label: "OK", tone: "cy", x: 44, y: 46, rot: -12 },
  { label: "?", tone: "neutral", x: 54, y: 52, rot: 9 },
  { label: "CALL", tone: "mg", x: 49, y: 41, rot: -4 },
] as const;

const HAND = ["1", "2", "3", "5", "8", "13"];

const CHIP_TONES = {
  cy: "bg-[radial-gradient(circle_at_35%_30%,#9fdde6,rgb(var(--pa-cy)))] border-white/60 text-cy-ink shadow-[0_0_16px_rgb(var(--pa-cy)/.35)]",
  neutral:
    "bg-[radial-gradient(circle_at_35%_30%,#f4f3fa,#b9b8cc)] border-[rgb(7_7_13/.35)] text-[#12121c] shadow-[0_0_16px_rgb(236_235_245/.3)]",
  mg: "bg-[radial-gradient(circle_at_35%_30%,#f2adcd,#ab3d6f)] border-white/75 text-white shadow-[0_0_16px_rgb(var(--pa-mg)/.45)]",
} as const;

function seatPosition(index: number, total: number) {
  const angle = ((90 + (index * 360) / total) * Math.PI) / 180;
  return {
    x: 50 + 40 * Math.cos(angle),
    y: 50 + 37 * Math.sin(angle),
    cardX: 50 + 25 * Math.cos(angle),
    cardY: 50 + 23 * Math.sin(angle),
  };
}

export function TablePreview() {
  const t = useTranslations("landing");

  return (
    <div
      aria-hidden
      className={cn(
        "relative animate-float overflow-hidden rounded-lg border border-cy/[.18]",
        "bg-[linear-gradient(180deg,#0d0e18,#0a0a12)]",
        "shadow-[0_40px_90px_rgba(0,0,0,.6)]"
      )}
    >
      <div className="flex items-center justify-between border-b border-pa-text/[.07] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cy shadow-[0_0_6px_rgb(var(--pa-cy)/.7)]" />
          <span className="pa-kicker">{t("livePreview")}</span>
        </div>
        <span className="pa-numeric text-[13px] text-cy">01:12</span>
      </div>

      <div className="p-5">
        <div className="relative h-[230px] rounded-[160px/120px] border border-cy/20 bg-[radial-gradient(130%_140%_at_50%_42%,rgb(var(--pa-cy)/.12),rgb(10_10_18/0)_60%),linear-gradient(180deg,#0b0c16,#08090f)] shadow-[inset_0_0_50px_rgb(var(--pa-cy)/.05)]">
          <div className="absolute inset-[14px] rounded-[150px/110px] border border-dashed border-pa-text/[.07]" />

          {SEATS.map((seat, index) => {
            const position = seatPosition(index, SEATS.length);

            return (
              <div key={seat.name}>
                <div
                  className={cn(
                    "absolute flex h-[38px] w-[27px] -translate-x-1/2 -translate-y-1/2 items-center justify-center",
                    "rounded-[3px] font-display text-[11px] font-bold",
                    seat.mine
                      ? "border border-mg bg-[linear-gradient(180deg,rgb(var(--pa-mg)/.18),rgb(10_10_20/.9))] text-white"
                      : "border border-cy bg-[linear-gradient(180deg,rgb(var(--pa-cy)/.14),rgb(10_10_20/.92))] text-pa-text"
                  )}
                  style={{ left: `${position.cardX}%`, top: `${position.cardY}%` }}
                >
                  {seat.vote}
                </div>

                <div
                  className={cn(
                    "absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 whitespace-nowrap",
                    "rounded-chip px-2 py-1 text-[11px] backdrop-blur-[6px]",
                    seat.mine
                      ? "border border-mg/50 bg-mg/12 text-pa-text"
                      : "border border-pa-text/12 bg-[rgb(12_13_22/.9)] text-pa-text"
                  )}
                  style={{ left: `${position.x}%`, top: `${position.y}%` }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-cy shadow-[0_0_6px_rgb(var(--pa-cy)/.7)]" />
                  {seat.name}
                </div>
              </div>
            );
          })}

          {CHIPS.map((chip) => (
            <div
              key={chip.label}
              className={cn(
                "absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center",
                "rounded-full border-[3px] border-dashed font-display text-[9px] font-bold",
                CHIP_TONES[chip.tone]
              )}
              style={{
                left: `${chip.x}%`,
                top: `${chip.y}%`,
                transform: `translate(-50%,-50%) rotate(${chip.rot}deg)`,
              }}
            >
              {chip.label}
            </div>
          ))}
        </div>

        <div className="mt-5 flex justify-center gap-1.5">
          {HAND.map((value) => (
            <div
              key={value}
              className={cn(
                "flex h-[52px] w-[36px] items-center justify-center rounded-[3px]",
                "font-display text-[14px] font-bold transition-transform",
                value === "5"
                  ? "-translate-y-2 border border-mg bg-[linear-gradient(180deg,rgb(var(--pa-mg)/.18),rgb(10_10_20/.9))] text-white shadow-[0_0_16px_rgb(var(--pa-mg)/.25)]"
                  : "border border-pa-text/12 bg-pa-text/[.03] text-pa-dim"
              )}
            >
              {value}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
