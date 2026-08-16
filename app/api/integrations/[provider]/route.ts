import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getAdapter } from "@/lib/integrations/adapters";

/** Escolhe o board ativo da integração, ou registra uma sincronização. */
export async function PATCH(
  request: Request,
  props: { params: Promise<{ provider: string }> }
) {
  const { provider } = await props.params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId: session.user.id, provider } },
  });

  if (!integration) {
    return NextResponse.json({ error: "Não conectado" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));

  try {
    if (body?.sync) {
      // "Sincronizar agora" apenas confirma que o token ainda funciona e
      // carimba a data — a leitura das issues é feita sob demanda.
      const adapter = getAdapter(provider);
      if (adapter) await adapter.listBoards(integration);

      await prisma.integration.update({
        where: { id: integration.id },
        data: { lastSyncAt: new Date() },
      });

      return NextResponse.json({ success: true });
    }

    if (typeof body?.boardId === "string") {
      await prisma.integration.update({
        where: { id: integration.id },
        data: {
          boardId: body.boardId,
          board: typeof body.board === "string" ? body.board : body.boardId,
          lastSyncAt: new Date(),
        },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Nada a atualizar" }, { status: 400 });
  } catch (error) {
    console.error(`[integrations] falha ao atualizar ${provider}`, error);
    return NextResponse.json(
      { error: "Não foi possível falar com o provedor" },
      { status: 502 }
    );
  }
}

/** Desconectar: apaga o token guardado. */
export async function DELETE(
  request: Request,
  props: { params: Promise<{ provider: string }> }
) {
  const { provider } = await props.params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  await prisma.integration.deleteMany({
    where: { userId: session.user.id, provider },
  });

  return NextResponse.json({ success: true });
}
