-- ── WHAT TO DO GEELONG — Supabase Schema ─────────────────────
-- Run this once in the Supabase SQL Editor
-- Project: what-to-do-geelong

-- ── BUSINESSES ────────────────────────────────────────────────
create table if not exists businesses (
  id          text primary key,
  name        text not null,
  type        text,
  section     text,
  description text,
  emoji       text,
  color       text,
  location    text,
  suburb      text,
  website     text,
  img         text,
  plan        text default 'free',
  claimed     boolean default false,
  owner_id    uuid references auth.users(id) on delete set null,
  created_at  timestamptz default now()
);

-- ── EVENTS ────────────────────────────────────────────────────
create table if not exists events (
  id          serial primary key,
  slug        text,                    -- for deduplication in sync scripts
  business_id text references businesses(id) on delete set null,
  title       text not null,
  category    text,
  tags        text[]  default '{}',
  date        text,
  time        text,
  location    text,
  price       text,
  emoji       text,
  color       text,
  description text,
  url         text,                    -- link to tickets / event page
  img         text,
  lat         double precision,
  lng         double precision,
  source      text,                    -- 'afl-cats' | 'nbl-united' | 'gpac' | 'eventbrite' etc.
  featured    boolean default false,
  is_promoted boolean default false,
  created_at  timestamptz default now()
);

-- ── STAYS ─────────────────────────────────────────────────────
create table if not exists stays (
  id          text primary key,
  name        text not null,
  type        text,
  location    text,
  price       text,
  stars       text,
  emoji       text,
  color       text,
  img         text,
  created_at  timestamptz default now()
);

-- ── PROMOS ────────────────────────────────────────────────────
create table if not exists promos (
  id          text primary key,
  business_id text references businesses(id) on delete cascade,
  title       text not null,
  description text,
  expires     text,
  emoji       text,
  tag         text,
  created_at  timestamptz default now()
);

-- ── ARTICLES ──────────────────────────────────────────────────
create table if not exists articles (
  id           text primary key,
  type         text check (type in ('guide', 'news', 'history')),
  title        text not null,
  excerpt      text,
  hero_img     text,
  before_img   text,
  after_img    text,
  published_at date,
  author       text,
  business_ids text[]    default '{}',
  event_ids    integer[] default '{}',
  tags         text[]    default '{}',
  content      text,
  submitted_by uuid references auth.users(id) on delete set null,
  approved     boolean default true,
  created_at   timestamptz default now()
);

-- ── INQUIRIES ─────────────────────────────────────────────────
create table if not exists inquiries (
  id          uuid default gen_random_uuid() primary key,
  business_id text references businesses(id) on delete cascade,
  name        text,
  email       text,
  message     text,
  unread      boolean default true,
  created_at  timestamptz default now()
);

-- ── SAVED ITEMS ───────────────────────────────────────────────
create table if not exists saved_items (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade,
  item_id     text not null,
  item_type   text,
  title       text,
  emoji       text,
  color       text,
  price       text,
  location    text,
  created_at  timestamptz default now(),
  unique(user_id, item_id)
);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────

alter table businesses  enable row level security;
alter table events      enable row level security;
alter table stays       enable row level security;
alter table promos      enable row level security;
alter table articles    enable row level security;
alter table inquiries   enable row level security;
alter table saved_items enable row level security;

-- Public read
create policy "Public read businesses"  on businesses  for select using (true);
create policy "Public read events"      on events      for select using (true);
create policy "Public read stays"       on stays       for select using (true);
create policy "Public read promos"      on promos      for select using (true);
create policy "Public read articles"    on articles    for select using (approved = true);

-- Inquiries: anyone can insert, only business owner can read
create policy "Anyone can submit inquiry" on inquiries
  for insert with check (true);
create policy "Owner reads inquiries" on inquiries
  for select using (
    business_id in (
      select id from businesses where owner_id = auth.uid()
    )
  );

-- Saved items: user owns their own rows
create policy "User manages saved" on saved_items
  for all using (auth.uid() = user_id);

-- Business owners can update their own listing
create policy "Owner updates business" on businesses
  for update using (auth.uid() = owner_id);

-- Authenticated users can insert businesses
create policy "Auth users insert business" on businesses
  for insert with check (auth.uid() = owner_id);

-- Featured plan: business owners can insert events/promos for their businesses
create policy "Owner inserts events" on events
  for insert with check (
    business_id in (
      select id from businesses where owner_id = auth.uid()
    )
  );
create policy "Owner updates events" on events
  for update using (
    business_id in (
      select id from businesses where owner_id = auth.uid()
    )
  );
create policy "Owner deletes events" on events
  for delete using (
    business_id in (
      select id from businesses where owner_id = auth.uid()
    )
  );
create policy "Owner inserts promos" on promos
  for insert with check (
    business_id in (
      select id from businesses where owner_id = auth.uid()
    )
  );
create policy "Owner updates promos" on promos
  for update using (
    business_id in (
      select id from businesses where owner_id = auth.uid()
    )
  );
create policy "Owner deletes promos" on promos
  for delete using (
    business_id in (
      select id from businesses where owner_id = auth.uid()
    )
  );

-- Featured plan: news articles submitted by business owners need approval
create policy "Auth users submit articles" on articles
  for insert with check (auth.uid() = submitted_by);
create policy "Owner updates own article" on articles
  for update using (auth.uid() = submitted_by);
