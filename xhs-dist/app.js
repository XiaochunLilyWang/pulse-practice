
/* Local history for the portrait-only Xiaohongshu tool. */
const PulseHistory = (() => {
  const KEY = 'pulse-xhs-history-v1';
  let pending = [];
  let warning = '';
  const valid = r => r && typeof r.id === 'string' && Number.isFinite(r.at) &&
    Number.isFinite(r.acc) && r.acc >= 0 && r.acc <= 100 &&
    Number.isInteger(r.hits) && r.hits >= 0 && Number.isFinite(r.offsetSum) &&
    Math.abs(r.offsetSum) <= r.hits * 100 + .001 &&
    r.settings && typeof r.settings === 'object';

  function read() {
    let records = [];
    try {
      const raw = localStorage.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) throw new Error('Invalid history');
      records = parsed.filter(valid);
      if (records.length !== parsed.length) warning = '部分历史记录无法读取，已显示其余有效记录。';
    } catch(error){
      warning = '无法读取本地历史；当前页的新成绩仍可查看。';
    }
    const merged = new Map(records.map(r => [r.id, r]));
    pending.forEach(r => merged.set(r.id, r));
    return [...merged.values()].sort((a, b) => b.at - a.at);
  }

  function save(result, settings, layout) {
    const record = {
      id: Date.now() + '-' + Math.random().toString(36).slice(2),
      at: Date.now(), acc: result.points / result.notes.length * 100,
      hits: result.offsets.length, offsetSum: result.offsets.reduce((sum, n) => sum + n, 0),
      perfect: result.perfect, great: result.great, lost: result.lost, max: result.max,
      settings: JSON.parse(JSON.stringify(settings)), layout
    };
    pending.push(record);
    const records = read();
    try {
      localStorage.setItem(KEY, JSON.stringify(records));
      pending = [];
      warning = '';
    } catch(error){
      warning = '本次成绩未能保存到浏览器（空间不足或存储不可用），离开当前页后可能丢失。';
    }
    return record;
  }

  // Derive awards from judgments so existing history gets badges too.
  // AP is exclusive of FC, and rounded ACC never determines an award.
  function achievement(result) {
    const {perfect, great, lost} = result;
    if (![perfect, great, lost].every(n => Number.isInteger(n) && n >= 0)) return null;
    const total = perfect + great + lost;
    if (!total || lost || (result.notes && total !== result.notes.length)) return null;
    return great === 0 ? 'ap' : 'fc';
  }
  function summarize(records) {
    const hits = records.reduce((sum, r) => sum + r.hits, 0);
    return {
      count: records.length,
      fc: records.filter(r => achievement(r) === 'fc').length,
      ap: records.filter(r => achievement(r) === 'ap').length,
      acc: records.length ? records.reduce((sum, r) => sum + r.acc, 0) / records.length : null,
      offset: hits ? records.reduce((sum, r) => sum + r.offsetSum, 0) / hits : null
    };
  }
  function timing(value) {
    if (value === null) return '—';
    if (Math.abs(value) < .05) return '准时 0.0 ms';
    return `${value < 0 ? '偏早' : '偏晚'} ${Math.abs(value).toFixed(1)} ms`;
  }
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function description(r) {
    const s = r.settings;
    const rhythm = {1:'四分',2:'八分',3:'三连音',4:'十六分',custom:'自定义'}[s.sub] || '节奏';
    const pattern = {jack:'纵连',trill:'交互',stairs:'楼梯',random:'随机'}[s.pattern] || '键型';
    const laneMode = s.pattern === 'jack' || s.pattern === 'trill' ? (s[s.pattern+'Mode'] === 'fixed' ? ' · 固定轨道' : ' · 每小节换轨') : '';
    return `${s.bpm} BPM · ${rhythm} · ${pattern}${laneMode} · 速度 ${s.speed} · ${s.bars} 小节 · 竖屏`;
  }
  function render(root) {
    if (!root) return;
    const records = read(), summary = summarize(records);
    root.innerHTML = `<div class="history-heading"><div><div class="eyebrow">YOUR PRACTICE LOG</div><h2>历史战绩</h2></div><span>共 ${summary.count} 次完成练习</span></div>
      <div class="history-summary"><div><small>平均 ACC</small><strong>${summary.acc === null ? '—' : summary.acc.toFixed(1)+'%'}</strong></div><div><small>平均时间偏差</small><strong>${timing(summary.offset)}</strong></div></div>
      <div class="history-awards"><span class="history-award fc">FC 全连 <strong>${summary.fc}</strong> 次</span><span class="history-award ap">AP 全 PERFECT <strong>${summary.ap}</strong> 次</span></div>
      ${root.hasAttribute('data-history-compact') ? '' : '<p class="history-note">ACC 按每局平均；时间偏差按所有命中音符平均，偏早为负、偏晚为正，可相互抵消，漏击不计入。仅保存在当前小工具，清除缓存后消失。</p>'}
      ${warning ? `<p class="history-warning" role="status">${escape(warning)}</p>` : ''}
      ${records.length ? '<ol class="history-list"></ol><button type="button" class="history-more">查看更多战绩</button>' : '<p class="history-empty">还没有战绩。完成一次练习后，会自动记录在这里。</p>'}`;
    if (!records.length) return;
    const list = root.querySelector('.history-list'), more = root.querySelector('.history-more');
    let shown = 0;
    function append() {
      const next = records.slice(shown, shown + 10);
      list.insertAdjacentHTML('beforeend', next.map(r => `<li><div class="history-row"><time>${escape(new Date(r.at).toLocaleString('zh-CN', {year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}))}</time><strong>${achievement(r) ? `<span class="history-badge ${achievement(r)}">${achievement(r).toUpperCase()}</span> ` : ''}${r.acc.toFixed(1)}% ACC</strong></div><div class="history-row history-secondary"><span>${timing(r.hits ? r.offsetSum/r.hits : null)}${r.hits ? '' : '（无命中）'}</span><span>最大连击 ${escape((r.max == null ? '—' : r.max))}</span></div><p>${escape(description(r))}</p><p>PERFECT ${escape((r.perfect == null ? '—' : r.perfect))} · GREAT ${escape((r.great == null ? '—' : r.great))} · LOST ${escape((r.lost == null ? '—' : r.lost))}</p></li>`).join(''));
      shown += next.length;
      more.hidden = shown >= records.length;
      more.textContent = `查看更多战绩（还有 ${records.length - shown} 次）`;
    }
    more.addEventListener('click', append);
    append();
  }
  function refresh() { document.querySelectorAll('[data-history]').forEach(render); }
  window.addEventListener('pageshow', refresh);
  window.addEventListener('storage', e => { if (e.key === KEY || e.key === null) refresh(); });
  return {save, read, summarize, timing, render, achievement};
})();

/* Lightweight, finite result effects. Never intercept lane or button input. */
const PulseCelebration = (() => {
  let layer = null, timer = null;
  function clear() {
    clearTimeout(timer);
    if (layer) layer.remove();
    layer = null;
  }
  function badge(award) {
    if (!['ap', 'fc'].includes(award)) return '';
    const ap = award === 'ap';
    return `<span class="achievement-badge ${award}" aria-label="${ap ? 'AP 全部 PERFECT' : 'FC 全连'}"><span aria-hidden="true">${ap ? '✦' : '✧'}</span> ${award.toUpperCase()} <small>${ap ? 'ALL PERFECT' : 'FULL COMBO'}</small></span>`;
  }
  function play(award) {
    clear();
    if (!['ap', 'fc'].includes(award) || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    const game = document.getElementById('game');
    if (!game) return;
    layer = document.createElement('div');
    layer.className = `celebration ${award}`;
    layer.setAttribute('aria-hidden', 'true');
    layer.style.setProperty('--fall', `${game.clientHeight + 40}px`);
    const ap = award === 'ap';
    const colors = ap ? ['#ffe59c', '#ffd15a', '#fff8df', '#e4c5ff'] : ['#cefa77', '#7bd8bc', '#e9ffd0'];
    const halo = document.createElement('div');
    halo.className = 'celebration-halo';
    layer.append(halo);
    for (let i = 0; i < (ap ? 88 : 40); i++) {
      const piece = document.createElement('i');
      piece.className = ap && i % 4 === 0 ? 'confetti star' : 'confetti';
      piece.style.cssText = `left:${Math.random()*100}%;--drift:${(Math.random()-.5)*160}px;--spin:${(Math.random()-.5)*1080}deg;--duration:${(ap ? 3.1 : 2.2)+Math.random()*.8}s;--delay:${Math.random()*(ap ? 1.1 : .35)}s;background:${colors[i%colors.length]};width:${5+Math.random()*5}px;height:${ap && i%4===0 ? 12 : 6+Math.random()*8}px;`;
      layer.append(piece);
    }
    game.append(layer);
    timer = setTimeout(clear, 5500);
  }
  return {badge, play, clear};
})();


const $=id=>document.getElementById(id);const config={bpm:120,sub:2,pattern:'stairs',speed:5,bars:8,metro:true,jackMode:'bar',trillMode:'bar',customDivision:4,customSteps12:Array.from({length:12},(_,i)=>i%3===0),customSteps:Array.from({length:16},(_,i)=>i%4===0)};const patterns=[{id:'jack',name:'纵连',seq:[0,0,0,0],hint:'每 4 个音符换轨'},{id:'trill',name:'交互',seq:[0,3,0,3],hint:'每 8 个音符换一组双轨'},{id:'stairs',name:'楼梯',seq:[0,1,2,3],hint:'1 → 2 → 3 → 4'},{id:'random',name:'随机',seq:[2,0,3,1],hint:'四轨随机分配'}];const names={1:'四分音符',2:'八分音符',3:'三连音',4:'十六分音符',custom:'自定义节奏'};let saved;try{saved=JSON.parse(localStorage.getItem('pulse-config'))}catch(error){}if(saved){for(const k of ['bpm','sub','speed','bars'])if(Number.isFinite(saved[k]))config[k]=saved[k];if(patterns.some(p=>p.id===saved.pattern))config.pattern=saved.pattern;if(typeof saved.metro==='boolean')config.metro=saved.metro;for(const key of ['jackMode','trillMode'])if(['fixed','bar'].includes(saved[key]))config[key]=saved[key];if([3,4].includes(saved.customDivision))config.customDivision=saved.customDivision;if(Array.isArray(saved.customSteps12)&&saved.customSteps12.length===12&&saved.customSteps12.every(v=>typeof v==='boolean'))config.customSteps12=saved.customSteps12;if(saved.sub==='custom')config.sub='custom';if(Array.isArray(saved.customSteps)&&saved.customSteps.length===16&&saved.customSteps.every(v=>typeof v==='boolean'))config.customSteps=saved.customSteps;}config.bpm=Math.min(300,Math.max(30,Math.round(config.bpm)));config.speed=Math.min(10,Math.max(1,config.speed));if(![1,2,3,4,'custom'].includes(config.sub))config.sub=2;config.bars=Math.min(128,Math.max(1,Math.round(config.bars)));
$('patterns').innerHTML=patterns.map(p=>`<button class="choice" data-value="${p.id}"><span class="glyph">${p.seq.map(n=>[0,1,2,3].map(j=>`<b class="${j===n?'on':''}"></b>`).join('')).join('')}</span>${p.name}</button>`).join('');
let previewEpoch=performance.now();
function customSteps(){return config.customDivision===3?config.customSteps12:config.customSteps}
function renderBeatGrid(){const division=config.customDivision;$('precisionSummary').textContent=`4 拍 × ${division} 格`;$('beatGrid').style.setProperty('--division',division);if($('beatGrid').dataset.division!==String(division)){$('beatGrid').dataset.division=division;$('beatGrid').innerHTML=Array.from({length:4},(_,beat)=>`<div class="beat-row"><span class="beat-label">第 ${beat+1} 拍</span>${Array.from({length:division},(_,step)=>`<button class="beat-cell" data-step="${beat*division+step}" aria-label="第 ${beat+1} 拍，第 ${step+1} 格" aria-pressed="false">${["①","②","③","④"][step]}</button>`).join('')}</div>`).join('')}for(const button of $('precisionModes').children){const selected=Number(button.dataset.value)===division;button.classList.toggle('active',selected);button.setAttribute('aria-pressed',selected)}}
$('precisionModes').addEventListener('click',e=>{const button=e.target.closest('button');if(button){config.customDivision=Number(button.dataset.value);update()}});

function update(){renderBeatGrid();previewEpoch=performance.now();$('rhythmEditor').hidden=config.sub!=='custom';const count=customSteps().filter(Boolean).length;$('rhythmStatus').textContent=count?`已选 ${count} 个音符 / 小节 · 将循环 ${config.bars} 次`:'还没有拍子，点亮至少一格后开始练习';$('start').disabled=config.sub==='custom'&&!count;for(const cell of $('beatGrid').querySelectorAll('button')){const on=customSteps()[+cell.dataset.step];cell.classList.toggle('active',on);cell.setAttribute('aria-pressed',on)}$('travelTime').textContent=`落至判定线 ${Math.round(travel()*1000)} ms`; $('bpm').value=config.bpm;$('bpmRange').value=config.bpm;$('speed').value=config.speed;$('speedValue').textContent=config.speed.toFixed(1);$('barsValue').value=config.bars;$('duration').textContent=`约 ${Math.round(config.bars*240/config.bpm)} 秒`;$('previewSummary').textContent=`${config.bpm} BPM · ${names[config.sub]} · ${patterns.find(p=>p.id===config.pattern).name}`;const grouped=config.pattern==='jack'||config.pattern==='trill';$('laneOptions').hidden=!grouped;const laneMode=config[config.pattern+'Mode'];$('fixedLaneMode').textContent=config.pattern==='trill'?'一直同两轨':'一直单轨';for(const button of $('laneModes').children){const selected=button.dataset.value===laneMode;button.classList.toggle('active',selected);button.setAttribute('aria-pressed',selected)}$('laneModeHint').textContent=config.pattern==='jack'?(laneMode==='fixed'?'整段练习固定在第 1 轨。':'每小节固定一轨，下个小节按 1 → 3 → 2 → 4 换轨。'):(laneMode==='fixed'?'整段练习固定在第 1、4 轨交替。':'同一小节内保持双轨交替，下个小节更换双轨组合。');$('patternHint').textContent=grouped?(laneMode==='fixed'?'固定轨道':'每小节换轨'):config.sub===3&&config.pattern==='stairs'?'1 → 2 → 3 / 2 → 3 → 4':patterns.find(p=>p.id===config.pattern).hint;$('metronome').setAttribute('aria-checked',config.metro);for(const [id,key] of [['rhythms','sub'],['patterns','pattern'],['bars','bars']])for(const b of $(id).children){b.classList.toggle('active',b.dataset.value===String(config[key]));b.setAttribute('aria-pressed',b.dataset.value===String(config[key]));}try{localStorage.setItem('pulse-config',JSON.stringify(config))}catch(error){}}
for(const [id,key] of [['rhythms','sub'],['patterns','pattern'],['bars','bars']])$(id).addEventListener('click',e=>{const b=e.target.closest('button');if(b){config[key]=key==='pattern'||b.dataset.value==='custom'?b.dataset.value:Number(b.dataset.value);update()}});$('laneModes').addEventListener('click',e=>{const button=e.target.closest('button');if(button&&(config.pattern==='jack'||config.pattern==='trill')){config[config.pattern+'Mode']=button.dataset.value;update()}});function bpm(v){config.bpm=Math.min(300,Math.max(30,Math.round(Number(v)||120)));update()}$('bpm').addEventListener('input',e=>{const v=Number(e.target.value);if(v>=30&&v<=300){config.bpm=Math.round(v);update()}});$('bpm').addEventListener('change',e=>bpm(e.target.value));$('bpm').addEventListener('blur',e=>bpm(e.target.value));$('bpmRange').addEventListener('input',e=>bpm(e.target.value));$('minus').addEventListener('click',()=>bpm(config.bpm-5));$('plus').addEventListener('click',()=>bpm(config.bpm+5));$('speed').addEventListener('input',e=>{config.speed=+e.target.value;update()});$('metronome').addEventListener('click',()=>{config.metro=!config.metro;update()});update();
let audio,run=null,mode='idle',lastJudge=0;const flash=[0,0,0,0],keys=['D','F','J','K'];function sound(time,freq=850,dur=.04,vol=.09){if(!audio)return;const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(vol,time);g.gain.exponentialRampToValueAtTime(.001,time+dur);o.connect(g);g.connect(audio.destination);o.start(time);o.stop(time+dur)}function hitSound(l){
if(!audio||audio.state!=='running')return;
const now=audio.currentTime;
// A short triangle-wave body plus a bright stick attack, separate from the sine metronome.
[[260+l*18,105+l*7,.065,.22],[1900+l*80,900,.018,.075]].forEach(part=>{
const oscillator=audio.createOscillator(),gain=audio.createGain();
oscillator.type='triangle';
oscillator.frequency.setValueAtTime(part[0],now);
oscillator.frequency.exponentialRampToValueAtTime(part[1],now+part[2]);
gain.gain.setValueAtTime(.001,now);
gain.gain.linearRampToValueAtTime(part[3],now+.002);
gain.gain.exponentialRampToValueAtTime(.001,now+part[2]);
oscillator.connect(gain);gain.connect(audio.destination);
oscillator.addEventListener('ended',()=>{oscillator.disconnect();gain.disconnect()});
oscillator.start(now);oscillator.stop(now+part[2]+.005);
});
}
function lane(i,barIndex=0,indexInBar=i){const mod=(n,m)=>((n%m)+m)%m;if(config.pattern==='jack')return config.jackMode==='fixed'?0:[0,2,1,3][mod(barIndex,4)];if(config.pattern==='stairs'&&config.sub===3)return mod(Math.floor(i/3),2)+mod(i,3);if(config.pattern==='trill'){const pairs=[[0,3],[1,2],[0,1],[2,3],[0,2],[1,3]];return pairs[config.trillMode==='fixed'?0:mod(barIndex,pairs.length)][mod(config.trillMode==='fixed'?i:indexInBar,2)]}if(config.pattern==='random')return ((Math.imul(i+17,1103515245)>>>8)>>>0)%4;return patterns.find(p=>p.id===config.pattern).seq[mod(i,4)]}
function travel(){return 1.45-config.speed*.12}
function rhythmOffsets(){return config.sub==='custom'?customSteps().reduce((offsets,on,i)=>{if(on)offsets.push(i/config.customDivision);return offsets},[]):Array.from({length:4*config.sub},(_,i)=>i/config.sub)}
function makeNotes(firstBar,barCount){const offsets=rhythmOffsets(),beat=60/config.bpm;return Array.from({length:barCount},(_,b)=>offsets.map((offset,j)=>({time:((firstBar+b)*4+offset)*beat,lane:lane((firstBar+b)*offsets.length+j,firstBar+b,j),hit:false}))).reduce((all,bar)=>all.concat(bar),[])}
let paint=null;function paintCell(cell){if(!cell||!cell.matches('.beat-cell')||paint.visited.has(cell.dataset.step))return;paint.visited.add(cell.dataset.step);customSteps()[+cell.dataset.step]=paint.on;update()}
$('beatGrid').addEventListener('pointerdown',e=>{const cell=e.target.closest('.beat-cell');if(!cell||!e.isPrimary)return;e.preventDefault();paint={id:e.pointerId,on:!customSteps()[+cell.dataset.step],visited:new Set()};if($('beatGrid').setPointerCapture)$('beatGrid').setPointerCapture(e.pointerId);paintCell(cell)});
$('beatGrid').addEventListener('pointermove',e=>{if(!paint||e.pointerId!==paint.id)return;e.preventDefault();paintCell(document.elementFromPoint(e.clientX,e.clientY))});
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('beatGrid').addEventListener(event,()=>{paint=null});
$('beatGrid').addEventListener('click',e=>{const cell=e.target.closest('.beat-cell');if(cell&&e.detail===0){customSteps()[+cell.dataset.step]=!customSteps()[+cell.dataset.step];update()}});
$('quarterFill').addEventListener('click',()=>{customSteps().forEach((_,i,steps)=>steps[i]=i%config.customDivision===0);update()});$('fillRhythm').addEventListener('click',()=>{customSteps().fill(true);update()});$('clearRhythm').addEventListener('click',()=>{customSteps().fill(false);update()});function draw(canvas,notes,t,playing){const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;const d=Math.min(devicePixelRatio||1,2);if(canvas.width!==Math.round(r.width*d)||canvas.height!==Math.round(r.height*d)){canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d)}const c=canvas.getContext('2d');c.setTransform(d,0,0,d,0,0);const w=r.width,h=r.height,lw=w/4,target=h-80,T=travel();c.clearRect(0,0,w,h);for(let l=0;l<4;l++){const grd=c.createLinearGradient(0,0,0,h);grd.addColorStop(0,l%2?'#161c13':'#192016');grd.addColorStop(1,'#242f1c');c.fillStyle=grd;c.fillRect(l*lw,0,lw,h);c.strokeStyle='#34402b';c.beginPath();c.moveTo(l*lw,0);c.lineTo(l*lw,h);c.stroke();if(playing&&performance.now()-flash[l]<110){c.fillStyle='rgba(202,250,119,0.1569)';c.fillRect(l*lw,0,lw,h)}}const beat=60/config.bpm;for(let k=Math.floor((t-T)/beat);k<(t+T)/beat+1;k++){const y=target-(k*beat-t)/T*target;if(y>=0&&y<=target){c.strokeStyle=k%4===0?'#465638':'#2a3523';c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke()}}for(const n of notes){if(n.hit)continue;const y=target-(n.time-t)/T*target;if(y<0||y>target+24)continue;const x=n.lane*lw+7;c.shadowColor='#bded70';c.shadowBlur=7;c.fillStyle=n.lane===0||n.lane===3?'#d6fbaa':'#b9df78';c.fillRect(x,y-6,lw-14,9);c.shadowBlur=0;c.fillStyle='#e8ffcd';c.fillRect(x,y-6,lw-14,2)}c.fillStyle='#c9f47b';c.fillRect(0,target,w,2);for(let l=0;l<4;l++){c.fillStyle=playing&&performance.now()-flash[l]<110?'#bbeb77':'#303f24';c.fillRect(l*lw+6,target+14,lw-12,48);c.fillStyle='#a6b894';c.textAlign='center';c.font='12px monospace';c.fillText(keys[l],l*lw+lw/2,target+43)}}
async function start(){PulseCelebration.clear();$('overlay').classList.remove('has-result');config.bars=Math.min(128,Math.max(1,Math.round(Number($('barsValue').value)||8)));bpm($('bpm').value);if(!rhythmOffsets().length)return;if(!audio){const A=window.AudioContext||window.webkitAudioContext;if(A)try{audio=new A()}catch(error){audio=null}}if(audio)try{await audio.resume()}catch(error){audio=null}if(!audio){$('audioStatus').hidden=false;$('audioStatus').textContent='当前环境不支持声音，可继续跟随画面练习。'}const beat=60/config.bpm;run={notes:makeNotes(0,config.bars),start:performance.now()+4*beat*1000,nextBeat:-4,combo:0,max:0,points:0,judged:0,perfect:0,great:0,lost:0,offsets:[],duration:config.bars*4*beat};mode='playing';$('game').classList.add('open');$('overlay').hidden=true;document.body.style.overflow='hidden';$('gameInfo').textContent=`${config.bpm} BPM · ${names[config.sub]}`;lastJudge=0;stats();}function elapsed(){return (performance.now()-run.start)/1000}function stats(){$('accuracy').textContent=(run.judged?run.points/run.judged*100:100).toFixed(1)+'%';$('combo').textContent=run.combo}function judge(n,diff){n.hit=true;run.judged++;if(diff===null||Math.abs(diff)>.100){run.lost++;run.combo=0;showJudge('LOST','下一拍，继续')}else{const perfect=Math.abs(diff)<=.050;run[perfect?'perfect':'great']++;run.points+=perfect?1:.5;run.combo++;run.max=Math.max(run.max,run.combo);run.offsets.push(diff*1000);showJudge(perfect?'PERFECT':'GREAT',`${diff<0?'偏早':'偏晚'} ${Math.abs(Math.round(diff*1000))} ms`)}stats()}function showJudge(text,sub){$('judgment').innerHTML=`${text}<small>${sub}</small>`;lastJudge=performance.now()}function hit(l){if(mode!=='playing')return;flash[l]=performance.now();const t=elapsed();const n=run.notes.find(n=>!n.hit&&n.lane===l&&Math.abs(n.time-t)<=.100);if(n){judge(n,t-n.time);hitSound(l)}}function pause(){if(mode!=='playing')return;$('overlay').classList.remove('has-result');run.paused=performance.now();mode='paused';$('overlay').hidden=false;$('overlayContent').innerHTML='<div class="eyebrow">TAKE A BREATH</div><h2>稍作停顿</h2><p>准备好后，继续你的节奏。</p><button id="resume">继续练习</button><button id="restart" class="secondary">重新开始</button><button id="back" class="secondary">返回设置</button>';$('resume').addEventListener('click',()=>{run.start+=performance.now()-run.paused;mode='playing';$('overlay').hidden=true});$('restart').addEventListener('click',start);$('back').addEventListener('click',back)}function back(){PulseCelebration.clear();$('overlay').classList.remove('has-result');document.querySelectorAll('[data-history]').forEach(PulseHistory.render);mode='idle';run=null;$('game').classList.remove('open');document.body.style.overflow=''}function finish(){if(mode==='result')return;mode='result';const award=PulseHistory.achievement(run);PulseHistory.save(run,config,'portrait');const acc=(run.points/run.notes.length*100).toFixed(1);const avg=run.offsets.length?run.offsets.reduce((a,b)=>a+b,0)/run.offsets.length:null;$('overlay').classList.add('has-result');$('overlay').hidden=false;$('overlayContent').innerHTML=`<div class="eyebrow">PRACTICE COMPLETE</div>${PulseCelebration.badge(award)}<h2>${award==='ap'?'每一拍，完美命中。':award==='fc'?'一拍不落，全连达成！':'每一拍，都算进步。'}</h2><div class="score">${acc}<span style="font-size:22px">%</span></div><p>准确率 · 最大连击 ${run.max}<br>PERFECT ${run.perfect} &nbsp; GREAT ${run.great} &nbsp; LOST ${run.lost}<br>${avg===null?'本次没有击中音符':`平均${avg<0?'偏早':'偏晚'} ${Math.abs(Math.round(avg))} ms`}<br>${config.bpm} BPM / ${config.bars} 小节 / ${patterns.find(p=>p.id===config.pattern).name}</p><button id="again">再练一次 ↗</button><button id="back" class="secondary">调整参数</button><section class="history-panel" data-history data-history-compact aria-label="历史战绩"></section>`;PulseHistory.render($('overlayContent').querySelector('[data-history]'));$('again').addEventListener('click',start);$('back').addEventListener('click',back);$('overlay').scrollTop=0;PulseCelebration.play(award)}
$('barsValue').addEventListener('change',e=>{config.bars=Math.min(128,Math.max(1,Math.round(Number(e.target.value)||8)));update()});$('start').addEventListener('click',start);$('pause').addEventListener('click',pause);$('playStage').addEventListener('pointerdown',e=>{e.preventDefault();const r=$('playStage').getBoundingClientRect();hit(Math.max(0,Math.min(3,Math.floor((e.clientX-r.left)/r.width*4))))});document.addEventListener('keydown',e=>{if(mode==='idle'||mode==='result'||e.repeat)return;const l=['KeyD','KeyF','KeyJ','KeyK'].indexOf(e.code);if(l!==-1){e.preventDefault();hit(l)}if(e.code==='Space'){e.preventDefault();if(mode==='playing')pause();else if(mode==='paused')$('resume').click()}});document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='playing')pause()});
function frame(){if(mode==='idle'){const t=(performance.now()-previewEpoch)/1000;const barDuration=240/config.bpm;const first=Math.max(0,Math.floor(t/barDuration)-1);const notes=makeNotes(first,Math.ceil(travel()/barDuration)+3);draw($('previewCanvas'),notes,t,false)}else if(mode==='playing'){const t=elapsed(),beat=60/config.bpm;if(t<0){$('judgment').innerHTML=`${Math.ceil(-t/beat)}<small>跟随节拍，准备开始</small>`}else if(performance.now()-lastJudge>550)$('judgment').innerHTML='';while(run.nextBeat*beat<=t){if(audio&&(config.metro||run.nextBeat<0)&&t-run.nextBeat*beat<.1&&run.nextBeat<config.bars*4)sound(audio.currentTime,run.nextBeat%4===0?1300:850);run.nextBeat++}for(const n of run.notes){if(!n.hit&&t-n.time>.100)judge(n,null)}$('barNow').textContent=`${Math.max(1,Math.min(config.bars,Math.floor(t/(beat*4))+1))} / ${config.bars}`;$('progress').style.width=`${Math.min(100,Math.max(0,t/run.duration*100))}%`;draw($('gameCanvas'),run.notes,t,true);if(t>=run.duration+.15)finish()}requestAnimationFrame(frame)}frame();
