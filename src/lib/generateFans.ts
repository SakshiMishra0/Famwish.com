import { Celeb } from "@/types";

export interface Fan {
  id: string;
  name: string;
  points: number;
  bids: number;
  wishes: number;
  celebName?: string; // for global leaderboard
}

export function generateFans(celeb: Celeb, timeframe: string, count = 60): Fan[] {
  const baseScores = {
    samay: 2000,
    carry: 1700,
    bhuvan: 1500,
    rvc: 900,
    unknown: 600,
    alia: 1100,
  };

  const multipliers = {
    week: 0.06,
    month: 0.32,
    year: 1.0,
    all: 1.8,
  };

  const base = baseScores[celeb.id as keyof typeof baseScores] || 800;
  const factor = multipliers[timeframe as keyof typeof multipliers] || 0.1;

  const fans: Fan[] = [];

  for (let i = 0; i < count; i++) {
    const name =
      Math.random() > 0.7
        ? ["Aarav", "Riya", "Neha", "Sam", "Arnav", "Kabir"][
            Math.floor(Math.random() * 6)
          ] + " " + Math.floor(Math.random() * 999)
        : "Fan" + Math.floor(Math.random() * 9999);

    const points = Math.max(
      50,
      Math.round((Math.random() * base * factor) * (1 + Math.random() * 0.6))
    );

    fans.push({
      id: celeb.id + "_" + i,
      name,
      points,
      bids: Math.floor(Math.random() * 40) + 1,
      wishes: Math.floor(Math.random() * 6),
      celebName: celeb.name,
    });
  }

  fans.sort((a, b) => b.points - a.points); // Sort by descending points

  return fans;
}
