-- Stockart — Supabase Schema
-- Paste this entire file into the Supabase SQL editor and run it.
-- Run once on a fresh project before first deploy.

-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists shop_settings (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  shop_name    text not null default '',
  contact      text not null default '',
  currency_code     text not null default 'USD',
  decimal_places    smallint not null default 2,
  last_sale_number  integer not null default 0,
  setup_complete    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id)  -- one settings row per user
);

create table if not exists products (
  id           uuid primary key,           -- client-generated UUID
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  price_int    integer not null default 0, -- smallest currency unit
  threshold    integer not null default 0, -- low-stock threshold
  stock        integer not null default 0,
  archived     boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists sales (
  id              uuid primary key,        -- client-generated UUID
  user_id         uuid not null references auth.users(id) on delete cascade,
  sale_number     integer not null,
  customer_name   text,
  total_int       integer not null default 0,
  completed_at    timestamptz not null default now()
);

create table if not exists sale_items (
  id                        uuid primary key, -- client-generated UUID
  user_id                   uuid not null references auth.users(id) on delete cascade,
  sale_id                   uuid not null references sales(id) on delete cascade,
  product_id                uuid references products(id) on delete set null,
  product_name_snapshot     text not null,    -- name at time of sale
  unit_price_int_snapshot   integer not null, -- price at time of sale
  quantity                  integer not null,
  line_total_int            integer not null
);

create table if not exists stock_movements (
  id                 uuid primary key,     -- client-generated UUID
  user_id            uuid not null references auth.users(id) on delete cascade,
  product_id         uuid references products(id) on delete set null,
  type               text not null check (type in ('initial', 'restock', 'adjustment')),
  quantity           integer not null,     -- positive for in, negative for adjustment
  purchase_price_int integer,              -- optional, for restock type
  reason             text,                 -- required for adjustment type
  created_at         timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- Each user can only read and write their own rows.
-- Enable RLS on every table, then add a single policy per table.

alter table shop_settings   enable row level security;
alter table products        enable row level security;
alter table sales           enable row level security;
alter table sale_items      enable row level security;
alter table stock_movements enable row level security;

create policy "users own their shop_settings"
  on shop_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users own their products"
  on products for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users own their sales"
  on sales for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users own their sale_items"
  on sale_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users own their stock_movements"
  on stock_movements for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- INDEXES (optional but useful at scale)
-- ============================================================
create index if not exists idx_products_user_id    on products(user_id);
create index if not exists idx_sales_user_id       on sales(user_id);
create index if not exists idx_sales_completed_at  on sales(completed_at);
create index if not exists idx_sale_items_sale_id  on sale_items(sale_id);
create index if not exists idx_stock_movements_product_id on stock_movements(product_id);
