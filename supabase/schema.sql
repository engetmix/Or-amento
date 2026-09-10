-- ============================================================
-- Schema do sistema de Almoxarifado
-- Rode este arquivo inteiro no Supabase: SQL Editor > New query
-- ============================================================

-- ---------- Tabelas de catálogo (criadas livremente pelo almoxarife) ----------

create table categories (
  id bigint generated always as identity primary key,
  name text not null unique,
  created_at timestamptz not null default now()
);

create table functions (
  id bigint generated always as identity primary key,
  name text not null unique,
  created_at timestamptz not null default now()
);

create table units (
  id bigint generated always as identity primary key,
  name text not null unique,
  created_at timestamptz not null default now()
);

-- ---------- Itens ----------

create table items (
  id bigint generated always as identity primary key,
  name text not null,
  category_id bigint references categories(id) on delete set null,
  function_id bigint references functions(id) on delete set null,
  unit_id bigint references units(id) on delete set null,
  quantity numeric not null default 0,
  min_quantity numeric not null default 0,
  location text,
  created_at timestamptz not null default now()
);

create table item_aliases (
  id bigint generated always as identity primary key,
  item_id bigint not null references items(id) on delete cascade,
  alias text not null
);

-- ---------- Requisições (pedidos de saída feitos por visitantes) ----------

create table requests (
  id bigint generated always as identity primary key,
  item_id bigint not null references items(id) on delete cascade,
  requester_name text not null,
  requester_sector text,
  quantity numeric not null,
  note text,
  status text not null default 'pendente' check (status in ('pendente', 'confirmado', 'recusado')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- ---------- Histórico de movimentações (entradas e saídas confirmadas) ----------

create table movements (
  id bigint generated always as identity primary key,
  item_id bigint references items(id) on delete set null,
  type text not null check (type in ('entrada', 'saida')),
  quantity numeric not null,
  requester_name text,
  requester_sector text,
  note text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- anon        = qualquer visitante com o link (sem login)
-- authenticated = almoxarife logado (conta criada no Supabase Auth)
-- ============================================================

alter table categories enable row level security;
alter table functions enable row level security;
alter table units enable row level security;
alter table items enable row level security;
alter table item_aliases enable row level security;
alter table requests enable row level security;
alter table movements enable row level security;

-- Leitura pública dos catálogos e itens (necessário para a busca do visitante)
create policy "public read categories" on categories for select using (true);
create policy "public read functions" on functions for select using (true);
create policy "public read units" on units for select using (true);
create policy "public read items" on items for select using (true);
create policy "public read item_aliases" on item_aliases for select using (true);

-- Visitante pode criar requisições, mas não ler as de outras pessoas nem alterá-las
create policy "public insert requests" on requests for insert with check (status = 'pendente');

-- Almoxarife (authenticated) tem controle total
create policy "admin full categories" on categories for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin full functions" on functions for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin full units" on units for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin full items" on items for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin full item_aliases" on item_aliases for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin full requests" on requests for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin full movements" on movements for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ============================================================
-- Dados iniciais opcionais (pode apagar estas linhas se quiser começar vazio)
-- ============================================================

insert into units (name) values ('un'), ('kg'), ('litro'), ('caixa'), ('metro');
insert into categories (name) values ('Elétrico'), ('Hidráulico'), ('Limpeza'), ('EPI');
insert into functions (name) values ('Manutenção predial'), ('Produção'), ('Escritório');
