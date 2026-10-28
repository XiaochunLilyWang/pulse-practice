const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../web.js'),'utf8');
const initialization=source.slice(0,source.indexOf("if(!isPlayPage) $('patterns')"));
const navigation=source.split('\n').find(line=>line.startsWith('for(const button of document.querySelectorAll(\'[data-layout]\')'));
assert.ok(navigation,'layout selection handler must be exercised');

function page({play=false,hash='',saved=null,blocked=false}={}){
  const buttons=['portrait','landscape','mobile-landscape'].map(layout=>({dataset:{layout}}));
  const location={hash,href:''};
  const context=vm.createContext({URLSearchParams,location,window:{location},document:{
    body:{classList:{contains:()=>play}},querySelectorAll:()=>buttons
  },localStorage:{getItem(){if(blocked)throw new Error('Storage unavailable');return JSON.stringify(saved)}}});
  vm.runInContext(initialization,context);
  const read=()=>JSON.parse(vm.runInContext('JSON.stringify(config)',context));
  return {context,buttons,location,read};
}
const selection={bpm:240,bars:128,speed:7.5,sub:'custom',pattern:'custom',metro:false,
  hitTone:'off',haptics:false,stairsDirection:'bounce',jackMode:'fixed',trillMode:'fixed',customDivision:3,
  customSteps12:Array.from({length:12},(_,i)=>i%2===0),
  customSteps:Array.from({length:16},(_,i)=>i%3===0),
  customLanes:Array.from({length:48},(_,i)=>i%5===0?null:i%4)};
const settings=page({blocked:true});
vm.runInContext(`Object.assign(config,${JSON.stringify(selection)})`,settings.context);
vm.runInContext(navigation,settings.context);
for(const button of settings.buttons){
  button.onclick();
  const url=new URL(settings.location.href,'https://example.test/pulse/');
  assert.equal(url.pathname,'/pulse/play.html');
  assert.equal(url.searchParams.get('layout'),button.dataset.layout);
  // A failed write can leave an old config; completely blocked storage cannot be read at all.
  for(const options of [{saved:{bpm:120,bars:8}},{blocked:true},{saved:{bpm:300,bars:1}}]){
    const playback=page({play:true,hash:url.hash,...options});
    assert.deepEqual(playback.read(),selection);
    // Reloading the same URL must retain the practice even if another tab saved new preferences.
    assert.deepEqual(page({play:true,hash:url.hash,saved:{bpm:60}}).read(),selection);
  }
}
const hash='#config='+encodeURIComponent(JSON.stringify(selection));
assert.equal(page({hash,saved:{bpm:90}}).read().bpm,90,'settings must ignore practice fragments');
assert.equal(page({play:true,saved:{bpm:180}}).read().bpm,180,'legacy links use saved preferences');
for(const malformed of ['%','null','[]','42','true','"text"']){
  assert.equal(page({play:true,hash:'#config='+malformed,saved:{bpm:150}}).read().bpm,150);
}
assert.equal(page({play:true,hash:'#config=%',blocked:true}).read().bpm,120);
// URL input goes through the same whitelist and bounds checks as persisted preferences.
const invalid={bpm:999,bars:-4,speed:99,sub:'invalid',pattern:'invalid',customLanes:[99],customSteps:['bad']};
const validated=page({play:true,hash:'#config='+encodeURIComponent(JSON.stringify(invalid))}).read();
assert.equal(validated.bpm,300);assert.equal(validated.bars,1);assert.equal(validated.speed,10);
assert.equal(validated.sub,2);assert.equal(validated.pattern,'stairs');
assert.equal(validated.customLanes.length,48);assert.equal(validated.customSteps.length,16);
console.log('PASS: layout navigation preserves full practice config with stale/blocked storage, reload and tab isolation; legacy/malformed URL fallback and input validation.');
