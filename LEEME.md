# Forestal Robur SpA — cosecha forestal, sur de Chile

Sitio estático de una sola página. HTML + CSS + JavaScript clásico, patrón IIFE.
**Sin build, sin npm, sin frameworks y sin librerías de terceros.**

```
index.html            todo el contenido, escrito en el HTML
assets/css/estilo.css el sistema de diseño completo
assets/js/datos.js    ← LOS DATOS DE LA EMPRESA. Es el único archivo a editar.
assets/js/main.js     partículas del bosque, figuras generativas, entintado…
imagenes/             las fotos de faena, optimizadas para web
imagenes/originales/  los archivos tal como llegaron (NO se suben al repo)
serve.ps1             servidor local para previsualizar
```

## La idea

El sitio es un **expediente de faena dentro del bosque**.

La **portada es fotográfica**: la torre de madereo con el valle detrás,
bajada de tono y bajo un velo que la funde con el bosque, y encima el
membrete y el titular estampado. De ahí abajo, el fondo es bosque nocturno
con **partículas vivas** —polen a la deriva, agujas de pino cayendo y cuatro
motas de luz ámbar— dibujadas a mano en un canvas fijo. Sobre ese bosque se
apoyan **hojas de papel verde-niebla**: los folios de lectura larga, que
nunca llegan al borde de la pantalla para que el canal de bosque siga
visible a los lados. Los folios de impacto no llevan hoja: son el bosque
mismo y las partículas se ven a través del texto.

El ritmo del documento:

| | Folio | Fondo |
|---|---|---|
| 00 | Portada y membrete | **foto de faena** |
| — | Marquesina de inventario | franja savia |
| 01 | La faena completa | hoja |
| — | **Lámina 01** (plancha ancha) | foto de faena |
| 02 | Pendiente (torre y cable) | bosque profundo, con lluvia |
| 03 | Parque de maquinaria | hoja |
| A | **Anexo: pliego fotográfico** | bosque |
| 04 | Bitácora de familia | hoja |
| — | Franja de estiba (divisor) | bosque |
| 05 | Seguridad y estándares | hoja |
| 06 | Contacto y colofón | bosque |

No hay "secciones de landing": hay **folios numerados** abiertos por reglas
dobles de formulario, metadatos en mono al margen y **figuras técnicas**
(FIG. 01, FIG. 02…). Un mandante contrata contratistas con los papeles al
día: una página que parece un expediente bien llevado vende eso antes de la
primera frase.

- **El logo** (pino + hoja + sierra) va impreso en su crema original dentro
  de la celda del membrete: es la etiqueta del expediente. No se recolorea
  ni se pone a girar — reemplazó a un sello SVG inventado que giraba, y con
  la marca de verdad eso sobraba. El favicon es el mismo símbolo recortado.
- **Lámina 01** — plancha ancha de borde a borde entre el folio 01 y el 02.
  Es la única pieza que rompe el ancho máximo del documento, y por eso
  funciona: hace de respiro entre la hoja clara y el bosque, y anuncia la
  pendiente. La leyenda va DENTRO, sobre una banda de bosque, para que la
  foto no necesite un pie afuera que la separe del documento.
- **El revelado**: las fotos no aparecen de golpe ni se deslizan — se
  revelan, como una copia saliendo del líquido: un fundido de 700 ms y un
  acercamiento mínimo, colgados del mismo observer que entinta los folios
  (cero JavaScript nuevo). Las seis del pliego van escalonadas.
- **FIG. 02** — perfil de ladera con torre de madereo: el cable parte caído
  y **se tensa** al entrar a la vista (resorte amortiguado); después el
  carro recorre la catenaria — sube cargado con su fuste, vuelve vacío.
- **Vetas de madera** en los frames del parque: líneas deformadas por nudos
  gaussianos, en canvas dibujado una sola vez.
- **Franja de estiba**: las testas de las trozas como divisor.
- Lluvia fina solo en el folio de pendiente, a opacidad mínima.
- Tipografía: **Besley 900** (titulares), **Piazzolla** (cuerpo, fundición
  sudamericana) e **IBM Plex Mono** (todo metadato). Nada más.

Todo el movimiento corre en **un solo requestAnimationFrame** global que se
pausa con la pestaña oculta y fuera de viewport. Con `prefers-reduced-motion`
las partículas se dibujan **una vez y quedan quietas** (un fondo vacío se ve
roto, no accesible) y el documento llega entero y pintado. Sin JavaScript
también se ve completo, sobre el verde profundo.

## La paleta

Todos los tokens están arriba de `estilo.css`. Cada contexto redefine sus
variables (`--texto`, `--linea`, `--acento`…), así el mismo componente sirve
sobre bosque y sobre hoja sin duplicar reglas.

| Token | Color | Uso |
|---|---|---|
| `--bosque` | `#0C1611` | fondo global |
| `--bosque-2` | `#101C16` | celdas y cajas sobre el bosque |
| `--hoja` | `#EDF0E6` | papel de los folios de lectura |
| `--tinta` | `#14211A` | texto sobre hoja (14,5:1) |
| `--niebla` | `#E7EFE6` | texto sobre bosque (15,9:1) |
| `--helecho` | `#8FBF9A` | acento claro sobre bosque (9,1:1) |
| `--pino` | `#2F5A3C` | verde de texto sobre hoja (6,9:1) |
| `--savia` | `#E0A94A` | ámbar de acento (8,9:1) |
| `--faena` | `#E1701A` | naranja de señal gráfica |

## Ver el sitio localmente

```bash
powershell -NoProfile -ExecutionPolicy Bypass -File serve.ps1 -Port 8791
```

Después abrir `http://localhost:8791`. Las rutas son relativas: también
funciona con doble clic en `index.html`.

## Las fotos

Las diez que llegaron por WhatsApp están puestas y renombradas por lo que
muestran. Los originales quedan en `imagenes/originales/`, que está en el
`.gitignore`: al repo solo suben las versiones web.

| Archivo | Dónde aparece |
|---|---|
| `logo.png` | membrete (folio 00) y colofón — recortado del arte original |
| `favicon.png` | pestaña del navegador — el símbolo, 64×64 |
| `hero-torre.jpg` | **fondo de la portada** — a resolución completa (1600 px) |
| `portada.jpg` | **Lámina 01**, la plancha ancha tras el folio 01 |
| `torre.jpg` | FIG. 03 — torre de madereo |
| `excavadora.jpg` | FIG. 04 — Doosan DX225LC-A |
| `trozos.jpg`→`trozas.jpg` | FIG. 06 — trozado a pauta |
| `faja.jpg` | Lámina A-01 — apertura de faja |
| `rumas.jpg` | Lámina A-02 — cancha y rumas |
| `volteo.jpg` | Lámina A-03 — volteo en ladera |
| `carguio.jpg` | Lámina A-04 — carguío y despacho |
| `niebla-1.jpg` | Lámina A-05 — la cancha sobre la niebla |
| `niebla-2.jpg` | Lámina A-06 — amanecer en faena |

**Falta una sola:** el **trineumático Bell** (FIG. 05). Ese frame quedó con
su veta generativa y el rótulo `[FOTO DEL BELL PENDIENTE]`. No se rellena
con otra máquina — un catálogo de equipos propios que muestra la máquina
equivocada es peor que uno que declara el hueco.

**Las fotos van a color.** La maquinaria es naranja de fábrica, el mismo
naranja de señal del sitio: pasarlas a duotono era regalar el único acento
que la faena ya trae puesto. El grade es mínimo (`saturate(.94)
contrast(1.04)`); el marco de 1px y la leyenda mono ponen el carácter de
documento, la foto pone la verdad.

### Cómo agregar o reemplazar una foto

Optimizar **siempre desde el original**, nunca desde un JPEG ya comprimido
(sumaría artefactos). Esta máquina no tiene ImageMagick ni encoder WebP: se
usa PowerShell + .NET y se normaliza todo a JPEG calidad 74, con el ancho
ajustado al tamaño real de despliegue (1000 px para las láminas del pliego,
1500 para la portada). Así la carga inicial de la página es de **~400 KB**:
lo único que baja de entrada es la portada, y el resto entra con
`loading="lazy"`.

Después de cambiar una foto hay que **actualizar `width` y `height`** en el
HTML con las medidas reales: son las que reservan el espacio y evitan que
el texto salte cuando la imagen carga.

Si el motivo queda fuera del recorte 3:2, se corrige con
`style="object-position: 32% 50%"` en el `<img>` — así está resuelta la
torre de la FIG. 03 y el amanecer de la A-06.

Y el `alt` se escribe de verdad: "estrobero enganchando un fuste al carro",
no "foto de faena".

## Lo que falta: se edita SOLO en `assets/js/datos.js`

**Mientras un dato esté vacío (`""`), la página no lo inventa: lo estampa
como `[POR COMPLETAR]`** — el estampado es parte del sistema de diseño, se ve
intencional, pero hay que llenarlo antes de repartir la dirección. Al abrir
la página, la consola del navegador (F12) lista lo que todavía falta.

| Dato | Estado | Cómo conseguirlo |
|---|---|---|
| WhatsApp | falta | número con código de país, ej. `56912345678` |
| Teléfono | falta | como se marca, ej. `+56 9 1234 5678` |
| Correo | falta | el que revisen de verdad |
| RUT | falta | el de la SpA, como se imprime |
| Región | falta | si queda vacío dice "Sur de Chile" |
| Bitácora de familia | falta | 3–5 hitos con año: primera faena, primera torre, etc. |

**Nada del contenido afirma datos que no tenemos**: ni años de experiencia,
ni clientes, ni certificaciones propias. FSC y CERTFOR/PEFC se mencionan
como estándares de los mandantes bajo los cuales se trabaja — eso es lo
correcto y verificable. Cuando la familia confirme datos duros, se agregan.

## Decisiones que conviene no deshacer

- **El fondo va en `<html>`, no en `<body>`**: el canvas de partículas vive
  en `z-index: 0` sobre el color y bajo el contenido, que va en `z-index: 1`.
  Si se le pone fondo al `body`, el bosque desaparece.
- Las partículas guardan su posición **normalizada (0–1)**: al cambiar el
  tamaño de la ventana no hay que recalcular nada. Pero **cambiar
  `canvas.width` limpia el canvas**, así que en modo quieto hay que volver
  a dibujar tras remedir — es exactamente lo que pasa al girar el teléfono.
- El canvas se mide con `clientWidth`, **no** con `window.innerWidth`: la
  ventana incluye la barra de scroll y el canvas no, y con innerWidth el
  respaldo queda estirado y las motas salen ovaladas.
- El bosque se queda quieto solo con `prefers-reduced-motion`, **no** con
  `sinAnim`: que la pestaña cargue en segundo plano es motivo para no
  animar el hero de entrada, no para dejar el fondo muerto.
- Las cotas de la FIG. 01 van **abajo a la izquierda**: el titular del hero
  se solapa con la figura a propósito, y una cota arriba le queda encima.
- Todo TEXTO naranja usa `--faena-ui` (3,5:1 sobre hoja) y solo en tamaño
  grande; sobre el bosque el texto de acento es savia o helecho, que pasan
  AA holgado.
- El titular sangra a la derecha a propósito (`overflow-x: clip` en el
  `body`); el mínimo del `clamp()` se midió en 375 px de ancho.
- Cero sombras, cero `border-radius`, cero gradientes suaves (excepciones
  medidas: la niebla del perfil, el velo de la foto de portada, y las rayas
  DURAS de la franja de peligro y la retícula de los marcos de foto).
- La **marquesina lleva el inventario dos veces** en el HTML: la segunda
  copia existe solo para que el `translateX` del loop sea continuo. Cuando
  la animación está apagada (reduced-motion, sin JS) esa copia **se
  esconde**, o se lee el inventario dos veces seguidas.
- La **Lámina 01** es 5:2 en escritorio y pasa a 3:2 bajo 700 px: una franja
  5:2 de 350 px de ancho es un timbre, no una lámina.
- El **fondo de la portada** es `position: absolute` (no `fixed`): tiene que
  scrollear con la portada, al contrario del canvas del bosque. Se estira a
  `100vw` aunque el folio esté centrado en 1440 px, porque un paisaje
  cortado en seco a media pantalla se lee como un error.
- **En móvil ese fondo NO cubre el folio completo**, solo una banda de 62vh:
  el hero mide ~1420 px de alto y la foto es panorámica, así que a `cover`
  quedaría recortada a una franja del 12% del cuadro — un zoom sin paisaje.
- El peso del velo del hero está **cargado a la izquierda**, que es donde
  vive el titular, y aliviado a la derecha, que es donde se ve el valle. Ahí
  está el truco de que el paisaje se vea y el texto igual se lea. Los
  bloques de texto sobre la foto (metadatos e intro) llevan su propia caja
  velada: el mono de 12 px no puede depender de lo que haya en el cielo.
- En el bloque de revelado, `filter` va **nombrado en la misma lista** de
  `transition`: ese selector es más específico que el `transition: filter`
  del hover del pliego y, sin nombrarlo, el hover cambiaría de golpe.
- **Un elemento con `clip-path` a área cero nunca dispara IntersectionObserver.**
  Se bloquea solo. Observar el contenedor, no el elemento recortado.
- No usar el atributo `hidden` esperando que gane: una regla CSS con
  `display` lo pisa. Ya está declarado `[hidden] { display: none !important }`.
