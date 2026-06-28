"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Wand2, Plus, BookOpenCheck, Sparkles } from "lucide-react";

type Deck = {
  id: string;
  name: string;
  cards: { id: string; name: string; imageUrl?: string | null; variant?: string | null }[];
  updatedAt: string;
};

export default function VaultPage() {
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [checked, setChecked] = useState(false);
  const [decks, setDecks] = useState<Deck[]>([]);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setUser(d.user); setChecked(true); });
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch("/api/decks", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setDecks(d.decks || []));
  }, [user]);

  return (
    <div className="min-h-screen pt-24 px-6 max-w-6xl mx-auto pb-32">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Wand2 className="w-6 h-6 text-euryx-fuchsia" />
            <span className="text-[11px] font-mono uppercase tracking-[0.35em] text-slate-500">
              Trainer Collection
            </span>
          </div>
          <h1 className="font-heading text-5xl font-black tracking-tighter text-white mt-1" data-testid="vault-title">
            Vault
          </h1>
          <p className="font-mono text-sm text-slate-400 mt-3 max-w-xl">
            Your saved decks live here. Cards drawn from the Hatake.Social card universe.
          </p>
        </div>
        <Link href="/deck-builder" className="btn-neon btn-neon-cyan" data-testid="vault-new-deck-btn">
          <Plus className="w-4 h-4" /> New Deck
        </Link>
      </div>

      {checked && !user && (
        <div className="mt-12 glass rounded-2xl p-12 text-center" data-testid="vault-anon">
          <Sparkles className="w-8 h-8 text-euryx-cyan mx-auto mb-3" />
          <h2 className="font-heading text-2xl text-white font-bold">Sign in to access your Vault</h2>
          <p className="font-mono text-sm text-slate-400 mt-2 mb-5">
            Decks are tied to your Hatake account.
          </p>
          <Link href="/login" className="btn-neon btn-neon-cyan inline-flex" data-testid="vault-signin-link">
            Sign in
          </Link>
        </div>
      )}

      {user && decks.length === 0 && (
        <div className="mt-12 glass rounded-2xl p-12 text-center" data-testid="vault-empty">
          <BookOpenCheck className="w-8 h-8 text-euryx-cyan mx-auto mb-3" />
          <h2 className="font-heading text-2xl text-white font-bold">Your vault is empty</h2>
          <p className="font-mono text-sm text-slate-400 mt-2 mb-5">
            Forge your first 60-card deck in the Deck Builder.
          </p>
          <Link href="/deck-builder" className="btn-neon btn-neon-fuchsia inline-flex">
            Build a Deck
          </Link>
        </div>
      )}

      {user && decks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-10" data-testid="vault-decks-grid">
          {decks.map((d, i) => {
            const cover = d.cards.find((c) => c.imageUrl)?.imageUrl;
            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4 }}
                className="glass rounded-2xl overflow-hidden border border-white/10 hover:border-euryx-cyan/40 hover:shadow-[0_0_30px_rgba(0,240,255,0.18)] transition-all"
                data-testid={`vault-deck-${d.id}`}
              >
                <div className="relative h-44 bg-slate-950 overflow-hidden">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt="" className="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-900 to-black" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  <div className="absolute bottom-3 left-4">
                    <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-euryx-cyan">DECK</div>
                    <div className="font-heading text-xl font-black text-white truncate max-w-[260px]">{d.name}</div>
                  </div>
                  <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/60 backdrop-blur border border-white/20 text-[10px] font-mono">
                    {d.cards.length}/60
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex -space-x-3">
                    {d.cards.slice(0, 5).map((c, idx) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <div
                        key={c.id}
                        className="w-7 h-10 rounded-md border border-white/20 bg-slate-900 overflow-hidden"
                        style={{ zIndex: 10 - idx }}
                      >
                        {c.imageUrl && <img src={c.imageUrl} alt="" className="w-full h-full object-cover" />}
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    {new Date(d.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
