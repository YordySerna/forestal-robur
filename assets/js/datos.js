/* ============================================================================
   DATOS DE FORESTAL ROBUR SpA — el único archivo que hay que editar.
   ----------------------------------------------------------------------------
   Mientras un dato esté vacío (""), la página NO lo inventa: lo marca como
   POR CONFIRMAR o esconde el canal. Al abrir la página, la consola del
   navegador (F12) lista lo que todavía falta.

   Un dato de relleno es peor que ninguno: Google lo indexa y después
   cuesta mucho sacarlo.
   ============================================================================ */
window.DATOS_ROBUR = {

  /* ── CONTACTO ─────────────────────────────────────────────────────────── */

  /* WhatsApp con código de país, solo números. Ej: "56912345678" */
  whatsapp: "",

  /* Teléfono como se marca. Ej: "+56 9 1234 5678" */
  telefono: "",

  /* Correo de contacto. Ej: "contacto@forestalrobur.cl" */
  correo: "",

  /* RUT de la empresa como se imprime. Ej: "77.123.456-7" */
  rut: "",

  /* ── IDENTIDAD ────────────────────────────────────────────────────────── */

  /* Ciudad base de la empresa. */
  comuna: "Loncoche",

  /* Región que se declara. */
  region: "Región de La Araucanía",

  /* Años de operación. Se usa como cifra grande en la portada: va como
     número, sin texto. Si se deja vacío, la cifra desaparece sola. */
  anios: "6",

  /* ── CIFRAS DE CAPACIDAD ──────────────────────────────────────────────────
     Estas son las que un mandante mira primero. Las que están vacías se
     muestran como POR CONFIRMAR y NO se inventan: cuando la familia entregue
     el número real, se escribe aquí y aparece en la portada y en la ficha.  */

  /* Dotación total en faena (personas). Ej: "24" */
  dotacion: "",

  /* Producción mensual en metros cúbicos. Ej: "4.500" */
  produccionMensual: "",

  /* Superficie cosechada al año, en hectáreas. Ej: "180" */
  hectareasAnio: "",

  /* ── TRAYECTORIA ──────────────────────────────────────────────────────────
     Hitos reales, uno por línea. Se muestran como línea de tiempo.
     Ejemplo:
       { anio: "2020", texto: "Primera cuadrilla propia de motosierristas." },
       { anio: "2023", texto: "Llega la torre de madereo." },
     Mientras esté vacía, la sección muestra filas por confirmar. */
  trayectoria: []
};
