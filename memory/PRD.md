# Euryx — Product Requirements Document

## Vision
Euryx is a hyper-modern, purely digital Pokémon TCG game client — a sister-application to **Hatake.Social**. Players sign in, build 60-card decks pulled from Hatake's card catalog, queue for live ranked play, and battle on a distraction-free fullscreen board with cards that glide between zones via Framer-Motion shared layout animations.

## Original Problem Statement (verbatim summary)
Build "Euryx" with **Next.js 14 (App Router)** + Tailwind + **Framer Motion** + **Prisma** + **Socket.io** + Lucide React. UI must use deep dark modes, glassmorphism, neon Cyan/Fuchsia borders; cards glide via `layoutId`. Four phases: (1) Lobby with floating HaloNav, dashboard with animated entry cards. (2) Deck-builder with split-screen deck + real-time search, variant modal (JP/CN). (3) Custom Node server (`server.js`) wrapping Next.js for Socket.io matchmaking + `roomId` routing. (4) Fullscreen game board at `/play/[roomId]` with Active(1)/Bench(5)/Prize(6)/Deck/Discard/Hand.

## Architecture
- **Frontend / Next.js 14 (custom server)** at `/app/frontend` — serves the entire app + Next.js API routes + Socket.io on port 3000.
  - `server.js` wraps Next.js, attaches a Socket.io server, manages the matchmaking queue and per-room broadcast.
- **Reverse-proxy FastAPI** at `/app/backend/server.py` listens on port 8001 and forwards `/api/*` to `http://127.0.0.1:3000/api/*`. This is required by the kubernetes ingress (which routes `/api/*` externally to port 8001) so the user's specified Next.js `src/app/api/...` route layout remains canonical and untouched.
- **Prisma + Neon Postgres** for user, deck, deck-card persistence.

## Implemented (2026-06-28)
- ✅ Phase 1 — RootLayout w/ dark theme + grain + grid + scan; floating **HaloNav** (glassmorphic, conditionally hides on `/play/*`); Dashboard with live-counter stat strip and three animated entry cards (Enter Queue / Vault / Tournaments); Tournaments placeholder.
- ✅ Phase 2 — Deckbuilder: split-screen (60-card active deck left + real-time search right, debounced); shimmer-on-hover cards; variant modal (EN / JP / CN / Reverse-Holo) with per-variant price multiplier; 60-card cap + progress bar; "Save Deck" persists to Postgres via `/api/decks`.
- ✅ Phase 3 — Socket.io custom server with FIFO queue → instant pairing → `match-found` event → both clients route to `/play/<roomId>`.
- ✅ Phase 4 — Fullscreen game board (no HaloNav): opponent half rotated 180°, both halves with Active(1)/Bench(5)/Prize(6)/Deck/Discard. Player hand fans at the bottom and de-fans on hover; clicking a hand card opens a placement modal (Active or Bench-slot). Moves emit `game:move` to the opponent via Socket.io. In-room chat panel included.
- ✅ JWT auth (jose + bcryptjs) with httpOnly cookie; `/login`, `/signup`, `/api/auth/{signup,login,me,logout}`.
- ✅ Hatake card proxy (`/api/pokemon/search`) with **automatic fallback dataset** when Hatake's upstream is 5xx (the upstream was flapping/500 at deployment time — fallback ensures continuous playability).

## Tech Stack
| Layer | Tech |
|------|------|
| App  | Next.js 14.2 App Router (TypeScript) |
| Server | Custom Node (`server.js`) + Socket.io 4.7 |
| Styling | Tailwind 3.4, custom CSS (Unbounded + IBM Plex Mono) |
| Anim | Framer Motion 11 (layoutId, LayoutGroup, AnimatePresence) |
| DB  | Postgres (Neon serverless) via Prisma 5.20 |
| Auth | jose JWT (HS256, 7-day TTL) + bcryptjs |
| Proxy | FastAPI 0.110 + httpx (port 8001 → 3000) |

## User Personas
- **The Competitor** — wants instant matches, ranked progression, tournament info.
- **The Collector** — explores the vault, builds themed decks, hunts JP/CN variants.
- **The Spectator** — joins rooms via shareable `roomId`s, watches matches.

## Backlog / Next
- **P0**: Real turn engine — turn timer, energy attachment, attacks, prize-taking, knockouts.
- **P1**: Drag-and-drop cards (in addition to the click-to-place modal).
- **P1**: Spectator mode (read-only socket subscriber on a room).
- **P2**: Deck library page (load existing saved decks into the builder).
- **P2**: Ranked Elo/SR system + matchmaking by rating.
- **P2**: Vault filtering (set, type, rarity, language) and pagination.
- **P3**: Tournaments engine, brackets, prize wallets.
- **P3**: Replays (persist move stream → playback).
