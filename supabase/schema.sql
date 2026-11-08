-- Juleglede: tabell for delte ønskelister.
-- Kjør dette i Supabase: SQL Editor → New query → lim inn → Run.

create table if not exists public.wishes (
  id          uuid primary key default gen_random_uuid(),
  owner       text not null check (char_length(trim(owner)) between 1 and 60),
  title       text not null check (char_length(trim(title)) between 1 and 200),
  link        text check (link is null or link ~* '^https?://'),
  note        text check (note is null or char_length(note) <= 300),
  created_at  timestamptz not null default now()
);

create index if not exists wishes_owner_idx on public.wishes (lower(owner));

-- Appen har ingen innlogging: alle med den offentlige nøkkelen kan lese,
-- legge til og slette ønsker. Hold derfor prosjekt-URL og nøkkel innad i familien.
-- Merk: Det lagres ALDRI noe om hvem som har kjøpt hva – det ligger bare lokalt på
-- enheten til den som kjøper (fanen Gaver).
alter table public.wishes enable row level security;

drop policy if exists "Alle kan lese ønsker" on public.wishes;
create policy "Alle kan lese ønsker" on public.wishes
  for select to anon, authenticated using (true);

drop policy if exists "Alle kan legge til ønsker" on public.wishes;
create policy "Alle kan legge til ønsker" on public.wishes
  for insert to anon, authenticated with check (true);

drop policy if exists "Alle kan slette ønsker" on public.wishes;
create policy "Alle kan slette ønsker" on public.wishes
  for delete to anon, authenticated using (true);

grant select, insert, delete on public.wishes to anon, authenticated;

-- Be Supabase sitt API om å lese tabellene på nytt, så tabellen blir synlig med en gang.
notify pgrst, 'reload schema';
