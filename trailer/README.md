# aiBA Launch Trailer

This isolated Remotion project turns deterministic game captures into vertical launch films.

## Commands

```bash
npm install
npm run prepare:assets
npm run capture
npm run still:launch
npm run render:launch
npm run render:proof
```

The render commands copy source media from the game asset library automatically. `capture` opens the NEXT build in headless Chrome at an iPhone-sized viewport, records 15 real gameplay and player-action shots from a 1075x2330 source canvas, closes Chrome, and encodes 1080x1920/60fps clips with the system `ffmpeg`.

`LaunchFilm` is the 60-second vertical master with layered music, arena ambience, crowd reactions, shot effects, and commentary. `ProofOfStyle` remains available as the 15-second concept cut. Generated footage and renders live under `public/footage` and `out`; both are intentionally ignored by Git.
