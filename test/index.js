var waltographUIBold = new FontFace('Waltograph UI', "url('fonts/WaltographUI-Bold.woff2') format('woff2'), url('fonts/WaltographUI-Bold.woff') format('woff'), url('fonts/WaltographUI-Bold.ttf') format('truetype')", { style: 'normal', weight: 'bold' });
waltographUIBold.load().then(function (fontLoad) {
   document.fonts.add(fontLoad);
});