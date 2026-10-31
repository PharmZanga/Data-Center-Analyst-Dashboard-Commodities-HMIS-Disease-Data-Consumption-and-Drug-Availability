// Dummy eLMIS observations are intentionally separate from the tracer generator.
function elmisStock(f,j,m){return ((f.id*19+j*13+m*7)%100)>=18;}
function elmisReport(f,m){return (f.id+m)%13!==0;}
function connectedAvailability(fs,js,m,stream){const ff=stream==='elmis'?fs.filter(f=>elmisReport(f,m)):fs,stock=(f,j)=>stream==='elmis'?elmisStock(f,j,m):DATA[f.id][m].soh[j]>0,total=ff.length*js.length,positive=sum(ff.map(f=>sum(js.map(j=>stock(f,j)?1:0))));return{availability:pct(positive,total),stockouts:total-positive,total,reporting:ff.length,expected:fs.length,complete:pct(ff.filter(f=>js.every(j=>stock(f,j))).length,ff.length)};}
function renderConnectedAvailability(fs,js){
const em=connectedAvailability(F,js,11,'elmis');
$('#em-availability').textContent=em.availability.toFixed(1)+'%';$('#em-reporting').textContent=em.reporting+' / '+em.expected;$('#em-stockout').textContent=em.stockouts+' / '+em.total;$('#ex-elmis').textContent=em.availability.toFixed(1)+'%';
tiles('em-map',ff=>connectedAvailability(ff,js,11,'elmis').availability,v=>v.toFixed(0),v=>v>=75?'var(--grn)':v>=55?'#ad7900':'var(--red)');
line('em-trend',months().map(m=>MO[m]),[{n:'Dummy national eLMIS availability (%)',v:months().map(m=>connectedAvailability(F,js,m,'elmis').availability),c:'var(--c3)'}],v=>v.toFixed(0)+'%');
table('em-table',['Commodity','Category','Availability','Positive-stock / reporting records','Stockouts'],js.map(j=>{const a=connectedAvailability(F,[j],11,'elmis');return[CM[j][0],CM[j][1],a.availability.toFixed(1)+'%',(a.total-a.stockouts)+' / '+a.total,a.stockouts]}));
renderImportedTracer();
}
