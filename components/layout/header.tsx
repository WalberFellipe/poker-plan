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

export function Header() {
  const { data: session, status } = useSession()

  console.log('Session Status:', status)
  console.log('Session Data:', session)

  return (
    <header className="border-b w-full">
      <div className="flex h-16 items-center justify-between px-8 w-screen max-w-none">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold">
            Planning Poker
          </Link>
          <nav className="hidden gap-6 md:flex">
            <Link 
              href="/room/create" 
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Criar Sala
            </Link>
          </nav>
          {/* Debug info */}
          <span className="text-sm text-muted-foreground">
            Status: {status}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {status === 'authenticated' && session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || ""}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  Logado como: {session.user?.email}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()}>
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : status === 'loading' ? (
            <span>Carregando...</span>
          ) : (
            <div className="hidden md:flex gap-4">
              <Button variant="outline" asChild>
                <Link href="/login">Entrar</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Cadastrar</Link>
              </Button>
            </div>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
