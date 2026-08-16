"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { ChipKind } from "@/types/room-state";

const REACTIONS: { kind: Exclude<ChipKind, "call">; labelKey: string; tone: string }[] = [
  { kind: "agree", labelKey: "agree", tone: "border-cy/40 text-cy hover:bg-cy/10" },
  {
    kind: "explain",
    labelKey: "explain",
    tone: "border-pa-text/20 text-pa-muted hover:text-pa-text hover:bg-pa-text/5",
  },
  { kind: "risk", labelKey: "risk", tone: "border-mg/45 text-mg-soft hover:bg-mg/10" },
];

interface HandProps {
  deckValues: string[];
  myVote: string | null;
  disabled: boolean;
  onSelect: (value: string) => void;
  onReact: (kind: Exclude<ChipKind, "call">) => void;
}

/**
 * Sua mão: as reações em pílula e a fileira de cartas do baralho ativo.
 *
 * As cartas são strings puras — "0", "½", "?", "☕" ou emoji funcionam igual,
 * porque o voto trafega como texto de ponta a ponta.
 */
export function Hand({
  deckValues,
  myVote,
  disabled,
  onSelect,
  onReact,
}: HandProps) {
  const t = useTranslations("room");

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center gap-3.5">
        <span className="pa-label whitespace-nowrap">{t("yourHand")}</span>
        <div
          aria-hidden
          className="h-px flex-1 bg-[linear-gradient(90deg,rgb(63_232_255/.35),transparent)]"
        />
        <div className="flex flex-wrap gap-2">
          {REACTIONS.map((reaction) => (
            <button
              key={reaction.kind}
              type="button"
              onClick={() => onReact(reaction.kind)}
              className={cn(
                "rounded-chip border px-3.5 py-1.5 text-[13px] transition-colors",
                reaction.tone
              )}
            >
              {t(`reactions.${reaction.labelKey}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5">
        {deckValues.map((value) => {
          const selected = myVote === value;

          return (
            <button
              key={value}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(value)}
              aria-pressed={selected}
              className={cn(
                "flex h-[88px] w-[62px] items-center justify-center rounded-lg",
                "font-display text-[20px] font-bold transition-all duration-200",
                "disabled:pointer-events-none disabled:opacity-45",
                selected
                  ? "-translate-y-2.5 border border-mg bg-[linear-gradient(180deg,rgb(255_47_160/.18),rgb(10_10_20/.9))] text-white shadow-[0_0_30px_rgb(255_47_160/.35)]"
                  : "border border-pa-text/12 bg-pa-text/[.03] text-pa-muted hover:-translate-y-1 hover:border-cy/45 hover:text-cy"
              )}
            >
              {value}
            </button>
          );
        })}
      </div>

      <p className="text-sm text-pa-faint">{t("callHintLine")}</p>
    </div>
  );
}
