# Forestal Robur SpA — cosecha forestal, sur de Chile

Sitio estático de una sola página. HTML + CSS + JavaScript clásico, patrón IIFE.
**Sin build, sin npm, sin frameworks y sin librerías de terceros.**

```
index.html            todo el contenido, escrito en el HTML
assets/css/estilo.css el sistema de diseño completo del "expediente"
assets/js/datos.js    ← LOS DATOS DE LA EMPRESA. Es el único archivo a editar.
assets/js/main.js     figuras generativas, entintado, cable, odómetros, guía
imagenes/             las fotos de faena cuando lleguen (hoy está vacía)
serve.ps1             servidor local para previsualizar
```

## La idea

La página entera es un **expediente de faena**: mezcla de plano de
ingeniería, guía de despacho y catálogo de maquinaria de los 90. No hay
"secciones de landing": hay **folios numerados** (00–06) abiertos por reglas
dobles de formulario, metadatos en mono al margen y **figuras técnicas**
(FIG. 01, FIG. 02…) que hoy son dibujo generativo y mañana serán fotos sin
tocar el layout. Un mandante contrata contratistas con los papeles al día:
una página que parece un expediente bien llevado vende eso antes de la
primera frase.

- **FIG. 01** — sección de fuste: 28 anillos de crecimiento generados con
  semilla fija (siempre el mismo árbol), acotados como plano.
- **FIG. 02** — perfil de ladera con torre de madereo: el cable parte caído
  y **se tensa** al entrar a la vista (resorte amortiguado); después el
  carro recorre la catenaria — sube cargado con su fuste, vuelve vacío.
- **Vetas de madera** en los frames del parque: líneas deformadas por nudos
  gaussianos, en canvas dibujado una sola vez.
- **Franja de estiba**: las testas de las trozas como divisor, círculos
  empacados con sus anillos.
- Lluvia fina solo en el folio nocturno, a opacidad mínima.
- Tipografía: **Besley 900** (titulares), **Piazzolla** (cuerpo, fundición
  sudamericana) e **IBM Plex Mono** (todo metadato). Nada más.

Todo el movimiento corre en **un solo requestAnimationFrame** global que se
pausa fuera de viewport y con la pestaña oculta. Con `prefers-reduced-motion`
o si la pestaña carga en segundo plano, el documento llega **entero y
pintado**, sin animar. Sin JavaScript también se ve completo.

## Ver el sitio localmente

```bash
powershell -NoProfile -ExecutionPolicy Bypass -File serve.ps1 -Port 8791
```

Después abrir `http://localhost:8791`. Las rutas son relativas: también
funciona con doble clic en `index.html`.

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

## Cuando lleguen las fotos

Cada frame `FIG.` es un contrato de layout: proporción fija, borde de 1px,
leyenda numerada. La foto entra al mismo frame con la clase `fig--photo`
(duotono documental: escala de grises + multiply sobre verde pino), sin
tocar el layout:

```html
<figure class="fig fig--marco fig--photo">
  <div class="fig__lienzo">
    <img src="imagenes/torre.webp" alt="…" loading="lazy" decoding="async" width="1500" height="1000">
  </div>
  <figcaption class="fig__leyenda">FIG. 03 — TORRE EN FAENA, [LUGAR].</figcaption>
</figure>
```

Optimizar antes de subir: 1500 px de ancho máximo, WebP. Los originales del
teléfono se quedan en `imagenes/` y **no se suben al repo** si pesan mucho.

## Decisiones que conviene no deshacer

- El **naranja de señal** (#E1701A) sobre el papel #F2EDE1 da **2,75:1**
  (medido contra el papel, no contra blanco): solo sirve como elemento
  gráfico decorativo. Todo TEXTO naranja y todo indicador de foco usa el
  **naranja-ui** (#C9600F, 3,5:1), y solo en tamaño grande.
- En el **folio nocturno** el naranja solo aparece como punto gráfico del
  carro; el texto de acento usa ámbar (#D9A45B) y amarillo (#EBB10E), que
  sí pasan AA sobre #16211B.
- El titular sangra a la derecha a propósito (`overflow-x: clip` en el
  `body`); el mínimo del `clamp()` se midió en 375 px de ancho.
- Cero sombras, cero `border-radius`, cero gradientes (excepciones: la
  niebla del perfil y las rayas duras de la franja roja). Es un documento.
