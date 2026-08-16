"use client";

import { useCallback, useRef, useState } from "react";
import { useRoomState } from "@/hooks/useRoomState";
import { useToast } from "@/hooks/useToast";
import { apiFetch, getStoredName, storeName } from "@/lib/client-id";
import type { ChipKind, TaskSource } from "@/types/room-state";

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

/**
 * Estado da sala + ações.
 *
 * Toda ação faz a mutação no servidor e deixa o snapshot resultante corrigir a
 * UI. A única exceção é a própria carta escolhida, que é otimista para o clique
 * parecer instantâneo — e com rollback explícito se o servidor recusar, em vez
 * de ficar mostrando um voto que nunca foi gravado.
 */
export function useRoom(roomId: string) {
  const state = useRoomState(roomId);
  const { toast } = useToast();
  const [isBusy, setIsBusy] = useState(false);
  const joinedRef = useRef(false);

  const { snapshot, refresh, setMyVote, myVote } = state;
  const storyId = snapshot?.story?.id ?? null;

  const fail = useCallback(
    (message: string) => {
      toast({ variant: "destructive", description: message });
    },
    [toast]
  );

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
      await refresh();
      return true;
    },
    [roomId, refresh, fail]
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
      } catch {
        setMyVote(previous);
        fail("Sem conexão. Seu voto não foi registrado.");
      }
    },
    [storyId, myVote, setMyVote, fail, refresh]
  );

  const reveal = useCallback(async () => {
    if (!storyId || isBusy) return;
    setIsBusy(true);

    try {
      const response = await apiFetch(`/api/stories/${storyId}/reveal`, {
        method: "POST",
      });
      if (!response.ok) fail("Não foi possível revelar os votos");
      await refresh();
    } finally {
      setIsBusy(false);
    }
  }, [storyId, isBusy, fail, refresh]);

  const reset = useCallback(async () => {
    if (!storyId || isBusy) return;
    setIsBusy(true);

    try {
      const response = await apiFetch(`/api/stories/${storyId}/reset`, {
        method: "POST",
      });
      if (!response.ok) fail("Não foi possível abrir uma nova rodada");
      setMyVote(null);
      await refresh();
    } finally {
      setIsBusy(false);
    }
  }, [storyId, isBusy, fail, refresh, setMyVote]);

  const throwChip = useCallback(
    async (chip: ChipThrow) => {
      const response = await apiFetch(`/api/rooms/${roomId}/chips`, {
        method: "POST",
        body: JSON.stringify({
          ...chip,
          mode: chip.targetId ? "call" : "land",
        }),
      });

      if (!response.ok) fail("Não foi possível apostar a ficha");
    },
    [roomId, fail]
  );

  const acceptEstimate = useCallback(
    async (points?: string) => {
      if (isBusy) return;
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
        await refresh();
        return true;
      } finally {
        setIsBusy(false);
      }
    },
    [roomId, isBusy, fail, refresh, setMyVote]
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

      await refresh();
      return true;
    },
    [roomId, fail, refresh]
  );

  const removeTask = useCallback(
    async (taskId: string) => {
      const response = await apiFetch(`/api/rooms/${roomId}/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (!response.ok) fail("Não foi possível remover a tarefa");
      await refresh();
    },
    [roomId, fail, refresh]
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
      await refresh();
    },
    [roomId, fail, refresh, setMyVote]
  );

  return {
    ...state,
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
