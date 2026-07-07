-- devora AI Customer-Support Platform — initial schema
-- Postgres (Supabase). Apply via the Supabase SQL editor or `supabase db push`.
--
-- Security model (see plan): visitors are anonymous and NEVER touch tables
-- directly. All visitor writes go through server route handlers using the
-- service-role key (which bypasses RLS). Visitors receive live messages over
-- Supabase Realtime *broadcast* on a channel named by an unguessable per-
-- conversation token — so no table-level RLS is needed for them. Admins are
-- authenticated (Supabase Auth) and gated by RLS via public.is_admin().

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists vector;     -- pgvector (retrieval-ready; unused in v1)

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type message_role   as enum ('user','assistant','system');
exception when duplicate_object then null; end $$;

do $$ begin
  create type message_author as enum ('visitor','ai','human_agent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type conv_status    as enum ('active','idle','closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type conv_mode      as enum ('ai','human');
exception when duplicate_object then null; end $$;

do $$ begin
  create type lead_status    as enum ('new','qualified','contacted','won','lost');
exception when duplicate_object then null; end $$;

do $$ begin
  create type support_status as enum ('open','in_progress','resolved','closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type kb_source      as enum ('messages_json','site_ts','admin');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Generic updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- admin_profiles — one row per authenticated admin (FK to auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.admin_profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role         text not null default 'admin' check (role in ('admin','owner')),
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

-- SECURITY DEFINER so the admin check can read admin_profiles without being
-- blocked by that table's own RLS (avoids recursive policy evaluation).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_profiles p
    where p.id = auth.uid() and p.is_active
  );
$$;

-- ---------------------------------------------------------------------------
-- conversations
-- ---------------------------------------------------------------------------
create table if not exists public.conversations (
  id              uuid primary key default gen_random_uuid(),
  token           uuid not null default gen_random_uuid(),  -- unguessable visitor secret
  locale          text not null default 'en' check (locale in ('en','ar')),
  status          conv_status not null default 'active',
  mode            conv_mode   not null default 'ai',
  taken_over_by   uuid references public.admin_profiles(id) on delete set null,
  visitor_name    text,
  visitor_email   text,
  visitor_meta    jsonb not null default '{}'::jsonb,        -- {ip_hash, ua, referer, first_page}
  last_message_at timestamptz not null default now(),
  created_at      timestamptz not null default now()
);
create unique index if not exists conversations_token_key on public.conversations(token);
create index if not exists conversations_status_idx on public.conversations(status, last_message_at desc);
create index if not exists conversations_mode_idx on public.conversations(mode);

-- ---------------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role            message_role not null,
  author          message_author not null,
  content         text not null,
  agent_id        uuid references public.admin_profiles(id) on delete set null,
  metadata        jsonb not null default '{}'::jsonb,        -- {model, tokens, intent, kb_hit}
  created_at      timestamptz not null default now()
);
create index if not exists messages_conv_idx on public.messages(conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- leads
-- ---------------------------------------------------------------------------
create table if not exists public.leads (
  id                  uuid primary key default gen_random_uuid(),
  conversation_id     uuid references public.conversations(id) on delete set null,
  name                text,
  email               text,
  phone               text,
  company             text,
  request             text,
  recommended_package text,                          -- 'launch' | 'studio' | 'growth'
  ai_summary          text,
  status              lead_status not null default 'new',
  locale              text not null default 'en',
  created_at          timestamptz not null default now()
);
create index if not exists leads_status_idx on public.leads(status, created_at desc);

-- ---------------------------------------------------------------------------
-- support_requests
-- ---------------------------------------------------------------------------
create table if not exists public.support_requests (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete set null,
  name            text,
  email           text,
  phone           text,
  subject         text,
  body            text,
  ai_summary      text,
  status          support_status not null default 'open',
  locale          text not null default 'en',
  created_at      timestamptz not null default now()
);
create index if not exists support_status_idx on public.support_requests(status, created_at desc);

-- ---------------------------------------------------------------------------
-- kb_documents — served knowledge base (source of truth for grounding)
-- ---------------------------------------------------------------------------
create table if not exists public.kb_documents (
  id         uuid primary key default gen_random_uuid(),
  source     kb_source not null,
  locale     text not null check (locale in ('en','ar')),
  ref_key    text,                                   -- dedupe key, e.g. 'faq.q4'
  title      text,
  body       text not null,
  is_active  boolean not null default true,
  updated_by uuid references public.admin_profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (source, locale, ref_key)
);
create index if not exists kb_documents_locale_idx on public.kb_documents(locale, is_active);
drop trigger if exists kb_documents_set_updated_at on public.kb_documents;
create trigger kb_documents_set_updated_at
  before update on public.kb_documents
  for each row execute function public.set_updated_at();

-- kb_chunks — retrieval-ready; embedding stays NULL in v1 (full-context mode)
create table if not exists public.kb_chunks (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.kb_documents(id) on delete cascade,
  locale      text not null,
  content     text not null,
  embedding   vector(1536),
  token_count int,
  created_at  timestamptz not null default now()
);
create index if not exists kb_chunks_doc_idx on public.kb_chunks(document_id);
-- NOTE: the ivfflat vector index is intentionally NOT created in v1 (no
-- embeddings). Create it only when flipping to retrieval mode:
--   create index kb_chunks_embedding_idx on public.kb_chunks
--     using ivfflat (embedding vector_cosine_ops) with (lists = 20);

-- ---------------------------------------------------------------------------
-- settings — singleton (online/offline representative toggle)
-- ---------------------------------------------------------------------------
create table if not exists public.settings (
  id                     int primary key default 1 check (id = 1),
  representative_online   boolean not null default false,
  auto_takeover_keywords  text[] not null default '{}',
  updated_by             uuid references public.admin_profiles(id) on delete set null,
  updated_at             timestamptz not null default now()
);
insert into public.settings (id) values (1) on conflict (id) do nothing;
drop trigger if exists settings_set_updated_at on public.settings;
create trigger settings_set_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- analytics_events — append-only; dashboard metrics are group-by queries
-- ---------------------------------------------------------------------------
create table if not exists public.analytics_events (
  id              bigserial primary key,
  conversation_id uuid references public.conversations(id) on delete set null,
  type            text not null,   -- conversation_started | message_sent | lead_captured
                                   -- | takeover | released | language_detected
                                   -- | out_of_scope | support_created
  locale          text,
  props           jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);
create index if not exists analytics_type_idx on public.analytics_events(type, created_at desc);
create index if not exists analytics_created_idx on public.analytics_events(created_at desc);

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- Deny-by-default everywhere. Admins (authenticated + is_admin) get full access
-- through the SSR client. The service-role key used by server route handlers
-- bypasses RLS entirely, so anonymous visitor traffic never needs a policy.
-- ---------------------------------------------------------------------------
alter table public.admin_profiles   enable row level security;
alter table public.conversations    enable row level security;
alter table public.messages         enable row level security;
alter table public.leads            enable row level security;
alter table public.support_requests enable row level security;
alter table public.kb_documents     enable row level security;
alter table public.kb_chunks        enable row level security;
alter table public.settings         enable row level security;
alter table public.analytics_events enable row level security;

-- admin_profiles: an admin may read their own row and (if active) all rows.
drop policy if exists admin_profiles_self on public.admin_profiles;
create policy admin_profiles_self on public.admin_profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- Operational tables: full access for active admins only.
drop policy if exists conversations_admin on public.conversations;
create policy conversations_admin on public.conversations
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists messages_admin on public.messages;
create policy messages_admin on public.messages
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists leads_admin on public.leads;
create policy leads_admin on public.leads
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists support_requests_admin on public.support_requests;
create policy support_requests_admin on public.support_requests
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists kb_documents_admin on public.kb_documents;
create policy kb_documents_admin on public.kb_documents
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists kb_chunks_admin on public.kb_chunks;
create policy kb_chunks_admin on public.kb_chunks
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists settings_admin on public.settings;
create policy settings_admin on public.settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists analytics_admin on public.analytics_events;
create policy analytics_admin on public.analytics_events
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Realtime — admins subscribe to conversations/messages via postgres_changes
-- (RLS above governs what they see). Visitors use broadcast, not these.
-- ---------------------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.conversations;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.settings;
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Owner bootstrap (run once, AFTER creating the auth user in the Supabase
-- dashboard → Authentication → Users). Replace the email below.
-- ---------------------------------------------------------------------------
-- insert into public.admin_profiles (id, display_name, role)
-- select id, 'devora', 'owner' from auth.users where email = 'you@devora.design'
-- on conflict (id) do update set role = 'owner', is_active = true;
