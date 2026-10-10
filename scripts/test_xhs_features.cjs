const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../xhs-dist/app.js'),'utf8');
const helper=source.slice(0,source.indexOf('/* Lightweight'));
let storage={};const listeners={};
const ctx=vm.createContext({window:{addEventListener:(event,fn)=>listeners[event]=fn},document:{querySelectorAll:()=>[]},localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v}});
vm.runInContext(helper,ctx);const history=vm.runInContext('PulseHistory',ctx);
function result(perfect,great,lost){const hits=perfect+great;return {perfect,great,lost,max:hits,points:perfect+great*.5,notes:Array(hits+lost).fill({}),offsets:Array(hits).fill(10)}}
const settings={bpm:120,sub:4,pattern:'random',speed:6.5,bars:1};
history.save(result(16,0,0),settings,'portrait');history.save(result(15,1,0),settings,'portrait');history.save(result(15,0,1),settings,'portrait');
assert(storage['pulse-xhs-history-v1']);assert(!storage['pulse-history-v1']);
const summary=history.summarize(history.read());assert.equal(summary.count,3);assert.equal(summary.ap,1);assert.equal(summary.fc,1);assert.equal(summary.offset,10);
const nodes={};function node(id){return nodes[id]||(nodes[id]={innerHTML:'',hidden:true,scrollTop:200,classList:{add(){},remove(){}},addEventListener(){},querySelector(){return {}},style:{}})}
let saves=0,award;
const game=vm.createContext({mode:'playing',run:result(16,0,0),config:settings,patterns:[{id:'random',name:'随机'}],PulseHistory:{achievement:history.achievement,save(){saves++},render(){}},PulseCelebration:{badge:a=>'<b>'+a+'</b>',play:a=>award=a},$:node,start(){},back(){}});
const begin=source.indexOf('function finish(){'),end=source.indexOf('\n',begin);
vm.runInContext(source.slice(begin,end)+';finish();finish();',game);
assert.equal(saves,1);assert.equal(award,'ap');assert.equal(nodes.overlay.scrollTop,0);assert(nodes.overlayContent.innerHTML.includes('data-history-compact'));assert(!nodes.overlayContent.innerHTML.includes('ACC 按每局平均'));
assert(!/isPlayPage|displayPicker|location\.href|\?layout=|@container|:has\(/.test(source));
assert(source.includes("forEach(PulseHistory.render)"));
console.log('PASS: packaged local history, distinct storage key, AP/FC counts, averages, one-save completion, result scroll reset, portrait-only flow.');
