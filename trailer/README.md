# aiBA Launch Trailer

This isolated Remotion project turns deterministic game captures into vertical launch films.

## Commands

```bash
npm install
npm run prepare:assets
npm run capture
npm run still
npm run render:proof
```

The render commands copy source media from the game asset library automatically. `capture` opens the NEXT build in headless Chrome, records six real gameplay shots, closes Chrome, and encodes the clips with the system `ffmpeg`. The first composition is a 15-second proof of style; the same manifest is intended to scale into the full launch film.
