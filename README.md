# FontFace interface - Polyfill
Es un polyfill para la interfaz FontFace, que se usa para cargar las tipografías webs por Javascript.
Actualmente solo tiene un sólo método que es el 'load', y sirve para realizar la carga de la fuente, y es compatible a partir de IE10

Este polyfill mantiene la sintaxis exacta de la interfaz nativa FontFace, así que no hay ningún problema que se use exactamente igual, por ejemplo:

```js
var omnes = new FontFace('Omnes', "url('./fonts/omnes-semibold.ttf') format('truetype'), url('./fonts/omnes-semibold.woff2') format('woff2'), url('./fonts/omnes-semibold.woff') format('woff')", { style: 'normal', weight: 600 });
omnes.load().then(function (omnesFontFace) {
   document.fonts.add(omnesFontFace);
});
```

## Navegadores compatibles

IE10+, Chrome, Firefox, Safari, Opera

## Caracteristicas
- Carga en paralelo de las tipografías
- Usa el localStorage como caché.
- Simulación de una respuesta tipo promesa (usando el .then).

Por el momento es todo lo que trae, más adelante agregaré más caracteristicas, como más métodos y eventos.

Licencia
----

MIT