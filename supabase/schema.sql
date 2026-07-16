-- Enable RLS
create extension if not exists "uuid-ossp";

-- Pantry
create table if not exists pantry_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  quantity text default '1',
  unit text default 'pcs',
  category text default 'Other',
  created_at timestamptz default now()
);
alter table pantry_items enable row level security;
create policy "Users manage own pantry" on pantry_items for all using (auth.uid() = user_id);

-- Calorie logs
create table if not exists calorie_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  meal_name text not null,
  calories int default 0,
  protein int default 0,
  carbs int default 0,
  fat int default 0,
  type text default 'Breakfast',
  logged_at timestamptz default now()
);
alter table calorie_logs enable row level security;
create policy "Users manage own calorie logs" on calorie_logs for all using (auth.uid() = user_id);

-- Spending logs
create table if not exists spending_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  description text not null,
  amount decimal(10,2) not null,
  type text check (type in ('grocery', 'eating_out')) default 'grocery',
  date date default current_date,
  created_at timestamptz default now()
);
alter table spending_logs enable row level security;
create policy "Users manage own spending" on spending_logs for all using (auth.uid() = user_id);

-- Shopping list
create table if not exists shopping_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  checked boolean default false,
  source text,
  created_at timestamptz default now()
);
alter table shopping_items enable row level security;
create policy "Users manage own shopping" on shopping_items for all using (auth.uid() = user_id);
