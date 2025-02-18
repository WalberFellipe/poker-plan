"use client";

import { useState, useEffect } from "react";
import { VotingCard } from "@/components/room/voting-card";
import { ParticipantsList } from "@/components/room/participants-list";
import { PokerTable } from "@/components/room/poker-table";
import { Button } from "@/components/ui/button";
import { Eye, RotateCcw, Loader2 } from "lucide-react";
import { useRoomVotes } from "@/hooks/useRoomVotes";
import { Story } from "@prisma/client";
import { useSession } from "next-auth/react";
import { JoinRoomModal } from "@/components/room/join-room-modal";
import { InviteButton } from "@/components/room/invite-button";
import { VotingStats } from "@/components/room/voting-stats";

const CARDS = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, "?"];

interface RoomClientProps {
  roomId: string;
}

export function RoomClient({ roomId }: RoomClientProps) {
  const { data: session } = useSession();
  const [participantId, setParticipantId] = useState<string>();
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);

  const { 
    votes, 
    revealed, 
    loading, 
    isRevealing,
    isResetting,
    localVote,
    revealCountdown,
    selectCard,
    reveal, 
    reset 
  } = useRoomVotes(
    currentStory?.id ?? '', 
    roomId,
    participantId
  );

  // Recuperar participantId do localStorage ao carregar
  useEffect(() => {
    const storedParticipantId = localStorage.getItem(`participant_${roomId}`);
    if (storedParticipantId) {
      setParticipantId(storedParticipantId);
    }
  }, [roomId]);

  // Salvar participantId no localStorage quando definido
  const handleJoin = (newParticipantId: string) => {
    setParticipantId(newParticipantId);
    localStorage.setItem(`participant_${roomId}`, newParticipantId);
  };

  // Carregar história atual
  useEffect(() => {
    const loadCurrentStory = async () => {
      try {
        console.log('Carregando história...')
        const response = await fetch(`/api/rooms/${roomId}/current-story`)
        if (!response.ok) throw new Error('Erro ao carregar história')
        const story = await response.json()
        console.log('História carregada:', story)
        setCurrentStory(story)
      } catch (error) {
        console.error('Erro ao carregar história:', error)
      }
    }

    loadCurrentStory()
  }, [roomId])

  // Recarregar participantes quando alguém entrar
  useEffect(() => {
    const loadParticipants = async () => {
      try {
        console.log('Carregando participantes...')
        const response = await fetch(`/api/rooms/${roomId}/participants`)
        if (!response.ok) throw new Error('Erro ao carregar participantes')
        const data = await response.json()
        console.log('Participantes carregados:', data)
        setParticipants(data)
      } catch (error) {
        console.error('Erro ao carregar participantes:', error)
      }
    }

    loadParticipants()
  }, [roomId, participantId])

  const handleCardSelect = (value: number) => {
    selectCard(value)
  }

  if (!participantId && !session?.user) {
    return <JoinRoomModal roomId={roomId} onJoin={handleJoin} />;
  }

  if (!currentStory) {
    console.log('Estado atual:', { currentStory, loading, participants })
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando...</span>
      </div>
    )
  }

  const participantsWithVotes = participants.map((participant) => {
    const vote = votes.find((v) => 
      participant.isAnonymous 
        ? v.userId === participant.id 
        : v.userId === participant.userId
    )
    
    return {
      id: participant.userId,
      name: participant.name ?? "Anônimo",
      hasVoted: participant.userId === (participantId || 'user-id') 
        ? localVote !== null 
        : !!vote,
      vote: vote?.value ?? "?",
      image: participant.image,
      isAnonymous: participant.isAnonymous
    }
  });

  return (
    <div className="container mx-auto p-4">
      {loading ? (
        <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando votos...</span>
        </div>
      ) : (
        <div className="grid grid-cols-[250px,1fr] gap-8 h-[calc(100vh-10rem)]">
          {/* Sidebar Esquerda */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Planning Poker</h1>
              <p className="text-sm text-muted-foreground">
                {currentStory?.title}
              </p>
            </div>
            
            <ParticipantsList participants={participantsWithVotes} />
          </div>

          {/* Área Principal */}
          <div className="flex flex-col gap-6">
            <div className="flex justify-center space-x-4">
              <Button
                variant="outline"
                onClick={reveal}
                disabled={votes.length === 0 || isRevealing}
              >
                {isRevealing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {revealCountdown !== null ? `Revelando em ${revealCountdown}...` : 'Revelando...'}
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Revelar
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={reset}
                disabled={isResetting}
              >
                {isResetting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="mr-2 h-4 w-4" />
                )}
                Resetar
              </Button>
              <InviteButton roomId={roomId} />
            </div>

            <div className="flex-1 flex items-center justify-center relative">
              <PokerTable 
                participants={participantsWithVotes}
                revealed={revealed}
              />
              <VotingStats 
                votes={votes.map(v => v.value).filter(Boolean)}
                revealed={revealed}
              />
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex justify-center gap-2 flex-wrap">
                {CARDS.map((value) => (
                  <VotingCard
                    key={value}
                    value={value}
                    selected={localVote === value}
                    revealed={true}
                    disabled={isRevealing}
                    onClick={() => typeof value === 'number' && handleCardSelect(value)}
                    size="sm"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
