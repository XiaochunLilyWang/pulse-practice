const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../web.js'),'utf8');
let oscillators=[],gains=[];
const param=()=>({events:[],setValueAtTime(v,t){this.events.push([v,t])},linearRampToValueAtTime(v,t){this.events.push([v,t])},exponentialRampToValueAtTime(v,t){this.events.push([v,t])}});
const audio={state:'running',currentTime:1,destination:{},createOscillator(){const node={frequency:param(),connect(){},disconnect(){this.disconnected=true},addEventListener(_,cb){this.ended=cb},start(t){this.startTime=t},stop(t){this.stopTime=t}};oscillators.push(node);return node},createGain(){const node={gain:param(),connect(){},disconnect(){this.disconnected=true}};gains.push(node);return node}};
const ctx=vm.createContext({audio,config:{hitTone:'heavy',metro:false}});
vm.runInContext(source.slice(source.indexOf('function hitSound('),source.indexOf('function stairsHint(')),ctx);
vm.runInContext('hitSound(0);hitSound(3)',ctx);
assert.equal(oscillators.length,6);assert.equal(oscillators[0].frequency.events[1][0],58);assert.ok(Math.abs(oscillators[0].stopTime-1.11)<1e-9);
for(const o of oscillators){assert.equal(o.startTime,1);o.ended();assert.equal(o.disconnected,true)}
assert.ok(gains.every(g=>g.disconnected));
ctx.config.hitTone='light';vm.runInContext('hitSound(0)',ctx);assert.equal(oscillators.length,8);assert.equal(oscillators[6].frequency.events[1][0],105);
ctx.config.hitTone='off';vm.runInContext('hitSound(0)',ctx);assert.equal(oscillators.length,8);
ctx.config.hitTone='heavy';ctx.audio=null;vm.runInContext('hitSound(0)',ctx);ctx.audio=audio;audio.state='suspended';vm.runInContext('hitSound(0)',ctx);assert.equal(oscillators.length,8);
console.log('PASS: heavy and light envelopes, simultaneous voices, metronome independence, off/suspended/unavailable audio, node cleanup.');
