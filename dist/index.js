(function () {
  'use strict';
  
  var FFMethods = {

    detectIE: function () {
      var ua = window.navigator.userAgent;
      var msie = ua.indexOf('MSIE ');
      if (msie > 0) {
        return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
      }
      var trident = ua.indexOf('Trident/');
      if (trident > 0) {
        var rv = ua.indexOf('rv:');
        return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
      }
      var edge = ua.indexOf('Edge/');
      if (edge > 0) {
        return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
      }
      return false;
    },

    getUrl: function (fonts) {
      if (fonts === undefined) return;
      var arrUrls = fonts.match(/url\(.*?\)/g);
      arrUrls.forEach(function (url, index) {
        url = url.replace(/'/g, '');
        arrUrls[index] = url.replace('url(', '').replace(')', '');
      });
      var fontsLength = arrUrls.length;
      var fontUrlToLoad;
      if (fontsLength === 1) {
        fontUrlToLoad = arrUrls[0];
      } else {
        var exForIE = ['woff', 'otf', 'ttf'];
        var exFont;
        var isIE = this.detectIE();
        var fontsJoin = arrUrls.join(',');
        for (var f = 0; f < fontsLength; f++) {
          var font = arrUrls[f];
          if (isIE) {
            exFont = font.substr(-4).replace('.', '');
            if (exForIE.indexOf(exFont) !== -1) {
              fontUrlToLoad = font;
              break;
            } else {
              if (f === fontsLength) {
                return console.log('no hay un formato de fuente compatible para cargarla en IE');
              }
            }
          } else {
            if (fontsJoin.indexOf('woff2') !== -1) {
              if (font.substr(-5) === 'woff2') {
                fontUrlToLoad = font
                break;
              }
            } else {
              fontUrlToLoad = font;
               break;
            }
          }
        }
      }
      return fontUrlToLoad;
    },

    keysToIgnore: ['_urlBlob', 'loaded', 'status'],

    add: function (fontObj) {
      var styles = [];
      var propsToIgnore = this.keysToIgnore.concat('_encoded', 'src');
      Object.keys(fontObj).forEach(function (name) {
        var valStyle = fontObj[name];
        if (name === 'unicodeRange') {
          styles.push('unicode-range: ' + valStyle);
        } else if (name === 'featureSettings') {
          styles.push('font-feature-settings: ' + valStyle);
        } else {
          if (propsToIgnore.indexOf(name) === -1) {
            if (name === 'family') valStyle = '\'' + valStyle + '\'';
            styles.push('font-' + name + ': ' + valStyle);
          }
        }
      }); 
      var byteCharacters = atob(fontObj._encoded.replace('data:application/octet-binary;base64,', ''));
      var byteNumbers = new Array(byteCharacters.length);
      var nByteCharacters = byteCharacters.length
      for (var i = 0; i < nByteCharacters; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
      var byteArray = new Uint8Array(byteNumbers);
      var blob = new Blob([byteArray], {type: 'application/octet-binary'});
      var urlBlob = URL.createObjectURL(blob);
      styles.push('src: url("' + urlBlob + '")')
      // styles.push('src: url("' + urlBlob.replace('blob:', 'blob:http://localhost:7885/') + '")')
      var styleFont = '@font-face {\n' + styles.join(';\n') + '\n}';
      var styleElement = document.createElement('style');
      styleElement.type = 'text/css';
      styleElement.styleSheet ? styleElement.styleSheet.cssText = styleFont : styleElement.innerHTML = styleFont;
      document.head.appendChild(styleElement);
      // console.log(styleElement);
    },

    cache: function (objFont) {
      var localFont = localStorage.getItem('FontFace');
      if (objFont.encoded) {
        var fontsObj = {};
        if (localFont !== null) fontsObj = JSON.parse(localFont);
        if (fontsObj[objFont.family] !== objFont.encoded) {
          fontsObj[objFont.family] = objFont.encoded;
          localStorage.setItem('FontFace', JSON.stringify(fontsObj));
        }
      } else {
        if (localFont === null) return false;
        var fountInCache = false;
        var fontsObj = JSON.parse(localFont);
        var fontInObj = fontsObj[objFont.family];
        if (fontInObj !== undefined) fountInCache = fontInObj;
        return fountInCache;
      }
    },

    load: function (obj, cb) {
      var _this = this;
      var fontSaved = this.cache(obj);
      if (fontSaved) {
        obj.encoded = fontSaved;
        obj.status = 'loaded';
        //cb(obj);
      } else {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', obj.src);
        xhr.responseType = 'arraybuffer';
        xhr.addEventListener('readystatechange', function(e) {
          switch (xhr.readyState) {
            case 3:
              obj.status = 'loading';
              break;
            case 4:
              if (xhr.status === 200) {
                obj.status = 'loaded';
                var blob = new Blob([xhr.response], {type: 'application/octet-binary'});
                var fileReader = new FileReader();
                fileReader.onload = function (evt) {
                  obj.encoded = evt.target.result;
                  _this.cache(obj);
                  //cb(obj);
                };
                fileReader.readAsDataURL(blob);
              } else {
                obj.status = 'error';
                return console.log('Ocurrió un error obteniendo la fuente desde ' + url);
              }
              break;
          }
        });
        xhr.send(null);
      }


    }

  }

  /**
   * Constructor del FontFace
   * @param {string} family Nombre de la tipografía
   * @param {string} fonts Lista de rutas de los fuentes web
   * @param {object} settings Configuraciones de la fuente.
   * @return {object} Configuraciones y métodos de la fuente a trabajar.
   */
  function FontFace (family, fonts, settings) {
    if (fonts === undefined) return console.log('No se determinó enlaces para las fuentes.');
    var config = settings || {};
    this.display = config.display || 'auto';
    this.family = family;
    this.featureSettings = config.featureSettings || 'normal';
    this.stretch = config.stretch || 'normal';
    this.style = config.style || 'normal';
    this.unicodeRange = config.unicodeRange || 'U+0-10FFFF';
    this.variant = config.variant || 'normal';
    this.weight = config.weight || 'normal';
    this.loaded = 'pending';
    this.status = 'unloaded';
    this.src = FFMethods.getUrl(fonts);
  }

  FontFace.prototype.load = function () {
    var _this = this;
    FFMethods.load(this);
    return {
      then: function (cb) {
        cb(_this);
      }
    }
  }

  if (typeof window.FontFace2 === 'undefined') {
    window.FontFace2 = FontFace;
    document.fonts2 = {
      add: FFMethods.add
    };
  }
}());