import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getAdapter } from "@/lib/integrations/adapters";

/** Issues abertas do board escolhido. */
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
    const issues = await adapter.listIssues(integration);
    return NextResponse.json(issues, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error(`[integrations] falha ao listar issues de ${provider}`, error);
    return NextResponse.json(
      { error: "Não foi possível ler o board" },
      { status: 502 }
    );
  }
}
