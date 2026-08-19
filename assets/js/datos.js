/* ============================================================================
   DATOS DE FORESTAL ROBUR SpA — el único archivo que hay que editar.
   ----------------------------------------------------------------------------
   Mientras un dato esté vacío (""), la página NO lo inventa: lo estampa
   como [POR COMPLETAR] o esconde el canal. Al abrir la página, la consola
   del navegador (F12) lista lo que todavía falta.

   Un dato de relleno es peor que ninguno: Google lo indexa y después
   cuesta mucho sacarlo.
   ============================================================================ */
window.DATOS_ROBUR = {

  /* WhatsApp con código de país, solo números. Ej: "56912345678" */
  whatsapp: "",

  /* Teléfono como se marca. Ej: "+56 9 1234 5678" */
  telefono: "",

  /* Correo de contacto. Ej: "contacto@forestalrobur.cl" */
  correo: "",

  /* RUT de la empresa como se imprime. Ej: "77.123.456-7" */
  rut: "",

  /* Región/zona que se declara en el membrete. Si queda vacío se
     mantiene "Sur de Chile". Ej: "Región de La Araucanía" */
  region: "",

  /* Bitácora de familia: hitos reales, uno por línea.
     Ejemplo:
       { anio: "2009", texto: "Primera cuadrilla propia de motosierristas." },
       { anio: "2015", texto: "Llega la primera torre de madereo." },
     Mientras esté vacía, el folio 04 muestra filas estampadas. */
  bitacora: []
};
