"use client";

import { useState, useEffect } from "react";
import { VotingCard } from "@/components/room/voting-card";
import { ParticipantsList } from "@/components/room/participants-list";
import { PokerTable } from "@/components/room/poker-table";
import { Button } from "@/components/ui/button";
import { Eye, RotateCcw, Loader2 } from "lucide-react";
import { useRoomVotes } from "@/hooks/useRoomVotes";
import { Story, TableParticipant, Vote } from "@/types/entities";

import { useSession } from "next-auth/react";
import { InviteButton } from "@/components/room/invite-button";
import { VotingStats } from "@/components/room/voting-stats";
import { DEFAULT_CARDS } from "@/types/cards";
import { useRealtime } from "@/hooks/useRealtime";
import { useToast } from "@/hooks/useToast";
import { JoinRoomModal } from "@/components/room/join-room-modal";
import { useSearchParams } from "next/navigation";
import { RealtimeParticipantJoinEvent, RealtimeParticipantLeaveEvent } from "@/types/realtime-events";


interface RoomClientProps {
  roomId: string;
}

export default function RoomClient({ roomId }: RoomClientProps) {
  const { data: session } = useSession();
  const [participants, setParticipants] = useState<TableParticipant[]>([]);
  const [participantId, setParticipantId] = useState<string>();
  const { toast } = useToast();
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const searchParams = useSearchParams();
  const isInvited = searchParams.get('invited') === 'true';

  const { 
    votes, 
    revealed,
    isLoading,
    isRevealing,
    isResetting,
    localVote,
    revealCountdown,
    selectCard,
    reveal, 
    reset 
  } = useRoomVotes({
    roomId,
    storyId: currentStory?.id ?? null,
    setParticipants
  });

  useEffect(() => {
    const loadParticipants = async () => {
      try {
        const response = await fetch(`/api/rooms/${roomId}/participants`);
        if (!response.ok) throw new Error('Falha ao carregar participantes');
        
        const data = await response.json();
        setParticipants(data);
      } catch {
        toast({
          title: "Erro",
          description: "Não foi possível carregar os participantes",
          variant: "destructive"
        });
      }
    };

    loadParticipants();
  }, [roomId, toast]);

  useRealtime(roomId, {
    'participant:join': (data: RealtimeParticipantJoinEvent) => {

      setParticipants(current => {
        const existingParticipant = current.find(p => 
          p.id === data.participantId || 
          p.userId === data.userId
        )
        
        if (existingParticipant) {
          return current
        }

        const newParticipant: TableParticipant = {
          id: data.participantId,
          userId: data.userId ?? data.participantId,
          name: data.name ?? 'Anônimo',
          image: data.image || '',
          isAnonymous: data.isAnonymous,
          hasVoted: false,
          vote: undefined
        }

        return [...current, newParticipant]
      })
    },
    'participant:leave': (data: RealtimeParticipantLeaveEvent) => {
      setParticipants(current => 
        current.filter(p => p.id !== data.participantId)
      )
    },
  });

  useEffect(() => {
    if (!participantId) return;

    const handleBeforeUnload = () => {
      const data = JSON.stringify({ 
        participantId, 
        isAnonymous: !session?.user 
      });
      
      navigator.sendBeacon(
        `/api/rooms/${roomId}/leave`,
        new Blob([data], { type: 'application/json' })
      );
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload();
    };
  }, [roomId, participantId, session?.user]);

  useEffect(() => {
    const loadCurrentStory = async () => {
      try {
        const response = await fetch(`/api/rooms/${roomId}/current-story`)
        if (!response.ok) throw new Error('Erro ao carregar história')
        const story = await response.json()
        setCurrentStory(story)
      } catch {
        toast({
          title: "Erro",
          description: "Não foi possível carregar a história atual",
          variant: "destructive"
        })
      }
    }

    loadCurrentStory()
  }, [roomId, toast])

  const handleCardSelect = (value: number) => {
    selectCard(value)
  }

  if (isInvited && !session?.user && !participantId) {
    return <JoinRoomModal roomId={roomId} onJoin={setParticipantId} />
  }

  if (!currentStory) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando...</span>
      </div>
    )
  }

  const tableVotes: Vote[] = votes.map((vote) => ({
    id: vote.id,
    storyId: vote.storyId ?? "",
    value: vote.value,
    participantId: vote.userId ?? "",
    userId: vote.userId ?? "",
    createdAt: vote.createdAt instanceof Date
      ? vote.createdAt.toISOString()
      : vote.createdAt ?? new Date().toISOString(),
  }));

  const participantsWithVotes = participants.map(participant => {
    const vote = votes.find(v => 
      v.userId === participant.userId || 
      v.userId === participant.id ||
      v.participantId === participant.id
    )
    
    const finalValue = revealed && vote ? vote.value : "?"    
    return {
      ...participant,
      vote: finalValue
    }
  })

  return (
    <div className="container mx-auto p-4">
      {isLoading ? (
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
            
            <ParticipantsList participants={participantsWithVotes.map(participant => ({
              ...participant,
              vote: typeof participant.vote === 'number' ? participant.vote : "?"
            }))} />
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
                votes={tableVotes}
                className="..."
              />
              <VotingStats 
                votes={votes.map(v => v.value).filter(Boolean)}
                revealed={revealed}
              />
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex justify-center gap-2 flex-wrap">
                {DEFAULT_CARDS.values.map((value) => (
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
