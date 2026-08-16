import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveParticipant } from "@/lib/participant";
import { ensureCurrentStory, publishRoomState } from "@/lib/room-state";
import type { ChipKind, ChipMode } from "@/types/room-state";

const CHIP_KINDS: ChipKind[] = ["agree", "explain", "risk", "call"];
const CHIP_MODES: ChipMode[] = ["land", "call"];

function clamp(value: unknown, min: number, max: number, fallback: number) {
  const n = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.max(min, Math.min(max, n));
}

/**
 * Apostar uma ficha na mesa.
 *
 * Persistimos só o sorteio (jitter do pouso e rotação final): a trajetória é
 * derivada em cada cliente a partir do próprio layout de assentos, já que cada
 * pessoa se vê sentada embaixo ao centro. O resultado é a mesma ficha caindo no
 * mesmo ponto relativo da mesa para todos, saindo da cadeira certa em cada tela.
 */
export async function POST(
  request: Request,
  props: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await props.params;

  try {
    const body = await request.json().catch(() => ({}));

    const kind = body?.kind as ChipKind;
    const mode = body?.mode as ChipMode;

    if (!CHIP_KINDS.includes(kind) || !CHIP_MODES.includes(mode)) {
      return NextResponse.json({ error: "Ficha inválida" }, { status: 400 });
    }

    const author = await resolveParticipant(request, roomId);

    if (!author) {
      return NextResponse.json(
        { error: "Entre na sala antes de apostar" },
        { status: 401 }
      );
    }

    let targetId: string | null = null;

    if (mode === "call") {
      const requestedTarget = body?.targetId;

      if (typeof requestedTarget !== "string" || requestedTarget === author.id) {
        // Não dá para pagar pra ver de si mesmo.
        return NextResponse.json({ error: "Alvo inválido" }, { status: 400 });
      }

      const target = await prisma.participant.findFirst({
        where: { id: requestedTarget, roomId },
        select: { id: true },
      });

      if (!target) {
        return NextResponse.json({ error: "Alvo não encontrado" }, { status: 404 });
      }

      targetId = target.id;
    }

    const story = await ensureCurrentStory(roomId);

    await prisma.chip.create({
      data: {
        roomId,
        storyId: story.id,
        authorId: author.id,
        targetId,
        kind,
        mode,
        jitterX: clamp(body?.jitterX, -20, 20, 0),
        jitterY: clamp(body?.jitterY, -20, 20, 0),
        rot: clamp(body?.rot, -360, 360, 0),
      },
    });

    await publishRoomState(roomId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[chips] erro ao apostar ficha", error);
    return NextResponse.json({ error: "Erro ao apostar ficha" }, { status: 500 });
  }
}
