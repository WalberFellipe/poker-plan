"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { ChipKind } from "@/types/room-state";

const REACTIONS: { kind: Exclude<ChipKind, "call">; labelKey: string; tone: string }[] = [
  { kind: "agree", labelKey: "agree", tone: "border-mg/30 text-mg-soft hover:bg-mg/10" },
  {
    kind: "explain",
    labelKey: "explain",
    tone: "border-mg/30 text-mg-soft hover:bg-mg/10",
  },
  { kind: "risk", labelKey: "risk", tone: "border-mg/30 text-mg-soft hover:bg-mg/10" },
];

interface ReactionsProps {
  onReact: (kind: Exclude<ChipKind, "call">) => void;
}

/**
 * As pílulas de reação são um componente à parte porque continuam disponíveis
 * *depois* da revelação: a ficha vale até o reset da rodada, e é justamente na
 * discussão do resultado que "explica melhor" e "tem risco" fazem sentido.
 */
export function Reactions({ onReact }: ReactionsProps) {
  const t = useTranslations("room");

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {REACTIONS.map((reaction) => (
        <button
          key={reaction.kind}
          type="button"
          onClick={() => onReact(reaction.kind)}
          className={cn(
            "rounded-chip border px-4 py-2 text-[15px] transition-colors",
            reaction.tone
          )}
        >
          {t(`reactions.${reaction.labelKey}`)}
        </button>
      ))}
    </div>
  );
}

interface HandProps {
  deckValues: string[];
  myVote: string | null;
  disabled: boolean;
  onSelect: (value: string) => void;
}

/**
 * Sua mão: as reações em pílula e a fileira de cartas do baralho ativo.
 *
 * As cartas são strings puras — "0", "½", "?", "☕" ou emoji funcionam igual,
 * porque o voto trafega como texto de ponta a ponta.
 */
export function Hand({ deckValues, myVote, disabled, onSelect }: HandProps) {
  const t = useTranslations("room");

  return (
    <div className="flex flex-col items-center gap-3.5">
      <div className="flex w-full items-center gap-3.5">
        <span className="pa-label whitespace-nowrap">{t("yourHand")}</span>
        <div
          aria-hidden
          className="h-px flex-1 bg-[linear-gradient(90deg,rgb(var(--pa-cy)/.35),transparent)]"
        />
      </div>

      {/* Centralizadas com a mesa: encurta o caminho do mouse entre olhar o
          resultado e escolher a carta. */}
      <div className="flex flex-wrap justify-center gap-2.5">
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
                  ? "-translate-y-2.5 border border-mg bg-[linear-gradient(180deg,rgb(var(--pa-mg)/.22),rgb(12_12_22/.95))] text-white shadow-[0_18px_40px_rgba(0,0,0,.6),0_0_18px_rgb(var(--pa-mg)/.25)]"
                  : "border border-pa-text/14 bg-pa-text/[.04] text-pa-muted shadow-[0_6px_18px_rgba(0,0,0,.4)] hover:-translate-y-1 hover:border-cy/45 hover:text-cy"
              )}
            >
              {value}
            </button>
          );
        })}
      </div>

      <p className="text-center text-[15px] text-pa-faint">
        {t("callHintLine")}
      </p>
    </div>
  );
}
