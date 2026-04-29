-- Dominó — schema inicial
-- Tabelas: profiles (usuários) + matches (histórico de rodadas)

-- =========================================================================
-- PROFILES
-- =========================================================================
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null,
  wins          integer not null default 0,
  losses        integer not null default 0,
  games_played  integer not null default 0,
  created_at    timestamptz not null default now(),
  constraint username_format check (username ~ '^[a-zA-Z0-9_]{3,20}$')
);

create index profiles_username_idx on public.profiles (lower(username));

-- =========================================================================
-- MATCHES (histórico de rodadas)
-- =========================================================================
create table public.matches (
  id                 uuid primary key default gen_random_uuid(),
  room_id            text not null,
  winner_profile_id  uuid references public.profiles(id) on delete set null,
  winner_name        text not null,
  win_type           text not null check (win_type in ('simple','carroca','laeelou','carroca_laeelou')),
  points             integer not null,
  reason             text not null check (reason in ('empty','blocked')),
  players            jsonb not null,
  created_at         timestamptz not null default now()
);

create index matches_winner_idx on public.matches (winner_profile_id);
create index matches_created_idx on public.matches (created_at desc);

-- =========================================================================
-- Trigger: cria profile automaticamente quando um auth.users é inserido.
-- Username vem do raw_user_meta_data.username (passado no signUp).
-- =========================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(replace(new.id::text,'-',''), 1, 10))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================================
-- RPC: incrementa estatísticas do profile após uma rodada.
-- Chamado pelo backend com service_role.
-- =========================================================================
create or replace function public.increment_stats(p_profile_id uuid, p_won boolean)
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles
  set
    games_played = games_played + 1,
    wins   = wins   + case when p_won then 1 else 0 end,
    losses = losses + case when p_won then 0 else 1 end
  where id = p_profile_id;
$$;

-- =========================================================================
-- RLS
-- =========================================================================
alter table public.profiles enable row level security;
alter table public.matches  enable row level security;

-- Profiles: leitura pública (pra ranking e checar username); escritas só via
-- trigger/service_role (ambos com security definer bypassam RLS).
create policy "profiles_public_read"
  on public.profiles for select
  using (true);

-- Matches: leitura pública (histórico); escritas só via service_role.
create policy "matches_public_read"
  on public.matches for select
  using (true);
