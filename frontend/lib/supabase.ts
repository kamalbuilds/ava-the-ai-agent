// @ts-nocheck
import { createClient } from '@supabase/supabase-js';

const NEXT_PUBLIC_SUPABASE_URL = "https://rqapktveggvmakjgenau.supabase.co";  // Note the semicolon instead of comma
const NEXT_PUBLIC_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxYXBrdHZlZ2d2bWFramdlbmF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg3NDkxNjMsImV4cCI6MjA1NDMyNTE2M30.tfHQmh9WThurrtKFAsWy0o02Z45aGQzovowWBwrV8DE";  // Note the semicolon instead of comma

export const supabase = createClient(
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_KEY,
  {
    auth: {
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  }
);
