export interface RealtimeVoteEvent {
  storyId: string;
  userId: string;
  value: number;
  participantId: string;
}

export interface RealtimeRevealEvent {
  storyId: string;
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