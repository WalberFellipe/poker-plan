export interface Participant {
  userId: string;
  id: string;
  name: string;
  hasVoted: boolean;
  vote: string | number;
  image: string;
  isAnonymous: boolean;
} 