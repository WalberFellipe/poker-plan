"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/useToast"
import { useSession } from "next-auth/react"
import { DeckSelector } from "@/components/room/deck-selector"

export default function CreateRoomPage() {
  const [roomName, setRoomName] = useState("")
  const [participantName, setParticipantName] = useState("")
  const [selectedDeckValues, setSelectedDeckValues] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { data: session } = useSession()

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      if (!session && !participantName) {
        throw new Error("Nome do participante é obrigatório")
      }

      if (selectedDeckValues.length === 0) {
        throw new Error("Selecione um baralho para a sala")
      }

      const response = await fetch("/api/room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          name: roomName,
          participantName: session?.user?.name || participantName,
          deckValues: selectedDeckValues
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar sala")
      }

      if (!data.room?.id) {
        throw new Error("ID da sala não foi gerado")
      }

      if (!session && data.participant?.id) {
        localStorage.setItem('participantId', data.participant.id)
      }

      router.push(`/room/${data.room.id}`)
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível criar a sala",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Criar Nova Sala</CardTitle>
          <CardDescription>
            Configure sua sala de Planning Poker
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateRoom} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="roomName" className="text-sm font-medium">
                Nome da Sala
              </label>
              <Input
                id="roomName"
                placeholder="Ex: Sprint 23 Planning"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                required
              />
            </div>

            {!session && (
              <div className="space-y-2">
                <label htmlFor="participantName" className="text-sm font-medium">
                  Seu Nome
                </label>
                <Input
                  id="participantName"
                  placeholder="Como você quer ser chamado?"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Baralho da Sala
              </label>
              <DeckSelector onDeckSelect={setSelectedDeckValues} />
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading || (!session && !participantName) || selectedDeckValues.length === 0}
            >
              {isLoading ? "Criando..." : "Criar Sala"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
