# Leaderboard decorative assets

Drop the two provided PNGs here with these exact names — the page references them
by absolute path from `src/components/leaderboard/LeaderboardPage.css`:

| File | Used for | Referenced by |
|------|----------|---------------|
| `trophy.png` | Glass trophy, anchored to the page's bottom-left corner | `.lb-trophy` |
| `glow.png` | Warm oval backlight behind the top-3 podium cards | `.lb-podium-glow` |

Until the files exist, each element falls back to a CSS radial gradient, so the
layout still renders (just without the artwork). No code change is needed once
the files are added.
