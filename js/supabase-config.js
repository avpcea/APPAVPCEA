// js/supabase-config.js
// import { createClient } from "https://esm.sh/@supabase/supabase-js@2.118.0";

const URL = "https://hptnaoliiychgkxsaksy.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwdG5hb2xpaXljaGdreHNha3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3Mjc0MzAsImV4cCI6MjA5NzMwMzQzMH0.ib30dyYwPY4l8f4vSn2OBf7EkChVzRjwzDR_dGF3524";

if (window.supabase && !window.supabaseClient) {
    window.supabaseClient = window.supabase.createClient(URL, KEY);
}
