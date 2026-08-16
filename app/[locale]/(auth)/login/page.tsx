"use client";

import { Suspense } from "react";
import { signIn } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Github, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Kicker } from "@/components/ui/neon";

/**
 * Erros que o NextAuth devolve na query ao voltar para cá.
 *
 * Sem isto a tela apenas reaparecia depois de um callback falho, sem dizer
 * nada — o sintoma era "clico em entrar e volta para o login".
 */
const ERROR_KEYS: Record<string, string> = {
  Configuration: "errorConfiguration",
  AccessDenied: "errorAccessDenied",
  Verification: "errorVerification",
  OAuthSignin: "errorOAuth",
  OAuthCallback: "errorOAuth",
  OAuthCreateAccount: "errorOAuth",
  Callback: "errorOAuth",
  OAuthAccountNotLinked: "errorAccountNotLinked",
  SessionRequired: "errorSessionRequired",
};

function LoginCard() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const searchParams = useSearchParams();

  const rawError = searchParams?.get("error");
  const errorKey = rawError
    ? (ERROR_KEYS[rawError] ?? "errorDefault")
    : null;

  // Volta para a landing no idioma ativo. Sem o prefixo, o middleware faz um
  // redirect extra logo depois do login.
  const callbackUrl = searchParams?.get("callbackUrl") ?? `/${locale}`;

  return (
    <div className="flex w-full max-w-[420px] flex-col gap-7 rounded-card border border-pa-text/10 bg-pa-text/[.03] p-8">
      <div className="flex flex-col gap-2 text-center">
        <Kicker>{t("kicker")}</Kicker>
        <h1 className="font-display text-[26px] leading-tight text-pa-text">
          {t("welcomeBack")}
        </h1>
        <p className="text-[15px] text-pa-muted">{t("chooseProvider")}</p>
      </div>

      {errorKey ? (
        <p
          role="alert"
          className="rounded-sm border border-mg/40 bg-mg/[.08] px-4 py-3 text-center text-[14px] leading-relaxed text-mg-soft"
        >
          {t(errorKey)}
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        <Button
          variant="secondary"
          size="lg"
          className="w-full"
          onClick={() => signIn("google", { callbackUrl })}
        >
          <Mail className="h-4 w-4" aria-hidden />
          {t("continueWithGoogle")}
        </Button>
        <Button
          variant="secondary"
          size="lg"
          className="w-full"
          onClick={() => signIn("github", { callbackUrl })}
        >
          <Github className="h-4 w-4" aria-hidden />
          {t("continueWithGithub")}
        </Button>
      </div>

      <p className="text-center text-[13px] leading-relaxed text-pa-faint">
        {t("terms")}
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginCard />
    </Suspense>
  );
}
