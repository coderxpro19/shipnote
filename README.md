# Shipnote

Turn your merged GitHub pull requests into plain-language release notes, and email them to your users automatically.

> Status: early development. Built in public, one commit at a time.

## The problem

Developers ship improvements all the time, but users never hear about them because writing "what's new" emails is tedious. Shipnote does it for you.

## How it works

1. Connect a GitHub repository.
2. When you publish a release (or merge to your main branch), Shipnote reads the merged pull requests.
3. An AI model rewrites technical changes ("fix null pointer in auth middleware") into user-friendly notes ("Login is now more reliable").
4. You review and approve the draft.
5. Subscribers get an email, and a public "What's new" page is updated.

## Tech stack

| Layer | Tool |
|-------|------|
| Frontend | React + Vite (hosted on Cloudflare Pages) |
| API and background jobs | Cloudflare Workers (Hono) |
| Database and auth | Supabase (Postgres, Row Level Security) |
| Email | Resend |
| AI | LLM API (provider chosen in Phase 2) |
| Source integration | GitHub OAuth and webhooks |

## Project structure

```
shipnote/
├── apps/
│   ├── web/          # React dashboard and public changelog page
│   └── worker/       # Cloudflare Worker: API, webhooks, cron, email
├── supabase/
│   └── migrations/   # SQL schema and security policies
├── docs/
│   └── ARCHITECTURE.md
├── TASKS.md          # Build plan, tick items as you go
├── .env.example
└── README.md
```

## Getting started

You need Node.js 20 or newer, a Supabase project, and a GitHub OAuth app.

1. Clone the repo and install the web app:
   ```
   cd apps/web
   npm install
   ```
2. Create `apps/web/.env` with your Supabase values:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
3. Run the schema in `supabase/migrations/0001_init.sql` in the Supabase SQL editor.
4. Enable the GitHub provider in Supabase Auth.
5. Start the app:
   ```
   npm run dev
   ```

See [TASKS.md](./TASKS.md) for the current plan.

## Roadmap

- [ ] Phase 1: GitHub login and reading merged PRs
- [ ] Phase 2: AI-generated release notes
- [ ] Phase 3: Subscribers and email sending
- [ ] Phase 4: Multi-user privacy, dashboard, public page

## License

MIT
