"use client";

import { useEffect, useState } from "react";
import { Vote, User } from "@prisma/client";
import { pusherClient } from "@/lib/pusher";
import { useToast } from "@/hooks/useToast";

type VoteWithUser = Vote & {
  user: Pick<User, "id" | "name" | "image">;
};

export function useRoomVotes(storyId: string, roomId: string, participantId?: string) {
  const [votes, setVotes] = useState<any[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [localVote, setLocalVote] = useState<number | string>("?");
  const { toast } = useToast();
  const [currentStoryId, setCurrentStoryId] = useState(storyId);
  const [revealCountdown, setRevealCountdown] = useState<number | null>(null);

  const loadVotes = async () => {
    if (!currentStoryId) return;
    
    try {
      console.log('Carregando votos para história:', currentStoryId);
      const response = await fetch(`/api/stories/${currentStoryId}/votes`);
      if (!response.ok) throw new Error('Erro ao carregar votos');
      const data = await response.json();
      console.log('Votos carregados:', data);
      setVotes(data);
    } catch (error) {
      console.error('Erro ao carregar votos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os votos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentStoryId) {
      loadVotes();
    }
  }, [currentStoryId]);

  useEffect(() => {
    setCurrentStoryId(storyId);
  }, [storyId]);

  useEffect(() => {
    if (storyId) {
      setLoading(true);
    }
  }, [storyId]);

  useEffect(() => {
    if (!roomId) return;

    const channel = pusherClient.subscribe(`room-${roomId}`);

    channel.bind("vote", (data: { vote: VoteWithUser }) => {
      setVotes(current => {
        const index = current.findIndex(v => v.userId === data.vote.userId);
        if (index >= 0) {
          const newVotes = [...current];
          newVotes[index] = data.vote;
          return newVotes;
        }
        return [...current, data.vote];
      });
    });

    channel.bind("reveal", () => {
      setRevealed(true);
    });

    channel.bind("reset", () => {
      setVotes([]);
      setRevealed(false);
    });

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(`room-${roomId}`);
    };
  }, [roomId]);

  const selectCard = (value: number) => {
    setLocalVote(value);
  };

  const reveal = async () => {
    if (isRevealing) return;

    setIsRevealing(true);

    try {
      if (localVote !== null) {
        await fetch(`/api/stories/${storyId}/votes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: localVote, participantId })
        });
      }

      setRevealCountdown(3);
      for (let i = 2; i >= 0; i--) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setRevealCountdown(i);
      }

      const response = await fetch(`/api/stories/${storyId}/reveal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId })
      });

      if (!response.ok) throw new Error('Erro ao revelar votos');
      await loadVotes();
      setRevealed(true);
    } catch (error) {
      console.error('Erro ao revelar votos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível revelar os votos",
        variant: "destructive"
      });
    } finally {
      setIsRevealing(false);
      setRevealCountdown(null);
    }
  };

  const reset = async () => {
    if (isResetting) return;

    setIsResetting(true);

    try {
      const response = await fetch(`/api/stories/${currentStoryId}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId })
      });

      if (!response.ok) throw new Error('Erro ao resetar história');
      const newStory = await response.json();
      
      setRevealed(false);
      setVotes([]);
      setLocalVote("?");
      setCurrentStoryId(newStory.id);
      
      window.history.pushState({}, '', `/room/${roomId}?story=${newStory.id}`);
    } catch (error) {
      console.error('Erro ao resetar história:', error);
      toast({
        title: "Erro",
        description: "Não foi possível resetar a votação",
        variant: "destructive"
      });
    } finally {
      setIsResetting(false);
    }
  };

  const combinedVotes = [
    ...votes,
    ...(!votes.some(v => v.userId === (participantId || 'user-id')) ? [{
      id: 'local-vote',
      userId: participantId || 'user-id',
      value: localVote,
      isAnonymous: !participantId
    }] : [])
  ];

  return {
    votes: combinedVotes,
    revealed,
    loading,
    isRevealing,
    isResetting,
    localVote,
    revealCountdown,
    selectCard,
    reveal,
    reset
  };
}
