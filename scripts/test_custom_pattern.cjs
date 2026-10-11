const assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});try{
const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{window.testTime=10000;performance.now=()=>testTime;const raf=requestAnimationFrame;requestAnimationFrame=cb=>cb.name==='frame'?0:raf(cb)});
await page.goto(process.env.PULSE_URL||'http://127.0.0.1:4173/');
await page.locator('#patterns [data-value="custom"]').click();
for(const [sub,count] of [[1,4],[2,8],[3,12],[4,16]]){await page.locator(`#rhythms [data-value="${sub}"]`).click();assert.equal(await page.locator('.pattern-row').count(),count)}
await page.locator('.pattern-row[data-slot="3"] [data-lane="3"]').click();
await page.reload();assert.equal(await page.locator('.pattern-row[data-slot="3"] [data-lane="3"]').getAttribute('aria-pressed'),'true');
await page.locator('#rhythms [data-value="custom"]').click();
// Add a sixteenth, then remove it and add it back: original lane survives.
await page.locator('.beat-cell[data-step="1"]').click();assert.equal(await page.locator('.pattern-row[data-slot="3"] [data-lane="3"]').getAttribute('aria-pressed'),'true');
await page.locator('.beat-cell[data-step="1"]').click();assert.equal(await page.locator('.pattern-row[data-slot="3"]').count(),0);
await page.locator('.beat-cell[data-step="1"]').click();assert.equal(await page.locator('.pattern-row[data-slot="3"] [data-lane="3"]').getAttribute('aria-pressed'),'true');
await page.locator('#precisionModes [data-value="3"]').click();await page.locator('#fillRhythm').click();assert.equal(await page.locator('.pattern-row').count(),12);
await page.locator('.pattern-row[data-slot="4"] [data-lane="2"]').click();
await page.locator('#precisionModes [data-value="4"]').click();assert.equal(await page.locator('.pattern-row[data-slot="3"] [data-lane="3"]').getAttribute('aria-pressed'),'true');
await page.locator('#clearRhythm').click();assert.equal(await page.locator('#patternEditorEmpty').isVisible(),true);assert.equal(await page.locator('#start').isDisabled(),true);
await page.locator('#quarterFill').click();await page.locator('#patternShortcuts [data-fill="trill"]').click();
assert.deepEqual(await page.evaluate(()=>makeNotes(0,2).map(n=>n.lane)),[0,3,0,3,0,3,0,3]);
await page.locator('.pattern-row[data-slot="12"] [data-lane="1"]').click();
const expected=await page.evaluate(()=>{config.bars=2;update();return makeNotes(0,2)});
assert.deepEqual(expected.map(n=>n.lane),[0,1,0,3,0,1,0,3]);assert.deepEqual(expected.map(n=>n.time),[0,.5,1,1.5,2,2.5,3,3.5]);
await page.locator('#patternEditor').scrollIntoViewIfNeeded();if(process.env.PULSE_SCREENSHOT)await page.screenshot({path:process.env.PULSE_SCREENSHOT});
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
await page.locator('#start').click();await page.locator('[data-layout="portrait"]').click();await page.waitForURL('**/play.html?layout=portrait');
await page.locator('#begin').click();assert.deepEqual(await page.evaluate(()=>run.notes),expected);
await page.evaluate(()=>{for(const n of run.notes){testTime=run.start+n.time*1000;hit(n.lane)}finish()});assert.equal(await page.locator('.achievement-badge.ap').count(),1);assert.ok((await page.locator('.history-list').innerText()).includes('自定义键型'));
await page.locator('#back').click();await page.waitForURL('**/index.html');assert.equal(await page.evaluate(()=>config.customLanes[12]),1);
// Corrupt stored lane values are sanitized instead of producing invalid notes.
await page.evaluate(()=>{const saved=JSON.parse(localStorage.getItem('pulse-config'));saved.customLanes[0]=99;localStorage.setItem('pulse-config',JSON.stringify(saved))});await page.reload();assert.ok(await page.evaluate(()=>makeNotes(0,1).every(n=>Number.isInteger(n.lane)&&n.lane>=0&&n.lane<4)));
assert.deepEqual(errors,[]);console.log('PASS: all subdivisions, sparse rhythm edit/restore, cross-precision persistence, empty rhythm, shortcuts, exact repeating chart, no mobile overflow, practice/AP/history, reload, malformed lane fallback.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
