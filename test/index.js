var waltographUIFont = new FontFace2('Waltograph UI', "url('./fonts/WaltographUI-Bold.woff2') format('woff2'), url('./fonts/WaltographUI-Bold.woff') format('woff'), url('./fonts/WaltographUI-Bold.ttf') format('truetype')", { style: 'normal', weight: 'normal' });


waltographUIFont.load().then(function (fontObj) {
   console.log('aca el ultimo');
   console.log(fontObj);
   //document.fonts2.add(fontObj);
});


/*

Nativo:

display: "auto"
family: "Waltograph UI"
featureSettings: "normal"
loaded: Promise {<pending>}
status: "unloaded"
stretch: "normal"
style: "normal"
unicodeRange: "U+0-10FFFF"
variant: "normal"
weight: "normal"

*/