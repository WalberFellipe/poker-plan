import { Vote as PrismaVote, Story as PrismaStory } from "@prisma/client";

export type Story = PrismaStory;

export interface TableParticipant {
  userId: string;
  id: string;
  name: string;
  hasVoted: boolean;
  vote: number | undefined;
  image: string;
  isAnonymous: boolean;
}

export interface ListParticipant {
  userId: string;
  id: string;
  name: string;
  hasVoted: boolean;
  vote: string | number;
  image: string;
  isAnonymous: boolean;
}

export interface Vote extends Omit<PrismaVote, "createdAt" | "updatedAt"> {
  createdAt: string;
  updatedAt?: string;
}

export interface TableVote {
  id: string;
  storyId: string;
  value: number;
  participantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface VoteWithUser extends PrismaVote {
  user: {
    id: string;
    name: string;
    image: string;
  };
  participantId: string;
  value: number;
  
} 