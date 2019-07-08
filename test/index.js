var waltographUIFont = new FontFace2('Waltograph UI', "url('./fonts/WaltographUI-Bold.woff2') format('woff2'), url('./fonts/WaltographUI-Bold.woff') format('woff'), url('./fonts/WaltographUI-Bold.ttf') format('truetype')", { style: 'normal', weight: 'normal' });

waltographUIFont.loaded.then(function (fontObj) {
   console.log('then de loaded');
});

waltographUIFont.load()
   .then(function (fontObj) {
      console.log('then de load');
      document.fonts2.add(fontObj);
   })
   .catch(function (err) {
      console.log('catch de load');
      console.log(err);
   });


