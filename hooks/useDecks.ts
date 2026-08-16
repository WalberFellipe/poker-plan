"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { BUILTIN_DECKS, type Deck } from "@/lib/decks";

const LOCAL_STORAGE_KEY = "poker:decks";

/**
 * Biblioteca de baralhos.
 *
 * Autenticado, os baralhos customizados vivem no banco; como convidado, em
 * localStorage — assim quem só quer rodar uma sessão rápida também consegue
 * salvar um baralho, sem obrigar login.
 */
export function useDecks() {
  const { data: session, status } = useSession();
  const [custom, setCustom] = useState<Deck[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const readLocal = (): Deck[] => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Deck[]) : [];
    } catch {
      return [];
    }
  };

  const writeLocal = (decks: Deck[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(decks));
    } catch {
      // sem persistência, seguimos em frente
    }
  };

  const load = useCallback(async () => {
    if (status === "loading") return;

    if (session?.user) {
      try {
        const response = await fetch("/api/decks", { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          setCustom(
            (data as { id: string; name: string; values: string[] }[]).map(
              (deck) => ({ ...deck, builtin: false })
            )
          );
        }
      } catch {
        // rede fora: mantém o que já estava em memória
      }
    } else {
      setCustom(readLocal());
    }

    setIsLoading(false);
  }, [session?.user, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveDeck = useCallback(
    async (deck: { id?: string; name: string; values: string[] }) => {
      if (session?.user) {
        const response = await fetch(
          deck.id ? `/api/decks/${deck.id}` : "/api/decks",
          {
            method: deck.id ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: deck.name, values: deck.values }),
          }
        );

        if (!response.ok) return false;
        await load();
        return true;
      }

      const existing = readLocal();
      const next = deck.id
        ? existing.map((item) =>
            item.id === deck.id
              ? { ...item, name: deck.name, values: deck.values }
              : item
          )
        : [
            ...existing,
            {
              id: crypto.randomUUID(),
              name: deck.name,
              values: deck.values,
              builtin: false,
            },
          ];

      writeLocal(next);
      setCustom(next);
      return true;
    },
    [session?.user, load]
  );

  const removeDeck = useCallback(
    async (id: string) => {
      if (session?.user) {
        const response = await fetch(`/api/decks/${id}`, { method: "DELETE" });
        if (!response.ok) return false;
        await load();
        return true;
      }

      const next = readLocal().filter((deck) => deck.id !== id);
      writeLocal(next);
      setCustom(next);
      return true;
    },
    [session?.user, load]
  );

  return {
    decks: [...BUILTIN_DECKS, ...custom],
    customDecks: custom,
    isLoading,
    saveDeck,
    removeDeck,
    reload: load,
  };
}
