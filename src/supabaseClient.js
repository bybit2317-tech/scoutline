import { createClient } from "@supabase/supabase-js";

// These values connect Scoutline to its permanent database on Supabase.
// The anon/public key is safe to expose in browser code — it only allows
// the actions permitted by the row-level security policies set up on the
// database tables (public read/insert/update, no deletes).
const SUPABASE_URL = "https://kkqrnhapbqgrqpgdpmfc.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrcXJuaGFwYnFncnFwZ2RwbWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwNTYzODksImV4cCI6MjEwMDYzMjM4OX0.7GWA7U0v8TJ749ztXWt1JBGMdZou7-4rVuwcu31OArU";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
