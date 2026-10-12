'use strict';
const NS='http://www.w3.org/2000/svg';
const tanks=[];
function rect(id,x,y,w,h){tanks.push({id:String(id),points:[[x,y],[x+w,y],[x+w,y+h],[x,y+h]]});}
function polygon(id,points){tanks.push({id:String(id),points});}

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
node('path',{d:'M73 552H1455M440 251V552M862 235V550',fill:'none',stroke:'#e5e6d9','stroke-width':13});
node('path',{d:'M92 250H415M482 250H842M902 135H1237',fill:'none',stroke:'#3b4943','stroke-width':7,'stroke-linecap':'round'});
for(let i=0;i<10;i++){let x=90+i*155;node('path',{d:`M${x} 576v12`,stroke:'#788579','stroke-width':3});}

[[45,82],[1570,87],[43,610],[1570,610],[620,86],[820,87]].forEach(([x,y])=>{const g=node('g',{filter:'url(#leafShadow)'});node('circle',{cx:x,cy:y,r:22,fill:'#6d8961'},g);node('circle',{cx:x-9,cy:y-5,r:15,fill:'#91a87a'},g);node('circle',{cx:x+6,cy:y+7,r:14,fill:'#557b53'},g);});

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

let renderPending=false;
function update(){
  view.w=Math.max(180,Math.min(initial.w*1.5,view.w));
  view.h=view.w*initial.h/initial.w;
  view.x=Math.max(-initial.w*.35,Math.min(initial.w-view.w*.1,view.x));
  view.y=Math.max(-initial.h*.35,Math.min(initial.h-view.h*.1,view.y));
  
  if(!renderPending){
    renderPending=true;
    requestAnimationFrame(()=>{
      svg.setAttribute('viewBox',`${view.x} ${view.y} ${view.w} ${view.h}`);
      const zElem=document.getElementById('zoom-level');
      if(zElem) zElem.value=`${Math.round(initial.w/view.w*100)}%`;
      renderPending=false;
    });
  }
}

function focusBounds(b){
  const w=Math.max(300,b.w+150,(b.h+130)*initial.w/initial.h);
  view={x:b.x+b.w/2-w/2,y:b.y+b.h/2-w*initial.h/initial.w/2,w,h:w*initial.h/initial.w};
  update();
}

function selectionDetails(){
  const form=document.getElementById('stock-form');form.hidden=!selected||!editorEnabled;if(!selected)return;
  const q=stock[selected];const description=q===undefined?'Fish quantity not set':q===0?'Empty · 0 fish':`${q.toLocaleString()} fish`;
  document.getElementById('selection').innerHTML=`<span class="selection-icon">≈</span><h3>Tank ${selected}</h3><p>Block ${selected[0]} · ${description}</p>`;
  document.getElementById('fish-quantity').value=q===undefined?'':String(q);
  document.getElementById('stock-message').textContent='';
}

function selectTank(id){const t=tanks.find(t=>t.id===id);if(!t)return;selected=id;select.value=id;tanks.forEach(t=>{t.element.classList.toggle('selected',t.id===id);t.element.setAttribute('aria-pressed',String(t.id===id));});focusBounds(t.bounds);selectionDetails();}
function reset(){
  selected=null;select.value='';
  tanks.forEach(t=>{t.element.classList.remove('selected');t.element.setAttribute('aria-pressed','false');});
  svg.style.transform='none';
  view={...initial};update();
  document.getElementById('selection').innerHTML='<span class="selection-icon">⌖</span><h3>Take a closer look</h3><p>Click a tank on the map or choose its number above.</p>';
  document.getElementById('stock-form').hidden=true;
}

function renderStock(){
  const largest=Math.max(0,...Object.values(stock));const unit=Math.max(1,Math.ceil(largest/120));
  for(const tank of tanks){
    const q=stock[tank.id],b=tank.bounds;const empty=q===0;
    tank.element.classList.toggle('empty',empty);tank.emptyLabel.setAttribute('visibility',empty?'visible':'hidden');
    tank.surface.setAttribute('fill',empty?'url(#dry)':'url(#water)');
    tank.water.setAttribute('visibility',empty?'hidden':'visible');tank.dry.setAttribute('visibility',empty?'visible':'hidden');
    tank.school.replaceChildren();tank.swimmers=[];
    const description=q===undefined?'quantity not set':empty?'Empty, 0 fish':`${q.toLocaleString()} fish`;
    tank.element.setAttribute('aria-label',`Tank ${tank.id}, ${description}`);tank.title.textContent=`Tank ${tank.id} — ${description}`;
    const count=q>0?Math.max(1,Math.round(q/unit)):0;tank.symbolCount=count;if(!count)continue;
    const candidates=[];
    for(let row=0;row<20;row++)for(let col=0;col<20;col++){
      const x=b.x+11+(col+.5)*(b.w-22)/20,y=b.y+11+(row+.5)*(b.h-22)/20;
      if(inside(x,y,tank.points)&&inside(x-11,y,tank.points)&&inside(x+11,y,tank.points)&&inside(x,y-11,tank.points)&&inside(x,y+11,tank.points))candidates.push({x,y});
    }
    const size=Math.max(.16,Math.min(.55,Math.sqrt(b.w*b.h/count)/34));
    for(let i=0;i<count;i++){
      const p=candidates[Math.floor((i+.5)*candidates.length/count)]||tank.center;
      const angle=((Number(tank.id)*37+i*137)%360)*Math.PI/180;
      const element=node('use',{href:'#fishShape',transform:`translate(${p.x} ${p.y}) rotate(${angle*180/Math.PI}) scale(${size})`},tank.school);
      tank.swimmers.push({x:p.x,y:p.y,angle,size,speed:4+(i*7+Number(tank.id))%7,phase:i*2.1,element});
    }
  }
  document.getElementById('fish-scale').textContent=largest===0?'Set fish quantities to populate the tanks':unit===1?'1 fish symbol = 1 fish':`1 fish symbol ≈ ${unit.toLocaleString()} fish · Same scale for all tanks`;
  const configured=Object.values(stock);const empty=configured.filter(q=>q===0).length,occupied=configured.filter(q=>q>0).length;
  document.getElementById('stock-summary').textContent=`${occupied} stocked · ${empty} empty · ${32-configured.length} not set`;
  renderCountLabels();
}

function renderCountLabels(){
  for(const tank of tanks){
    const q=stock[tank.id];const text=q===undefined?'':`${q.toLocaleString()} fish`;
    tank.countLabel.textContent=text;
    tank.countLabel.setAttribute('style',`font-size:${Math.min(10,(tank.bounds.w-14)/Math.max(1,text.length*.6))}px`);
    tank.countLabel.setAttribute('visibility',settings.showCounts&&q!==undefined?'visible':'hidden');
  }
  document.getElementById('show-counts').checked=settings.showCounts;
}

document.getElementById('show-counts').addEventListener('change',e=>{
  settings.showCounts=e.target.checked;renderCountLabels();
  if(editorEnabled){saveDraft();document.getElementById('label-message').textContent='Draft changed.';}
});

function applyFarmName(){
  document.getElementById('farm-brand').textContent=settings.farmName;
  document.getElementById('farm-footer').textContent=settings.farmName;
  document.getElementById('farm-name').value=settings.farmName;
  document.title=`${settings.farmName} | Aerial Tank Map`;
}

document.getElementById('farm-form').addEventListener('submit',e=>{
  e.preventDefault();if(!editorEnabled)return;
  const name=document.getElementById('farm-name').value.trim();
  if(!name||name.length>80)return;
  settings.farmName=name;saveDraft();applyFarmName();
});

function updateDate(now=new Date()){
  const date=document.getElementById('farm-date');
  date.textContent=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Seoul',day:'2-digit',month:'short',year:'numeric'}).format(now);
}
applyFarmName();updateDate();setInterval(updateDate,30000);

function setQuantity(id,q){
  if(!editorEnabled||!tanks.some(t=>t.id===id)||!Number.isSafeInteger(q)||q<0||q>maxQuantity)return false;
  stock[id]=q;saveDraft();renderStock();selectionDetails();return true;
}

document.getElementById('stock-form').addEventListener('submit',e=>{
  e.preventDefault();if(!selected)return;
  const input=document.getElementById('fish-quantity'),raw=input.value.trim();
  if(!raw||!/^\d+$/.test(raw)||!setQuantity(selected,Number(raw)))document.getElementById('stock-message').textContent='Enter a valid number.';
});
document.getElementById('mark-empty').onclick=()=>{if(selected)setQuantity(selected,0);};

function normalizeData(data){
  if(!data||typeof data!=='object'||Array.isArray(data)||data.version!==1)throw new Error('Version mismatch');
  return{version:1,farmName:data.farmName.trim(),showCounts:data.showCounts??true,updatedAt:data.updatedAt??null,tanks:Object.fromEntries([...tanks].sort((a,b)=>Number(a.id)-Number(b.id)).map(t=>[t.id,data.tanks[t.id]??null]))};
}
function snapshot(timestamp=snapshotUpdatedAt){return{version:1,farmName:settings.farmName,showCounts:settings.showCounts,updatedAt:timestamp,tanks:Object.fromEntries([...tanks].sort((a,b)=>Number(a.id)-Number(b.id)).map(t=>[t.id,stock[t.id]??null]))};}
function applyData(data){stock={};for(const[id,q]of Object.entries(data.tanks))if(q!==null)stock[id]=q;settings={farmName:data.farmName,showCounts:data.showCounts};snapshotUpdatedAt=data.updatedAt;applyFarmName();renderStock();selectionDetails();}
function saveDraft(){try{localStorage.setItem(draftKey,JSON.stringify(snapshot()));return true;}catch{return false;}}

function toggleEditor(enabled){
  editorEnabled=enabled;document.getElementById('edit-mode').textContent=enabled?'Close draft editor':'Edit / export JSON';
  document.getElementById('json-tools').hidden=!enabled;document.getElementById('farm-settings').hidden=!enabled;
  document.getElementById('reload-data').disabled=enabled;selectionDetails();
}
document.getElementById('edit-mode').onclick=()=>toggleEditor(!editorEnabled);

async function loadPublished(){
  const sequence=++loadSequence;
  try{
    const response=await fetch('./farm-data.json',{cache:'no-store'});
    const data=normalizeData(await response.json());
    if(sequence!==loadSequence)return;
    publishedData=data;if(!editorEnabled)applyData(data);
    document.getElementById('data-status').textContent='Showing published farm-data.json.';
  }catch(e){
    document.getElementById('data-status').textContent='Could not load published JSON.';
  }
}

document.getElementById('reload-data').onclick=()=>{if(!editorEnabled)loadPublished();};
document.getElementById('export-json').onclick=()=>{
  const blob=new Blob([JSON.stringify(snapshot(new Date().toISOString()),null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='farm-data.json';
  document.body.append(a);a.click();a.remove();
};

function atClient(x,y){
  const rect=svg.getBoundingClientRect();
  return{
    x:view.x+((x-rect.left)/rect.width)*view.w,
    y:view.y+((y-rect.top)/rect.height)*view.h
  };
}

function zoom(factor,point={x:view.x+view.w/2,y:view.y+view.h/2}){
  const w=Math.max(180,Math.min(initial.w*1.5,view.w*factor));
  const f=w/view.w;
  view.x=point.x-(point.x-view.x)*f;
  view.y=point.y-(point.y-view.y)*f;
  view.w=w;
  update();
}

document.getElementById('zoom-in').onclick=()=>zoom(0.8);
document.getElementById('zoom-out').onclick=()=>zoom(1.25);
document.getElementById('fit').onclick=reset;
document.getElementById('reset').onclick=reset;
select.onchange=()=>select.value?selectTank(select.value):reset();
document.querySelectorAll('[data-block]').forEach(button=>button.onclick=()=>{
  const group=tanks.filter(t=>t.id[0]===button.dataset.block);
  focusBounds(bounds(group.flatMap(t=>t.points)));
});

// =========================================================================
// ULTRA-SMOOTH MOBILE PINCH-ZOOM & PAN (HARDWARE ACCELERATED)
// =========================================================================
document.addEventListener('gesturestart',e=>e.preventDefault());
document.addEventListener('gesturechange',e=>e.preventDefault());
document.addEventListener('gestureend',e=>e.preventDefault());

let dragged=false;
let isPinching=false;
let startPinchDist=0;
let initialScale=1;
let currentScale=1;
let panX=0,panY=0;
let startPanX=0,startPanY=0;
let pinchCenterX=0,pinchCenterY=0;

function applyTransform(){
  svg.style.transform=`translate3d(${panX}px, ${panY}px, 0) scale(${currentScale})`;
}

function commitTransformToViewBox(){
  if(currentScale===1&&panX===0&&panY===0)return;
  const rect=viewport.getBoundingClientRect();
  const f=1/currentScale;
  const originX=view.x+(pinchCenterX/rect.width)*view.w;
  const originY=view.y+(pinchCenterY/rect.height)*view.h;

  const newW=Math.max(180,Math.min(initial.w*1.5,view.w*f));
  const newH=newW*initial.h/initial.w;

  view.x=originX-(pinchCenterX/rect.width)*newW-(panX/rect.width)*newW;
  view.y=originY-(pinchCenterY/rect.height)*newH-(panY/rect.height)*newH;
  view.w=newW;
  view.h=newH;

  svg.style.transform='none';
  currentScale=1;
  panX=0;
  panY=0;
  update();
}

viewport.addEventListener('wheel',e=>{
  e.preventDefault();
  zoom(Math.exp(Math.max(-200,Math.min(200,e.deltaY))*.0015),atClient(e.clientX,e.clientY));
},{passive:false});

viewport.addEventListener('touchstart',e=>{
  if(e.target.closest('button')||e.target.closest('select'))return;

  if(e.touches.length===1){
    dragged=false;
    isPinching=false;
    startPanX=e.touches[0].clientX-panX;
    startPanY=e.touches[0].clientY-panY;
  }else if(e.touches.length===2){
    e.preventDefault();
    isPinching=true;
    dragged=true;

    const t1=e.touches[0],t2=e.touches[1];
    startPinchDist=Math.hypot(t2.clientX-t1.clientX,t2.clientY-t1.clientY);
    initialScale=currentScale;

    const rect=viewport.getBoundingClientRect();
    pinchCenterX=((t1.clientX+t2.clientX)/2)-rect.left;
    pinchCenterY=((t1.clientY+t2.clientY)/2)-rect.top;
  }
},{passive:false});

viewport.addEventListener('touchmove',e=>{
  e.preventDefault();

  if(e.touches.length===1&&!isPinching){
    dragged=true;
    const rect=svg.getBoundingClientRect();
    const dx=(e.touches[0].clientX-startPanX)*(view.w/rect.width);
    const dy=(e.touches[0].clientY-startPanY)*(view.h/rect.height);

    view.x-=dx*0.18;
    view.y-=dy*0.18;
    startPanX=e.touches[0].clientX;
    startPanY=e.touches[0].clientY;
    update();
  }else if(e.touches.length===2&&isPinching){
    const t1=e.touches[0],t2=e.touches[1];
    const currentDist=Math.hypot(t2.clientX-t1.clientX,t2.clientY-t1.clientY);

    if(startPinchDist>5){
      const zoomFactor=currentDist/startPinchDist;
      currentScale=Math.min(Math.max(initialScale*zoomFactor,0.6),4.0);
      requestAnimationFrame(applyTransform);
    }
  }
},{passive:false});

function handleTouchEnd(e){
  if(e.touches.length<2&&isPinching){
    isPinching=false;
    commitTransformToViewBox();
  }
  if(e.touches.length===0){
    dragged=false;
    isPinching=false;
  }
}

viewport.addEventListener('touchend',handleTouchEnd,{passive:true});
viewport.addEventListener('touchcancel',handleTouchEnd,{passive:true});

function mode(aerial){
  viewport.classList.toggle('aerial',aerial);
  ['topview','aerialview'].forEach((id,i)=>{
    const on=Boolean(i)===aerial;
    document.getElementById(id).classList.toggle('active',on);
  });
}
document.getElementById('topview').onclick=()=>mode(false);
document.getElementById('aerialview').onclick=()=>mode(true);

const motion=document.getElementById('motion');
let playing=true;
function setMotion(){
  scene.classList.toggle('paused',!playing);
  motion.textContent=playing?'Ⅱ':'▷';
}
motion.onclick=()=>{playing=!playing;setMotion();};

let lastFishFrame=0;
function animateFish(now){
  if(now-lastFishFrame>=33){
    const dt=lastFishFrame?Math.min(.08,(now-lastFishFrame)/1000):0;
    lastFishFrame=now;
    if(playing&&!document.hidden){
      for(const tank of tanks){
        for(const fish of tank.swimmers||[]){
          fish.phase+=dt*3;
          fish.element.setAttribute('transform',`translate(${fish.x.toFixed(1)} ${fish.y.toFixed(1)}) rotate(${((fish.angle*180/Math.PI)+Math.sin(fish.phase)*3).toFixed(1)}) scale(${fish.size})`);
        }
      }
    }
  }
  requestAnimationFrame(animateFish);
}
requestAnimationFrame(animateFish);

const dialog=document.getElementById('reference-dialog');
document.getElementById('reference-open').onclick=()=>dialog.showModal();
document.getElementById('reference-close').onclick=()=>dialog.close();

update();
renderStock();
loadPublished();
