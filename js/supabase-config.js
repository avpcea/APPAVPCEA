// js/supabase-config.js
// import { createClient } from "https://esm.sh/@supabase/supabase-js@2.118.0";

const URL = "https://hptnaoliiychgkxsaksy.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwdG5hb2xpaXljaGdreHNha3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3Mjc0MzAsImV4cCI6MjA5NzMwMzQzMH0.ib30dyYwPY4l8f4vSn2OBf7EkChVzRjwzDR_dGF3524";

export const clienteSupabase = createClient(URL, KEY);
window.supabase = clienteSupabase;
window.supabaseClient = clienteSupabase;

// 🌟 EL NUEVO PUENTE: Forzamos a que la función sea visible globalmente antes de que se declare abajo
window.cargarFichaVoluntario = async function(...args) {
    if (typeof cargarFichaVoluntario === "function") return await cargarFichaVoluntario(...args);
};

export const BASE_FN = `${URL}/functions/v1`;
