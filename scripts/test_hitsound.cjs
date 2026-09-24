const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../xhs-dist/app.js'),'utf8');
new vm.Script(source);
let nodes=[],judgments=0;
function parameter(){return {setValueAtTime(){},exponentialRampToValueAtTime(){},linearRampToValueAtTime(){}}}
const audio={state:'running',currentTime:1,destination:{},createOscillator(){const o={type:'sine',frequency:parameter(),connect(){},disconnect(){o.disconnected=true},addEventListener(name,cb){o.ended=cb},start(t){o.startTime=t},stop(t){o.stopTime=t}};nodes.push(o);return o},createGain(){return {gain:parameter(),connect(){},disconnect(){}}}};
const context={audio,mode:'playing',flash:[0,0,0,0],performance:{now:()=>1000},elapsed:()=>1,run:{notes:[{lane:0,time:1,hit:false}]},judge(n){n.hit=true;judgments++}};
vm.createContext(context);
vm.runInContext(source.slice(source.indexOf('function hitSound('),source.indexOf('function lane('))+source.slice(source.indexOf('function hit(l)'),source.indexOf('function pause(')),context);
vm.runInContext('hit(1)',context);assert.equal(nodes.length,0);
vm.runInContext('hit(0)',context);assert.equal(judgments,1);assert.equal(nodes.length,2);nodes.forEach(o=>{assert.equal(o.type,'triangle');assert.equal(o.startTime,1);assert.ok(o.stopTime<=1.071);o.ended();assert.equal(o.disconnected,true)});
vm.runInContext('hit(0)',context);assert.equal(nodes.length,2);
context.audio=null;vm.runInContext('hitSound(0)',context);
context.audio=audio;audio.state='suspended';vm.runInContext('hitSound(0)',context);assert.equal(nodes.length,2);
const fn=source.slice(source.indexOf('function hitSound('),source.indexOf('function lane('));assert.ok(!fn.includes('config.metro'));assert.ok(source.includes("o.type='sine'"));
console.log('PASS: matched-note trigger, no wrong-lane/duplicate sound, two triangle voices, short envelopes, node cleanup, unavailable/suspended audio fallback, independent metronome.');
