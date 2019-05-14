var fuente = new FontFace2('Waltograph UI', "url('./fonts/WaltographUI-Bold.woff2') format('woff2'), url('./fonts/WaltographUI-Bold.woff') format('woff'), url('./fonts/WaltographUI-Bold.ttf') format('truetype')", { style: 'normal', weight: 'bold' });

fuente.load().then(function (fontObj) {
   document.fonts2.add(fontObj);
});

/*
.then(function (fontLoad) {
   console.log(fontLoad);
   //document.fonts2.add(fontLoad);
});



ignorar:

loaded
status
_encoded
_toLoad

convertir:
unicodeRange
featureSettings


'font-feature-settings': 'normal',
'unicode-range': 'U+0-10FFFF',
*/