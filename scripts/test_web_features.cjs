const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
try{
const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});
await context.addInitScript(()=>{window.testTime=10000;performance.now=()=>window.testTime;const raf=requestAnimationFrame;requestAnimationFrame=cb=>cb.name==='frame'?0:raf(cb);window.vibrations=[];navigator.vibrate=n=>{window.vibrations.push(n);return true}});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(process.env.PULSE_URL||'http://127.0.0.1:4173/');
assert.equal(await page.locator('#patterns button').count(),6);
await page.locator('#patterns [data-value="stairs"]').click();
await page.locator('#stairsDirections [data-value="left"]').click();
await page.reload();
assert.equal(await page.evaluate(()=>config.stairsDirection),'left');
const stair=await page.evaluate(()=>{config.sub=3;return ['right','left','bounce'].map(d=>{config.stairsDirection=d;return makeNotes(0,1).map(n=>n.lane)})});
assert.deepEqual(stair[0].slice(0,6),[0,1,2,1,2,3]);assert.deepEqual(stair[1].slice(0,6),[3,2,1,2,1,0]);assert.deepEqual(stair[2],[0,1,2,1,2,3,3,2,1,2,1,0]);
await page.locator('#patterns [data-value="double"]').click();
const charts=await page.evaluate(()=>[1,2,3,4,'custom'].map(sub=>{config.sub=sub;return {count:rhythmOffsets().length,notes:makeNotes(0,2)}}));
for(const chart of charts){assert.equal(chart.notes.length,chart.count*4);for(let i=0;i<chart.notes.length;i+=2){assert.equal(chart.notes[i].time,chart.notes[i+1].time);assert.notEqual(chart.notes[i].lane,chart.notes[i+1].lane)}}
await page.evaluate(()=>{config.sub=4;config.bars=1;update()});
await page.locator('#start').click();await page.locator('[data-layout="mobile-landscape"]').click();
await page.waitForURL('**/play.html?layout=mobile-landscape');
assert.equal(await page.locator('#rotationGate').isVisible(),true);
await page.evaluate(()=>start());assert.equal(await page.evaluate(()=>mode),'ready');
await page.setViewportSize({width:844,height:390});await page.waitForFunction(()=>document.querySelector('#rotationGate').hidden);
const ratio=await page.locator('#playStage').evaluate(el=>el.clientWidth/el.clientHeight);assert.ok(Math.abs(ratio-16/9)<.02);
const stageBounds=await page.locator('#playStage').boundingBox(),judgeBounds=await page.locator('#judgment').boundingBox();assert.ok(judgeBounds.x>=stageBounds.x+stageBounds.width-1);
await page.locator('#begin').click();
// Two real touch contacts at the same timestamp, on opposite lanes and different heights.
await page.evaluate(()=>{testTime=run.start;frame()});
const box=await page.locator('#playStage').boundingBox(),cdp=await context.newCDPSession(page);
await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/8,y:box.y+20,id:1},{x:box.x+box.width*7/8,y:box.y+box.height-10,id:2}]});
await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
assert.deepEqual(await page.evaluate(()=>[run.perfect,run.judged,run.combo]),[2,2,2]);
assert.equal(await page.evaluate(()=>vibrations.length),2);
await page.evaluate(()=>{testTime+=60;frame()});
if(process.env.PULSE_SCREENSHOT)await page.screenshot({path:process.env.PULSE_SCREENSHOT});
await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>mode==='paused');
await page.evaluate(()=>{testTime+=5000;frame()});assert.equal(await page.evaluate(()=>run.lost),0);
await page.setViewportSize({width:844,height:390});await page.waitForFunction(()=>document.querySelector('#rotationGate').hidden);await page.locator('#resume').click();
await page.evaluate(()=>{config.haptics=false;for(const n of run.notes){if(n.hit)continue;testTime=run.start+n.time*1000;hit(n.lane)}finish()});
assert.equal(await page.locator('.achievement-badge.ap').count(),1);
assert.equal(await page.evaluate(()=>run.perfect),32);assert.equal(await page.evaluate(()=>vibrations.length),2);
assert.ok((await page.locator('.history-list').innerText()).includes('手机横屏 16:9'));
// Changing display mode preserves the existing two aspect ratios.
for(const [layout,expected] of [['landscape',4/3],['portrait',9/16]]){await page.goto(new URL('play.html?layout='+layout,page.url()).href);const r=await page.locator('#game').evaluate(el=>el.clientWidth/el.clientHeight);assert.ok(Math.abs(r-expected)<.02)}
assert.deepEqual(errors,[]);
console.log('PASS: settings persistence, five rhythms with simultaneous double notes, three triplet stair directions, real two-finger hits, vertical lane input, haptic toggle, mobile aspect ratio, rotation pause/resume, AP/history, existing aspect ratios, no page errors.');
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
