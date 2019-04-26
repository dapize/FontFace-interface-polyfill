(function () {
  'use strict';

  var docFonts = {
    add: function (fontCode) {
      var styleElement = document.createElement('style');
      styleElement.type = 'text/css';
      var styleSheet = styleElement.styleSheet;
      styleSheet ? styleSheet.cssText = fontCode : styleElement.innerHTML = fontCode;
      document.head.appendChild(styleElement);
    }
  };

  var FontFace = function (family, fonts, settings) {
    this.config = {
      'font-family': '\'' + family + '\'',
      'font-style': 'normal',
      'font-weight': 'normal',
      'font-feature-settings': 'normal',
      'font-stretch': 'normal',
      'unicode-range': 'U+0-10FFFF',
      'font-variant': 'normal',
      'font-display': 'swap'
    };
    this.settings(settings);
    this.urlS(fonts);
  };

  FontFace.prototype.settings = function (settings) {
    var _this = this;
    if (settings === undefined) return;
    var equivalents = {
      family: 'font-family',
      display: 'font-display',
      featureSettings: 'font-feature-settings',
      stretch: 'font-stretch',
      style: 'font-style',
      unicodeRange: 'unicode-range',
      variant: 'font-variant',
      weight: 'font-weight'
    };
    Object.keys(settings).forEach(function (nameShort) {
      var longName = equivalents[nameShort];
      if (longName !== undefined) {
        var proVal = settings[nameShort];
        if (proVal !== _this.config[longName]) _this.config[longName] = settings[nameShort];
      }
    });
  };

  FontFace.prototype.detectIE = function () {
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
  };

  FontFace.prototype.urlS = function (urlS) {
    if (urlS === undefined) return;
    var arrUrls = urlS.match(/url\(.*?\)/g);
    arrUrls.forEach(function (url, index) {
      url = url.replace(/'/g, '');
      arrUrls[index] = url.replace('url(', '').replace(')', '');
    });
    this.fonts = arrUrls;
    this.src = urlS;
  };

  FontFace.prototype.base64Encode = function (str) {
    var CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    var out = '', i = 0, len = str.length, c1, c2, c3;
    while (i < len) {
      c1 = str.charCodeAt(i++) & 0xff;
      if (i == len) {
        out += CHARS.charAt(c1 >> 2);
        out += CHARS.charAt((c1 & 0x3) << 4);
        out += '==';
        break;
      }
      c2 = str.charCodeAt(i++);
      if (i == len) {
        out += CHARS.charAt(c1 >> 2);
        out += CHARS.charAt(((c1 & 0x3)<< 4) | ((c2 & 0xF0) >> 4));
        out += CHARS.charAt((c2 & 0xF) << 2);
        out += '=';
        break;
      }
      c3 = str.charCodeAt(i++);
      out += CHARS.charAt(c1 >> 2);
      out += CHARS.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
      out += CHARS.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
      out += CHARS.charAt(c3 & 0x3F);
    }
    return out;
  }

  FontFace.prototype.cache = function (key, val) {
    if (val === undefined) return localStorage.getItem(key);
    localStorage.setItem(key, val);
  };

  FontFace.prototype.get = function (url, cb) {
    var _this = this;
    var fontFileName = url;
    if (url.indexOf('/') !== -1) {
      var splitUrl = url.split('/');
      fontFileName = splitUrl[splitUrl.length - 1];
    }
    var fontFormat = fontFileName.split('.')[1];
    var fontCached = this.cache(fontFileName);
    if (fontCached !== null) {
      cb(fontFormat, fontCached);
    } else {
      var request = new XMLHttpRequest();
      request.open('GET', url);
      if (request.overrideMimeType) request.overrideMimeType('text/plain; charset=x-user-defined');
      request.addEventListener('readystatechange', function(e) {
        if(request.readyState == 4) {
          if (request.status === 200) {
            var fontEncode = _this.base64Encode(request.responseText);
            _this.cache(fontFileName, fontEncode);
            cb(fontFormat, fontEncode);
          } else {
            return console.log('Ocurrió un error obteniendo la fuente desde ' + url);
          }
        };
      });
      request.send(null);
    }
  };

  FontFace.prototype.builder = function (urlFont, cb) {
    var config = this.config;
    var rules = '';
    Object.keys(config).forEach(function (rule) {
      var val = config[rule];
      if (typeof val === 'string' && rule !== 'font-family') {
        rule = rule.replace(/'/g);
      }
      rules += rule + ': ' + val + '; ';
    });
    if (navigator.appVersion.indexOf("MSIE 10") !== -1) {
      cb("@font-face { " + rules + " src: " + this.src + "}");
    } else {
      this.get(urlFont, function (format, base64) {
        if (format === 'ttf') format = 'truetype';
        var srcFonts = "url('data:application/font-" + format + ";base64," + base64 + "') format('" + format + "')";
        cb("@font-face { " + rules + " src: " + srcFonts + "}");
      });
    }
  };

  FontFace.prototype.chooseFont = function (fonts) {
    var fontsLength = fonts.length;
    var fontUrlToLoad;
    if (fontsLength === 1) {
      fontUrlToLoad = fonts[0];
    } else {
      var exForIE = ['woff', 'otf', 'ttf'];
      var exFont;
      var isIE = this.detectIE();
      var fontsJoin = fonts.join(',');
      for (var f = 0; f < fontsLength; f++) {
        var font = fonts[f];
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
  }

  FontFace.prototype.load = function () {
    var _this = this;
    var fontChosen = this.chooseFont(this.fonts);
    return {
      then: function (cb) {
        _this.builder(fontChosen, cb);
      }
    };
  };

  if (typeof window.FontFace === 'undefined') {
    document.fonts = docFonts;
    window.FontFace = FontFace;
  }
}());