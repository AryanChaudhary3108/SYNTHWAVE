import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ozeppmmugeijbejphiub.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96ZXBwbW11Z2VpamJlanBoaXViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0MzEwNTgsImV4cCI6MjEwNDAwNzA1OH0._UKGzqI132r1ks_FnDVsOQg9_t9f83kn0hI6zxtxExg";
export const supabase = createClient(supabaseUrl, supabaseKey);