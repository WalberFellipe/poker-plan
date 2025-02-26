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
import { useToast } from "@/hooks/useToast"

interface JoinRoomModalProps {
  roomId: string
  onJoin: (participantId: string) => void
}

export function JoinRoomModal({ roomId, onJoin }: JoinRoomModalProps) {
  const { data: session } = useSession()
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  if (session?.user) return null

  const handleJoin = async () => {
    if (!name.trim()) return

    setIsLoading(true)

    try {
      const response = await fetch(`/api/rooms/${roomId}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) throw new Error('Erro ao entrar na sala')

      const data = await response.json()
      localStorage.setItem('participantId', data.participantId)
      onJoin(data.participantId)
      
      toast({
        title: "Bem-vindo!",
        description: "Você entrou na sala com sucesso",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : 'Erro ao entrar na sala',
        variant: "destructive"
      })
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