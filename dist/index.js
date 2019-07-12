(function (window, document) {
  'use strict';

  var DFMethods = {
    
    fontsAdded: [],

    createInDom: function (id, styleFont, objFont) {
      var styleElement = document.createElement('style');
      styleElement.type = 'text/css';
      styleElement.id = id;
      styleElement.innerHTML = styleFont;
      document.head.appendChild(styleElement);
      objFont.id = id;
    },

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
      var idStyle = 'ffp' + (((1+Math.random())*0x10000)|0).toString(16).substring(1);
      objToSave.index = null;
      if (!docStyles.length) {
        this.createInDom(idStyle, styleFont, objToSave);
      } else {
        var indexStyleSheet = false;
        var objCssStyles = Object.keys(docStyles);
        var nObjCssStyles = objCssStyles.length;
        var attachStyle = false;
        var ifont;
        for (ifont = 0; ifont < nObjCssStyles; ifont++) {
          if (docStyles[ifont].ownerNode.id.substr(0, 3) !== 'ffp') {
            attachStyle = true;
            indexStyleSheet = ifont;
            break;
          }
        }
        if (attachStyle) {
          var scopeStyle = docStyles[indexStyleSheet];
          scopeStyle.insertRule('' + styleFont + '', scopeStyle.length);
          objToSave.index = indexStyleSheet;
        } else {
          this.createInDom(idStyle, styleFont, objToSave);
        }
      }
      objToSave.loaded = fontObj.loaded;
      this.fontsAdded.push(objToSave);
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
      } else {
        delete objFont['catch'];
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

  /**
   * Construye una promesa simulada
   * @param {object} self Objeto donde apuntarán los métodos
   * @param {string} nameThen nombre del 'then'
   * @param {strong} nameCatch nombre del 'catch
   */
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
   * Constructor del FontFaceSet orientado a document.fonts
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

  FontFaceSet.prototype.delete = function (objFont) {
    var family = objFont.family;
    if (!family) return false;
    if (!this.size) return false;
    var rulesToCheck = ['family', 'style', 'weight'];
    var indexFTR = null;
    var fontDeleted = false;
    DFMethods.fontsAdded.filter(function (font, iFAdded) {
      if (3 === rulesToCheck.filter(function (ruleCss) {
        return font[ruleCss] === objFont[ruleCss];
      }).length) {
        indexFTR = iFAdded;
        return true;
      };
    }).map(function (font) {
      if (font.id) {
        var elStyle = document.getElementById(font.id);
        elStyle.parentNode.removeChild(elStyle);
        fontDeleted = true;
      } else {
        var styleSheetFont = document.styleSheets[font.index].cssRules;
        if (!styleSheetFont.length) return console.log('Sin reglas CSS');
        var nKeyStyles = Object.keys(styleSheetFont).length, ruleCssText, ruleStyle, rulesJoined, ikS;
        for (ikS = 0; ikS < nKeyStyles; ikS++) {
          ruleStyle = styleSheetFont[ikS];
          ruleCssText = ruleStyle.cssText;
          if (ruleStyle.media === undefined && ruleCssText !== undefined) {
            rulesJoined = ruleCssText.split(ruleCssText.indexOf('\n') !== -1 ? '\n' : ';').map(function (oneLineRule) {
              if (oneLineRule.indexOf(':') !== -1) return oneLineRule.replace(/;/g, '').replace(/ /g, '').replace(/\"/g, '').toLowerCase();
            }).join('|');
            if (3 === rulesToCheck.filter(function (oneRule) {
              return rulesJoined.indexOf('font-' + oneRule + ':' + objFont[oneRule].replace(/ /g, '').toLowerCase()) === -1 ? false : true;
            }).length) {
              document.styleSheets[font.index].deleteRule(ikS);
              fontDeleted = true;
              break;
            }
          }
        };
      }
      DFMethods.fontsAdded.splice(indexFTR, 1);
    });
    return fontDeleted;
  };

  FontFaceSet.prototype.clear = function () {
    if (!this.size) return;
    DFMethods.fontsAdded.slice(0).forEach(this.delete.bind(this));
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
}(window, document));