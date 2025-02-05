-- Create the stored procedure for creating the messages table
create or replace function create_messages_table()
returns void
language plpgsql
security definer
as $$
begin
  -- Create the table if it doesn't exist
  create table if not exists messages (
    id uuid default gen_random_uuid() primary key,
    role text not null,
    content text not null,
    timestamp timestamptz default now(),
    agent_id text,
    agent_name text,
    collaboration_type jsonb,
    created_at timestamptz default now()
  );

  -- Enable RLS
  alter table messages enable row level security;

  -- Create policies if they don't exist
  if not exists (
    select from pg_policies 
    where tablename = 'messages' 
    and policyname = 'Allow public read access'
  ) then
    create policy "Allow public read access"
      on messages for select
      to authenticated, anon
      using (true);
  end if;

  if not exists (
    select from pg_policies 
    where tablename = 'messages' 
    and policyname = 'Allow public insert access'
  ) then
    create policy "Allow public insert access"
      on messages for insert
      to authenticated, anon
      with check (true);
  end if;
end;
$$;

-- Grant execute permission to anon and authenticated roles
grant execute on function create_messages_table() to anon, authenticated;
