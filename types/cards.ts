import { Vote, User } from "@prisma/client";

export interface CardConfig {
  values: readonly (number | "?")[];
  labels?: Record<number | "?", string>;
  theme?: {
    backgroundColor?: string;
    textColor?: string;
    selectedColor?: string;
  };
}

export const DEFAULT_CARDS: CardConfig = {
  values: [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, "?"] as const,
  labels: {
    "?": "?",
    0: "0",
    1: "1",
    2: "2",
    3: "3",
    5: "5",
    8: "8",
    13: "13",
    21: "21",
    34: "34",
    55: "55",
    89: "89"
  }
};

export const CARD_PRESETS = {
  fibonacci: {
    values: [1, 2, 3, 5, 8, 13, 21, 34, "?"] as const,
    labels: {
      "?": "Não sei",
      1: "1",
      2: "2",
      3: "3",
      5: "5",
      8: "8",
      13: "13",
      21: "21",
      34: "34"
    }
  },
  tShirt: {
    values: ["XS", "S", "M", "L", "XL", "XXL", "?"] as const,
    labels: {
      "XS": "Extra Small",
      "S": "Small",
      "M": "Medium",
      "L": "Large",
      "XL": "Extra Large",
      "XXL": "Double Extra Large",
      "?": "Unknown"
    }
  }
} as const;

export type CardValue = (typeof DEFAULT_CARDS.values)[number];

export type CardPreset = keyof typeof CARD_PRESETS;

export interface VoteWithUser extends Vote {
  user: Pick<User, "id" | "name" | "image">;
  participantId: string;
  value: number;
}

export interface CustomDeck {
  id: string;
  name: string;
  values: string[];
  userId?: string;
} 