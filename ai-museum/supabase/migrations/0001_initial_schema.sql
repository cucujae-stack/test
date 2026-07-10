-- ============================================================================
-- AI Museum — initial schema
-- ============================================================================
-- Conventions:
--   * auth.users is Supabase Auth's table; profiles extends it 1:1.
--   * Counter columns (likes_count, ...) are denormalized and maintained by
--     triggers so feed queries never need aggregate joins.
--   * Row Level Security is enabled on every table.
--   * Marketplace tables exist but no payment logic ships yet (see bottom).
-- ============================================================================

create extension if not exists "pg_trgm"; -- trigram search on titles/prompts

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
create type visibility as enum ('public', 'unlisted', 'private');
create type user_role as enum ('visitor', 'creator', 'admin');
create type report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');
create type report_target as enum ('artwork', 'comment', 'profile', 'exhibition');
create type notification_type as enum
  ('like', 'bookmark', 'comment', 'follow', 'feature', 'exhibition_invite', 'system');
create type product_kind as enum
  ('digital_download', 'print', 'canvas', 'license', 'nft', 'commission');

-- ----------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ----------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9][a-z0-9-]{2,29}$'),
  display_name text not null,
  bio text default '',
  avatar_url text,
  banner_url text,
  website text,
  socials jsonb not null default '[]', -- [{platform, url}]
  role user_role not null default 'visitor',
  followers_count int not null default 0,
  following_count int not null default 0,
  works_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile row on signup.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'user_name',
             'user-' || left(new.id::text, 8)),
    coalesce(new.raw_user_meta_data ->> 'full_name', 'New Visitor')
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ----------------------------------------------------------------------------
-- Categories & tags
-- ----------------------------------------------------------------------------
create table categories (
  slug text primary key,
  name text not null,
  description text default '',
  sort_order int not null default 0
);

insert into categories (slug, name, sort_order) values
  ('landscape', 'Landscape', 1), ('portrait', 'Portrait', 2),
  ('fantasy', 'Fantasy', 3), ('fashion', 'Fashion', 4),
  ('architecture', 'Architecture', 5), ('cyberpunk', 'Cyberpunk', 6),
  ('photography', 'Photography', 7), ('anime', 'Anime', 8),
  ('minimal', 'Minimal', 9), ('abstract', 'Abstract', 10);

create table tags (
  id bigint generated always as identity primary key,
  name text not null unique check (name = lower(name))
);

-- ----------------------------------------------------------------------------
-- Artworks
-- ----------------------------------------------------------------------------
create table artworks (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  artist_id uuid not null references profiles (id) on delete cascade,
  title text not null,
  description text default '',
  category_slug text references categories (slug),
  prompt text,          -- optional: creators choose whether to share
  negative_prompt text,
  model text,           -- e.g. "Midjourney v7"
  color_palette text[] not null default '{}', -- extracted hex values
  visibility visibility not null default 'public',
  featured boolean not null default false,
  published_at timestamptz,              -- null = draft
  scheduled_for timestamptz,             -- future publication
  views_count bigint not null default 0,
  likes_count int not null default 0,
  bookmarks_count int not null default 0,
  comments_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Multiple images per artwork (upload supports batches); position 0 is cover.
create table artwork_images (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid not null references artworks (id) on delete cascade,
  storage_path text not null,  -- Supabase Storage object path
  width int not null,
  height int not null,
  position int not null default 0,
  unique (artwork_id, position)
);

create table artwork_tags (
  artwork_id uuid not null references artworks (id) on delete cascade,
  tag_id bigint not null references tags (id) on delete cascade,
  primary key (artwork_id, tag_id)
);

create index artworks_feed_idx on artworks (visibility, published_at desc);
create index artworks_artist_idx on artworks (artist_id, published_at desc);
create index artworks_category_idx on artworks (category_slug, published_at desc);
create index artworks_title_trgm_idx on artworks using gin (title gin_trgm_ops);
create index artworks_prompt_trgm_idx on artworks using gin (prompt gin_trgm_ops);

-- ----------------------------------------------------------------------------
-- Social graph & engagement
-- ----------------------------------------------------------------------------
create table follows (
  follower_id uuid not null references profiles (id) on delete cascade,
  followee_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create table likes (
  user_id uuid not null references profiles (id) on delete cascade,
  artwork_id uuid not null references artworks (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, artwork_id)
);

create table bookmarks (
  user_id uuid not null references profiles (id) on delete cascade,
  artwork_id uuid not null references artworks (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, artwork_id)
);

create table comments (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid not null references artworks (id) on delete cascade,
  author_id uuid not null references profiles (id) on delete cascade,
  parent_id uuid references comments (id) on delete cascade, -- threading
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index comments_artwork_idx on comments (artwork_id, created_at);

-- Views are logged individually (dedup by viewer/day handled at insert time)
-- then rolled into artworks.views_count by trigger.
create table artwork_views (
  id bigint generated always as identity primary key,
  artwork_id uuid not null references artworks (id) on delete cascade,
  viewer_id uuid references profiles (id) on delete set null, -- null = anonymous
  viewed_on date not null default current_date,
  unique (artwork_id, viewer_id, viewed_on)
);

-- ----------------------------------------------------------------------------
-- Collections
-- ----------------------------------------------------------------------------
create table collections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id) on delete cascade,
  slug text not null,
  name text not null,
  description text default '',
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, slug)
);

create table collection_items (
  collection_id uuid not null references collections (id) on delete cascade,
  artwork_id uuid not null references artworks (id) on delete cascade,
  position int not null default 0,
  added_at timestamptz not null default now(),
  primary key (collection_id, artwork_id)
);

-- ----------------------------------------------------------------------------
-- Exhibitions & museum rooms
-- ----------------------------------------------------------------------------
create table exhibitions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  curator_id uuid references profiles (id) on delete set null, -- null = AI-curated
  curated_by_ai boolean not null default false,
  title text not null,
  subtitle text default '',
  description text default '',
  cover_url text,
  featured boolean not null default false,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table exhibition_artworks (
  exhibition_id uuid not null references exhibitions (id) on delete cascade,
  artwork_id uuid not null references artworks (id) on delete cascade,
  position int not null default 0,
  primary key (exhibition_id, artwork_id)
);

-- Permanent themed rooms ("Dreams", "Nature", ...). Content rotates.
create table rooms (
  slug text primary key,
  name text not null,
  description text default '',
  cover_url text,
  tint text, -- accent hex for the immersive backdrop
  sort_order int not null default 0
);

create table room_artworks (
  room_slug text not null references rooms (slug) on delete cascade,
  artwork_id uuid not null references artworks (id) on delete cascade,
  position int not null default 0,
  primary key (room_slug, artwork_id)
);

-- ----------------------------------------------------------------------------
-- Notifications, reports
-- ----------------------------------------------------------------------------
create table notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references profiles (id) on delete cascade,
  actor_id uuid references profiles (id) on delete set null,
  type notification_type not null,
  artwork_id uuid references artworks (id) on delete cascade,
  exhibition_id uuid references exhibitions (id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_recipient_idx
  on notifications (recipient_id, created_at desc);

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles (id) on delete set null,
  target_type report_target not null,
  target_id uuid not null,
  reason text not null,
  status report_status not null default 'open',
  resolved_by uuid references profiles (id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Future marketplace (no payment logic yet — schema only)
-- ----------------------------------------------------------------------------
-- A product is a sellable form of an artwork. Prices in minor units.
create table products (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid not null references artworks (id) on delete cascade,
  kind product_kind not null,
  title text not null,
  price_cents int not null check (price_cents >= 0),
  currency char(3) not null default 'USD',
  -- kind-specific attributes: print size, license terms, edition size, chain…
  attributes jsonb not null default '{}',
  active boolean not null default false, -- stays false until marketplace ships
  created_at timestamptz not null default now()
);

-- Order skeleton so historic rows exist from day one of the marketplace.
create table orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references profiles (id) on delete set null,
  status text not null default 'pending',
  total_cents int not null default 0,
  currency char(3) not null default 'USD',
  created_at timestamptz not null default now()
);

create table order_items (
  order_id uuid not null references orders (id) on delete cascade,
  product_id uuid not null references products (id),
  quantity int not null default 1 check (quantity > 0),
  unit_price_cents int not null,
  primary key (order_id, product_id)
);

-- Commission requests are marketplace-adjacent but useful pre-payments too.
create table commission_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles (id) on delete cascade,
  artist_id uuid not null references profiles (id) on delete cascade,
  brief text not null,
  budget_cents int,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Counter triggers
-- ----------------------------------------------------------------------------
create or replace function bump_likes() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update artworks set likes_count = likes_count + 1 where id = new.artwork_id;
  else
    update artworks set likes_count = likes_count - 1 where id = old.artwork_id;
  end if;
  return null;
end $$;
create trigger likes_counter after insert or delete on likes
  for each row execute function bump_likes();

create or replace function bump_bookmarks() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update artworks set bookmarks_count = bookmarks_count + 1 where id = new.artwork_id;
  else
    update artworks set bookmarks_count = bookmarks_count - 1 where id = old.artwork_id;
  end if;
  return null;
end $$;
create trigger bookmarks_counter after insert or delete on bookmarks
  for each row execute function bump_bookmarks();

create or replace function bump_comments() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update artworks set comments_count = comments_count + 1 where id = new.artwork_id;
  else
    update artworks set comments_count = comments_count - 1 where id = old.artwork_id;
  end if;
  return null;
end $$;
create trigger comments_counter after insert or delete on comments
  for each row execute function bump_comments();

create or replace function bump_follows() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update profiles set followers_count = followers_count + 1 where id = new.followee_id;
    update profiles set following_count = following_count + 1 where id = new.follower_id;
  else
    update profiles set followers_count = followers_count - 1 where id = old.followee_id;
    update profiles set following_count = following_count - 1 where id = old.follower_id;
  end if;
  return null;
end $$;
create trigger follows_counter after insert or delete on follows
  for each row execute function bump_follows();

create or replace function bump_views() returns trigger language plpgsql as $$
begin
  update artworks set views_count = views_count + 1 where id = new.artwork_id;
  return null;
end $$;
create trigger views_counter after insert on artwork_views
  for each row execute function bump_views();

create or replace function bump_works() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update profiles set works_count = works_count + 1 where id = new.artist_id;
  else
    update profiles set works_count = works_count - 1 where id = old.artist_id;
  end if;
  return null;
end $$;
create trigger works_counter after insert or delete on artworks
  for each row execute function bump_works();

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table profiles enable row level security;
alter table categories enable row level security;
alter table tags enable row level security;
alter table artworks enable row level security;
alter table artwork_images enable row level security;
alter table artwork_tags enable row level security;
alter table follows enable row level security;
alter table likes enable row level security;
alter table bookmarks enable row level security;
alter table comments enable row level security;
alter table artwork_views enable row level security;
alter table collections enable row level security;
alter table collection_items enable row level security;
alter table exhibitions enable row level security;
alter table exhibition_artworks enable row level security;
alter table rooms enable row level security;
alter table room_artworks enable row level security;
alter table notifications enable row level security;
alter table reports enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table commission_requests enable row level security;

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- Public read of public content
create policy "profiles are public" on profiles for select using (true);
create policy "categories are public" on categories for select using (true);
create policy "tags are public" on tags for select using (true);
create policy "rooms are public" on rooms for select using (true);
create policy "room art is public" on room_artworks for select using (true);
create policy "exhibitions are public" on exhibitions for select using (true);
create policy "exhibition art is public" on exhibition_artworks for select using (true);

create policy "public artworks readable" on artworks for select
  using (visibility = 'public' or artist_id = auth.uid() or is_admin());
create policy "artwork images follow artwork" on artwork_images for select
  using (exists (
    select 1 from artworks a where a.id = artwork_id
      and (a.visibility = 'public' or a.artist_id = auth.uid() or is_admin())
  ));
create policy "artwork tags follow artwork" on artwork_tags for select using (true);

create policy "public collections readable" on collections for select
  using (is_public or owner_id = auth.uid() or is_admin());
create policy "collection items follow collection" on collection_items for select
  using (exists (
    select 1 from collections c where c.id = collection_id
      and (c.is_public or c.owner_id = auth.uid() or is_admin())
  ));

create policy "likes readable" on likes for select using (true);
create policy "bookmarks readable by owner" on bookmarks for select
  using (user_id = auth.uid());
create policy "comments readable" on comments for select using (true);
create policy "follows readable" on follows for select using (true);

-- Owner writes
create policy "update own profile" on profiles for update
  using (id = auth.uid());
create policy "insert own artworks" on artworks for insert
  with check (artist_id = auth.uid());
create policy "update own artworks" on artworks for update
  using (artist_id = auth.uid() or is_admin());
create policy "delete own artworks" on artworks for delete
  using (artist_id = auth.uid() or is_admin());
create policy "manage own artwork images" on artwork_images for all
  using (exists (select 1 from artworks a where a.id = artwork_id and a.artist_id = auth.uid()))
  with check (exists (select 1 from artworks a where a.id = artwork_id and a.artist_id = auth.uid()));
create policy "manage own artwork tags" on artwork_tags for all
  using (exists (select 1 from artworks a where a.id = artwork_id and a.artist_id = auth.uid()))
  with check (exists (select 1 from artworks a where a.id = artwork_id and a.artist_id = auth.uid()));
create policy "creators add tags" on tags for insert
  with check (auth.uid() is not null);

create policy "like as self" on likes for insert with check (user_id = auth.uid());
create policy "unlike as self" on likes for delete using (user_id = auth.uid());
create policy "bookmark as self" on bookmarks for insert with check (user_id = auth.uid());
create policy "unbookmark as self" on bookmarks for delete using (user_id = auth.uid());
create policy "follow as self" on follows for insert with check (follower_id = auth.uid());
create policy "unfollow as self" on follows for delete using (follower_id = auth.uid());
create policy "comment as self" on comments for insert with check (author_id = auth.uid());
create policy "edit own comments" on comments for update using (author_id = auth.uid());
create policy "delete own comments" on comments for delete
  using (author_id = auth.uid() or is_admin());
create policy "log views" on artwork_views for insert with check (true);

create policy "manage own collections" on collections for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "manage own collection items" on collection_items for all
  using (exists (select 1 from collections c where c.id = collection_id and c.owner_id = auth.uid()))
  with check (exists (select 1 from collections c where c.id = collection_id and c.owner_id = auth.uid()));

create policy "curators manage exhibitions" on exhibitions for all
  using (curator_id = auth.uid() or is_admin())
  with check (curator_id = auth.uid() or is_admin());
create policy "curators manage exhibition art" on exhibition_artworks for all
  using (exists (select 1 from exhibitions e where e.id = exhibition_id
                 and (e.curator_id = auth.uid() or is_admin())))
  with check (exists (select 1 from exhibitions e where e.id = exhibition_id
                      and (e.curator_id = auth.uid() or is_admin())));

create policy "own notifications" on notifications for select
  using (recipient_id = auth.uid());
create policy "mark notifications read" on notifications for update
  using (recipient_id = auth.uid());

create policy "file reports" on reports for insert
  with check (reporter_id = auth.uid());
create policy "admins read reports" on reports for select using (is_admin());
create policy "admins resolve reports" on reports for update using (is_admin());

-- Marketplace: artists manage their products; buyers see their own orders.
create policy "active products readable" on products for select
  using (active or is_admin() or exists (
    select 1 from artworks a where a.id = artwork_id and a.artist_id = auth.uid()));
create policy "artists manage products" on products for all
  using (exists (select 1 from artworks a where a.id = artwork_id and a.artist_id = auth.uid()))
  with check (exists (select 1 from artworks a where a.id = artwork_id and a.artist_id = auth.uid()));
create policy "own orders" on orders for select using (buyer_id = auth.uid() or is_admin());
create policy "own order items" on order_items for select
  using (exists (select 1 from orders o where o.id = order_id
                 and (o.buyer_id = auth.uid() or is_admin())));
create policy "own commissions" on commission_requests for select
  using (client_id = auth.uid() or artist_id = auth.uid() or is_admin());
create policy "request commission" on commission_requests for insert
  with check (client_id = auth.uid());
