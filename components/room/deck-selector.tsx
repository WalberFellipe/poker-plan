"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CustomDeckModal } from "./custom-deck-modal"
import { useDecks } from "@/hooks/useDecks"
import { Loader2 } from "lucide-react"

interface DeckSelectorProps {
  onDeckSelect: (values: string[]) => void
}

export function DeckSelector({ onDeckSelect }: DeckSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { decks, isLoading, saveDeck } = useDecks()

  const handleDeckSelect = (deckId: string) => {
    if (deckId === "custom") {
      setIsModalOpen(true)
      return
    }

    const selectedDeck = decks.find(deck => deck.id === deckId)
    if (selectedDeck) {
      onDeckSelect(selectedDeck.values as string[])
    }
  }

  const handleSaveCustomDeck = async (deck: { name: string; values: string[] }) => {
    await saveDeck(deck)
    onDeckSelect(deck.values)
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Carregando baralhos...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Select onValueChange={handleDeckSelect}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Escolha um baralho" />
        </SelectTrigger>
        <SelectContent>
          {decks.map(deck => (
            <SelectItem key={deck.id} value={deck.id}>
              {deck.name}
            </SelectItem>
          ))}
          <SelectItem value="custom">Criar Baralho Personalizado</SelectItem>
        </SelectContent>
      </Select>

      <CustomDeckModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCustomDeck}
      />
    </div>
  )
} 