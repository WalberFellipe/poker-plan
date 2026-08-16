"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRoomState } from "@/hooks/useRoomState";
import { useToast } from "@/hooks/useToast";
import { apiFetch, getStoredName, storeName } from "@/lib/client-id";
import type {
  ChipKind,
  RoomSnapshot,
  SnapshotChip,
  TaskSource,
} from "@/types/room-state";

export interface ChipThrow {
  kind: ChipKind;
  targetId?: string | null;
  jitterX: number;
  jitterY: number;
  rot: number;
}

export interface NewTaskInput {
  key?: string;
  title: string;
  source?: TaskSource;
  type?: string | null;
  externalId?: string | null;
  externalUrl?: string | null;
}

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `chip-${Math.random().toString(36).slice(2)}`;
}

/**
 * Estado da sala + ações.
 *
 * Duas regras de latência, porque o banco fica atrás de um proxy e cada query
 * custa uma ida à rede:
 *
 * 1. Nada espera o servidor para aparecer na tela. Carta, ficha e contagem
 *    regressiva são desenhadas no clique e reconciliadas depois — com rollback
 *    explícito quando o servidor recusa.
 * 2. Nenhuma ação faz um GET depois da mutação. A própria resposta já traz o
 *    snapshot novo, e é ele que é aplicado.
 */
export function useRoom(roomId: string) {
  const state = useRoomState(roomId);
  const { toast } = useToast();
  const [isBusy, setIsBusy] = useState(false);
  const joinedRef = useRef(false);

  /** Fichas desenhadas localmente, ainda não confirmadas pelo servidor. */
  const [pendingChips, setPendingChips] = useState<SnapshotChip[]>([]);

  const {
    snapshot,
    refresh,
    setMyVote,
    myVote,
    meId,
    applySnapshot,
    beginLocalReveal,
    beginLocalReset,
  } = state;

  const storyId = snapshot?.story?.id ?? null;

  const fail = useCallback(
    (message: string) => {
      toast({ variant: "destructive", description: message });
    },
    [toast]
  );

  /** Aplica o snapshot devolvido pela mutação, quando houver. */
  const applyResponse = useCallback(
    async (response: Response) => {
      const payload = await response.json().catch(() => null);
      if (payload?.snapshot) applySnapshot(payload.snapshot as RoomSnapshot);
      return payload;
    },
    [applySnapshot]
  );

  /**
   * As fichas confirmadas chegam pelo snapshot; as otimistas ficam visíveis até
   * que o mesmo id apareça lá. Como o id é gerado aqui e enviado ao servidor, a
   * troca é invisível — a ficha não pisca nem duplica.
   */
  const chips = useMemo(() => {
    const confirmed = snapshot?.chips ?? [];
    const confirmedIds = new Set(confirmed.map((chip) => chip.id));
    return [
      ...confirmed,
      ...pendingChips.filter((chip) => !confirmedIds.has(chip.id)),
    ];
  }, [snapshot?.chips, pendingChips]);

  /** Entra na sala. Seguro chamar em toda montagem: é idempotente no servidor. */
  const join = useCallback(
    async (name?: string) => {
      const chosen = name?.trim() || getStoredName();
      if (chosen) storeName(chosen);

      const response = await apiFetch(`/api/rooms/${roomId}/join`, {
        method: "POST",
        body: JSON.stringify({ name: chosen || undefined }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        fail(payload?.error ?? "Não foi possível entrar na sala");
        return false;
      }

      joinedRef.current = true;
      await applyResponse(response);
      // O join também descobre *qual* participante somos, e isso só vem no GET.
      await refresh();
      return true;
    },
    [roomId, fail, applyResponse, refresh]
  );

  const selectCard = useCallback(
    async (value: string) => {
      if (!storyId) return;

      const previous = myVote;
      // Clicar de novo na mesma carta desmarca.
      const next = previous === value ? null : value;

      setMyVote(next);

      try {
        const response = next
          ? await apiFetch(`/api/stories/${storyId}/votes`, {
              method: "POST",
              body: JSON.stringify({ value: next, name: getStoredName() }),
            })
          : await apiFetch(`/api/stories/${storyId}/votes`, { method: "DELETE" });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          // Rollback: nada de manter na tela um voto que o servidor recusou.
          setMyVote(previous);
          fail(payload?.error ?? "Seu voto não foi registrado. Tente de novo.");
          await refresh();
          return;
        }

        await applyResponse(response);
      } catch {
        setMyVote(previous);
        fail("Sem conexão. Seu voto não foi registrado.");
      }
    },
    [storyId, myVote, setMyVote, fail, refresh, applyResponse]
  );

  const reveal = useCallback(async () => {
    if (!storyId || isBusy) return;

    setIsBusy(true);
    // A contagem começa agora, não quando o servidor responder.
    const clickedAt = Date.now();
    beginLocalReveal();

    try {
      const response = await apiFetch(`/api/stories/${storyId}/reveal`, {
        method: "POST",
        // Ancora a contagem no clique: sem isto o revealAt autoritativo cairia
        // depois do previsto e a contagem pularia para trás ao ser corrigida.
        body: JSON.stringify({ clientNow: clickedAt }),
      });

      if (!response.ok) {
        fail("Não foi possível revelar os votos");
        await refresh();
        return;
      }

      await applyResponse(response);
    } finally {
      setIsBusy(false);
    }
  }, [storyId, isBusy, fail, refresh, applyResponse, beginLocalReveal]);

  const reset = useCallback(async () => {
    if (!storyId || isBusy) return;

    setIsBusy(true);
    // Limpa a mesa no clique: carta, fichas e resultado somem imediatamente.
    setMyVote(null);
    setPendingChips([]);
    beginLocalReset(storyId);

    try {
      const response = await apiFetch(`/api/stories/${storyId}/reset`, {
        method: "POST",
      });

      if (!response.ok) {
        // Desfaz a limpeza otimista: a rodada continua como estava.
        beginLocalReset(null);
        fail("Não foi possível abrir uma nova rodada");
        await refresh();
        return;
      }

      await applyResponse(response);
    } finally {
      setIsBusy(false);
    }
  }, [storyId, isBusy, fail, refresh, applyResponse, setMyVote, beginLocalReset]);

  const throwChip = useCallback(
    async (chip: ChipThrow) => {
      if (!meId) return;

      const id = newId();

      // A ficha aparece na mesa imediatamente; o servidor só confirma depois.
      const optimistic: SnapshotChip = {
        id,
        authorId: meId,
        targetId: chip.targetId ?? null,
        kind: chip.kind,
        mode: chip.targetId ? "call" : "land",
        jitterX: chip.jitterX,
        jitterY: chip.jitterY,
        rot: chip.rot,
        createdAt: new Date().toISOString(),
      };

      setPendingChips((current) => [...current, optimistic]);

      try {
        const response = await apiFetch(`/api/rooms/${roomId}/chips`, {
          method: "POST",
          body: JSON.stringify({ ...optimistic, id }),
        });

        if (!response.ok) {
          setPendingChips((current) => current.filter((c) => c.id !== id));
          fail("Não foi possível apostar a ficha");
          return;
        }

        await applyResponse(response);
      } catch {
        setPendingChips((current) => current.filter((c) => c.id !== id));
        fail("Sem conexão. A ficha não foi apostada.");
      }
    },
    [roomId, meId, fail, applyResponse]
  );

  const acceptEstimate = useCallback(
    async (points?: string) => {
      if (isBusy) return false;
      setIsBusy(true);

      try {
        const response = await apiFetch(`/api/rooms/${roomId}/accept`, {
          method: "POST",
          body: JSON.stringify({ points }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          fail(payload?.error ?? "Não foi possível aceitar a estimativa");
          return false;
        }

        setMyVote(null);
        setPendingChips([]);
        beginLocalReset(storyId);
        await applyResponse(response);
        return true;
      } finally {
        setIsBusy(false);
      }
    },
    [roomId, storyId, isBusy, fail, applyResponse, setMyVote, beginLocalReset]
  );

  const addTasks = useCallback(
    async (tasks: NewTaskInput[]) => {
      if (tasks.length === 0) return false;

      const response = await apiFetch(`/api/rooms/${roomId}/tasks`, {
        method: "POST",
        body: JSON.stringify({ tasks }),
      });

      if (!response.ok) {
        fail("Não foi possível adicionar as tarefas");
        return false;
      }

      await applyResponse(response);
      return true;
    },
    [roomId, fail, applyResponse]
  );

  const removeTask = useCallback(
    async (taskId: string) => {
      const response = await apiFetch(`/api/rooms/${roomId}/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        fail("Não foi possível remover a tarefa");
        return;
      }

      await applyResponse(response);
    },
    [roomId, fail, applyResponse]
  );

  const promoteTask = useCallback(
    async (taskId: string) => {
      const response = await apiFetch(`/api/rooms/${roomId}/tasks/${taskId}`, {
        method: "PATCH",
      });

      if (!response.ok) {
        fail("Não foi possível colocar a tarefa na mesa");
        return;
      }

      setMyVote(null);
      setPendingChips([]);
      await applyResponse(response);
    },
    [roomId, fail, applyResponse, setMyVote]
  );

  return {
    ...state,
    chips,
    isBusy,
    hasJoined: joinedRef.current,
    join,
    selectCard,
    reveal,
    reset,
    throwChip,
    acceptEstimate,
    addTasks,
    removeTask,
    promoteTask,
  };
}
