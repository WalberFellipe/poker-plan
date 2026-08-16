import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { PROVIDERS, isProviderConfigured } from "@/lib/integrations/providers";

/**
 * Resumo das integrações para o usuário atual.
 *
 * Nunca devolve token: só o suficiente para a interface decidir entre
 * "Conectar", "Desconectar" e "indisponível neste deploy".
 */
export async function GET() {
  const session = await getServerSession(authOptions);

  const connections = session?.user?.id
    ? await prisma.integration.findMany({
        where: { userId: session.user.id },
      })
    : [];

  const summaries = PROVIDERS.map((provider) => {
    const connection = connections.find((item) => item.provider === provider.id);

    return {
      id: provider.id,
      mark: provider.mark,
      authStyle: provider.authStyle,
      canPushPoints: provider.canPushPoints,
      scopes: provider.scopes,
      configured: isProviderConfigured(provider),
      connected: Boolean(connection),
      workspace: connection?.workspace ?? null,
      board: connection?.board ?? null,
      boardId: connection?.boardId ?? null,
      lastSyncAt: connection?.lastSyncAt?.toISOString() ?? null,
    };
  });

  return NextResponse.json(summaries, {
    headers: { "Cache-Control": "no-store" },
  });
}
