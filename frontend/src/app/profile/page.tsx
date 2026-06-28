"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { User, ExternalLink, Trophy, Flame, Crosshair, TrendingUp, Award, History, LogOut } from "lucide-react";

type Stats = {
  wins: number; losses: number; elo: number; peakElo: number;
  streak: number; bestStreak: number; totalDmg: number; totalKOs: number;
  winRate: number; games: number;
};
type Match = {
  id: string; opponentName: string; result: string; reason: string | null;
  turnCount: number; durationSec: number; eloDelta: number; eloAfter: number;
  endedAt: string; roomId: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setUser(d.user || null); setChecked(true); });
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch("/api/matches?limit=20", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setStats(d.stats); setMatches(d.matches || []); });
  }, [user]);

  if (checked && !user) {
    return (
      <div className="min-h-screen pt-32 px-6 text-center max-w-md mx-auto">
        <h1 className="font-heading text-3xl text-white mb-3">Sign in</h1>
        <Link href="/login" className="btn-neon btn-neon-cyan inline-flex" data-testid="profile-signin-link">Sign in</Link>
      </div>
    );
  }

  const rank =
    !stats || stats.elo < 900 ? "Bronze" :
    stats.elo < 1100 ? "Silver" :
    stats.elo < 1300 ? "Gold" :
    stats.elo < 1500 ? "Platinum" :
    stats.elo < 1700 ? "Diamond" : "Master";

  return (
    <div className="min-h-screen pt-24 px-6 max-w-6xl mx-auto pb-32">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-[11px] font-mono uppercase tracking-[0.35em] text-slate-500 mb-2">Trainer Card</div>
        <div className="flex items-center gap-6 flex-wrap">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{
              background: "conic-gradient(from 220deg at 50% 50%, #00f0ff, #ffffff 80deg, #ff00ff 160deg, #00f0ff 280deg, #ff00ff 340deg, #00f0ff 360deg)",
              boxShadow: "0 0 40px rgba(0,240,255,0.4)",
            }}
          >
            <div className="w-[88px] h-[88px] rounded-full bg-slate-950 flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-[200px]">
            <h1 className="font-heading text-5xl font-black tracking-tighter text-white" data-testid="profile-username">{user?.username}</h1>
            <div className="font-mono text-xs text-slate-400 mt-1">{user?.email}</div>
            <div className="flex gap-3 mt-3 items-center">
              <span className="px-3 py-1 rounded-full text-[10px] font-heading font-bold uppercase tracking-[0.2em] bg-gradient-to-r from-euryx-cyan/20 to-euryx-fuchsia/20 border border-euryx-cyan/40 text-white" data-testid="profile-rank">
                {rank}
              </span>
              <a href="https://hatake-social-beta.vercel.app/profile" target="_blank" rel="noreferrer" className="text-[10px] font-mono uppercase tracking-[0.25em] text-euryx-cyan hover:underline flex items-center gap-1">
                Hatake.Social <ExternalLink size={12} />
              </a>
            </div>
          </div>
          {stats && (
            <div className="text-right">
              <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-500">Elo</div>
              <div className="font-heading text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-euryx-cyan to-euryx-fuchsia" data-testid="profile-elo">
                {stats.elo}
              </div>
              <div className="text-[10px] font-mono text-slate-400">Peak {stats.peakElo}</div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Stat grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
          {[
            { label: "Games", value: stats.games, icon: History, color: "text-slate-300" },
            { label: "Wins", value: stats.wins, icon: Trophy, color: "text-euryx-cyan" },
            { label: "Losses", value: stats.losses, icon: Crosshair, color: "text-fuchsia-400" },
            { label: "Win Rate", value: `${stats.winRate}%`, icon: TrendingUp, color: "text-amber-400" },
            { label: "Streak", value: stats.streak, icon: Flame, color: "text-euryx-fuchsia" },
            { label: "Best Streak", value: stats.bestStreak, icon: Award, color: "text-amber-400" },
            { label: "Total Dmg", value: stats.totalDmg, icon: Crosshair, color: "text-euryx-cyan" },
            { label: "Knockouts", value: stats.totalKOs, icon: Trophy, color: "text-euryx-fuchsia" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="glass rounded-xl p-4 flex items-center justify-between" data-testid={`stat-${s.label.toLowerCase().replace(/\s/g, '-')}`}>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-slate-500">{s.label}</div>
                  <div className="font-heading font-black text-2xl text-white mt-1">{s.value}</div>
                </div>
                <Icon className={`w-5 h-5 ${s.color}`} />
              </div>
            );
          })}
        </div>
      )}

      {/* Recent matches */}
      <h2 className="font-heading text-2xl text-white font-bold mt-12 mb-4">Recent Matches</h2>
      {matches.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center font-mono text-sm text-slate-400" data-testid="matches-empty">
          No matches played yet.
          <div className="mt-3">
            <Link href="/queue" className="btn-neon btn-neon-cyan inline-flex">Find a match</Link>
          </div>
        </div>
      ) : (
        <div className="space-y-2" data-testid="matches-list">
          {matches.map((m) => (
            <motion.div key={m.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              className={`glass rounded-xl p-4 flex items-center gap-4 border ${m.result === "win" ? "border-euryx-cyan/30" : "border-fuchsia-500/30"}`}
              data-testid={`match-${m.id}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-heading font-black text-sm ${m.result === "win" ? "bg-euryx-cyan/15 text-euryx-cyan border border-euryx-cyan/40" : "bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/40"}`}>
                {m.result === "win" ? "W" : "L"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-heading font-bold text-white">vs {m.opponentName}</div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                  {m.reason || "—"} · {m.turnCount} turns · {Math.floor(m.durationSec / 60)}m{m.durationSec % 60}s
                </div>
              </div>
              <div className="text-right">
                <div className={`font-heading text-lg font-bold ${m.eloDelta >= 0 ? "text-euryx-cyan" : "text-fuchsia-300"}`}>
                  {m.eloDelta >= 0 ? "+" : ""}{m.eloDelta}
                </div>
                <div className="text-[10px] font-mono text-slate-500">{m.eloAfter} ELO</div>
              </div>
              <div className="text-[10px] font-mono text-slate-500 hidden md:block w-24 text-right">
                {new Date(m.endedAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-12 flex justify-between items-center">
        <Link href="/settings" className="text-xs font-mono text-slate-400 hover:text-white">Settings</Link>
        <button
          onClick={async () => { await fetch("/api/auth/logout", { method: "POST", credentials: "include" }); window.location.href = "/login"; }}
          className="text-xs font-mono text-fuchsia-300 hover:text-white flex items-center gap-2" data-testid="profile-logout-btn">
          <LogOut size={14} /> Log out
        </button>
      </div>
    </div>
  );
}
