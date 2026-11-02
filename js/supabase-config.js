// js/supabase-config.js

const URL = "https://hptnaoliiychgkxsaksy.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwdG5hb2xpaXljaGdreHNha3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3Mjc0MzAsImV4cCI6MjA5NzMwMzQzMH0.ib30dyYwPY4l8f4vSn2OBf7EkChVzRjwzDR_dGF3524";

// Extraemos de manera segura el creador desde el objeto global inyectado por el HTML
const creadorSupabase = window.supabase || window.Supabase;

if (!creadorSupabase || typeof creadorSupabase.createClient !== "function") {
    console.error("⚠️ Error crítico: La librería CDN de Supabase no se ha cargado en el HTML.");
}

// Inicializamos el cliente real en una constante exclusiva para tu app
export const db = creadorSupabase.createClient(URL, KEY);

// Aseguramos un puente global alternativo que no colisione con el constructor nativo
window.miClienteSupabase = db;
export const BASE_FN = `${URL}/functions/v1`;
