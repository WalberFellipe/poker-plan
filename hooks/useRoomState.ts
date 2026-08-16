"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { pusherClient } from "@/lib/pusher";
import { apiFetch, getClientId } from "@/lib/client-id";
import {
  ROOM_STATE_EVENT,
  REVEAL_COUNTDOWN_MS,
  REVEAL_STEP_MS,
  RoomSnapshot,
} from "@/types/room-state";

/**
 * Intervalo do poll de reconciliação. Não é o caminho principal — o Pusher é —
 * mas garante que uma sala nunca fique presa num estado velho, mesmo se o
 * socket cair de um jeito que o próprio Pusher não reporte.
 */
const RECONCILE_INTERVAL_MS = 20_000;

/** De quanto em quanto tempo renovamos a presença. */
const HEARTBEAT_INTERVAL_MS = 45_000;

interface IncomingState extends Partial<RoomSnapshot> {
  version: number;
  serverNow: string;
  truncated?: boolean;
}

export interface UseRoomStateResult {
  snapshot: RoomSnapshot | null;
  /** Id do participante que é *você* nesta sala. */
  meId: string | null;
  /** Seu próprio voto — visível para você mesmo antes da revelação. */
  myVote: string | null;
  setMyVote: (value: string | null) => void;
  isLoading: boolean;
  /**
   * Código estável do erro ("notFound" | "expired" | "generic"), não uma frase
   * pronta: quem traduz é a tela, no idioma ativo.
   */
  error: string | null;
  /** true quando as cartas já viraram de fato (revealAt no passado). */
  revealed: boolean;
  /** 3, 2, 1 durante a contagem regressiva; null fora dela. */
  countdown: number | null;
  /** Segundos decorridos na rodada, derivados do relógio do servidor. */
  elapsedSeconds: number;
  refresh: () => Promise<void>;
  /**
   * Aplica um snapshot que veio na resposta de uma mutação. Evita o GET extra
   * que dobrava a latência percebida de cada ação.
   */
  applySnapshot: (snapshot: RoomSnapshot) => void;
  /**
   * Inicia a contagem regressiva localmente, no clique, sem esperar o servidor.
   * O `revealAt` autoritativo substitui este assim que a resposta chega.
   */
  beginLocalReveal: () => void;
  /**
   * Trata a rodada atual como encerrada já no clique de "Nova rodada", sem
   * esperar a história nova chegar. Passe `null` para desfazer, se o servidor
   * recusar.
   */
  beginLocalReset: (storyId: string | null) => void;
}

/**
 * Assina o estado da sala.
 *
 * O modelo é *snapshot versionado*: o servidor manda o estado inteiro com um
 * número de versão, e aplicamos apenas o que for mais novo que o já aplicado.
 * Isso torna o cliente imune a evento duplicado, fora de ordem ou perdido — as
 * três coisas que faziam a mesa dessincronizar antes.
 */
export function useRoomState(roomId: string): UseRoomStateResult {
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [meId, setMeId] = useState<string | null>(null);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Quando o usuário acabou de clicar numa carta, a resposta do GET pode estar
   * em voo e chegar com o valor anterior. Este selo guarda o instante da última
   * escolha local para que uma reconciliação atrasada não desfaça o clique.
   */
  const localVoteAtRef = useRef(0);

  /** Última versão aplicada — o portão que descarta snapshots atrasados. */
  const versionRef = useRef(-1);

  /** serverNow − clientNow, para converter revealAt em tempo local confiável. */
  const clockOffsetRef = useRef(0);

  /** Força re-render a cada tick para o cronômetro e a contagem regressiva. */
  const [, setTick] = useState(0);

  /**
   * Menor dígito já exibido nesta contagem. A contagem regressiva é monotônica
   * por definição — se uma correção de relógio a empurrasse para cima, o
   * usuário veria "3, 2, 1, 2, 1". Esta trava garante que ela só desça.
   */
  const countdownFloorRef = useRef<number | null>(null);

  /** Id da história aplicada por último, para detectar troca de rodada. */
  const storyIdRef = useRef<string | null>(null);

  /**
   * Contagem regressiva iniciada no clique, antes da confirmação do servidor.
   * Sem isto, quem apertou "Revelar" ficava olhando uma tela parada durante
   * todo o round-trip e só então via o 3-2-1 — que já vinha pela metade.
   */
  const [localRevealAt, setLocalRevealAt] = useState<number | null>(null);

  /**
   * Id da história que acabou de ser resetada localmente. Enquanto o snapshot
   * ainda for dessa história, a mesa é exibida limpa — o painel de resultado
   * sumia só quando a história nova chegava, o que dava quase dois segundos de
   * tela parada depois do clique.
   */
  const [resetStoryId, setResetStoryId] = useState<string | null>(null);

  const applySnapshot = useCallback((incoming: RoomSnapshot) => {
    if (incoming.version <= versionRef.current) return;

    versionRef.current = incoming.version;
    clockOffsetRef.current =
      new Date(incoming.serverNow).getTime() - Date.now();

    // Rodada nova (reset, ou outra tarefa foi para a mesa): a carta escolhida
    // na rodada anterior não vale mais. Sem isto, quem *não* apertou "Nova
    // rodada" continuaria vendo a própria carta acesa numa mesa já limpa.
    const incomingStoryId = incoming.story?.id ?? null;
    if (storyIdRef.current !== null && storyIdRef.current !== incomingStoryId) {
      setMyVote(null);
      localVoteAtRef.current = 0;
    }
    if (storyIdRef.current !== incomingStoryId) {
      setLocalRevealAt(null);
      countdownFloorRef.current = null;
    }
    storyIdRef.current = incomingStoryId;

    // O servidor já decidiu o instante da virada: ele manda no assunto.
    if (incoming.story?.revealAt) setLocalRevealAt(null);

    setSnapshot(incoming);
  }, []);

  const beginLocalReveal = useCallback(() => {
    setLocalRevealAt(Date.now() + REVEAL_COUNTDOWN_MS);
  }, []);

  const beginLocalReset = useCallback((storyId: string | null) => {
    setResetStoryId(storyId);
    setLocalRevealAt(null);
    countdownFloorRef.current = null;
  }, []);

  const refresh = useCallback(async () => {
    try {
      const response = await apiFetch(`/api/rooms/${roomId}/state`);

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setError(payload?.code ?? "generic");
        return;
      }

      const data = await response.json();
      if (data?.snapshot) applySnapshot(data.snapshot as RoomSnapshot);
      if (data?.you !== undefined) setMeId(data.you);

      // Só adota o voto do servidor se nenhuma escolha local aconteceu
      // enquanto esta requisição estava em voo.
      if (Date.now() - localVoteAtRef.current > 2000) {
        setMyVote(data?.yourVote ?? null);
      }

      setError(null);
    } catch {
      // Offline ou requisição abortada: o próximo ciclo tenta de novo.
    } finally {
      setIsLoading(false);
    }
  }, [roomId, applySnapshot]);

  // Assinatura Pusher + reconciliação.
  useEffect(() => {
    if (!roomId) return;

    let disposed = false;
    const channel = pusherClient.subscribe(`room-${roomId}`);

    const onState = (data: IncomingState) => {
      if (disposed) return;

      // Payload grande demais para o canal: veio só a versão, buscamos o resto.
      if (data.truncated || !data.participants) {
        if (data.version > versionRef.current) void refresh();
        return;
      }

      applySnapshot(data as RoomSnapshot);
    };

    channel.bind(ROOM_STATE_EVENT, onState);

    // Reconecta → o estado local pode estar velho, então reconcilia.
    const onConnected = () => void refresh();
    pusherClient.connection.bind("connected", onConnected);

    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    window.addEventListener("online", onConnected);

    void refresh();

    const reconcileTimer = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, RECONCILE_INTERVAL_MS);

    const heartbeatTimer = setInterval(() => {
      void apiFetch(`/api/rooms/${roomId}/heartbeat`, { method: "POST" }).catch(
        () => {}
      );
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      disposed = true;
      clearInterval(reconcileTimer);
      clearInterval(heartbeatTimer);
      channel.unbind(ROOM_STATE_EVENT, onState);
      pusherClient.connection.unbind("connected", onConnected);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("online", onConnected);
      pusherClient.unsubscribe(`room-${roomId}`);
    };
  }, [roomId, refresh, applySnapshot]);

  // Marca offline ao fechar a aba. Ao contrário da versão anterior, isto roda
  // só no unload de verdade — nunca no cleanup de um efeito, que disparava a
  // cada re-render e apagava o participante do banco.
  useEffect(() => {
    if (!roomId) return;

    const handleUnload = () => {
      const payload = JSON.stringify({ clientId: getClientId() });
      navigator.sendBeacon?.(
        `/api/rooms/${roomId}/leave?clientId=${encodeURIComponent(getClientId())}`,
        new Blob([payload], { type: "application/json" })
      );
    };

    window.addEventListener("pagehide", handleUnload);
    return () => window.removeEventListener("pagehide", handleUnload);
  }, [roomId]);

  // Tick de 200ms enquanto há algo animando ou contando.
  const story = snapshot?.story ?? null;
  const needsTick = story !== null || localRevealAt !== null;

  useEffect(() => {
    if (!needsTick) return;
    const timer = setInterval(() => setTick((t) => t + 1), 200);
    return () => clearInterval(timer);
  }, [needsTick]);

  const now = Date.now() + clockOffsetRef.current;

  const { revealed, countdown } = useMemo((): {
    revealed: boolean;
    countdown: number | null;
  } => {
    // Reset otimista: a rodada já acabou aqui, ainda que o servidor não tenha
    // confirmado a história nova.
    if (resetStoryId !== null && story?.id === resetStoryId) {
      return { revealed: false, countdown: null };
    }

    // Contagem otimista: já começou aqui, o servidor ainda não respondeu.
    if (!story?.revealed && localRevealAt !== null) {
      const remaining = localRevealAt - Date.now();
      if (remaining > 0) {
        return {
          revealed: false,
          countdown: Math.max(1, Math.ceil(remaining / REVEAL_STEP_MS)),
        };
      }
      // A contagem local acabou mas o servidor ainda não confirmou: segura em 1
      // em vez de revelar cartas que talvez nem tenham sido gravadas.
      return { revealed: false, countdown: 1 };
    }

    if (!story?.revealed) return { revealed: false, countdown: null };

    if (!story.revealAt) return { revealed: true, countdown: null };

    const revealAt = new Date(story.revealAt).getTime();
    const remaining = revealAt - now;

    if (remaining <= 0) return { revealed: true, countdown: null };

    return {
      revealed: false,
      countdown: Math.max(1, Math.ceil(remaining / REVEAL_STEP_MS)),
    };
  }, [story, now, localRevealAt, resetStoryId]);

  // Aplica a trava de monotonicidade fora do useMemo, para não guardar estado
  // dentro dele.
  let displayedCountdown = countdown;
  if (displayedCountdown === null) {
    countdownFloorRef.current = null;
  } else {
    const floor = countdownFloorRef.current;
    if (floor !== null && displayedCountdown > floor) {
      displayedCountdown = floor;
    } else {
      countdownFloorRef.current = displayedCountdown;
    }
  }

  const elapsedSeconds = useMemo(() => {
    if (!story) return 0;

    const started = new Date(story.startedAt).getTime();

    // O cronômetro conta enquanto a mesa está aberta e congela na revelação,
    // para que o tempo exibido seja o tempo que a rodada de fato levou.
    const until =
      story.revealed && story.revealAt
        ? new Date(story.revealAt).getTime()
        : now;

    return Math.max(0, Math.floor((Math.min(now, until) - started) / 1000));
  }, [story, now]);

  const setMyVoteLocally = useCallback((value: string | null) => {
    localVoteAtRef.current = Date.now();
    setMyVote(value);
  }, []);

  return {
    snapshot,
    meId,
    myVote,
    setMyVote: setMyVoteLocally,
    isLoading,
    error,
    revealed,
    countdown: displayedCountdown,
    elapsedSeconds,
    refresh,
    applySnapshot,
    beginLocalReveal,
    beginLocalReset,
  };
}
