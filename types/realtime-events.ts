export interface RealtimeVoteEvent {
  storyId: string;
  userId: string;
  value: number;
  participantId: string;
}

export interface RealtimeRevealEventVote {
  id: string;
  storyId: string;
  userId: string;
  participantId: string;
  value: number;
  createdAt: string;
  updatedAt?: string;
  user: {
    id: string;
    name: string;
    image: string | null;
  };
}

export interface RealtimeRevealEvent {
  storyId: string;
  votes: RealtimeRevealEventVote[];
}

export interface RealtimeResetEvent {
  oldStoryId: string;
  newStoryId: string;
}

export interface RealtimeParticipantJoinEvent {
  participantId: string;
  userId?: string;
  name: string | null;
  image: string | null;
  isAnonymous: boolean;
}

export interface RealtimeParticipantLeaveEvent {
  participantId: string;
  userId?: string;
  isAnonymous: boolean;
}

export interface RealtimeCardSelectedEvent {
  participantId: string;
  userId: string;
  storyId: string;
} 