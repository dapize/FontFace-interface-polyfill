(function () {
  'use strict';
  
  var FFUtils = {

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

    cache: function (name, obj) {
      var ffLocal = localStorage.getItem('FontFace');
      if (obj === undefined) {
        if (ffLocal !== null) {
          var ffObj = JSON.parse(ffLocal);
          var fontsLoaded = ffObj.loaded;
          if (fontsLoaded) {
            var nFontsLoaded = fontsLoaded.length;
            var fontSaved = null;
            for (var iFont = 0; iFont < nFontsLoaded; iFont++) {
              var cFont = fontsLoaded[iFont];
              if (cFont.family === name) {
                fontSaved = cFont;
                break;
              }
            }
            return fontSaved;
          } else {
            return null;
          }
        } else {
          return null;
        }
      } else {
        if (ffLocal === null) {
          localStorage.setItem('FontFace', JSON.stringify({loaded: [obj]}))
        } else {
          var ffObj = JSON.parse(ffLocal);
          ffLocal.loaded.push(obj);
          localStorage.setItem('FontFace', JSON.stringify(ffObj));
        }
      }
    },

    load: function (obj, cb) {
      var _this = this;
      var fontSaved = this.cache(obj.family);
      if (fontSaved === null) {
        var xhr = new XMLHttpRequest();
        var blob;
        var fileReader = new FileReader();
        xhr.open('GET', obj._toLoad);
        xhr.responseType = 'arraybuffer';
        xhr.addEventListener('readystatechange', function(e) {
          switch (xhr.readyState) {
            case 3:
              obj.status = 'loading';
              break;
            case 4:
              if (xhr.status === 200) {
                obj.status = 'loaded';
                blob = new Blob([xhr.response], {type: 'application/octet-binary'});
                fileReader.onload = function (evt) {
                  obj._encoded = evt.target.result;
                  _this.cache(obj.family, obj);
                  cb(obj);
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
      } else {
        cb(fontSaved);
      }
    },

    add: function (fontObj) {
      var styleElement = document.createElement('style');
        styleElement.type = 'text/css';
        

        var styles = [];
        var wordsIgnore = ['_encoded', '_toLoad', 'loaded', 'status'];
        Object.keys(fontObj).forEach(function (name) {
          var valStyle = fontObj[name];
          if (name === 'unicodeRange') {
            styles.push('unicode-range: ' + valStyle);
          } else if (name === 'featureSettings') {
            styles.push('font-feature-settings: ' + valStyle);
          } else {
            if (wordsIgnore.indexOf(name) === -1) {
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
        /*
        if (urlBlob.indexOf('http') === -1) {
          urlBlob = urlBlob.replace('blob:', '');
          var port = location.port;
          if (port !== '') port = ':' + port;
          urlBlob = 'blob:' + location.protocol + '//' + location.hostname + port + '/' + urlBlob.toLowerCase();
        }
        */
        styles.push('src: url("' + urlBlob + '")')
        var styleFont = '@font-face {' + styles.join(';') + '}';
        var styleSheet = styleElement.styleSheet;
        console.log(styleFont);
        styleSheet ? styleSheet.cssText = styleFont : styleElement.innerHTML = styleFont;
        document.head.appendChild(styleElement);
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
    var config = settings ? settings : {};
    this.family = family;
    this.featureSettings = config['font-font-feature-settings'] || 'normal';
    this.stretch = config['font-stretch'] || 'normal';
    this.style = config['font-style'] || 'normal';
    this.unicodeRange = config['unicode-range'] || 'U+0-10FFFF';
    this.variant = config['font-variant'] || 'normal';
    this.weight = config['font-weight'] || 'normal';
    this.loaded = 'pending';
    this.status = 'unloaded';
    // Load
    this._toLoad = FFUtils.getUrl(fonts);
  }

  FontFace.prototype.load = function () {
    var _this = this;
    return {
      then: function (cb) {
        FFUtils.load(_this, cb)
      }
    }
  }

  if (typeof window.FontFace2 === 'undefined') {
    window.FontFace2 = FontFace;
    document.fonts2 = {
      add: FFUtils.add
    };
  }
}());