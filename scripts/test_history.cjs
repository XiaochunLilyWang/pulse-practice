const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../history.js'), 'utf8');
let stored = null, unavailable = false;
const localStorage = {getItem(){return stored}, setItem(key,value){if(unavailable)throw Error('Quota');stored=value}};
function load(){const ctx=vm.createContext({localStorage,crypto:require('node:crypto').webcrypto,window:{addEventListener(){}},document:{querySelectorAll(){return []}},console});vm.runInContext(source,ctx);return vm.runInContext('PulseHistory',ctx)}
let history=load();
assert.equal(history.read().length,0);
assert.equal(history.summarize([]).acc,null);
const settings={bpm:120,sub:4,pattern:'random',speed:6.5,bars:1};
const result=(points,total,offsets)=>({points,notes:Array(total).fill({}),offsets,perfect:1,great:1,lost:total-2,max:2});
history.save(result(1.5,2,[-20,40]),settings,'landscape');
history.save(result(0,20,[]),settings,'portrait');
history.save(result(1,1,[-50]),settings,'portrait');
assert.equal(history.read().length,3);
let summary=history.summarize(history.read());
assert.equal(summary.acc,175/3); // Per-run average, not weighted by note count.
assert.equal(summary.offset,-10); // Hit-weighted signed mean, misses excluded.
assert.equal(history.timing(summary.offset),'偏早 10.0 ms');
assert.equal(history.timing(null),'—');
history=load();assert.equal(history.read().length,3); // Survives page reload.
for(let i=0;i<30;i++)history.save(result(1,1,[0]),settings,'portrait');
assert.equal(history.read().length,33); // No history truncation.
unavailable=true;history.save(result(1,1,[0]),settings,'portrait');
assert.equal(history.read().length,34); // Quota failure retains current-page result.
unavailable=false;history.save(result(1,1,[0]),settings,'portrait');
assert.equal(load().read().length,35); // Retry preserves previously unsaved result.
stored='broken';history=load();assert.equal(history.read().length,0);
stored=JSON.stringify([{id:'bad',at:0,acc:100,hits:0,offsetSum:500,settings:{}}]);
assert.equal(history.read().length,0);
// Completion is the sole persistence point; repeated finish calls cannot duplicate a run.
const web=fs.readFileSync(path.join(__dirname,'../web.js'),'utf8');
const finish=web.slice(web.indexOf('function finish(){'),web.indexOf("\nif(!isPlayPage){",web.indexOf('function finish(){')));
let saves=0;const element={innerHTML:'',querySelector(){return {}}};
const ctx=vm.createContext({mode:'playing',run:{...result(1,1,[0]),max:1},config:settings,document:{body:{dataset:{layout:'landscape'}}},patterns:[{id:'random',name:'随机'}],PulseHistory:{save(){saves++},render(){}},$:()=>element,start(){},back(){}});
vm.runInContext(finish+';finish();finish();',ctx);assert.equal(saves,1);
console.log('PASS: averages, signed timing, misses, persistence, unlimited records, quota recovery, malformed data, and duplicate completion guard.');
