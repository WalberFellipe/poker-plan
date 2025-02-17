"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"

export default function CreateRoomPage() {
  const [roomName, setRoomName] = useState("")
  const router = useRouter()

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch("/api/room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: roomName }),
      })

      const data = await response.json()
      
      if (response.ok) {
        router.push(`/room/${data.id}`)
      }
    } catch (error) {
      console.error("Erro ao criar sala:", error)
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
            <Button type="submit" className="w-full">
              Criar Sala
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
