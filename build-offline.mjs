import fs from 'node:fs';
const image=file=>{const ext=file.split('.').at(-1),mime=ext==='svg'?'image/svg+xml':ext==='jpg'?'image/jpeg':'image/png';return 'data:'+mime+';base64,'+fs.readFileSync('dist/'+file).toString('base64')};
let html=fs.readFileSync('dist/index.html','utf8'),css=fs.readFileSync('dist/theme.css','utf8');
css=css.replace(/url\('([^']+)'\)/g,(_,file)=>`url('${image(file)}')`);html=html.replace('<link rel="stylesheet" href="theme.css">',()=>'<style>'+css+'</style>');html=html.replace(/src="(assets\/[^\"]+)"/g,(_,file)=>'src="'+image(file)+'"');
html=html.replace('href="offline.html" download','href="#" aria-disabled="true"').replace('Download offline snapshot','Offline snapshot already open');
fs.writeFileSync('dist/offline.html',html);console.log('Created standalone offline HTML snapshot with bundled images, styling and data.');
