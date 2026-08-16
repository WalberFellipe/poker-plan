import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdapter } from "@/lib/integrations/adapters";
import { getProvider, isProviderConfigured } from "@/lib/integrations/providers";
import { signState } from "@/lib/integrations/crypto";

/** Início do OAuth: manda o usuário para a tela de consentimento do provedor. */
export async function GET(
  request: Request,
  props: { params: Promise<{ provider: string }> }
) {
  const { provider: providerId } = await props.params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Entre na sua conta" }, { status: 401 });
  }

  const descriptor = getProvider(providerId);
  const adapter = getAdapter(providerId);

  if (!descriptor || !adapter || !isProviderConfigured(descriptor)) {
    return NextResponse.json(
      { error: "Provedor indisponível neste ambiente" },
      { status: 400 }
    );
  }

  // Provedores `token` não têm consentimento para redirecionar: a credencial
  // chega por POST em /api/integrations/[provider].
  if (descriptor.authStyle !== "oauth" || !adapter.authorizeUrl) {
    return NextResponse.json(
      { error: "Este provedor conecta por token, não por OAuth" },
      { status: 400 }
    );
  }

  const url = new URL(request.url);
  const redirectUri = `${url.origin}/api/integrations/${providerId}/callback`;
  const returnTo = url.searchParams.get("returnTo") ?? "/integrations";

  // O state carrega quem iniciou e para onde voltar, assinado para não poder
  // ser forjado por um terceiro que provoque o callback.
  const state = signState(
    JSON.stringify({ userId: session.user.id, returnTo, at: Date.now() })
  );

  return NextResponse.redirect(adapter.authorizeUrl(redirectUri, state));
}
