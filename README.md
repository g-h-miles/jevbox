# Jevbox

A natural-language drum machine at **https://jevbox.grahammiles.me**.

Describe a four-bar groove, choose a 1/16 or 1/32 grid, listen with five synthesized kits, amend specific notes, and export standard drum MIDI. Jev arranges each bar with the previous bars as context. Kit choice affects preview audio, not the exported instrument.

## Development

```
npm ci
npm run dev
npm test
npm run build
npm run deploy
```

The `jevbox` Cloudflare Worker serves the independent frontend and forwards generation/amendment requests over a private service binding to the existing `beatbox` Worker. The API key remains in that service's secret; no key is copied into this repository or sent to the browser. Local UI can use mocked browser tests; live generation needs the bound service via Cloudflare. This is a separate app/repository with a shared generation backend, not a duplicated secret or a fully independent inference service.

## Design

Brand brief: pink/purple requested by Graham in homage to TypeSafe, with user-facing model name **Jev**. Space Grotesk is self-hosted. Palette, keyboard focus and motion preferences live in `src/style.css`; sequencer layouts in `src/generator.css`. No official TypeSafe logo is reproduced.

On narrow screens, the sequencer shows four editable subdivisions at a time, with bar/beat navigation. A 1/32 grid therefore shows half a beat per page to retain touch-size targets. Sound synthesis, playback, timing, amendment and undo behavior were carried over from Beatbox.

Live browser validation:
```
LIVE=1 UI_URL=https://jevbox.grahammiles.me node scripts/four-bar-ui-check.mjs
```
