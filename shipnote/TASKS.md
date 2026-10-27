# Shipnote Build Plan

Rule: one small commit per task. Push to GitHub every day, even if it's tiny.

## Phase 0: Tonight (setup)

- [ ] Create a new GitHub repo named `shipnote` (empty, no README)
- [ ] Copy these files into a folder, run `git init`, make the first commit
- [ ] Push to GitHub (`git remote add origin ...`, `git push -u origin main`)
- [ ] Open the folder in Cursor
- [ ] Create a Supabase project (free tier) and note the URL and keys
- [ ] Copy `.env.example` to `.env` (never commit `.env`)

## Phase 1 (Week 1): GitHub login and reading PRs

- [ ] Scaffold `apps/web` with Vite + React + TypeScript
- [ ] Scaffold `apps/worker` with Hono on Cloudflare Workers (`wrangler`)
- [ ] Turn on GitHub as a login provider in Supabase Auth
- [ ] Login and logout in the web app
- [ ] Run `supabase/migrations/0001_init.sql` in your Supabase project
- [ ] Worker endpoint: list the user's GitHub repos
- [ ] Let the user "add a project" (saves a row in `projects`)
- [ ] Worker endpoint: fetch merged PRs since the last release
- [ ] Show those PRs in the dashboard

## Phase 2 (Week 2): AI release notes

- [ ] Design the prompt (input: PR titles and descriptions, output: markdown notes)
- [ ] Worker endpoint: generate a draft from selected PRs
- [ ] Save drafts in `releases` with status `draft`
- [ ] Editor page: edit, regenerate, approve a draft
- [ ] Handle errors and limits (empty PR list, very long PRs)

## Phase 3 (Week 3): Subscribers and email

- [ ] Public subscribe form on the project's page
- [ ] Email confirmation (double opt-in) via Resend
- [ ] Unsubscribe link in every email (token-based)
- [ ] Send a published release to all confirmed subscribers
- [ ] Verify your sending domain in Resend (SPF and DKIM)

## Phase 4 (Week 4): Privacy, automation, polish

- [ ] Test Row Level Security: user A must not see user B's data
- [ ] GitHub webhook: auto-create a draft when a release is published
- [ ] Public "What's new" page per project
- [ ] Deploy web to Cloudflare Pages, worker to Cloudflare Workers
- [ ] Write the real README with screenshots and a demo GIF

## Ideas for later

- Slack or Discord notifications
- Weekly digest option
- Custom tone settings (formal, friendly, playful)
