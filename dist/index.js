(function () {
  'use strict';

  var DFMethods = {
    
    fontsAdded: [],

    add: function add (fontObj) {
      var styles = [];
      var objToSave = Object.create(null);
      var propsToIgnore = ['urlBlob', 'loaded', 'status', 'catch', 'encoded', 'src', 'then', 'thenLoaded', 'catchLoaded'];
      var valStyle 
      var ruleToAdd;
      Object.keys(fontObj).forEach(function (name) {
        if (propsToIgnore.indexOf(name) === -1) {
          valStyle = fontObj[name];
          switch(name) {
            case 'unicodeRange':
              ruleToAdd = 'unicode-range: ' + valStyle;
              break;
            case 'featureSettings':
              ruleToAdd = 'font-feature-settings: ' + valStyle;
              break;
            case 'family':
              ruleToAdd = 'font-' + name + ': "' + valStyle + '"';
              break;
            default:
              ruleToAdd = 'font-' + name + ': ' + valStyle;
          }
          styles.push(ruleToAdd);
          objToSave[name] = valStyle;
        } 
      }); 
      objToSave.loaded = fontObj.loaded;
      this.fontsAdded.push(objToSave);
      var byteCharacters = atob(fontObj.encoded.replace('data:application/octet-binary;base64,', ''));
      var nByteCharacters = byteCharacters.length
      var byteNumbers = new Array(nByteCharacters);
      var i;
      for (i = 0; i < nByteCharacters; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
      var byteArray = new Uint8Array(byteNumbers);
      var blob = new Blob([byteArray], {type: 'application/octet-binary'});
      var urlBlob = URL.createObjectURL(blob);
      styles.push('src: url("' + urlBlob + '")')
      var styleFont = '@font-face {' + styles.join(';') + '}';
      var docStyles = document.styleSheets;
      if (!docStyles.length) {
        var styleElement = document.createElement('style');
        styleElement.type = 'text/css';
        styleElement.styleSheet ? styleElement.styleSheet.cssText = styleFont : styleElement.innerHTML = styleFont;
        document.head.appendChild(styleElement);
      } else {
        docStyles[0].insertRule('' + styleFont + '', 0);
      }
      return this;
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
        this.exeMethods('catch', objFont, 'invalid url');
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

    exeMethods: function (type, objFont, errMsg) {
      var objMsg = objFont;
      var arrMethods = ['then', 'thenLoaded', 'toAdd'];
      if (type === 'catch') {
        arrMethods = ['catch', 'catchLoaded'];
        objMsg = errMsg;
      }
      arrMethods.forEach(function (method) {
        if (objFont[method]) {
          (method === 'toAdd') ? DFMethods.add(objMsg) : objFont[method](objMsg);
          delete objFont[method];
        }
      }); 
    },

    load: function (obj) {
      var _this = this;
      var fontSaved = this.cache(obj);
      if (fontSaved) {
        obj.encoded = fontSaved;
        obj.status = 'loaded';
        this.exeMethods('then', obj);
      } else {
        if (!obj.src) {
          this.exeMethods('catch', obj, 'invalid url');
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
                    _this.exeMethods('then', obj);
                  };
                  fileReader.readAsDataURL(blob);
                } else {
                  obj.status = 'error';
                  _this.exeMethods('catch', obj, xhr.status);
                }
                break;
            }
          });
          xhr.send(null);
        }
      }
    }
    
  }

  function Promise(self, nameThen, nameCatch) {
    this._this = self;
    this._nameThen = nameThen;
    this._nameCatch = nameCatch;
  }

  Promise.prototype.then = function (resolve, reject) {
    var _this = this._this;
    if (resolve !== undefined) _this[this._nameThen] = resolve;
    if (reject !== undefined) _this[this._nameCatch] = reject;
    var _self = this;
    return {
      catch: function (cbc) {
        if (cbc !== undefined) _this[_self._nameCatch] = cbc;
      }
    }
  };

  Promise.prototype.catch = function (reject) {
    var _this = this._this;
    if (reject !== undefined) _this[this._nameCatch] = reject;
    var _self = this;
    return {
      then: function (resolve) {
        if (resolve !== undefined) _this[_self.nameThen] = resolve;
      }
    }
  };


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
    this.loaded = new Promise(this, 'thenLoaded', 'catchLoaded');
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
    return new Promise(_this, 'then', 'catch');
  }

  /**
   * Constructor del FontFaceSet
   * @return {object} Configuraciones y métodos.
   */
  function FontFaceSet() {
  }

  FontFaceSet.prototype.add = function add (fontObj) {
    if (!fontObj.encoded) {
      fontObj.toAdd = true;
      FFMethods.load(fontObj);
    } else {
      DFMethods.add(fontObj);
    } 
  };

  FontFaceSet.prototype.forEach = function forEach (cb) {
    DFMethods.fontsAdded.forEach(function (font) { if (cb) cb(font) });
  };

  Object.defineProperty(FontFaceSet.prototype, 'size', {
    get: function () {
      return DFMethods.fontsAdded.length;
    }
  })

  if (typeof window.FontFace === 'undefined') {
    window.FontFace = FontFace;
    Object.defineProperty(document, 'fonts', {
      get: function () {
        return new FontFaceSet();
      }
    })
  }
}());