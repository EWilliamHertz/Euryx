"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Settings as SettingsIcon, Zap, MessageCircle, Eye, Trophy } from "lucide-react";

type Settings = {
  showChatInGame: boolean;
  preferredSeat: "auto" | "player1" | "player2";
  reduceMotion: boolean;
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [savedMsg, setSaved] = useState<string | null>(null);
  const [anon, setAnon] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setSettings(d.settings);
        setAnon(!!d.anonymous);
        setLoading(false);
      });
  }, []);

  async function save(patch: Partial<Settings>) {
    if (!settings) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    if (anon) {
      setSaved("Sign in to persist this setting across devices.");
      setTimeout(() => setSaved(null), 2500);
      return;
    }
    const r = await fetch("/api/settings", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (r.ok) {
      const d = await r.json();
      setSettings(d.settings);
      setSaved("Saved");
      setTimeout(() => setSaved(null), 1500);
    } else {
      setSaved("Save failed");
      setTimeout(() => setSaved(null), 2000);
    }
  }

  return (
    <div className="min-h-screen pt-24 px-6 max-w-3xl mx-auto pb-32">
      <div className="flex items-center gap-3 mb-2">
        <SettingsIcon className="w-6 h-6 text-euryx-cyan" />
        <span className="text-[11px] font-mono uppercase tracking-[0.35em] text-slate-500">Configuration</span>
      </div>
      <h1 className="font-heading text-5xl font-black tracking-tighter text-white" data-testid="settings-title">
        Settings
      </h1>
      <p className="font-mono text-sm text-slate-400 mt-3">
        Tweak how Euryx behaves. Synced to your Hatake account.
      </p>

      {anon && (
        <div className="mt-6 glass rounded-xl p-4 border border-euryx-fuchsia/30 text-sm font-mono text-fuchsia-200" data-testid="settings-anon-notice">
          You're not signed in — changes are session-only.
          <a href="/login" className="text-euryx-cyan underline ml-2">Sign in</a>
        </div>
      )}

      {savedMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-40 glass-strong rounded-full px-4 py-2 text-xs font-mono text-euryx-cyan" data-testid="settings-saved-toast">
          {savedMsg}
        </div>
      )}

      <div className="mt-10 space-y-4">
        {settings && (
          <>
            <Toggle
              icon={MessageCircle}
              title="Show messenger in-game"
              subtitle="Floating chat bubble stays visible during matches. The HaloNav itself always hides in-game."
              value={settings.showChatInGame}
              onChange={(v) => save({ showChatInGame: v })}
              testId="setting-show-chat-in-game"
            />
            <Toggle
              icon={Eye}
              title="Reduce motion"
              subtitle="Tone down card flight animations & background pulse — good for accessibility or slow connections."
              value={settings.reduceMotion}
              onChange={(v) => save({ reduceMotion: v })}
              testId="setting-reduce-motion"
            />
            <Radio
              icon={Trophy}
              title="Preferred seat"
              subtitle="When matched, you'll be assigned this seat if available."
              value={settings.preferredSeat}
              options={[
                { value: "auto", label: "Auto" },
                { value: "player1", label: "Player 1" },
                { value: "player2", label: "Player 2" },
              ]}
              onChange={(v) => save({ preferredSeat: v as any })}
              testId="setting-preferred-seat"
            />
          </>
        )}
        {loading && <div className="text-slate-500 font-mono text-sm">Loading…</div>}
      </div>

      <div className="mt-12 glass rounded-xl p-6 border border-white/10 flex items-start gap-4">
        <Zap className="w-5 h-5 text-euryx-cyan mt-0.5" />
        <div className="flex-1">
          <h3 className="font-heading font-bold text-white">Account</h3>
          <p className="font-mono text-xs text-slate-400 mt-1 leading-relaxed">
            Your Euryx login uses your Hatake.Social account. Change email, password, or shipping info on
            <a href="https://hatake-social-beta.vercel.app/profile" target="_blank" rel="noreferrer" className="text-euryx-cyan ml-1 underline">hatake.social</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

function Toggle({
  icon: Icon, title, subtitle, value, onChange, testId,
}: {
  icon: any; title: string; subtitle: string;
  value: boolean; onChange: (v: boolean) => void; testId: string;
}) {
  return (
    <motion.div
      whileHover={{ x: 2 }}
      className="glass rounded-xl p-5 border border-white/10 flex items-center gap-4"
      data-testid={`${testId}-row`}
    >
      <Icon className="w-5 h-5 text-euryx-cyan shrink-0" />
      <div className="flex-1">
        <div className="font-heading font-bold text-white">{title}</div>
        <div className="font-mono text-xs text-slate-400 mt-1">{subtitle}</div>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-12 h-7 rounded-full transition-all shrink-0 ${value ? "bg-euryx-cyan/30 border border-euryx-cyan/60" : "bg-slate-800 border border-white/10"}`}
        data-testid={testId}
        aria-pressed={value}
      >
        <motion.div
          animate={{ x: value ? 22 : 2 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full ${value ? "bg-euryx-cyan shadow-[0_0_12px_rgba(0,240,255,0.8)]" : "bg-slate-400"}`}
        />
      </button>
    </motion.div>
  );
}

function Radio({
  icon: Icon, title, subtitle, value, options, onChange, testId,
}: {
  icon: any; title: string; subtitle: string;
  value: string; options: { value: string; label: string }[];
  onChange: (v: string) => void; testId: string;
}) {
  return (
    <div className="glass rounded-xl p-5 border border-white/10 flex items-center gap-4">
      <Icon className="w-5 h-5 text-euryx-cyan shrink-0" />
      <div className="flex-1">
        <div className="font-heading font-bold text-white">{title}</div>
        <div className="font-mono text-xs text-slate-400 mt-1">{subtitle}</div>
      </div>
      <div className="flex gap-1">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            data-testid={`${testId}-${o.value}`}
            className={`px-3 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-[0.15em] transition-all ${
              value === o.value
                ? "bg-euryx-cyan/15 border border-euryx-cyan/60 text-euryx-cyan"
                : "bg-slate-900/60 border border-white/10 text-slate-400 hover:text-white"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
