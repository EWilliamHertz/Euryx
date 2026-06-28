"use client";

// Euryx Messenger — adapted from Hatake.Social's ChatWidget. Calls our
// /api/chat proxy which forwards to Hatake's /api/chat so messages flow
// natively between the two apps.
//
// Visibility rules:
//   - On lobby routes (anything not /play/*): always shown if logged in.
//   - On in-game route (/play/*): shown only when user setting
//     `showChatInGame === true` (or when localStorage override is set).

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Plus, ChevronLeft, Globe, User } from "lucide-react";

type ChatMessage = {
  id: string;
  senderId: string;
  sender: { username: string };
  receiverId?: string | null;
  receiver?: { username: string } | null;
  content: string;
  createdAt: string;
};

type SessionUser = { id: string; username: string } | null;

export function MessengerWidget() {
  const pathname = usePathname() || "/";
  const inGame = pathname.startsWith("/play/");

  const [user, setUser] = useState<SessionUser>(null);
  const [showInGame, setShowInGame] = useState<boolean>(false);
  const [isOpen, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [view, setView] = useState<"LIST" | "GLOBAL" | "PRIVATE">("LIST");
  const [privateRecipient, setPrivateRecipient] = useState<{ id: string; username: string } | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatUsername, setNewChatUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Auth + settings boot
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setUser(d.user || null));
    fetch("/api/settings", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setShowInGame(!!d?.settings?.showChatInGame))
      .catch(() => {});
  }, [pathname]);

  // Polling
  useEffect(() => {
    if (!isOpen || !user) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const r = await fetch("/api/chat", { credentials: "include" });
        if (!r.ok) {
          if (r.status === 401) setError("Sign in to use chat");
          else setError("Chat upstream unavailable");
          return;
        }
        const d = await r.json();
        if (!cancelled) {
          setMessages(d.messages || []);
          setError(null);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "fetch_failed");
      }
    };
    tick();
    const id = setInterval(tick, 3500);
    return () => { cancelled = true; clearInterval(id); };
  }, [isOpen, user]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, view]);

  // Hidden if user opts not to see in-game
  if (inGame && !showInGame) return null;

  async function send() {
    if (!input.trim() || !user) return;
    const text = input.trim();
    setInput("");
    const optimistic: ChatMessage = {
      id: `tmp-${Date.now()}`,
      senderId: user.id,
      sender: { username: user.username },
      receiverId: view === "PRIVATE" && privateRecipient ? privateRecipient.id : null,
      receiver: view === "PRIVATE" && privateRecipient ? { username: privateRecipient.username } : null,
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: text,
          receiverId: view === "PRIVATE" && privateRecipient ? privateRecipient.id : null,
        }),
      });
      if (!r.ok) {
        setMessages((m) => m.filter((x) => x.id !== optimistic.id));
        const j = await r.json().catch(() => ({}));
        setError(j.error || "Send failed");
      }
    } catch (e: any) {
      setMessages((m) => m.filter((x) => x.id !== optimistic.id));
      setError(e?.message || "Send failed");
    }
  }

  async function startNewChat() {
    if (!newChatUsername.trim()) return;
    try {
      const r = await fetch(`/api/users?username=${encodeURIComponent(newChatUsername.trim())}`, {
        credentials: "include",
      });
      const d = await r.json();
      const found = (d.users || []).find(
        (u: any) => u.username?.toLowerCase() === newChatUsername.toLowerCase()
      );
      if (found) {
        setPrivateRecipient({ id: found.id, username: found.username });
        setView("PRIVATE");
        setShowNewChat(false);
        setNewChatUsername("");
      } else {
        setError("User not found");
      }
    } catch {
      setError("Lookup failed");
    }
  }

  // Compute threads
  const threads = new Map<string, { id: string; username: string; last: string; lastTime: string }>();
  if (user) {
    for (const m of messages) {
      if (m.receiverId && (m.senderId === user.id || m.receiverId === user.id)) {
        const otherId = m.senderId === user.id ? m.receiverId : m.senderId;
        const otherName = m.senderId === user.id ? m.receiver?.username : m.sender?.username;
        if (otherId && otherName && !threads.has(otherId)) {
          threads.set(otherId, { id: otherId, username: otherName, last: m.content, lastTime: m.createdAt });
        }
      }
    }
  }

  const shown = messages
    .filter((m) =>
      view === "GLOBAL"
        ? !m.receiverId
        : view === "PRIVATE" && privateRecipient && user
        ? (m.receiverId === privateRecipient.id && m.senderId === user.id) ||
          (m.receiverId === user.id && m.senderId === privateRecipient.id)
        : false
    )
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <>
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="fixed bottom-6 right-6 p-4 rounded-full text-white z-50"
        style={{
          background: "linear-gradient(135deg, #00f0ff, #ff00ff)",
          boxShadow:
            "0 0 25px rgba(0,240,255,0.55), 0 0 50px rgba(255,0,255,0.4), inset 0 0 12px rgba(255,255,255,0.18)",
        }}
        data-testid="messenger-toggle-btn"
        aria-label="Open messenger"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className="fixed bottom-24 right-6 w-[22rem] md:w-96 h-[520px] rounded-3xl z-50 flex flex-col overflow-hidden"
            style={{
              background: "rgba(2, 6, 23, 0.92)",
              backdropFilter: "blur(28px) saturate(160%)",
              WebkitBackdropFilter: "blur(28px) saturate(160%)",
              border: "1px solid rgba(0, 240, 255, 0.3)",
              boxShadow: "0 0 60px rgba(0,240,255,0.2), 0 0 100px rgba(255,0,255,0.12)",
            }}
            data-testid="messenger-panel"
          >
            <div className="p-4 border-b border-white/10 bg-black/40 flex items-center justify-between">
              {view !== "LIST" ? (
                <button onClick={() => setView("LIST")} className="text-slate-300 hover:text-white" data-testid="messenger-back-btn">
                  <ChevronLeft size={22} />
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <MessageCircle size={18} className="text-euryx-cyan" />
                  <h3 className="font-heading text-sm font-black tracking-[0.2em] text-white">MESSENGER</h3>
                </div>
              )}
              {view !== "LIST" && (
                <h3 className="font-heading text-sm font-bold text-white flex-1 text-center truncate px-2">
                  {view === "GLOBAL" ? "Global" : privateRecipient?.username}
                </h3>
              )}
              {view === "LIST" && (
                <button
                  onClick={() => setShowNewChat((v) => !v)}
                  className="text-slate-400 hover:text-euryx-cyan p-1 rounded-full bg-white/5 border border-white/10"
                  data-testid="messenger-new-chat-btn"
                  aria-label="Start new chat"
                >
                  <Plus size={16} />
                </button>
              )}
              {view !== "LIST" && <div className="w-6" />}
            </div>

            {!user && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center" data-testid="messenger-anon">
                <MessageCircle size={36} className="text-slate-600" />
                <div className="font-mono text-xs text-slate-400">Sign in with your Hatake account to chat.</div>
                <a href="/login" className="btn-neon btn-neon-cyan py-1.5 text-xs">Sign In</a>
              </div>
            )}

            {user && view === "LIST" && (
              <div className="flex-1 overflow-y-auto p-3 space-y-3" data-testid="messenger-list">
                {showNewChat && (
                  <div className="rounded-xl p-2 flex gap-2 bg-slate-900/70 border border-white/10">
                    <input
                      value={newChatUsername}
                      onChange={(e) => setNewChatUsername(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && startNewChat()}
                      placeholder="Hatake username…"
                      className="flex-1 bg-slate-950 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-euryx-cyan"
                      data-testid="messenger-username-input"
                    />
                    <button onClick={startNewChat} className="bg-euryx-cyan/20 hover:bg-euryx-cyan/40 border border-euryx-cyan/40 text-euryx-cyan rounded-lg px-3 text-xs font-bold" data-testid="messenger-username-go-btn">
                      Go
                    </button>
                  </div>
                )}

                <div
                  onClick={() => setView("GLOBAL")}
                  className="rounded-2xl p-4 flex items-center gap-4 cursor-pointer transition-all group border border-euryx-cyan/30 hover:border-euryx-cyan/60 hover:bg-euryx-cyan/5"
                  style={{ background: "linear-gradient(120deg, rgba(0,240,255,0.08), rgba(255,0,255,0.08))" }}
                  data-testid="messenger-global-card"
                >
                  <div className="w-11 h-11 rounded-full bg-slate-950 border border-white/10 flex items-center justify-center">
                    <Globe className="text-euryx-cyan" size={20} />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-white">Global Chat</h4>
                    <p className="text-[10px] font-mono text-slate-400 tracking-wider">Synced with Hatake.Social</p>
                  </div>
                </div>

                <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-slate-500 mt-3 mb-1 pl-1">
                  Direct Messages
                </div>

                {threads.size === 0 ? (
                  <div className="text-center text-slate-500 text-xs mt-6 font-mono">
                    No conversations yet.<br />Tap <span className="text-euryx-cyan">+</span> to start one.
                  </div>
                ) : (
                  Array.from(threads.values()).map((t) => (
                    <div
                      key={t.id}
                      onClick={() => {
                        setPrivateRecipient({ id: t.id, username: t.username });
                        setView("PRIVATE");
                      }}
                      className="bg-slate-900/60 hover:bg-slate-900 border border-white/5 rounded-2xl p-3 flex items-center gap-3 cursor-pointer transition-all"
                      data-testid={`messenger-thread-${t.username}`}
                    >
                      <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                        <User className="text-slate-300" size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-heading font-bold text-white truncate">{t.username}</div>
                        <div className="text-[11px] font-mono text-slate-400 truncate">{t.last}</div>
                      </div>
                    </div>
                  ))
                )}

                {error && (
                  <div className="mt-3 text-[11px] font-mono text-fuchsia-300 bg-fuchsia-950/30 border border-fuchsia-500/30 rounded-md px-3 py-2">{error}</div>
                )}
              </div>
            )}

            {user && view !== "LIST" && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3" data-testid="messenger-thread">
                  {shown.length === 0 && (
                    <div className="text-center text-slate-500 mt-10 text-xs font-mono">
                      {view === "GLOBAL" ? "Be the first to drop a message." : `Say hi to ${privateRecipient?.username}.`}
                    </div>
                  )}
                  {shown.map((m) => {
                    const mine = m.senderId === user.id;
                    return (
                      <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                        <span className="text-[9px] font-mono text-slate-500 mb-1 uppercase tracking-wider">
                          {mine ? "You" : m.sender?.username}
                        </span>
                        <div
                          className={`px-3 py-2 rounded-2xl max-w-[85%] text-sm break-words ${
                            mine
                              ? "bg-gradient-to-br from-euryx-cyan/30 to-euryx-cyan/10 border border-euryx-cyan/40 text-white rounded-tr-sm"
                              : "bg-slate-900/80 border border-white/10 text-slate-100 rounded-tl-sm"
                          }`}
                        >
                          {m.content}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={endRef} />
                </div>
                <div className="p-3 border-t border-white/10 bg-black/40 flex gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder={view === "PRIVATE" ? `Message ${privateRecipient?.username}…` : "Drop a message…"}
                    className="flex-1 bg-slate-950 border border-white/10 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-euryx-cyan"
                    data-testid="messenger-input"
                  />
                  <button
                    onClick={send}
                    className="p-2 rounded-full text-white"
                    style={{
                      background: "linear-gradient(135deg, #00f0ff, #ff00ff)",
                      boxShadow: "0 0 14px rgba(0,240,255,0.5)",
                    }}
                    data-testid="messenger-send-btn"
                    aria-label="Send"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
