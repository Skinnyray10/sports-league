export type Pairing = { jornada: number; home: string; away: string };

/**
 * Todos contra todos (método del círculo). Con número impar de equipos,
 * a cada uno le toca descansar una jornada. Con `legs = 2` se repite la
 * vuelta invirtiendo local y visitante.
 */
export function roundRobin(teamIds: string[], legs: 1 | 2 = 1): Pairing[] {
  const slots: (string | null)[] = [...teamIds];
  if (slots.length % 2 === 1) slots.push(null);
  const n = slots.length;
  const rounds = n - 1;
  const pairings: Pairing[] = [];

  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < n / 2; i++) {
      const a = slots[i];
      const b = slots[n - 1 - i];
      if (!a || !b) continue;
      // Alterna la localía del equipo fijo para que no siempre sea local.
      const swap = i === 0 && r % 2 === 1;
      pairings.push({
        jornada: r + 1,
        home: swap ? b : a,
        away: swap ? a : b,
      });
    }
    // Rota todos menos el primero.
    slots.splice(1, 0, slots.pop()!);
  }

  if (legs === 2) {
    const firstLeg = [...pairings];
    for (const p of firstLeg) {
      pairings.push({ jornada: p.jornada + rounds, home: p.away, away: p.home });
    }
  }

  return pairings;
}

/** 1° vs último, 2° vs penúltimo… El mejor sembrado juega de local. */
export function seededPairs(seeds: string[]): { home: string; away: string }[] {
  const pairs: { home: string; away: string }[] = [];
  for (let i = 0; i < seeds.length / 2; i++) {
    pairs.push({ home: seeds[i], away: seeds[seeds.length - 1 - i] });
  }
  return pairs;
}

export const PLAYOFF_SIZES = [2, 4, 8] as const;
export type PlayoffSize = (typeof PLAYOFF_SIZES)[number];

export const FIRST_PLAYOFF_STAGE: Record<PlayoffSize, string> = {
  8: "cuartos",
  4: "semifinal",
  2: "final",
};

/** Ganador de un partido finalizado; en empate decide la tanda de penales. */
export function matchWinner(m: {
  home_team_id: string;
  away_team_id: string;
  home_score: number;
  away_score: number;
  shootout_winner_team_id: string | null;
}): string | null {
  if (m.home_score > m.away_score) return m.home_team_id;
  if (m.away_score > m.home_score) return m.away_team_id;
  return m.shootout_winner_team_id;
}
