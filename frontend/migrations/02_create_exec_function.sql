-- Create a generic SQL execution function
create or replace function exec(sql text)
returns void
language plpgsql
security definer
as $$
begin
  execute sql;
end;
$$;

-- Grant execute permission to anon and authenticated roles
grant execute on function exec(text) to anon, authenticated;
