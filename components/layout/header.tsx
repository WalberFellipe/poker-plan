"use client"

import Link from "next/link"
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

export function Header() {
  const { data: session, status } = useSession()
  const t = useTranslations()

  return (
    <header className="border-b w-full">
      <div className="flex h-16 items-center justify-between px-8 w-screen max-w-none">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold">
            Poker Plan
          </Link>
          <nav className="hidden gap-6 md:flex">
            <Link 
              href="/room/create" 
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {t('room.create.title')}
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {status === 'authenticated' && session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
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
                  {t('auth.loggedInAs')}: {session.user?.email}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()}>
                  {t('auth.signOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : status === 'loading' ? (
            <span>{t('common.loading')}</span>
          ) : (
            <div className="hidden md:flex gap-4">
              <Button variant="outline" asChild>
                <Link href="/login">{t('auth.signIn')}</Link>
              </Button>
              <Button asChild>
                <Link href="/register">{t('auth.signUp')}</Link>
              </Button>
            </div>
          )}
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
