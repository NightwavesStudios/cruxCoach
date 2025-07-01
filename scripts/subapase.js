const SUPABASE_URL = "https://gqvnufoilvfakyopmpkq.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdxdm51Zm9pbHZmYWt5b3BtcGtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzODEyOTYsImV4cCI6MjA2Njk1NzI5Nn0.tM6nIcRRQJfdm38mzdACUHdaL96QBU9DVn5yxikGys4";

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// User authentication functions
async function ensureUser() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    // For now, we'll create a guest user or redirect to login
    // You can implement proper authentication later
    console.warn("No authenticated user found");
    return null;
  }
  return session.user;
}

async function getUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// Utility function for safe loading from localStorage (backwards compatibility)
function loadSafe(key, defaultValue) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Failed to load ${key} from localStorage:`, error);
    return defaultValue;
  }
}

// Updated saveToStorage function that saves to both localStorage and database
async function saveToStorage(dataType, data) {
  // Save to localStorage for immediate access
  try {
    localStorage.setItem(dataType, JSON.stringify(data));
  } catch (error) {
    console.warn(`Failed to save ${dataType} to localStorage:`, error);
  }

  // Save to database
  try {
    await saveToDatabase(dataType, data);
  } catch (error) {
    console.warn(`Failed to save ${dataType} to database:`, error);
  }
}
