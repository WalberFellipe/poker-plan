"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import { Kicker, Panel, Rule } from "@/components/ui/neon";
import { cn } from "@/lib/utils";
import type { SnapshotParticipant, SnapshotTask } from "@/types/room-state";

/**
 * Os dois painéis têm altura de dez itens **sempre**, cheios ou não.
 *
 * Reservar o espaço desde o início é o que impede a página de se reorganizar
 * quando alguém entra ou uma tarefa é importada. Passando de dez, a rolagem
 * acontece dentro do card — a página em si nunca rola.
 *
 * Em telas baixas os dois dividem a altura disponível (`flex-1` + `min-h-0`),
 * então continuam cabendo sem empurrar nada para fora.
 */
const LIST_SURFACE = [
  "min-h-0 flex-1 overflow-y-auto",
  "rounded-card border border-pa-text/[.07] bg-pa-text/[.04] p-2.5",
  // Teto de dez itens. Numa janela que não comporte os dois cheios, eles
  // dividem a altura disponível em vez de empurrar a página — a rolagem
  // acontece por dentro, nunca no documento.
  "max-h-[340px] lg:min-h-[150px]",
].join(" ");

interface SidePanelProps {
  roomId: string;
  participants: SnapshotParticipant[];
  queue: SnapshotTask[];
  meId: string | null;
  activeTaskId: string | null;
  onPickTask: (taskId: string) => void;
  isBusy: boolean;
  connectedProvider?: { id: string; name: string; board: string | null } | null;
}

export function SidePanel({
  roomId,
  participants,
  queue,
  meId,
  activeTaskId,
  onPickTask,
  isBusy,
  connectedProvider,
}: SidePanelProps) {
  const t = useTranslations("room");
  const tIntegrations = useTranslations("integrations");
  const tTasks = useTranslations("tasks");

  return (
    <aside className="flex min-h-0 w-full flex-col gap-5 lg:h-full lg:w-[320px] lg:overflow-hidden">
      <section className="flex min-h-0 flex-1 flex-col gap-2.5">
        <div className="flex items-baseline justify-between gap-3">
          <Kicker>{t("participants")}</Kicker>
          <span className="pa-numeric text-[13px] text-pa-ghost">
            {participants.length}
          </span>
        </div>
        <Rule />

        <div className={LIST_SURFACE}>
          <ul className="flex flex-col gap-2">
            {participants.map((participant) => {
              const isMe = participant.id === meId;

              return (
                <li
                  key={participant.id}
                  className="flex items-center gap-2.5 text-[16px]"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      participant.hasVoted
                        ? "bg-cy shadow-[0_0_6px_rgb(var(--pa-cy)/.7)]"
                        : "bg-pa-text/20"
                    )}
                  />
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate",
                      isMe ? "text-mg-soft" : "text-pa-text",
                      !participant.isOnline && "text-pa-ghost"
                    )}
                  >
                    {isMe ? t("you") : participant.name}
                  </span>

                  {participant.callsReceived > 0 ? (
                    <span className="pa-numeric shrink-0 text-[13px] text-mg-soft">
                      ×{participant.callsReceived}
                    </span>
                  ) : null}

                  <span className="shrink-0 text-[13px] text-pa-faint">
                    {!participant.isOnline
                      ? t("offline")
                      : participant.hasVoted
                        ? t("voted")
                        : t("waiting")}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="flex min-h-0 flex-1 flex-col gap-2.5">
        <div className="flex items-baseline justify-between gap-3">
          <Kicker>{t("queue")}</Kicker>
          <Link
            href={`/room/${roomId}/tasks`}
            className="font-display text-[11px] uppercase tracking-[.1em] text-cy transition-colors hover:text-cy-soft"
          >
            {t("manage")}
          </Link>
        </div>
        <Rule />

        <div className={LIST_SURFACE}>
          {queue.length === 0 ? (
            <p className="p-2 text-[15px] leading-relaxed text-pa-faint">
              {tTasks("queueEmpty")}
            </p>
          ) : (
            <ol className="flex flex-col gap-1">
              {queue.map((task, index) => {
                const isActive = task.id === activeTaskId;
                const isEstimated = task.status === "estimated";

                return (
                  <li key={task.id}>
                    {/*
                      A tarefa entra na mesa daqui mesmo. Antes era preciso ir
                      até a tela de Tarefas só para trocar o que está em jogo.
                    */}
                    <button
                      type="button"
                      disabled={isActive || isBusy}
                      onClick={() => onPickTask(task.id)}
                      title={isActive ? undefined : tTasks("voteNow")}
                      className={cn(
                        "flex w-full items-baseline gap-2.5 rounded-sm px-2 py-2 text-left transition-colors",
                        isActive
                          ? "cursor-default bg-cy/10"
                          : "hover:bg-pa-text/[.05]"
                      )}
                    >
                      <span
                        className={cn(
                          "pa-numeric w-4 shrink-0 text-[13px]",
                          isActive ? "text-cy" : "text-pa-ghost"
                        )}
                      >
                        {index + 1}
                      </span>

                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate text-[15px]",
                          isActive
                            ? "text-cy"
                            : isEstimated
                              ? "text-pa-faint"
                              : "text-pa-muted"
                        )}
                      >
                        {task.key && task.key !== "—" ? (
                          <span
                            className={cn(
                              "pa-numeric mr-1.5 text-[13px]",
                              isActive ? "text-cy" : "text-pa-ghost"
                            )}
                          >
                            {task.key}
                          </span>
                        ) : null}
                        {task.title}
                      </span>

                      {/* Já votada: mostra o número que o time fechou. */}
                      {isEstimated && task.points ? (
                        <span className="pa-numeric shrink-0 rounded-sm border border-cy/30 px-1.5 py-0.5 text-[13px] text-cy">
                          {task.points}
                        </span>
                      ) : isActive ? (
                        <span className="pa-kicker shrink-0 text-cy">
                          {tTasks("onTable")}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </section>

      {connectedProvider ? (
        <Panel className="flex flex-col gap-2 border-mg/28 bg-mg/[.06] p-4">
          <span className="pa-kicker text-mg-soft">
            {tIntegrations("connected")}
          </span>
          <span className="font-display text-[15px] text-pa-text">
            {connectedProvider.name}
          </span>
          {connectedProvider.board ? (
            <span className="truncate text-[14px] text-pa-faint">
              {connectedProvider.board}
            </span>
          ) : null}
          <Link
            href="/integrations"
            className="mt-1 font-display text-[11px] uppercase tracking-[.1em] text-mg-soft transition-colors hover:text-mg"
          >
            {tIntegrations("manage")}
          </Link>
        </Panel>
      ) : null}
    </aside>
  );
}
