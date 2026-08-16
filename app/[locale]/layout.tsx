import { Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/app/providers/auth-provider";
import { Header } from "@/components/layout/header";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/react";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/src/i18n/routing";
import { hasLocale } from "next-intl";

/**
 * Uma única família: Source Serif 4 no corpo e, em 700, também no chrome.
 *
 * O handoff chegou a comparar uma alternativa futurista para os títulos e
 * escolheu a serifa — o peso e o `letter-spacing` já dão a diferença de
 * hierarquia sem precisar de uma segunda fonte. O chrome lê `--pa-display`
 * (definida em globals.css), então trocar de família depois é uma linha.
 */
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-source-serif",
  display: "swap",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  let messages;
  try {
    messages = (await import(`@/messages/${locale}.json`)).default;
  } catch {
    notFound();
  }

  return (
    // A variável da fonte vai no <html>, não no <body>: `--pa-display` é
    // declarada em `:root` e precisa enxergar `--font-source-serif` no mesmo
    // escopo. No <body>, ela resolveria vazio e todo o `font-display` do app
    // viraria um no-op silencioso — funcionando só por herança.
    <html
      lang={locale}
      className={sourceSerif.variable}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
            </div>
            <Analytics />
          </AuthProvider>
        </NextIntlClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
