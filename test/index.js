var waltographUIFont = new FontFace2('Waltograph UI', "url('./fonts/WaltographUI-Bold.woff2') format('woff2'), url('./fonts/WaltographUI-Bold.woff') format('woff'), url('./fonts/WaltographUI-Bold.ttf') format('truetype')", { style: 'normal', weight: 'normal' });
waltographUIFont.load()
   .then(function (fontObj) {
      document.fonts2.add(fontObj);
   })
   .catch(function (err) {
      console.log(err);
   });


var ArtBrewery = new FontFace2('Art Brewery', "url('./fonts/ArtBrewery.woff2') format('woff2'), url('./fonts/ArtBrewery.woff') format('woff')", { style: 'normal', weight: '400' });
ArtBrewery.load()
   .then(function (fontObj) {
      document.fonts2.add(fontObj);
   })
   .catch(function (err) {
      console.log(err);
   });
