/* Rescate de la clase .js. Vivia en linea dentro del HTML; se movio a
   este archivo para poder declarar una CSP con script-src 'self', que
   bloquea todo script en linea. El comportamiento es identico.
   Va SIN defer y antes del CSS: tiene que correr antes del render. */
document.documentElement.classList.add('js');
window.rescate = setTimeout(function(){
  document.documentElement.classList.remove('js');
}, 4000);
