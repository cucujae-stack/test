-- 옷장 아이템
create table public.clothing_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  category text,           -- top, bottom, outer, shoes, acc 등
  color text,
  material text,
  pattern text,
  fit text,
  season text,             -- spring/summer/fall/winter/all
  brand text,
  image_url text,
  purchase_date date,
  purchase_price integer,
  last_worn_at date,
  status text not null default 'active',  -- active, archived, sold, donated
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.clothing_items (user_id, status);
create index on public.clothing_items (user_id, last_worn_at);

-- RLS
alter table public.clothing_items enable row level security;

create policy "users can read own items"
  on public.clothing_items for select
  using (auth.uid() = user_id);

create policy "users can insert own items"
  on public.clothing_items for insert
  with check (auth.uid() = user_id);

create policy "users can update own items"
  on public.clothing_items for update
  using (auth.uid() = user_id);

create policy "users can delete own items"
  on public.clothing_items for delete
  using (auth.uid() = user_id);

-- updated_at 자동 갱신
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger trg_clothing_items_updated_at
before update on public.clothing_items
for each row execute function public.set_updated_at();
