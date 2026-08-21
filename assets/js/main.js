/* ============================================================================
   FORESTAL ROBUR SpA — main.js
   ----------------------------------------------------------------------------
   JS clásico, IIFE, sin dependencias. Sistemas, en orden:

     1. Política de animación y cancelación del rescate del <head>.
     2. PRNG con semilla fija (mulberry32): el relieve del plano es SIEMPRE
        el mismo cerro, en toda visita y en todo navegador.
     3. Gestor ÚNICO de requestAnimationFrame: las tareas continuas se
        registran con su elemento y se pausan solas fuera de viewport o
        con la pestaña oculta.
     4. EL PLANO — corte de ladera con torre de madereo, dibujado como
        plano de ingeniería en SVG. Es la pieza firma del sitio.
     5. Revelado al scroll: observer agregado desde JS, con rescate para
        lo que ya está visible al cargar y barrido de seguridad a los 6 s.
     6. Datos de la empresa (datos.js): cifras, canales, trayectoria,
        JSON-LD y reporte en consola de lo que falta.
     7. El formulario arma la solicitud y la manda por WhatsApp o correo.

   Lo que NO está acá y es deliberado: la entrada de la portada es
   @keyframes CSS puro. Una pestaña abierta en segundo plano no corre
   requestAnimationFrame, y la portada tiene que estar pintada cuando el
   visitante llegue a mirarla.
   ============================================================================ */
(function(){
"use strict";

var doc = document, raiz = doc.documentElement;

/* ── 1. POLÍTICA DE ANIMACIÓN ─────────────────────────────────────────────
   El <head> dejó un temporizador que quita la clase .js a los 4 s para que
   la página no quede con contenido oculto si este archivo no llega. Como
   sí llegó, se cancela. */
if (window.rescate) clearTimeout(window.rescate);

var reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

/* ── 3. GESTOR ÚNICO DE rAF ───────────────────────────────────────────────
   Una sola rueda para todo lo continuo. Cada tarea se registra con un
   elemento de referencia; un IntersectionObserver la enciende y apaga
   según viewport, y visibilitychange apaga la rueda entera. */
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
}, { rootMargin: "80px" });
function registrarTarea(elemento, fn){
  tareas.push({ el: elemento, fn: fn, visible: false });
  obsTareas.observe(elemento);
}
doc.addEventListener("visibilitychange", despertarRueda);

/* ── 4. EL PLANO — CORTE DE LADERA CON TORRE DE MADEREO ───────────────────
   Un plano de ingeniería de verdad: relieve acotado, torre con vientos,
   cable en catenaria, carro con la carga, anclaje, y cotas en mono. La
   pendiente del terreno no es un dibujo bonito — está calculada para dar
   sobre 30%, que es exactamente el umbral que justifica el sistema.

   Se construye en tiempo ocioso: está bajo el pliegue y no debe competir
   con el primer pintado de la portada. */
function plano(){
  var lienzo = doc.querySelector("[data-plano]");
  if (!lienzo) return;

  var W = 1200, H = 560;
  var svg = el("svg", {
    viewBox: "0 0 " + W + " " + H,
    preserveAspectRatio: "xMidYMid meet",
    "aria-hidden": "true"          /* la descripción vive en el role="img" del padre */
  }, lienzo);

  var TINTA   = "#EAEFF1",   /* niebla */
      SUAVE   = "#A6B2B8",   /* niebla-2 */
      VERDE   = "#7FC08E",   /* helecho: cotas y vegetación */
      AMBAR   = "#F2A93B",   /* cifras del plano */
      NARANJA = "#E1701A";   /* la carga: el único punto cálido */

  /* — Relieve con ruido de semilla fija, interpolado por coseno —
     El mismo cerro en toda visita: un plano que cambia entre recargas no
     es un plano, es un fondo animado. */
  function ruido1D(nodos, amplitud, semilla){
    var r = mulberry32(semilla), vals = [];
    for (var i = 0; i <= nodos; i++) vals.push(r() * amplitud);
    return function(t){
      var x = t * nodos, i0 = Math.floor(x), f = x - i0;
      var u = (1 - Math.cos(f * Math.PI)) / 2;
      return vals[Math.min(i0, nodos)] * (1 - u) + vals[Math.min(i0 + 1, nodos)] * u;
    };
  }

  /* Geometría de la línea. Estos números son el plano: la cancha arriba a
     la izquierda, el anclaje abajo a la derecha. */
  var CANCHA_X0 = 40,  CANCHA_X1 = 262, CANCHA_Y = 150;
  var TORRE_X   = 168, TORRE_TOPE = 46;
  var ANCLA_X   = 1075;

  var nR = ruido1D(11, 22, 4711);
  /* Perfil del terreno: plano en la cancha, y de ahí cae al valle con la
     pendiente de trabajo. */
  function ySuelo(x){
    if (x <= CANCHA_X1) return CANCHA_Y;
    var t = (x - CANCHA_X1) / (W - CANCHA_X1);
    /* Caída con forma: fuerte al principio, suaviza al fondo del valle. */
    var caida = 330 * Math.pow(t, 0.86);
    return CANCHA_Y + caida + nR(t) - 11;
  }

  var ANCLA_Y = ySuelo(ANCLA_X);

  /* — Cerro de fondo, apagado: da profundidad sin robar atención — */
  var nFondo = ruido1D(8, 90, 991);
  var fondo = "M0," + H + " ";
  for (var xf = 0; xf <= W; xf += 14){
    fondo += "L" + xf + "," + (250 - nFondo(xf / W) + xf * 0.12).toFixed(1) + " ";
  }
  fondo += "L" + W + "," + H + " Z";
  el("path", { d: fondo, fill: "rgba(127,192,142,0.05)" }, svg);

  /* — El terreno de la faena — */
  var suelo = "M0," + H + " L0," + CANCHA_Y + " ";
  for (var x = 0; x <= W; x += 8) suelo += "L" + x + "," + ySuelo(x).toFixed(1) + " ";
  suelo += "L" + W + "," + H + " Z";
  el("path", { d: suelo, fill: "#16301F", stroke: VERDE,
               "stroke-opacity": 0.55, "stroke-width": 1.2 }, svg);

  /* Rayado de talud bajo la línea de terreno: la convención de plano para
     decir "esto es corte de suelo". */
  var rayado = el("g", { stroke: VERDE, "stroke-opacity": 0.18, "stroke-width": 1 }, svg);
  for (var xr = 12; xr < W; xr += 26){
    var yr = ySuelo(xr);
    el("line", { x1: xr, y1: yr, x2: xr - 13, y2: yr + 26 }, rayado);
  }

  /* — Árboles en pie sobre la ladera: por qué hay algo que cosechar — */
  var arboles = el("g", { stroke: VERDE, "stroke-opacity": 0.5, "stroke-width": 1.4,
                          fill: "none", "stroke-linecap": "round" }, svg);
  var rA = mulberry32(3312);
  for (var xa = CANCHA_X1 + 40; xa < ANCLA_X - 30; xa += 34 + rA() * 26){
    var ya = ySuelo(xa), alto = 26 + rA() * 20;
    el("line", { x1: xa, y1: ya, x2: xa, y2: ya - alto }, arboles);
    el("path", { d: "M" + (xa - 7) + "," + (ya - alto * 0.45) +
                    " L" + xa + "," + (ya - alto - 7) +
                    " L" + (xa + 7) + "," + (ya - alto * 0.45) }, arboles);
  }

  /* — La cancha: plataforma de trabajo — */
  el("line", { x1: CANCHA_X0, y1: CANCHA_Y, x2: CANCHA_X1, y2: CANCHA_Y,
               stroke: TINTA, "stroke-width": 2.5 }, svg);

  /* — La torre, con sus vientos — */
  var torre = el("g", { stroke: TINTA, "stroke-width": 2, fill: "none" }, svg);
  el("line", { x1: TORRE_X, y1: CANCHA_Y, x2: TORRE_X, y2: TORRE_TOPE, "stroke-width": 3 }, torre);
  el("line", { x1: TORRE_X, y1: TORRE_TOPE + 8, x2: TORRE_X - 88, y2: CANCHA_Y,
               "stroke-width": 1, "stroke-opacity": 0.75 }, torre);
  el("line", { x1: TORRE_X, y1: TORRE_TOPE + 8, x2: TORRE_X + 74, y2: CANCHA_Y,
               "stroke-width": 1, "stroke-opacity": 0.75 }, torre);
  el("circle", { cx: TORRE_X, cy: TORRE_TOPE, r: 4.5, "stroke-width": 2 }, torre);
  /* Base: la máquina que mueve el cable */
  el("rect", { x: TORRE_X - 26, y: CANCHA_Y - 22, width: 52, height: 22, "stroke-width": 1.6 }, torre);

  /* — El anclaje: tocón con su viento — */
  var ancla = el("g", { stroke: TINTA, "stroke-width": 2, fill: "none" }, svg);
  el("line", { x1: ANCLA_X, y1: ANCLA_Y, x2: ANCLA_X, y2: ANCLA_Y - 26, "stroke-width": 3.5 }, ancla);
  el("line", { x1: ANCLA_X, y1: ANCLA_Y - 22, x2: ANCLA_X + 46, y2: ANCLA_Y + 6,
               "stroke-width": 1, "stroke-opacity": 0.75 }, ancla);

  /* — El cable, en catenaria — */
  var CAIDA = 52;
  var cx = (TORRE_X + ANCLA_X) / 2;
  var cy = (TORRE_TOPE + (ANCLA_Y - 26)) / 2 + CAIDA;
  var dCable = "M" + TORRE_X + "," + TORRE_TOPE +
               " Q" + cx + "," + cy + " " + ANCLA_X + "," + (ANCLA_Y - 26);
  var cable = el("path", { d: dCable, fill: "none", stroke: TINTA, "stroke-width": 1.6 }, svg);

  /* — El carro con su fuste suspendido — */
  var carro = el("g", {}, svg);
  el("rect", { x: -11, y: -6, width: 22, height: 12, fill: "none",
               stroke: TINTA, "stroke-width": 1.8 }, carro);
  el("circle", { cx: 0, cy: 0, r: 3.4, fill: NARANJA }, carro);
  var estrobo = el("line", { x1: 0, y1: 6, x2: 0, y2: 34, stroke: TINTA, "stroke-width": 1.2 }, carro);
  var fuste = el("line", { x1: -34, y1: 36, x2: 30, y2: 30, stroke: NARANJA,
                           "stroke-width": 5, "stroke-linecap": "round" }, carro);

  /* ── COTAS — lo que convierte un dibujo en un plano ────────────────────
     Todo el texto va en la mono del sitio, en mayúsculas y con tracking:
     es la letra de un plano, no de un párrafo. */
  var cotas = el("g", {
    "font-family": "Azeret Mono, Consolas, monospace",
    "font-size": "13",
    "letter-spacing": "1.1",
    fill: SUAVE
  }, svg);

  function rotulo(x, y, texto, color, anclaje){
    var t = el("text", { x: x, y: y, fill: color || SUAVE }, cotas);
    if (anclaje) t.setAttribute("text-anchor", anclaje);
    t.textContent = texto;
    return t;
  }
  function guia(x1, y1, x2, y2, color){
    el("line", { x1: x1, y1: y1, x2: x2, y2: y2, stroke: color || SUAVE,
                 "stroke-width": 1, "stroke-opacity": 0.6 }, cotas);
  }

  /* Rótulos de las piezas, cada uno con su línea guía al elemento */
  rotulo(CANCHA_X0, CANCHA_Y - 92, "CANCHA", TINTA);
  guia(CANCHA_X0 + 4, CANCHA_Y - 84, CANCHA_X0 + 30, CANCHA_Y - 6);

  rotulo(TORRE_X + 22, TORRE_TOPE - 10, "TORRE DE MADEREO", TINTA);
  guia(TORRE_X + 16, TORRE_TOPE - 14, TORRE_X + 5, TORRE_TOPE - 6);

  rotulo(ANCLA_X - 4, ANCLA_Y + 42, "ANCLAJE A TOCÓN", TINTA, "middle");
  guia(ANCLA_X, ANCLA_Y + 28, ANCLA_X, ANCLA_Y - 4);

  /* Cota de la línea de madereo: doble flecha entre torre y anclaje */
  var yLinea = 24;
  el("line", { x1: TORRE_X, y1: yLinea, x2: ANCLA_X, y2: yLinea,
               stroke: VERDE, "stroke-width": 1, "stroke-opacity": 0.8 }, cotas);
  el("line", { x1: TORRE_X, y1: yLinea - 6, x2: TORRE_X, y2: yLinea + 6,
               stroke: VERDE, "stroke-width": 1 }, cotas);
  el("line", { x1: ANCLA_X, y1: yLinea - 6, x2: ANCLA_X, y2: yLinea + 6,
               stroke: VERDE, "stroke-width": 1 }, cotas);
  rotulo((TORRE_X + ANCLA_X) / 2, yLinea - 10, "LÍNEA DE MADEREO", VERDE, "middle");

  /* Triángulo de pendiente: la cota que justifica todo el sistema.
     Se dibuja sobre el tramo real del terreno, así que el ángulo que se
     ve ES la pendiente que se declara. */
  var pxA = 470, pxB = 700;
  var pyA = ySuelo(pxA), pyB = ySuelo(pxB);
  var tri = el("g", { stroke: AMBAR, "stroke-width": 1.4, fill: "none" }, cotas);
  el("line", { x1: pxA, y1: pyA, x2: pxB, y2: pyA }, tri);   /* cateto horizontal */
  el("line", { x1: pxB, y1: pyA, x2: pxB, y2: pyB }, tri);   /* cateto vertical */
  el("line", { x1: pxA, y1: pyA, x2: pxB, y2: pyB, "stroke-dasharray": "5 4" }, tri);
  rotulo(pxB + 12, (pyA + pyB) / 2 + 5, "> 30 %", AMBAR);
  rotulo(pxA, pyA - 12, "PENDIENTE DE TRABAJO", AMBAR);

  /* Flecha de sentido: la carga sube hacia la cancha.
     Va en el aire, sobre la línea y lejos del triángulo de pendiente: en
     la ladera se cruzaba con la cota del 30% y con el fuste del carro,
     que es del mismo naranja. Tres cosas naranjas amontonadas no se leen. */
  var fx1 = 880, fx2 = 700, fy = 90;
  el("line", { x1: fx1, y1: fy, x2: fx2, y2: fy, stroke: NARANJA, "stroke-width": 2 }, cotas);
  el("path", { d: "M" + fx2 + "," + fy + " l13,-5 l0,10 z", fill: NARANJA, stroke: "none" }, cotas);
  rotulo(fx1 + 14, fy + 5, "SENTIDO DE MADEREO", NARANJA);

  /* Nota del suelo protegido: el argumento de venta, dicho en el plano */
  rotulo(CANCHA_X1 + 60, H - 26, "NINGUNA MÁQUINA PISA LA LADERA", VERDE);
  el("line", { x1: CANCHA_X1 + 46, y1: H - 31, x2: CANCHA_X1 + 52, y2: H - 31,
               stroke: VERDE, "stroke-width": 2 }, cotas);

  /* ── MOVIMIENTO DEL CARRO ──────────────────────────────────────────────
     Sube cargado, descarga en la cancha, vuelve vacío. Es el único bucle
     continuo del sitio y explica el sistema mejor que un párrafo.
     Se muestrea la curva UNA vez: nada de getPointAtLength por frame. */
  var largo = cable.getTotalLength();
  var tabla = [];
  for (var i = 0; i <= 160; i++) tabla.push(cable.getPointAtLength(largo * i / 160));

  function ponerCarro(u, cargado){
    var pos = (0.05 + u * 0.9) * 160;
    var i0 = Math.min(Math.floor(pos), 159), f = pos - i0;
    var px = tabla[i0].x + (tabla[i0 + 1].x - tabla[i0].x) * f;
    var py = tabla[i0].y + (tabla[i0 + 1].y - tabla[i0].y) * f;
    carro.setAttribute("transform", "translate(" + px.toFixed(1) + "," + py.toFixed(1) + ")");
    estrobo.setAttribute("opacity", cargado ? "1" : "0.3");
    fuste.setAttribute("opacity", cargado ? "1" : "0");
  }

  /* El carro se coloca YA, antes de cualquier animación. Sin esto queda en
     el origen del SVG —una marca naranja suelta en la esquina— hasta que
     corra el primer frame, y ese frame no llega nunca si la pestaña se
     abrió en segundo plano: ahí la rueda está pausada. La posición inicial
     es además la que mejor explica el sistema: cargado, a media línea. */
  ponerCarro(0.55, true);

  if (reducido) return;   /* quieto, pero en su sitio */

  /* CONTROL DE PAUSA — el carro es un bucle continuo de 22 s, y una
     animación que se repite sola más de 5 segundos necesita que el
     visitante pueda detenerla (WCAG 2.2.2). El botón se crea desde JS
     porque sin JS no hay animación que pausar, y un botón muerto en el
     HTML sería peor que ninguno. */
  var pausado = false;
  var pie = doc.querySelector(".plano__pie");
  var btn = doc.createElement("button");
  btn.type = "button";
  btn.className = "plano__pausa";
  btn.setAttribute("aria-pressed", "false");
  function pintarBoton(){
    btn.setAttribute("aria-pressed", pausado ? "true" : "false");
    btn.innerHTML = pausado
      ? '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 2 L10 6 L3 10 Z"/></svg>Reanudar'
      : '<svg viewBox="0 0 12 12" aria-hidden="true"><rect x="3" y="2" width="2.5" height="8"/><rect x="7" y="2" width="2.5" height="8"/></svg>Pausar';
    btn.setAttribute("aria-label", pausado
      ? "Reanudar la animación del carro"
      : "Pausar la animación del carro");
  }
  pintarBoton();
  if (pie) pie.appendChild(btn);

  /* El reloj propio permite pausar sin saltos: al reanudar, el carro sigue
     donde quedó en vez de teletransportarse al punto que le tocaría por
     tiempo absoluto. */
  var reloj = 0, previo = null;
  btn.addEventListener("click", function(){
    pausado = !pausado;
    previo = null;                 /* al reanudar no se cuenta el rato pausado */
    pintarBoton();
  });

  registrarTarea(lienzo, function(t){
    if (previo === null) previo = t;
    var dt = t - previo; previo = t;
    if (pausado) return;
    reloj += dt;

    var ciclo = (reloj % 22000) / 22000, u, cargado;
    if (ciclo < 0.50){ u = 1 - ciclo / 0.50; cargado = true; }            /* sube cargado */
    else if (ciclo < 0.57){ u = 0; cargado = false; }                      /* descarga */
    else if (ciclo < 0.95){ u = (ciclo - 0.57) / 0.38; cargado = false; }  /* baja vacío */
    else { u = 1; cargado = true; }                                        /* engancha */
    ponerCarro(u, cargado);
  });
}

/* ── 5. REVELADO AL SCROLL ────────────────────────────────────────────────
   Las clases se agregan DESDE AQUÍ, nunca en el HTML: así el documento
   servido no depende de que este archivo exista.
   Dos resguardos que se ganaron a golpes:
     (a) lo que ya está en pantalla al cargar se revela de inmediato, sin
         esperar la primera notificación del observer;
     (b) barrido a los 6 s: si algo quedó oculto por lo que sea, se muestra.
   Y nunca se observa un elemento recortado a área cero — solo contenedores
   con caja real. */
function revelado(){
  var objetivos = [];

  doc.querySelectorAll(".seccion__cabeza, .plano, .equipo, .terreno__cuerpo, .trayectoria__texto, .contacto__texto, .formulario, .plancha__dato")
     .forEach(function(n){ objetivos.push({ n: n, d: 0 }); });

  /* Hijos escalonados: 70 ms entre hermanos — bastante para que se note
     el orden, poco para que nadie espere. */
  doc.querySelectorAll("[data-revelar-hijos]").forEach(function(cont){
    Array.prototype.forEach.call(cont.children, function(hijo, i){
      objetivos.push({ n: hijo, d: Math.min(i, 7) * 70 });
    });
  });
  doc.querySelectorAll(".piezas > li, .hitos > li, .terreno__lista > li").forEach(function(n, i){
    objetivos.push({ n: n, d: Math.min(i, 7) * 70 });
  });

  objetivos.forEach(function(o){
    o.n.classList.add("revelable");
    if (o.d) o.n.style.transitionDelay = o.d + "ms";
  });

  function mostrar(n){
    n.classList.add("revelado");
  }

  var obs = new IntersectionObserver(function(entradas){
    entradas.forEach(function(e){
      if (!e.isIntersecting) return;
      mostrar(e.target);
      obs.unobserve(e.target);          /* una sola vez: reaparecer cansa */
    });
  }, { threshold: 0, rootMargin: "0px 0px -12% 0px" });

  var alto = window.innerHeight;
  objetivos.forEach(function(o){
    /* (a) lo ya visible entra sin esperar notificación */
    var r = o.n.getBoundingClientRect();
    if (r.top < alto * 0.92 && r.bottom > 0){ mostrar(o.n); return; }
    obs.observe(o.n);
  });

  /* (b) barrido de seguridad */
  setTimeout(function(){
    objetivos.forEach(function(o){ mostrar(o.n); });
  }, 6000);
}

/* Construcción diferida de lo que está bajo el pliegue. */
(window.requestIdleCallback || function(fn){ setTimeout(fn, 1); })(function(){
  plano();
});
revelado();

/* ── 6. DATOS DE LA EMPRESA ─────────────────────────────────────────────── */
(function datos(){
  var D = window.DATOS_ROBUR || {};
  var faltantes = [];

  /* Texto simple por clave (región, RUT). Si no hay dato y el HTML trae un
     valor por defecto legítimo, se respeta el del HTML. */
  function texto(clave, valor, siVacio){
    var nodos = doc.querySelectorAll('[data-dato="' + clave + '"]');
    if (!nodos.length) return;
    if (valor){
      nodos.forEach(function(n){ n.textContent = valor; });
    } else if (siVacio){
      nodos.forEach(function(n){ n.textContent = siVacio; });
    }
  }
  texto("region", D.region);
  texto("rut", D.rut, "Por confirmar");
  if (!D.rut) faltantes.push("rut");

  /* Cifras grandes. Sin dato confirmado NO se inventa: la casilla dice
     "por confirmar" y se ve que es un pendiente, no un número real. */
  doc.querySelectorAll("[data-cifra]").forEach(function(n){
    var v = D[n.getAttribute("data-cifra")];
    if (v){
      n.textContent = v;
    } else {
      n.textContent = "Por confirmar";
      n.classList.add("cifra__valor--pendiente");
      faltantes.push(n.getAttribute("data-cifra"));
    }
  });

  /* Canales de contacto: solo se muestran los que existen. El WhatsApp se
     sanitiza a puros dígitos — quien edite datos.js puede copiar el
     formato del teléfono ("+56 9 ...") y wa.me lo rechazaría. */
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
  var pend = doc.querySelector('[data-canal="pendiente"]');
  if (pend) pend.hidden = hayCanal;

  /* Trayectoria */
  var lista = doc.querySelector("[data-trayectoria]");
  if (lista){
    var hitos = (D.trayectoria && D.trayectoria.length) ? D.trayectoria : null;
    if (!hitos){
      faltantes.push("trayectoria");
      hitos = [
        { anio: "—", texto: "Hitos por confirmar con la empresa", pendiente: true },
        { anio: "—", texto: "Primera faena · primera torre · dotación actual", pendiente: true }
      ];
    }
    hitos.forEach(function(h){
      var li = doc.createElement("li");
      if (h.pendiente) li.className = "hito--pendiente";
      var a = doc.createElement("span");
      a.className = "hito__anio";
      a.textContent = h.anio;
      var p = doc.createElement("p");
      p.className = "hito__texto";
      p.textContent = h.texto;
      li.appendChild(a); li.appendChild(p);
      lista.appendChild(li);
    });
  }

  /* JSON-LD: solo lo que existe de verdad */
  try{
    var nodo = doc.getElementById("jsonld");
    var esquema = JSON.parse(nodo.textContent);
    if (D.telefono) esquema.telephone = D.telefono;
    if (D.correo) esquema.email = D.correo;
    esquema.address = {
      "@type": "PostalAddress",
      addressLocality: D.comuna || "Loncoche",
      addressRegion: D.region || "Región de La Araucanía",
      addressCountry: "CL"
    };
    esquema.areaServed = D.region || "Sur de Chile";
    nodo.textContent = JSON.stringify(esquema);
  } catch(_e){}

  if (faltantes.length){
    console.info(
      "[Forestal Robur] Datos por completar en assets/js/datos.js → " + faltantes.join(", ") +
      "\nMientras estén vacíos la página los muestra como POR CONFIRMAR; no inventa nada."
    );
  }

  /* ── 7. EL FORMULARIO → WhatsApp / correo ── */
  var form = doc.querySelector("[data-formulario]");
  var aviso = doc.querySelector("[data-form-aviso]");
  if (!form) return;

  /* La validación propia reemplaza a la nativa solo con JS vivo: por eso
     novalidate se pone acá y no en el HTML. */
  form.setAttribute("novalidate", "");
  var campoNombre = doc.getElementById("f-nombre");

  form.addEventListener("submit", function(ev){
    ev.preventDefault();
    aviso.hidden = true; aviso.textContent = "";
    campoNombre.removeAttribute("aria-invalid");
    campoNombre.removeAttribute("aria-describedby");

    var f = new FormData(form);
    var nombre = (f.get("nombre") || "").toString().trim();
    if (!nombre){
      aviso.hidden = false;
      aviso.textContent = "Falta el nombre: ¿a nombre de quién preparamos la visita?";
      campoNombre.setAttribute("aria-invalid", "true");
      campoNombre.setAttribute("aria-describedby", "form-aviso");
      campoNombre.focus();
      return;
    }

    var sel = form.querySelector("#f-pendiente");
    var lineas = [
      "SOLICITUD DE EVALUACIÓN DE FAENA — Forestal Robur SpA",
      "Nombre o empresa: " + nombre,
      f.get("predio") ? "Predio o fundo: " + f.get("predio") : "",
      f.get("comuna") ? "Comuna: " + f.get("comuna") : "",
      f.get("superficie") ? "Superficie aprox.: " + f.get("superficie") + " ha" : "",
      f.get("pendiente") ? "Pendiente estimada: " + sel.options[sel.selectedIndex].textContent.trim() : "",
      f.get("detalle") ? "Qué necesita: " + f.get("detalle") : ""
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
      aviso.textContent = "La solicitud está lista, pero faltan los datos de contacto de la empresa en assets/js/datos.js.";
    }
  });
})();

})();
