import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from './providers'
import { AuthProvider } from './providers/auth-provider'
import { Header } from '@/components/layout/header'
import { Toaster } from "@/components/ui/toaster"


const geistSans = localFont({
  src: [
    { path: "/fonts/Geist/Geist-Thin.woff2", weight: "100", style: "normal" },
    { path: "/fonts/Geist/Geist-ExtraLight.woff2", weight: "200", style: "normal" },
    { path: "/fonts/Geist/Geist-Light.woff2", weight: "300", style: "normal" },
    { path: "/fonts/Geist/Geist-Regular.woff2", weight: "400", style: "normal" },
    { path: "/fonts/Geist/Geist-Medium.woff2", weight: "500", style: "normal" },
    { path: "/fonts/Geist/Geist-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "/fonts/Geist/Geist-Bold.woff2", weight: "700", style: "normal" },
    { path: "/fonts/Geist/Geist-ExtraBold.woff2", weight: "800", style: "normal" },
    { path: "/fonts/Geist/Geist-Black.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = localFont({
  src: [
    {
      path: "/fonts/GeistMono/GeistMono-Thin.woff2",
      weight: "100",
      style: "normal",
    },
    {
      path: "/fonts/GeistMono/GeistMono-ExtraLight.woff2",
      weight: "200",
      style: "normal",
    },
    {
      path: "/fonts/GeistMono/GeistMono-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "/fonts/GeistMono/GeistMono-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "/fonts/GeistMono/GeistMono-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "/fonts/GeistMono/GeistMono-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "/fonts/GeistMono/GeistMono-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "/fonts/GeistMono/GeistMono-ExtraBold.woff2",
      weight: "800",
      style: "normal",
    },
    {
      path: "/fonts/GeistMono/GeistMono-Black.woff2",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-geist-mono",
  display: "swap",
});


export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <Providers>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-1">
                {children}
              </main>
            </div>
          </Providers>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
