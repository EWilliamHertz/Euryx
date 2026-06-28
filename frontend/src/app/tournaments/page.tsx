"use client";
import { motion } from "framer-motion";
import { Trophy, Lock } from "lucide-react";

export default function TournamentsPage() {
  return (
    <div className="min-h-screen pt-32 px-6 max-w-5xl mx-auto">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-heading text-5xl font-black tracking-tight text-white"
        data-testid="tournaments-title"
      >
        Tournaments
      </motion.h1>
      <p className="font-mono text-sm text-slate-400 mt-3">
        Seasonal cups, invitationals, and qualifier ladders. Stay tuned.
      </p>

      <div className="grid md:grid-cols-2 gap-5 mt-10">
        {[
          { name: "Season 01 · Inaugural Cup", date: "Reveal — Q1 2026", prize: "5,000 Hatake Credits" },
          { name: "Vault Invitational", date: "Application — TBA", prize: "Limited Promo Frames" },
          { name: "Hatake Open", date: "Open Sign-ups — Soon", prize: "Sponsored by Hatake.Social" },
          { name: "Regional Bracket", date: "Stage 1 — Soon", prize: "Top-cut → Open" },
        ].map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            className="glass rounded-xl p-5 border border-white/10 flex items-center gap-4"
            data-testid={`tournament-card-${i}`}
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-400/30 to-amber-700/0 border border-amber-400/30 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-300" />
            </div>
            <div className="flex-1">
              <div className="font-heading font-bold text-white">{t.name}</div>
              <div className="font-mono text-[11px] text-slate-400 tracking-wider mt-1">{t.date}</div>
              <div className="font-mono text-[11px] text-amber-300/80 mt-1">{t.prize}</div>
            </div>
            <Lock className="w-4 h-4 text-slate-500" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
