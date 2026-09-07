# Family Tasks

A mobile-first PWA for running family admin: who's doing what, and when it's due. See `PRODUCT_SPEC.md` for the v0.1 product spec and `PRODUCT_SPEC_0-2.md` for the push notifications enhancement.

Stack: Next.js (App Router) + TypeScript + Tailwind CSS + Supabase (Postgres, Auth, Row Level Security), deployed on Vercel via GitHub.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Copy `.env.local.example` to `.env.local` and fill these in — the same values need adding to your Vercel project's Environment Variables (Production, Preview, and Development) for the deployed app to work.

| Variable | Where it comes from |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Project Settings → API. **Server-only** — bypasses Row Level Security. Never reference it from a client component or anything that runs in the browser bundle. Used only by the push notification code (`lib/notifications/*`), which needs to read one family member's data on another's behalf (e.g. to notify them) or run with no logged-in user at all (the daily due-today job). |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Generate with `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | Same command as above. **Server-only.** |
| `VAPID_SUBJECT` | A `mailto:` address or URL identifying who's sending the push, per the Web Push spec — e.g. `mailto:you@example.com` |
| `CRON_SECRET` | Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Vercel automatically sends this as `Authorization: Bearer <value>` on requests to cron-configured routes once it's set on the project — `/api/cron/due-today` checks it matches before doing anything. |

## Database migrations

Schema changes live in `supabase/migrations/*.sql`, applied by hand in the Supabase SQL Editor (Project → SQL Editor → paste → run), in filename order. There's no CI/CD step for this — after adding a new migration file, run it against the project yourself before deploying code that depends on it.

## Push notifications

Two notification types, per `PRODUCT_SPEC_0-2.md`:
- **Task assigned** — fires from `createTask`/`updateTask`/`completeTask`'s recurrence branch in `lib/tasks/actions.ts` whenever a task ends up assigned to someone other than the person who created/edited it.
- **Due today** — a daily summary, once per family member with outstanding tasks due that day. Runs via Vercel Cron (`vercel.json`) hitting `/api/cron/due-today` once a day at `07:00 UTC`. Vercel's Hobby plan caps cron jobs at once per day, which rules out the more precise "fire hourly and check whether it's actually 8am in `Europe/London`" approach — `07:00 UTC` lands on 8am London during British Summer Time (the longer part of the year) and 7am during GMT, a deliberate small seasonal drift rather than a bug. Upgrading to Vercel Pro would allow a more frequent, always-exactly-8am version if that trade-off ever matters enough.

Both go through `lib/notifications/push.ts`'s `sendPushNotification`, which never throws — a failed or disabled notification never blocks the task operation that triggered it, and expired device subscriptions are cleaned up automatically.

A user enables notifications from `/settings` — this requests browser permission (only after they click "Enable notifications", never on page load) and registers `public/sw.js` as the service worker.

## Testing

```bash
npm test
```

Runs everything except `tests/rls.test.ts`, which is skipped unless `SUPABASE_SERVICE_ROLE_KEY` (and the Supabase URL/anon key) are present in the environment — it's a live integration test against a real Supabase project, not mocks, so it's opt-in rather than part of the default run:

```bash
node --env-file=.env.local node_modules/.bin/vitest run
```

## Deployment

Push to `main` → Vercel builds and deploys automatically (GitHub integration, no manual step). The Vercel Cron job is picked up from `vercel.json` on deploy; check the project's Cron Jobs tab to confirm it's registered.
