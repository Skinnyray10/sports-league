# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are **league operators and organizers** running multi-sport leagues day-to-day: creating or joining an organization, managing teams and tournaments, recording match results, and checking standings.

Secondary users (same product, narrower jobs): **org members / coaches** who need read/write access scoped by membership role; they are not the design center for Wave 1 shell work.

<!-- inferred: exact org titles, age bands, and sports mix left open; brief names multi-sport league ops -->

## Product Purpose

**Sports League** is an **Operate-mode** web app for league operations: authenticate, create or join an organization, manage teams and tournaments, schedule and score matches, and view standings.

Success for Wave 1: an authenticated member can complete the core loop—org context → teams → tournaments → matches → standings—without leaving the app for spreadsheets or chat threads.

## Positioning

Org-scoped multi-sport **operations** (not a public fan site, not a referee console, not a player roster/stats product in this phase). The URL org slug is the working context; membership and RLS enforce what you can see and change.

## Operating Context

- **Environments:** laptop/desktop first for data entry; mobile must remain usable for quick status checks and light edits.
- **Workflows:** signup/login → create org or accept invite → manage teams → create tournaments and enroll teams → create/update matches and results (including sets when `score_type=sets`) → standings.
- **Rituals:** pre-season setup, weekly match updates, post-match result entry, standings glance before the next round.
- **Out of scope this phase:** player roster / team members, per-sport advanced stats, public-facing pages, dedicated referee panel, OAuth.

## Capabilities and Constraints

**Confirmed (MVP):**
- Auth: email + password (Supabase Auth)
- Org create / join via invite token + RPC
- Teams CRUD; tournaments CRUD + `tournament_teams` enrollment
- Matches CRUD / result / status; `match_sets` when applicable
- Standings view
- Stack: Next.js App Router, shadcn/ui (base-nova), Tailwind v4, lucide-react, Supabase (`@supabase/ssr`)

**Routes (fixed):** `/login`, `/signup`, `/join/[token]`, `/onboarding`, `/(app)/[orgSlug]/{teams,tournaments,matches,standings}`

**Constraints:**
- Server Actions per domain; UI may hide CTAs by role, but server + RLS are the source of truth
- Next.js 16 auth redirects live in `proxy.ts` (not `middleware.ts`)
- Wave 0 owns backend/foundation files; Wave 1 frontend agents must not edit supabase migrations, `src/lib/auth.ts`, `src/lib/org.ts`, `src/types/database.ts`, or `src/proxy.ts`
- Expand shadcn only as needed (`input`, `label`, `form`, `select`, `dropdown-menu`, `tabs`, `sonner`); do not hand-edit another agent's UI primitives

**Undecided / open:**
- Product display name beyond repo `sports-league` (working name: Sports League)
- Exact sport list and branding assets
- Public marketing / Persuade landing (not Wave 1)

## Brand Commitments

- Working product name: **Sports League** (repo: `sports-league`)
- Mode for all authenticated product UI: **Operate** — task clarity over expression
- Icons: **lucide-react** only (no emoji-as-icons)
- Component baseline: **shadcn/ui** primitives; restyle via tokens, do not invent parallel kits

<!-- inferred: no locked logo, voice guide, or color brand pack yet -->

## Evidence on Hand

- Schema: `supabase/migrations/0001_init.sql` (+ Wave 0 invite migration when present)
- UI kit stubs: `src/components/ui/{button,card,badge,dialog,table}.tsx`
- Default create-next-app landing still at `src/app/page.tsx` — **not** product identity; treat as anti-reference for redesign
- No real customer logos, screenshots of live leagues, or testimonials — do not fabricate

## Product Principles

1. **Org context is the workspace** — every operate screen is inside a membership-validated `[orgSlug]`.
2. **Task over theater** — density, scanability, and consistent affordances beat novelty.
3. **Roles inform, servers decide** — hide unavailable actions; never trust the client for permission.
4. **One vocabulary** — same buttons, tables, forms, and empty states across auth shell, teams, tournaments, matches, standings.
5. **Honest emptiness** — empty states teach the next action (create team, enroll, record result), never decorative voids.

## Accessibility & Inclusion

Target **WCAG 2.2 AA** for contrast, focus visibility, and keyboard operation on forms, tables, and dialogs. Prefer skeletons and clear error copy over spinner-only feedback. No product-specific AT needs confirmed yet beyond that baseline.
