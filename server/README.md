# QuackDoku Server

Fastify MVP backend for the daily case and leaderboard.

## Run

```bash
npm install
npm run dev
```

Default URL:

```text
http://localhost:3333
```

Point the Expo app to it with:

```bash
EXPO_PUBLIC_API_URL=http://localhost:3333
```

For a physical Android device, use your LAN IP instead of `localhost`.

## Endpoints

- `GET /health`
- `GET /cases/daily?date=YYYY-MM-DD`
- `POST /cases/daily/complete`
- `GET /cases/daily/leaderboard?date=YYYY-MM-DD`

Results are persisted to `server/data/daily-results.json`. This is enough for MVP testing; replace it with PostgreSQL/Prisma before production scale.
