"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, Users, Calendar, ArrowLeft, Crown, Swords, Loader2 } from "lucide-react";

type Match = { id: string; round: number; position: number; player1Id: string | null; player1Name: string | null; player2Id: string | null; player2Name: string | null; winnerId: string | null };
type Reg = { id: string; userId: string; username: string };
type T = {
  id: string; name: string; format: string; status: string; startsAt: string;
  registeredCnt: number; capacity: number; prizePool: string | null; region: string | null;
  description: string | null; bannerImageUrl: string | null;
  registrations: Reg[]; matches: Match[];
};

export default function TournamentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; username: string } | null>(null);
  const [t, setT] = useState<T | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    const r = await fetch(`/api/tournaments/${params.id}`);
    if (r.ok) { const d = await r.json(); setT(d.tournament); }
  }
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" }).then((r) => r.json()).then((d) => setUser(d.user));
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const registered = t?.registrations.some((r) => r.userId === user?.id);

  async function register() {
    setBusy(true); setErr(null);
    const r = await fetch(`/api/tournaments/${params.id}`, { method: "POST", credentials: "include" });
    if (!r.ok) setErr((await r.json()).error || "register failed");
    await load(); setBusy(false);
  }
  async function unregister() {
    setBusy(true); setErr(null);
    await fetch(`/api/tournaments/${params.id}`, { method: "DELETE", credentials: "include" });
    await load(); setBusy(false);
  }
  async function generateBracket() {
    setBusy(true); setErr(null);
    const r = await fetch(`/api/tournaments/${params.id}/bracket`, { method: "POST" });
    if (!r.ok) setErr((await r.json()).error || "bracket failed");
    await load(); setBusy(false);
  }

  if (!t) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-euryx-cyan" /></div>;
  }

  const rounds = t.matches.reduce((acc, m) => Math.max(acc, m.round), 0);
  const matchesByRound: Match[][] = [];
  for (let r = 1; r <= rounds; r++) {
    matchesByRound.push(t.matches.filter((m) => m.round === r).sort((a, b) => a.position - b.position));
  }

  return (
    <div className="min-h-screen pt-24 px-6 max-w-6xl mx-auto pb-32">
      <Link href="/tournaments" className="text-[11px] font-mono uppercase tracking-[0.25em] text-slate-400 hover:text-white flex items-center gap-1 mb-4">
        <ArrowLeft className="w-3 h-3" /> All tournaments
      </Link>
      <div className="relative h-44 rounded-2xl overflow-hidden mb-6">
        {t.bannerImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={t.bannerImageUrl} alt="" className="w-full h-full object-cover opacity-50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.35em] text-euryx-cyan">{t.status} · {t.format} · {t.region || "global"}</div>
            <h1 className="font-heading text-4xl font-black tracking-tighter text-white mt-1" data-testid="tournament-name">{t.name}</h1>
            {t.prizePool && <div className="font-mono text-sm text-amber-300/90 mt-1">🏆 {t.prizePool}</div>}
          </div>
          <div className="text-right">
            <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-300">Players</div>
            <div className="font-heading text-3xl font-black text-white">{t.registeredCnt}<span className="text-slate-500 text-lg">/{t.capacity}</span></div>
          </div>
        </div>
      </div>

      {t.description && <p className="font-mono text-sm text-slate-300 mb-6 leading-relaxed max-w-3xl">{t.description}</p>}

      {/* CTA bar */}
      <div className="flex gap-3 flex-wrap items-center mb-8">
        {t.status === "registration" && user && (
          registered ? (
            <button onClick={unregister} disabled={busy} className="btn-neon btn-neon-fuchsia" data-testid="tournament-unregister-btn">
              Withdraw
            </button>
          ) : (
            <button onClick={register} disabled={busy} className="btn-neon btn-neon-cyan" data-testid="tournament-register-btn">
              <Swords className="w-4 h-4" /> Register
            </button>
          )
        )}
        {t.status === "registration" && t.registeredCnt >= 2 && (
          <button onClick={generateBracket} disabled={busy} className="btn-neon btn-neon-ghost" data-testid="tournament-generate-bracket-btn">
            Generate Bracket
          </button>
        )}
        {!user && <Link href="/login" className="btn-neon btn-neon-cyan">Sign in to register</Link>}
        {err && <span className="text-xs font-mono text-fuchsia-300">{err}</span>}
      </div>

      {/* Registered players */}
      <h2 className="font-heading text-2xl font-bold text-white mb-3">Registered ({t.registrations.length})</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-12">
        {t.registrations.map((r) => (
          <div key={r.id} className="glass rounded-lg px-3 py-2 text-sm font-mono text-slate-200 truncate" data-testid={`registered-${r.username}`}>
            {r.username}
          </div>
        ))}
        {t.registrations.length === 0 && (
          <div className="col-span-full text-center text-slate-500 font-mono text-sm py-6">No registrations yet.</div>
        )}
      </div>

      {/* Bracket */}
      {rounds > 0 && (
        <>
          <h2 className="font-heading text-2xl font-bold text-white mb-3">Bracket</h2>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-6 min-w-fit" data-testid="bracket">
              {matchesByRound.map((round, ri) => (
                <div key={ri} className="flex flex-col gap-4 justify-around min-w-[220px]">
                  <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-500 text-center">
                    Round {ri + 1}
                    {ri + 1 === rounds && " · Final"}
                  </div>
                  {round.map((m) => (
                    <div key={m.id} className="glass rounded-lg overflow-hidden border border-white/10" data-testid={`bracket-match-${m.id}`}>
                      <BracketSlot name={m.player1Name} won={m.winnerId === m.player1Id} />
                      <div className="h-px bg-white/10" />
                      <BracketSlot name={m.player2Name} won={m.winnerId === m.player2Id} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function BracketSlot({ name, won }: { name: string | null; won: boolean }) {
  return (
    <div className={`px-3 py-2 flex items-center justify-between text-xs font-mono ${won ? "bg-euryx-cyan/10 text-euryx-cyan" : "text-slate-300"}`}>
      <span className="truncate">{name || "—"}</span>
      {won && <Crown className="w-3 h-3" />}
    </div>
  );
}
