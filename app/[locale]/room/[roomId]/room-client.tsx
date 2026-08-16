"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";

import { useRoom } from "@/hooks/useRoom";
import { getStoredName } from "@/lib/client-id";
import { computeAverage, computeConsensus, consensusBand } from "@/lib/vote-stats";
import { Button } from "@/components/ui/button";
import { Dot } from "@/components/ui/neon";
import { PokerTable } from "@/components/room/poker-table";
import { Hand } from "@/components/room/hand";
import { ResultPanel } from "@/components/room/result-panel";
import { SidePanel } from "@/components/room/side-panel";
import { JoinRoomModal } from "@/components/room/join-room-modal";
import { InviteButton } from "@/components/room/invite-button";
import { useToast } from "@/hooks/useToast";
import { apiFetch } from "@/lib/client-id";
import type { ChipKind } from "@/types/room-state";

interface IntegrationSummary {
  id: string;
  connected: boolean;
  canPushPoints: boolean;
  board: string | null;
}

function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** Jitter do pouso: ±7,5% em x e ±6% em y, como no protótipo. */
function randomJitter() {
  return {
    jitterX: Math.random() * 15 - 7.5,
    jitterY: Math.random() * 12 - 6,
    rot: Math.round(Math.random() * 40 - 20),
  };
}

export default function RoomClient({ roomId }: { roomId: string }) {
  const t = useTranslations("room");
  const tToast = useTranslations("toast");
  const locale = useLocale();
  const { data: session, status: authStatus } = useSession();
  const { toast } = useToast();

  const room = useRoom(roomId);
  const {
    snapshot,
    meId,
    myVote,
    isLoading,
    error,
    revealed,
    countdown,
    elapsedSeconds,
    isBusy,
    chips,
    join,
    selectCard,
    reveal,
    reset,
    throwChip,
    acceptEstimate,
  } = room;

  const [needsName, setNeedsName] = useState(false);
  const [integrations, setIntegrations] = useState<IntegrationSummary[]>([]);
  const autoJoinAttempted = useRef(false);

  useEffect(() => {
    fetch("/api/integrations", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => setIntegrations(data ?? []))
      .catch(() => setIntegrations([]));
  }, []);

  /**
   * Entrada automática: se já temos identidade (sessão ou nome lembrado), a
   * pessoa senta direto. O modal só aparece quando realmente não sabemos quem
   * é — e nunca de novo depois disso, porque o `clientId` é estável.
   */
  useEffect(() => {
    if (autoJoinAttempted.current) return;
    if (isLoading || authStatus === "loading") return;
    if (meId) return;

    autoJoinAttempted.current = true;

    const known = session?.user?.name ?? getStoredName();

    if (known) {
      void join(known);
    } else {
      setNeedsName(true);
    }
  }, [isLoading, authStatus, meId, session?.user?.name, join]);

  useEffect(() => {
    if (meId) setNeedsName(false);
  }, [meId]);

  const participants = useMemo(
    () => snapshot?.participants ?? [],
    [snapshot?.participants]
  );
  const deckValues = snapshot?.room.deckValues ?? [];

  const revealedVotes = useMemo(
    () =>
      participants
        .map((participant) => participant.vote)
        .filter((vote): vote is string => vote !== null),
    [participants]
  );

  const statusLine = useMemo(() => {
    if (!revealed) return { text: t("idle"), tone: "muted" as const };

    const average = computeAverage(revealedVotes);
    const consensus = computeConsensus(revealedVotes);
    const band = consensusBand(consensus);
    const label = t(
      band === "strong"
        ? "consensusStrong"
        : band === "ok"
          ? "consensusOk"
          : "consensusWeak"
    );

    return {
      text: t("revealedStatus", {
        average:
          average === null
            ? "—"
            : new Intl.NumberFormat(locale, {
                maximumFractionDigits: 1,
              }).format(average),
        consensusLabel: label,
      }),
      tone: "accent" as const,
    };
  }, [revealed, revealedVotes, t, locale]);

  const react = useCallback(
    (kind: Exclude<ChipKind, "call">) => {
      void throwChip({ kind, ...randomJitter() });
    },
    [throwChip]
  );

  const call = useCallback(
    (targetId: string) => {
      // O pouso do "call" fica a 46% do caminho até o alvo; aqui só sorteamos
      // o desvio, que é o que precisa ser igual em todas as telas.
      void throwChip({
        kind: "call",
        targetId,
        jitterX: Math.random() * 8 - 4,
        jitterY: Math.random() * 6 - 3,
        rot: Math.round(Math.random() * 40 - 20),
      });
    },
    [throwChip]
  );

  // A tarefa em jogo só pode voltar ao board se veio de um, e se a integração
  // daquele provedor estiver conectada nesta conta.
  const activeTask = snapshot?.queue.find(
    (task) => task.id === snapshot.story?.taskId
  );
  const pushTarget =
    activeTask && activeTask.source !== "manual"
      ? integrations.find(
          (item) =>
            item.id === activeTask.source &&
            item.connected &&
            // Provedores somente leitura não ganham botão de enviar.
            item.canPushPoints
        )
      : undefined;

  const onPush = useCallback(
    async (points: string) => {
      if (!activeTask) return;

      const response = await apiFetch(`/api/rooms/${roomId}/push`, {
        method: "POST",
        body: JSON.stringify({ taskId: activeTask.id, points }),
      });

      const payload = await response.json().catch(() => ({}));

      toast(
        response.ok
          ? { description: tToast("pushed") }
          : {
              variant: "destructive",
              description: payload?.error ?? tToast("pushed"),
            }
      );
    },
    [roomId, activeTask, toast, tToast]
  );

  const onAccept = useCallback(
    async (points: string) => {
      const ok = await acceptEstimate(points);
      if (ok) toast({ description: tToast("accepted") });
    },
    [acceptEstimate, toast, tToast]
  );

  if (needsName && !meId) {
    return (
      <JoinRoomModal
        defaultName={getStoredName()}
        onJoin={async (name) => {
          const ok = await join(name);
          if (ok) setNeedsName(false);
          return ok;
        }}
      />
    );
  }

  if (isLoading && !snapshot) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-3">
        <Dot />
        <span className="pa-label">{t("loading")}</span>
      </div>
    );
  }

  if (error && !snapshot) {
    const message =
      error === "expired"
        ? t("expired")
        : error === "notFound"
          ? t("notFound")
          : t("loadError");

    return (
      <div className="flex min-h-[60vh] items-center justify-center px-5">
        <p className="text-center text-[17px] text-pa-muted">{message}</p>
      </div>
    );
  }

  if (!snapshot) return null;

  return (
    <div className="mx-auto grid max-w-[1560px] animate-rise gap-9 px-5 pb-16 pt-6 md:px-10 lg:grid-cols-[1fr_320px]">
      <div className="flex min-w-0 flex-col gap-5">
        <header className="flex flex-wrap items-end gap-5">
          <div className="flex min-w-0 flex-1 basis-[260px] flex-col gap-1">
            <span className="pa-label">{snapshot.room.name}</span>
            <h1 className="text-[28px] leading-tight text-pa-text">
              {snapshot.story?.title}
            </h1>
            <span
              className={
                statusLine.tone === "accent"
                  ? "text-[15px] text-mg-soft"
                  : "text-[15px] text-pa-dim"
              }
            >
              {statusLine.text}
            </span>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 rounded-sm border border-cy/30 px-3.5 py-2">
              <Dot size={7} />
              <span className="pa-numeric text-[15px] text-cy">
                {formatClock(elapsedSeconds)}
              </span>
            </div>

            {revealed ? (
              <Button variant="call" onClick={reset} disabled={isBusy}>
                {t("newRound")}
              </Button>
            ) : (
              <Button onClick={reveal} disabled={isBusy}>
                {t("reveal")}
              </Button>
            )}

            <Button variant="secondary" size="sm" onClick={reset} disabled={isBusy}>
              {t("reset")}
            </Button>

            <InviteButton roomId={roomId} />
          </div>
        </header>

        <PokerTable
          participants={participants}
          chips={chips}
          meId={meId}
          revealed={revealed}
          countdown={countdown}
          onCall={call}
          callHint={t("callHint")}
          youLabel={t("you")}
        />

        {revealed ? (
          <ResultPanel
            votes={revealedVotes}
            onAccept={onAccept}
            isBusy={isBusy}
            pushProvider={
              pushTarget
                ? {
                    id: pushTarget.id,
                    name: pushTarget.id[0].toUpperCase() + pushTarget.id.slice(1),
                  }
                : null
            }
            onPush={onPush}
          />
        ) : (
          <Hand
            deckValues={deckValues}
            myVote={myVote}
            disabled={countdown !== null}
            onSelect={selectCard}
            onReact={react}
          />
        )}
      </div>

      <SidePanel
        roomId={roomId}
        participants={participants}
        queue={snapshot.queue}
        meId={meId}
        connectedProvider={
          pushTarget
            ? {
                id: pushTarget.id,
                name: pushTarget.id[0].toUpperCase() + pushTarget.id.slice(1),
                board: pushTarget.board,
              }
            : null
        }
      />
    </div>
  );
}
