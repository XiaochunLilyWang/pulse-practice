
const $=id=>document.getElementById(id);const config={bpm:120,sub:2,pattern:'stairs',speed:5,bars:8,metro:true,hitTone:'bright',haptics:true,stairsDirection:'right',customLanes:Array(48).fill(null),jackMode:'bar',trillMode:'bar',customDivision:4,customSteps12:Array.from({length:12},(_,i)=>i%3===0),customSteps:Array.from({length:16},(_,i)=>i%4===0)};const patterns=[{id:'jack',name:'纵连',seq:[0,0,0,0],hint:'每 4 个音符换轨'},{id:'trill',name:'交互',seq:[0,3,0,3],hint:'每 8 个音符换一组双轨'},{id:'stairs',name:'楼梯',seq:[0,1,2,3],hint:'1 → 2 → 3 → 4'},{id:'double',name:'双押',seq:[[0,3],[1,2],[0,1],[2,3]],hint:'两轨同时击打 · 轮换组合'},{id:'random',name:'随机',seq:[2,0,3,1],hint:'四轨随机分配'},{id:'custom',name:'自定义键型',seq:[0,2,1,3],hint:'按节奏逐个安排轨道'}];const names={1:'四分音符',2:'八分音符',3:'三连音',4:'十六分音符',custom:'自定义节奏'};let saved;try{saved=JSON.parse(localStorage.getItem('pulse-config'))}catch{}if(saved){for(const k of ['bpm','sub','speed','bars'])if(Number.isFinite(saved[k]))config[k]=saved[k];if(Array.isArray(saved.customLanes)&&saved.customLanes.length===48)config.customLanes=saved.customLanes.map(v=>Number.isInteger(v)&&v>=0&&v<4?v:null);if(patterns.some(p=>p.id===saved.pattern))config.pattern=saved.pattern;if(['left','right','bounce'].includes(saved.stairsDirection))config.stairsDirection=saved.stairsDirection;if(['light','heavy','bright','off'].includes(saved.hitTone))config.hitTone=saved.hitTone==='off'?'off':'bright';if(typeof saved.haptics==='boolean')config.haptics=saved.haptics;if(typeof saved.metro==='boolean')config.metro=saved.metro;for(const key of ['jackMode','trillMode'])if(['fixed','bar'].includes(saved[key]))config[key]=saved[key];if([3,4].includes(saved.customDivision))config.customDivision=saved.customDivision;if(Array.isArray(saved.customSteps12)&&saved.customSteps12.length===12&&saved.customSteps12.every(v=>typeof v==='boolean'))config.customSteps12=saved.customSteps12;if(saved.sub==='custom')config.sub='custom';if(Array.isArray(saved.customSteps)&&saved.customSteps.length===16&&saved.customSteps.every(v=>typeof v==='boolean'))config.customSteps=saved.customSteps;}config.bpm=Math.min(300,Math.max(30,Math.round(config.bpm)));config.speed=Math.min(10,Math.max(1,config.speed));if(![1,2,3,4,'custom'].includes(config.sub))config.sub=2;config.bars=Math.min(128,Math.max(1,Math.round(config.bars)));
const isPlayPage=document.body.classList.contains('play-page');
if(!isPlayPage) $('patterns').innerHTML=patterns.map(p=>`<button class="choice ${p.id==='custom'?'custom-pattern-choice':''}" data-value="${p.id}"><span class="glyph">${p.seq.map(n=>[0,1,2,3].map(j=>`<b class="${(Array.isArray(n)?n.includes(j):j===n)?'on':''}"></b>`).join('')).join('')}</span>${p.name}</button>`).join('');
let previewEpoch=performance.now();
function customSteps(){return config.customDivision===3?config.customSteps12:config.customSteps}
function renderBeatGrid(){const division=config.customDivision;$('precisionSummary').textContent=`4 拍 × ${division} 格`;$('beatGrid').style.setProperty('--division',division);if($('beatGrid').dataset.division!==String(division)){$('beatGrid').dataset.division=division;$('beatGrid').innerHTML=Array.from({length:4},(_,beat)=>`<div class="beat-row"><span class="beat-label">第 ${beat+1} 拍</span>${Array.from({length:division},(_,step)=>`<button class="beat-cell" data-step="${beat*division+step}" aria-label="第 ${beat+1} 拍，第 ${step+1} 格" aria-pressed="false">${["①","②","③","④"][step]}</button>`).join('')}</div>`).join('')}for(const button of $('precisionModes').children){const selected=Number(button.dataset.value)===division;button.classList.toggle('active',selected);button.setAttribute('aria-pressed',selected)}}
if(!isPlayPage) $('precisionModes').onclick=e=>{const button=e.target.closest('button');if(button){config.customDivision=Number(button.dataset.value);update()}};

// A 1/48-bar grid gives every supported subdivision an exact, stable position.
function customLaneSlot(offset){return Math.round(offset*12)}
function customLane(offset,index){return config.customLanes[customLaneSlot(offset)]??index%4}
function renderPatternEditor(){
const editor=$('patternEditor');editor.hidden=config.pattern!=='custom';if(editor.hidden)return;
const offsets=rhythmOffsets(),division=config.sub==='custom'?config.customDivision:config.sub;
$('patternEditorSummary').textContent=`${offsets.length} 个音符 / 小节 · 循环 ${config.bars} 次`;
$('patternEditorEmpty').hidden=offsets.length>0;
for(const button of $('patternShortcuts').children)button.disabled=!offsets.length;
const grid=$('patternGrid'),signature=division+':'+offsets.join(',');
if(grid.dataset.signature!==signature){
grid.dataset.signature=signature;
grid.innerHTML=offsets.map((offset,i)=>{
const beat=Math.floor(offset)+1,step=Math.round((offset-Math.floor(offset))*division);
return `<div class="pattern-row ${step===0?'beat-start':''}" data-slot="${customLaneSlot(offset)}"><span class="pattern-position"><strong>第 ${beat} 拍</strong><small>${['①','②','③','④'][step]}</small></span>${[0,1,2,3].map(l=>`<button type="button" data-lane="${l}" aria-label="第 ${beat} 拍，第 ${step+1} 格，轨道 ${l+1}" aria-pressed="false"><span aria-hidden="true"></span></button>`).join('')}</div>`;
}).join('');
}
offsets.forEach((offset,i)=>{const slot=customLaneSlot(offset);if(config.customLanes[slot]===null)config.customLanes[slot]=i%4;});
for(const row of grid.children)for(const b of row.querySelectorAll('button')){const active=Number(b.dataset.lane)===config.customLanes[Number(row.dataset.slot)];b.classList.toggle('active',active);b.setAttribute('aria-pressed',active)}
}
function update(){
renderPatternEditor();
$('stairsOptions').hidden=config.pattern!=='stairs';
for(const b of $('stairsDirections').children){const on=b.dataset.value===config.stairsDirection;b.classList.toggle('active',on);b.setAttribute('aria-pressed',on)}
$('stairsHint').textContent=stairsHint();
$('hitTone').value=config.hitTone;$('haptics').setAttribute('aria-checked',config.haptics);
$('hapticNote').textContent=typeof navigator.vibrate==='function'?'命中时轻震，设备支持时生效':'当前浏览器不支持震动，仍有声音与光效';
renderBeatGrid();previewEpoch=performance.now();$('rhythmEditor').hidden=config.sub!=='custom';const count=customSteps().filter(Boolean).length;$('rhythmStatus').textContent=count?`已选 ${count} 个音符 / 小节 · 将循环 ${config.bars} 次`:'还没有拍子，点亮至少一格后开始练习';$('start').disabled=config.sub==='custom'&&!count;for(const cell of $('beatGrid').querySelectorAll('button')){const on=customSteps()[+cell.dataset.step];cell.classList.toggle('active',on);cell.setAttribute('aria-pressed',on)}$('travelTime').textContent=`落至判定线 ${Math.round(travel()*1000)} ms`; $('bpm').value=config.bpm;$('bpmRange').value=config.bpm;$('speed').value=config.speed;$('speedValue').textContent=config.speed.toFixed(1);$('barsValue').value=config.bars;$('duration').textContent=`约 ${Math.round(config.bars*240/config.bpm)} 秒`;$('previewSummary').textContent=`${config.bpm} BPM · ${names[config.sub]} · ${patterns.find(p=>p.id===config.pattern).name}`;const grouped=config.pattern==='jack'||config.pattern==='trill';$('laneOptions').hidden=!grouped;const laneMode=config[config.pattern+'Mode'];$('fixedLaneMode').textContent=config.pattern==='trill'?'一直同两轨':'一直单轨';for(const button of $('laneModes').children){const selected=button.dataset.value===laneMode;button.classList.toggle('active',selected);button.setAttribute('aria-pressed',selected)}$('laneModeHint').textContent=config.pattern==='jack'?(laneMode==='fixed'?'整段练习固定在第 1 轨。':'每小节固定一轨，下个小节按 1 → 3 → 2 → 4 换轨。'):(laneMode==='fixed'?'整段练习固定在第 1、4 轨交替。':'同一小节内保持双轨交替，下个小节更换双轨组合。');$('patternHint').textContent=grouped?(laneMode==='fixed'?'固定轨道':'每小节换轨'):config.pattern==='stairs'?stairsHint():patterns.find(p=>p.id===config.pattern).hint;$('metronome').setAttribute('aria-checked',config.metro);for(const [id,key] of [['rhythms','sub'],['patterns','pattern'],['bars','bars']])for(const b of $(id).children){b.classList.toggle('active',b.dataset.value===String(config[key]));b.setAttribute('aria-pressed',b.dataset.value===String(config[key]));}try{localStorage.setItem('pulse-config',JSON.stringify(config))}catch{}}
if(!isPlayPage){
$('patternGrid').onclick=e=>{const b=e.target.closest('button[data-lane]');if(!b)return;const row=b.closest('[data-slot]');config.customLanes[Number(row.dataset.slot)]=Number(b.dataset.lane);update()};
$('patternShortcuts').onclick=e=>{const b=e.target.closest('button');if(!b)return;rhythmOffsets().forEach((offset,i)=>{config.customLanes[customLaneSlot(offset)]=b.dataset.fill==='jack'?0:b.dataset.fill==='trill'?(i%2?3:0):i%4});update()};
$('stairsDirections').onclick=e=>{const b=e.target.closest('button');if(b){config.stairsDirection=b.dataset.value;update()}};
$('hitTone').onchange=e=>{config.hitTone=e.target.value;update()};
$('haptics').onclick=()=>{config.haptics=!config.haptics;update()};
for(const [id,key] of [['rhythms','sub'],['patterns','pattern'],['bars','bars']])$(id).onclick=e=>{const b=e.target.closest('button');if(b){config[key]=key==='pattern'||b.dataset.value==='custom'?b.dataset.value:Number(b.dataset.value);update()}};$('laneModes').onclick=e=>{const button=e.target.closest('button');if(button&&(config.pattern==='jack'||config.pattern==='trill')){config[config.pattern+'Mode']=button.dataset.value;update()}};function bpm(v){config.bpm=Math.min(300,Math.max(30,Math.round(Number(v)||120)));update()}$('bpm').oninput=e=>{const v=Number(e.target.value);if(v>=30&&v<=300){config.bpm=Math.round(v);update()}};$('bpm').onchange=e=>bpm(e.target.value);$('bpm').onblur=e=>bpm(e.target.value);$('bpmRange').oninput=e=>bpm(e.target.value);$('minus').onclick=()=>bpm(config.bpm-5);$('plus').onclick=()=>bpm(config.bpm+5);$('speed').oninput=e=>{config.speed=+e.target.value;update()};$('metronome').onclick=()=>{config.metro=!config.metro;update()};update();
}
let audio,hitBuffer,run=null,mode='idle',lastJudge=0;const impactGreat=[false,false,false,false],impacts=[-Infinity,-Infinity,-Infinity,-Infinity],flash=[-Infinity,-Infinity,-Infinity,-Infinity],keys=['D','F','J','K'];function sound(time,freq=850,dur=.04,vol=.09){if(!audio)return;const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(vol,time);g.gain.exponentialRampToValueAtTime(.001,time+dur);o.connect(g);g.connect(audio.destination);o.start(time);o.stop(time+dur)}// Render a single bright snare-like hit once, including a short, quiet room tail.
function createHitBuffer(context){
const rate=context.sampleRate,length=Math.ceil(rate*.24),dry=new Float32Array(length),mix=new Float32Array(length);
let seed=173,low=0,high=0,phase=0;
for(let i=0;i<length;i++){
const t=i/rate;seed=(Math.imul(seed,1664525)+1013904223)>>>0;
const noise=seed/2147483648-1;
low+=(1-Math.exp(-2*Math.PI*700/rate))*(noise-low);
high+=(1-Math.exp(-2*Math.PI*8500/rate))*(noise-low-high);
phase+=2*Math.PI*(180+160*Math.exp(-t/.012))/rate;
const attack=Math.min(1,t/.0007);
const snap=high*Math.exp(-t/.019)*.9;
const body=Math.sin(phase)*Math.exp(-t/.026)*.42;
const stick=Math.sin(2*Math.PI*2100*t)*Math.exp(-t/.004)*.15;
dry[i]=attack*(snap+body+stick)*Math.max(0,1-t/.12);
}
mix.set(dry);
// Diffuse early reflections are baked into the sample; the dry attack stays immediate.
for(const [delay,gain] of [[.013,.12],[.019,-.10],[.029,.09],[.037,.075],[.047,-.06],[.061,.05],[.079,.035],[.101,.025]]){
const offset=Math.round(delay*rate);let reflection=0;
for(let i=offset;i<length;i++){reflection+=.55*(dry[i-offset]-reflection);mix[i]+=reflection*gain;}
}
let peak=0;for(const value of mix)peak=Math.max(peak,Math.abs(value));
const buffer=context.createBuffer(1,length,rate),data=buffer.getChannelData(0);
for(let i=0;i<length;i++)data[i]=mix[i]*(peak?.3/peak:0);
return buffer;
}
function hitSound(){
if(!audio||audio.state!=='running'||config.hitTone==='off')return;
if(!hitBuffer)hitBuffer=createHitBuffer(audio);
const source=audio.createBufferSource();source.buffer=hitBuffer;source.connect(audio.destination);
source.addEventListener('ended',()=>source.disconnect());source.start(audio.currentTime);
}
function stairsHint(){return ({right:'向右 · 1 → 2 → 3 → 4',left:'向左 · 4 → 3 → 2 → 1',bounce:'往返 · 1 → 2 → 3 → 4 → 3 → 2'})[config.stairsDirection]+(config.sub===3?' · 三音一组':'')}
function impact(l,diff){impactGreat[l]=!withinJudgmentWindow(diff,.050);impacts[l]=performance.now();if(config.haptics&&typeof navigator.vibrate==='function')try{navigator.vibrate(12)}catch{}}
function lane(i,barIndex=0,indexInBar=i){const mod=(n,m)=>((n%m)+m)%m;if(config.pattern==='jack')return config.jackMode==='fixed'?0:[0,2,1,3][mod(barIndex,4)];if(config.pattern==='stairs'){
const triplet=config.sub===3;
if(config.stairsDirection==='bounce')return triplet?[[0,1,2],[1,2,3],[3,2,1],[2,1,0]][mod(Math.floor(i/3),4)][mod(i,3)]:[0,1,2,3,2,1][mod(i,6)];
const n=triplet?mod(Math.floor(i/3),2)+mod(i,3):mod(i,4);
return config.stairsDirection==='left'?3-n:n;
}if(config.pattern==='trill'){const pairs=[[0,3],[1,2],[0,1],[2,3],[0,2],[1,3]];return pairs[config.trillMode==='fixed'?0:mod(barIndex,pairs.length)][mod(config.trillMode==='fixed'?i:indexInBar,2)]}if(config.pattern==='random')return ((Math.imul(i+17,1103515245)>>>8)>>>0)%4;return patterns.find(p=>p.id===config.pattern).seq[mod(i,4)]}
function travel(){return 1.45-config.speed*.12}
function rhythmOffsets(){return config.sub==='custom'?customSteps().flatMap((on,i)=>on?[i/config.customDivision]:[]):Array.from({length:4*config.sub},(_,i)=>i/config.sub)}
function makeNotes(firstBar,barCount){
const offsets=rhythmOffsets(),beat=60/config.bpm;
return Array.from({length:barCount},(_,b)=>offsets.flatMap((offset,j)=>{
const i=(firstBar+b)*offsets.length+j;
const lanes=config.pattern==='custom'?[customLane(offset,j)]:config.pattern==='double'?[[0,3],[1,2],[0,1],[2,3],[0,2],[1,3]][i%6]:[lane(i,firstBar+b,j)];
return lanes.map(lane=>({time:((firstBar+b)*4+offset)*beat,lane,hit:false}));
})).flat();
}
let paint=null;function paintCell(cell){if(!cell||!cell.matches('.beat-cell')||paint.visited.has(cell.dataset.step))return;paint.visited.add(cell.dataset.step);customSteps()[+cell.dataset.step]=paint.on;update()}
if(!isPlayPage){
$('beatGrid').addEventListener('pointerdown',e=>{const cell=e.target.closest('.beat-cell');if(!cell||!e.isPrimary)return;e.preventDefault();paint={id:e.pointerId,on:!customSteps()[+cell.dataset.step],visited:new Set()};$('beatGrid').setPointerCapture(e.pointerId);paintCell(cell)});
$('beatGrid').addEventListener('pointermove',e=>{if(!paint||e.pointerId!==paint.id)return;e.preventDefault();paintCell(document.elementFromPoint(e.clientX,e.clientY))});
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('beatGrid').addEventListener(event,()=>{paint=null});
$('beatGrid').addEventListener('click',e=>{const cell=e.target.closest('.beat-cell');if(cell&&e.detail===0){customSteps()[+cell.dataset.step]=!customSteps()[+cell.dataset.step];update()}});
$('quarterFill').onclick=()=>{customSteps().forEach((_,i,steps)=>steps[i]=i%config.customDivision===0);update()};$('fillRhythm').onclick=()=>{customSteps().fill(true);update()};$('clearRhythm').onclick=()=>{customSteps().fill(false);update()};
}
function draw(canvas,notes,t,playing){const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;const d=Math.min(devicePixelRatio||1,2);if(canvas.width!==Math.round(r.width*d)||canvas.height!==Math.round(r.height*d)){canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d)}const c=canvas.getContext('2d');c.setTransform(d,0,0,d,0,0);const w=r.width,h=r.height,lw=w/4,target=h-80,T=travel(),extraInset=playing&&document.body.dataset.layout!=='portrait'?lw*.1:0;c.clearRect(0,0,w,h);for(let l=0;l<4;l++){const grd=c.createLinearGradient(0,0,0,h);grd.addColorStop(0,l%2?'#161c13':'#192016');grd.addColorStop(1,'#242f1c');c.fillStyle=grd;c.fillRect(l*lw,0,lw,h);c.strokeStyle='#34402b';c.beginPath();c.moveTo(l*lw,0);c.lineTo(l*lw,h);c.stroke();if(playing&&performance.now()-flash[l]<110){c.fillStyle=impactGreat[l]?'#ffffff28':'#cefa7728';c.fillRect(l*lw,0,lw,h)}}const beat=60/config.bpm;for(let k=Math.floor((t-T)/beat);k<(t+T)/beat+1;k++){const y=target-(k*beat-t)/T*target;if(y>=0&&y<=target){c.strokeStyle=k%4===0?'#465638':'#2a3523';c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke()}}for(const n of notes){if(n.hit)continue;const y=target-(n.time-t)/T*target;if(y<0||y>target+24)continue;const x=n.lane*lw+7+extraInset;c.shadowColor='#bded70';c.shadowBlur=7;c.fillStyle=n.lane===0||n.lane===3?'#d6fbaa':'#b9df78';c.fillRect(x,y-6,lw-14-2*extraInset,9);c.shadowBlur=0;c.fillStyle='#e8ffcd';c.fillRect(x,y-6,lw-14-2*extraInset,2)}c.fillStyle='#c9f47b';c.fillRect(0,target,w,2);for(let l=0;l<4;l++){c.fillStyle=playing&&performance.now()-flash[l]<110?(impactGreat[l]?'#ffffff':'#cefa77'):'#303f24';c.fillRect(l*lw+6+extraInset,target+14,lw-12-2*extraInset,48);c.fillStyle='#a6b894';c.textAlign='center';c.font='12px monospace';c.fillText(keys[l],l*lw+lw/2,target+43)}
if(playing)for(let l=0;l<4;l++){
const age=(performance.now()-impacts[l])/1000;if(age<0||age>.32)continue;
const fade=(1-age/.32)**2,x=(l+.5)*lw;
const rgb=impactGreat[l]?'255,255,255':'206,250,119';
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const spread=reduced?0:age;
c.save();c.globalAlpha=fade;
// Soft radial bloom: no stroked outline, hard edge or flying particles.
c.translate(x,target);c.scale(Math.min(lw*.72,110)+spread*65,30+spread*65);
const glow=c.createRadialGradient(0,0,0,0,0,1);
glow.addColorStop(0,`rgba(${rgb},.95)`);
glow.addColorStop(.18,`rgba(${rgb},.7)`);
glow.addColorStop(.48,`rgba(${rgb},.3)`);
glow.addColorStop(1,`rgba(${rgb},0)`);
c.fillStyle=glow;c.fillRect(-1,-1,2,2);
c.restore();
}
}
function withinJudgmentWindow(diff, limit) {
  // One nanosecond absorbs floating-point subtraction error without widening
  // the 50/100 ms windows by a perceptible amount.
  return Math.abs(diff) <= limit + 1e-9;
}
function judgeMisses(t) {
  for (const n of run.notes) {
    if (!n.hit && t > n.time && !withinJudgmentWindow(t - n.time, .100)) judge(n, null);
  }
}
function start(){if(rotationRequired()||!rhythmOffsets().length)return;impacts.fill(-Infinity);flash.fill(-Infinity);PulseCelebration.clear();if(!audio){const A=window.AudioContext||window.webkitAudioContext;if(A)try{audio=new A()}catch{}}if(audio){if(!hitBuffer)hitBuffer=createHitBuffer(audio);audio.resume().catch(()=>{})}const beat=60/config.bpm;run={notes:makeNotes(0,config.bars),start:performance.now()+4*beat*1000,nextBeat:-4,combo:0,max:0,points:0,judged:0,perfect:0,great:0,lost:0,offsets:[],duration:config.bars*4*beat};mode='playing';$('pause').disabled=false;$('progress').style.width='0%';$('barNow').textContent=`1 / ${config.bars}`;$('overlay').hidden=true;document.body.style.overflow='hidden';$('gameInfo').textContent=`${config.bpm} BPM · ${names[config.sub]}`;lastJudge=0;stats();}function elapsed(){return (performance.now()-run.start)/1000}function stats(){$('accuracy').textContent=(run.judged?run.points/run.judged*100:100).toFixed(1)+'%';$('combo').textContent=run.combo}function judge(n,diff){n.hit=true;run.judged++;if(diff===null||!withinJudgmentWindow(diff,.100)){run.lost++;run.combo=0;showJudge('LOST','下一拍，继续')}else{const perfect=withinJudgmentWindow(diff,.050);run[perfect?'perfect':'great']++;run.points+=perfect?1:.5;run.combo++;run.max=Math.max(run.max,run.combo);run.offsets.push(diff*1000);showJudge(perfect?'PERFECT':'GREAT',`${diff===0?'准时':diff<0?'偏早':'偏晚'} ${Math.abs(Math.round(diff*1000))} ms`,perfect?'':diff<0?'early':'late')}stats()}function showJudge(text,sub,timing=''){$('judgment').innerHTML=`<span class="judge-word ${text==='GREAT'?'great':''}">${text}</span><small class="timing ${timing}">${sub}</small>`;lastJudge=performance.now()}function hit(l){if(mode!=='playing')return;flash[l]=performance.now();impactGreat[l]=false;const t=elapsed();judgeMisses(t);const n=run.notes.find(n=>!n.hit&&n.lane===l&&withinJudgmentWindow(n.time-t,.100));if(n){judge(n,t-n.time);hitSound(l);impact(l,t-n.time)}}function pause(){if(mode!=='playing')return;run.paused=performance.now();mode='paused';$('overlay').hidden=false;$('overlayContent').innerHTML='<div class="eyebrow">TAKE A BREATH</div><h2>稍作停顿</h2><p>准备好后，继续你的节奏。</p><button id="resume">继续练习</button><button id="restart" class="secondary">重新开始</button><button id="back" class="secondary">返回设置</button>';$('resume').onclick=()=>{if(rotationRequired())return;run.start+=performance.now()-run.paused;mode='playing';$('overlay').hidden=true};$('restart').onclick=start;$('back').onclick=back}function back(){PulseCelebration.clear();window.location.href='./index.html'}function finish(){if(mode==='result')return;mode='result';const award=PulseHistory.achievement(run);PulseHistory.save(run,config,document.body.dataset.layout);const acc=(run.points/run.notes.length*100).toFixed(1);const avg=run.offsets.length?run.offsets.reduce((a,b)=>a+b,0)/run.offsets.length:null;$('overlay').hidden=false;$('overlayContent').innerHTML=`<div class="eyebrow">PRACTICE COMPLETE</div>${PulseCelebration.badge(award)}<h2>${award==='ap'?'每一拍，完美命中。':award==='fc'?'一拍不落，全连达成！':'每一拍，都算进步。'}</h2><div class="score">${acc}<span style="font-size:22px">%</span></div><p>准确率 · 最大连击 ${run.max}<br>PERFECT ${run.perfect} &nbsp; GREAT ${run.great} &nbsp; LOST ${run.lost}<br>${avg===null?'本次没有击中音符':`平均${avg<0?'偏早':'偏晚'} ${Math.abs(Math.round(avg))} ms`}<br>${config.bpm} BPM / ${config.bars} 小节 / ${patterns.find(p=>p.id===config.pattern).name}</p><button id="again">再练一次 ↗</button><button id="back" class="secondary">调整参数</button><section class="history-panel" data-history data-history-compact aria-label="历史战绩"></section>`;PulseHistory.render($('overlayContent').querySelector('[data-history]'));$('again').onclick=start;$('back').onclick=back;$('overlay').scrollTop=0;PulseCelebration.play(award)}
if(!isPlayPage){
$('barsValue').onchange=e=>{config.bars=Math.min(128,Math.max(1,Math.round(Number(e.target.value)||8)));update()};$('start').onclick=()=>{bpm($('bpm').value);$('displayPicker').showModal()};$('cancelDisplay').onclick=()=>$('displayPicker').close();
for(const button of document.querySelectorAll('[data-layout]'))button.onclick=()=>{window.location.href='./play.html?layout='+button.dataset.layout};
}else{
$('pause').onclick=pause;$('playStage').addEventListener('pointerdown',e=>{e.preventDefault();const r=$('playStage').getBoundingClientRect();hit(Math.max(0,Math.min(3,Math.floor((e.clientX-r.left)/r.width*4))))});document.addEventListener('keydown',e=>{if(mode==='idle'||mode==='result'||e.repeat)return;const l=['KeyD','KeyF','KeyJ','KeyK'].indexOf(e.code);if(l!==-1){e.preventDefault();hit(l)}if(e.code==='Space'){e.preventDefault();if(mode==='playing')pause();else if(mode==='paused')$('resume').click()}});document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='playing')pause()});
setupPlayPage();
}
function frame(){if(mode==='idle'&&!isPlayPage){const t=(performance.now()-previewEpoch)/1000;const barDuration=240/config.bpm;const first=Math.max(0,Math.floor(t/barDuration)-1);const notes=makeNotes(first,Math.ceil(travel()/barDuration)+3);draw($('previewCanvas'),notes,t,false)}else if(mode==='playing'){const t=elapsed(),beat=60/config.bpm;if(t<0){$('judgment').innerHTML=`${Math.ceil(-t/beat)}<small>跟随节拍，准备开始</small>`}else if(performance.now()-lastJudge>550)$('judgment').innerHTML='';while(run.nextBeat*beat<=t){if(audio&&(config.metro||run.nextBeat<0)&&t-run.nextBeat*beat<.1&&run.nextBeat<config.bars*4)sound(audio.currentTime,run.nextBeat%4===0?1300:850);run.nextBeat++}judgeMisses(t);$('barNow').textContent=`${Math.max(1,Math.min(config.bars,Math.floor(t/(beat*4))+1))} / ${config.bars}`;$('progress').style.width=`${Math.min(100,Math.max(0,t/run.duration*100))}%`;draw($('gameCanvas'),run.notes,t,true);if(t>=run.duration+.15)finish()}else if(isPlayPage&&mode!=='idle'){draw($('gameCanvas'),run?run.notes:[],run?(mode==='paused'?(run.paused-run.start)/1000:elapsed()):0,true)}requestAnimationFrame(frame)}frame();

function setupPlayPage(){
 const requested=new URLSearchParams(location.search).get('layout');
 const layout=['landscape','mobile-landscape'].includes(requested)?requested:'portrait',landscape=layout!=='portrait';
 document.body.dataset.layout=layout;
 const label=layout==='mobile-landscape'?'手机横屏 · 16:9':landscape?'iPad 横屏 · 4:3':'手机竖屏 · 9:16';
 document.title=label+' · PULSE';
 $('layoutLabel').textContent=label;
 if(layout==='mobile-landscape'){
  const sidebar=document.createElement('aside');sidebar.className='play-sidebar';sidebar.setAttribute('aria-label','判定与练习信息');
  sidebar.append(document.querySelector('.gamebar'),document.querySelector('.stats'),$('judgment'),document.querySelector('.progress'));
  $('game').insertBefore(sidebar,$('overlay'));
 }
 function fit(){
  const shell=$('playViewport');
  if(layout==='mobile-landscape'){
   const sidebar=Math.min(184,Math.max(148,shell.clientWidth*.2));
   const height=Math.max(0,Math.min(shell.clientHeight-2,(shell.clientWidth-sidebar-2)*9/16));
   $('game').style.setProperty('--sidebar-width',sidebar+'px');
   $('game').style.width=(height*16/9+sidebar+2)+'px';$('game').style.height=(height+2)+'px';
  }else{
   const ratio=landscape?4/3:9/16,width=Math.min(shell.clientWidth,shell.clientHeight*ratio);
   $('game').style.width=width+'px';$('game').style.height=width/ratio+'px';
  }
  $('rotationGate').hidden=!rotationRequired();if(rotationRequired()&&mode==='playing')pause();
  $('rotateHint').textContent=landscape&&window.innerHeight>window.innerWidth?'横放设备，获得更大的练习区域':'';
 }
 new ResizeObserver(fit).observe($('playViewport'));window.addEventListener('resize',fit);fit();
 mode='ready';
 $('pause').disabled=true;
 $('gameInfo').textContent=`${config.bpm} BPM · ${names[config.sub]}`;
 $('barNow').textContent=`1 / ${config.bars}`;
 $('overlay').hidden=false;
 const empty=!rhythmOffsets().length;
 $('overlayContent').innerHTML=`<div class="eyebrow">FIND YOUR FLOW</div><h2>${landscape?'横屏练习':'竖屏练习'}</h2><p>${config.bpm} BPM · ${names[config.sub]}<br>${patterns.find(p=>p.id===config.pattern).name} · 速度 ${config.speed.toFixed(1)} · ${config.bars} 小节</p><p>${empty?'请先在设置中点亮至少一格节奏。':'准备好后，跟随四拍倒数开始。'}</p>${empty?'':'<button id="begin">开始倒数 ↗</button>'}<button id="back" class="secondary">返回设置</button>`;
 if(!empty)$('begin').onclick=start;
 $('back').onclick=back;
}

function rotationRequired(){return isPlayPage&&document.body.dataset.layout==='mobile-landscape'&&window.innerHeight>window.innerWidth}
