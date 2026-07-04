# aiBA Leaderboard API

Cloudflare resources:

- Worker: `aiba-leaderboard-api`
- D1 database: `aiba_percent_battle`
- D1 database id: `5f2a37f8-26b3-45a4-b26f-e250d08c1026`
- Public API base: `https://aiba-leaderboard-api.tiger-seeker.workers.dev`

Endpoints:

- `GET /health`
- `POST /v1/players`
- `PATCH /v1/players/me`
- `POST /v1/runs`
- `GET /v1/leaderboards`

The browser game uses a no-login identity model:

- `localStorage.aiba_install_id_v1`
- `localStorage.aiba_player_profile_v1`
- local offline queue: `localStorage.aiba_leaderboard_queue_v1`

The API stores token hashes only. Do not add raw tokens, emails, phone numbers, or real identity fields.
