"use client";

import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useParams, useSelectedLayoutSegments } from "next/navigation";
import Image from "next/image";
import { LogOut, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Link } from "@/src/i18n/navigation";
import { cn } from "@/lib/utils";

const MARKETING_LINKS = [
  { href: "/#produto", key: "product" },
  { href: "/#recursos", key: "features" },
  { href: "/#metodo", key: "method" },
  { href: "/#faq", key: "faq" },
] as const;

/**
 * Header persistente.
 *
 * Na landing mostra os links de marketing; dentro do app troca para as abas
 * Mesa · Tarefas · Baralhos · Estimativas · Integrações. As três primeiras são
 * escopadas por sala, então só aparecem quando há um `roomId` na rota.
 */
export function Header() {
  const { data: session, status } = useSession();
  const t = useTranslations("nav");
  const tAuth = useTranslations("auth");
  const segments = useSelectedLayoutSegments();
  const params = useParams();

  const roomId = typeof params?.roomId === "string" ? params.roomId : null;
  const inApp = segments[0] === "room" || segments[0] === "decks" || segments[0] === "integrations";

  const tabs = [
    roomId && { href: `/room/${roomId}`, label: t("tabs.table"), active: segments[0] === "room" && segments.length <= 2 },
    roomId && { href: `/room/${roomId}/tasks`, label: t("tabs.tasks"), active: segments.includes("tasks") },
    { href: "/decks", label: t("tabs.decks"), active: segments[0] === "decks" },
    roomId && {
      href: `/room/${roomId}/estimates`,
      label: t("tabs.estimates"),
      active: segments.includes("estimates"),
    },
    { href: "/integrations", label: t("tabs.integrations"), active: segments[0] === "integrations" },
  ].filter(Boolean) as { href: string; label: string; active: boolean }[];

  return (
    <header className="sticky top-0 z-[60] flex flex-wrap items-center gap-6 border-b border-pa-text/[.07] bg-[rgb(7_7_13/.86)] px-5 py-3.5 backdrop-blur-[14px] md:px-10">
      <Link
        href="/"
        className="flex shrink-0 items-baseline gap-px font-display text-[19px] font-black tracking-[.02em]"
      >
        <span className="text-cy pa-text-glow-cy">{t("brandFirst")}</span>
        <span className="text-pa-text">{t("brandSecond")}</span>
      </Link>

      {inApp ? (
        <nav className="flex flex-1 flex-wrap items-center gap-1.5" aria-label="Seções">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={tab.active ? "page" : undefined}
              className={cn(
                "rounded-sm border px-3 py-1.5 font-display text-[10px] font-medium uppercase tracking-[.14em] transition-colors",
                tab.active
                  ? "border-cy/45 bg-cy/12 text-cy"
                  : "border-transparent text-pa-dim hover:text-pa-text"
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      ) : (
        <nav
          className="hidden flex-1 items-center gap-6 md:flex"
          aria-label="Principal"
        >
          {MARKETING_LINKS.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className="font-display text-[10px] uppercase tracking-[.14em] text-pa-dim transition-colors hover:text-pa-text"
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>
      )}

      <div className="ml-auto flex shrink-0 items-center gap-3">
        {status === "authenticated" && session?.user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-sm border border-pa-text/14 px-2.5 py-1.5 text-[13px] text-pa-muted transition-colors hover:border-cy/40 hover:text-pa-text"
              >
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt=""
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                ) : (
                  <User className="h-4 w-4" aria-hidden />
                )}
                <span className="hidden max-w-[14ch] truncate sm:inline">
                  {session.user.name}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="border-cy/24 bg-pa-elevated text-pa-text"
            >
              <DropdownMenuItem
                onClick={() => signOut()}
                className="gap-2 text-[14px] focus:bg-cy/10 focus:text-pa-text"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                {tAuth("signOut")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link
            href="/login"
            className="font-display text-[10px] uppercase tracking-[.14em] text-pa-dim transition-colors hover:text-pa-text"
          >
            {t("signIn")}
          </Link>
        )}

        <Button asChild size="sm">
          <Link href="/room/create">{t("newRoom")}</Link>
        </Button>

        <LanguageSwitcher />
      </div>
    </header>
  );
}
