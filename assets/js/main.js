/* ============================================================================
   FORESTAL ROBUR SpA — main.js
   ----------------------------------------------------------------------------
   Todo el movimiento del expediente vive aquí, en JS clásico (IIFE, sin
   dependencias). Sistemas, en orden:

     1. Política de animación: reduced-motion o pestaña oculta al cargar
        → html.sin-anim y el documento llega entero, pintado.
     2. PRNG con semilla fija (mulberry32): las figuras generativas son
        SIEMPRE el mismo dibujo — el expediente no cambia entre visitas.
     3. FIG. 01 — sección de fuste (anillos de crecimiento acotados).
     4. FIG. 02 — perfil de ladera: cerros, torre, cable en catenaria que
        se tensa al entrar, y carro que viaja con su fuste.
     5. Veta de madera generativa en los frames del parque de maquinaria.
     6. Franja de estiba (testas de trozas) como divisor.
     7. Lluvia fina del folio nocturno.
     8. Entintado por folio: UN IntersectionObserver, entra una sola vez.
     9. Odómetro de romana (cifras que ruedan).
    10. Una sola rueda requestAnimationFrame para los bucles CONTINUOS
        (carro, lluvia): cada uno se registra y se pausa solo fuera de
        viewport o con la pestaña oculta. El resorte del cable usa su
        propio rAF corto y autoterminante (~1 s); las animaciones CSS
        del sello y la marquesina se pausan por clase con un observer.
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
   Una sola rueda para todo: el carro del cable y la lluvia se registran
   como tareas con un elemento de referencia; un IntersectionObserver las
   enciende/apaga según viewport, y visibilitychange apaga todo. */
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
doc.addEventListener("visibilitychange", despertarRueda);

/* ── 3. FIG. 01 — SECCIÓN DE FUSTE ────────────────────────────────────────
   26–34 anillos irregulares con semilla fija: r(θ) = base + Σ sen(kθ+f)·a.
   Acotado como plano: diámetro, rotación, médula. */
(function figCorte(){
  var lienzo = doc.querySelector('[data-fig="corte"]');
  if (!lienzo) return;
  var rnd = mulberry32(20260819);
  var W = 760, H = 470, cx = 470, cy = 235, N = 28;
  var svg = el("svg", { viewBox: "0 0 " + W + " " + H, "aria-hidden": "true" }, lienzo);

  var anillos = [];
  for (var i = 0; i < N; i++){
    var base = 10 + i * 7.4;
    /* Tres armónicos por anillo: el árbol crece parecido año a año,
       así que las fases derivan poco entre anillos vecinos. */
    var f1 = rnd() * 6.283, f2 = rnd() * 6.283, f3 = rnd() * 6.283;
    var a1 = base * (0.035 + rnd() * 0.03);
    var a2 = base * (0.012 + rnd() * 0.015);
    var puntos = [];
    for (var s = 0; s <= 96; s++){
      var th = (s / 96) * 6.28318;
      var r = base + Math.sin(3 * th + f1) * a1 + Math.sin(7 * th + f2) * a2 + Math.sin(13 * th + f3) * 1.2;
      puntos.push((cx + Math.cos(th) * r).toFixed(1) + "," + (cy + Math.sin(th) * r * 0.96).toFixed(1));
    }
    var d = "M" + puntos[0] + " L" + puntos.slice(1).join(" ") + " Z";
    anillos.push(el("path", { d: d, fill: "none", stroke: "#241C15", "stroke-width": i % 7 === 3 ? 1.6 : 1 }, svg));
  }
  el("circle", { cx: cx, cy: cy, r: 2.4, fill: "#E1701A" }, svg);

  /* Cotas: grupo de textos técnicos que aparecen al final del trazado */
  var cotas = el("g", { "font-family": "IBM Plex Mono, monospace", "font-size": "11.5",
                        fill: "#241C15", "letter-spacing": "1" }, svg);
  var rMax = 10 + (N - 1) * 7.4;
  /* Línea de diámetro con tics */
  el("line", { x1: cx - rMax, y1: 448, x2: cx + rMax, y2: 448, stroke: "#241C15", "stroke-width": 1 }, cotas);
  el("line", { x1: cx - rMax, y1: 443, x2: cx - rMax, y2: 453, stroke: "#241C15", "stroke-width": 1 }, cotas);
  el("line", { x1: cx + rMax, y1: 443, x2: cx + rMax, y2: 453, stroke: "#241C15", "stroke-width": 1 }, cotas);
  el("text", { x: cx, y: 440, "text-anchor": "middle" }, cotas).textContent = "Ø 42 CM";
  /* Rotación, con línea de referencia al anillo exterior */
  el("line", { x1: 30, y1: 40, x2: cx - rMax * 0.62, y2: cy - rMax * 0.72, stroke: "#241C15", "stroke-width": 1 }, cotas);
  el("text", { x: 26, y: 30 }, cotas).textContent = "PINO RADIATA — ROTACIÓN 22–28 AÑOS";
  /* Médula */
  el("line", { x1: 96, y1: 320, x2: cx - 8, y2: cy + 6, stroke: "#241C15", "stroke-width": 1 }, cotas);
  el("text", { x: 30, y: 338 }, cotas).textContent = "MÉDULA — AÑO 1";
  el("text", { x: 30, y: 356, "font-size": "10", opacity: "0.65" }, cotas).textContent = "UN ANILLO POR AÑO, COMO LA EMPRESA.";

  if (sinAnim) return;   /* sin animación: el corte llega dibujado */

  /* Cascada centro→borde con las cotas al final */
  cotas.style.opacity = "0";
  cotas.style.transition = "opacity 600ms linear 1600ms";
  anillos.forEach(function(p, i){
    var L = p.getTotalLength();
    p.style.strokeDasharray = L;
    p.style.strokeDashoffset = L;
    p.style.transition = "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1) " + (i * 45) + "ms";
  });
  /* El trazado parte cuando el hero está listo (fuentes cargadas) */
  window.__trazarCorte = function(){
    requestAnimationFrame(function(){
      anillos.forEach(function(p){ p.style.strokeDashoffset = "0"; });
      cotas.style.opacity = "1";
    });
  };
})();

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
  el("stop", { offset: "0", "stop-color": "#C6CCC3", "stop-opacity": "0.16" }, grad);
  el("stop", { offset: "1", "stop-color": "#C6CCC3", "stop-opacity": "0.02" }, grad);

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
  cerro(330, 120, 87, "rgba(198,204,195,0.10)");

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
  el("path", { d: frente, fill: "#20362A", stroke: "#E9DCC3", "stroke-opacity": "0.5", "stroke-width": 1 }, svg);

  /* Cancha: plano corto arriba a la izquierda */
  el("line", { x1: 20, y1: 150, x2: 175, y2: 150, stroke: "#E9DCC3", "stroke-width": 1.5 }, svg);

  /* Torre con vientos sobre la cancha */
  var torreX = 120, torreBase = 150, torreTope = 52;
  el("line", { x1: torreX, y1: torreBase, x2: torreX, y2: torreTope, stroke: "#E9DCC3", "stroke-width": 2.5 }, svg);
  el("line", { x1: torreX, y1: torreTope, x2: torreX - 74, y2: torreBase, stroke: "#E9DCC3", "stroke-width": 0.8, "stroke-opacity": "0.75" }, svg);
  el("line", { x1: torreX, y1: torreTope, x2: torreX + 62, y2: torreBase + 4, stroke: "#E9DCC3", "stroke-width": 0.8, "stroke-opacity": "0.75" }, svg);
  el("circle", { cx: torreX, cy: torreTope, r: 3.5, fill: "none", stroke: "#E9DCC3", "stroke-width": 1.2 }, svg);
  /* Base de la torre: la máquina, esquemática */
  el("rect", { x: torreX - 17, y: torreBase - 12, width: 34, height: 12, fill: "none", stroke: "#E9DCC3", "stroke-width": 1.2 }, svg);

  /* Anclaje al otro lado: tocón */
  var ancX = 1085, ancY = yFrente(ancX);
  el("line", { x1: ancX, y1: ancY, x2: ancX, y2: ancY - 16, stroke: "#E9DCC3", "stroke-width": 3 }, svg);

  /* El cable: catenaria (cuadrática). Parte CAÍDO y se tensa al entrar. */
  var cable = el("path", { fill: "none", stroke: "#E9DCC3", "stroke-width": 1.4 }, svg);
  var caida = 150;              /* estado suelto */
  var CAIDA_TENSA = 46;         /* estado de trabajo */
  function trazarCable(c){
    var mx = (torreX + ancX) / 2, my = (torreTope + (ancY - 16)) / 2 + c;
    cable.setAttribute("d", "M" + torreX + "," + torreTope + " Q" + mx + "," + my + " " + ancX + "," + (ancY - 16));
  }
  trazarCable(sinAnim ? CAIDA_TENSA : caida);

  /* El carro con su fuste, punto naranja incluido */
  var carro = el("g", { opacity: "0" }, svg);
  el("rect", { x: -7, y: -4, width: 14, height: 8, fill: "none", stroke: "#E9DCC3", "stroke-width": 1.2 }, carro);
  el("circle", { cx: 0, cy: 0, r: 2.6, fill: "#E1701A" }, carro);
  var estrobo = el("line", { x1: 0, y1: 4, x2: 0, y2: 26, stroke: "#E9DCC3", "stroke-width": 0.9 }, carro);
  var fuste = el("line", { x1: -20, y1: 26, x2: 20, y2: 26, stroke: "#E9DCC3", "stroke-width": 3.4, "stroke-linecap": "round" }, carro);

  /* Cotas en ámbar */
  var cotas = el("g", { "font-family": "IBM Plex Mono, monospace", "font-size": "12",
                        fill: "#D9A45B", "letter-spacing": "1.2" }, svg);
  el("text", { x: 30, y: 135 }, cotas).textContent = "CANCHA";
  el("text", { x: ancX - 78, y: ancY + 26 }, cotas).textContent = "ANCLAJE";
  el("text", { x: 445, y: 96 }, cotas).textContent = "LÍNEA DE MADEREO — CLARO";
  el("text", { x: 585, y: 372 }, cotas).textContent = "PENDIENTE >30% → MADEREO CON TORRE";
  el("line", { x1: 578, y1: 352, x2: 578, y2: 378, stroke: "#D9A45B", "stroke-width": 1 }, cotas);

  var seccion = doc.getElementById("folio-02");

  if (sinAnim){
    /* Sin animación: cable tenso y carro quieto a mitad de línea */
    carro.setAttribute("opacity", "1");
    var pMedio = cable.getPointAtLength(cable.getTotalLength() / 2);
    carro.setAttribute("transform", "translate(" + pMedio.x + "," + pMedio.y + ")");
    return;
  }

  /* Tensado con resorte amortiguado (~15 líneas, como pedía el plano) */
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

/* ── 5. VETA DE MADERA en los frames del parque ───────────────────────────
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
    ctx.fillStyle = "#F2EDE1"; ctx.fillRect(0, 0, W, H);

    /* 2–3 nudos gaussianos que deforman las líneas horizontales */
    var nudos = [];
    var nNudos = 2 + Math.floor(rnd() * 2);
    for (var n = 0; n < nNudos; n++){
      nudos.push({ x: 60 + rnd() * (W - 120), y: 50 + rnd() * (H - 100),
                   r: 34 + rnd() * 46, fuerza: 16 + rnd() * 22 });
    }
    ctx.strokeStyle = "rgba(36,28,21,0.5)";
    ctx.lineWidth = 1;
    for (var y0 = -20; y0 < H + 20; y0 += 8 + rnd() * 3){
      ctx.beginPath();
      var deriva = (rnd() - 0.5) * 6;
      for (var x = 0; x <= W; x += 6){
        var y = y0 + Math.sin(x * 0.004 + y0) * 3 + deriva * (x / W);
        for (var k = 0; k < nudos.length; k++){
          var nu = nudos[k];
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

/* ── 6. FRANJA DE ESTIBA — testas de trozas ─────────────────────────────── */
function estiba(){
  var banda = doc.querySelector('[data-fig="estiba"]');
  if (!banda) return;
  var rnd = mulberry32(4411);
  var W = 1400, H = 130;
  var svg = el("svg", { viewBox: "0 0 " + W + " " + H, preserveAspectRatio: "xMidYMid slice" }, banda);
  el("rect", { width: W, height: H, fill: "#F2EDE1" }, svg);
  var x = -10;
  while (x < W + 40){
    var r = 20 + rnd() * 26;
    var cy = H / 2 + (rnd() - 0.5) * (H - 2 * r) * 0.7;
    var g = el("g", { fill: "none", stroke: "#241C15", "stroke-width": 1 }, svg);
    for (var i = 0; i < 4; i++){
      var f = [1, 0.7, 0.46, 0.22][i];
      el("ellipse", { cx: x + r, cy: cy, rx: r * f, ry: r * f * (0.94 + rnd() * 0.08),
                      transform: "rotate(" + ((rnd() - 0.5) * 10) + " " + (x + r) + " " + cy + ")" }, g);
    }
    el("circle", { cx: x + r, cy: cy, r: 1.4, fill: "#241C15", stroke: "none" }, g);
    x += r * 2 + 3 + rnd() * 8;
  }
}

/* ── 7. LLUVIA FINA del folio nocturno ──────────────────────────────────── */
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
    ctx.strokeStyle = "rgba(198,204,195,0.18)";
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

/* Construcción diferida de lo que está bajo el pliegue: FIG. 02, vetas,
   estiba y lluvia se arman en tiempo ocioso para no estorbar el primer
   pintado del hero. (FIG. 01 es el hero: esa va al tiro, ver arriba.) */
(window.requestIdleCallback || function(fn){ setTimeout(fn, 1); })(function(){
  figPerfil(); vetas(); estiba(); lluvia();
});

/* ── 8. ENTINTADO POR FOLIO ─────────────────────────────────────────────── */
(function entintado(){
  var folios = doc.querySelectorAll(".folio");
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

/* ── 9. ODÓMETRO DE ROMANA ──────────────────────────────────────────────── */
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
    /* Doble rAF: el estado inicial (titular abajo, anillos sin trazar)
       tiene que alcanzar a pintarse antes del estado final, o con las
       fuentes en caché la transición entera se salta. */
    requestAnimationFrame(function(){ requestAnimationFrame(function(){
      portada.classList.add("hero-listo");
      portada.classList.add("is-inked");
      portada.dispatchEvent(new CustomEvent("folio:inked"));
      if (window.__trazarCorte) window.__trazarCorte();
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
/* El sello (60s) y la marquesina (40s) son CSS puro: fuera del viewport
   se pausan por clase, para que la promesa de "todo se pausa" sea cierta. */
(function pausaCSS(){
  if (sinAnim) return;
  var infinitas = [doc.querySelector(".marquesina"), doc.querySelector(".membrete__celda--sello")];
  var obs = new IntersectionObserver(function(entradas){
    entradas.forEach(function(e){
      e.target.classList.toggle("anim-pausada", !e.isIntersecting);
    });
  }, { rootMargin: "40px" });
  infinitas.forEach(function(n){ if (n) obs.observe(n); });
})();

})();
