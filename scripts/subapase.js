const SUPABASE_URL = "https://gqvnufoilvfakyopmpkq.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdxdm51Zm9pbHZmYWt5b3BtcGtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzODEyOTYsImV4cCI6MjA2Njk1NzI5Nn0.tM6nIcRRQJfdm38mzdACUHdaL96QBU9DVn5yxikGys4";

const supabase = supabaseClient.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function getUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

async function signInAnonymously() {
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) console.error("Error signing in:", error);
  return data;
}

async function ensureUser() {
  const user = await getUser();
  if (!user) {
    await signInAnonymously();
  }
  return await getUser();
}
