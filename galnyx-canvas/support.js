/* GALNYX — runtime mínimo para servir los artboards como sitio estático.
 *
 * Los .dc.html se escribieron para el editor de canvas, que trae su propio
 * runtime. Fuera de él, dos páginas (Carrito y CheckoutPago) quedarían
 * mostrando "{{item.name}}" en pantalla y el resto lanzaría un error al
 * evaluar "class Component extends DCLogic". Este archivo cubre justo eso y
 * nada más: no es un framework, es el mínimo para que el sitio publicado se
 * vea terminado.
 *
 * Qué implementa, y solo eso:
 *   - DCLogic: state + setState + render.
 *   - <sc-for list="{{lista}}" as="x">    repite su contenido por cada item.
 *   - <sc-if value="{{cond}}">            muestra u oculta su contenido.
 *   - {{expresion}}                       sustituye en texto y en atributos.
 *   - onClick="{{fn}}"                    engancha la función real.
 *
 * Si no hay <script data-dc-script> en la página, no hace absolutamente nada:
 * las otras 32 páginas son HTML estático y no lo necesitan.
 */
(function () {
  'use strict';

  window.DCLogic = function DCLogic(props) { this.props = props || {}; this.state = {}; };
  DCLogic.prototype.setState = function (parcial) {
    for (var k in parcial) if (Object.prototype.hasOwnProperty.call(parcial, k)) this.state[k] = parcial[k];
    if (this._pintar) this._pintar();
  };
  DCLogic.prototype.renderVals = function () { return {}; };

  /* La plantilla original se guarda intacta antes del primer pintado: cada
     re-render parte de ella y no de lo ya sustituido, que es lo que haría que
     los {{...}} desaparecieran para siempre tras el primer clic. */
  function resolver(expr, vals, ambito) {
    var ruta = expr.trim().split('.');
    var v = Object.prototype.hasOwnProperty.call(ambito, ruta[0]) ? ambito[ruta[0]] : vals[ruta[0]];
    for (var i = 1; i < ruta.length && v != null; i++) v = v[ruta[i]];
    return v;
  }

  var LLAVES = /\{\{([^}]+)\}\}/g;

  function pintarNodo(nodo, vals, ambito) {
    // sc-for: se expande antes de sustituir, para que cada copia tenga su item
    var repes = nodo.querySelectorAll ? nodo.querySelectorAll('sc-for') : [];
    Array.prototype.slice.call(repes).forEach(function (rep) {
      var lista = resolver((rep.getAttribute('list') || '').replace(/[{}]/g, ''), vals, ambito) || [];
      var alias = rep.getAttribute('as') || 'item';
      var frag = document.createDocumentFragment();
      lista.forEach(function (item) {
        var copia = rep.cloneNode(true);
        var hijo = document.createElement('div');
        hijo.style.display = 'contents';
        while (copia.firstChild) hijo.appendChild(copia.firstChild);
        var sub = Object.create(ambito);
        sub[alias] = item;
        pintarNodo(hijo, vals, sub);
        frag.appendChild(hijo);
      });
      rep.parentNode.replaceChild(frag, rep);
    });

    // sc-if
    var condes = nodo.querySelectorAll ? nodo.querySelectorAll('sc-if') : [];
    Array.prototype.slice.call(condes).forEach(function (c) {
      var ok = resolver((c.getAttribute('value') || '').replace(/[{}]/g, ''), vals, ambito);
      if (ok) {
        var caja = document.createElement('span');
        caja.style.display = 'contents';
        while (c.firstChild) caja.appendChild(c.firstChild);
        pintarNodo(caja, vals, ambito);
        c.parentNode.replaceChild(caja, c);
      } else {
        c.parentNode.removeChild(c);
      }
    });

    // atributos y texto
    var todos = nodo.querySelectorAll ? [nodo].concat(Array.prototype.slice.call(nodo.querySelectorAll('*'))) : [nodo];
    todos.forEach(function (el) {
      if (!el.getAttribute) return;
      Array.prototype.slice.call(el.attributes || []).forEach(function (attr) {
        if (attr.value.indexOf('{{') === -1) return;
        if (attr.name.toLowerCase() === 'onclick') {
          var fn = resolver(attr.value.replace(/[{}]/g, ''), vals, ambito);
          el.removeAttribute('onClick');
          el.removeAttribute('onclick');
          if (typeof fn === 'function') {
            el.style.cursor = 'pointer';
            el.addEventListener('click', function (e) { e.preventDefault(); fn(); });
          }
          return;
        }
        el.setAttribute(attr.name, attr.value.replace(LLAVES, function (_, e) {
          var v = resolver(e, vals, ambito);
          return v == null ? '' : String(v);
        }));
      });
    });

    var paseo = document.createTreeWalker(nodo, NodeFilter.SHOW_TEXT, null);
    var textos = [];
    while (paseo.nextNode()) if (paseo.currentNode.nodeValue.indexOf('{{') !== -1) textos.push(paseo.currentNode);
    textos.forEach(function (t) {
      t.nodeValue = t.nodeValue.replace(LLAVES, function (_, e) {
        var v = resolver(e, vals, ambito);
        return v == null ? '' : String(v);
      });
    });
  }

  function arrancar() {
    /* `class Component extends DCLogic` en un <script> clásico deja un binding
       léxico global: se ve como identificador pero NO como window.Component. */
    var C = null;
    try { C = Component; } catch (e) { C = null; }
    if (typeof C !== 'function' && typeof window.Component === 'function') C = window.Component;
    if (typeof C !== 'function') return;
    var raiz = document.querySelector('x-dc') || document.body;
    var plantilla = raiz.innerHTML;
    var comp = new C({});
    comp._pintar = function () {
      raiz.innerHTML = plantilla;
      pintarNodo(raiz, comp.renderVals() || {}, {});
    };
    comp._pintar();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar);
  else arrancar();
})();
