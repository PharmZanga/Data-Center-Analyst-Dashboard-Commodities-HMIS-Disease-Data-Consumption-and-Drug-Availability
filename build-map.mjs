import fs from 'node:fs';
// geoBoundaries gbOpen ZMB ADM1, ZMB-ADM1-6923714, 2020 boundaries.
// Zambia Data Hub / geoBoundaries; CC BY 4.0. See dist/map-source.md.
const geo=JSON.parse(fs.readFileSync('zambia-provinces.geojson','utf8'));
const points=geo.features.flatMap(f=>f.geometry.coordinates.flat());
const west=Math.min(...points.map(p=>p[0])),east=Math.max(...points.map(p=>p[0])),south=Math.min(...points.map(p=>p[1])),north=Math.max(...points.map(p=>p[1]));
const aspect=Math.cos(-13.5*Math.PI/180),scale=Math.min(556/((east-west)*aspect),470/(north-south));
const project=([x,y])=>[22+(x-west)*aspect*scale,22+(north-y)*scale];
function simplify(points,epsilon=.012){if(points.length<3)return points;const [a,b]=[points[0],points.at(-1)],dx=b[0]-a[0],dy=b[1]-a[1],len=dx*dx+dy*dy;let far=0,index=0;for(let i=1;i<points.length-1;i++){const p=points[i],u=len?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/len)):0,dist=(p[0]-a[0]-u*dx)**2+(p[1]-a[1]-u*dy)**2;if(dist>far){far=dist;index=i}}return far>epsilon**2?[...simplify(points.slice(0,index+1),epsilon).slice(0,-1),...simplify(points.slice(index),epsilon)]:[a,b]}
const labels={'Central':[29,-14.1],'Copperbelt':[28.15,-12.8],'Eastern':[31.9,-13.1],'Luapula':[29.05,-11.35],'Lusaka':[29,-15.55],'Muchinga':[31.5,-11.2],'Northern':[30.8,-9.6],'North-Western':[25.3,-12.6],'Southern':[27,-16.5],'Western':[23.7,-15.4]};
const paths=geo.features.map(f=>({name:f.properties.shapeName,d:f.geometry.coordinates.map(r=>simplify(r).map((p,i)=>(i?'L':'M')+project(p).map(v=>v.toFixed(1)).join(',')).join('')+'Z').join(''),label:project(labels[f.properties.shapeName]).map(v=>+v.toFixed(1))}));
if(paths.length!==10||new Set(paths.map(p=>p.name)).size!==10)throw Error('Expected 10 unique provinces');
fs.writeFileSync('map-paths.js','const ZAMBIA_MAP='+JSON.stringify(paths)+';\n');
console.log('Generated 10 geographic province paths for offline maps.');
