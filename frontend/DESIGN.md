---
name: Sports League
description: Operate-mode modular band system for multi-sport league ops
colors:
  ink: "#0A0A0A"
  paper: "#F4F5F6"
  cool-grey: "#E6E9EC"
  white: "#FFFFFF"
  cyan: "#00B7FF"
  magenta: "#FF2DA1"
  yellow: "#FFD40D"
  green: "#32D74B"
  muted-ink: "#5C6570"
  border: "#D0D5DB"
  destructive: "#DC2626"
  live: "#E85D04"
  scheduled: "#5C6570"
  final: "#1F6B4A"
typography:
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: "0.01em"
  data:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  none: "0px"
  sm: "2px"
  md: "4px"
  lg: "6px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.cyan}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
    rounded: "{rounded.sm}"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
  button-secondary-hover:
    backgroundColor: "{colors.cool-grey}"
    textColor: "{colors.ink}"
  input-default:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
  input-focus:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
  badge-module:
    backgroundColor: "{colors.cool-grey}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  table-header:
    backgroundColor: "{colors.cool-grey}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
---

# Design System: Sports League

## Overview

**Creative North Star: "Modular Band Ops"** — Studio Dumbar–style identity grammar translated into an Operate shell: hard color bands name modules; cool-grey fields hold the work; saturated blocks never decorate data.

Sports League is a multi-sport **league operations** app. Authenticated surfaces are **Operate mode**: scanability, consistent affordances, and named state beat expression. The chosen world (seed `cbbd4550`, challenger `studio-dumbar-identity`) supplies modular colored bars, cool grey, photographic depth only when authored, and a neutral grotesque set small and businesslike—translated so **clarity wins every conflict**.

**Key Characteristics:**
- Full-palette module bands (cyan / magenta / yellow / green) as navigation identity, not rainbow chrome on every control
- Cool fluorescent paper + cool-grey panels; ink black type; cyan primary actions
- Sharp, low-radius geometry (2–6px); no soft SaaS pill language
- One UI family (Geist) + Geist Mono for scores, dates, standings
- Tables and lists over card grids; cards only when they contain a real interaction
- Status is named and dual-coded (label + color): scheduled / live / final

**Quality bar:** `.impeccable/quality-bar/studio-dumbar-identity-{hero,board}.png` — craft commitment and finish level, not a layout to copy.

## Colors

**The Band Rule.** Cyan, magenta, yellow, and green are **module identity** colors (Teams, Tournaments, Matches, Standings). They appear as structural bands, active nav indicators, and sparse accents—not as backgrounds behind body copy or table cells.

**The Achromatic Field Rule.** Working surfaces stay paper / white / cool-grey with ink text. Color on a data field must earn its place (selection, status, primary CTA).

| Token | Hex | Role |
|---|---|---|
| ink | `#0A0A0A` | Primary text, heavy controls |
| paper | `#F4F5F6` | App canvas |
| cool-grey | `#E6E9EC` | Sidebar, table headers, secondary panels |
| white | `#FFFFFF` | Content sheets, inputs |
| cyan | `#00B7FF` | Primary CTA, Matches module band, focus ring |
| magenta | `#FF2DA1` | Tournaments module band |
| yellow | `#FFD40D` | Teams module band |
| green | `#32D74B` | Standings module band / success accent |
| muted-ink | `#5C6570` | Secondary text (tinted from cool grey, not pure mid-grey on white alone) |
| border | `#D0D5DB` | Hairline rules / connectors |
| destructive | `#DC2626` | Errors, destructive actions |
| live | `#E85D04` | Match status: live |
| scheduled | `#5C6570` | Match status: scheduled |
| final | `#1F6B4A` | Match status: final |

**Light scene:** fluorescent gym / daytime laptop — **light theme is default**. Dark mode is not the product identity; do not invent a neon dark twin.

**Contrast:** body and placeholders ≥ 4.5:1; large text ≥ 3:1. Never place yellow or lime text on white.

## Typography

**The One Voice Rule.** One grotesque family for UI (Geist). No display serif, no second marketing face in Operate screens.

- **Title:** 1.5rem / 700 / −0.02em — page and dialog titles only
- **Body:** 0.9375rem / 400 — forms, empty-state copy, help
- **Label:** 0.8125rem / 500 — field labels, column headers, nav items
- **Data:** Geist Mono 0.875rem — scores, W-L records, dates, standings rank

Scale ratio ~1.125–1.2. Fixed rem sizes; no fluid clamp headings in the app shell. Tabular lining figures for numeric columns (`font-variant-numeric: tabular-nums` on mono and standings cells).

## Layout

**The Modular Band Shell.**
- Left **seed column** (sidebar ~14–16rem): org name, module nav with 4px color band on the active item, secondary links muted
- Main **field**: page title + primary actions row, then one primary content region (table, form, or standings grid)
- Hairline connectors (`1px` border) instead of stacked card scaffolds
- Dense but breathable: `16px` group gaps, `24–40px` section separation; more space above a heading than below it
- Responsive: collapse sidebar to top strip / sheet on small screens; tables scroll horizontally rather than cardifying every row

**Do not** structure pages as same-size icon+heading+text card grids. **Do not** lead with hero-metric templates or eyebrow kickers.

## Elevation & Depth

Prefer **tonal layering** (paper → white sheet → cool-grey chrome) over shadow stacks.

- Default controls: no shadow
- Raised menus / dialogs: soft offset shadow only — e.g. `0 8px 24px rgba(10,10,10,0.12)` (offset + blur; never zero-offset colored glow)
- No glass / backdrop-blur decoration
- No hard neobrutalist `4px 4px 0` block shadows

## Shapes

- Radius scale: `0 / 2 / 4 / 6px` — Dumbar sharpness, not soft SaaS
- Module bands and primary buttons: near-rectilinear (`2px`)
- Inputs and table containers: `4px`
- No `rounded-full` pills for nav, filters, or badges (badges use `2px`)
- Borders: `1px` hairlines in `{colors.border}`; no >1px colored left/right accent bars on list rows or alerts (module band lives in nav / section chrome only)

## Components

### Buttons
- **Primary:** cyan fill, ink text, `2px` radius, 10×16 padding; hover → ink fill / white text (snap, ≤200ms)
- **Secondary:** white + 1px ink border; hover cool-grey fill
- **Destructive:** destructive fill / white text
- States required: default, hover, focus-visible (cyan ring), active, disabled, loading
- Optional Dumbar cue: primary may append a square ink arrow block on hover/focus — never required for accessibility

### Inputs / Fields
- White field, 1px border, `4px` radius
- Focus: cyan border + cyan focus ring (2px offset)
- Error: destructive border + inline recovery copy
- Disabled: cool-grey fill, muted-ink text

### Tables
- Cool-grey header row, white body, hairline row rules
- Mono + tabular nums for scores and ranks
- Row hover: subtle cool-grey wash; selected: cyan hairline or light cyan tint ≤8% opacity
- Empty state: teach next action (“Create a team”, “Record a result”) — no decorative void

### Badges / Status
- Named status chips: Scheduled / Live / Final — text label always present; color is secondary signal
- Role badges: cool-grey + ink; do not invent sport emoji

### Navigation
- Module items: label + 4px vertical band in that module’s color when active
- Inactive: muted-ink, no band
- Mobile: same vocabulary in a compact top or sheet nav — no custom scrollbars as costume

### Cards / Containers
- Allowed only as interaction containers (dialog panels, invite accept box, create forms)
- Not the default list pattern — prefer tables
- If used: white sheet, 1px border, no nested cards, no colored >1px side borders

### Dialogs / Overlays
- Prefer inline / progressive disclosure; modal only for interrupt or destructive confirm
- Portaled / fixed so they escape overflow ancestors

### Motion
- 150–250ms exponential ease-out for state changes only
- No orchestrated page-load sequences
- Prefer already-visible defaults; motion conveys feedback, not decoration

## Do's and Don'ts

### Do:
- **Do** run `/impeccable` (or load this file + `PRODUCT.md` + craft-floor) before any frontend UI work.
- **Do** keep Operate surfaces task-first: tables, forms, clear primary actions, skeleton loading.
- **Do** use module bands consistently: Teams=yellow, Tournaments=magenta, Matches=cyan, Standings=green.
- **Do** theme selection, caret, focus rings, and scrollbars from this palette.
- **Do** ship hover / focus / disabled / loading / error / empty for every interactive control.
- **Do** expand shadcn via CLI only; restyle through CSS variables in `globals.css`.

### Don't:
- **Don't** use eyebrow/kicker labels above headings (craft-floor ban).
- **Don't** build pages from same-size icon+title+blurb card grids or nested cards.
- **Don't** use gradient text, glass decoration, emoji-as-icons, or monospace as “tech costume.”
- **Don't** scatter cyan/magenta/yellow/green confetti over tables or forms.
- **Don't** rely on color alone for match status or errors.
- **Don't** invent Persuade/marketing heroes inside `(app)` routes.
- **Don't** default to purple-on-white, cream+serif+terracotta, broadsheet hairlines, or neon-dark glow themes.
- **Don't** edit Wave 0 foundation files (`supabase/migrations`, `src/lib/auth.ts`, `src/lib/org.ts`, `src/types/database.ts`, `src/proxy.ts`).
