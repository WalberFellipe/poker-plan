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
 * pessoa se vê sentada embaixo ao centro.
 *
 * O `id` vem do cliente, que já desenhou a ficha localmente antes de chamar
 * esta rota — assim o snapshot que volta substitui a ficha otimista em vez de
 * duplicá-la.
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

    const requestedTarget =
      mode === "call" && typeof body?.targetId === "string"
        ? body.targetId
        : null;

    if (mode === "call" && !requestedTarget) {
      return NextResponse.json({ error: "Alvo inválido" }, { status: 400 });
    }

    // Independentes entre si: buscadas em paralelo para pagar uma latência de
    // rede em vez de três.
    const [author, story, target] = await Promise.all([
      resolveParticipant(request, roomId),
      ensureCurrentStory(roomId),
      requestedTarget
        ? prisma.participant.findFirst({
            where: { id: requestedTarget, roomId },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);

    if (!author) {
      return NextResponse.json(
        { error: "Entre na sala antes de apostar" },
        { status: 401 }
      );
    }

    if (requestedTarget) {
      // Não dá para pagar pra ver de si mesmo.
      if (requestedTarget === author.id) {
        return NextResponse.json({ error: "Alvo inválido" }, { status: 400 });
      }
      if (!target) {
        return NextResponse.json({ error: "Alvo não encontrado" }, { status: 404 });
      }
    }

    await prisma.chip.create({
      data: {
        // Aceita o id proposto pelo cliente, caindo no default do banco quando
        // ausente. É o que casa a ficha otimista com a persistida.
        ...(typeof body?.id === "string" && body.id.length <= 64
          ? { id: body.id }
          : {}),
        roomId,
        storyId: story.id,
        authorId: author.id,
        targetId: target?.id ?? null,
        kind,
        mode,
        jitterX: clamp(body?.jitterX, -20, 20, 0),
        jitterY: clamp(body?.jitterY, -20, 20, 0),
        rot: clamp(body?.rot, -360, 360, 0),
      },
    });

    const snapshot = await publishRoomState(roomId);

    return NextResponse.json({ success: true, snapshot });
  } catch (error) {
    console.error("[chips] erro ao apostar ficha", error);
    return NextResponse.json({ error: "Erro ao apostar ficha" }, { status: 500 });
  }
}
