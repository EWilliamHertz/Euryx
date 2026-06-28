import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SEED = [
  {
    name: "Hatake Open · Season 1",
    format: "standard",
    status: "registration",
    startsAt: new Date(Date.now() + 3 * 24 * 3600 * 1000),
    registeredCnt: 217,
    capacity: 512,
    prizePool: "$10,000 + Sealed Box",
    region: "global",
    description: "The flagship Euryx open. Single-elimination from top-64. Best-of-three.",
    bannerImageUrl: "https://images.unsplash.com/photo-1611996575749-79a3a250f948?auto=format&fit=crop&w=1200&q=70",
  },
  {
    name: "Pacific Cup",
    format: "standard",
    status: "upcoming",
    startsAt: new Date(Date.now() + 11 * 24 * 3600 * 1000),
    registeredCnt: 0,
    capacity: 256,
    prizePool: "Crown Zenith Display ×4",
    region: "jp",
    description: "Open to JP-region Hatake accounts. Japanese-only printings encouraged.",
    bannerImageUrl: "https://images.unsplash.com/photo-1542207950-fbb8d3f81dd5?auto=format&fit=crop&w=1200&q=70",
  },
  {
    name: "Expanded Gauntlet",
    format: "expanded",
    status: "live",
    startsAt: new Date(Date.now() - 4 * 3600 * 1000),
    registeredCnt: 64,
    capacity: 64,
    prizePool: "Alt-Art Charizard ex (PSA 10)",
    region: "na",
    description: "Top 64 of last week's qualifiers. Bracket is now live.",
    bannerImageUrl: "https://images.unsplash.com/photo-1639061267989-c95e6bafe1d4?auto=format&fit=crop&w=1200&q=70",
  },
  {
    name: "Vault Invitational",
    format: "gimmick",
    status: "registration",
    startsAt: new Date(Date.now() + 5 * 24 * 3600 * 1000),
    registeredCnt: 42,
    capacity: 128,
    prizePool: "Promo frames + Holo skin pack",
    region: "global",
    description: "Bring exactly one Pokémon ex line + at most 20 Trainer cards. Bo1, swiss × 6.",
    bannerImageUrl: "https://images.unsplash.com/photo-1607853202273-797f1c22a38e?auto=format&fit=crop&w=1200&q=70",
  },
  {
    name: "Hatake Pro Tour · Berlin",
    format: "standard",
    status: "upcoming",
    startsAt: new Date(Date.now() + 22 * 24 * 3600 * 1000),
    registeredCnt: 480,
    capacity: 1024,
    prizePool: "€25,000 + Hatake Tour invite",
    region: "eu",
    description: "EU-region offline qualifier — top 32 from Euryx auto-seed into the Berlin LCQ.",
    bannerImageUrl: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=70",
  },
  {
    name: "Speed Cup · 30s/turn",
    format: "standard",
    status: "live",
    startsAt: new Date(Date.now() - 30 * 60 * 1000),
    registeredCnt: 32,
    capacity: 32,
    prizePool: "Hatake Credits ×500",
    region: "global",
    description: "30-second turn clock. Mistakes are forever. Best-of-one, single elim.",
    bannerImageUrl: "https://images.unsplash.com/photo-1542652694-40abf526446e?auto=format&fit=crop&w=1200&q=70",
  },
  {
    name: "Latam Showdown",
    format: "standard",
    status: "registration",
    startsAt: new Date(Date.now() + 8 * 24 * 3600 * 1000),
    registeredCnt: 96,
    capacity: 256,
    prizePool: "US$3,500 + Hatake merch",
    region: "latam",
    description: "Open to anyone — region-flavored prizes & community-cast top 8.",
    bannerImageUrl: "https://images.unsplash.com/photo-1551269901-5c5e14c25df7?auto=format&fit=crop&w=1200&q=70",
  },
  {
    name: "Off-Season Brawl",
    format: "unlimited",
    status: "finished",
    startsAt: new Date(Date.now() - 9 * 24 * 3600 * 1000),
    registeredCnt: 128,
    capacity: 128,
    prizePool: "Champion: 'Eternal' Vault skin",
    region: "global",
    description: "Anything goes — banned lists are suggestions. Won by user @StingerKnight (12-1).",
    bannerImageUrl: "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?auto=format&fit=crop&w=1200&q=70",
  },
];

async function ensureSeeded() {
  const count = await prisma.euryxTournament.count();
  if (count === 0) {
    await prisma.euryxTournament.createMany({ data: SEED });
  }
}

export async function GET(_req: NextRequest) {
  await ensureSeeded();
  const tournaments = await prisma.euryxTournament.findMany({
    orderBy: [{ status: "asc" }, { startsAt: "asc" }],
  });
  return NextResponse.json({ tournaments });
}
