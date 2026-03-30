"use client"

import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Button } from "@/components/ui/button"
import { useSession, signOut } from "next-auth/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User } from "lucide-react"
import Image from "next/image"
import { useTranslations } from 'next-intl'
import { LanguageSwitcher } from "@/components/layout/language-switcher"
import { Link as I18nLink } from "@/src/i18n/navigation"
import { cn } from "@/lib/utils"

const navKeys = [
  { id: "produto", labelKey: "nav.product" as const },
  { id: "features", labelKey: "nav.features" as const },
  { id: "metodologia", labelKey: "nav.methodology" as const },
  { id: "faq", labelKey: "nav.faq" as const },
]

export function Header() {
  const { data: session, status } = useSession()
  const t = useTranslations()
  const tHome = useTranslations("home")

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 md:gap-6 md:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-6 lg:gap-10">
          <I18nLink
            href="/"
            className="shrink-0 text-lg font-bold tracking-tight text-primary"
          >
            {tHome("brand")}
          </I18nLink>
          <nav className="hidden items-center gap-1 md:flex lg:gap-4" aria-label="Principal">
            {navKeys.map(({ id, labelKey }) => (
              <I18nLink
                key={id}
                href={`/#${id}`}
                className={cn(
                  "whitespace-nowrap rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors",
                  "hover:bg-accent hover:text-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              >
                {tHome(labelKey)}
              </I18nLink>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2 md:gap-3">
          {status === "authenticated" && session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  {session.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || ""}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  {t("auth.loggedInAs")}: {session.user?.email}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()}>
                  {t("auth.signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : status === "loading" ? (
            <span className="hidden text-sm sm:inline">{t("common.loading")}</span>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
                <I18nLink href="/login">{t("auth.signIn")}</I18nLink>
              </Button>
              <Button size="sm" asChild>
                <I18nLink href="/register">{t("auth.signUp")}</I18nLink>
              </Button>
            </div>
          )}
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
