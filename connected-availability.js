// Dummy eLMIS observations are intentionally separate from the tracer generator.
function elmisStock(f,j,m){return ((f.id*19+j*13+m*7)%100)>=18;}
function elmisReport(f,m){return (f.id+m)%13!==0;}
function connectedAvailability(fs,js,m,stream){const ff=stream==='elmis'?fs.filter(f=>elmisReport(f,m)):fs,stock=(f,j)=>stream==='elmis'?elmisStock(f,j,m):DATA[f.id][m].soh[j]>0,total=ff.length*js.length,positive=sum(ff.map(f=>sum(js.map(j=>stock(f,j)?1:0))));return{availability:pct(positive,total),stockouts:total-positive,total,reporting:ff.length,expected:fs.length,complete:pct(ff.filter(f=>js.every(j=>stock(f,j))).length,ff.length)};}
function renderConnectedAvailability(fs,js){
const tr=connectedAvailability(fs,js,11,'tracer'),em=connectedAvailability(F,js,11,'elmis');
$('#tr-availability').textContent=tr.availability.toFixed(1)+'%';$('#tr-complete').textContent=tr.complete.toFixed(1)+'%';$('#tr-stockout').textContent=tr.stockouts+' / '+tr.total;
$('#em-availability').textContent=em.availability.toFixed(1)+'%';$('#em-reporting').textContent=em.reporting+' / '+em.expected;$('#em-stockout').textContent=em.stockouts+' / '+em.total;
$('#ex-tracer').textContent=tr.availability.toFixed(1)+'%';$('#ex-elmis').textContent=em.availability.toFixed(1)+'%';
const color=v=>v>=75?'var(--grn)':v>=55?'#ad7900':'var(--red)';
tiles('tr-map',ff=>connectedAvailability(ff,js,11,'tracer').availability,v=>v.toFixed(0),color);tiles('em-map',ff=>connectedAvailability(ff,js,11,'elmis').availability,v=>v.toFixed(0),color);
line('tr-trend',months().map(m=>MO[m]),[{n:'Dummy Tracer availability (%)',v:months().map(m=>connectedAvailability(fs,js,m,'tracer').availability),c:'var(--acc)'}],v=>v.toFixed(0)+'%');
line('em-trend',months().map(m=>MO[m]),[{n:'Dummy national eLMIS availability (%)',v:months().map(m=>connectedAvailability(F,js,m,'elmis').availability),c:'var(--c3)'}],v=>v.toFixed(0)+'%');
for(const [id,ff,stream] of [['tr-table',fs,'tracer'],['em-table',F,'elmis']])table(id,['Commodity','Category','Availability','Positive-stock / reporting records','Stockouts'],js.map(j=>{const a=connectedAvailability(ff,[j],11,stream);return[CM[j][0],CM[j][1],a.availability.toFixed(1)+'%',(a.total-a.stockouts)+' / '+a.total,a.stockouts]}));
}
