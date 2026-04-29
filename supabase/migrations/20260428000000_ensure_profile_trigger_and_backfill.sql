-- Garante o trigger de criação de profile e faz backfill dos usuários
-- que foram criados antes do trigger existir (ou caso a init migration
-- nunca tenha sido aplicada no projeto hospedado).
-- Idempotente: pode rodar várias vezes sem efeito colateral.

-- =========================================================================
-- 1. Tabela profiles (caso ainda não exista)
-- =========================================================================
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null,
  wins          integer not null default 0,
  losses        integer not null default 0,
  games_played  integer not null default 0,
  created_at    timestamptz not null default now(),
  constraint username_format check (username ~ '^[a-zA-Z0-9_]{3,20}$')
);

create index if not exists profiles_username_idx on public.profiles (lower(username));

-- =========================================================================
-- 2. Função + trigger (recria — create or replace é idempotente)
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
    coalesce(
      new.raw_user_meta_data->>'username',
      'user_' || substr(replace(new.id::text,'-',''), 1, 10)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================================
-- 3. Backfill: cria profile pra todo auth.users que ainda não tem
-- =========================================================================
insert into public.profiles (id, username)
select
  u.id,
  -- Se o username do metadata colidir com algum existente, usa fallback.
  -- Ordem de prioridade:
  --   1) raw_user_meta_data.username (se válido e único)
  --   2) prefixo do email (se válido e único)
  --   3) user_<10 chars do uuid>
  case
    when u.raw_user_meta_data->>'username' ~ '^[a-zA-Z0-9_]{3,20}$'
         and not exists (select 1 from public.profiles p2 where lower(p2.username) = lower(u.raw_user_meta_data->>'username'))
      then u.raw_user_meta_data->>'username'
    when split_part(u.email, '@', 1) ~ '^[a-zA-Z0-9_]{3,20}$'
         and not exists (select 1 from public.profiles p2 where lower(p2.username) = lower(split_part(u.email, '@', 1)))
      then split_part(u.email, '@', 1)
    else 'user_' || substr(replace(u.id::text,'-',''), 1, 10)
  end as username
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

-- =========================================================================
-- 4. RLS (caso ainda não esteja ativado pela init migration)
-- =========================================================================
alter table public.profiles enable row level security;

drop policy if exists "profiles_public_read" on public.profiles;
create policy "profiles_public_read"
  on public.profiles for select
  using (true);
