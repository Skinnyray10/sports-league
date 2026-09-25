---
name: Sports League
description: Tablero de Cancha — Operate-mode sideline board for multi-sport league ops
colors:
  ink: "#191919"
  paper: "#F6F5F2"
  card: "#FBFAF7"
  metal: "#C4C3BF"
  muted: "#585858"
  secondary: "#EBE9E4"
  lime: "#DAE937"
  steel: "#2F6FED"
  white: "#FFFFFF"
  destructive: "#C62828"
  live: "#C45C12"
  scheduled: "#585858"
  final: "#1F6B4A"
  band-teams: "#C4C3BF"
  band-tournaments: "#2F6FED"
  band-matches: "#DAE937"
  band-standings: "#585858"
typography:
  display:
    fontFamily: "Sofia Sans Condensed, Sofia Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Sofia Sans Condensed, Sofia Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Sofia Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Sofia Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "0.02em"
  data:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  none: "0px"
  sm: "4px"
  md: "8px"
  lg: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "10px 18px"
  button-primary-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.full}"
  button-secondary:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "10px 18px"
  button-secondary-hover:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.ink}"
  input-default:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "10px 14px"
  input-focus:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
  sidebar:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  status-badge:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.muted}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
---

## Overview

**Tablero de Cancha** is the Operate-mode visual world for Sports League: a sideline standings board — charcoal lacquer module strip, warm field paper, cool metal hairlines, and a lime magnetic marker for primary action. Color stays at edges and CTAs; data bodies stay achromatic and tabular. The public `/p/*` surface inherits the same identity as consulta (no admin CTAs). Auth uses the same paper field with a charcoal masthead.

Direction: seed `5b0fdeff`, locked assigned decision comp. Anti-reference: Modular Band Ops (cyan CTAs, cool-grey paper, rainbow module bands, Geist).

## Colors

| Role | Token | Hex |
|---|---|---|
| Ink / lacquer | `ink` | `#191919` |
| Field paper | `paper` | `#F6F5F2` |
| Card surface | `card` | `#FBFAF7` |
| Metal / border | `metal` | `#C4C3BF` |
| Muted text | `muted` | `#585858` |
| Lime marker (primary) | `lime` | `#DAE937` |
| Steel signal (focus) | `steel` | `#2F6FED` |

Module edge accents (`band-*`) are metal / steel / lime / muted — not a rainbow. Status colors are dual-coded with visible labels.

## Typography

- **Display / titles:** Sofia Sans Condensed (600–800) for board headlines and org names.
- **Body / UI:** Sofia Sans (400–700).
- **Data:** JetBrains Mono with `tabular-nums` on standings and scores.

Avoid Inter, Roboto, Arial, and the previous Geist stack for brand voice.

## Layout

Sidebar + main field. Operate and public share charcoal strip + paper field. Active nav wins by weight/brightness plus a thin lime (or module) left edge — not thick boxed rails. Tables and lists for data; cards only as interaction containers.

## Elevation & Depth

Light, soft offset shadows on auth shells and dialogs (`0 10px 28px` ink at ~8% opacity). No glow, no hard neobrutal offsets. Field paper may tile a subtle texture plate behind content.

## Shapes

Capsule language for CTAs, nav pills, status badges, and inputs (`rounded-full`). Tables and boards stay squared with metal hairlines. Module accent is a short rounded-full strip above titles.

## Components

- **Primary button:** lime fill, ink text; hover inverts to ink/paper.
- **Sidebar:** charcoal lacquer, muted uppercase section labels, capsule nav rows.
- **Tables:** secondary header bar, border metal, tabular figures.
- **Status badge:** pill with label text + tinted fill (never color alone).
- **Module header:** 12×4 accent strip + Condensed title + muted description + action cluster.

## Do's and Don'ts

**Do**

- Keep data achromatic; put color on edges, active nav, and primary CTAs.
- Dual-code status (label + color).
- Prefer tables/lists over decorative card grids.
- Use steel `#2F6FED` for focus rings, not lime.

**Don't**

- Restore Modular Band Ops cyan (`#00B7FF`) or magenta/yellow rainbow bands.
- Use purple-on-white marketing gradients or cream+terracotta tropes.
- Put marketing CTAs on the public consulta surface.
- Rely on color alone for live/final/scheduled state.
