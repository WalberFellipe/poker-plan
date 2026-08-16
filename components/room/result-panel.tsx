"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Kicker, Meter, Stat } from "@/components/ui/neon";
import {
  computeAverage,
  computeConsensus,
  computeDistribution,
  computeMedian,
  consensusBand,
} from "@/lib/vote-stats";
import { cn } from "@/lib/utils";

interface ResultPanelProps {
  votes: string[];
  onAccept: (points: string) => void;
  isBusy: boolean;
  /** Provedor conectado para o botão "Enviar para X"; null esconde o botão. */
  pushProvider?: { id: string; name: string } | null;
  onPush?: (points: string) => void;
}

/**
 * Painel de resultado. A frase de dispersão muda por faixa de consenso, que é
 * o único lugar onde o app diz ao time o que fazer com o número.
 */
export function ResultPanel({
  votes,
  onAccept,
  isBusy,
  pushProvider,
  onPush,
}: ResultPanelProps) {
  const t = useTranslations("room");
  const locale = useLocale();

  const stats = useMemo(() => {
    const average = computeAverage(votes);
    const median = computeMedian(votes);
    const consensus = computeConsensus(votes);
    return {
      average,
      median,
      consensus,
      band: consensusBand(consensus),
      distribution: computeDistribution(votes),
    };
  }, [votes]);

  // Vírgula em PT, ponto em EN.
  const formatNumber = (value: number | null) =>
    value === null
      ? "—"
      : new Intl.NumberFormat(locale, {
          maximumFractionDigits: 1,
        }).format(value);

  const points =
    stats.median !== null ? formatNumber(stats.median) : votes[0] ?? "?";

  const maxCount = Math.max(1, ...stats.distribution.map((d) => d.count));

  const dispersionKey = {
    strong: "dispersionStrong",
    ok: "dispersionOk",
    weak: "dispersionWeak",
  }[stats.band];

  return (
    <div className="grid animate-rise gap-10 lg:grid-cols-[1.1fr_1fr]">
      <div className="flex flex-col gap-6">
        <Kicker>{t("result.kicker")}</Kicker>

        <div className="flex flex-wrap gap-10">
          <Stat
            value={formatNumber(stats.average)}
            label={t("result.average")}
          />
          <Stat value={formatNumber(stats.median)} label={t("result.median")} />
          <Stat
            value={`${stats.consensus}%`}
            label={t("result.consensus")}
            tone="mg"
          />
        </div>

        <div className="flex flex-col gap-2.5">
          <Meter value={stats.consensus} tone="mg" />
          <p className="text-[15px] leading-relaxed text-pa-muted">
            {t(dispersionKey)}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => onAccept(points)} disabled={isBusy}>
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

      <div className="flex flex-col gap-4">
        <Kicker>{t("result.distribution")}</Kicker>

        {stats.distribution.length === 0 ? (
          <p className="text-[15px] text-pa-faint">
            {t("result.noNumericVotes")}
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {stats.distribution.map((entry) => (
              <li key={entry.value} className="flex items-center gap-3.5">
                <span className="pa-numeric w-10 shrink-0 text-[15px] font-bold text-pa-text">
                  {entry.value}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-pa-text/[.06]">
                  <div
                    className={cn(
                      "h-full rounded-full bg-cy shadow-[0_0_12px_rgb(var(--pa-cy)/.5)]",
                      "transition-[width] duration-500"
                    )}
                    style={{ width: `${(entry.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="pa-numeric w-6 shrink-0 text-right text-sm text-pa-dim">
                  {entry.count}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
