import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { resolveParticipant } from "@/lib/participant";
import { getAdapter } from "@/lib/integrations/adapters";

/**
 * Escreve os pontos de volta na issue de origem.
 *
 * Só funciona para tarefas que vieram de um board (têm `externalId`) e exige
 * sessão, porque o token da integração pertence a uma conta — um convidado
 * anônimo não tem credencial para escrever no Jira de ninguém.
 */
export async function POST(
  request: Request,
  props: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await props.params;

  try {
    const participant = await resolveParticipant(request, roomId);
    if (!participant) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Entre na sua conta para enviar ao board" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const points = typeof body?.points === "string" ? body.points : null;
    const taskId = typeof body?.taskId === "string" ? body.taskId : null;

    if (!points || !taskId) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const task = await prisma.task.findFirst({ where: { id: taskId, roomId } });

    if (!task?.externalId) {
      return NextResponse.json(
        { error: "Esta tarefa não veio de um board" },
        { status: 400 }
      );
    }

    const integration = await prisma.integration.findUnique({
      where: {
        userId_provider: { userId: session.user.id, provider: task.source },
      },
    });

    const adapter = getAdapter(task.source);

    if (!integration || !adapter) {
      return NextResponse.json(
        { error: "Integração não conectada" },
        { status: 400 }
      );
    }

    await adapter.pushPoints(integration, task.externalId, points);

    await prisma.integration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[push] falha ao enviar pontos", error);
    return NextResponse.json(
      { error: "Não foi possível enviar os pontos" },
      { status: 502 }
    );
  }
}
