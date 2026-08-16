"use client";

import { useMemo } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";

import { useRoomState } from "@/hooks/useRoomState";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Kicker, Stat } from "@/components/ui/neon";
import { consensusBand, toNumericVote } from "@/lib/vote-stats";
import { cn } from "@/lib/utils";
import type { SnapshotEstimate } from "@/types/room-state";

/** Escapa um campo para CSV: aspas duplicadas e o valor entre aspas. */
function csvCell(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export default function EstimatesClient({ roomId }: { roomId: string }) {
  const t = useTranslations("estimates");
  const tToast = useTranslations("toast");
  const locale = useLocale();
  const format = useFormatter();
  const { toast } = useToast();

  const { snapshot } = useRoomState(roomId);
  const estimates: SnapshotEstimate[] = useMemo(
    () => snapshot?.estimates ?? [],
    [snapshot?.estimates]
  );

  const stats = useMemo(() => {
    const points = estimates
      .map((estimate) => toNumericVote(estimate.points))
      .filter((value): value is number => value !== null);

    const durations = estimates
      .map((estimate) => estimate.durationSeconds)
      .filter((value): value is number => value !== null);

    const totalPoints = points.reduce((a, b) => a + b, 0);
    const avgConsensus =
      estimates.length === 0
        ? 0
        : Math.round(
            estimates.reduce((a, b) => a + b.consensus, 0) / estimates.length
          );
    const avgSeconds =
      durations.length === 0
        ? null
        : Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);

    return { totalPoints, avgConsensus, avgSeconds };
  }, [estimates]);

  const exportCsv = () => {
    const header = [
      t("head.key"),
      t("head.task"),
      t("head.source"),
      t("head.points"),
      t("head.consensus"),
      t("head.date"),
    ];

    const rows = estimates.map((estimate) => [
      estimate.key,
      estimate.title,
      estimate.source,
      estimate.points,
      `${estimate.consensus}%`,
      new Date(estimate.createdAt).toISOString().slice(0, 10),
    ]);

    download(
      "estimativas.csv",
      [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n"),
      "text/csv;charset=utf-8"
    );

    toast({ description: tToast("exported") });
  };

  const exportJson = () => {
    download(
      "estimativas.json",
      JSON.stringify(estimates, null, 2),
      "application/json"
    );
    toast({ description: tToast("exported") });
  };

  const formatSeconds = (seconds: number | null) => {
    if (seconds === null) return "—";
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}m` : `${seconds}s`;
  };

  return (
    <div className="mx-auto flex max-w-[1360px] animate-rise flex-col gap-7 px-5 pb-24 pt-11 md:px-10">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="flex flex-col gap-2">
          <Kicker>{t("kicker")}</Kicker>
          <h1 className="font-display text-[26px] text-pa-text md:text-[34px]">
            {t("title")}
          </h1>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={exportCsv}
            disabled={estimates.length === 0}
          >
            {t("exportCsv")}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={exportJson}
            disabled={estimates.length === 0}
          >
            {t("exportJson")}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-12 border-y border-pa-text/[.07] py-7">
        <Stat
          value={new Intl.NumberFormat(locale).format(stats.totalPoints)}
          label={t("totalPoints")}
          size={32}
        />
        <Stat value={estimates.length} label={t("storiesDone")} size={32} />
        <Stat
          value={`${stats.avgConsensus}%`}
          label={t("avgConsensus")}
          tone="mg"
          size={32}
        />
        <Stat
          value={formatSeconds(stats.avgSeconds)}
          label={t("avgTime")}
          size={32}
        />
      </div>

      {estimates.length === 0 ? (
        <p className="text-[17px] leading-relaxed text-pa-faint">{t("empty")}</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[96px_1fr_110px_90px_110px_100px] gap-4 border-b border-pa-text/[.1] pb-2.5">
              {(["key", "task", "source", "points", "consensus", "date"] as const).map(
                (head) => (
                  <span key={head} className="pa-kicker">
                    {t(`head.${head}`)}
                  </span>
                )
              )}
            </div>

            {estimates.map((estimate) => {
              const band = consensusBand(estimate.consensus);

              return (
                <div
                  key={estimate.id}
                  className="grid grid-cols-[96px_1fr_110px_90px_110px_100px] items-center gap-4 border-b border-pa-text/[.06] py-3.5"
                >
                  <span className="pa-numeric truncate text-[14px] text-cy">
                    {estimate.key}
                  </span>
                  <span className="truncate text-[17px] text-pa-text">
                    {estimate.title}
                  </span>
                  <span className="truncate text-[14px] text-pa-faint">
                    {estimate.source}
                  </span>
                  <span className="pa-numeric text-[17px] font-bold text-pa-text">
                    {estimate.points}
                  </span>
                  <span
                    className={cn(
                      "pa-numeric text-[17px]",
                      band === "strong"
                        ? "text-cy"
                        : band === "ok"
                          ? "text-pa-muted"
                          : "text-mg-soft"
                    )}
                  >
                    {estimate.consensus}%
                  </span>
                  <span className="text-[14px] text-pa-faint">
                    {format.dateTime(new Date(estimate.createdAt), {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
