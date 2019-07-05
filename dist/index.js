(function () {
  'use strict';

  var DFMethods = {

    addBridge: function (fontObj) {
      if (fontObj.encoded) {
        this.add(fontObj);
      } else {
        fontObj.toAdd = true;
        FFMethods.load(fontObj);
      }
    },

    add: function (fontObj) {
      var styles = [];
      var propsToIgnore = ['urlBlob', 'loaded', 'status', 'catch', 'encoded', 'src'];
      Object.keys(fontObj).forEach(function (name) {
        var valStyle = fontObj[name];
        if (name === 'unicodeRange') {
          styles.push('unicode-range: ' + valStyle);
        } else if (name === 'featureSettings') {
          styles.push('font-feature-settings: ' + valStyle);
        } else {
          if (propsToIgnore.indexOf(name) === -1) {
            if (name === 'family') valStyle = '"' + valStyle + '"';
            styles.push('font-' + name + ': ' + valStyle);
          }
        }
      }); 
      var byteCharacters = atob(fontObj.encoded.replace('data:application/octet-binary;base64,', ''));
      var nByteCharacters = byteCharacters.length
      var byteNumbers = new Array(nByteCharacters);
      var i;
      for (i = 0; i < nByteCharacters; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
      var byteArray = new Uint8Array(byteNumbers);
      var blob = new Blob([byteArray], {type: 'application/octet-binary'});
      var urlBlob = URL.createObjectURL(blob);
      styles.push('src: url("' + urlBlob + '")')
      var styleFont = '@font-face {\n' + styles.join(';\n') + '\n}';
      var styleElement = document.createElement('style');
      styleElement.type = 'text/css';
      styleElement.styleSheet ? styleElement.styleSheet.cssText = styleFont : styleElement.innerHTML = styleFont;
      document.head.appendChild(styleElement);
    }
  }
  
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
      var urlClean;
      var urlSplitted;
      var objUrls = {};
      arrUrls.forEach(function (url, index) {
        urlClean = url.replace(/'/g, '').replace('url(', '').replace(')', '')
        urlSplitted = urlClean.split('.');
        objUrls[urlSplitted[urlSplitted.length - 1]] = urlClean
      });
      var fontUrlToLoad;
      if (this.detectIE()) {
        var exForIE = ['woff', 'otf', 'ttf'];
        var nExForIE = exForIE.length;
        var f;
        var currentFont;
        for (f = 0; f < nExForIE; f++) {
          var currentFont = objUrls[exForIE[f]];
          if (currentFont !== undefined) {
            fontUrlToLoad = currentFont;
            break;
          } else {
            if (f === (nExForIE - 1)) fontUrlToLoad = null;
          }
        }
      } else {
        if (objUrls.woff2 !== undefined) {
          fontUrlToLoad = objUrls.woff2;
        } else {
          if (objUrls.woff !== undefined) {
            fontUrlToLoad = objUrls.woff;
          } else {
            fontUrlToLoad = null;
          }
        }
      }
      return fontUrlToLoad;
    },
    
    cache: function (objFont) {
      if (objFont.src === null) {
        if (objFont.catch && !objFont.catchSended) {
          objFont.catchSended = true;
          return objFont.catch('Sin url de fuente válida para cargar');
        }
      } else {
        var urlSplitted = objFont.src.split('.');
        var exFont = urlSplitted[urlSplitted.length - 1];
        var localFont = localStorage.getItem('FontFace');
        var fontEncoded = objFont.encoded;
        if (fontEncoded) {
          var fontsObj = localFont !== null ? JSON.parse(localFont) : {};
          var fontInObj = fontsObj[objFont.family];
          if (fontInObj !== undefined) {
            var fontByEx = fontInObj[exFont];
            if (fontByEx !== undefined) {
              if (fontByEx !== fontEncoded) fontsObj[objFont.family][exFont] = fontEncoded
            } else {
              fontsObj[objFont.family][exFont] = fontEncoded;
            }
          } else {
            fontsObj[objFont.family] = {};
            fontsObj[objFont.family][exFont] = fontEncoded
          }
          localStorage.setItem('FontFace', JSON.stringify(fontsObj));
        } else {
          if (localFont === null) return false;
          var fountInCache = false;
          var fontsObj = JSON.parse(localFont);
          var fontInObj = fontsObj[objFont.family];
          if (fontInObj !== undefined) {
            var fontByEx = fontInObj[exFont]
            if (fontByEx !== undefined) fountInCache = fontByEx; 
          }
          return fountInCache;
        }
      }
    },

    loadOpts: function (objFont) {
      if (objFont.then) {
        objFont.then(objFont);
        delete objFont['then'];
      }
      if (objFont.toAdd) {
        DFMethods.add(objFont);
        delete objFont['toAdd'];
      }
    },

    load: function (obj) {
      var _this = this;
      var fontSaved = this.cache(obj);
      if (fontSaved) {
        obj.encoded = fontSaved;
        obj.status = 'loaded';
        this.loadOpts(obj);
      } else {
        if (!obj.src) {
          if (obj.catch && !obj.catchSended) {
            obj.catchSended = true;
            return obj.catch('no se encontró un url de fuente aceptable para cargar');
          }
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
                    _this.loadOpts(obj);
                  };
                  fileReader.readAsDataURL(blob);
                } else {
                  obj.status = 'error';
                  if (obj.catch && !obj.catchSended) {
                    obj.catchSended = true;
                    obj.catch(xhr.status);
                  }
                }
                break;
            }
          });
          xhr.send(null);
        }
      }
    },

    promise: function (_this) {
      return {
        then: function (resolve, reject) {
          if (resolve !== undefined) _this.then = resolve;
          if (reject !== undefined) _this.catch = reject;
          return {
            catch: function (cbc) {
              if (cbc !== undefined) _this.catch = cbc;
            }
          }
        },
        catch: function (cb) {
          if (cb !== undefined) _this.catch = cb;
          return {
            then: function (cbt) {
              if (cbt !== undefined) _this.then = cbt;
            }
          }
        }
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
    var config = settings || Object.create(null);
    this.display = config.display || 'auto';
    this.family = family;
    this.featureSettings = config.featureSettings || 'normal';
    this.stretch = config.stretch || 'normal';
    this.style = config.style || 'normal';
    this.loaded = FFMethods.promise(this);
    this.src = FFMethods.getUrl(fonts);
    this.status = 'unloaded';
    this.unicodeRange = config.unicodeRange || 'U+0-10FFFF';
    this.variant = config.variant || 'normal';
    this.weight = config.weight || 'normal';
  }

  FontFace.prototype.load = function () {
    var _this = this;
    setTimeout(function () {
      FFMethods.load(_this);
    }, 0);
    return FFMethods.promise(_this);
  }

  if (typeof window.FontFace === 'undefined') {
    window.FontFace = FontFace;
    document.fonts = {
      add: DFMethods.addBridge.bind(DFMethods)
    };
  }
}());