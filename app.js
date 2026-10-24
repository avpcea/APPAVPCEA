import { createClient } from "https://esm.unpkg.com/@supabase/supabase-js@2.118.0";


const URL = "https://supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwdG5hb2xpaXljaGdreHNha3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3Mjc0MzAsImV4cCI6MjA5NzMwMzQzMH0.ib30dyYwPY4l8f4vSn2OBf7EkChVzRjwzDR_dGF3524";

// CAMBIAMOS EL NOMBRE AQUÍ PARA EVITAR EL CHOQUE:
const supabaseClient = createClient ? createClient(URL, KEY) : null;
const BASE_FN = `${URL}/functions/v1`;



let ac=null,os=null;const cg={operativos:false,preventivos:false,emergencias:false};
async function cargarOperativos(){
  if(cg.operativos)return;cg.operativos=true;const c=document.getElementById("lista-operativos");
  if(!c){cg.operativos=false;return;}c.innerHTML="<p>Cargando...</p>";
  const{data:ops}=await supabase.from("operativos").select("*").is("fecha_fin",null).order("fecha_inicio",{ascending:false});
  c.innerHTML="";
  if(!ops||ops.length===0){c.innerHTML="<p>No hay operativos activos.</p>";}else{
    for(const o of ops){
      const s=await estaSuscrito("operativos",o.id);
      const f=o.fecha_inicio?o.fecha_inicio.substring(0,16).replace('T',' '):"—";
      const textoBoton=s?"Cancelar":"Suscribirme";
      
      let htmlCard = "<div class='card'>";
      htmlCard += "<h3><a href='#/evento/operativos/" + o.id + "'>" + o.titulo + " ↗</a></h3>";
      htmlCard += "<p>Lugar: " + (o.lugar||"—") + "</p>";
      htmlCard += "<p>Fecha inicio: " + f + "</p>";
      htmlCard += "<button onclick=\"window.toggleSuscripcion('operativos','" + o.id + "')\">" + textoBoton + "</button>";
      htmlCard += "</div>";
      
      c.innerHTML += htmlCard;
    }
  }cg.operativos=false;
}
async function cargarPreventivos(){
  if(cg.preventivos)return;cg.preventivos=true;const c=document.getElementById("lista-preventivos");
  if(!c){cg.preventivos=false;return;}c.innerHTML="<p>Cargando...</p>";
  const{data:prs}=await supabase.from("preventivos").select("*").is("fecha_fin",null).order("fecha_inicio",{ascending:false});
  c.innerHTML="";
  if(!prs||prs.length===0){c.innerHTML="<p>No hay preventivos activos.</p>";}else{
    for(const p of prs){
      const s=await estaSuscrito("preventivos",p.id);
      const f=p.fecha_inicio?p.fecha_inicio.substring(0,16).replace('T',' '):"—";
      const textoBoton=s?"Cancelar":"Suscribirme";
      
      let htmlCard = "<div class='card'>";
      htmlCard += "<h3><a href='#/evento/preventivos/" + p.id + "'>" + p.titulo + " ↗</a></h3>";
      htmlCard += "<p>Lugar: " + (p.lugar||"—") + "</p>";
      htmlCard += "<p>Fecha inicio: " + f + "</p>";
      htmlCard += "<button onclick=\"window.toggleSuscripcion('preventivos','" + p.id + "')\">" + textoBoton + "</button>";
      htmlCard += "</div>";
      
      c.innerHTML += htmlCard;
    }
  }cg.preventivos=false;
}
function activarPitidoEmergencia(){
  if(os)return;try{ac=new(window.AudioContext||window.webkitAudioContext)();os=ac.createOscillator();const g=ac.createGain();os.type='sine';os.frequency.setValueAtTime(880,ac.currentTime);g.gain.setValueAtTime(0.4,ac.currentTime);os.connect(g);g.connect(ac.destination);os.start();}catch(e){}
}
function detenerPitidoEmergencia(){
  if(os){try{os.stop();os.disconnect();if(ac&&ac.state!=='closed')ac.close();}catch(e){}os=null;ac=null;}
}
async function cargarEmergencias(){
  if(cg.emergencias)return;cg.emergencias=true;const c=document.getElementById("lista-emergencias");if(!c){cg.emergencias=false;return;}
  const{data:ems}=await supabase.from("emergencias").select("*").eq("activa",true);
  if(!ems||ems.length===0){c.innerHTML="<p>Sin emergencias.</p>";detenerPitidoEmergencia();cg.emergencias=false;return;}
  c.innerHTML="";activarPitidoEmergencia();
  
  ems.forEach(e=>{
    let htmlEmg = "<div class='card' style='border:2px solid red;background:#fff5f5;padding:10px;'>";
    htmlEmg += "<h3>🚨 EMERGENCIA</h3>";
    htmlEmg += "<p>Lugar: " + (e.lugar||"—") + "</p>";
    htmlEmg += "<p>" + (e.descripcion||"—") + "</p>";
    htmlEmg += "<button onclick=\"window.responderAAlerta('" + e.id + "','aceptar')\">Aceptar</button>";
    htmlEmg += "<button onclick=\"window.responderAAlerta('" + e.id + "','declinar')\">Declinar</button>";
    htmlEmg += "</div>";
    
    c.innerHTML += htmlEmg;
  });
  cg.emergencias=false;
}
async function estaSuscrito(t,id){
  const u=localStorage.getItem("usuario_id"),tc=t==="operativos"?"OPR":"NRP";
  const{data:d}=await supabase.from("suscripciones").select("*").eq("usuario_id",u).eq("tipo",tc).eq("evento_id",String(id)).maybeSingle();return!!d;
}
window.toggleSuscripcion=async function(t,id){
  const u=localStorage.getItem("usuario_id"),sc=await estaSuscrito(t,id),tc=t==="operativos"?"OPR":"NRP";
  if(!sc){
    await fetch(`${BASE_FN}/admin-create-suscripcion-ts`,{method:"POST",headers:{"Content-Type":"application/json","apiKey":supabase.supabaseKey,"Authorization":`Bearer ${(await supabase.auth.getSession()).data.session?.access_token||''}`},body:JSON.stringify({usuario_id:u,evento_id:Number(id),tipo:t,admin_id:u})});
    alert("Suscrito.");
  }else{await supabase.from("suscripciones").delete().eq("usuario_id",u).eq("tipo",tc).eq("evento_id",String(id));alert("Cancelado.");}
  if(t==="preventivos")cargarPreventivos();if(t==="operativos")cargarOperativos();await cargarFichaVoluntario();
};
async function cargarFichaVoluntario(){
  const c=document.getElementById("screen-ficha-voluntario")||document.getElementById("screen-inicio");if(!c)return;const u=localStorage.getItem("usuario_id");
  const{data:usr}=await supabase.from("usuarios").select("nombre,telefono,cumple_mes,cumple_dia,horas").eq("id",u).maybeSingle();
  if(!usr){c.innerHTML="<p>Terminal No Enlazado.</p>";return;}
  const{data:subs}=await supabase.from("suscripciones").select("evento_id,tipo").eq("usuario_id",u);
  const cp=(usr.cumple_dia&&usr.cumple_mes)?(String(usr.cumple_dia).padStart(2,'0')+"/"+String(usr.cumple_mes).padStart(2,'0')):"—";
  let sh="<ul>";subs?.forEach(s=>{sh+="<li>["+s.tipo+"] <a href='#/evento/"+s.tipo+"/"+s.evento_id+"'>Ver Evento ↗</a></li>";});sh+="</ul>";
  
  let hFicha = "<div style='max-width:400px;margin:10px auto;padding:15px;border:1px solid #eee;font-family:sans-serif;'>";
  hFicha += "<h2>" + usr.nombre + "</h2>";
  hFicha += "<p>📞 Teléfono: " + (usr.telefono||"—") + "</p>";
  hFicha += "<p>🎂 Cumpleaños: " + cp + "</p>";
  hFicha += "<p>⏳ Saldo: " + parseFloat(usr.horas||0).toFixed(2) + " hs</p>";
  hFicha += "<h4>Suscripciones:</h4>" + (subs?.length?sh:"<p>Ninguna</p>");
  hFicha += "</div>";
  c.innerHTML = hFicha;
}
function showScreen(n){
  if(n==="inicio"||n==="ficha")cargarFichaVoluntario();if(n==="preventivos")cargarPreventivos();if(n==="operativos")cargarOperativos();if(n==="emergencias")cargarEmergencias();
  document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));document.querySelectorAll("#app-screens .screen").forEach(s=>s.style.display="none");
  const s=document.getElementById(n==="admin"?"screen-administracion":(n==="inicio"?"screen-ficha-voluntario"?"screen-ficha-voluntario":"screen-inicio":"screen-"+n));if(s)s.style.display="block";
}
async function cargarListadoAdmin() {
  const cont = document.getElementById("admin-listado");if (!cont) return;cont.innerHTML = "<p>Cargando listados...</p>";
  try {
    const [operativos, preventivos] = await Promise.all([
      supabase.from("operativos").select("*").order("fecha_inicio", { ascending: false }),
      supabase.from("preventivos").select("*").order("fecha_inicio", { ascending: false })
    ]);
    cont.innerHTML = "<h3>Operativos</h3>";
    operativos.data?.forEach(op => {
      const estaCerrado = op.fecha_fin !== null;
      let hOp = "<div class='card' style='margin-bottom:10px; padding:10px; border:1px solid #ddd; opacity:"+(estaCerrado ? "0.6":"1")+";'>";
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
      let hPr = "<div class='card' style='margin-bottom:10px; padding:10px; border:1px solid #ddd; opacity:"+(estaCerrado ? "0.6":"1")+";'>";
      hPr += "<strong>"+pr.titulo+"</strong> - Lugar: "+(pr.lugar || "—")+"<br>";
      hPr += "Fecha de evento: "+(pr.fecha || "—")+" | Inicio: "+(pr.fecha_inicio ? pr.fecha_inicio.substring(0,16).replace("T"," "):"—")+"<br>";
      if(estaCerrado) hPr += "Fecha fin: "+pr.fecha_fin.substring(0,16).replace("T"," ")+"<br>";
      hPr += estaCerrado ? "✓ Cerrado " : "<button onclick=\"window.ejecutarCierreEvento('"+pr.id+"', 'preventivos')\">Cerrar</button> ";
      hPr += "<button onclick=\"window.ejecutarEliminacionElemento('preventivos', '"+pr.id+"')\">Eliminar</button></div>";
      cont.innerHTML += hPr;
    });
  } catch (e) {}
}
async function cargarUsuariosAdmin() {
  const cont = document.getElementById("admin-usuarios-lista") || document.getElementById("admin-usuarios");if (!cont) return;
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
async function cargarListadoHorasVoluntarios() {
  const cont = document.getElementById("admin-contabilidad-horas");if (!cont) return;
  try {
    const { data: registros } = await supabase.from("horas").select("usuario_id, tipo, horas, anio, usuarios(nombre)").order("anio", { ascending: false });
    cont.innerHTML = "<h4>Desglose de Horas Anuales</h4>";
    registros?.forEach(reg => {
      cont.innerHTML += "<p><strong>"+(reg.usuarios?.nombre || "Voluntario")+"</strong> - "+reg.tipo+": "+parseFloat(reg.horas).toFixed(2)+" hs ("+reg.anio+")</p>";
    });
  } catch (e) {}
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
      const p = nuevoCumple.split("/");const d = parseInt(p[0], 10), m = parseInt(p[1], 10);
      if (!isNaN(d) && !isNaN(m)) { datos.cumple_dia = d; datos.cumple_mes = m; }
    }
    await supabase.from("usuarios").update(datos).eq("id", id);
    alert("Actualizado."); await cargarUsuariosAdmin(); await cargarListadoHorasVoluntarios();
  } catch (e) {}
};
async function inicializarAplicacionVoluntario(){
  const ac=document.getElementById("app-container");if(ac)ac.style.display="block";
  localStorage.setItem("avpcea_token","v3");
  
  // INYECTA TU ID DE VOLUNTARIO DE LA BASE DE DATOS AQUÍ PARA PASAR LA PÁGINA
  localStorage.setItem("usuario_id","2fa1fce4-aad0-439a-a391-3cd3079556c6");

  const u=localStorage.getItem("usuario_id");
  if(u&&u.trim()!==""){const ws=document.getElementById("welcome-screen"),wh=document.getElementById("welcome-header");if(ws)ws.style.display="none";if(wh)wh.style.display="none";showScreen("inicio");}
  else{document.body.innerHTML='<div style="padding:40px;text-align:center;font-family:sans-serif;"><h2>Terminal No Enlazado</h2><p>Falta usuario_id.</p></div>';}
}

// Reemplaza tu if/else final de readyState por este arrancador directo:
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(inicializarAplicacionVoluntario, 50);
    });
} else {
    setTimeout(inicializarAplicacionVoluntario, 50);
}
