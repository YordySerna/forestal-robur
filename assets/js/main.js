/* ============================================================================
   FORESTAL ROBUR SpA — main.js
   ----------------------------------------------------------------------------
   Todo el movimiento del expediente vive aquí, en JS clásico (IIFE, sin
   dependencias). Sistemas, en orden:

     1. Política de animación: reduced-motion o pestaña oculta al cargar
        → html.sin-anim y el documento llega entero, pintado.
     2. PRNG con semilla fija (mulberry32): las figuras generativas son
        SIEMPRE el mismo dibujo — el expediente no cambia entre visitas.
     3. EL BOSQUE: partículas de fondo (polen a la deriva, agujas de pino
        que caen, motas de luz que respiran) en un canvas fijo.
     4. FIG. 02 — perfil de ladera: cerros, torre, cable en catenaria que
        se tensa al entrar, y carro que viaja con su fuste.
     5. Veta de madera generativa en el frame sin foto del parque.
     6. Franja de estiba (testas de trozas) como divisor.
     7. Lluvia fina del folio de pendiente.
     8. Entintado y revelado: UN IntersectionObserver para los folios y la
        plancha fotográfica; entra una sola vez.
     9. Odómetro de romana (cifras que ruedan).
    10. Una sola rueda requestAnimationFrame para los bucles CONTINUOS
        (bosque, carro, lluvia): cada uno se registra y se pausa solo
        fuera de viewport o con la pestaña oculta. El resorte del cable
        usa su propio rAF corto y autoterminante (~1 s); la animación CSS
        de la marquesina se pausa por clase con un observer.
    11. Datos de la empresa (datos.js): membrete, canales, bitácora,
        JSON-LD y reporte en consola de lo que falta.
    12. La guía de despacho → WhatsApp/correo ya redactado.
   ============================================================================ */
(function(){
"use strict";

/* Señal de vida para el vigía del <head>: si esto no corre en 2,5 s,
   aquel fuerza .sin-anim y la página se pinta entera igual. */
window.__mainVivo = true;

var doc = document, raiz = doc.documentElement;

/* La paleta forestal, en un solo lugar. Si cambia el CSS, cambia acá:
   los dibujos generativos no pueden leer variables CSS sin pagar un
   getComputedStyle por color. */
var C = {
  bosque:  "#0C1611",
  bosque2: "#101C16",
  musgo:   "#24382B",
  helecho: "#8FBF9A",
  niebla:  "#E7EFE6",
  niebla2: "#A8B8AC",
  hoja:    "#EDF0E6",
  tinta:   "#14211A",
  savia:   "#E0A94A",
  faena:   "#E1701A"
};

/* ── 1. POLÍTICA DE ANIMACIÓN ─────────────────────────────────────────── */
var reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
/* Si la pestaña carga en segundo plano, el hero no anima: al volver, el
   documento ya está pintado (mismo patrón que los otros sitios del autor). */
var sinAnim = reducido || doc.hidden;
if (sinAnim) raiz.classList.add("sin-anim");

/* ── 2. PRNG CON SEMILLA FIJA ─────────────────────────────────────────── */
function mulberry32(semilla){
  return function(){
    semilla |= 0; semilla = (semilla + 0x6D2B79F5) | 0;
    var t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
var SVGNS = "http://www.w3.org/2000/svg";
function el(nombre, atributos, padre){
  var nodo = doc.createElementNS(SVGNS, nombre);
  for (var k in atributos) nodo.setAttribute(k, atributos[k]);
  if (padre) padre.appendChild(nodo);
  return nodo;
}

/* ── 10 (adelantado). GESTOR ÚNICO DE rAF ─────────────────────────────────
   Una sola rueda para todo: el bosque, el carro del cable y la lluvia se
   registran como tareas con un elemento de referencia; un
   IntersectionObserver las enciende/apaga según viewport, y
   visibilitychange apaga todo. */
var tareas = [];
var ruedaViva = false;
function rueda(t){
  ruedaViva = false;
  for (var i = 0; i < tareas.length; i++){
    if (tareas[i].visible){ tareas[i].fn(t); ruedaViva = true; }
  }
  if (ruedaViva && !doc.hidden) requestAnimationFrame(rueda);
}
function despertarRueda(){
  if (!ruedaViva && !doc.hidden && tareas.some(function(t){ return t.visible; })){
    ruedaViva = true;
    requestAnimationFrame(rueda);
  }
}
var obsTareas = new IntersectionObserver(function(entradas){
  entradas.forEach(function(e){
    tareas.forEach(function(t){ if (t.el === e.target) t.visible = e.isIntersecting; });
  });
  despertarRueda();
}, { rootMargin: "60px" });
function registrarTarea(elemento, fn){
  tareas.push({ el: elemento, fn: fn, visible: false });
  obsTareas.observe(elemento);
}
/* Tarea SIEMPRE visible, sin observer: para lo que es `position: fixed` y
   por definición no puede salir de la pantalla. Antes esto se registraba
   contra <html> con el IntersectionObserver de arriba, pero eso deja el
   fondo entero del sitio colgando de que el observer reporte al elemento
   raíz como intersectando el viewport. La pausa por pestaña oculta la da
   igual el gestor, que es la única que hace falta acá. */
function registrarTareaFija(fn){
  tareas.push({ el: null, fn: fn, visible: true });
  despertarRueda();
}
doc.addEventListener("visibilitychange", despertarRueda);

/* ── 3. EL BOSQUE — partículas de fondo ───────────────────────────────────
   Tres capas, todas a mano, todas en el MISMO canvas fijo:

     · POLEN    — motas que flotan a la deriva. Se mueven por un campo de
                  flujo senoidal (dos ondas cruzadas): no hay dos que
                  sigan la misma línea, y ninguna necesita memoria.
     · AGUJAS   — agujas de pino cayendo despacio, con giro propio. Son
                  segmentos, no imágenes: 2 líneas por aguja.
     · LUCES    — cuatro motas ámbar que respiran, como bichos de luz.

   Las posiciones se guardan NORMALIZADAS (0–1) y se multiplican por el
   tamaño al dibujar: así el resize no cuesta nada y no hay que recalcular
   ni reposicionar nada. Las velocidades también son normalizadas, así una
   mota tarda lo mismo en cruzar un teléfono que un monitor.

   Con reduced-motion NO se apaga: se dibuja una sola vez, quieto. Un
   fondo vacío se ve roto, no accesible. */
function bosque(){
  var cv = doc.querySelector("[data-bosque]");
  if (!cv) return;
  var ctx = cv.getContext("2d");
  /* dpr con tope 1,5: son motas difusas de 1–2px, el detalle extra no se
     ve y limpiar un respaldo a 2× en pantalla completa sí se siente. */
  var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  var W = 0, H = 0;

  /* Se mide el TAMAÑO REAL DEL ELEMENTO, no window.innerWidth: la ventana
     incluye el ancho de la barra de scroll y el canvas no, así que con
     innerWidth el respaldo queda estirado y las motas salen ovaladas. */
  function medir(){
    var w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return false;          /* pestaña sin viewport todavía */
    if (w === W && h === H) return false;
    W = w; H = h;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return true;
  }
  medir();

  var rnd = mulberry32(88061945);

  /* Densidad según el área real: un teléfono no necesita 80 motas, y un
     monitor de 27" con 30 se ve vacío. */
  var nPolen = Math.max(26, Math.min(84, Math.round(W * H / 22000)));
  var polen = [];
  for (var i = 0; i < nPolen; i++){
    polen.push({
      x: rnd(), y: rnd(),
      r: 0.5 + rnd() * 1.7,
      /* deriva propia, en fracción de pantalla por segundo */
      vx: (rnd() - 0.5) * 0.010,
      vy: -0.004 - rnd() * 0.012,      /* el polen sube: es aire tibio */
      fase: rnd() * 6.283,
      banda: Math.floor(rnd() * 3)      /* 3 bandas de opacidad, 3 paths */
    });
  }

  var nAgujas = W < 700 ? 7 : 13;
  var agujas = [];
  for (var j = 0; j < nAgujas; j++){
    agujas.push({
      x: rnd(), y: rnd(),
      largo: 7 + rnd() * 12,
      ang: rnd() * 3.14,
      giro: (rnd() - 0.5) * 0.5,        /* radianes por segundo */
      vy: 0.012 + rnd() * 0.022,        /* las agujas caen */
      vx: (rnd() - 0.5) * 0.008,
      abre: 0.25 + rnd() * 0.3          /* la V de la aguja doble */
    });
  }

  var luces = [];
  for (var k = 0; k < 4; k++){
    luces.push({
      x: 0.12 + rnd() * 0.76, y: 0.12 + rnd() * 0.76,
      r: 1.1 + rnd() * 0.9,
      vx: (rnd() - 0.5) * 0.006, vy: (rnd() - 0.5) * 0.006,
      fase: rnd() * 6.283,
      pulso: 0.5 + rnd() * 0.7          /* ciclos por segundo */
    });
  }

  /* Wrap toroidal con margen: la partícula que sale por un borde vuelve
     a entrar por el opuesto, un poco afuera, para que nunca se vea
     aparecer de la nada en pantalla. */
  function envolver(p){
    if (p.x < -0.04) p.x = 1.04; else if (p.x > 1.04) p.x = -0.04;
    if (p.y < -0.04) p.y = 1.04; else if (p.y > 1.04) p.y = -0.04;
  }

  var OPACIDADES = ["rgba(143,191,154,0.13)", "rgba(199,219,203,0.22)", "rgba(231,239,230,0.36)"];

  function dibujar(t){
    ctx.clearRect(0, 0, W, H);

    /* POLEN — un path por banda de opacidad: 3 cambios de estado en vez
       de uno por mota. */
    for (var b = 0; b < 3; b++){
      ctx.fillStyle = OPACIDADES[b];
      ctx.beginPath();
      for (var i = 0; i < polen.length; i++){
        var p = polen[i];
        if (p.banda !== b) continue;
        var x = p.x * W, y = p.y * H;
        ctx.moveTo(x + p.r, y);
        ctx.arc(x, y, p.r, 0, 6.28318);
      }
      ctx.fill();
    }

    /* AGUJAS — dos segmentos en V por aguja, un solo path para todas */
    ctx.strokeStyle = "rgba(143,191,154,0.20)";
    ctx.lineWidth = 1;
    ctx.lineCap = "round";
    ctx.beginPath();
    for (var j = 0; j < agujas.length; j++){
      var a = agujas[j];
      var ax = a.x * W, ay = a.y * H;
      var c1 = Math.cos(a.ang - a.abre), s1 = Math.sin(a.ang - a.abre);
      var c2 = Math.cos(a.ang + a.abre), s2 = Math.sin(a.ang + a.abre);
      ctx.moveTo(ax, ay); ctx.lineTo(ax + c1 * a.largo, ay + s1 * a.largo);
      ctx.moveTo(ax, ay); ctx.lineTo(ax + c2 * a.largo, ay + s2 * a.largo);
    }
    ctx.stroke();

    /* LUCES — pocas y ámbar: son el único calor del bosque */
    for (var k = 0; k < luces.length; k++){
      var l = luces[k];
      var respira = 0.5 + 0.5 * Math.sin(t * 0.001 * l.pulso + l.fase);
      ctx.fillStyle = "rgba(224,169,74," + (0.10 + respira * 0.30).toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(l.x * W, l.y * H, l.r * (0.8 + respira * 0.5), 0, 6.28318);
      ctx.fill();
    }
  }

  /* ResizeObserver sobre el propio canvas, no un listener de window: así
     también cubre el caso de la pestaña que carga SIN viewport (segundo
     plano, ventana minimizada) y recién después recibe su tamaño.
     Nada se recalcula al remedir — las posiciones son normalizadas —,
     pero cambiar cv.width LIMPIA el canvas: en modo quieto hay que volver
     a dibujar o el fondo queda vacío para siempre. Es exactamente lo que
     pasa al girar el teléfono. */
  new ResizeObserver(function(){
    if (medir() && reducido) dibujar(0);
  }).observe(cv);

  /* Acá se mira SOLO prefers-reduced-motion, no `sinAnim`: que la pestaña
     haya cargado en segundo plano es motivo para no animar el hero de
     entrada, pero no para dejar el bosque muerto cuando el visitante
     por fin la mire. La rueda global ya está pausada mientras la pestaña
     esté oculta, así que registrarse no cuesta nada. */
  if (reducido){ dibujar(0); return; }   /* quieto, pero nunca vacío */

  var previo = null, acumulado = 0;
  /* 30 fps, no 60: este canvas cubre la pantalla completa y se recompone
     sobre TODO el contenido en cada repintado. Las motas se mueven a 0,01
     de pantalla por segundo — a 30 fps nadie nota la diferencia, y el
     trabajo de composición se corta a la mitad en las gráficas integradas
     que son la mayoría de las máquinas donde se va a ver esto. */
  var PASO = 1 / 30;

  registrarTareaFija(function(t){
    if (previo === null) previo = t;
    var dt = Math.min((t - previo) / 1000, 0.05); previo = t;
    acumulado += dt;
    if (acumulado < PASO) return;
    dt = acumulado; acumulado = 0;
    var seg = t * 0.001;

    for (var i = 0; i < polen.length; i++){
      var p = polen[i];
      /* Campo de flujo: dos senos cruzados, uno por eje. Barato y da la
         sensación de aire que cambia de dirección sin turbulencia real. */
      p.x += (p.vx + Math.sin(p.y * 5.5 + seg * 0.25 + p.fase) * 0.006) * dt;
      p.y += (p.vy + Math.cos(p.x * 4.2 + seg * 0.20) * 0.004) * dt;
      envolver(p);
    }
    for (var j = 0; j < agujas.length; j++){
      var a = agujas[j];
      a.x += (a.vx + Math.sin(a.y * 3.1 + seg * 0.4) * 0.005) * dt;
      a.y += a.vy * dt;
      a.ang += a.giro * dt;
      envolver(a);
    }
    for (var k = 0; k < luces.length; k++){
      var l = luces[k];
      l.x += l.vx * dt; l.y += l.vy * dt;
      envolver(l);
    }
    dibujar(t);
  });
}

/* ── 4. FIG. 02 — PERFIL DE LADERA ────────────────────────────────────────
   (Se construye en tiempo ocioso: está varios viewports bajo el pliegue.) */
function figPerfil(){
  var lienzo = doc.querySelector('[data-fig="perfil"]');
  if (!lienzo) return;
  var rnd = mulberry32(19900612);
  var W = 1200, H = 430;
  var svg = el("svg", { viewBox: "0 0 " + W + " " + H, "aria-hidden": "true",
                        preserveAspectRatio: "xMidYMid meet" }, lienzo);

  /* Ruido 1D suavizado por interpolación coseno entre nodos */
  function ruido1D(nodos, amplitud, semillaLocal){
    var r = mulberry32(semillaLocal), vals = [];
    for (var i = 0; i <= nodos; i++) vals.push(r() * amplitud);
    return function(t){
      var x = t * nodos, i0 = Math.floor(x), f = x - i0;
      var u = (1 - Math.cos(f * Math.PI)) / 2;
      return vals[Math.min(i0, nodos)] * (1 - u) + vals[Math.min(i0 + 1, nodos)] * u;
    };
  }

  /* Capas traseras: neblina. La única excepción de gradiente del sitio:
     un velo vertical que hunde los cerros lejanos en la niebla. */
  var defs = el("defs", {}, svg);
  var grad = el("linearGradient", { id: "niebla", x1: "0", y1: "0", x2: "0", y2: "1" }, defs);
  el("stop", { offset: "0", "stop-color": C.helecho, "stop-opacity": "0.14" }, grad);
  el("stop", { offset: "1", "stop-color": C.helecho, "stop-opacity": "0.02" }, grad);

  function cerro(baseY, amp, semilla, relleno, trazo, opacidadTrazo){
    var n = ruido1D(9, amp, semilla), pts = "M0," + H + " ";
    for (var x = 0; x <= W; x += 12){
      pts += "L" + x + "," + (baseY - n(x / W)).toFixed(1) + " ";
    }
    pts += "L" + W + "," + H + " Z";
    return el("path", { d: pts, fill: relleno, stroke: trazo || "none",
                        "stroke-width": 1, "stroke-opacity": opacidadTrazo || 1 }, svg);
  }
  cerro(300, 150, 41, "url(#niebla)");
  cerro(330, 120, 87, "rgba(143,191,154,0.09)");

  /* Cerro frontal: la ladera de la faena. Alto a la izquierda (cancha),
     baja al valle y repunta a la derecha (anclaje). */
  var frente = "M0,150 ";
  var nF = ruido1D(14, 26, 300);
  function yFrente(x){
    var t = x / W;
    var forma = 165 + 205 * Math.pow(Math.sin(Math.min(t * 1.25, 1) * Math.PI / 2), 1.4)
              - (t > 0.72 ? (t - 0.72) * 300 : 0);
    return forma + nF(t) - 13;
  }
  for (var x = 0; x <= W; x += 10) frente += "L" + x + "," + yFrente(x).toFixed(1) + " ";
  frente += "L" + W + "," + H + " L0," + H + " Z";
  el("path", { d: frente, fill: "#16281E", stroke: C.helecho, "stroke-opacity": "0.45", "stroke-width": 1 }, svg);

  /* Cancha: plano corto arriba a la izquierda */
  el("line", { x1: 20, y1: 150, x2: 175, y2: 150, stroke: C.niebla, "stroke-width": 1.5 }, svg);

  /* Torre con vientos sobre la cancha */
  var torreX = 120, torreBase = 150, torreTope = 52;
  el("line", { x1: torreX, y1: torreBase, x2: torreX, y2: torreTope, stroke: C.niebla, "stroke-width": 2.5 }, svg);
  el("line", { x1: torreX, y1: torreTope, x2: torreX - 74, y2: torreBase, stroke: C.niebla, "stroke-width": 0.8, "stroke-opacity": "0.7" }, svg);
  el("line", { x1: torreX, y1: torreTope, x2: torreX + 62, y2: torreBase + 4, stroke: C.niebla, "stroke-width": 0.8, "stroke-opacity": "0.7" }, svg);
  el("circle", { cx: torreX, cy: torreTope, r: 3.5, fill: "none", stroke: C.niebla, "stroke-width": 1.2 }, svg);
  /* Base de la torre: la máquina, esquemática */
  el("rect", { x: torreX - 17, y: torreBase - 12, width: 34, height: 12, fill: "none", stroke: C.niebla, "stroke-width": 1.2 }, svg);

  /* Anclaje al otro lado: tocón */
  var ancX = 1085, ancY = yFrente(ancX);
  el("line", { x1: ancX, y1: ancY, x2: ancX, y2: ancY - 16, stroke: C.niebla, "stroke-width": 3 }, svg);

  /* El cable: catenaria (cuadrática). Parte CAÍDO y se tensa al entrar. */
  var cable = el("path", { fill: "none", stroke: C.niebla, "stroke-width": 1.4 }, svg);
  var caida = 150;              /* estado suelto */
  var CAIDA_TENSA = 46;         /* estado de trabajo */
  function trazarCable(c){
    var mx = (torreX + ancX) / 2, my = (torreTope + (ancY - 16)) / 2 + c;
    cable.setAttribute("d", "M" + torreX + "," + torreTope + " Q" + mx + "," + my + " " + ancX + "," + (ancY - 16));
  }
  trazarCable(sinAnim ? CAIDA_TENSA : caida);

  /* El carro con su fuste, punto naranja incluido */
  var carro = el("g", { opacity: "0" }, svg);
  el("rect", { x: -7, y: -4, width: 14, height: 8, fill: "none", stroke: C.niebla, "stroke-width": 1.2 }, carro);
  el("circle", { cx: 0, cy: 0, r: 2.6, fill: C.faena }, carro);
  var estrobo = el("line", { x1: 0, y1: 4, x2: 0, y2: 26, stroke: C.niebla, "stroke-width": 0.9 }, carro);
  var fuste = el("line", { x1: -20, y1: 26, x2: 20, y2: 26, stroke: C.niebla, "stroke-width": 3.4, "stroke-linecap": "round" }, carro);

  /* Cotas en savia */
  var cotas = el("g", { "font-family": "IBM Plex Mono, monospace", "font-size": "12",
                        fill: C.savia, "letter-spacing": "1.2" }, svg);
  el("text", { x: 30, y: 135 }, cotas).textContent = "CANCHA";
  el("text", { x: ancX - 78, y: ancY + 26 }, cotas).textContent = "ANCLAJE";
  el("text", { x: 445, y: 96 }, cotas).textContent = "LÍNEA DE MADEREO — CLARO";
  el("text", { x: 585, y: 372 }, cotas).textContent = "PENDIENTE >30% → MADEREO CON TORRE";
  el("line", { x1: 578, y1: 352, x2: 578, y2: 378, stroke: C.savia, "stroke-width": 1 }, cotas);

  var seccion = doc.getElementById("folio-02");

  if (sinAnim){
    /* Sin animación: cable tenso y carro quieto a mitad de línea */
    carro.setAttribute("opacity", "1");
    var pMedio = cable.getPointAtLength(cable.getTotalLength() / 2);
    carro.setAttribute("transform", "translate(" + pMedio.x + "," + pMedio.y + ")");
    return;
  }

  /* Tensado con resorte amortiguado */
  var tensando = false;
  function tensar(){
    if (tensando) return; tensando = true;
    var v = 0, pos = caida, objetivo = CAIDA_TENSA, previo = null;
    function paso(t){
      if (previo === null) previo = t;
      var dt = Math.min((t - previo) / 1000, 0.05); previo = t;
      var F = (objetivo - pos) * 90 - v * 11;   /* rigidez y amortiguación */
      v += F * dt; pos += v * dt;
      trazarCable(pos);
      if (Math.abs(pos - objetivo) > 0.4 || Math.abs(v) > 0.4) requestAnimationFrame(paso);
      else { trazarCable(objetivo); carro.setAttribute("opacity", "1"); }
    }
    requestAnimationFrame(paso);
  }
  /* Si el folio ya se entintó (llegada por ancla antes del tiempo ocioso),
     el resorte parte al tiro; si no, espera su entintado. */
  if (seccion.classList.contains("is-inked")) tensar();
  else seccion.addEventListener("folio:inked", tensar, { once: true });

  /* El carro recorre la catenaria en loop de 25 s: sube cargado,
     vuelve vacío. Registrado en la rueda global: se pausa solo.
     La geometría del cable se muestrea UNA vez cuando el resorte asienta
     (200 puntos interpolados) — nada de getPointAtLength por frame. */
  var tabla = null;
  function muestrearCable(){
    var L = cable.getTotalLength();
    tabla = [];
    for (var i = 0; i <= 200; i++) tabla.push(cable.getPointAtLength(L * i / 200));
  }
  var cargadoPrevio = null;
  registrarTarea(seccion, function(t){
    if (carro.getAttribute("opacity") === "0") return;
    if (!tabla) muestrearCable();
    var ciclo = (t % 25000) / 25000, u, cargado;
    if (ciclo < 0.52){ u = 1 - (ciclo / 0.52); cargado = true; }          /* anclaje → torre */
    else if (ciclo < 0.58){ u = 0; cargado = false; }                     /* descarga en cancha */
    else if (ciclo < 0.96){ u = (ciclo - 0.58) / 0.38; cargado = false; } /* regreso vacío */
    else { u = 1; cargado = true; }                                       /* enganche */
    var pos = (0.06 + u * 0.88) * 200;
    var i0 = Math.min(Math.floor(pos), 199), f = pos - i0;
    var x = tabla[i0].x + (tabla[i0 + 1].x - tabla[i0].x) * f;
    var y = tabla[i0].y + (tabla[i0 + 1].y - tabla[i0].y) * f;
    carro.setAttribute("transform", "translate(" + x.toFixed(1) + "," + y.toFixed(1) + ")");
    if (cargado !== cargadoPrevio){
      cargadoPrevio = cargado;
      estrobo.setAttribute("opacity", cargado ? "1" : "0.35");
      fuste.setAttribute("opacity", cargado ? "1" : "0");
    }
  });
}

/* ── 5. VETA DE MADERA en el frame sin foto del parque ───────────────────────────
   Van sobre HOJA clara: tinta sobre papel verde-niebla.
   El respaldo del canvas se dimensiona al tamaño real del frame × DPR
   (tope 2): las líneas de 1px son la firma del expediente y en HiDPI
   no pueden llegar borrosas. Se dibuja una sola vez. */
function vetas(){
  var marcos = doc.querySelectorAll('[data-fig="veta"]');
  Array.prototype.forEach.call(marcos, function(marco, idx){
    var cv = doc.createElement("canvas");
    marco.appendChild(cv);
    var anchoReal = Math.max(marco.clientWidth || 0, 330);
    var k = Math.min(window.devicePixelRatio || 1, 2) * anchoReal / 660;
    var W = 660, H = 440;
    cv.width = Math.round(W * k); cv.height = Math.round(H * k);
    var ctx = cv.getContext("2d");
    ctx.scale(k, k);
    var rnd = mulberry32(7300 + idx * 991);
    ctx.fillStyle = C.hoja; ctx.fillRect(0, 0, W, H);

    /* 2–3 nudos gaussianos que deforman las líneas horizontales */
    var nudos = [];
    var nNudos = 2 + Math.floor(rnd() * 2);
    for (var n = 0; n < nNudos; n++){
      nudos.push({ x: 60 + rnd() * (W - 120), y: 50 + rnd() * (H - 100),
                   r: 34 + rnd() * 46, fuerza: 16 + rnd() * 22 });
    }
    ctx.strokeStyle = "rgba(20,33,26,0.45)";
    ctx.lineWidth = 1;
    for (var y0 = -20; y0 < H + 20; y0 += 8 + rnd() * 3){
      ctx.beginPath();
      var deriva = (rnd() - 0.5) * 6;
      for (var x = 0; x <= W; x += 6){
        var y = y0 + Math.sin(x * 0.004 + y0) * 3 + deriva * (x / W);
        for (var k2 = 0; k2 < nudos.length; k2++){
          var nu = nudos[k2];
          var dx = x - nu.x, dy = y0 - nu.y;
          var d2 = dx * dx + dy * dy;
          y += (dy > 0 ? 1 : -1) * nu.fuerza * Math.exp(-d2 / (2 * nu.r * nu.r));
        }
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    /* El ojo de cada nudo */
    nudos.forEach(function(nu){
      ctx.beginPath();
      ctx.ellipse(nu.x, nu.y, nu.r * 0.34, nu.r * 0.2, 0.3, 0, 6.29);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(nu.x, nu.y, nu.r * 0.16, nu.r * 0.09, 0.3, 0, 6.29);
      ctx.stroke();
    });
  });
}

/* ── 6. FRANJA DE ESTIBA — testas de trozas ───────────────────────────────
   Sobre el bosque, sin fondo: las partículas se ven entre las trozas. */
function estiba(){
  var banda = doc.querySelector('[data-fig="estiba"]');
  if (!banda) return;
  var rnd = mulberry32(4411);
  var W = 1400, H = 130;
  var svg = el("svg", { viewBox: "0 0 " + W + " " + H, preserveAspectRatio: "xMidYMid slice" }, banda);
  var x = -10;
  while (x < W + 40){
    var r = 20 + rnd() * 26;
    var cy = H / 2 + (rnd() - 0.5) * (H - 2 * r) * 0.7;
    var g = el("g", { fill: "none", stroke: C.helecho, "stroke-opacity": 0.5, "stroke-width": 1 }, svg);
    for (var i = 0; i < 4; i++){
      var f = [1, 0.7, 0.46, 0.22][i];
      el("ellipse", { cx: x + r, cy: cy, rx: r * f, ry: r * f * (0.94 + rnd() * 0.08),
                      transform: "rotate(" + ((rnd() - 0.5) * 10) + " " + (x + r) + " " + cy + ")" }, g);
    }
    el("circle", { cx: x + r, cy: cy, r: 1.5, fill: C.savia, stroke: "none" }, g);
    x += r * 2 + 3 + rnd() * 8;
  }
}

/* ── 7. LLUVIA FINA del folio de pendiente ──────────────────────────────── */
function lluvia(){
  if (sinAnim) return;
  var cv = doc.querySelector("[data-lluvia]");
  if (!cv) return;
  var ctx = cv.getContext("2d");
  var seccion = doc.getElementById("folio-02");
  /* dpr fijo en 1: a opacidad ~0,06 la nitidez extra es invisible y el
     respaldo a 1,5× cuadruplicaría el trabajo de limpiar y redibujar. */
  var dpr = 1;
  var gotas = [], W = 0, H = 0;

  function medir(){
    W = seccion.clientWidth; H = seccion.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  medir();
  new ResizeObserver(medir).observe(seccion);

  var rnd = mulberry32(111);
  for (var i = 0; i < 100; i++){
    gotas.push({ x: rnd(), y: rnd(), v: 220 + rnd() * 160, l: 9 + rnd() * 10 });
  }
  var previo = null;
  registrarTarea(seccion, function(t){
    if (previo === null) previo = t;
    var dt = Math.min((t - previo) / 1000, 0.05); previo = t;
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(231,239,230,0.16)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var i = 0; i < gotas.length; i++){
      var g = gotas[i];
      g.y += (g.v * dt) / H;
      if (g.y > 1.05){ g.y = -0.05; g.x = rnd(); }
      var x = g.x * W, y = g.y * H;
      ctx.moveTo(x, y);
      ctx.lineTo(x - g.l * 0.17, y + g.l);   /* inclinada ~10° */
    }
    ctx.stroke();
  });
}

/* El bosque parte al tiro: es el fondo de todo, y hasta el primer pintado
   del hero ya tiene que estar vivo. */
bosque();

/* Construcción diferida de lo que está bajo el pliegue: FIG. 02, vetas,
   estiba y lluvia se arman en tiempo ocioso para no estorbar el primer
   pintado del hero. (FIG. 01 es el hero: esa va al tiro, ver arriba.) */
(window.requestIdleCallback || function(fn){ setTimeout(fn, 1); })(function(){
  figPerfil(); vetas(); estiba(); lluvia();
});

/* ── 8. ENTINTADO Y REVELADO ─────────────────────────────────────────────── */
(function entintado(){
  /* La plancha fotográfica (.lamina) va de borde a borde y no es un folio,
     pero se revela con el mismo mecanismo: un solo observer para todo lo
     que entra en escena. */
  var folios = doc.querySelectorAll(".folio, .lamina");
  if (sinAnim){
    Array.prototype.forEach.call(folios, function(f){
      f.classList.add("is-inked");
      f.dispatchEvent(new CustomEvent("folio:inked"));
    });
    return;
  }
  /* threshold 0 + rootMargin negativo, y NO un threshold proporcional:
     un folio de 2600px en un teléfono apaisado nunca alcanza ratio 0,2
     y quedaría invisible para siempre. Así se entinta cuando su borde
     entra al 85% superior del viewport, mida lo que mida. */
  var obs = new IntersectionObserver(function(entradas){
    entradas.forEach(function(e){
      if (!e.isIntersecting) return;
      e.target.classList.add("is-inked");   /* una sola vez: los documentos
                                               no se desentintan */
      e.target.dispatchEvent(new CustomEvent("folio:inked"));
      obs.unobserve(e.target);
    });
  }, { threshold: 0, rootMargin: "0px 0px -15% 0px" });
  Array.prototype.forEach.call(folios, function(f){
    /* El hero se entinta al cargar, no por scroll */
    if (f.id === "folio-00") return;
    obs.observe(f);
  });
})();

/* ── 9. ODÓMETRO DE ROMANA ─────────────────────────────────────────────── */
(function odometros(){
  var nodos = doc.querySelectorAll("[data-odometro]");
  if (!nodos.length) return;
  Array.prototype.forEach.call(nodos, function(nodo){
    var valor = nodo.getAttribute("data-odometro");
    /* role="img" hace computable el aria-label; sin él, un span genérico
       con hijos aria-hidden queda sin nombre en varios lectores. */
    nodo.setAttribute("role", "img");
    nodo.setAttribute("aria-label", valor.replace(">", "más de "));
    if (sinAnim) return;                    /* estático: ya trae el valor */
    nodo.textContent = "";
    var ruedas = [];
    valor.split("").forEach(function(ch){
      if (/[0-9]/.test(ch)){
        var caja = doc.createElement("span");
        caja.className = "dig dig--rueda";
        caja.setAttribute("aria-hidden", "true");
        var tira = doc.createElement("span");
        tira.className = "tira";
        for (var d = 0; d <= 9; d++){
          var s = doc.createElement("span");
          s.textContent = d;
          tira.appendChild(s);
        }
        caja.appendChild(tira);
        nodo.appendChild(caja);
        ruedas.push({ tira: tira, objetivo: +ch });
      } else {
        var fijo = doc.createElement("span");
        fijo.className = "dig";
        fijo.setAttribute("aria-hidden", "true");
        fijo.textContent = ch;
        nodo.appendChild(fijo);
      }
    });
    var folio02 = doc.getElementById("folio-02");
    function rodar(){
      /* Doble rAF: garantiza que el estado inicial (tira en 0) llegó a
         pintarse antes de aplicar el final, o la transición no corre. */
      requestAnimationFrame(function(){ requestAnimationFrame(function(){
        ruedas.forEach(function(r, i){
          r.tira.style.transitionDelay = (i * 90) + "ms";
          r.tira.style.transform = "translateY(-" + r.objetivo + "em)";
        });
      }); });
    }
    if (folio02.classList.contains("is-inked")) rodar();
    else folio02.addEventListener("folio:inked", rodar, { once: true });
  });
})();

/* ── 11. DATOS DE LA EMPRESA ────────────────────────────────────────────── */
(function datos(){
  var D = window.DATOS_ROBUR || {};
  var faltantes = [];

  function poner(clave, valor){
    var span = doc.querySelector('[data-dato="' + clave + '"]');
    if (!span) return;
    var celda = span.closest(".membrete__celda");
    if (valor){
      span.textContent = valor;
      if (celda) celda.classList.remove("dato-pendiente");
    } else if (/^\[.*\]$/.test(span.textContent.trim())){
      /* Solo se estampa lo que ES un hueco [ENTRE CORCHETES]; un valor
         por defecto legítimo ("Sur de Chile") no es un dato pendiente. */
      if (celda) celda.classList.add("dato-pendiente");
    }
  }
  poner("rut", D.rut);            if (!D.rut) faltantes.push("rut");
  poner("region", D.region);      if (!D.region) faltantes.push("region (queda “Sur de Chile”)");

  /* Canales de contacto: solo se muestran los que existen.
     El WhatsApp se sanitiza a puros dígitos: quien edite datos.js puede
     copiar el formato del teléfono ("+56 9 ...") y wa.me lo rechazaría. */
  var wa = (D.whatsapp || "").replace(/\D/g, "");
  var hayCanal = false;
  function canal(nombre, visible, href){
    var caja = doc.querySelector('[data-canal="' + nombre + '"]');
    if (!caja) return;
    if (visible){
      caja.hidden = false; hayCanal = true;
      var a = caja.querySelector("a");
      if (a){ a.textContent = visible; a.href = href; }
    } else faltantes.push(nombre);
  }
  canal("whatsapp", wa ? "+" + wa : "", "https://wa.me/" + wa);
  canal("telefono", D.telefono, "tel:" + (D.telefono || "").replace(/\s/g, ""));
  canal("correo", D.correo, "mailto:" + D.correo);
  /* El aviso de canales pendientes nace visible en el HTML (para el caso
     sin JS); aquí se oculta apenas existe un canal de verdad. */
  var pend = doc.querySelector('[data-canal="pendiente"]');
  if (pend) pend.hidden = hayCanal;

  /* Bitácora: filas reales o filas estampadas que invitan a completar */
  var lista = doc.querySelector("[data-bitacora]");
  if (lista){
    var entradas = (D.bitacora && D.bitacora.length) ? D.bitacora : [
      { anio: "[AÑO]", texto: "[PRIMERA FAENA — POR COMPLETAR]", estampado: true },
      { anio: "[AÑO]", texto: "[LLEGA LA PRIMERA TORRE — POR COMPLETAR]", estampado: true },
      { anio: "[AÑO]", texto: "[LA FAMILIA HOY — POR COMPLETAR]", estampado: true }
    ];
    if (!D.bitacora || !D.bitacora.length) faltantes.push("bitacora");
    entradas.forEach(function(e2){
      var li = doc.createElement("li");
      var anio = doc.createElement("span");
      anio.className = "bitacora__anio" + (e2.estampado ? " bitacora__estampado" : "");
      anio.textContent = e2.anio;
      var p = doc.createElement("p");
      if (e2.estampado) p.className = "bitacora__estampado";
      p.textContent = e2.texto;
      li.appendChild(anio); li.appendChild(p);
      lista.appendChild(li);
    });
  }

  /* JSON-LD: solo agrega lo que existe */
  try{
    var nodo = doc.getElementById("jsonld");
    var esquema = JSON.parse(nodo.textContent);
    if (D.telefono) esquema.telephone = D.telefono;
    if (D.correo) esquema.email = D.correo;
    if (D.region) esquema.areaServed = D.region;
    nodo.textContent = JSON.stringify(esquema);
  } catch(_e){}

  if (faltantes.length){
    console.info(
      "[Forestal Robur] Datos por completar en assets/js/datos.js → " + faltantes.join(", ") +
      "\nMientras estén vacíos la página los estampa como [POR COMPLETAR]; no inventa nada."
    );
  }

  /* ── 12. LA GUÍA DE DESPACHO → WhatsApp / correo ── */
  var guia = doc.querySelector("[data-guia]");
  var aviso = doc.querySelector("[data-guia-aviso]");
  if (guia){
    /* La validación propia reemplaza a la nativa solo con JS vivo;
       por eso novalidate se pone aquí y no en el HTML. */
    guia.setAttribute("novalidate", "");
    var campoNombre = doc.getElementById("g-nombre");
    guia.addEventListener("submit", function(ev){
      ev.preventDefault();
      /* Se limpia el aviso anterior: un error viejo no puede quedar
         a la vista junto a un envío que sí salió. */
      aviso.hidden = true; aviso.textContent = "";
      campoNombre.removeAttribute("aria-invalid");
      campoNombre.removeAttribute("aria-describedby");
      var f = new FormData(guia);
      var nombre = (f.get("nombre") || "").toString().trim();
      if (!nombre){
        aviso.hidden = false;
        aviso.textContent = "FALTA EL REMITENTE: ¿A NOMBRE DE QUIÉN EMITIMOS LA GUÍA?";
        campoNombre.setAttribute("aria-invalid", "true");
        campoNombre.setAttribute("aria-describedby", "guia-aviso");
        campoNombre.focus();
        return;
      }
      var lineas = [
        "SOLICITUD DE EVALUACIÓN DE FAENA — Forestal Robur SpA",
        "Remitente: " + nombre,
        f.get("predio") ? "Predio o fundo: " + f.get("predio") : "",
        f.get("comuna") ? "Comuna: " + f.get("comuna") : "",
        f.get("superficie") ? "Superficie aprox.: " + f.get("superficie") + " ha" : "",
        f.get("pendiente") ? "Pendiente estimada: " + guia.querySelector("#g-pendiente option:checked").textContent.trim() : "",
        f.get("detalle") ? "Observaciones: " + f.get("detalle") : ""
      ].filter(Boolean);
      var texto = lineas.join("\n");
      if (wa){
        window.open("https://wa.me/" + wa + "?text=" + encodeURIComponent(texto), "_blank", "noopener");
      } else if (D.correo){
        window.location.href = "mailto:" + D.correo +
          "?subject=" + encodeURIComponent("Solicitud de evaluación de faena") +
          "&body=" + encodeURIComponent(texto);
      } else {
        aviso.hidden = false;
        aviso.textContent = "[CANAL PENDIENTE] LA GUÍA ESTÁ LISTA, PERO FALTAN LOS DATOS DE CONTACTO EN assets/js/datos.js.";
      }
    });
  }
})();

/* ── ARRANQUE DEL HERO ──────────────────────────────────────────────────── */
/* El titular espera a Besley para no animar con la fuente de reemplazo.
   Tope de 900 ms: si las fuentes tardan, el documento no espera a nadie. */
(function heroListo(){
  var portada = doc.getElementById("folio-00");
  function arrancar(){
    if (portada.classList.contains("hero-listo")) return;
    /* Doble rAF: el estado inicial (titular abajo) tiene que alcanzar a
       pintarse antes del estado final, o con las fuentes en caché la
       transición entera se salta. */
    requestAnimationFrame(function(){ requestAnimationFrame(function(){
      portada.classList.add("hero-listo");
      portada.classList.add("is-inked");
      portada.dispatchEvent(new CustomEvent("folio:inked"));
    }); });
  }
  if (sinAnim){
    portada.classList.add("hero-listo", "is-inked");
    portada.dispatchEvent(new CustomEvent("folio:inked"));
    return;
  }
  /* No sirve fonts.ready: con la hoja de Google cargando en asíncrono
     puede resolverse antes de que Besley exista siquiera como @font-face.
     Se sondea la fuente directamente, con tope de 900 ms. */
  var t0 = Date.now();
  (function esperarBesley(){
    var lista = doc.fonts && doc.fonts.check("900 16px Besley");
    if (lista || Date.now() - t0 > 900) arrancar();
    else setTimeout(esperarBesley, 80);
  })();
})();

/* ── PAUSA DE LAS ANIMACIONES CSS INFINITAS ─────────────────────────────── */
/* La marquesina (40s) es CSS puro: fuera del viewport se pausa por clase,
   para que la promesa de "todo se pausa" sea cierta. (Era ella y el sello
   giratorio; el sello se reemplazó por el logo real de la empresa.) */
(function pausaCSS(){
  if (sinAnim) return;
  var marquesina = doc.querySelector(".marquesina");
  if (!marquesina) return;
  var obs = new IntersectionObserver(function(entradas){
    entradas.forEach(function(e){
      e.target.classList.toggle("anim-pausada", !e.isIntersecting);
    });
  }, { rootMargin: "40px" });
  obs.observe(marquesina);
})();

})();
