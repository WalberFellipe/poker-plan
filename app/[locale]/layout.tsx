import localFont from "next/font/local";
import "./globals.css";
import { Providers } from '@/app/providers'
import { AuthProvider } from '@/app/providers/auth-provider'
import { Header } from '@/components/layout/header'
import { Toaster } from "@/components/ui/toaster"
import { Analytics } from "@vercel/analytics/react";
import { NextIntlClientProvider } from 'next-intl';
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation';
import { routing } from '@/src/i18n/routing';
import { hasLocale } from 'next-intl';

const geistSans = localFont({
  src: [
    { path: "../fonts/Geist/Geist-Thin.woff2", weight: "100", style: "normal" },
    { path: "../fonts/Geist/Geist-ExtraLight.woff2", weight: "200", style: "normal" },
    { path: "../fonts/Geist/Geist-Light.woff2", weight: "300", style: "normal" },
    { path: "../fonts/Geist/Geist-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/Geist/Geist-Medium.woff2", weight: "500", style: "normal" },
    { path: "../fonts/Geist/Geist-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../fonts/Geist/Geist-Bold.woff2", weight: "700", style: "normal" },
    { path: "../fonts/Geist/Geist-ExtraBold.woff2", weight: "800", style: "normal" },
    { path: "../fonts/Geist/Geist-Black.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-Geist-sans",
  display: "swap",
});

const GeistMono = localFont({
  src: [
    {
      path: "../fonts/GeistMono/GeistMono-Thin.woff2",
      weight: "100",
      style: "normal",
    },
    {
      path: "../fonts/GeistMono/GeistMono-ExtraLight.woff2",
      weight: "200",
      style: "normal",
    },
    {
      path: "../fonts/GeistMono/GeistMono-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../fonts/GeistMono/GeistMono-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/GeistMono/GeistMono-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/GeistMono/GeistMono-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/GeistMono/GeistMono-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../fonts/GeistMono/GeistMono-ExtraBold.woff2",
      weight: "800",
      style: "normal",
    },
    {
      path: "../fonts/GeistMono/GeistMono-Black.woff2",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-Geist-mono",
  display: "swap",
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' })
  return {
    title: t('title'),
    description: t('description'),
  }
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
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${GeistMono.variable} antialiased`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>
            <Providers>
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1">
                  {children}
                  <Analytics />
                </main>
              </div>
            </Providers>
          </AuthProvider>
        </NextIntlClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
