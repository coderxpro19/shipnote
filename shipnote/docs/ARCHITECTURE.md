# Architecture

## Flow

```
GitHub (release or merge)
        │ webhook
        ▼
Cloudflare Worker (Hono) ──► LLM API (writes notes)
        │
        ▼
Supabase Postgres (projects, releases, subscribers)
        │
        ├──► Resend (emails to subscribers)
        └──► React app (dashboard, public What's new page)
```

## Key decisions

- **Supabase Auth with GitHub provider**: one login gives us both identity and a GitHub token to read repos.
- **Row Level Security everywhere**: the database itself enforces that users only see their own data, so a bug in the API can't leak it.
- **Worker uses the service role key** only for actions users can't do directly (subscribe, send emails). Never expose this key to the browser.
- **Human approval step**: AI output is always a draft until the owner approves it.

## Data model

- `projects`: a GitHub repo connected by a user
- `releases`: a batch of changes with AI-written notes (draft or published)
- `subscribers`: people who want emails for a project (double opt-in)

See `supabase/migrations/0001_init.sql`.
