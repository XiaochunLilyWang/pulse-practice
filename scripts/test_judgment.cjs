const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Exercise the shipped hit/judge/frame functions with a deterministic clock.
// No browser, audio device, or animation-frame scheduling is needed.
let failures = 0;
for (const file of ['web.js', 'scripts/xhs-source.html', 'xhs-dist/app.js']) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const helpersStart = source.indexOf('function withinJudgmentWindow(');
  const start = source.indexOf('function elapsed()');
  const end = source.indexOf('function pause()', start);
  const frameStart = source.indexOf('function frame()');
  const frameEnd = source.indexOf('}frame();', frameStart) + 1;
  assert(start >= 0 && end > start && frameStart >= 0 && frameEnd > frameStart);
  const helpers = helpersStart < 0 ? '' : source.slice(helpersStart).match(/^[\s\S]*?(?=(?:async )?function start\()/)[0];
  function game(notes) {
    const elements = new Map();
    const context = vm.createContext({
      mode: 'playing', isPlayPage: true, audio: null, lastJudge: 0,
      config: {bpm: 120, bars: 8}, flash: [], impactGreat: [],
      now: 10000, performance: {now: () => context.now},
      run: {notes: notes.map(([time, lane = 0]) => ({time, lane, hit: false})),
        start: 10000, nextBeat: 0, duration: 2000, judged: 0, perfect: 0,
        great: 0, lost: 0, combo: 0, max: 0, points: 0, offsets: []},
      $: id => {
        if (!elements.has(id)) elements.set(id, {innerHTML: '', style: {}});
        return elements.get(id);
      },
      hitSound() {}, impact() {}, draw() {}, requestAnimationFrame() {},
      finish() { throw new Error('Unexpected completion'); }
    });
    vm.runInContext(helpers + '\n' + source.slice(start, end) + '\n' + source.slice(frameStart, frameEnd), context);
    return {
      run: context.run,
      at(seconds) { context.now = context.run.start + seconds * 1000; },
      hit(lane = 0) { vm.runInContext(`hit(${lane})`, context); },
      frame() { vm.runInContext('frame()', context); },
      pause() { context.mode = 'paused'; }
    };
  }
  function check(name, test) {
    try { test(); } catch (error) {
      failures++;
      console.error(`FAIL ${file}: ${name}: ${error.message}`);
    }
  }
  for (const noteTime of [.5, 1, 1020]) {
    for (const offset of [-.100, -.050, .050, .100]) {
      check(`inclusive boundary at ${noteTime}s ${offset * 1000}ms`, () => {
        const g = game([[noteTime]]);
        g.at(noteTime + offset);
        // In particular, a frame must not expire the inclusive +100ms edge.
        g.frame();
        g.hit();
        assert.equal(g.run.lost, 0);
        assert.equal(g.run.judged, 1);
        assert.equal(g.run.perfect, Math.abs(offset) === .050 ? 1 : 0);
        assert.equal(g.run.great, Math.abs(offset) === .100 ? 1 : 0);
      });
    }
  }
  check('outside 50ms stays GREAT and outside 100ms stays unhit', () => {
    for (const sign of [-1, 1]) {
      const g = game([[1]]);
      g.at(1 + sign * .050001); g.hit();
      assert.equal(g.run.great, 1);
      const outside = game([[1]]);
      outside.at(1 + sign * .100001); outside.hit();
      assert.equal(outside.run.perfect + outside.run.great, 0);
      if (sign > 0) { outside.frame(); assert.equal(outside.run.lost, 1); }
    }
  });
  check('miss before the next frame cannot inflate max combo or erase a new combo', () => {
    const g = game([[0], [.125], [.25]]);
    g.at(0); g.hit(); g.frame();
    g.at(.224); g.frame();
    g.at(.235); g.hit();
    assert.equal(g.run.lost, 1);
    assert.equal(g.run.combo, 1);
    assert.equal(g.run.max, 1);
    g.at(.241); g.frame();
    assert.equal(g.run.combo, 1);
    assert.equal(g.run.judged, 3);
  });
  check('cross-lane misses precede simultaneous hits and are counted only once', () => {
    const g = game([[0, 2], [0, 3], [.125, 0], [.125, 1]]);
    g.at(.125); g.hit(0); g.hit(1); g.hit(1); g.frame(); g.frame();
    assert.equal(g.run.lost, 2);
    assert.equal(g.run.perfect, 2);
    assert.equal(g.run.judged, 4);
    assert.equal(g.run.combo, 2);
    assert.equal(g.run.max, 2);
  });
  check('wrong lanes, early presses, and paused input cannot hit notes', () => {
    const g = game([[1]]);
    g.at(.8); g.hit();
    g.at(1); g.hit(1);
    g.pause(); g.hit();
    assert.equal(g.run.judged, 0);
  });
}
if (failures) process.exitCode = 1;
else console.log('PASS: web/source/package judgment boundaries, chronological misses, combo, chords, duplicate hits, wrong lanes, and paused input.');
