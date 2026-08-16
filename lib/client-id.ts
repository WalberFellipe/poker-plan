"use client";

import { CLIENT_ID_HEADER } from "@/types/room-state";

const STORAGE_KEY = "poker:clientId";

/**
 * Id estável deste browser, criado uma vez e reusado para sempre.
 *
 * É a metade cliente da correção do bug de duplicação: como o servidor trata
 * (roomId, clientId) como chave, recarregar a página ou sair e voltar
 * reencontra a mesma cadeira em vez de criar outra pessoa na mesa.
 *
 * Fica em localStorage, não em sessionStorage, justamente para sobreviver a
 * fechar e reabrir a aba.
 */
export function getClientId(): string {
  if (typeof window === "undefined") return "";

  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;

    const generated =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `c-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;

    window.localStorage.setItem(STORAGE_KEY, generated);
    return generated;
  } catch {
    // localStorage bloqueado (modo privado restrito): cai para um id efêmero,
    // que ao menos mantém a identidade estável dentro desta sessão de página.
    return `ephemeral-${Math.random().toString(36).slice(2)}`;
  }
}

/** Nome escolhido pela pessoa, lembrado entre salas para não perguntar de novo. */
export function getStoredName(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem("poker:name") ?? "";
  } catch {
    return "";
  }
}

export function storeName(name: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem("poker:name", name);
  } catch {
    // sem persistência, seguimos em frente
  }
}

/** `fetch` que sempre carrega o id do browser, para o servidor te reconhecer. */
export async function apiFetch(input: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set(CLIENT_ID_HEADER, getClientId());
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(input, { ...init, headers, cache: "no-store" });
}
