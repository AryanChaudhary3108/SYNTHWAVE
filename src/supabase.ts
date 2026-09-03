import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vintbyyudkwrzuxhgmim.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbnRieXl1ZGt3cnp1eGhnbWltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI5MDAyMDAsImV4cCI6MjA0ODQ3NjIwMH0.F_n2kh7jFkGHssmeAGtr6NJBXKsgSUKCzL1Trln0JFQ";
export const supabase = createClient(supabaseUrl, supabaseKey);