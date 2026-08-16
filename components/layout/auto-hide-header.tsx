"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Recolhe o header para devolver altura à mesa.
 *
 * Regras:
 * - Some ao rolar para baixo, volta ao rolar para cima.
 * - Reaparece quando o ponteiro chega perto do topo da janela.
 * - Fica sempre visível no topo da página e enquanto algo dentro dele tiver o
 *   foco do teclado — recolher um header focado deixaria a navegação por Tab
 *   apontando para algo invisível.
 */
const HIDE_AFTER_SCROLL = 80;
const HOVER_ZONE = 72;

export function AutoHideHeader({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const lastScroll = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const goingDown = y > lastScroll.current;
      lastScroll.current = y;

      setHidden(goingDown && y > HIDE_AFTER_SCROLL);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.clientY <= HOVER_ZONE) setHidden(false);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  const visible = !hidden || hasFocus;

  return (
    <>
      {/*
        Faixa invisível colada no topo. Em telas com toque não há ponteiro para
        detectar, então ela também serve de alvo — e o scroll para cima
        continua trazendo o header de volta.
      */}
      <div
        aria-hidden
        className="fixed inset-x-0 top-0 z-[59] h-3"
        onMouseEnter={() => setHidden(false)}
      />

      <div
        onFocusCapture={() => setHasFocus(true)}
        onBlurCapture={() => setHasFocus(false)}
        className={cn(
          "sticky top-0 z-[60] transition-transform duration-300 ease-out",
          visible ? "translate-y-0" : "-translate-y-full"
        )}
      >
        {children}
      </div>
    </>
  );
}
