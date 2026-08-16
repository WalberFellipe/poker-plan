import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getAdapter } from "@/lib/integrations/adapters";

/** Boards, projetos ou repositórios que o token consegue enxergar. */
export async function GET(
  request: Request,
  props: { params: Promise<{ provider: string }> }
) {
  const { provider } = await props.params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const adapter = getAdapter(provider);
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId: session.user.id, provider } },
  });

  if (!adapter || !integration) {
    return NextResponse.json({ error: "Não conectado" }, { status: 404 });
  }

  try {
    return NextResponse.json(await adapter.listBoards(integration), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error(`[integrations] falha ao listar boards de ${provider}`, error);
    return NextResponse.json(
      { error: "Não foi possível ler os boards" },
      { status: 502 }
    );
  }
}
