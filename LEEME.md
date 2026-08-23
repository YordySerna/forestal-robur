# Forestal Robur SpA — cosecha forestal en pendiente, Loncoche

Sitio estático de una sola página. HTML + CSS + JavaScript clásico, patrón IIFE.
**Sin build, sin npm, sin frameworks y sin librerías.** Google Fonts es la
única petición externa.

```
index.html            todo el contenido, escrito en el HTML
assets/css/estilo.css el sistema de diseño completo
assets/js/datos.js    ← LOS DATOS DE LA EMPRESA. Es el único archivo a editar.
assets/js/main.js     el plano de ingeniería, el revelado y el formulario
imagenes/             fotos de faena optimizadas + logo
serve.ps1             servidor local para previsualizar
```

## La idea: ingeniería de cosecha

La referencia no es un documento de archivo: es **la ficha técnica de una
máquina cara y la señalética de una faena bien gestionada**. Superficie
oscura de acero, tipografía condensada de letrero, cifras grandes con unidad
chica, fotos a sangre y un plano de ingeniería como pieza firma.

> **Nota de historia:** la versión anterior era un "expediente de faena"
> —papel crema, folios numerados, membrete, serifas de imprenta—. Se
> descartó entera: la metáfora del documento antiguo mandaba sobre el
> negocio, y una empresa que levanta torres en laderas de 30 grados
> necesita hablar de acero y cable, no de papeleo. Si alguien piensa en
> volver a esa dirección, el motivo por el que se fue está acá escrito.

### Las secciones

| Sección | Qué hace |
|---|---|
| Portada | Foto a sangre, titular macizo, cuatro cifras duras |
| El sistema | **La pieza firma**: el plano de la línea de cable |
| Operaciones | Las siete operaciones del ciclo, en grilla técnica |
| Plancha | Foto a sangre de la cancha en el cerro |
| Parque | Fichas de máquina: torre, Doosan, skidder, Bell |
| Cuadrilla | Los oficios: motosierristas, estroberos, calibradores, operadores |
| Terreno | Cuidado ambiental, con foto a sangre |
| Seguridad | Cumplimiento, con las casillas que se timbran al entrar |
| Trayectoria | Seis años, empresa familiar de Loncoche |
| Contacto | El formulario arma la solicitud y sale por WhatsApp |

### La pieza firma: el plano

La sección **El sistema** no lleva una ilustración decorativa: lleva un
**corte de ladera dibujado como plano de ingeniería** en SVG, con la torre
en la cancha, el cable tendido hasta el anclaje, el carro subiendo un fuste
suspendido, el rayado de talud, las cotas en mono y el triángulo de
pendiente. Explica en una pantalla por qué esta empresa entra donde otras
no. Ningún contratista de la zona tiene esto en su web.

El relieve se genera con **PRNG de semilla fija** (mulberry32): es siempre
el mismo cerro, en toda visita y en todo navegador. Un plano que cambia
entre recargas no es un plano, es un fondo animado.

La pendiente del dibujo **está calculada**, no dibujada a ojo: cae 330 px en
938 px de avance, que da sobre 30% — exactamente el umbral que el texto
declara y que justifica todo el sistema.

## Tipografía — el trío y su porqué

| Familia | Trabajo |
|---|---|
| **Big Shoulders Display** | Titulares. Condensada de señalética urbana (diseñada para letreros de Chicago): aguanta mayúsculas enormes y tiene peso de placa de máquina. |
| **Saira** | Cuerpo y navegación. Sans técnica de proporciones estrechas: acompaña sin pelearle a la display. |
| **Azeret Mono** | Toda cifra, cota, unidad y etiqueta. Números tabulares, que es lo que pide una ficha técnica. |

Display expresiva + texto neutro + mono de datos es el esquema de un
catálogo de maquinaria. No se usa ninguna de las fuentes ya gastadas en las
demos de `devs/demos/` ni ninguna de la lista vetada del encargo.

## Paleta

Cada ratio está **medido** contra su fondo real con la fórmula WCAG, no
estimado. Todos los pares de texto del sitio pasan AA (el más ajustado va
en 4,8:1).

| Token | Color | Uso |
|---|---|---|
| `--carbon` | `#0E1113` | fondo base |
| `--acero` / `--acero-2` | `#161A1D` / `#1D2327` | superficies elevadas |
| `--borde` | `#2B3339` | línea estructural |
| `--pino` | `#16301F` | bloque verde de énfasis |
| `--helecho` | `#7FC08E` | acento verde — 9,2:1 |
| `--niebla` | `#EAEFF1` | texto principal — 16,1:1 |
| `--ambar` | `#F2A93B` | cifras y CTA — 10,3:1 |
| `--naranja` | `#E1701A` | el naranja real de la maquinaria |

## Ver el sitio localmente

```bash
powershell -NoProfile -ExecutionPolicy Bypass -File serve.ps1 -Port 8771
```

## Lo que falta: se edita SOLO en `assets/js/datos.js`

**Mientras un dato esté vacío (`""`), la página no lo inventa: lo muestra
como POR CONFIRMAR.** Al abrir la página, la consola (F12) lista lo que
falta.

| Dato | Estado | Para qué |
|---|---|---|
| WhatsApp | falta | el canal principal; el formulario sale por ahí |
| Teléfono | falta | como se marca |
| Correo | falta | respaldo del formulario |
| RUT | falta | va en el pie |
| Dotación | falta | **cifra grande de la portada** |
| Producción mensual (m³) | falta | cifra de capacidad |
| Hectáreas al año | falta | cifra de capacidad |
| Trayectoria | falta | 3–5 hitos con año |

Ya confirmados y escritos: **Loncoche**, **La Araucanía**, **6 años**,
y el parque y los oficios que se listan en el sitio.

**Nada afirma datos que no tenemos**: ni clientes, ni certificaciones
propias. FSC y CERTFOR/PEFC se mencionan como estándares de los mandantes
bajo los cuales se trabaja, que es lo correcto y verificable.

## Decisiones que conviene no deshacer

**Del armado**

- La **portada entra con `@keyframes` CSS puros**, nunca con observer ni
  `requestAnimationFrame`: una pestaña abierta en segundo plano no corre
  rAF, y la portada tiene que estar pintada cuando el visitante llegue.
- Los estados ocultos cuelgan de `html.js`, que un **rescate de 4 s** quita
  si `main.js` no llega. `main.js` cancela ese temporizador al arrancar.
  Probado renombrando el archivo: la página se lee entera.
- El revelado al scroll tiene **dos resguardos**: lo que ya está en pantalla
  al cargar se muestra sin esperar al observer, y hay un barrido a los 6 s
  para lo que quedara oculto por cualquier motivo.
- `isolation: isolate` en `.portada` **no es decorativo**: crea el contexto
  de apilamiento que mantiene la foto (z-index −2) dentro de la portada. Sin
  él, un hijo con z-index negativo se propaga al contexto raíz y queda
  tapado por el fondo opaco del body — el hero se ve negro.
- El recorte que permite la entrada "desde abajo" del titular **también
  corta los acentos**. Por eso `.linea` lleva `padding-top` con margen
  negativo que lo compensa: sin ese colchón, la Á de MÁQUINA pierde la
  tilde.
- El tope del `--paso-5` está **medido** contra Big Shoulders real: la línea
  más larga del titular ocupa ≈0,42 em por carácter. Si se cambia el texto
  del titular, hay que volver a medir — una línea que se parte en dos rompe
  el recorte de la animación.
- El carro del plano **se posiciona al construir**, antes de cualquier
  animación. Sin eso queda en el origen del SVG (una marca naranja suelta en
  la esquina) hasta el primer frame, y ese frame no llega nunca si la
  pestaña se abrió en segundo plano.

**Del logo**

- El arte original del cliente es trazo oscuro sobre papel crema, sin
  transparencia. En el sitio va **invertido**: la luminancia se convierte en
  canal alfa y el trazo pasa a blanco, así el logo hereda el fondo en vez de
  meter un parche claro en medio de una superficie de acero.
- La inversión conserva el antialias del borde porque interpola entre dos
  umbrales de luminancia (200 y 70) en vez de recortar en seco. Si se
  recorta con un solo umbral, el contorno queda con diente de sierra.
- El **favicon es la excepción**: va blanco sobre carbón sólido, no sobre
  transparente. En una pestaña de navegador en modo claro, un logo blanco
  transparente desaparece.
- El arte original sin invertir queda en `imagenes/originales/`.

**De accesibilidad**

- El carro es un bucle continuo de 22 s, así que **tiene botón de pausa**
  (WCAG 2.2.2). Se crea desde JS: sin JS no hay animación que pausar y un
  botón muerto sería peor que ninguno.
- `color-scheme: dark` en `<html>`: sin eso la barra de scroll y el
  desplegable del formulario salen claros y rompen la superficie.
- El titular **no lleva ninguna palabra resaltada** en el color de acento —
  es el cliché número uno de landing. La fuerza la da el peso de la
  condensada. El ámbar se guarda para cifras y botones, donde significa algo.
- Los inputs usan 16 px como mínimo: menos que eso hace que iOS haga zoom
  solo al enfocarlos.
- La navegación en móvil **se arrastra**, no se colapsa en hamburguesa: para
  seis destinos cortos es más rápido que abrir un menú.

**De movimiento**

- Solo se anima `transform` y `opacity`.
- El parallax de la portada usa scroll-driven CSS **dentro de `@supports`**:
  donde no hay soporte queda quieto, que es un fallback digno.
- Con `prefers-reduced-motion` se apaga el parallax y el carro, y la portada
  se **funde** en vez de desplazarse: apagar todo deja la página con aire de
  error.
- Nunca `background-attachment: fixed` (roto en móvil).

## Verificado antes de entregar

- Consola limpia, sin 404 propios.
- 375 px: sin scroll horizontal, nav usable, ningún toque bajo 44 px.
- Contrastes medidos con `getComputedStyle` en 18 pares: todos pasan AA.
- Con `main.js` renombrado: la página se lee completa, nada queda invisible.
- Teclado: skip link visible al enfocar, foco ámbar de 2 px, 21 focables sin
  ninguno sin nombre accesible.
- El formulario arma el mensaje de WhatsApp con los datos de `datos.js`
  (probado con un número de prueba, después revertido).
- Peso sin fotos: **108 KB**.
