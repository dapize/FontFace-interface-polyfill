# FontFace interface - Polyfill
Es un polyfill para la interfaz FontFace, que se usa para cargar las tipografías webs por Javascript.

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

### Métodos disponibles
- document.fonts.add() : Sirve para agregar la tipografía cargada.

```javascript
/* Ejemplo tomando como base el ejemplo de modo uso*/
omnes.load().then(function (fontObj) {
   document.fonts.add(fontObj);
};
```

- document.fonts.forEach() : Sirve para recorrer las tipografías añadidas.

```javascript
/* Ejemplo tomando como base el ejemplo de modo uso*/
document.fonts.forEach(function (font) {
   console.log('Nombre: ' + font.family);
});
```

- document.fonts.delete() : Sirve para borrar una tipografía previamente agregada

```javascript
/* Ejemplo tomando como base el ejemplo de modo uso*/
document.fonts.delete(omnes)
```

- document.fonts.clear() : Sirve para borrar todas las tipografías agregadas.

```javascript
/* Ejemplo tomando como base el ejemplo de modo uso*/
document.fonts.clear();
```



### Getters
- document.fonts.size : Devuelve el número de tipografías agregadas.
- document.fonts.onloading : Devuelve la función guardada en el evento 'onloading'.
- document.fonts.onloadingdone : Devuelve la función guardada en el evento 'onloadingdone'.
- document.fonts.onloadingerror : Devuelve la función guardada en el evento 'onloadingerror'.

### Setters
- document.fonts.onloading : Asigna una función al evento 'onloading'.
- document.fonts.onloadingdone : Asigna una función al evento 'onloadingdone'.
- document.fonts.onloadingerror : Asigna una función al evento 'onloadingerror'.

```javascript
document.fonts.onloading = function (ffset) {
   console.log('Cargando... ', ffset);
};

document.fonts.onloadingdone = function (ffset) {
   console.log('¡Cargada! ', ffset);
};

document.fonts.onloadingerror = function (ffset) {
   console.log('Error al cargar ', ffset);
};
```

---

Por el momento es todo lo que trae, más adelante agregaré más caracteristicas, como más métodos y eventos.

Licencia
----

MIT