import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { CustomDeck, CARD_PRESETS } from '@/types/cards'

const LOCAL_STORAGE_KEY = 'custom-decks'

export function useDecks() {
  const { data: session } = useSession()
  const [customDecks, setCustomDecks] = useState<CustomDeck[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadDecks = async () => {
      if (session?.user) {
        try {
          const response = await fetch('/api/decks')
          const data = await response.json()
          setCustomDecks(data)
        } catch (error) {
          console.error('Erro ao carregar decks:', error)
        }
      } else {
        const savedDecks = localStorage.getItem(LOCAL_STORAGE_KEY)
        if (savedDecks) {
          setCustomDecks(JSON.parse(savedDecks))
        }
      }
      setIsLoading(false)
    }

    loadDecks()
  }, [session])

  const saveDeck = async (deck: Omit<CustomDeck, 'id'>) => {
    const newDeck = {
      ...deck,
      id: crypto.randomUUID(),
      userId: session?.user?.id
    }

    if (session?.user) {
      await fetch('/api/decks', {
        method: 'POST',
        body: JSON.stringify(newDeck)
      })
    } else {
      const updatedDecks = [...customDecks, newDeck]
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedDecks))
      setCustomDecks(updatedDecks)
    }
  }

  const allDecks = [
    { id: 'fibonacci', name: 'Fibonacci', values: CARD_PRESETS.fibonacci.values.map(String) },
    { id: 'modified-fibonacci', name: 'Modified Fibonacci', values: ['0', '½', '1', '2', '3', '5', '8', '13', '20', '40', '100', '?', '☕'] },
    ...customDecks
  ]

  return {
    decks: allDecks,
    isLoading,
    saveDeck
  }
} 