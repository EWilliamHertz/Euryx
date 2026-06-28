"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { io, Socket } from "socket.io-client";
import {
  Shield, Layers, Trash2, ArrowLeft, Swords, MessageSquare, Send,
} from "lucide-react";
import { PokemonCard, EuryxCard } from "@/components/PokemonCard";

type Zone = "hand" | "active" | "bench" | "discard" | "prize" | "deck";
type PlayedCard = EuryxCard & { uid: string; zone: Zone; benchIndex?: number };

// Static demo deck so we always have something to play with (even without a saved deck)
const DEMO_NAMES = ["Pikachu", "Charizard", "Bulbasaur", "Mewtwo", "Snorlax", "Gengar", "Eevee", "Lucario", "Garchomp", "Greninja"];

async function fetchDemoCards(): Promise<EuryxCard[]> {
  const picks: EuryxCard[] = [];
  for (const n of DEMO_NAMES) {
    try {
      const r = await fetch(`/api/pokemon/search?search=${encodeURIComponent(n)}&limit=3`);
      const d = await r.json();
      if (d.cards && d.cards[0]) picks.push(d.cards[0]);
    } catch {}
  }
  return picks;
}

function uid(prefix = "c") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function PlayRoomPage() {
  const params = useParams<{ roomId: string }>();
  const router = useRouter();
  const roomId = params.roomId;
  const [user, setUser] = useState<{ id: string; username: string } | null>(null);
  const [opponent, setOpponent] = useState<{ username: string } | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Player zones
  const [hand, setHand] = useState<PlayedCard[]>([]);
  const [active, setActive] = useState<PlayedCard | null>(null);
  const [bench, setBench] = useState<(PlayedCard | null)[]>([null, null, null, null, null]);
  const [discard, setDiscard] = useState<PlayedCard[]>([]);
  const [prize, setPrize] = useState<number>(6);
  const [deckCount, setDeckCount] = useState<number>(50);

  // Opponent zones (mirrored, face-down where appropriate)
  const [oppActive, setOppActive] = useState<PlayedCard | null>(null);
  const [oppBench, setOppBench] = useState<(PlayedCard | null)[]>([null, null, null, null, null]);
  const [oppDiscard, setOppDiscard] = useState<PlayedCard[]>([]);
  const [oppHandCount, setOppHandCount] = useState<number>(7);
  const [oppPrize] = useState<number>(6);

  // Selection / placement modal
  const [picking, setPicking] = useState<{ card: PlayedCard } | null>(null);

  // Chat
  const [chat, setChat] = useState<{ text: string; username: string; at: number }[]>([]);
  const [chatInput, setChatInput] = useState("");

  // Boot
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setUser(d.user || { id: "guest-" + uid("u"), username: "Guest" }));
  }, []);

  useEffect(() => {
    fetchDemoCards().then((cards) => {
      const startingHand = cards.slice(0, 7).map((c) => ({ ...c, uid: uid("h"), zone: "hand" as Zone, variant: "EN" }));
      setHand(startingHand);
      setDeckCount(50);
    });
  }, []);

  // Socket
  useEffect(() => {
    if (!user) return;
    const s = io({ path: "/socket.io", transports: ["websocket", "polling"] });
    socketRef.current = s;
    s.emit("room:join", { roomId, userId: user.id, username: user.username });
    s.on("opponent:joined", ({ username }) => setOpponent({ username }));
    s.on("game:move", ({ move }) => applyOpponentMove(move));
    s.on("game:chat", (msg) => setChat((c) => [...c, msg].slice(-30)));
    return () => {
      s.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, roomId]);

  function emit(move: any) {
    socketRef.current?.emit("game:move", { roomId, move });
  }

  function applyOpponentMove(move: any) {
    if (move.type === "play-active") {
      setOppActive({ ...move.card, uid: move.card.uid, zone: "active" });
      setOppHandCount((n) => Math.max(0, n - 1));
    } else if (move.type === "play-bench") {
      setOppBench((b) => {
        const nb = [...b];
        nb[move.index] = { ...move.card, uid: move.card.uid, zone: "bench", benchIndex: move.index };
        return nb;
      });
      setOppHandCount((n) => Math.max(0, n - 1));
    } else if (move.type === "discard-active") {
      setOppDiscard((d) => (oppActive ? [...d, oppActive] : d));
      setOppActive(null);
    } else if (move.type === "draw") {
      setOppHandCount((n) => n + 1);
    }
  }

  function playToActive(card: PlayedCard) {
    if (active) return; // already filled
    setHand((h) => h.filter((c) => c.uid !== card.uid));
    setActive({ ...card, zone: "active" });
    emit({ type: "play-active", card: { ...card, uid: card.uid } });
    setPicking(null);
  }

  function playToBench(card: PlayedCard, idx: number) {
    if (bench[idx]) return;
    setHand((h) => h.filter((c) => c.uid !== card.uid));
    setBench((b) => {
      const nb = [...b];
      nb[idx] = { ...card, zone: "bench", benchIndex: idx };
      return nb;
    });
    emit({ type: "play-bench", card: { ...card, uid: card.uid }, index: idx });
    setPicking(null);
  }

  function discardActive() {
    if (!active) return;
    setDiscard((d) => [...d, { ...active, zone: "discard" }]);
    setActive(null);
    emit({ type: "discard-active" });
  }

  function drawCard() {
    if (deckCount <= 0) return;
    // Pick a random known card pool, or just repeat from hand
    setDeckCount((n) => n - 1);
    fetchDemoCards().then((arr) => {
      const c = arr[Math.floor(Math.random() * arr.length)];
      if (!c) return;
      const newCard: PlayedCard = { ...c, uid: uid("d"), zone: "hand", variant: "EN" };
      setHand((h) => [...h, newCard]);
    });
    emit({ type: "draw" });
  }

  function sendChat() {
    if (!chatInput.trim() || !user) return;
    socketRef.current?.emit("game:chat", { roomId, text: chatInput, username: user.username });
    setChatInput("");
  }

  const benchSlots = useMemo(() => bench, [bench]);
  const oppBenchSlots = useMemo(() => oppBench, [oppBench]);

  return (
    <LayoutGroup>
      <div className="fixed inset-0 bg-black text-white overflow-hidden font-mono select-none" data-testid="game-board">
        {/* Ambient backdrop */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 0%, rgba(255,0,255,0.18), transparent 45%), radial-gradient(circle at 50% 100%, rgba(0,240,255,0.2), transparent 45%)",
          }}
        />
        <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

        {/* Top HUD */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-50">
          <button
            onClick={() => router.push("/dashboard")}
            className="glass-strong rounded-full px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.25em] text-slate-300 hover:text-white flex items-center gap-2"
            data-testid="game-leave-btn"
          >
            <ArrowLeft className="w-3 h-3" /> Concede
          </button>
          <div className="glass-strong rounded-full px-4 py-1.5 text-[10px] font-mono uppercase tracking-[0.3em] text-slate-300" data-testid="game-room-id">
            ROOM · {roomId.slice(0, 8)}
          </div>
          <div className="glass-strong rounded-full px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.25em] text-slate-300 flex items-center gap-2" data-testid="game-opponent-label">
            <Shield className="w-3 h-3 text-euryx-fuchsia" />
            {opponent?.username || "Waiting…"}
          </div>
        </div>

        {/* === OPPONENT HALF (rotated 180) === */}
        <div className="absolute top-0 left-0 right-0 h-1/2 px-6 pt-12 pb-2 rotate-180" data-testid="opponent-half">
          <BoardHalf
            label="OPPONENT"
            active={oppActive}
            bench={oppBenchSlots}
            discard={oppDiscard}
            deckCount={32}
            prize={oppPrize}
            handCount={oppHandCount}
            rotated
            isOpponent
          />
        </div>

        {/* Center separator */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-euryx-cyan/40 to-transparent z-10"></div>

        {/* === PLAYER HALF === */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 px-6 pt-2 pb-36" data-testid="player-half">
          <BoardHalf
            label="YOU"
            active={active}
            bench={benchSlots}
            discard={discard}
            deckCount={deckCount}
            prize={prize}
            handCount={hand.length}
            isOpponent={false}
            onActiveClick={() => active && discardActive()}
            onDrawClick={drawCard}
            onBenchSlotClick={(idx) => picking && playToBench(picking.card, idx)}
          />
        </div>

        {/* Player Hand (floating) */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-30 pb-2 pt-8" data-testid="player-hand">
          <div className="flex items-end justify-center -space-x-8 hover:-space-x-1 transition-all duration-300 group">
            <AnimatePresence>
              {hand.map((card, idx) => (
                <motion.div
                  key={card.uid}
                  layout
                  layoutId={card.uid}
                  initial={{ opacity: 0, y: 80 }}
                  animate={{ opacity: 1, y: 0, rotate: (idx - (hand.length - 1) / 2) * 4 }}
                  exit={{ opacity: 0, y: 80 }}
                  whileHover={{ y: -28, rotate: 0, scale: 1.08, zIndex: 40 }}
                  transition={{ type: "spring", stiffness: 280, damping: 22 }}
                  onClick={() => setPicking({ card })}
                  className="cursor-pointer"
                >
                  <PokemonCard
                    card={card}
                    variant={card.variant}
                    size="lg"
                    layoutId={card.uid}
                    testId={`hand-card-${card.uid}`}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Card placement picker */}
        <AnimatePresence>
          {picking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center px-6"
              onClick={() => setPicking(null)}
              data-testid="card-place-modal"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="glass-strong rounded-2xl p-6 w-full max-w-xl"
              >
                <div className="flex items-center gap-3 mb-5">
                  <Swords className="w-5 h-5 text-euryx-cyan" />
                  <h3 className="font-heading font-black text-lg tracking-wider text-white">Play {picking.card.name}</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    disabled={!!active}
                    onClick={() => playToActive(picking.card)}
                    className="btn-neon btn-neon-cyan w-full disabled:opacity-40"
                    data-testid="play-active-btn"
                  >
                    {active ? "Active Filled" : "→ Active Spot"}
                  </button>
                  <button
                    onClick={() => setPicking(null)}
                    className="btn-neon btn-neon-ghost w-full"
                    data-testid="play-cancel-btn"
                  >
                    Cancel
                  </button>
                </div>
                <div className="mt-4 text-[10px] font-mono uppercase tracking-[0.3em] text-slate-400">Or pick a Bench slot:</div>
                <div className="mt-2 grid grid-cols-5 gap-2">
                  {bench.map((slot, i) => (
                    <button
                      key={i}
                      disabled={!!slot}
                      onClick={() => playToBench(picking.card, i)}
                      className={`h-16 rounded-lg border ${
                        slot ? "border-white/10 bg-white/5 cursor-not-allowed opacity-50" : "border-euryx-cyan/40 bg-euryx-cyan/5 hover:bg-euryx-cyan/15"
                      } flex items-center justify-center font-mono text-xs text-slate-300 transition`}
                      data-testid={`play-bench-${i}-btn`}
                    >
                      B{i + 1}
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat */}
        <ChatPanel chat={chat} input={chatInput} setInput={setChatInput} onSend={sendChat} />
      </div>
    </LayoutGroup>
  );
}

function BoardHalf({
  label,
  active,
  bench,
  discard,
  deckCount,
  prize,
  handCount,
  rotated = false,
  isOpponent,
  onActiveClick,
  onDrawClick,
  onBenchSlotClick,
}: {
  label: string;
  active: PlayedCard | null;
  bench: (PlayedCard | null)[];
  discard: PlayedCard[];
  deckCount: number;
  prize: number;
  handCount: number;
  rotated?: boolean;
  isOpponent: boolean;
  onActiveClick?: () => void;
  onDrawClick?: () => void;
  onBenchSlotClick?: (idx: number) => void;
}) {
  return (
    <div className="relative w-full h-full">
      {/* Prize cards (left) */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-1.5" data-testid={`${isOpponent ? "opp" : "player"}-prize-stack`}>
        <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-slate-500 mb-1">Prize · {prize}</div>
        {Array.from({ length: prize }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="w-10 h-14 rounded-md border border-euryx-fuchsia/40 bg-gradient-to-br from-fuchsia-950 to-black"
            style={{ boxShadow: "0 0 12px rgba(255,0,255,0.25)" }}
          />
        ))}
      </div>

      {/* Active Spot (center) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center" data-testid={`${isOpponent ? "opp" : "player"}-active-spot`}>
        <div className="text-[9px] font-mono uppercase tracking-[0.3em] text-euryx-cyan mb-1.5 neon-cyan">ACTIVE</div>
        <div
          onClick={onActiveClick}
          className={`w-36 h-48 rounded-xl border-2 ${
            active ? "border-euryx-cyan/70" : "border-dashed border-white/15"
          } bg-slate-950/40 backdrop-blur-sm flex items-center justify-center relative`}
          style={active ? { boxShadow: "0 0 30px rgba(0,240,255,0.4)" } : undefined}
        >
          {active ? (
            <PokemonCard
              card={active}
              variant={active.variant}
              size="lg"
              layoutId={active.uid}
              testId={`${isOpponent ? "opp" : "player"}-active-card`}
              faceDown={false}
            />
          ) : (
            <span className="text-[10px] font-mono text-slate-500 tracking-[0.3em]">EMPTY</span>
          )}
        </div>
      </div>

      {/* Bench */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2.5" data-testid={`${isOpponent ? "opp" : "player"}-bench`}>
        {bench.map((slot, i) => (
          <div
            key={i}
            onClick={() => onBenchSlotClick && onBenchSlotClick(i)}
            className={`w-24 h-32 rounded-lg border ${
              slot ? "border-white/15" : "border-dashed border-white/10"
            } bg-slate-950/40 backdrop-blur-sm flex items-center justify-center relative cursor-pointer hover:border-euryx-cyan/50 transition`}
            data-testid={`${isOpponent ? "opp" : "player"}-bench-${i}`}
          >
            {slot ? (
              <PokemonCard card={slot} variant={slot.variant} size="md" layoutId={slot.uid} testId={`${isOpponent ? "opp" : "player"}-bench-card-${i}`} />
            ) : (
              <span className="text-[9px] font-mono text-slate-600 tracking-widest">B{i + 1}</span>
            )}
          </div>
        ))}
      </div>

      {/* Deck (right bottom) */}
      <div className="absolute right-2 bottom-2 flex flex-col items-center" data-testid={`${isOpponent ? "opp" : "player"}-deck`}>
        <div className="text-[9px] font-mono uppercase tracking-[0.3em] text-slate-500 mb-1">DECK · {deckCount}</div>
        <div
          onClick={onDrawClick}
          className="w-16 h-22 relative cursor-pointer"
          style={{ height: 88 }}
        >
          <div className="absolute inset-0 rounded-md border border-euryx-cyan/40 bg-gradient-to-br from-cyan-950 to-black" style={{ transform: "translate(-3px,-3px)" }} />
          <div className="absolute inset-0 rounded-md border border-euryx-cyan/40 bg-gradient-to-br from-cyan-950 to-black" style={{ transform: "translate(-1px,-1px)" }} />
          <div
            className="absolute inset-0 rounded-md border border-euryx-cyan/60 bg-gradient-to-br from-cyan-950 to-black flex items-center justify-center"
            style={{ boxShadow: "0 0 16px rgba(0,240,255,0.35)" }}
          >
            <Layers className="w-5 h-5 text-euryx-cyan" />
          </div>
        </div>
      </div>

      {/* Discard */}
      <div className="absolute right-24 bottom-2 flex flex-col items-center" data-testid={`${isOpponent ? "opp" : "player"}-discard`}>
        <div className="text-[9px] font-mono uppercase tracking-[0.3em] text-slate-500 mb-1">DISCARD · {discard.length}</div>
        <div className="w-16 h-22 rounded-md border border-fuchsia-500/30 bg-fuchsia-950/30 flex items-center justify-center" style={{ height: 88 }}>
          {discard.length > 0 ? (
            <PokemonCard card={discard[discard.length - 1]} size="sm" showVariantBadge={false} />
          ) : (
            <Trash2 className="w-4 h-4 text-fuchsia-300/60" />
          )}
        </div>
      </div>

      {/* Hand counter (top of half) */}
      <div className="absolute top-1 right-2 text-[10px] font-mono uppercase tracking-[0.3em] text-slate-400">
        {label} · HAND {handCount}
      </div>

      {/* Opponent face-down hand strip */}
      {isOpponent && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[140%] flex -space-x-6" data-testid="opp-hand">
          {Array.from({ length: Math.min(handCount, 7) }).map((_, i) => (
            <div
              key={i}
              className="w-12 h-16 rounded-md border border-euryx-fuchsia/40 bg-gradient-to-br from-fuchsia-950 to-black"
              style={{ boxShadow: "0 0 10px rgba(255,0,255,0.2)" }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ChatPanel({
  chat,
  input,
  setInput,
  onSend,
}: {
  chat: { text: string; username: string; at: number }[];
  input: string;
  setInput: (s: string) => void;
  onSend: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="absolute top-1/2 right-3 -translate-y-1/2 z-40 flex flex-col items-end gap-2" data-testid="game-chat-panel">
      <button
        onClick={() => setOpen((v) => !v)}
        className="glass-strong rounded-full p-2.5 hover:bg-white/10 transition relative"
        data-testid="chat-toggle-btn"
      >
        <MessageSquare className="w-4 h-4 text-euryx-cyan" />
        {chat.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-euryx-fuchsia text-white text-[9px] font-bold flex items-center justify-center">
            {chat.length}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="glass-strong rounded-xl w-72 h-80 flex flex-col p-3"
          >
            <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-400 mb-2">Match Chat</div>
            <div className="flex-1 overflow-y-auto space-y-1.5 text-xs">
              {chat.length === 0 && (
                <div className="text-slate-600 font-mono text-[11px]">No messages.</div>
              )}
              {chat.map((m, i) => (
                <div key={i} className="bg-slate-950/60 rounded-md px-2 py-1.5">
                  <span className="text-euryx-cyan text-[10px] uppercase tracking-wider">{m.username}</span>
                  <div className="text-slate-200">{m.text}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSend()}
                className="input-euryx text-xs flex-1 py-2"
                placeholder="gg"
                data-testid="chat-input"
              />
              <button onClick={onSend} className="btn-neon btn-neon-cyan py-2 px-3" data-testid="chat-send-btn">
                <Send className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
