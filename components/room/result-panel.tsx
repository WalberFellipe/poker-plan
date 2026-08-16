"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Kicker, Meter, Stat } from "@/components/ui/neon";
import {
  commonUnit,
  computeAverage,
  computeConsensus,
  computeDistribution,
  computeMedian,
  consensusBand,
} from "@/lib/vote-stats";
import { cn } from "@/lib/utils";

/**
 * O resultado vem em duas peças.
 *
 * `ResultSummary` é o que decide a rodada — média, mediana, consenso e o botão
 * de aceitar. `ResultDistribution` é a leitura de apoio. As duas moram na
 * coluna à esquerda da mesa, que existe durante a rodada inteira: antes da
 * revelação ela é ocupada por `RoundProgress`, então a mesa nunca muda de
 * tamanho no momento em que as cartas viram.
 */

function useStats(votes: string[]) {
  return useMemo(() => {
    const average = computeAverage(votes);
    const median = computeMedian(votes);
    const consensus = computeConsensus(votes);

    return {
      average,
      median,
      consensus,
      band: consensusBand(consensus),
      distribution: computeDistribution(votes),
      unit: commonUnit(votes),
    };
  }, [votes]);
}

function useNumberFormat(unit: string) {
  const locale = useLocale();

  // Vírgula em PT, ponto em EN, e a unidade do baralho quando houver uma só.
  return (value: number | null) =>
    value === null
      ? "—"
      : new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(
          value
        ) + unit;
}

interface ResultSummaryProps {
  votes: string[];
  onAccept: (points: string) => void;
  isBusy: boolean;
  /** Provedor conectado para o botão "Enviar para X"; null esconde o botão. */
  pushProvider?: { id: string; name: string } | null;
  onPush?: (points: string) => void;
}

export function ResultSummary({
  votes,
  onAccept,
  isBusy,
  pushProvider,
  onPush,
}: ResultSummaryProps) {
  const t = useTranslations("room");
  const stats = useStats(votes);
  const format = useNumberFormat(stats.unit);

  const points = stats.median !== null ? format(stats.median) : votes[0] ?? "?";

  const dispersionKey = {
    strong: "dispersionStrong",
    ok: "dispersionOk",
    weak: "dispersionWeak",
  }[stats.band];

  return (
    <div className="flex animate-rise flex-col gap-4">
      <Kicker>{t("result.kicker")}</Kicker>

      <div className="flex flex-wrap items-end gap-9">
        <Stat
          value={format(stats.average)}
          label={t("result.average")}
          size={32}
        />
        <Stat
          value={format(stats.median)}
          label={t("result.median")}
          size={32}
        />
        <Stat
          value={`${stats.consensus}%`}
          label={t("result.consensus")}
          tone="mg"
          size={32}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Meter value={stats.consensus} tone="mg" />
        <p className="text-[16px] leading-snug text-pa-muted">
          {t(dispersionKey)}
        </p>
      </div>

      <div className="flex flex-wrap gap-2.5">
        <Button onClick={() => onAccept(points)} loading={isBusy}>
          {t("result.accept", { points })}
        </Button>
        {pushProvider && onPush ? (
          <Button
            variant="secondary"
            onClick={() => onPush(points)}
            disabled={isBusy}
          >
            {t("result.pushTo", { provider: pushProvider.name })}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * O que ocupa a coluna da rodada *antes* da revelação.
 *
 * Existe para a coluna estar sempre lá: se ela só aparecesse no resultado, a
 * mesa mudaria de tamanho no meio da revelação. E o espaço não fica ocioso —
 * durante a votação ele mostra quem já jogou, que é a informação que o time
 * fica procurando para saber se pode revelar.
 */
export function RoundProgress({
  total,
  voted,
}: {
  total: number;
  voted: number;
}) {
  const t = useTranslations("room");
  const pending = Math.max(0, total - voted);

  return (
    <div className="flex flex-col gap-4">
      <Kicker>{t("roundKicker")}</Kicker>

      <div className="flex flex-wrap items-end gap-9">
        <Stat value={voted} label={t("votedCount")} tone="cy" size={32} />
        <Stat value={pending} label={t("pendingCount")} size={32} />
      </div>

      <div className="flex flex-col gap-2">
        <Meter value={total === 0 ? 0 : (voted / total) * 100} />
        <p className="text-[16px] leading-snug text-pa-muted">
          {pending === 0 && total > 0 ? t("allVoted") : t("waitingVotes")}
        </p>
      </div>
    </div>
  );
}

export function ResultDistribution({ votes }: { votes: string[] }) {
  const t = useTranslations("room");
  const stats = useStats(votes);
  const maxCount = Math.max(1, ...stats.distribution.map((d) => d.count));

  return (
    <div className="flex animate-rise flex-col gap-3">
      <div className="flex w-full items-center gap-3.5">
        <span className="pa-label whitespace-nowrap">
          {t("result.distribution")}
        </span>
        <div
          aria-hidden
          className="h-px flex-1 bg-[linear-gradient(90deg,rgb(var(--pa-cy)/.35),transparent)]"
        />
      </div>

      {stats.distribution.length === 0 ? (
        <p className="text-[16px] text-pa-faint">{t("result.noNumericVotes")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {stats.distribution.map((entry) => (
            <li key={entry.value} className="flex items-center gap-3.5">
              <span className="pa-numeric w-12 shrink-0 text-[16px] font-bold text-pa-text">
                {entry.value}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-pa-text/[.06]">
                <div
                  className={cn(
                    "h-full rounded-full bg-[linear-gradient(90deg,rgb(var(--pa-cy)),rgb(var(--pa-cy)/.25))]",
                    "transition-[width] duration-500"
                  )}
                  style={{ width: `${(entry.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="pa-numeric w-6 shrink-0 text-right text-[15px] text-pa-dim">
                {entry.count}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
