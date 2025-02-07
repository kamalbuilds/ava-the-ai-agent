import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const NEXT_PUBLIC_SUPABASE_URL = "https://ddrfwgtbujyjtylthpzq.supabase.co";
const NEXT_PUBLIC_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkcmZ3Z3RidWp5anR5bHRocHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxMjU1MzQsImV4cCI6MjA1MzcwMTUzNH0.41GFuRv9EHrvmjmuJNlfHaq0OaxC0EV9bolCIZ0YCYI";

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if (!body.role || !body.content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const messageData = {
      role: body.role,
      content: body.content,
      timestamp: body.timestamp || new Date().toISOString(),
      agent_id: body.agentId || null,
      agent_name: body.agentName || null,
      collaboration_type: body.collaborationType ? JSON.stringify(body.collaborationType) : null,
    };

    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single();

    if (error) {
      console.error('Error inserting message:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/messages:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const messages = data?.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
      agentId: msg.agent_id,
      agentName: msg.agent_name,
      collaborationType: msg.collaboration_type ? JSON.parse(msg.collaboration_type) : null
    })) || [];

    return NextResponse.json(messages);
  } catch (error: any) {
    console.error('Error in GET /api/messages:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
