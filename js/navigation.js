// js/navigation.js

// Leemos el cliente directamente de la ventana global, evitando imports conflictivos
const supabase = window.supabaseClient || window.supabase;

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

// Al final de js/navigation.js

export async function cargarListadoAdmin() {
    const cont = document.getElementById("admin-listado");
    if (!cont) return;
    cont.innerHTML = "<p>Cargando listados...</p>";
    try {
        const [operativos, preventivos] = await Promise.all([
            supabase.from("operativos").select("*").order("fecha_inicio", { ascending: false }),
            supabase.from("preventivos").select("*").order("fecha_inicio", { ascending: false })
        ]);
        cont.innerHTML = "<h3>Operativos</h3>";
        operativos.data?.forEach(op => {
            const estaCerrado = op.fecha_fin !== null;
            let hOp = `<div class='card' style='margin-bottom:10px; padding:10px; border:1px solid #ddd; opacity:${estaCerrado ? "0.6" : "1"};'>`;
            hOp += "<strong>"+op.titulo+"</strong> - Lugar: "+(op.lugar || "—")+"<br>";
            hOp += "Fecha de evento: "+(op.fecha || "—")+" | Inicio: "+(op.fecha_inicio ? op.fecha_inicio.substring(0,16).replace("T"," "):"—")+"<br>";
            if(estaCerrado) hOp += "Fecha fin: "+op.fecha_fin.substring(0,16).replace("T"," ")+"<br>";
            hOp += estaCerrado ? "✓ Cerrado " : "<button onclick=\"window.ejecutarCierreEvento('"+op.id+"', 'operativos')\">Cerrar</button> ";
            hOp += "<button onclick=\"window.ejecutarEliminacionElemento('operativos', '"+op.id+"')\">Eliminar</button></div>";
            cont.innerHTML += hOp;
        });
        cont.innerHTML += "<h3>Preventivos</h3>";
        preventivos.data?.forEach(pr => {
            const estaCerrado = pr.fecha_fin !== null;
            let hPr = `<div class='card' style='margin-bottom:10px; padding:10px; border:1px solid #ddd; opacity:${estaCerrado ? "0.6" : "1"};'>`;
            hPr += "<strong>"+pr.titulo+"</strong> - Lugar: "+(pr.lugar || "—")+"<br>";
            hPr += "Fecha de evento: "+(pr.fecha || "—")+" | Inicio: "+(pr.fecha_inicio ? pr.fecha_inicio.substring(0,16).replace("T"," "):"—")+"<br>";
            if(estaCerrado) hPr += "Fecha fin: "+pr.fecha_fin.substring(0,16).replace("T"," ")+"<br>";
            hPr += estaCerrado ? "✓ Cerrado " : "<button onclick=\"window.ejecutarCierreEvento('"+pr.id+"', 'preventivos')\">Cerrar</button> ";
            hPr += "<button onclick=\"window.ejecutarEliminacionElemento('preventivos', '"+pr.id+"')\">Eliminar</button></div>";
            cont.innerHTML += hPr;
        });
    } catch (e) {}
}

export async function cargarUsuariosAdmin() {
    const cont = document.getElementById("admin-usuarios-lista") || document.getElementById("admin-usuarios");
    if (!cont) return;
    try {
        const { data: usuarios } = await supabase.from("usuarios").select("id, nombre, telefono, cumple_mes, cumple_dia, dispositivos(rol)").order("nombre", { ascending: true });
        cont.innerHTML = "";
        usuarios?.forEach(usr => {
            const rolReal = usr.dispositivos?.rol || "normal";
            const cumpleStr = (usr.cumple_dia && usr.cumple_mes) ? (String(usr.cumple_dia).padStart(2,"0")+"/"+String(usr.cumple_mes).padStart(2,"0")) : "—";
            cont.innerHTML += "<div style='padding:6px; border-bottom:1px solid #eee;'><strong>"+usr.nombre+"</strong> ("+rolReal.toUpperCase()+") - Cumpleaños: "+cumpleStr+" <button onclick=\"window.abrirModalEdicionUsuario('"+usr.id+"')\">Editar</button> <button onclick=\"window.ejecutarEliminacionElemento('usuarios', '"+usr.id+"')\">Baja</button></div>";
        });
    } catch (e) {}
}

export async function cargarListadoHorasVoluntarios() {
    const cont = document.getElementById("admin-contabilidad-horas");
    if (!cont) return;
    try {
        const { data: registros } = await supabase.from("horas").select("usuario_id, tipo, horas, anio, usuarios(nombre)").order("anio", { ascending: false });
        cont.innerHTML = "<h4>Desglose de Horas Anuales</h4>";
        registros?.forEach(reg => {
            cont.innerHTML += "<p><strong>"+(reg.usuarios?.nombre || "Voluntario")+"</strong> - "+reg.tipo+": "+parseFloat(reg.horas).toFixed(2)+" hs ("+reg.anio+")</p>";
        });
    } catch (e) {}
}

export function initAdminFormListeners() {
    const formOperativos = document.getElementById('form-operativos');
    if (formOperativos) {
        formOperativos.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(formOperativos);
            const datos = {
                titulo: formData.get('titulo'),
                lugar: formData.get('lugar'),
                descripcion: formData.get('descripcion'),
                fecha: formData.get('fecha'),
                fecha_inicio: new Date(`${formData.get('fecha')}T00:00:00`).toISOString()
            };
            try {
                const { error } = await supabase.from('operativos').insert([datos]);
                if (error) throw error;
                alert('¡Operativo guardado con éxito!');
                formOperativos.reset();
                cargarListadoAdmin();
            } catch (err) { alert('Error: ' + err.message); }
        });
    }

    const formPreventivos = document.getElementById('form-preventivos');
    if (formPreventivos) {
        formPreventivos.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(formPreventivos);
            const datos = {
                titulo: formData.get('titulo'),
                lugar: formData.get('lugar'),
                descripcion: formData.get('descripcion'),
                fecha: formData.get('fecha'),
                fecha_inicio: new Date(`${formData.get('fecha')}T00:00:00`).toISOString()
            };
            try {
                const { error } = await supabase.from('preventivos').insert([datos]);
                if (error) throw error;
                alert('¡Preventivo guardado con éxito!');
                formPreventivos.reset();
                cargarListadoAdmin();
            } catch (err) { alert('Error: ' + err.message); }
        });
    }
}

window.abrirModalEdicionUsuario = async function(id) {
    try {
        const { data: usr } = await supabase.from("usuarios").select("*").eq("id", id).single();
        const nuevoNombre = prompt("Nombre:", usr.nombre); if (!nuevoNombre) return;
        const nuevoTelefono = prompt("Teléfono:", usr.telefono); if (!nuevoTelefono) return;
        const cumpleActual = (usr.cumple_dia && usr.cumple_mes) ? (String(usr.cumple_dia).padStart(2,"0")+"/"+String(usr.cumple_mes).padStart(2,"0")) : "DD/MM";
        const nuevoCumple = prompt("Cumpleaños (DD/MM):", cumpleActual); if (!nuevoCumple) return;
        const datos = { nombre: nuevoNombre.trim(), telefono: nuevoTelefono.trim() };
        if (nuevoCumple.includes("/")) {
            const p = nuevoCumple.split("/"); const d = parseInt(p[0], 10), m = parseInt(p[1], 10);
            if (!isNaN(d) && !isNaN(m)) { datos.cumple_dia = d; datos.cumple_mes = m; }
        }
        await supabase.from("usuarios").update(datos).eq("id", id);
        alert("Actualizado."); await cargarUsuariosAdmin(); await cargarListadoHorasVoluntarios();
    } catch (e) {}
};
