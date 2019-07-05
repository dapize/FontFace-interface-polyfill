var waltographUIFont = new FontFace('Waltograph UI', "url('./fonts/WaltographUI-Bold.woff2') format('woff2'), url('./fonts/WaltographUI-Bold.woff') format('woff'), url('./fonts/WaltographUI-Bold.ttf') format('truetype')", { style: 'normal', weight: 'normal' });

waltographUIFont.load()
   .then(function (fontObj) {
      document.fonts.add(fontObj);
   })
   .catch(function (err) {
      console.log(err);
   });

