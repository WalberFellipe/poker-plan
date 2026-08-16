/**
 * Matemática dos votos. Puro e sem dependência de servidor, para que a mesma
 * conta rode no cliente (painel de resultado) e no servidor (registro da
 * estimativa) e os dois nunca discordem.
 */

/** Converte um valor de carta em número, quando ele for numérico. */
export function toNumericVote(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (normalized === "") return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
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

/** Faixa de consenso usada para cor e para a frase de dispersão. */
export function consensusBand(consensus: number): "strong" | "ok" | "weak" {
  if (consensus >= 70) return "strong";
  if (consensus >= 45) return "ok";
  return "weak";
}
