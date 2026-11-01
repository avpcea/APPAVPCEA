// js/navigation.js
import { supabase } from './supabase-config.js';

// Estados locales de la alerta de audio
let ac = null, os = null;

export function activarPitidoEmergencia() {
    if (os) return;
    try {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        os = ac.createOscillator();
        const g = ac.createGain();
        os.type = 'sine';
        os.frequency.setValueAtTime(880, ac.currentTime);
        g.gain.setValueAtTime(0.4, ac.currentTime);
        os.connect(g);
        g.connect(ac.destination);
        os.start();
    } catch (e) {}
}

export function detenerPitidoEmergencia() {
    if (os) {
        try {
            os.stop();
            os.disconnect();
            if (ac && ac.state !== 'closed') ac.close();
        } catch (e) {}
        os = null;
        ac = null;
    }
}

export function showScreen(screenId) {
    const screens = document.querySelectorAll('.app-screen'); 
    screens.forEach(screen => {
        screen.style.display = 'none'; 
        screen.classList.remove('screen-active');
    });

    const currentScreen = document.getElementById(screenId);
    if (currentScreen) {
        currentScreen.style.display = 'block'; 
        currentScreen.classList.add('screen-active');
    } else {
        console.warn(`La pantalla con ID "${screenId}" no existe en el DOM.`);
    }
}

// Configuración de eventos de la barra de navegación inferior
export function initNavigation(callbacks = {}) {
    const navButtons = document.querySelectorAll('.bottom-nav .nav-btn');

    navButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault(); 
            const targetScreen = button.getAttribute('data-screen');
        
            if (targetScreen) {
                showScreen(targetScreen);
                navButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Ejecutar cargas dinámicas asociadas a la pestaña
                if (callbacks[targetScreen]) callbacks[targetScreen]();
            }
        });
    });
}

