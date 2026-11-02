// js/supabase-config.js
// import { createClient } from "https://esm.sh/@supabase/supabase-js@2.118.0";

const URL = "https://hptnaoliiychgkxsaksy.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwdG5hb2xpaXljaGdreHNha3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3Mjc0MzAsImV4cCI6MjA5NzMwMzQzMH0.ib30dyYwPY4l8f4vSn2OBf7EkChVzRjwzDR_dGF3524";

// Inicializamos el cliente real usando el constructor global de la CDN
if (window.Supabase && window.Supabase.createClient) {
    window.supabaseClient = window.Supabase.createClient(URL, KEY);
} else if (window.supabase && window.supabase.createClient) {
    window.supabaseClient = window.supabase.createClient(URL, KEY);
}

console.log("🔌 Cliente central de Supabase enlazado correctamente.");
