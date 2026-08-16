"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import { Kicker, Panel, Rule } from "@/components/ui/neon";
import { cn } from "@/lib/utils";
import type { SnapshotParticipant, SnapshotTask } from "@/types/room-state";

interface SidePanelProps {
  roomId: string;
  participants: SnapshotParticipant[];
  queue: SnapshotTask[];
  meId: string | null;
  connectedProvider?: { id: string; name: string; board: string | null } | null;
}

export function SidePanel({
  roomId,
  participants,
  queue,
  meId,
  connectedProvider,
}: SidePanelProps) {
  const t = useTranslations("room");
  const tIntegrations = useTranslations("integrations");
  const tTasks = useTranslations("tasks");

  const upcoming = queue.filter((task) => task.status !== "estimated").slice(0, 4);

  return (
    <aside className="flex w-full flex-col gap-7 lg:w-[320px]">
      <section className="flex flex-col gap-3.5">
        <div className="flex items-baseline justify-between gap-3">
          <Kicker>{t("participants")}</Kicker>
          <span className="pa-numeric text-xs text-pa-ghost">
            {participants.length}
          </span>
        </div>
        <Rule />

        <ul className="flex flex-col gap-2.5">
          {participants.map((participant) => {
            const isMe = participant.id === meId;

            return (
              <li
                key={participant.id}
                className="flex items-center gap-2.5 text-[15px]"
              >
                <span
                  aria-hidden
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full",
                    participant.hasVoted
                      ? "bg-cy shadow-[0_0_10px_rgb(var(--pa-cy))]"
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
                  <span className="pa-numeric shrink-0 text-xs text-mg-soft">
                    ×{participant.callsReceived}
                  </span>
                ) : null}

                <span className="shrink-0 text-xs text-pa-faint">
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
      </section>

      <section className="flex flex-col gap-3.5">
        <div className="flex items-baseline justify-between gap-3">
          <Kicker>{t("queue")}</Kicker>
          <Link
            href={`/room/${roomId}/tasks`}
            className="font-display text-[10px] uppercase tracking-[.14em] text-cy transition-colors hover:text-cy-soft"
          >
            {t("manage")}
          </Link>
        </div>
        <Rule />

        {upcoming.length === 0 ? (
          <p className="text-sm leading-relaxed text-pa-faint">
            {tTasks("queueEmpty")}
          </p>
        ) : (
          <ol className="flex flex-col gap-2.5">
            {upcoming.map((task, index) => (
              <li key={task.id} className="flex items-baseline gap-2.5 text-sm">
                <span className="pa-numeric w-4 shrink-0 text-pa-ghost">
                  {index + 1}
                </span>
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate",
                    task.status === "active" ? "text-cy" : "text-pa-muted"
                  )}
                >
                  {task.key !== "—" ? (
                    <span className="pa-numeric mr-1.5 text-xs text-cy">
                      {task.key}
                    </span>
                  ) : null}
                  {task.title}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {connectedProvider ? (
        <Panel className="flex flex-col gap-2 border-mg/28 bg-mg/[.06] p-4">
          <span className="pa-kicker text-mg-soft">
            {tIntegrations("connected")}
          </span>
          <span className="font-display text-sm text-pa-text">
            {connectedProvider.name}
          </span>
          {connectedProvider.board ? (
            <span className="truncate text-[13px] text-pa-faint">
              {connectedProvider.board}
            </span>
          ) : null}
          <Link
            href="/integrations"
            className="mt-1 font-display text-[10px] uppercase tracking-[.14em] text-mg-soft transition-colors hover:text-mg"
          >
            {tIntegrations("manage")}
          </Link>
        </Panel>
      ) : null}
    </aside>
  );
}
