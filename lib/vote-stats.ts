/**
 * Matemática dos votos. Puro e sem dependência de servidor, para que a mesma
 * conta rode no cliente (painel de resultado) e no servidor (registro da
 * estimativa) e os dois nunca discordem.
 */

/** Frações em caractere único que aparecem nos baralhos. */
const FRACTIONS: Record<string, number> = {
  "½": 0.5,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "¼": 0.25,
  "¾": 0.75,
};

/**
 * Converte um valor de carta em número, quando ele tiver um número dentro.
 *
 * Vale para "5", "0,5", "½" e também para valores com unidade — "16h", "3d",
 * "2pt". O baralho de horas produzia média e mediana vazias e consenso 0%
 * justamente porque "16h" era descartado como não-numérico, ainda que a
 * comparação entre 1h e 16h seja perfeitamente aritmética.
 *
 * O que continua fora da conta é o que não tem magnitude: "?", "☕", "PP",
 * "M", "G" e emoji. Tamanho de camiseta é ordinal, não quantidade — somar
 * daria um número sem significado.
 */
export function toNumericVote(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;

  if (trimmed in FRACTIONS) return FRACTIONS[trimmed];

  const normalized = trimmed.replace(",", ".");

  const direct = Number(normalized);
  if (Number.isFinite(direct)) return direct;

  // Número seguido de uma unidade curta: "16h", "2d", "3pt".
  const withUnit = normalized.match(/^(\d+(?:\.\d+)?)\s*[a-zA-Z]{1,3}$/);
  if (withUnit) {
    const parsed = Number(withUnit[1]);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function numericVotes(values: string[]): number[] {
  return values.map(toNumericVote).filter((n): n is number => n !== null);
}

/**
 * Consenso em 0–100 a partir da dispersão dos votos numéricos.
 *
 * 100 = todo mundo no mesmo número. Votos não-numéricos ("?", "☕", emoji) não
 * entram no cálculo, mas também não penalizam o time — quem não sabe estimar
 * ainda não discordou de ninguém.
 */
export function computeConsensus(values: string[]): number {
  const numbers = numericVotes(values);

  if (numbers.length <= 1) return numbers.length === 1 ? 100 : 0;

  const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  if (mean === 0) return 100;

  const variance =
    numbers.reduce((acc, n) => acc + (n - mean) ** 2, 0) / numbers.length;
  const spread = Math.sqrt(variance) / mean;

  return Math.max(0, Math.min(100, Math.round((1 - spread) * 100)));
}

export function computeMedian(values: string[]): number | null {
  const numbers = numericVotes(values).sort((a, b) => a - b);
  if (numbers.length === 0) return null;

  const mid = Math.floor(numbers.length / 2);
  return numbers.length % 2 === 0
    ? (numbers[mid - 1] + numbers[mid]) / 2
    : numbers[mid];
}

export function computeAverage(values: string[]): number | null {
  const numbers = numericVotes(values);
  if (numbers.length === 0) return null;
  return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}

/** Distribuição por valor, ordenada pelos numéricos primeiro. */
export function computeDistribution(
  values: string[]
): { value: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => {
      const na = toNumericVote(a.value);
      const nb = toNumericVote(b.value);
      if (na !== null && nb !== null) return na - nb;
      if (na !== null) return -1;
      if (nb !== null) return 1;
      return a.value.localeCompare(b.value);
    });
}

/**
 * Unidade compartilhada por todos os votos numéricos, se houver uma só.
 *
 * Num baralho de horas a mediana é 16, mas mostrar "Aceitar · 16" perde o
 * sentido; com isto vira "16h". Se os votos misturarem unidades, devolve "".
 */
export function commonUnit(values: string[]): string {
  const units = new Set<string>();

  for (const value of values) {
    if (toNumericVote(value) === null) continue;
    const match = value.trim().match(/^\d+(?:[.,]\d+)?\s*([a-zA-Z]{1,3})$/);
    units.add(match ? match[1] : "");
  }

  return units.size === 1 ? [...units][0] : "";
}

/** Faixa de consenso usada para cor e para a frase de dispersão. */
export function consensusBand(consensus: number): "strong" | "ok" | "weak" {
  if (consensus >= 70) return "strong";
  if (consensus >= 45) return "ok";
  return "weak";
}
