'use strict';
const NS='http://www.w3.org/2000/svg';
const tanks=[];
function rect(id,x,y,w,h){tanks.push({id:String(id),points:[[x,y],[x+w,y],[x+w,y+h],[x,y+h]]});}
function polygon(id,points){tanks.push({id:String(id),points});}
// Printed numbers and relative positions transcribed from the supplied plan.
// The drawing contains no dimensions: these coordinates are illustrative.
[314,313,312,311].forEach((id,i)=>rect(id,90+i*83,270,83,125));
[324,323,322,321].forEach((id,i)=>rect(id,90+i*83,415,83,125));
rect(214,480,270,113,125);
[213,212,211].forEach((id,i)=>rect(id,593+i*83,270,83,125));
[224,223,222,221].forEach((id,i)=>rect(id,512+i*82.5,415,82.5,125));
[111,112,113].forEach((id,i)=>rect(id,900+i*93,155,93,103));
polygon(114,[[1210,155],[1250,155],[1300,208],[1300,258],[1210,258]]);
[121,122,123].forEach((id,i)=>rect(id,900+i*93,285,93,112));
rect(124,1210,285,90,112);
polygon(125,[[1300,258],[1332,287],[1416,397],[1300,397]]);
[131,132,133].forEach((id,i)=>rect(id,900+i*93,425,93,115));
[134,135,136].forEach((id,i)=>rect(id,1210+i*82,425,82,115));
polygon(137,[[1482,464],[1526,501],[1540,521],[1540,552],[1482,552]]);
const stockKey='korea-fish-farm-stock-v1';
const maxQuantity=1000000;
let stock={};
const settingsKey='korea-fish-farm-settings-v1';
let settings={farmName:'Korea Fish Farm',showCounts:true};
const draftKey='korea-fish-farm-json-draft-v1';
let publishedData=null,editorEnabled=false,snapshotUpdatedAt=null,loadSequence=0;
const svg=document.getElementById('farm'),scene=document.getElementById('scene'),viewport=document.getElementById('viewport');
const initial={x:0,y:0,w:1620,h:690};let view={...initial},selected=null;
function node(tag,attrs,parent=scene){const e=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);parent.append(e);return e;}
function path(points){return points.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' ')+'Z';}
function bounds(points){const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);const x=Math.min(...xs),y=Math.min(...ys);return{x,y,w:Math.max(...xs)-x,h:Math.max(...ys)-y};}
function centroid(points){let area=0,x=0,y=0;points.forEach((p,i)=>{const q=points[(i+1)%points.length],cross=p[0]*q[1]-q[0]*p[1];area+=cross;x+=(p[0]+q[0])*cross;y+=(p[1]+q[1])*cross;});return{x:x/(3*area),y:y/(3*area)};}
function inside(x,y,points){let yes=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const[a,b]=points[i],[c,d]=points[j];if(((b>y)!=(d>y))&&(x<(c-a)*(y-b)/(d-b)+a))yes=!yes;}return yes;}
node('rect',{x:30,y:105,width:1550,height:490,rx:15,fill:'url(#ground)',filter:'url(#shadow)'});
node('rect',{x:51,y:125,width:1508,height:450,rx:10,fill:'url(#paving)'});
// Concrete walkways and subtle pipes retain the farm's open-air structure.
node('path',{d:'M73 552H1455M440 251V552M862 235V550',fill:'none',stroke:'#e5e6d9','stroke-width':13});
node('path',{d:'M92 250H415M482 250H842M902 135H1237',fill:'none',stroke:'#3b4943','stroke-width':7,'stroke-linecap':'round'});
for(let i=0;i<10;i++){let x=90+i*155;node('path',{d:`M${x} 576v12`,stroke:'#788579','stroke-width':3});}
// Sparse landscaping outside the tank structures.
[[45,82],[1570,87],[43,610],[1570,610],[620,86],[820,87]].forEach(([x,y],i)=>{const g=node('g',{filter:'url(#leafShadow)'});node('circle',{cx:x,cy:y,r:22,fill:'#6d8961'},g);node('circle',{cx:x-9,cy:y-5,r:15,fill:'#91a87a'},g);node('circle',{cx:x+6,cy:y+7,r:14,fill:'#557b53'},g);});
tanks.forEach((tank,index)=>{
const d=path(tank.points),b=bounds(tank.points),c=centroid(tank.points);tank.bounds=b;tank.center=c;
const g=node('g',{class:'tank',tabindex:0,role:'button','aria-label':`Tank ${tank.id}`,'aria-pressed':'false','data-tank':tank.id});tank.element=g;
const title=node('title',{},g);title.textContent=`Tank ${tank.id}`;
tank.title=title;
node('path',{d,fill:'#686b55',stroke:'#6a705a','stroke-width':9,filter:'url(#shadow)'},g);
tank.surface=node('path',{d,fill:'url(#water)',stroke:'url(#rim)','stroke-width':11,'stroke-linejoin':'round'},g);
node('path',{d,fill:'none',stroke:'#f5d58a','stroke-width':1.4,opacity:.65},g);
const clip=node('clipPath',{id:`clip-${tank.id}`},svg.querySelector('defs'));node('path',{d},clip);
const dry=node('g',{'clip-path':`url(#clip-${tank.id})`,visibility:'hidden'},g);tank.dry=dry;
node('path',{d,fill:'url(#dry-floor)'},dry);
node('path',{d:`M${b.x+8} ${b.y+15}H${b.x+b.w-8}M${b.x+9} ${b.y+16}V${b.y+b.h-10}`,stroke:'#706c5c','stroke-width':5,fill:'none',opacity:.3},dry);
node('circle',{cx:c.x,cy:b.y+b.h-16,r:3,fill:'#6f6b5f'},dry);
const water=node('g',{'clip-path':`url(#clip-${tank.id})`},g);
tank.water=water;
node('rect',{x:b.x+6,y:b.y+6,width:b.w-12,height:b.h-12,fill:'none',stroke:'#064268','stroke-width':5,opacity:.22},water);
node('rect',{x:b.x-70,y:b.y,width:b.w+140,height:b.h,fill:'url(#ripples)',class:'water-texture',style:`animation-delay:-${index*.3}s`},water);
node('path',{d:`M${b.x+9} ${b.y+17}Q${c.x} ${b.y+29} ${b.x+b.w-9} ${b.y+12}`,fill:'none',stroke:'#b9f2f7','stroke-width':3,opacity:.23},water);
const school=node('g',{class:'fish-school',opacity:.72},water);
tank.school=school;
node('circle',{cx:c.x+Math.min(15,b.w/5),cy:c.y+21,r:9,fill:'none',stroke:'#cfedf4','stroke-width':1.1,opacity:.55,class:'bubbles'},water);
node('circle',{cx:c.x+Math.min(15,b.w/5),cy:c.y+21,r:3,fill:'#d1f8ff',opacity:.6},water);
node('path',{d,fill:'url(#speckle)',opacity:.2},water);
node('path',{d,class:'selection','stroke-linejoin':'round'},g);
const label=node('text',{x:c.x,y:c.y+6,'text-anchor':'middle'},g);label.textContent=tank.id;
tank.countLabel=node('text',{x:c.x,y:c.y-17,'text-anchor':'middle',class:'count-label',visibility:'hidden'},g);
tank.emptyLabel=node('text',{x:c.x,y:c.y+25,'text-anchor':'middle',class:'empty-label',visibility:'hidden'},g);tank.emptyLabel.textContent='Empty';
g.addEventListener('click',()=>{if(!dragged)selectTank(tank.id);});
g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectTank(tank.id);}});
});
const select=document.getElementById('tank-select');
for(const tank of [...tanks].sort((a,b)=>Number(a.id)-Number(b.id))){const o=document.createElement('option');o.value=tank.id;o.textContent=tank.id;select.append(o);}
function update(){view.w=Math.max(180,Math.min(initial.w*1.3,view.w));view.h=view.w*initial.h/initial.w;view.x=Math.max(-initial.w*.25,Math.min(initial.w-view.w*.15,view.x));view.y=Math.max(-initial.h*.25,Math.min(initial.h-view.h*.15,view.y));svg.setAttribute('viewBox',`${view.x} ${view.y} ${view.w} ${view.h}`);document.getElementById('zoom-level').value=`${Math.round(initial.w/view.w*100)}%`;}
function focusBounds(b){const w=Math.max(300,b.w+150,(b.h+130)*initial.w/initial.h);view={x:b.x+b.w/2-w/2,y:b.y+b.h/2-w*initial.h/initial.w/2,w,h:w*initial.h/initial.w};update();}
function selectionDetails(){const form=document.getElementById('stock-form');form.hidden=!selected||!editorEnabled;if(!selected)return;const q=stock[selected];const description=q===undefined?'Fish quantity not set':q===0?'Empty · 0 fish':`${q.toLocaleString()} fish`;document.getElementById('selection').innerHTML=`<span class="selection-icon">≈</span><h3>Tank ${selected}</h3><p>Block ${selected[0]} · ${description}</p>`;document.getElementById('fish-quantity').value=q===undefined?'':String(q);document.getElementById('stock-message').textContent='';}
function selectTank(id){const t=tanks.find(t=>t.id===id);if(!t)return;selected=id;select.value=id;tanks.forEach(t=>{t.element.classList.toggle('selected',t.id===id);t.element.setAttribute('aria-pressed',String(t.id===id));});focusBounds(t.bounds);selectionDetails();}
function reset(){selected=null;select.value='';tanks.forEach(t=>{t.element.classList.remove('selected');t.element.setAttribute('aria-pressed','false');});view={...initial};update();document.getElementById('selection').innerHTML='<span class="selection-icon">⌖</span><h3>Take a closer look</h3><p>Click a tank on the map or choose its number above.</p>';document.getElementById('stock-form').hidden=true;}
// One shared visual scale makes fish symbols comparable across every tank.
// Small quantities are shown one-for-one; large stocks use representative symbols.
function renderStock(){
const largest=Math.max(0,...Object.values(stock));const unit=Math.max(1,Math.ceil(largest/120));
for(const tank of tanks){const q=stock[tank.id],b=tank.bounds;const empty=q===0;tank.element.classList.toggle('empty',empty);tank.emptyLabel.setAttribute('visibility',empty?'visible':'hidden');tank.surface.setAttribute('fill',empty?'url(#dry)':'url(#water)');tank.water.setAttribute('visibility',empty?'hidden':'visible');tank.dry.setAttribute('visibility',empty?'visible':'hidden');tank.school.replaceChildren();tank.swimmers=[];
const description=q===undefined?'quantity not set':empty?'Empty, 0 fish':`${q.toLocaleString()} fish`;tank.element.setAttribute('aria-label',`Tank ${tank.id}, ${description}`);tank.title.textContent=`Tank ${tank.id} — ${description}`;
const count=q>0?Math.max(1,Math.round(q/unit)):0;tank.symbolCount=count;if(!count)continue;
const candidates=[];for(let row=0;row<20;row++)for(let col=0;col<20;col++){const x=b.x+11+(col+.5)*(b.w-22)/20,y=b.y+11+(row+.5)*(b.h-22)/20;if(inside(x,y,tank.points)&&inside(x-11,y,tank.points)&&inside(x+11,y,tank.points)&&inside(x,y-11,tank.points)&&inside(x,y+11,tank.points))candidates.push({x,y});}
const size=Math.max(.16,Math.min(.55,Math.sqrt(b.w*b.h/count)/34));
for(let i=0;i<count;i++){const p=candidates[Math.floor((i+.5)*candidates.length/count)]||tank.center;const angle=((Number(tank.id)*37+i*137)%360)*Math.PI/180;const element=node('use',{href:'#fishShape',transform:`translate(${p.x} ${p.y}) rotate(${angle*180/Math.PI}) scale(${size})`},tank.school);tank.swimmers.push({x:p.x,y:p.y,angle,size,speed:4+(i*7+Number(tank.id))%7,phase:i*2.1,element});}}
document.getElementById('fish-scale').textContent=largest===0?'Set fish quantities to populate the tanks':unit===1?'1 fish symbol = 1 fish':`1 fish symbol ≈ ${unit.toLocaleString()} fish · Same scale for all tanks`;
const configured=Object.values(stock);const empty=configured.filter(q=>q===0).length,occupied=configured.filter(q=>q>0).length;
document.getElementById('stock-summary').textContent=`${occupied} stocked · ${empty} empty · ${32-configured.length} not set`;
renderCountLabels();
}
function renderCountLabels(){for(const tank of tanks){const q=stock[tank.id];const text=q===undefined?'':`${q.toLocaleString()} fish`;tank.countLabel.textContent=text;tank.countLabel.setAttribute('style',`font-size:${Math.min(10,(tank.bounds.w-14)/Math.max(1,text.length*.6))}px`);tank.countLabel.setAttribute('visibility',settings.showCounts&&q!==undefined?'visible':'hidden');}document.getElementById('show-counts').checked=settings.showCounts;}
document.getElementById('show-counts').addEventListener('change',e=>{settings.showCounts=e.target.checked;renderCountLabels();if(editorEnabled){const saved=saveDraft();document.getElementById('label-message').textContent=saved?'Draft changed. Download JSON to publish this setting.':'Draft changed for this visit. Download JSON to keep it.';}else document.getElementById('label-message').textContent='Label visibility changed for this view only.';});
function applyFarmName(){document.getElementById('farm-brand').textContent=settings.farmName;document.getElementById('farm-footer').textContent=settings.farmName;document.getElementById('farm-name').value=settings.farmName;document.title=`${settings.farmName} | Aerial Tank Map`;}
document.getElementById('farm-form').addEventListener('submit',e=>{e.preventDefault();if(!editorEnabled)return;const name=document.getElementById('farm-name').value.trim();if(!name||name.length>80){document.getElementById('farm-message').textContent='Enter a farm name, up to 80 characters.';return;}settings.farmName=name;const saved=saveDraft();applyFarmName();document.getElementById('farm-message').textContent=saved?'Farm name saved to draft. Download JSON to publish.':'Name updated in draft. Download JSON to keep it.';});
function updateDate(now=new Date()){const date=document.getElementById('farm-date');date.textContent=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Seoul',day:'2-digit',month:'short',year:'numeric'}).format(now);const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);const get=type=>parts.find(p=>p.type===type).value;date.setAttribute('datetime',`${get('year')}-${get('month')}-${get('day')}`);date.setAttribute('title','Current date in Korea (KST)');}
applyFarmName();updateDate();setInterval(updateDate,30000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateDate();});
function setQuantity(id,q){if(!editorEnabled||!tanks.some(t=>t.id===id)||!Number.isSafeInteger(q)||q<0||q>maxQuantity)return false;stock[id]=q;const saved=saveDraft();renderStock();selectionDetails();document.getElementById('stock-message').textContent=saved?'Count applied to draft. Download JSON to publish.':'Count applied to draft. Download JSON to keep it.';return true;}
document.getElementById('stock-form').addEventListener('submit',e=>{e.preventDefault();if(!selected)return;const input=document.getElementById('fish-quantity'),raw=input.value.trim();if(!raw||!/^\d+$/.test(raw)||!setQuantity(selected,Number(raw)))document.getElementById('stock-message').textContent='Enter a whole number from 0 to 1,000,000.';});
document.getElementById('mark-empty').onclick=()=>{if(selected)setQuantity(selected,0);};
function normalizeData(data){
if(!data||typeof data!=='object'||Array.isArray(data)||data.version!==1)throw new Error('JSON must have version: 1.');
if(typeof data.farmName!=='string'||!data.farmName.trim()||data.farmName.trim().length>80)throw new Error('farmName must be a name with 1–80 characters.');
if(data.showCounts!==undefined&&typeof data.showCounts!=='boolean')throw new Error('showCounts must be true or false.');
if(!data.tanks||typeof data.tanks!=='object'||Array.isArray(data.tanks))throw new Error('tanks must be an object with tank numbers.');
const ids=new Set(tanks.map(t=>t.id));for(const[id,q]of Object.entries(data.tanks)){if(!ids.has(id))throw new Error(`Unknown tank number: ${id}.`);if(q!==null&&(!Number.isSafeInteger(q)||q<0||q>maxQuantity))throw new Error(`Tank ${id}: enter null or a whole number from 0 to 1,000,000.`);}
if(data.updatedAt!==undefined&&data.updatedAt!==null&&(typeof data.updatedAt!=='string'||!Number.isFinite(Date.parse(data.updatedAt))))throw new Error('updatedAt must be null or a valid date string.');
return{version:1,farmName:data.farmName.trim(),showCounts:data.showCounts??true,updatedAt:data.updatedAt??null,tanks:Object.fromEntries([...tanks].sort((a,b)=>Number(a.id)-Number(b.id)).map(t=>[t.id,data.tanks[t.id]??null]))};
}
function snapshot(timestamp=snapshotUpdatedAt){return{version:1,farmName:settings.farmName,showCounts:settings.showCounts,updatedAt:timestamp,tanks:Object.fromEntries([...tanks].sort((a,b)=>Number(a.id)-Number(b.id)).map(t=>[t.id,stock[t.id]??null]))};}
function applyData(data){stock={};for(const[id,q]of Object.entries(data.tanks))if(q!==null)stock[id]=q;settings={farmName:data.farmName,showCounts:data.showCounts};snapshotUpdatedAt=data.updatedAt;applyFarmName();renderStock();selectionDetails();}
function saveDraft(){document.getElementById('data-status').textContent='Local draft changed — download JSON, then replace the published file.';try{localStorage.setItem(draftKey,JSON.stringify(snapshot()));return true;}catch{return false;}}
function toggleEditor(enabled){editorEnabled=enabled;document.getElementById('json-message').textContent='';document.getElementById('farm-message').textContent='';document.getElementById('edit-mode').setAttribute('aria-pressed',String(enabled));document.getElementById('edit-mode').textContent=enabled?'Close draft editor':'Edit / export JSON';document.getElementById('json-tools').hidden=!enabled;document.getElementById('farm-settings').hidden=!enabled;document.getElementById('reload-data').disabled=enabled;selectionDetails();if(enabled){document.getElementById('data-status').textContent='Editing a local draft. Other visitors see the published JSON.';}else{if(publishedData)applyData(publishedData);document.getElementById('data-status').textContent=publishedData?'Showing published farm-data.json.':'No published data loaded. Reload or import a JSON file.';document.getElementById('label-message').textContent='';}}
async function loadPublished(){const sequence=++loadSequence;document.getElementById('edit-mode').disabled=true;document.getElementById('data-status').textContent='Loading published farm-data.json…';try{const response=await fetch('./farm-data.json',{cache:'no-store'});if(!response.ok)throw new Error(`File request failed (${response.status}).`);const data=normalizeData(await response.json());if(sequence!==loadSequence)return;publishedData=data;if(!editorEnabled){applyData(data);document.getElementById('data-status').textContent='Showing published farm-data.json.';}else document.getElementById('data-status').textContent='Published JSON loaded. Your local draft is still open.';}catch(error){if(sequence!==loadSequence)return;document.getElementById('data-status').textContent=`Could not load published JSON. ${error.message} Reload, or open the editor to import a file.`;}finally{if(sequence===loadSequence)document.getElementById('edit-mode').disabled=false;}}
document.getElementById('edit-mode').onclick=()=>toggleEditor(!editorEnabled);
document.getElementById('json-import-open').onclick=()=>{if(editorEnabled)document.getElementById('json-import').click();};
document.getElementById('reload-data').onclick=()=>{if(!editorEnabled)loadPublished();};
function exportJson(){return JSON.stringify(snapshot(new Date().toISOString()),null,2)+'\n';}
document.getElementById('export-json').onclick=()=>{if(!editorEnabled)return;const content=exportJson(),blob=new Blob([content],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='farm-data.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);document.getElementById('json-message').textContent='JSON downloaded. Replace farm-data.json in your GitHub repository, commit, and wait for Pages to publish.';};
document.getElementById('json-import').addEventListener('change',async e=>{if(!editorEnabled)return;const file=e.target.files?.[0];if(!file)return;try{if(file.size>100000)throw new Error('Choose a JSON file smaller than 100 KB.');const data=normalizeData(JSON.parse(await file.text()));applyData(data);saveDraft();document.getElementById('json-message').textContent='JSON imported into your local draft. Download it when ready to publish.';}catch(error){document.getElementById('json-message').textContent=`Import failed: ${error.message}`;}finally{e.target.value='';}});
document.getElementById('load-draft').onclick=()=>{if(!editorEnabled)return;try{const saved=localStorage.getItem(draftKey);if(!saved)throw new Error('No saved draft in this browser.');applyData(normalizeData(JSON.parse(saved)));saveDraft();document.getElementById('json-message').textContent='Saved draft loaded. Download JSON to publish it.';}catch(error){document.getElementById('json-message').textContent=error.message;}};
document.getElementById('import-previous').onclick=()=>{if(!editorEnabled)return;try{const previous=JSON.parse(localStorage.getItem(stockKey)||'null');if(!previous||typeof previous!=='object'||Array.isArray(previous))throw new Error('No previous browser counts found.');let previousSettings={};try{previousSettings=JSON.parse(localStorage.getItem(settingsKey)||'{}')||{};}catch{}const data=normalizeData({...snapshot(),farmName:typeof previousSettings.farmName==='string'?previousSettings.farmName:settings.farmName,showCounts:typeof previousSettings.showCounts==='boolean'?previousSettings.showCounts:settings.showCounts,tanks:previous});applyData(data);saveDraft();document.getElementById('json-message').textContent='Previous browser counts loaded into the draft. Download JSON to publish them.';}catch(error){document.getElementById('json-message').textContent=error.message;}};
function atClient(x,y){const matrix=svg.getScreenCTM();if(!matrix)return{x:view.x+view.w/2,y:view.y+view.h/2};return new DOMPoint(x,y).matrixTransform(matrix.inverse());}
function zoom(factor,point={x:view.x+view.w/2,y:view.y+view.h/2}){const w=Math.max(180,Math.min(initial.w*1.3,view.w*factor)),f=w/view.w;view.x=point.x-(point.x-view.x)*f;view.y=point.y-(point.y-view.y)*f;view.w=w;update();}
document.getElementById('zoom-in').onclick=()=>zoom(.8);document.getElementById('zoom-out').onclick=()=>zoom(1.25);document.getElementById('fit').onclick=reset;document.getElementById('reset').onclick=reset;
select.onchange=()=>select.value?selectTank(select.value):reset();
document.querySelectorAll('[data-block]').forEach(button=>button.onclick=()=>{const group=tanks.filter(t=>t.id[0]===button.dataset.block);const ps=group.flatMap(t=>t.points);focusBounds(bounds(ps));});
viewport.addEventListener('wheel',e=>{e.preventDefault();zoom(Math.exp(Math.max(-200,Math.min(200,e.deltaY))*.0015),atClient(e.clientX,e.clientY));},{passive:false});
const pointers=new Map();let dragged=false,lastDistance=0;
viewport.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;dragged=false;lastDistance=0;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});});
viewport.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;const old=pointers.get(e.pointerId),now={x:e.clientX,y:e.clientY};if(Math.hypot(now.x-old.x,now.y-old.y)>2)dragged=true;if(dragged&&!viewport.hasPointerCapture(e.pointerId))viewport.setPointerCapture(e.pointerId);pointers.set(e.pointerId,now);if(pointers.size===2){const[a,b]=[...pointers.values()],dist=Math.hypot(a.x-b.x,a.y-b.y);if(lastDistance>0)zoom(lastDistance/dist,atClient((a.x+b.x)/2,(a.y+b.y)/2));lastDistance=dist;dragged=true;}else{const a=atClient(old.x,old.y),b=atClient(now.x,now.y);view.x+=a.x-b.x;view.y+=a.y-b.y;update();}});
function endPointer(e){pointers.delete(e.pointerId);lastDistance=0;}viewport.addEventListener('pointerup',endPointer);viewport.addEventListener('pointercancel',endPointer);viewport.addEventListener('lostpointercapture',endPointer);window.addEventListener('pointerup',endPointer);
viewport.addEventListener('keydown',e=>{if(e.target!==viewport)return;const step=view.w*.06;switch(e.key){case '+':case '=':zoom(.8);break;case '-':zoom(1.25);break;case '0':reset();break;case 'ArrowLeft':view.x-=step;update();break;case 'ArrowRight':view.x+=step;update();break;case 'ArrowUp':view.y-=step;update();break;case 'ArrowDown':view.y+=step;update();break;default:return;}e.preventDefault();});
function mode(aerial){viewport.classList.toggle('aerial',aerial);['topview','aerialview'].forEach((id,i)=>{const on=Boolean(i)===aerial;document.getElementById(id).classList.toggle('active',on);document.getElementById(id).setAttribute('aria-pressed',String(on));});}
document.getElementById('topview').onclick=()=>mode(false);document.getElementById('aerialview').onclick=()=>mode(true);
const motion=document.getElementById('motion');let playing=!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function setMotion(){scene.classList.toggle('paused',!playing);motion.setAttribute('aria-pressed',String(playing));motion.setAttribute('aria-label',playing?'Pause water animation':'Resume water animation');motion.textContent=playing?'Ⅱ':'▷';}motion.onclick=()=>{playing=!playing;setMotion();};setMotion();
function stepSwimmer(fish,tank,dt){const margin=Math.max(7,18*fish.size);const fits=(x,y)=>inside(x-margin,y,tank.points)&&inside(x+margin,y,tank.points)&&inside(x,y-margin,tank.points)&&inside(x,y+margin,tank.points);let x=fish.x+Math.cos(fish.angle)*fish.speed*dt,y=fish.y+Math.sin(fish.angle)*fish.speed*dt;if(!fits(x,y)){fish.angle+=Math.PI*.7;for(let i=0;i<8;i++){x=fish.x+Math.cos(fish.angle)*fish.speed*dt;y=fish.y+Math.sin(fish.angle)*fish.speed*dt;if(fits(x,y))break;fish.angle+=Math.PI/4;}}if(fits(x,y)){fish.x=x;fish.y=y;}fish.phase+=dt*3;fish.element.setAttribute('transform',`translate(${fish.x.toFixed(2)} ${fish.y.toFixed(2)}) rotate(${(fish.angle*180/Math.PI+Math.sin(fish.phase)*3).toFixed(2)}) scale(${fish.size})`);}
let lastFishFrame=0;function animateFish(now){if(now-lastFishFrame>=33){const dt=lastFishFrame?Math.min(.08,(now-lastFishFrame)/1000):0;lastFishFrame=now;if(playing&&!document.hidden)for(const tank of tanks)for(const fish of tank.swimmers||[])stepSwimmer(fish,tank,dt);}requestAnimationFrame(animateFish);}if(typeof requestAnimationFrame==='function')requestAnimationFrame(animateFish);
document.getElementById('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{document.getElementById('fullscreen').textContent='Full screen unavailable';}};
const dialog=document.getElementById('reference-dialog');document.getElementById('reference-open').onclick=()=>dialog.showModal();document.getElementById('reference-close').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
update();
renderStock();
loadPublished();
