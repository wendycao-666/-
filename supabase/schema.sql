-- 在 Supabase 控制台 → SQL Editor 中执行此脚本

create table if not exists decoration_projects (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists decoration_projects_updated_at_idx
  on decoration_projects (updated_at desc);

alter table decoration_projects enable row level security;

-- 允许匿名读写（通过随机 project id 作为链接密钥）
create policy "public read decoration_projects"
  on decoration_projects for select
  using (true);

create policy "public insert decoration_projects"
  on decoration_projects for insert
  with check (true);

create policy "public update decoration_projects"
  on decoration_projects for update
  using (true)
  with check (true);
