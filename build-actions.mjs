import fs from 'node:fs';
const periods=JSON.parse(fs.readFileSync('outputs/tracer-oct-published.json','utf8')).tracerReportingPeriods;
const norm=s=>String(s??'').toUpperCase().replace(/[^A-Z0-9]/g,''),unit=r=>[r.province,r.district,r.level,r.facility].map(norm).join('|');
const unpack=p=>{const d=p.commodityFacilityData.dictionaries;return p.commodityFacilityData.rows.map(r=>({province:d.provinces[r[0]],district:d.districts[r[1]],level:d.levels[r[2]],facility:d.facilities[r[3]],item:d.items[r[4]],programme:d.programmes[r[5]],soh:r[6],amc:r[7],mos:r[8]}));};
const identity=r=>unit(r)+'|'+norm(r.item)+'|'+norm(r.programme),all=periods.map(unpack),latest=all.at(-1),base=periods.at(-1),prior=new Map(all.at(-2).map(r=>[identity(r),r]));
const observations=all.map(rows=>new Map(rows.map(r=>[identity(r),r])));
const quality=[],count=new Map();for(const r of latest)count.set(identity(r),(count.get(identity(r))||0)+1);
const valid=[],jumpRows=[];let negatives=0,duplicates=0,zeroAmc=0;
for(const r of latest){const k=identity(r),p=prior.get(k),issues=[];
if(!Number.isFinite(r.soh)||!Number.isFinite(r.amc)||r.soh<0||r.amc<0){negatives++;issues.push('Negative or nonnumeric SOH/AMC');}
if(count.get(k)>1){duplicates++;issues.push('Duplicate facility/item/programme key');}
if(r.amc===0){zeroAmc++;issues.push('Zero AMC: cover cannot be estimated');}
if(p&&p.amc>0&&r.amc>p.amc*3){issues.push('Reported AMC more than 3× previous report');jumpRows.push(k);}
if(issues.length)quality.push({...r,issues:issues.join('; ')});
if(issues.some(v=>v.startsWith('Negative')||v.startsWith('Duplicate')))continue;
const daily=Math.max(r.amc,p?.amc>0?p.amc:0)/30.44,days=daily>0?Math.floor(r.soh/daily):r.soh===0?0:null;
const date=days==null||!Number.isFinite(days)||days>3650?null:new Date(Date.parse(base.reportDate+'T00:00:00Z')+days*86400000).toISOString().slice(0,10);
const obs=observations.map(rows=>rows.get(k)).filter(Boolean);
// Reported snapshots cannot establish duration or episodes between reports.
valid.push({...r,key:k,unit:unit(r),days,date,daily,zeroObservations:obs.filter(x=>x.soh===0).length,observations:obs.length,previousAmc:p?.amc??null});}
const group=new Map();for(const r of valid){const g=group.get(r.unit)||{key:r.unit,province:r.province,district:r.district,level:r.level,facility:r.facility,rows:0,zero:0,risk:0,minDays:null};g.rows++;g.zero+=r.soh===0?1:0;g.risk+=r.days!=null&&r.days<30?1:0;if(r.days!=null)g.minDays=g.minDays==null?r.days:Math.min(g.minDays,r.days);group.set(r.unit,g);}
const latestUnits=new Set(latest.map(unit)),previousUnits=new Map();for(const [i,rows] of all.entries())for(const r of rows)previousUnits.set(unit(r),{...r,lastReport:periods[i].reportDate});
const support=[...group.values()].map(g=>({...g,missing:false,score:Math.round(60*g.zero/g.rows+40*g.risk/g.rows),lastReport:base.reportDate}));
for(const [k,r] of previousUnits)if(!latestUnits.has(k))support.push({key:k,province:r.province,district:r.district,level:r.level,facility:r.facility,missing:true,lastReport:r.lastReport,score:100,rows:0,zero:0,risk:0,minDays:null});
support.sort((a,b)=>b.score-a.score||(a.minDays??999)-(b.minDays??999));
const risk=valid.filter(r=>r.days!=null&&r.days<60).sort((a,b)=>a.days-b.days||a.key.localeCompare(b.key));
// Candidates only between named, nonaggregate units in the same district, item AND programme.
const sourceFacilities=new Map(base.facilities.map(f=>[[f.province,f.district,f.facilityLevel,f.name].map(norm).join('|'),f]));
const named=r=>sourceFacilities.get(r.unit)?.isAggregate===false;
const donors=valid.filter(r=>named(r)&&r.amc>0&&r.mos>4&&r.days!=null&&r.days<=3650).map(r=>({...r,available:Math.max(0,Math.floor(r.soh-2*r.amc))}));
const suggestions=[];for(const recipient of risk.filter(r=>named(r)&&r.amc>0&&r.days<30)){let need=Math.max(0,Math.ceil(recipient.amc-recipient.soh));for(const donor of donors.filter(d=>d.unit!==recipient.unit&&norm(d.district)===norm(recipient.district)&&norm(d.province)===norm(recipient.province)&&d.item===recipient.item&&d.programme===recipient.programme&&d.available>0).sort((a,b)=>b.available-a.available)){const quantity=Math.min(need,donor.available);if(quantity<=0)continue;suggestions.push({id:'redistribute-'+suggestions.length,province:recipient.province,district:recipient.district,item:recipient.item,programme:recipient.programme,from:donor.facility,to:recipient.facility,quantity,sourceSoh:donor.soh,sourceAmc:donor.amc,reserve:2*donor.amc,availableBefore:donor.available});donor.available-=quantity;need-=quantity;if(need<=0)break;}}
const districts=[...new Set(all.flat().map(r=>r.district))].sort();
const coverage=districts.map(district=>{const expected=new Set(all.flat().filter(r=>r.district===district).map(unit));return{district,expected:expected.size,periods:all.map((rows,i)=>({date:periods[i].reportDate,reported:new Set(rows.filter(r=>r.district===district).map(unit)).size,expected:expected.size}))};});
const riskFields=['province','district','level','facility','item','programme','soh','amc','previousAmc','days','date','zeroObservations','observations'];
const data={reportDate:base.reportDate,periods:periods.map(p=>({id:p.id,label:p.label})),method:'Cover uses SOH / (max of latest and previous reported AMC / 30.44). This is a conservative cover scenario, not a validated forecast or an observed dispensing trend. All estimates are anchored to the report date.',quality:{negatives,duplicateRows:duplicates,zeroAmc,amcJumps:jumpRows.length,rows:quality},risk:risk.map(r=>Object.fromEntries(riskFields.map(k=>[k,r[k]]))),support,redistribution:suggestions,coverage,stockDaysKnown:false};
for(const s of suggestions)if(s.quantity>s.availableBefore||s.sourceSoh-s.quantity<s.reserve)throw Error('Unsafe donor candidate');
const strings=[],stringIndex=new Map(),packString=s=>{if(!stringIndex.has(s)){stringIndex.set(s,strings.length);strings.push(s)}return stringIndex.get(s)};
const riskRows=data.risk.map(r=>riskFields.map((k,i)=>i<6||k==='date'?packString(r[k]):r[k]));
const packed={...data,risk:undefined,riskFields,riskRows,riskStrings:strings};
fs.writeFileSync('actions-data.js','const ACTIONS_DATA='+JSON.stringify(packed).replaceAll('<','\\u003c')+';\nACTIONS_DATA.risk=ACTIONS_DATA.riskRows.map(row=>Object.fromEntries(ACTIONS_DATA.riskFields.map((k,i)=>[k,i<6||k==="date"?ACTIONS_DATA.riskStrings[row[i]]:row[i]])));\n');
fs.writeFileSync('dist/action-evidence.json',JSON.stringify(data));
console.log(JSON.stringify({risk:risk.length,support:support.length,candidates:suggestions.length,quality:quality.length}));
