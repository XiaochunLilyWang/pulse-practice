/* Local history is independent of the Xiaohongshu version. */
const PulseHistory = (() => {
  const KEY = 'pulse-history-v1';
  let pending = [];
  let warning = '';
  const valid = r => r && typeof r.id === 'string' && Number.isFinite(r.at) &&
    Number.isFinite(r.acc) && r.acc >= 0 && r.acc <= 100 &&
    Number.isInteger(r.hits) && r.hits >= 0 && Number.isFinite(r.offsetSum) &&
    Math.abs(r.offsetSum) <= r.hits * 100 + .001 &&
    r.settings && typeof r.settings === 'object';

  function read() {
    let records = [];
    try {
      const raw = localStorage.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) throw new Error('Invalid history');
      records = parsed.filter(valid);
      if (records.length !== parsed.length) warning = '部分历史记录无法读取，已显示其余有效记录。';
    } catch {
      warning = '无法读取本地历史；当前页的新成绩仍可查看。';
    }
    const merged = new Map(records.map(r => [r.id, r]));
    pending.forEach(r => merged.set(r.id, r));
    return [...merged.values()].sort((a, b) => b.at - a.at);
  }

  function save(result, settings, layout) {
    const record = {
      id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Date.now() + '-' + Math.random(),
      at: Date.now(), acc: result.points / result.notes.length * 100,
      hits: result.offsets.length, offsetSum: result.offsets.reduce((sum, n) => sum + n, 0),
      perfect: result.perfect, great: result.great, lost: result.lost, max: result.max,
      settings: JSON.parse(JSON.stringify(settings)), layout
    };
    pending.push(record);
    const records = read();
    try {
      localStorage.setItem(KEY, JSON.stringify(records));
      pending = [];
      warning = '';
    } catch {
      warning = '本次成绩未能保存到浏览器（空间不足或存储不可用），离开当前页后可能丢失。';
    }
    return record;
  }

  function summarize(records) {
    const hits = records.reduce((sum, r) => sum + r.hits, 0);
    return {
      count: records.length,
      acc: records.length ? records.reduce((sum, r) => sum + r.acc, 0) / records.length : null,
      offset: hits ? records.reduce((sum, r) => sum + r.offsetSum, 0) / hits : null
    };
  }
  function timing(value) {
    if (value === null) return '—';
    if (Math.abs(value) < .05) return '准时 0.0 ms';
    return `${value < 0 ? '偏早' : '偏晚'} ${Math.abs(value).toFixed(1)} ms`;
  }
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function description(r) {
    const s = r.settings;
    const rhythm = {1:'四分',2:'八分',3:'三连音',4:'十六分',custom:'自定义'}[s.sub] || '节奏';
    const pattern = {jack:'纵连',trill:'交互',stairs:'楼梯',random:'随机'}[s.pattern] || '键型';
    const laneMode = s.pattern === 'jack' || s.pattern === 'trill' ? (s[s.pattern+'Mode'] === 'fixed' ? ' · 固定轨道' : ' · 每小节换轨') : '';
    return `${s.bpm} BPM · ${rhythm} · ${pattern}${laneMode} · 速度 ${s.speed} · ${s.bars} 小节 · ${r.layout === 'landscape' ? '横屏' : '竖屏'}`;
  }
  function render(root) {
    if (!root) return;
    const records = read(), summary = summarize(records);
    root.innerHTML = `<div class="history-heading"><div><div class="eyebrow">YOUR PRACTICE LOG</div><h2>历史战绩</h2></div><span>共 ${summary.count} 次完成练习</span></div>
      <div class="history-summary"><div><small>平均 ACC</small><strong>${summary.acc === null ? '—' : summary.acc.toFixed(1)+'%'}</strong></div><div><small>平均时间偏差</small><strong>${timing(summary.offset)}</strong></div></div>
      ${root.hasAttribute('data-history-compact') ? '' : '<p class="history-note">ACC 按每局平均；时间偏差按所有命中音符平均，偏早为负、偏晚为正，可相互抵消，漏击不计入。仅保存在当前浏览器，清除站点数据后消失。</p>'}
      ${warning ? `<p class="history-warning" role="status">${escape(warning)}</p>` : ''}
      ${records.length ? '<ol class="history-list"></ol><button type="button" class="history-more">查看更多战绩</button>' : '<p class="history-empty">还没有战绩。完成一次练习后，会自动记录在这里。</p>'}`;
    if (!records.length) return;
    const list = root.querySelector('.history-list'), more = root.querySelector('.history-more');
    let shown = 0;
    function append() {
      const next = records.slice(shown, shown + 10);
      list.insertAdjacentHTML('beforeend', next.map(r => `<li><div class="history-row"><time>${escape(new Date(r.at).toLocaleString('zh-CN', {year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}))}</time><strong>${r.acc.toFixed(1)}% ACC</strong></div><div class="history-row history-secondary"><span>${timing(r.hits ? r.offsetSum/r.hits : null)}${r.hits ? '' : '（无命中）'}</span><span>最大连击 ${escape(r.max ?? '—')}</span></div><p>${escape(description(r))}</p><p>PERFECT ${escape(r.perfect ?? '—')} · GREAT ${escape(r.great ?? '—')} · LOST ${escape(r.lost ?? '—')}</p></li>`).join(''));
      shown += next.length;
      more.hidden = shown >= records.length;
      more.textContent = `查看更多战绩（还有 ${records.length - shown} 次）`;
    }
    more.onclick = append;
    append();
  }
  function refresh() { document.querySelectorAll('[data-history]').forEach(render); }
  window.addEventListener('pageshow', refresh);
  window.addEventListener('storage', e => { if (e.key === KEY || e.key === null) refresh(); });
  return {save, read, summarize, timing, render};
})();
