"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSession } from "next-auth/react"

interface JoinRoomModalProps {
  roomId: string
  onJoin: (participantId: string) => void
}

export function JoinRoomModal({ roomId, onJoin }: JoinRoomModalProps) {
  const { data: session } = useSession()
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Se o usuário estiver logado, não mostra o modal
  if (session?.user) return null

  const handleJoin = async () => {
    if (!name.trim()) return

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/rooms/${roomId}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Falha ao entrar na sala')
      }

      const { participantId } = await response.json()
      onJoin(participantId)
    } catch (error) {
      console.error("Erro ao entrar na sala:", error)
      setError(error instanceof Error ? error.message : 'Erro ao entrar na sala')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={true}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Entre na sala</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Seu nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
          />
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          <Button 
            onClick={handleJoin} 
            disabled={!name.trim() || isLoading}
            className="w-full"
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 