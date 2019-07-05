# FontFace interface - Polyfill
Es un polyfill para la interfaz FontFace, que se usa para cargar las tipografías webs por Javascript.

Actualmente solo tiene un método que es el 'load', y sirve para realizar la carga de la fuente.

Este polyfill mantiene la sintaxis exacta de la interfaz nativa FontFace, así que no hay ningún problema que se use exactamente igual.

```js
var omnes = new FontFace('Omnes', "url('./fonts/omnes-semibold.ttf') format('truetype'), url('./fonts/omnes-semibold.woff2') format('woff2'), url('./fonts/omnes-semibold.woff') format('woff')", { style: 'normal', weight: 600 });
```

## Ejemplos de modos de uso
```js

/* Modo simple con .then y .catch separados */
omnes.load()
   .then(function (fontObj) {
      document.fonts.add(fontObj);
   })
   .catch(function (err) {
      console.log(err);
   });


/* Modo solo con .then y el catch dentro del él */
omnes.load()
   .then(function (fontObj) {
      document.fonts.add(fontObj);
   }, function (err) {
      console.log(err);
   });


/* Adjunto ala promesa .loaded y luego cargo la fuente */
omnes.loaded.then(function (objFont) {
   document.fonts.add(objFont);
}, function (err) {
   console.log(err);
});
omnes.load();
```

## Navegadores compatibles

IE11+, Chrome, Firefox, Safari, Opera

## Caracteristicas
- Carga paralela de tipografías
- Usa el localStorage como caché.
- Simulación de una respuesta tipo promesa (usando el .then y .catch).

Por el momento es todo lo que trae, más adelante agregaré más caracteristicas, como más métodos y eventos.

Licencia
----

MIT