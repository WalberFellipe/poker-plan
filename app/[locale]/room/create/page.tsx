"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/useToast"
import { useSession } from "next-auth/react"
import { DeckSelector } from "@/components/room/deck-selector"
import { useTranslations } from "next-intl"

export default function CreateRoomPage() {
  const [roomName, setRoomName] = useState("")
  const [participantName, setParticipantName] = useState("")
  const [selectedDeckValues, setSelectedDeckValues] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { data: session } = useSession()
  const t = useTranslations('room.create')
  const tCommon = useTranslations('common')

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      if (!session && !participantName) {
        throw new Error(t('participantNameRequired'))
      }

      if (selectedDeckValues.length === 0) {
        throw new Error(t('deckRequired'))
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
        throw new Error(data.error || t('createError'))
      }

      if (!data.room?.id) {
        throw new Error(t('roomIdError'))
      }

      if (!session && data.participant?.id) {
        localStorage.setItem('participantId', data.participant.id)
      }

      router.push(`/room/${data.room.id}`)
    } catch (error) {
      toast({
        title: tCommon('error'),
        description: error instanceof Error ? error.message : t('createError'),
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
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>
            {t('description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateRoom} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="roomName" className="text-sm font-medium">
                {t('roomName')}
              </label>
              <Input
                id="roomName"
                placeholder={t('roomNamePlaceholder')}
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                required
              />
            </div>

            {!session && (
              <div className="space-y-2">
                <label htmlFor="participantName" className="text-sm font-medium">
                  {t('participantName')}
                </label>
                <Input
                  id="participantName"
                  placeholder={t('participantNamePlaceholder')}
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('deck')}
              </label>
              <DeckSelector onDeckSelect={setSelectedDeckValues} />
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading || (!session && !participantName) || selectedDeckValues.length === 0}
            >
              {isLoading ? t('creatingButton') : t('createButton')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
