"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge, Kicker, Rule } from "@/components/ui/neon";
import { useToast } from "@/hooks/useToast";
import { Link } from "@/src/i18n/navigation";
import { cn } from "@/lib/utils";
import type { ProviderId } from "@/lib/integrations/providers";

interface Summary {
  id: ProviderId;
  mark: string;
  scopes: string[];
  configured: boolean;
  connected: boolean;
  workspace: string | null;
  board: string | null;
  boardId: string | null;
  lastSyncAt: string | null;
}

const NOTES = ["in", "out", "record"] as const;

export default function IntegrationsPage() {
  const t = useTranslations("integrations");
  const tToast = useTranslations("toast");
  const tAuth = useTranslations("auth");
  const { data: session } = useSession();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [boards, setBoards] = useState<Record<string, { id: string; name: string }[]>>({});

  const load = useCallback(async () => {
    const response = await fetch("/api/integrations", { cache: "no-store" });
    if (response.ok) setSummaries(await response.json());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Feedback da volta do OAuth.
  useEffect(() => {
    if (searchParams?.get("connected")) {
      toast({ description: tToast("connected") });
    } else if (searchParams?.get("error")) {
      toast({ variant: "destructive", description: t("connectError") });
    }
  }, [searchParams, toast, tToast, t]);

  const loadBoards = useCallback(async (provider: string) => {
    const response = await fetch(`/api/integrations/${provider}/boards`, {
      cache: "no-store",
    });
    if (!response.ok) return;

    const options = await response.json();
    setBoards((current) => ({ ...current, [provider]: options }));
  }, []);

  useEffect(() => {
    summaries
      .filter((summary) => summary.connected)
      .forEach((summary) => void loadBoards(summary.id));
  }, [summaries, loadBoards]);

  const disconnect = async (provider: string) => {
    const response = await fetch(`/api/integrations/${provider}`, {
      method: "DELETE",
    });
    if (response.ok) {
      toast({ description: tToast("disconnected") });
      await load();
    }
  };

  const sync = async (provider: string) => {
    const response = await fetch(`/api/integrations/${provider}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sync: true }),
    });

    toast(
      response.ok
        ? { description: tToast("synced") }
        : { variant: "destructive", description: t("connectError") }
    );

    if (response.ok) await load();
  };

  const chooseBoard = async (provider: string, boardId: string, board: string) => {
    const response = await fetch(`/api/integrations/${provider}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ boardId, board }),
    });
    if (response.ok) await load();
  };

  return (
    <div className="mx-auto flex max-w-[1360px] animate-rise flex-col gap-8 px-5 pb-24 pt-11 md:px-10">
      <div className="flex flex-col gap-2.5">
        <Kicker>{t("kicker")}</Kicker>
        <h1 className="font-display text-[26px] text-pa-text md:text-[34px]">
          {t("title")}
        </h1>
        <p className="max-w-[70ch] text-[17px] leading-relaxed text-pa-muted">
          {t("subtitle")}
        </p>
      </div>

      {!session?.user ? (
        <div className="flex flex-wrap items-center gap-4 rounded-card border border-dashed border-pa-text/14 p-5">
          <p className="text-[15px] text-pa-muted">{t("signInRequired")}</p>
          <Button asChild size="sm">
            <Link href="/login">{tAuth("signIn")}</Link>
          </Button>
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        {summaries.map((summary) => {
          const options = boards[summary.id] ?? [];

          return (
            <article
              key={summary.id}
              className={cn(
                "flex flex-col gap-4 rounded-card border p-5",
                summary.connected
                  ? "border-cy/28 bg-cy/[.04]"
                  : "border-pa-text/8 bg-pa-text/[.03]"
              )}
            >
              <div className="flex items-start gap-3.5">
                <span
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-[3px] border font-display text-[13px] font-bold",
                    summary.connected
                      ? "border-cy/45 bg-cy/10 text-cy"
                      : "border-pa-text/12 text-pa-dim"
                  )}
                >
                  {summary.mark}
                </span>

                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="font-display text-[16px] text-pa-text">
                      {t(`providers.${summary.id}.name`)}
                    </h2>
                    <Badge
                      tone={
                        !summary.configured
                          ? "neutral"
                          : summary.connected
                            ? "cy"
                            : "neutral"
                      }
                    >
                      {!summary.configured
                        ? t("unavailable")
                        : summary.connected
                          ? t("connected")
                          : t("notConnected")}
                    </Badge>
                  </div>
                  <p className="text-[15px] leading-relaxed text-pa-muted">
                    {t(`providers.${summary.id}.description`)}
                  </p>
                </div>
              </div>

              <Rule />

              {summary.connected ? (
                <dl className="flex flex-col gap-2 text-[14px]">
                  <div className="flex justify-between gap-4">
                    <dt className="pa-kicker">{t("workspace")}</dt>
                    <dd className="truncate text-pa-text">
                      {summary.workspace ?? "—"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="pa-kicker">{t("board")}</dt>
                    <dd className="min-w-0 flex-1">
                      <select
                        value={summary.boardId ?? ""}
                        onChange={(event) => {
                          const option = options.find(
                            (item) => item.id === event.target.value
                          );
                          if (option) {
                            void chooseBoard(summary.id, option.id, option.name);
                          }
                        }}
                        className="w-full rounded-sm border border-pa-text/14 bg-pa-sunken px-2 py-1.5 text-right text-[14px] text-pa-text"
                      >
                        <option value="">—</option>
                        {options.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.name}
                          </option>
                        ))}
                      </select>
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="pa-kicker">{t("lastSync")}</dt>
                    <dd className="text-pa-faint">
                      {summary.lastSyncAt
                        ? new Date(summary.lastSyncAt).toLocaleString()
                        : t("never")}
                    </dd>
                  </div>
                </dl>
              ) : (
                <div className="flex flex-col gap-2">
                  <span className="pa-kicker">{t("scope")}</span>
                  <p className="pa-numeric text-[13px] text-pa-faint">
                    {summary.scopes.join(" · ") || "—"}
                  </p>
                  {!summary.configured ? (
                    <p className="text-[13px] leading-relaxed text-pa-ghost">
                      {t("unavailableHint")}
                    </p>
                  ) : null}
                </div>
              )}

              <div className="mt-auto flex flex-wrap gap-2.5 pt-1">
                {summary.connected ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => disconnect(summary.id)}
                    >
                      {t("disconnect")}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => sync(summary.id)}
                    >
                      {t("sync")}
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    asChild={summary.configured && Boolean(session?.user)}
                    disabled={!summary.configured || !session?.user}
                  >
                    {summary.configured && session?.user ? (
                      <a href={`/api/integrations/${summary.id}/connect`}>
                        {t("connect")}
                      </a>
                    ) : (
                      <span>{t("connect")}</span>
                    )}
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div className="grid gap-8 border-t border-pa-text/[.07] pt-8 md:grid-cols-3">
        {NOTES.map((note) => (
          <div key={note} className="flex flex-col gap-2.5">
            <Kicker>{t(`notes.${note}.kicker`)}</Kicker>
            <p className="text-[15px] leading-relaxed text-pa-muted">
              {t(`notes.${note}.body`)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
