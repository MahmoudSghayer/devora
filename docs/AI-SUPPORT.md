# devora AI Customer-Support Platform

A production-grade, 24/7 AI support assistant for devora.design — grounded in the
site's own content, with lead capture, Zoho email automation, an admin dashboard,
and live human takeover. Built into the existing Next.js 16 app.

## What it does

- **Grounded chatbot** on every public page (EN + AR, full RTL). Answers *only*
  from devora's own content — no hallucination — and streams replies via Claude.
- **Lead generation**: recommends the right package (Launch / Studio / Growth),
  collects details, generates an AI summary, and emails it to your Zoho inbox.
- **Human takeover**: flip an online/offline switch; take over any conversation
  and reply as a human in real time; release it back to the AI.
- **Admin dashboard** (`/admin`): conversations inbox, leads, support requests,
  analytics, knowledge-base editor, and the online toggle.
- **Graceful degradation**: every integration (Supabase, Claude, Upstash, Zoho)
  no-ops cleanly when unconfigured, so local dev and previews always run.

## Architecture at a glance

- **Frontend widget** — `components/chat/*`, mounted in `app/[locale]/layout.tsx`.
- **Public API** — `app/api/{conversation,chat,lead,support-request}` (chat streams
  Server-Sent Events).
- **Admin app** — `app/(admin)/admin/*` (own `<html>`, English, gated by `proxy.ts`).
- **Admin API** — `app/api/admin/*` (each handler re-checks the admin session).
- **Data/Auth/Realtime** — Supabase (Postgres + Auth + Realtime + pgvector).
- **LLM** — Anthropic Claude (`lib/anthropic.ts`), grounded via a full-context KB
  prompt with prompt caching (`lib/chat/{kb,systemPrompt}.ts`).
- **Email** — Zoho SMTP over nodemailer (`lib/email/*`).
- **Rate limiting** — Upstash Redis (`lib/ratelimit.ts`).

## Environment variables

Copy `.env.example` to `.env.local` and fill in. Everything is optional for local
dev (features degrade gracefully); all are needed for the full production system.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase (client, for Realtime) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side DB access (bypasses RLS) — keep secret |
| `ANTHROPIC_API_KEY` | Claude replies + lead/support summaries |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Rate limiting |
| `ZOHO_SMTP_USER` / `ZOHO_SMTP_PASS` | Zoho mailbox + app password |
| `ZOHO_SMTP_HOST` / `ZOHO_SMTP_PORT` | Default `smtp.zoho.com` / `465` |
| `CONTACT_TO` | Where leads/support land (defaults to `ZOHO_SMTP_USER`) |

## Setup

### 1. Supabase
1. Create a project at supabase.com.
2. In the SQL editor, run `supabase/migrations/0001_init.sql` (creates tables,
   enums, RLS, enables `pgvector`, and adds `messages`/`conversations`/`settings`
   to the Realtime publication).
3. Create your admin user: **Authentication → Users → Add user** (email + password).
4. Promote that user to owner — run in the SQL editor (replace the email):
   ```sql
   insert into public.admin_profiles (id, display_name, role)
   select id, 'devora', 'owner' from auth.users where email = 'you@devora.design'
   on conflict (id) do update set role = 'owner', is_active = true;
   ```
5. Copy the project URL + anon key + service-role key into `.env.local`.

### 2. Anthropic, Upstash, Zoho
- **Anthropic**: create an API key at console.anthropic.com → `ANTHROPIC_API_KEY`.
- **Upstash**: create a Redis database (free tier) → REST URL + token.
- **Zoho**: create an app-specific password for the mailbox → `ZOHO_SMTP_*` + `CONTACT_TO`.

### 3. Seed the knowledge base (optional)
The bot works immediately (it compiles the KB from `messages/*.json` + `lib/site.ts`
at runtime). To get *editable* KB rows in the admin editor, either:
- run `npm run seed:kb`, or
- open **/admin → Knowledge → Import from site**.

Edit or add documents in the KB editor; changes apply within a minute, no redeploy.

## Local development

```bash
npm install
npm run dev        # http://localhost:3000  (widget on /en and /ar)
npm run typecheck  # tsc --noEmit
npm run build      # production build
npm run test:e2e   # Playwright smoke test (needs the dev server running)
```

Without any env set, the widget still opens and streams a grounded fallback reply,
and `/admin` shows the login page with a "not configured" note.

## Deploy (Vercel)

1. Push the repo and import it into Vercel.
2. Add every variable above in **Project → Settings → Environment Variables**.
3. Deploy. The public site is static; the widget, APIs, admin, and middleware run
   as serverless functions. Realtime and email work as soon as their env is set.

## How grounding / anti-hallucination works

- The system prompt (`lib/chat/systemPrompt.ts`) instructs Claude to answer **only**
  from a `<knowledge_base>` block and to offer a human handoff when it doesn't know.
- The KB is the site's own content, compiled into the prompt with a `cache_control`
  breakpoint (Anthropic prompt caching) so repeated turns are cheap.
- Prompt-injection defenses: structural delimiters, "treat visitor text as data",
  input length limits, and a refusal to reveal the prompt.

## Human takeover flow

1. In **/admin → Settings**, turn **Online representative** on → visitors see
   "Online representative available".
2. In **/admin → Conversations**, open a thread and click **Take over** → the
   visitor's widget flips to "You're now chatting with the devora team", and the
   AI stops answering that conversation.
3. Type a reply — it reaches the visitor in under a second (Supabase Realtime
   broadcast). Their messages appear in your thread live.
4. Click **Release to AI** to hand the conversation back.

## Security notes

- Anonymous visitors never touch the database directly. All visitor writes go
  through server route handlers using the service-role key after validating the
  conversation's unguessable token. Visitor realtime uses broadcast on a channel
  named by that token (the token is the capability).
- RLS is deny-by-default; admins are gated by `public.is_admin()`.
- The service-role, Anthropic, Upstash, and Zoho secrets are server-only.
- Rate limiting and a lead-form honeypot guard the public endpoints.
