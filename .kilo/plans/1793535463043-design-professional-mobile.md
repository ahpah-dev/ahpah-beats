# Big Design Improvement Plan — Professional Studio + Mobile Density

## Goal
Unify the app around a "pro studio" design language: minimal chrome, high contrast, consistent tokens, and reduced visual density on mobile. Apply shared design system to both desktop and mobile.

## Decisions
- Brand tone: Pro studio (dark, precise, minimal, high contrast).
- Priority: Overall visual polish & brand identity first.
- Mobile pain point: Visual density.
- Scope: Both desktop and mobile, shared design system.

## Design System (new)
- Tokens in `src/index.css` `:root`: surface levels (bg, panel, card, elevated), text tiers (primary/secondary/muted), accent (single cyan + subtle pink), borders (hairline), radii (sm/md/lg), spacing scale, shadow tiers.
- Typography: Inter weights; mono only for numeric labels (BPM, steps). Remove mixed font usage.
- Motion: 120–180ms ease-out; no bounce on toasts; respect reduced-motion.
- Icons: lucide-react consistent sizes (16/20); no mixed emoji in UI chrome.

## Affected Areas
- `src/index.css`: tokens, base, scrollbar, focus, motion.
- `src/App.tsx`: root layout, toast, footer.
- `src/components/Header.tsx`: density reduction, grouping, responsive collapse.
- `src/components/MobileView.tsx` + `MobilePads/Keys/PianoRoll/XYPad/Mixer`: density, spacing, touch targets.
- Desktop: `Visualizer`, `Sequencer`, `PianoRoll`, `EffectsRack`: card hierarchy, labels, spacing.

## Mobile Density Changes
- Increase tap targets to >=44px.
- Collapse secondary controls into accordions/sheets instead of always-visible panels (synth designer, bar nav).
- Reduce simultaneous elements per tab; use progressive disclosure.
- Bottom nav: larger icons, clear active indicator, no uppercase mono overload.

## Implementation Phases
1. Tokens + base styles.
2. Shared primitives (Card, SectionHeader, IconButton, Slider, Tab) as Tailwind class recipes (no new deps).
3. Desktop polish: Header, Sequencer, PianoRoll, EffectsRack, Visualizer.
4. Mobile density pass: MobileView shell, tabs, pads/keys/roll/steps/xy/mixer.
5. Motion/accessibility: reduced-motion, focus rings, contrast audit.
6. Validation: build, manual smoke (desktop + mobile widths), no regressions in audio.

## Risks
- Tailwind v4 utility churn; keep changes CSS-first.
- Mobile touch handlers sensitive; preserve event logic, only styling.
- Density reduction may hide features; use progressive disclosure, not removal.

## Validation
- `npm run build` passes.
- `npm run build:electron` passes.
- Manual: 360px–430px mobile, 1280px desktop; all tabs functional; play/pads/keys/piano roll/xy/mixer.
- No audio regressions (play, pads, keys).

## Out of Scope
- New features, audio engine changes, backend, new dependencies.
EOF
echo done