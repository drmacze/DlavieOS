-- DlavieOS AI Workspace Supabase schema
-- Jalankan di Supabase SQL Editor, lalu isi .env Vercel/Vite.

create extension if not exists pgcrypto;

create table if not exists public.users_profile (
  id uuid primary key references auth.users(id) on delete cascade,
  purpose text,
  source text,
  profession text,
  tier text not null default 'free' check (tier in ('free', 'pro', 'max')),
  has_onboarded boolean not null default false,
  encrypted_storage boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Percakapan Dlavie',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  encrypted_content text,
  feedback text check (feedback in ('up', 'down')),
  created_at timestamptz not null default now()
);

create table if not exists public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event text not null default 'chat_event',
  created_at timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  event_name text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists chat_sessions_user_created_idx on public.chat_sessions(user_id, created_at desc);
create index if not exists messages_session_created_idx on public.messages(session_id, created_at asc);
create index if not exists usage_logs_user_created_idx on public.usage_logs(user_id, created_at desc);

alter table public.users_profile enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.messages enable row level security;
alter table public.usage_logs enable row level security;
alter table public.analytics_events enable row level security;

drop policy if exists "profile self read" on public.users_profile;
create policy "profile self read" on public.users_profile for select using (auth.uid() = id);
drop policy if exists "profile self insert" on public.users_profile;
create policy "profile self insert" on public.users_profile for insert with check (auth.uid() = id);
drop policy if exists "profile self update" on public.users_profile;
create policy "profile self update" on public.users_profile for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "sessions self crud" on public.chat_sessions;
create policy "sessions self crud" on public.chat_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "messages self crud" on public.messages;
create policy "messages self crud" on public.messages for all using (exists (select 1 from public.chat_sessions s where s.id = session_id and s.user_id = auth.uid())) with check (exists (select 1 from public.chat_sessions s where s.id = session_id and s.user_id = auth.uid()));

drop policy if exists "usage self read" on public.usage_logs;
create policy "usage self read" on public.usage_logs for select using (auth.uid() = user_id);
drop policy if exists "usage self insert" on public.usage_logs;
create policy "usage self insert" on public.usage_logs for insert with check (auth.uid() = user_id);

drop policy if exists "analytics self insert" on public.analytics_events;
create policy "analytics self insert" on public.analytics_events for insert with check (auth.uid() = user_id or user_id is null);
drop policy if exists "analytics self read" on public.analytics_events;
create policy "analytics self read" on public.analytics_events for select using (auth.uid() = user_id);

create or replace function public.free_usage_count_last_hour(target_user uuid)
returns integer
language sql
security definer
set search_path = public
as $$
  select count(*)::integer from public.usage_logs
  where user_id = target_user and created_at >= now() - interval '1 hour';
$$;

create or replace function public.enforce_free_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare current_tier text;
begin
  select tier into current_tier from public.users_profile where id = new.user_id;
  if coalesce(current_tier, 'free') = 'free' and public.free_usage_count_last_hour(new.user_id) >= 10 then
    raise exception 'Batas 10 pesan/jam habis. Tunggu atau upgrade ke Dlavie Pro (Rp 149.000) / Max (Rp 299.000).';
  end if;
  return new;
end;
$$;

drop trigger if exists usage_logs_rate_limit_trigger on public.usage_logs;
create trigger usage_logs_rate_limit_trigger before insert on public.usage_logs for each row execute function public.enforce_free_rate_limit();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists users_profile_touch on public.users_profile;
create trigger users_profile_touch before update on public.users_profile for each row execute function public.touch_updated_at();
drop trigger if exists chat_sessions_touch on public.chat_sessions;
create trigger chat_sessions_touch before update on public.chat_sessions for each row execute function public.touch_updated_at();

-- Data expiration Free Tier: jadwalkan dari dashboard/pg_cron bila tersedia.
-- delete from public.chat_sessions s using public.users_profile p where s.user_id = p.id and p.tier = 'free' and s.created_at < now() - interval '30 days';
