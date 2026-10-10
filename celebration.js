/* Lightweight, finite result effects. Never intercept lane or button input. */
const PulseCelebration = (() => {
  let layer = null, timer = null;
  function clear() {
    clearTimeout(timer);
    if (layer) layer.remove();
    layer = null;
  }
  function badge(award) {
    if (!['ap', 'fc'].includes(award)) return '';
    const ap = award === 'ap';
    return `<span class="achievement-badge ${award}" aria-label="${ap ? 'AP 全部 PERFECT' : 'FC 全连'}"><span aria-hidden="true">${ap ? '✦' : '✧'}</span> ${award.toUpperCase()} <small>${ap ? 'ALL PERFECT' : 'FULL COMBO'}</small></span>`;
  }
  function play(award) {
    clear();
    if (!['ap', 'fc'].includes(award) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const game = document.getElementById('game');
    if (!game) return;
    layer = document.createElement('div');
    layer.className = `celebration ${award}`;
    layer.setAttribute('aria-hidden', 'true');
    layer.style.setProperty('--fall', `${game.clientHeight + 40}px`);
    const ap = award === 'ap';
    const colors = ap ? ['#ffe59c', '#ffd15a', '#fff8df', '#e4c5ff'] : ['#cefa77', '#7bd8bc', '#e9ffd0'];
    const halo = document.createElement('div');
    halo.className = 'celebration-halo';
    layer.append(halo);
    for (let i = 0; i < (ap ? 88 : 40); i++) {
      const piece = document.createElement('i');
      piece.className = ap && i % 4 === 0 ? 'confetti star' : 'confetti';
      piece.style.cssText = `left:${Math.random()*100}%;--drift:${(Math.random()-.5)*160}px;--spin:${(Math.random()-.5)*1080}deg;--duration:${(ap ? 3.1 : 2.2)+Math.random()*.8}s;--delay:${Math.random()*(ap ? 1.1 : .35)}s;background:${colors[i%colors.length]};width:${5+Math.random()*5}px;height:${ap && i%4===0 ? 12 : 6+Math.random()*8}px;`;
      layer.append(piece);
    }
    game.append(layer);
    timer = setTimeout(clear, 5500);
  }
  return {badge, play, clear};
})();
