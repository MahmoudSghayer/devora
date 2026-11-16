-- 0002 — calculator leads (website estimator, automation ROI, contact form)
--
-- Idempotent: safe to re-run. COMMITTED ONLY — the project owner applies it
-- (see docs/leads.md). Existing rows are backfilled with source = 'chat' via
-- the column default.
--
-- 0001 already leaves name/email/phone/company/request nullable, so no
-- constraint needs relaxing: calculator leads always send name + email and a
-- generated `request` summary, and everything structured lives in `details`.

alter table public.leads add column if not exists source             text not null default 'chat';
alter table public.leads add column if not exists details            jsonb not null default '{}'::jsonb;
alter table public.leads add column if not exists estimate_low       numeric;
alter table public.leads add column if not exists estimate_high      numeric;
alter table public.leads add column if not exists estimate_currency  text;
alter table public.leads add column if not exists lead_ref           text;
alter table public.leads add column if not exists idempotency_key    uuid;
alter table public.leads add column if not exists preferred_contact  text;
alter table public.leads add column if not exists consent_at         timestamptz;
alter table public.leads add column if not exists consent_version    text;
alter table public.leads add column if not exists email_delivered    boolean default false;
alter table public.leads add column if not exists email_error        text;
alter table public.leads add column if not exists ip_hash            text;
alter table public.leads add column if not exists user_agent         text;
alter table public.leads add column if not exists referrer           text;
alter table public.leads add column if not exists utm                jsonb;
alter table public.leads add column if not exists updated_at         timestamptz not null default now();

-- Named CHECK, dropped and re-added so re-running (or extending the list) is safe.
do $$ begin
  alter table public.leads drop constraint if exists leads_source_check;
  alter table public.leads add constraint leads_source_check
    check (source in ('chat','contact','website_estimate','automation_roi','software_discovery'));
end $$;

do $$ begin
  alter table public.leads add constraint leads_preferred_contact_check
    check (preferred_contact is null or preferred_contact in ('email','phone','whatsapp'));
exception when duplicate_object then null; end $$;

-- Uniqueness: human-readable ref, and one row per client idempotency key.
-- (Postgres unique indexes allow many NULLs, so chat leads are unaffected.)
create unique index if not exists leads_lead_ref_key        on public.leads(lead_ref);
create unique index if not exists leads_idempotency_key_key on public.leads(idempotency_key);

-- Query-path indexes.
create index if not exists leads_source_created_idx   on public.leads(source, created_at desc);
create index if not exists leads_email_idx            on public.leads(email);
create index if not exists leads_conversation_idx     on public.leads(conversation_id);
create index if not exists support_conversation_idx   on public.support_requests(conversation_id);

-- Reuse the generic trigger function from 0001 (public.set_updated_at()).
drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

-- RLS: the existing `leads_admin` policy from 0001 is TABLE-LEVEL
-- (for all to authenticated using/with check is_admin()), so it already covers
-- every new column. Visitors never touch this table directly — all inserts go
-- through the service-role key in server route handlers. No policy change.
comment on column public.leads.details is
  'Calculator snapshot: raw answers, server-computed result, pricing_config_version, step timeline.';
