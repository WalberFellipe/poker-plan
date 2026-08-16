"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const STORAGE_KEY = "poker:lastRoomId";

/**
 * A sala em que a pessoa está — ou a última em que esteve.
 *
 * Baralhos e Integrações não têm `roomId` na rota, mas continuam sendo telas de
 * dentro do app. Sem lembrar a sala, as abas Mesa/Tarefas/Estimativas
 * simplesmente sumiam do header ao navegar para lá, e não havia caminho de
 * volta para a mesa a não ser o histórico do browser.
 */
export function useLastRoom(): string | null {
  const params = useParams();
  const routeRoomId =
    typeof params?.roomId === "string" ? params.roomId : null;

  const [remembered, setRemembered] = useState<string | null>(null);

  useEffect(() => {
    if (routeRoomId) {
      try {
        window.localStorage.setItem(STORAGE_KEY, routeRoomId);
      } catch {
        // sem persistência, seguimos com a sala da rota
      }
      setRemembered(routeRoomId);
      return;
    }

    try {
      setRemembered(window.localStorage.getItem(STORAGE_KEY));
    } catch {
      setRemembered(null);
    }
  }, [routeRoomId]);

  return routeRoomId ?? remembered;
}

/** Esquece a sala — usado ao sair dela de propósito. */
export function forgetLastRoom() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // nada a fazer
  }
}
