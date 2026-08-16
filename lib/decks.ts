export interface Deck {
  id: string;
  name: string;
  values: string[];
  builtin: boolean;
}

/**
 * Baralhos que acompanham o produto.
 *
 * Os valores são strings livres de propósito: "½", "∞", "PP", "4h" e emoji são
 * votos igualmente válidos, porque `Vote.value` é texto do banco até a UI.
 */
export const BUILTIN_DECKS: Deck[] = [
  {
    id: "fib",
    name: "Fibonacci",
    values: ["0", "½", "1", "2", "3", "5", "8", "13", "20", "40", "?", "∞"],
    builtin: true,
  },
  {
    id: "pow2",
    name: "Powers of 2",
    values: ["1", "2", "4", "8", "16", "32", "64", "?"],
    builtin: true,
  },
  {
    id: "shirt",
    name: "T-shirt",
    values: ["PP", "P", "M", "G", "GG", "?"],
    builtin: true,
  },
  {
    id: "hours",
    name: "Horas",
    values: ["1h", "2h", "4h", "8h", "16h", "24h", "?"],
    builtin: true,
  },
];

export const DEFAULT_DECK = BUILTIN_DECKS[0];

/** Lê os valores de um baralho a partir do texto separado por vírgula. */
export function parseDeckValues(input: string): string[] {
  return input
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value !== "")
    .slice(0, 24);
}

/** Duas listas de cartas são o mesmo baralho? Usado para marcar "Em uso". */
export function sameValues(a: string[], b: string[]) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}
