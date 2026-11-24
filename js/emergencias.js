// =========================================================================
// ARCHIVO: js/emergencias.js (MONITOR REALTIME Y ALARMA DE EMERGENCIA)
// =========================================================================
import { db as supabase } from './supabase-config.js';
import { activarPitidoEmergencia, detenerPitidoEmergencia, showScreen } from './navigation.js';

let emergenciasSilenciadas = new Set();

export function iniciarMonitorEmergencias() {
    // 1. Desbloqueo de audio en móviles tras la primera interacción del usuario
    const desbloquearAudio = () => {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === 'suspended') ctx.resume();
        ctx.close();
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        document.removeEventListener('click', desbloquearAudio);
        document.removeEventListener('touchstart', desbloquearAudio);
    };
    document.addEventListener('click', desbloquearAudio, { once: true });
    document.addEventListener('touchstart', desbloquearAudio, { once: true });

    // 2. Comprobación inicial y al volver de segundo plano en el móvil
    comprobarEmergenciasActivas();
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') comprobarEmergenciasActivas();
    });

    // 3. Escucha en tiempo real (WebSocket) de nuevas emergencias
    supabase
        .channel('canal-emergencias-avpcea')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'emergencias' }, () => {
            comprobarEmergenciasActivas();
        })
        .subscribe();
}

async function comprobarEmergenciasActivas() {
    const { data, error } = await supabase
        .from('emergencias')
        .select('*')
        .eq('activa', true)
        .is('fecha_fin', null)
        .order('fecha_inicio', { ascending: false })
        .limit(1);

    if (error || !data || data.length === 0) {
        detenerPitidoEmergencia();
        document.getElementById('modal-alerta-emergencia')?.remove();
        return;
    }

    const emg = data[0];
    if (emergenciasSilenciadas.has(emg.id)) return;

    dispararAlarmaVisualYSonora(emg);
}

function dispararAlarmaVisualYSonora(emg) {
    activarPitidoEmergencia();
    if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 800]);

    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`🚨 EMERGENCIA AVPCEA (${(emg.nivel || 'ALTA').toUpperCase()})`, {
            body: emg.titulo,
            icon: 'icons/icon-192.png',
            tag: `emg-${emg.id}`
        });
    }

    if (document.getElementById('modal-alerta-emergencia')) return;

    const modal = document.createElement('div');
    modal.id = 'modal-alerta-emergencia';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(153,27,27,0.96); color:#fff; z-index:999999; display:flex; flex-direction:column; justify-content:center; align-items:center; padding:25px; text-align:center; font-family:sans-serif;';
    modal.innerHTML = `
        <div style="font-size:52px; margin-bottom:10px;">🚨</div>
        <span style="background:#fff; color:#dc2626; font-weight:bold; padding:4px 12px; border-radius:20px; font-size:12px; text-transform:uppercase;">NIVEL: ${emg.nivel || 'MEDIO'}</span>
        <h2 style="margin:15px 0 10px 0; font-size:24px;">${emg.titulo}</h2>
        <p style="font-size:14px; opacity:0.9; margin-bottom:25px;">Activación inmediata de Protección Civil El Arenal</p>
        <div style="display:flex; flex-direction:column; gap:12px; width:100%; max-width:300px;">
            <button id="btn-ir-emergencia" style="padding:14px; background:#fff; color:#dc2626; border:none; border-radius:8px; font-weight:bold; font-size:16px; cursor:pointer;">✍️ Ver y Apuntarme</button>
            <button id="btn-silenciar-emergencia" style="padding:12px; background:transparent; color:#fff; border:2px solid #fff; border-radius:8px; font-weight:bold; font-size:14px; cursor:pointer;">🔇 Enterado / Silenciar</button>
        </div>
    `;
    document.body.appendChild(modal);

    const cerrarYCallar = () => {
        emergenciasSilenciadas.add(emg.id);
        detenerPitidoEmergencia();
        if (navigator.vibrate) navigator.vibrate(0);
        modal.remove();
    };

    document.getElementById('btn-silenciar-emergencia').addEventListener('click', cerrarYCallar);
    document.getElementById('btn-ir-emergencia').addEventListener('click', () => {
        cerrarYCallar();
        showScreen('emergencias');
    });
}
