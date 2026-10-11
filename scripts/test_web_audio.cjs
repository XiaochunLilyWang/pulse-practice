const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../web.js'),'utf8');
const voices=[];let buffers=0;
const audio={state:'running',sampleRate:48000,currentTime:1,destination:{},createBuffer(ch,length,rate){buffers++;const data=new Float32Array(length);return {getChannelData:()=>data,length,sampleRate:rate}},createBufferSource(){const n={connect(){},disconnect(){this.disconnected=true},addEventListener(_,cb){this.ended=cb},start(t){this.time=t}};voices.push(n);return n}};
const ctx=vm.createContext({audio,hitBuffer:undefined,config:{hitTone:'bright',metro:false},Float32Array});
vm.runInContext(source.slice(source.indexOf('function createHitBuffer('),source.indexOf('function stairsHint(')),ctx);
vm.runInContext('hitSound(0);hitSound(3)',ctx);assert.equal(voices.length,2);assert.equal(buffers,1);assert.equal(voices[0].buffer,voices[1].buffer);
const data=voices[0].buffer.getChannelData(0);assert.ok(data.every(Number.isFinite));assert.ok(Math.max(...data.map(Math.abs))<=.301);assert.ok(data.slice(5760,9600).some(v=>Math.abs(v)>.00001));assert.ok(Math.abs(data[data.length-1])<.00001);
for(const n of voices){assert.equal(n.time,1);n.ended();assert.equal(n.disconnected,true)}
ctx.config.hitTone='off';vm.runInContext('hitSound()',ctx);ctx.config.hitTone='bright';ctx.audio=null;vm.runInContext('hitSound()',ctx);ctx.audio=audio;audio.state='suspended';vm.runInContext('hitSound()',ctx);assert.equal(voices.length,2);
// The maximum-density double chart should retain headroom.
let peak=0;for(let i=0;i<data.length+2400*8;i++){let v=0;for(let n=0;n<8;n++)v+=2*(data[i-n*2400]||0);peak=Math.max(peak,Math.abs(v))}assert.ok(peak<.95);
if(process.env.PULSE_AUDIO_PREVIEW){const rate=48000,out=new Float32Array(rate*3);for(const t of [.15,.65,1.15,1.4,1.65,1.9,2.15])for(let i=0;i<data.length;i++)out[Math.round(t*rate)+i]+=data[i];const wav=Buffer.alloc(44+out.length*2);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(out.length*2,40);out.forEach((v,i)=>wav.writeInt16LE(Math.round(v*32767),44+i*2));fs.writeFileSync(process.env.PULSE_AUDIO_PREVIEW,wav)}
console.log('PASS: one cached drum timbre, finite sample with short reverb tail, immediate simultaneous hits, dense double-note headroom, metronome independence, mute and audio fallback, source cleanup.');
