"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { User, ExternalLink, BookOpenCheck, Trophy, Settings, Layers, LogOut } from "lucide-react";

type Profile = { id: string; username: string; email: string } | null;
type Deck = { id: string; name: string; cards: any[]; createdAt: string; updatedAt: string };

export default function ProfilePage() {
  const [user, setUser] = useState<Profile>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setUser(d.user || null); setChecked(true); });
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch("/api/decks", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setDecks(d.decks || []));
  }, [user]);

  if (checked && !user) {
    return (
      <div className="min-h-screen pt-32 px-6 text-center max-w-md mx-auto">
        <h1 className="font-heading text-3xl text-white mb-3">Sign in</h1>
        <p className="text-slate-400 font-mono text-sm mb-6">
          Profile requires a Hatake account.
        </p>
        <Link href="/login" className="btn-neon btn-neon-cyan" data-testid="profile-signin-link">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-6 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-[11px] font-mono uppercase tracking-[0.35em] text-slate-500 mb-2">Trainer Card</div>
        <div className="flex items-center gap-6 flex-wrap">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-white"
            style={{
              background: "conic-gradient(from 220deg at 50% 50%, #00f0ff 0deg, #ffffff 80deg, #ff00ff 160deg, #00f0ff 280deg, #ff00ff 340deg, #00f0ff 360deg)",
              boxShadow: "0 0 40px rgba(0,240,255,0.4)",
            }}
          >
            <div className="w-[88px] h-[88px] rounded-full bg-slate-950 flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
          </div>
          <div>
            <h1 className="font-heading text-5xl font-black tracking-tighter text-white" data-testid="profile-username">
              {user?.username}
            </h1>
            <div className="font-mono text-xs text-slate-400 mt-1">{user?.email}</div>
            <div className="flex gap-3 mt-3">
              <a
                href="https://hatake-social-beta.vercel.app/profile"
                target="_blank" rel="noreferrer"
                className="text-[10px] font-mono uppercase tracking-[0.25em] text-euryx-cyan hover:underline flex items-center gap-1"
                data-testid="profile-hatake-link"
              >
                Manage on Hatake.Social <ExternalLink size={12} />
              </a>
              <Link href="/settings" className="text-[10px] font-mono uppercase tracking-[0.25em] text-slate-400 hover:text-white flex items-center gap-1">
                Settings
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
        {[
          { label: "Decks", value: decks.length, icon: BookOpenCheck, color: "text-euryx-cyan" },
          { label: "Cups Joined", value: 0, icon: Trophy, color: "text-amber-400" },
          { label: "Wins", value: "—", icon: Layers, color: "text-euryx-fuchsia" },
          { label: "Streak", value: "—", icon: Layers, color: "text-slate-300" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="glass rounded-xl p-4 flex items-center justify-between" data-testid={`profile-stat-${s.label.toLowerCase()}`}>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-slate-500">{s.label}</div>
                <div className="font-heading font-black text-2xl text-white mt-1">{s.value}</div>
              </div>
              <Icon className={`w-5 h-5 ${s.color}`} />
            </div>
          );
        })}
      </div>

      <h2 className="font-heading text-2xl text-white font-bold mt-12 mb-4">Your Decks</h2>
      {decks.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center" data-testid="profile-decks-empty">
          <div className="font-mono text-sm text-slate-400">No decks yet.</div>
          <Link href="/deck-builder" className="btn-neon btn-neon-cyan mt-4 inline-flex">Build your first deck</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {decks.map((d) => (
            <div key={d.id} className="glass rounded-xl p-5 border border-white/10" data-testid={`profile-deck-${d.id}`}>
              <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-slate-500">DECK</div>
              <div className="font-heading text-xl font-bold text-white mt-1 truncate">{d.name}</div>
              <div className="font-mono text-xs text-slate-400 mt-2">{d.cards.length}/60 cards</div>
              <div className="h-1 rounded-full bg-slate-900 mt-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-euryx-cyan to-euryx-fuchsia" style={{ width: `${Math.min(100, (d.cards.length / 60) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 flex justify-between items-center">
        <Link href="/settings" className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-2">
          <Settings size={14} /> Settings
        </Link>
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
            window.location.href = "/login";
          }}
          className="text-xs font-mono text-fuchsia-300 hover:text-white flex items-center gap-2"
          data-testid="profile-logout-btn"
        >
          <LogOut size={14} /> Log out
        </button>
      </div>
    </div>
  );
}
