# Euryx — Product Requirements Document

## Vision
Euryx is a hyper-modern, purely digital Pokémon TCG game client — a sister-application to **Hatake.Social**. ONE Hatake account, used everywhere. Players sign in, build 60-card decks from Hatake's card universe, queue for live ranked play, chat with the global community (shared with hatake.social), and battle on a distraction-free fullscreen board with cards that glide via Framer-Motion `layoutId`.

## Architecture (current)
- **Frontend / Next.js 14 custom server** at `/app/frontend` (port 3000) — pages + Next.js API routes + Socket.io.
- **Reverse proxy FastAPI** at `/app/backend/server.py` (port 8001) forwards `/api/*` to `http://127.0.0.1:3000`.
- **Auth bridge**: `/api/auth/login`, `/api/auth/signup`, `/api/auth/me`, `/api/auth/logout` proxy server-side to `hatake-social-beta.vercel.app/api/auth/*`. The upstream `hatake_session` cookie is re-emitted on the Euryx domain.
- **Chat bridge**: `/api/chat` and `/api/users` proxy to hatake-social-beta — messages flow between Hatake.Social and Euryx in real time.
- **Postgres (Neon) via Prisma**: `EuryxUser` (mirror of Hatake user), `EuryxUserSettings`, `EuryxDeck`, `EuryxDeckCard`, `EuryxTournament`.

## Implemented

### Iteration 1 (2026-06-28)
- Phase 1 Lobby: dashboard, glassmorphic HaloNav (top pill), entry cards.
- Phase 2 Deckbuilder: split-screen, real-time Hatake search, variant modal (EN/JP/CN/RH), 60-card cap.
- Phase 3 Matchmaking: Socket.io custom server with FIFO queue, `match-found` → `/play/<roomId>`.
- Phase 4 Game board: opponent half rotated 180°, all 25 zones, hand cards fly to Active/Bench via `layoutId`, in-room chat.
- Local JWT auth (`euryx_token`) with bcryptjs.
- Hatake card proxy w/ offline fallback.

### Iteration 2 — Hatake bridge + UX rework (2026-06-28)
- 🔥 **Auth migrated to Hatake**: all auth routes proxy to hatake-social-beta. One Hatake account works everywhere. Local `euryx_token` retired in favor of `hatake_session`.
- 🌈 **HaloNav rebuilt as bottom-curved halo** (ported from hatakesocialbeta and visually amplified): 4 left links + floating profile bubble (88×88 conic-gradient ring) + 4 right links. Curved upward via custom `border-radius`. Top edge cyan→white→fuchsia gradient highlight. Animation: spring-up on mount, `layoutId` active-pill.
- 💬 **MessengerWidget** ported from hatakesocialbeta — floating bottom-right bubble opens to LIST/GLOBAL/PRIVATE views. Calls `/api/chat` proxy. Settings-controlled visibility in-game.
- ⚙️ **Settings page** (`/settings`) with `showChatInGame`, `preferredSeat`, `reduceMotion` toggles. Persists to `EuryxUserSettings` table.
- 👤 **Profile page** (`/profile`) — Hatake trainer card, stats, deck library, link out to hatake.social profile.
- 🏆 **Tournaments** rewritten with real data — 8 seeded tournaments, status tabs (Live/Open/Upcoming/Past), region flags, capacity bars, registration & watch CTAs.
- 🗄️ **Vault** rewritten — real saved decks with cover-art preview, "New Deck" CTA.
- 📊 **Dashboard** — live "Vault Cards" count from Hatake probe + live "Your Decks" + live "Live Cups" from `/api/tournaments`.
- 🃏 Pokémon card-count endpoint `/api/pokemon/count` (live + 5-min cache).
- ⛔ All placeholders removed (Vault redirect, hardcoded "27,443 cards" badge, Tournaments stub).

## Backlog / Next (P0 → P3)
- **P0**: Real turn engine (energy attach, attack, prize-take, knockout).
- **P0**: Hatake upstream signup is currently 500-ing (`sendVerificationEmail` config) — surface this clearly OR offer a "sign up on hatake.social" external CTA. Right now the Euryx signup page warns the user.
- **P1**: Spectator mode (read-only socket subscriber).
- **P1**: Deck library page (load saved decks into builder).
- **P1**: Drag-and-drop card placement (in addition to the click modal).
- **P2**: Real tournament bracket UI, registration backend.
- **P2**: Ranked Elo + matchmaking-by-rating.
- **P3**: Replays (persist move stream → playback).
- **P3**: Pokehubz integration link from the Vault.

## Cross-repo deliverables (hatakesocialbeta)
See the final assistant message in the chat — contains two ready-to-paste files:
1. `src/app/apps/page.tsx` — adds a Euryx tile to the Apps Hub.
2. `src/components/HaloNav.tsx` — beautified, ported back from Euryx.
