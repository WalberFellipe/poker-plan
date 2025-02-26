"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useToast } from "@/hooks/useToast";
import { 
  CardValue, 
  VoteWithUser 
} from '@/types/cards';
import { 
  RealtimeVoteEvent, 
  RealtimeRevealEvent, 
  RealtimeResetEvent 
} from '@/types/realtime-events';
import { voteService } from '@/services/voteService';
import { useSession } from "next-auth/react";
import { Participant } from '@/types/participant';
import { useRealtime } from "@/hooks/useRealtime";

declare module './useRealtime' {
  interface EventHandlers {
    'vote:new': (data: RealtimeVoteEvent) => void;
    'vote:reveal': (data: RealtimeRevealEvent) => void;
    'story:reset': (data: RealtimeResetEvent) => void;
  }
}

export function useRoomVotes(
  storyId: string,
  roomId: string,
) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [votes, setVotes] = useState<VoteWithUser[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [revealed, setRevealed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isRevealing, setIsRevealing] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [localVote, setLocalVote] = useState<number | null>(null)
  const [revealCountdown, setRevealCountdown] = useState<number | null>(null)
  const [currentStoryId, setCurrentStoryId] = useState(storyId)
  const [error, setError] = useState<string | null>(null)
  const localStorageParticipantId = localStorage.getItem('participantId')
 const participantIdForVote = session?.user
   ? undefined
   : localStorageParticipantId || undefined;

  const handlers = {
    'vote:new': (data: RealtimeVoteEvent) => {
      setVotes(current => {
        const index = current.findIndex(v => v.userId === data.userId)
        const newVote: VoteWithUser = {
          id: `vote-${data.userId}`,
          userId: data.userId,
          participantId: data.userId,
          storyId: data.storyId,
          value: data.value,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: data.userId,
            name: "Anônimo",
            image: null
          }
        }

        if (index >= 0) {
          const newVotes = [...current]
          newVotes[index] = newVote
          return newVotes
        }
        return [...current, newVote]
      })
    },

    'vote:reveal': () => {
      setIsRevealing(true)
      setRevealCountdown(3)

      const submitLocalVote = async () => {
       

        const currentUserId = session?.user?.id ?? localStorageParticipantId
        const currentVote = localVote ?? votes.find(v => 
          v.userId === currentUserId
        )?.value

        if (currentVote !== null && currentVote !== undefined) {
          try {
            await voteService.sendVote(
              storyId ?? "",
              currentVote,
              participantIdForVote
            );
          } catch {
            toast({
              title: "Erro",
              description: "Não foi possível carregar a história atual",
              variant: "destructive",
            });
          }
        }
      }

      const countdown = async () => {
        await submitLocalVote()
        for (let i = 3; i > 0; i--) {
          setRevealCountdown(i)
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        setRevealCountdown(null)
        setRevealed(true)
        setIsRevealing(false)
      }

      countdown()
    },

    'story:reset': () => {
      setVotes([])
      setRevealed(false)
      setLocalVote(null)
      setIsRevealing(false)
      setRevealCountdown(null)
    }
  }

  useRealtime(roomId, handlers)

  const loadVotes = useCallback(async () => {
    if (!storyId) return
    setIsLoading(true)
    try {
      const data = await voteService.loadVotes(storyId)
      setVotes(data)
      return data
    } catch {
      setError('Erro ao carregar votos')
    } finally {
      setIsLoading(false)
    }
  }, [storyId])

  useEffect(() => {
    if (storyId) {
      loadVotes()
    }
  }, [storyId, loadVotes])

  useEffect(() => {
    setCurrentStoryId(storyId)
  }, [storyId])

  /*
  // Enviar voto
  */

  const submitVote = async (value: number) => {
    if (!storyId) return
    setLocalVote(value)

    try {
      await voteService.sendVote(storyId, value, participantIdForVote);
      toast({ description: "Voto registrado com sucesso!" })
    } catch {
      toast({
        variant: "destructive",
        description: "Erro ao registrar voto"
      })
    }
  }

  /*
  // Revelar votos
  */

  const reveal = async () => {
    if (!storyId || isRevealing) return
    setIsRevealing(true)
    setRevealCountdown(3)

    try {
      await voteService.revealVotes(storyId, participantIdForVote);

      for (let i = 3; i > 0; i--) {
        setRevealCountdown(i)
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      setRevealCountdown(null)
      setRevealed(true)

      toast({ description: "Votos revelados!" })
    } catch {
      toast({
        variant: "destructive",
        description: "Erro ao revelar votos"
      })
    } finally {
      setIsRevealing(false)
    }
  }

  /*
  // Resetar votos
  */

  const reset = async () => {
    if (isResetting) return
    setIsResetting(true)

    try {
      await voteService.resetVotes(storyId, participantIdForVote);
      setVotes([])
      setLocalVote(null)
      setRevealed(false)
      setIsResetting(false);
      toast({ description: "Votação resetada!" })
    } catch {
      toast({
        variant: "destructive",
        description: "Erro ao resetar votação"
      })
    }
  }

  /*
  // Selecionar card
  */

  const selectCard = async (value: CardValue) => {
    setLocalVote(value === "?" ? null : value);
    
    if (revealed && value !== "?") {
      try {
        await voteService.sendVote(storyId ?? "", Number(value), storyId ?? "")
      } catch {
        toast({
          title: "Erro",
          description: "Não foi possível enviar seu voto",
          variant: "destructive"
        })
      }
    }
  }

  /*
  // Atualizar participantes com votos
  */

  const updateParticipantsWithVotes = useCallback((currentVotes: VoteWithUser[]) => {
    // Garantir que temos pelo menos o participante atual
    const currentParticipant = {
      id: session?.user?.id ?? localStorageParticipantId ?? "",
      userId: session?.user?.id ?? localStorageParticipantId ?? "",
      name: session?.user?.name ?? "Anônimo",
      image: session?.user?.image ?? null,
      isAnonymous: !session?.user
    }

    // Combinar participantes existentes com o atual
    const allParticipants = participants.length > 0 
      ? participants 
      : [currentParticipant]

    const updatedParticipants = allParticipants.map(participant => {
      const participantVote = currentVotes.find(vote => 
        vote.userId === participant.userId || 
        vote.userId === participant.id
      )

      return {
        ...participant,
        hasVoted: !!participantVote,
        vote: revealed ? participantVote?.value : undefined
      }
    })

    const hasChanges = JSON.stringify(participants) !== JSON.stringify(updatedParticipants)
    if (hasChanges) {
      setParticipants(updatedParticipants as Participant[])
    }
  }, [participants, session?.user, localStorageParticipantId, revealed])

  useEffect(() => {
    if (votes.length > 0) {
      updateParticipantsWithVotes(votes)
    }
  }, [votes, updateParticipantsWithVotes])

  /*
  // Retornar votos combinados
  */

  const combinedVotes = useMemo(() => {
    const existingVotes = votes || []
    const currentUserId = session?.user?.id ?? localStorageParticipantId

    // Verifica se o usuário atual já tem um voto
    const hasUserVote = existingVotes.some(
      (v) => v.userId === currentUserId
    )

    if (!hasUserVote && localVote !== null) {
      return [
        ...existingVotes,
        {
          id: "local-vote",
          storyId: currentStoryId ?? "",
          userId: currentUserId ?? "",
          participantId: currentUserId ?? "",
          value: Number(localVote),
          createdAt: new Date(),
          user: {
            id: currentUserId ?? "",
            name: session?.user?.name ?? "Anônimo",
            image: session?.user?.image ?? null,
          },
          updatedAt: new Date(),
        } satisfies VoteWithUser,
      ]
    }

    return existingVotes
  }, [votes, session?.user, localStorageParticipantId, localVote, currentStoryId])


  /*
  // Retornar valores
  */

  return {
    votes: combinedVotes,
    revealed,
    isLoading,
    isRevealing,
    isResetting,
    localVote,
    revealCountdown,
    currentStoryId,
    selectCard,
    reveal,
    reset,
    submitVote,
    error,
    participants
  }
}
