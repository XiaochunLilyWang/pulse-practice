const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const layers=[];let reduced=false,callback;
function element(){return {children:[],style:{setProperty(){}},setAttribute(){},append(n){this.children.push(n)},remove(){this.removed=true}}}
const ctx=vm.createContext({window:{matchMedia:()=>({matches:reduced})},document:{getElementById:()=>({clientHeight:600,append:n=>layers.push(n)}),createElement:element},setTimeout:fn=>{callback=fn;return 1},clearTimeout(){}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../celebration.js'),'utf8'),ctx);
const fx=vm.runInContext('PulseCelebration',ctx);
fx.play(null);assert.equal(layers.length,0);
fx.play('fc');assert.equal(layers[0].children.length,41);
fx.play('ap');assert(layers[0].removed);assert.equal(layers[1].children.length,89);
callback();assert(layers[1].removed);
reduced=true;fx.play('ap');assert.equal(layers.length,2);assert(fx.badge('ap').includes('ALL PERFECT'));
assert.equal(fx.badge(null),'');
console.log('PASS: two effect tiers, timed cleanup, replay cleanup, and reduced-motion static badges.');
