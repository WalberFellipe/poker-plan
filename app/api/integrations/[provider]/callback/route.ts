import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdapter } from "@/lib/integrations/adapters";
import { encryptToken, verifyState } from "@/lib/integrations/crypto";

/**
 * Volta do OAuth: troca o código por token e guarda a conexão.
 *
 * O `state` é verificado antes de qualquer coisa — ele é o que garante que este
 * callback foi provocado por um fluxo que nós mesmos iniciamos.
 */
export async function GET(
  request: Request,
  props: { params: Promise<{ provider: string }> }
) {
  const { provider: providerId } = await props.params;
  const url = new URL(request.url);

  const adapter = getAdapter(providerId);
  if (!adapter?.exchangeCode) {
    return NextResponse.json(
      { error: "Provedor desconhecido ou sem fluxo OAuth" },
      { status: 400 }
    );
  }

  const state = url.searchParams.get("state");
  const payload = state ? verifyState(state) : null;

  if (!payload) {
    return NextResponse.json({ error: "State inválido" }, { status: 400 });
  }

  const { userId, returnTo } = JSON.parse(payload) as {
    userId: string;
    returnTo: string;
  };

  // O Trello devolve o token no fragmento da URL, que o servidor não enxerga;
  // uma página intermediária o reenvia como `code`.
  const code = url.searchParams.get("code") ?? url.searchParams.get("token");

  if (!code) {
    if (providerId === "trello") {
      return trelloFragmentBridge();
    }
    return NextResponse.json({ error: "Código ausente" }, { status: 400 });
  }

  try {
    const redirectUri = `${url.origin}/api/integrations/${providerId}/callback`;
    const result = await adapter.exchangeCode!(code, redirectUri);

    await prisma.integration.upsert({
      where: { userId_provider: { userId, provider: providerId } },
      update: {
        accessToken: encryptToken(result.accessToken),
        refreshToken: result.refreshToken
          ? encryptToken(result.refreshToken)
          : null,
        expiresAt: result.expiresAt ?? null,
        scope: result.scope ?? null,
        workspace: result.workspace ?? null,
        workspaceId: result.workspaceId ?? null,
      },
      create: {
        userId,
        provider: providerId,
        accessToken: encryptToken(result.accessToken),
        refreshToken: result.refreshToken
          ? encryptToken(result.refreshToken)
          : null,
        expiresAt: result.expiresAt ?? null,
        scope: result.scope ?? null,
        workspace: result.workspace ?? null,
        workspaceId: result.workspaceId ?? null,
      },
    });

    return NextResponse.redirect(
      `${url.origin}${returnTo}?connected=${providerId}`
    );
  } catch (error) {
    console.error(`[integrations] falha ao conectar ${providerId}`, error);
    return NextResponse.redirect(
      `${url.origin}${returnTo}?error=${providerId}`
    );
  }
}

/**
 * O Trello devolve `#token=...` no fragmento, que nunca chega ao servidor.
 * Esta página mínima lê o hash no browser e refaz a chamada como query string.
 */
function trelloFragmentBridge() {
  const html = `<!doctype html><meta charset="utf-8"><title>Trello</title>
<body style="background:#07070d">
<script>
  var hash = new URLSearchParams(location.hash.slice(1));
  var token = hash.get('token');
  var params = new URLSearchParams(location.search);
  if (token) {
    params.set('token', token);
    location.replace(location.pathname + '?' + params.toString());
  } else {
    location.replace('/integrations?error=trello');
  }
</script>
</body>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
