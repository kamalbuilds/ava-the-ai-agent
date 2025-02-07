-- Create helper function to create tables
create or replace function create_table(table_sql text)
returns void
language plpgsql
security definer
as $$
begin
  execute table_sql;
end;
$$;

-- Create helper function to enable RLS
create or replace function enable_rls(table_name text)
returns void
language plpgsql
security definer
as $$
begin
  execute format('alter table %I enable row level security', table_name);
end;
$$;

-- Create helper function to create policies
create or replace function create_policies(table_name text)
returns void
language plpgsql
security definer
as $$
begin
  execute format('
    create policy "Allow public read access" on %I
      for select to authenticated, anon using (true);
    
    create policy "Allow public insert access" on %I
      for insert to authenticated, anon with check (true);
  ', table_name, table_name);
end;
$$;

-- Grant execute permissions to anon and authenticated roles
grant execute on function create_table(text) to anon, authenticated;
grant execute on function enable_rls(text) to anon, authenticated;
grant execute on function create_policies(text) to anon, authenticated;
