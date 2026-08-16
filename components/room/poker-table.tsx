"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { SnapshotChip, SnapshotParticipant } from "@/types/room-state";

/**
 * A mesa.
 *
 * Os assentos são distribuídos numa elipse com ângulo `90° + i·360°/n`, e a
 * lista é rotacionada para que *você* seja sempre o índice 0 — embaixo ao
 * centro. Isso significa que cada cliente vê a mesa girada de um jeito, o que é
 * exatamente por que as fichas guardam apenas o sorteio do pouso e têm a
 * trajetória recalculada aqui.
 */

const CHIP_COLORS = {
  agree: {
    background: "radial-gradient(circle at 35% 30%, #9fdde6, rgb(92 199 214))",
    ring: "rgba(255,255,255,.6)",
    glow: "rgba(92,199,214,.35)",
    color: "#061418",
  },
  explain: {
    background: "radial-gradient(circle at 35% 30%, #f4f3fa, #b9b8cc)",
    ring: "rgba(7,7,13,.35)",
    glow: "rgba(236,235,245,.35)",
    color: "#12121c",
  },
  risk: {
    background: "radial-gradient(circle at 35% 30%, #ef9dc2, rgb(224 97 155))",
    ring: "rgba(255,255,255,.55)",
    glow: "rgba(224,97,155,.38)",
    color: "#1d0a14",
  },
  call: {
    background: "radial-gradient(circle at 35% 30%, #f2adcd, #ab3d6f)",
    ring: "rgba(255,255,255,.75)",
    glow: "rgba(224,97,155,.45)",
    color: "#fff",
  },
} as const;

const CHIP_LABELS = {
  agree: "OK",
  explain: "?",
  risk: "!",
  call: "CALL",
} as const;

/** Posição do badge e da carta de um assento, em % da mesa. */
function seatPosition(index: number, total: number) {
  const angle = ((90 + (index * 360) / total) * Math.PI) / 180;
  return {
    x: 50 + 40 * Math.cos(angle),
    y: 50 + 37 * Math.sin(angle),
    cardX: 50 + 27 * Math.cos(angle),
    cardY: 50 + 25 * Math.sin(angle),
  };
}

/**
 * Coloca *você* no assento 0 preservando a ordem circular dos demais, para que
 * a vizinhança na mesa seja a mesma para todo mundo.
 */
export function rotateToMe(
  participants: SnapshotParticipant[],
  meId: string | null
) {
  if (!meId) return participants;
  const index = participants.findIndex((p) => p.id === meId);
  if (index <= 0) return participants;
  return [...participants.slice(index), ...participants.slice(0, index)];
}

interface PokerTableProps {
  participants: SnapshotParticipant[];
  chips: SnapshotChip[];
  meId: string | null;
  revealed: boolean;
  countdown: number | null;
  onCall: (targetId: string) => void;
  callHint: string;
  youLabel: string;
}

export function PokerTable({
  participants,
  chips,
  meId,
  revealed,
  countdown,
  onCall,
  callHint,
  youLabel,
}: PokerTableProps) {
  const tableRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 880, height: 520 });
  const [shakenSeat, setShakenSeat] = useState<string | null>(null);

  const seats = useMemo(
    () => rotateToMe(participants, meId),
    [participants, meId]
  );

  const positions = useMemo(() => {
    const map = new Map<string, ReturnType<typeof seatPosition>>();
    seats.forEach((participant, index) => {
      map.set(participant.id, seatPosition(index, seats.length || 1));
    });
    return map;
  }, [seats]);

  // A trajetória da ficha é em px, então precisamos das dimensões reais.
  useEffect(() => {
    const element = tableRef.current;
    if (!element) return;

    const update = () =>
      setSize({ width: element.offsetWidth, height: element.offsetHeight });

    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Quem levou o "pagar pra ver" treme aos 560ms, quando a ficha bate.
  const latestCallId = useRef<string | null>(null);

  useEffect(() => {
    const lastCall = [...chips].reverse().find((chip) => chip.mode === "call");
    if (!lastCall || lastCall.id === latestCallId.current) return;

    latestCallId.current = lastCall.id;

    // Só anima o impacto se a ficha acabou de ser jogada; fichas que já estavam
    // na mesa quando você entrou não devem sacudir ninguém.
    const age = Date.now() - new Date(lastCall.createdAt).getTime();
    if (age > 4000 || !lastCall.targetId) return;

    const targetId = lastCall.targetId;
    const hit = setTimeout(() => setShakenSeat(targetId), 560);
    const release = setTimeout(() => setShakenSeat(null), 1100);

    return () => {
      clearTimeout(hit);
      clearTimeout(release);
    };
  }, [chips]);

  return (
    <div
      ref={tableRef}
      className={cn(
        "relative h-[420px] w-full md:h-[520px]",
        "rounded-[290px/230px] border border-cy/24",
        "bg-[radial-gradient(130%_140%_at_50%_42%,rgb(var(--pa-cy)/.12),rgb(10_10_18/0)_60%),linear-gradient(180deg,#0b0c16,#08090f)]",
        "shadow-[inset_0_0_80px_rgb(var(--pa-cy)/.05),0_30px_80px_rgba(0,0,0,.55)]"
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[26px] rounded-[270px/210px] border border-dashed border-pa-text/[.07]"
      />

      {/* Cartas — camada abaixo dos badges. */}
      {seats.map((participant) => {
        const position = positions.get(participant.id)!;
        const isMe = participant.id === meId;
        const state = !participant.hasVoted
          ? "empty"
          : revealed
            ? isMe
              ? "mine"
              : "front"
            : "back";

        const face =
          state === "back" ? "◆" : state === "empty" ? "·" : participant.vote;

        return (
          <div
            key={`card-${participant.id}`}
            className={cn(
              "absolute z-[3] flex h-[78px] w-[56px] -translate-x-1/2 -translate-y-1/2 items-center justify-center",
              "select-none rounded-lg font-display text-[20px] font-bold transition-all duration-200",
              state === "back" &&
                "border border-cy/40 bg-card-back text-cy/55 shadow-[0_10px_26px_rgba(0,0,0,.5)]",
              state === "empty" &&
                "border border-dashed border-pa-text/14 bg-pa-text/[.03] text-pa-text/20",
              state === "front" &&
                "animate-flip border border-cy bg-[linear-gradient(180deg,rgb(var(--pa-cy)/.14),rgb(10_10_20/.92))] text-pa-text shadow-[0_12px_30px_rgba(0,0,0,.5),0_0_14px_rgb(var(--pa-cy)/.16)]",
              state === "mine" &&
                "animate-flip border border-mg bg-[linear-gradient(180deg,rgb(var(--pa-mg)/.18),rgb(10_10_20/.9))] text-white shadow-[0_12px_30px_rgba(0,0,0,.5),0_0_16px_rgb(var(--pa-mg)/.2)]"
            )}
            style={{ left: `${position.cardX}%`, top: `${position.cardY}%` }}
          >
            {face}
          </div>
        );
      })}

      {/* Fichas apostadas. */}
      {chips.map((chip) => {
        const from = positions.get(chip.authorId);
        const target = chip.targetId ? positions.get(chip.targetId) : null;
        if (!from) return null;

        const isCall = chip.mode === "call";

        // Onde a ficha descansa: no centro para uma reação, ou a 46% do caminho
        // até o alvo para um "pagar pra ver". O jitter vem do servidor, então o
        // ponto final é o mesmo em todas as telas.
        const restX = target
          ? 50 + (target.x - 50) * 0.46 + chip.jitterX
          : 50 + chip.jitterX;
        const restY = target
          ? 50 + (target.y - 50) * 0.46 + chip.jitterY
          : 50 + chip.jitterY;

        const palette = CHIP_COLORS[chip.kind] ?? CHIP_COLORS.explain;
        const diameter = isCall ? 42 : 38;

        // Deslocamentos em px da posição de descanso até a origem e o impacto.
        const fx = ((from.x - restX) / 100) * size.width;
        const fy = ((from.y - restY) / 100) * size.height;
        const hx = target ? ((target.x - restX) / 100) * size.width : 0;
        const hy = target ? ((target.y - restY) / 100) * size.height : 0;

        return (
          <div
            key={chip.id}
            aria-hidden
            className={cn(
              "pointer-events-none absolute z-[8] flex items-center justify-center rounded-full",
              "border-[3px] border-dashed font-display font-bold tracking-[.02em]",
              isCall ? "animate-call text-[10px]" : "animate-land text-[15px]"
            )}
            style={
              {
                left: `${restX}%`,
                top: `${restY}%`,
                width: diameter,
                height: diameter,
                marginLeft: -diameter / 2,
                marginTop: -diameter / 2,
                background: palette.background,
                borderColor: palette.ring,
                color: palette.color,
                boxShadow: `0 0 14px ${palette.glow}, 0 8px 18px rgba(0,0,0,.5)`,
                "--fx": `${fx}px`,
                "--fy": `${fy}px`,
                "--hx": `${hx}px`,
                "--hy": `${hy}px`,
                "--rot": `${chip.rot}deg`,
              } as React.CSSProperties
            }
          >
            {CHIP_LABELS[chip.kind]}
          </div>
        );
      })}

      {/* Badges dos jogadores. */}
      {seats.map((participant) => {
        const position = positions.get(participant.id)!;
        const isMe = participant.id === meId;
        const isShaken = shakenSeat === participant.id;

        return (
          <div
            key={`seat-${participant.id}`}
            className={cn(
              "absolute z-[5] -translate-x-1/2 -translate-y-1/2",
              isShaken && "animate-shake"
            )}
            style={{ left: `${position.x}%`, top: `${position.y}%` }}
          >
            <button
              type="button"
              disabled={isMe}
              onClick={() => !isMe && onCall(participant.id)}
              title={isMe ? undefined : `${callHint} · ${participant.name}`}
              className={cn(
                "flex items-center gap-[7px] rounded-chip px-3 py-[7px] backdrop-blur-[6px]",
                "text-pa-text transition-[border-color,box-shadow] duration-200",
                isMe
                  ? "cursor-default border border-mg/50 bg-mg/12"
                  : "border border-pa-text/12 bg-[rgb(12_13_22/.9)] hover:border-mg hover:shadow-[0_0_20px_rgb(var(--pa-mg)/.35)]",
                isShaken &&
                  "border-mg shadow-[0_0_18px_rgb(var(--pa-mg)/.45)]",
                !participant.isOnline && "opacity-55"
              )}
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
              <span className="whitespace-nowrap text-[15px]">
                {isMe ? youLabel : participant.name}
              </span>
              {participant.callsReceived > 0 ? (
                <span className="pa-numeric whitespace-nowrap text-[13px] text-mg-soft">
                  ×{participant.callsReceived}
                </span>
              ) : null}
            </button>
          </div>
        );
      })}

      {/* Contagem regressiva sincronizada. */}
      {countdown !== null ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-[290px/230px] bg-[rgb(7_7_13/.72)] backdrop-blur-[3px]">
          <span
            key={countdown}
            className="pa-numeric animate-count text-[80px] font-black leading-none text-cy [text-shadow:0_0_34px_rgb(var(--pa-cy)/.3)] md:text-[110px]"
          >
            {countdown}
          </span>
        </div>
      ) : null}
    </div>
  );
}
