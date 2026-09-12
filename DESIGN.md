# Design System

## Mood

Classification desk: white stock, olive-ink stamps, one sealing-wax accession mark. People at a laptop, indoor light, scanning a catalog, not browsing a poster.

## Color strategy

Restrained. Neutrals do the architecture. Olive ink is the primary action and selection. Sealing-wax red is accession marks (优惠、外链提示). Software icons bring their own color; the chrome does not compete.

Seed hue 120 (moss olive). Background is pure white so the green reads as ink, not as a forest theme.

## Palette (OKLCH)

```css
:root {
  --bg: oklch(1.000 0.000 0);
  --surface: oklch(0.970 0.008 120);
  --ink: oklch(0.220 0.028 120);
  --muted: oklch(0.420 0.022 120);
  --line: oklch(0.900 0.012 120);
  --primary: oklch(0.340 0.078 120);
  --primary-hover: oklch(0.280 0.072 120);
  --on-primary: oklch(0.990 0.005 120);
  --accent: oklch(0.460 0.145 28);
  --on-accent: oklch(0.990 0.000 0);
  --open: oklch(0.340 0.078 120);
  --official: oklch(0.300 0.020 250);
  --discount: oklch(0.460 0.145 28);
  --danger: oklch(0.480 0.160 25);
  --focus: oklch(0.340 0.078 120);
}
```

## Typography

One family: Noto Sans SC (Latin + 中文). Product scale, fixed rem, ratio ~1.2.

- Display / page title: 1.75rem / 800 / 1.2
- Section: 1.25rem / 650 / 1.3
- Body: 0.9375rem / 400 / 1.55
- Meta / badge: 0.75rem / 550 / 1.3
- Search input: 1.0625rem / 400

Measure for prose 65ch. Lists and rows can run full content width (~72rem).

## Layout

Max width 72rem. Top bar sticky. Search is the hero on home, a compact field in the bar elsewhere. Scene entries are unequal: one featured scene wider, others denser. Software is rows, not equal card grids.

Radius: controls 8px, rows 12px, pills 999px. No 24px+ cards.

Shadow: none on rest; 0 1px 0 var(--line) hairline, or 0 4px 8px oklch(0.22 0.028 120 / 0.08) on elevated search only. Never border + wide shadow together.

## Motion

150–220ms, ease-out cubic. Filter, hover, focus, page content fade. No load choreography. `prefers-reduced-motion: reduce` → instant or opacity only.

## Components

- Primary button: olive fill, white label, 「前往官网下载」
- Secondary: ink hairline, transparent fill
- Source badges: 官方 / 开源 / 优惠, text + color, not color alone
- Software row: 48px icon, name, one-line summary, platforms, source, action
- Search: large on home, live filter, keyboard focus ring 2px olive
