"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";

import { useRoom } from "@/hooks/useRoom";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Badge, Kicker, Rule } from "@/components/ui/neon";
import { Link } from "@/src/i18n/navigation";
import { cn } from "@/lib/utils";
import type { ProviderId } from "@/lib/integrations/providers";
import type { TaskSource } from "@/types/room-state";

interface ExternalIssue {
  externalId: string;
  key: string;
  title: string;
  type: string | null;
  url: string | null;
}

interface IntegrationSummary {
  id: ProviderId;
  connected: boolean;
  configured: boolean;
  workspace: string | null;
  board: string | null;
}

const SOURCES: ProviderId[] = ["jira", "izzyplan", "trello", "github"];

/**
 * Converte o texto colado em tarefas.
 * Uma por linha, no formato "CHAVE · título" — o separador também aceita "-" e
 * ":" porque é o que as pessoas costumam colar de um board.
 */
function parsePastedTasks(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^([A-Z0-9]+-\d+|\S{2,12})\s*[·:\-—]\s*(.+)$/);
      if (match) return { key: match[1], title: match[2].trim() };
      return { key: "", title: line };
    });
}

export default function TasksClient({ roomId }: { roomId: string }) {
  const t = useTranslations("tasks");
  const tToast = useTranslations("toast");
  const tIntegrations = useTranslations("integrations");
  const { toast } = useToast();

  const { snapshot, addTasks, removeTask, promoteTask } = useRoom(roomId);

  const [tab, setTab] = useState<"board" | "manual">("board");
  const [pasted, setPasted] = useState("");
  const [source, setSource] = useState<ProviderId>("jira");
  const [integrations, setIntegrations] = useState<IntegrationSummary[]>([]);
  const [issues, setIssues] = useState<ExternalIssue[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [isLoadingIssues, setIsLoadingIssues] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isAddingPasted, setIsAddingPasted] = useState(false);
  const [isLoadingIntegrations, setIsLoadingIntegrations] = useState(true);

  useEffect(() => {
    fetch("/api/integrations", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => setIntegrations(data ?? []))
      .catch(() => setIntegrations([]))
      .finally(() => setIsLoadingIntegrations(false));
  }, []);

  const current = integrations.find((item) => item.id === source);

  const loadIssues = useCallback(async () => {
    if (!current?.connected) {
      setIssues([]);
      return;
    }

    setIsLoadingIssues(true);
    try {
      const response = await fetch(`/api/integrations/${source}/issues`, {
        cache: "no-store",
      });
      setIssues(response.ok ? await response.json() : []);
    } catch {
      setIssues([]);
    } finally {
      setIsLoadingIssues(false);
      setPicked(new Set());
    }
  }, [source, current?.connected]);

  useEffect(() => {
    void loadIssues();
  }, [loadIssues]);

  /**
   * O que já veio para esta sala não aparece de novo na lista.
   *
   * Antes, uma tarefa importada continuava oferecida como se fosse nova — e
   * marcá-la de novo parecia funcionar, já que a fila só mostrava o resultado
   * depois. A fila cobre também as estimadas, que saem de `queue`, então
   * comparamos com o que o snapshot conhece de origem externa.
   */
  const importedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const task of snapshot?.queue ?? []) {
      if (task.source === source) ids.add(task.key);
    }
    return ids;
  }, [snapshot?.queue, source]);

  const availableIssues = useMemo(
    () => issues.filter((issue) => !importedIds.has(issue.key)),
    [issues, importedIds]
  );

  const togglePick = (id: string) => {
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const importPicked = async () => {
    if (isImporting) return;

    const selected = availableIssues.filter((issue) =>
      picked.has(issue.externalId)
    );
    if (selected.length === 0) return;

    setIsImporting(true);
    try {
      const result = await addTasks(
        selected.map((issue) => ({
          key: issue.key,
          title: issue.title,
          source: source as TaskSource,
          type: issue.type,
          externalId: issue.externalId,
          externalUrl: issue.url,
        }))
      );

      if (result) {
        toast({ description: tToast("imported", { count: selected.length }) });
        setPicked(new Set());
      }
    } finally {
      setIsImporting(false);
    }
  };

  const addPasted = async () => {
    if (isAddingPasted) return;

    const parsed = parsePastedTasks(pasted);
    if (parsed.length === 0) return;

    setIsAddingPasted(true);
    try {
      const ok = await addTasks(
        parsed.map((task) => ({ ...task, source: "manual" }))
      );

      if (ok) {
        toast({ description: tToast("imported", { count: parsed.length }) });
        setPasted("");
      }
    } finally {
      setIsAddingPasted(false);
    }
  };

  const queue = snapshot?.queue ?? [];

  return (
    <div className="mx-auto grid max-w-[1360px] animate-rise gap-12 px-5 pb-24 pt-11 md:px-10 lg:grid-cols-2">
      {/* Fila */}
      <section className="flex flex-col gap-4">
        <Kicker>{t("kicker")}</Kicker>
        <h1 className="font-display text-[26px] text-pa-text">{t("queue")}</h1>
        <Rule />

        {queue.length === 0 ? (
          <p className="text-[17px] leading-relaxed text-pa-faint">
            {t("queueEmpty")}
          </p>
        ) : (
          <ol className="flex flex-col">
            {queue.map((task, index) => (
              <li
                key={task.id}
                className="flex items-center gap-3.5 border-b border-pa-text/[.06] py-3.5"
              >
                <span className="pa-numeric w-5 shrink-0 text-[14px] text-pa-ghost">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-[17px] text-pa-text">
                    {task.key && task.key !== "—" ? (
                      <span className="pa-numeric mr-2 text-[14px] text-cy">
                        {task.key}
                      </span>
                    ) : null}
                    {task.title}
                  </span>
                  <span className="pa-kicker">{task.source}</span>
                </div>

                {task.status === "active" ? (
                  <Badge tone="cy">{t("onTable")}</Badge>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => promoteTask(task.id)}
                  >
                    {t("voteNow")}
                  </Button>
                )}

                <button
                  type="button"
                  aria-label={t("remove")}
                  onClick={() => removeTask(task.id)}
                  className="shrink-0 rounded-sm p-1 text-pa-ghost transition-colors hover:text-mg-soft"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Importar / colar */}
      <section className="flex flex-col gap-4">
        <div className="flex gap-1.5">
          {(["board", "manual"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={cn(
                "rounded-sm border px-4 py-2.5 font-display text-[11px] uppercase tracking-[.1em] transition-colors",
                tab === value
                  ? "border-cy/45 bg-cy/12 text-cy"
                  : "border-transparent text-pa-dim hover:text-pa-text"
              )}
            >
              {value === "board" ? t("fromBoard") : t("manual")}
            </button>
          ))}
        </div>
        <Rule />

        {tab === "manual" ? (
          <div className="flex flex-col gap-3">
            <Textarea
              value={pasted}
              placeholder={t("pastePlaceholder")}
              onChange={(event) => setPasted(event.target.value)}
            />
            <span className="text-[14px] text-pa-faint">{t("pasteHint")}</span>
            <Button
              onClick={addPasted}
              disabled={parsePastedTasks(pasted).length === 0}
              loading={isAddingPasted}
              className="self-start"
            >
              {t("addToQueue")}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {SOURCES.map((id) => {
                const summary = integrations.find((item) => item.id === id);
                const active = id === source;

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSource(id)}
                    className={cn(
                      "flex items-center gap-2 rounded-chip border px-3.5 py-2 text-[15px] transition-colors",
                      active
                        ? "border-cy/45 bg-cy/10 text-cy"
                        : "border-pa-text/12 text-pa-dim hover:text-pa-text"
                    )}
                  >
                    {tIntegrations(`providers.${id}.name`)}
                    {summary?.connected ? (
                      <span
                        aria-hidden
                        className="h-1.5 w-1.5 rounded-full bg-cy shadow-[0_0_8px_rgb(var(--pa-cy))]"
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>

            {isLoadingIntegrations ? (
              <p className="text-[17px] text-pa-faint">{t("loadingIssues")}</p>
            ) : !current?.connected ? (
              <div className="flex flex-col items-start gap-3.5 rounded-card border border-dashed border-pa-text/14 p-6">
                <p className="text-[17px] leading-relaxed text-pa-muted">
                  {t("notConnected", {
                    provider: tIntegrations(`providers.${source}.name`),
                  })}
                </p>
                <Button asChild size="sm">
                  <Link href="/integrations">{t("connectNow")}</Link>
                </Button>
              </div>
            ) : isLoadingIssues ? (
              <p className="text-[17px] text-pa-faint">{t("loadingIssues")}</p>
            ) : availableIssues.length === 0 ? (
              <p className="text-[17px] text-pa-faint">
                {issues.length === 0 ? t("noIssues") : t("allImported")}
              </p>
            ) : (
              <>
                <ul className="flex max-h-[420px] flex-col overflow-auto">
                  {availableIssues.map((issue) => {
                    const checked = picked.has(issue.externalId);

                    return (
                      <li key={issue.externalId}>
                        <label className="flex cursor-pointer items-center gap-3 border-b border-pa-text/[.06] py-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePick(issue.externalId)}
                            className="sr-only"
                          />
                          <span
                            aria-hidden
                            className={cn(
                              "flex h-4 w-4 shrink-0 items-center justify-center rounded-[1px] border text-[10px]",
                              checked
                                ? "border-cy bg-cy text-cy-ink"
                                : "border-pa-text/25"
                            )}
                          >
                            {checked ? "✓" : ""}
                          </span>
                          <span className="pa-numeric shrink-0 text-[14px] text-cy">
                            {issue.key}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-[17px] text-pa-text">
                            {issue.title}
                          </span>
                          {issue.type ? (
                            <span className="pa-kicker shrink-0">{issue.type}</span>
                          ) : null}
                        </label>
                      </li>
                    );
                  })}
                </ul>

                <Button
                  onClick={importPicked}
                  disabled={picked.size === 0}
                  loading={isImporting}
                  className="self-start"
                >
                  {t("importSelected", { count: picked.size })}
                </Button>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
