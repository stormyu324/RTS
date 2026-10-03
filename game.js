import { Game, WORLD, SPECS, distance, FACTIONS, COUNTRIES, DIFFICULTIES, isInfantry } from './engine.js';

const $ = id => document.getElementById(id);
const canvas = $('battle'), ctx = canvas.getContext('2d'), radar = $('radar'), rctx = radar.getContext('2d', { alpha: false });
const ground = $('ground'), gctx = ground.getContext('2d', { alpha: false });
const mapLayer = $('map-layer');
ground.width = WORLD.width; ground.height = WORLD.height;
let game = new Game(), selected = [], tab = 'build', placement = null, attackMode = false, paused = false, lobbyOpen = true, abilityMode = false;
let chosenCountry = 'usa', hasDeployed = false;
let touchLayout = false;
const touchPointers = new Map();
let touchGesture = null, holdTimer = null, lastTouchTap = null;
const touchQuery = matchMedia('(pointer: coarse), (max-width: 700px)');
let camera = { x: 0, y: 620 }, pointer = { x: 0, y: 0 }, drag = null, pan = null, mouseInside = false, lastTime = performance.now(), uiTime = 0;
let view = { width: 1000, height: 800 }, noticeTimer, resultShown = false;
const keys = new Set(), colors = { player: '#78bdd2', enemy: '#c96c5c' };
const terrain = document.createElement('canvas'); terrain.width = WORLD.width; terrain.height = WORLD.height;
const tctx = terrain.getContext('2d');
const fog = $('shroud'), fctx = fog.getContext('2d');
const FOG_SCALE = .25;
fog.width = WORLD.width * FOG_SCALE; fog.height = WORLD.height * FOG_SCALE;
fog.style.width = `${WORLD.width}px`; fog.style.height = `${WORLD.height}px`;
const radarTerrain = document.createElement('canvas'); radarTerrain.width = radar.width; radarTerrain.height = radar.height;
let fogTime = -Infinity, radarTime = -Infinity, fogSignature = '';
const sightMasks = new Map();
const unitSprites = new Map();
const uiCache = new Map();
let oreSignature = '';
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
let seed = 9183;
function rand() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
function ellipse(c, x, y, rx, ry, color) { c.fillStyle = color; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill(); }
function line(c, x, y, tx, ty, color, width = 1) { c.strokeStyle = color; c.lineWidth = width; c.beginPath(); c.moveTo(x, y); c.lineTo(tx, ty); c.stroke(); }

function generateTerrain() {
  tctx.fillStyle = '#5c6746'; tctx.fillRect(0, 0, WORLD.width, WORLD.height);
  for (let i = 0; i < 6000; i++) {
    const x = rand() * WORLD.width, y = rand() * WORLD.height, r = rand() * 30 + 3;
    ellipse(tctx, x, y, r, r * .55, ['#535f4028', '#85916a25', '#333f3025', '#adac7920'][i % 4]);
  }
  // An old supply road winds between the two starting positions.
  for (const [width, color] of [[115, '#414b35'], [100, '#788064'], [83, '#818769']]) {
    tctx.beginPath(); tctx.moveTo(60, 1030); tctx.bezierCurveTo(830, 1050, 900, 370, 2100, 450); tctx.strokeStyle = color; tctx.lineWidth = width; tctx.stroke();
  }
  tctx.setLineDash([10, 22]); tctx.beginPath(); tctx.moveTo(60, 1030); tctx.bezierCurveTo(830, 1050, 900, 370, 2100, 450); tctx.strokeStyle = '#b3b18a55'; tctx.lineWidth = 2; tctx.stroke(); tctx.setLineDash([]);
  for (let i = 0; i < 2700; i++) {
    const x = rand() * WORLD.width, y = rand() * WORLD.height;
    line(tctx, x, y, x + rand() * 3, y - rand() * 5, '#2b422643');
  }
  for (const rock of game.rocks) {
    ellipse(tctx, rock.x + 12, rock.y + 16, rock.radius * 1.1, rock.radius * .74, '#26342660');
    for (let i = 0; i < 17; i++) {
      const a = rand() * Math.PI * 2, d = rand() * rock.radius * .6, x = rock.x + Math.cos(a) * d, y = rock.y + Math.sin(a) * d;
      const r = 14 + rand() * 26;
      tctx.fillStyle = ['#535947', '#656b56', '#777b62'][i % 3];
      tctx.beginPath(); tctx.moveTo(x - r, y + r * .35); tctx.lineTo(x - r * .6, y - r * .6); tctx.lineTo(x + r * .4, y - r * .9); tctx.lineTo(x + r, y); tctx.lineTo(x + r * .5, y + r * .65); tctx.closePath(); tctx.fill();
      line(tctx, x - r * .6, y - r * .6, x + r * .4, y - r * .9, '#a4a48a70', 2);
    }
  }
  for (let i = 0; i < 155; i++) {
    const x = rand() * WORLD.width, y = rand() * WORLD.height;
    if (game.entities.some(e => distance(e, { x, y }) < 145) || game.ore.some(o => distance(o, { x, y }) < 140)) continue;
    ellipse(tctx, x + 8, y + 10, 15, 9, '#26392670');
    tctx.fillStyle = '#3c4430'; tctx.fillRect(x - 2, y - 5, 4, 18);
    for (let j = 0; j < 3; j++) { tctx.fillStyle = ['#2f4833', '#3e573b', '#526647'][j]; tctx.beginPath(); tctx.moveTo(x, y - 30 + j * 8); tctx.lineTo(x - 13 + j * 2, y - 7 + j * 8); tctx.lineTo(x + 13 - j * 2, y - 7 + j * 8); tctx.closePath(); tctx.fill(); }
  }
  for (const e of game.entities.filter(e => e.building)) { tctx.fillStyle = '#9b9d783d'; tctx.fillRect(e.x - e.radius - 12, e.y - e.radius - 9, e.radius * 2 + 24, e.radius * 2 + 18); }
  for (let x = 0; x <= WORLD.width; x += 100) line(tctx, x, 0, x, WORLD.height, '#b4c39a09');
  for (let y = 0; y <= WORLD.height; y += 100) line(tctx, 0, y, WORLD.width, y, '#b4c39a09');
  radarTerrain.getContext('2d').drawImage(terrain, 0, 0, radar.width, radar.height);
}

function resize() {
  const box = canvas.getBoundingClientRect();
  if (box.width !== view.width || box.height !== view.height) {
    resetTouch();
    if (touchLayout) { camera.x += (view.width - box.width) / 2; camera.y += (view.height - box.height) / 2; }
  }
  view.width = box.width; view.height = box.height;
  const dpr = Math.min(devicePixelRatio, 2); canvas.width = box.width * dpr; canvas.height = box.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); radarTime = -Infinity; boundCamera();
}
function boundCamera() { camera.x = clamp(camera.x, 0, Math.max(0, WORLD.width - view.width)); camera.y = clamp(camera.y, 0, Math.max(0, WORLD.height - view.height)); }
function screenPoint(event) { const r = canvas.getBoundingClientRect(); return { x: event.clientX - r.left, y: event.clientY - r.top }; }
function worldPoint(p) { return { x: p.x + camera.x, y: p.y + camera.y }; }
function hit(p, padding = 12) { return game.entities.filter(e => game.visible(e) && distance(e, p) < e.radius + padding).sort((a, b) => distance(a, p) - distance(b, p))[0]; }
function notify(message) { $('notice').textContent = message; $('notice').classList.add('show'); clearTimeout(noticeTimer); noticeTimer = setTimeout(() => $('notice').classList.remove('show'), 3200); }
function setTab(next) { tab = next; $('build-tab').classList.toggle('active', tab === 'build'); $('unit-tab').classList.toggle('active', tab === 'unit'); $('catalog-title').textContent = tab === 'build' ? '基础设施' : '战斗与支援'; renderCatalog(); }
function renderCatalog() {
  const types = tab === 'build' ? ['power', 'barracks', 'refinery', 'factory', 'turret', 'airfield', 'lab'] : game.availableUnits();
  $('catalog').innerHTML = types.map(type => { const s = game.spec(type); return `<button class="card ${placement === type ? 'active' : ''}" data-type="${type}"><span class="card-icon">${s.icon}</span><span class="card-name">${s.name}</span><span class="card-cost">¥${s.cost}</span><small class="card-desc">${s.desc}</small>${s.faction ? '<span class="exclusive">阵营特色</span>' : ''}</button>`; }).join('');
  for (const button of $('catalog').querySelectorAll('button')) button.addEventListener('click', () => {
    if (game.result || lobbyOpen) return;
    const type = button.dataset.type;
    if (tab === 'build') {
      if (game.credits < SPECS[type].cost) { notify('资金不足，等待矿车运回矿石'); return; }
      placement = placement === type ? null : type; attackMode = abilityMode = false; renderCatalog(); updateUI();
      if (placement) { closeCommand(); notify(`部署${SPECS[type].name}：${touchLayout ? '点战场选择位置，点取消退出' : '左键选择位置，右键取消'}`); }
    } else { const result = game.train(type); notify(result.ok ? `${SPECS[type].name}已加入生产队列` : result.message); updateUI(); }
  });
  updateUI();
}
function updateUI() {
  const nation = COUNTRIES[game.country], faction = FACTIONS[game.faction], a = faction.ability;
  setText('nation-name', `${faction.name} / ${nation.name}`); $('nation-name').style.color = faction.color;
  setText('nation-trait', `${faction.trait} · ${nation.trait}`);
  setText('ability-name', a.name); $('ability').title = a.desc; $('ability').classList.toggle('active', abilityMode);
  const cool = Math.max(0, Math.ceil(game.abilityReadyAt - game.time));
  setText('ability-status', cool ? `${cool}s 冷却` : `¥${a.cost} · ${a.instant ? '点击施放' : '点击选择目标'}`);
  $('ability').disabled = lobbyOpen || !!game.result || cool > 0 || game.credits < a.cost;
  selected = selected.filter(id => game.entities.some(e => e.id === id));
  setText('credits', `¥ ${Math.floor(game.credits).toLocaleString()}`);
  const p = game.power; setText('power', `${p.used} / ${p.supply}`); $('power').style.color = p.used > p.supply ? '#df9d7a' : '#d9e1dd';
  const seconds = Math.floor(game.time); setText('clock', `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`);
  $('attack-mode').classList.toggle('active', attackMode);
  setText('selection-count', `${selected.length} 个单位`);
  const entities = game.entities.filter(e => selected.includes(e.id));
  if (entities.length) {
    const e = entities[0], percent = entities.reduce((v, e) => v + e.hp / e.maxHp, 0) / entities.length * 100;
    setPanelHTML('selected', `<div class="selected-info"><span class="unit-icon">${SPECS[e.type].icon}</span><div><strong>${entities.length > 1 ? `混合小队 · ${entities.length} 个单位` : SPECS[e.type].name}</strong><small>${entities.length > 1 ? `${touchLayout ? '点地面' : '右键'}下达编队指令` : `${Math.ceil(e.hp)} / ${e.maxHp} 生命值${e.type === 'harvester' ? ` · 载矿 ${Math.floor(e.cargo)}` : e.maxShield ? ` · 护盾 ${Math.ceil(e.shield)}` : ''}`}</small><div class="health"><span style="width:${percent.toFixed(1)}%"></span></div>${entities.length === 1 ? `<small>${e.building && ['barracks', 'factory', 'airfield'].includes(e.type) ? `${touchLayout ? '点' : '右键'}地面设置集结点` : SPECS[e.type].desc || '保护你的基地'}</small>` : ''}</div></div>`);
  } else setPanelHTML('selected', `<div class="empty-selection">⌖<p>选择部队或建筑<small>${touchLayout ? '单指拖动可框选部队' : '按住 Shift 可追加选择'}</small></p></div>`);
  setText('queue-count', game.queue.length ? `${game.queue.length} 项生产中` : '空闲');
  setPanelHTML('queue', game.queue.length ? game.queue.map(q => `<div class="queue-item">${SPECS[q.type].name} <span style="float:right">${Math.ceil(q.remaining)}s</span><div class="health"><span style="width:${((1 - q.remaining / q.total) * 100).toFixed(1)}%"></span></div></div>`).join('') : '暂无生产任务');
  for (const b of $('catalog').querySelectorAll('button')) {
    const spec = game.spec(b.dataset.type), missing = game.requirement(b.dataset.type); b.disabled = lobbyOpen || !!game.result || !!missing;
    b.title = missing || `${spec.name} · ${spec.time.toFixed(1)} 秒`;
  }
  const aiming = placement || attackMode || abilityMode;
  setText('mobile-selection', placement ? `部署${SPECS[placement].name}：点战场选位置` : abilityMode ? `${a.name}：点战场选择目标` : attackMode ? '进攻移动：点战场选择目标' : entities.length ? `${entities.length === 1 ? SPECS[entities[0].type].name : `${entities.length} 个单位`} · 点地面下令` : '点选部队开始行动');
  setText('mobile-cancel', aiming ? '取消' : '清除');
  $('mobile-cancel').disabled = !aiming && !selected.length;
  $('mobile-attack').classList.toggle('active', attackMode);
  $('mobile-attack').disabled = $('mobile-stop').disabled = !selected.length || paused || !!game.result;
}
function setPanelHTML(id, html) {
  if (uiCache.get(id) === html) return;
  $(id).innerHTML = html; uiCache.set(id, html);
}
function setText(id, text) {
  const key = `text:${id}`; if (uiCache.get(key) === text) return;
  $(id).textContent = text; uiCache.set(key, text);
}

function updateFog(now) {
  if (now - fogTime < 100) return false;
  fogTime = now;
  const friendly = game.entities.filter(e => e.team === 'player');
  const signature = friendly.map(e => `${e.id}:${Math.round(e.x * FOG_SCALE)}:${Math.round(e.y * FOG_SCALE)}:${e.stats.sight}`).join(';');
  if (signature === fogSignature) return false;
  fogSignature = signature;
  fctx.globalCompositeOperation = 'source-over'; fctx.clearRect(0, 0, fog.width, fog.height);
  fctx.fillStyle = '#101a20c7'; fctx.fillRect(0, 0, fog.width, fog.height);
  fctx.globalCompositeOperation = 'destination-out';
  for (const e of friendly) {
    const radius = e.stats.sight * FOG_SCALE;
    let mask = sightMasks.get(radius);
    if (!mask) {
      mask = document.createElement('canvas'); mask.width = mask.height = Math.ceil(radius * 2);
      const c = mask.getContext('2d'), g = c.createRadialGradient(radius, radius, radius * .72, radius, radius, radius);
      g.addColorStop(0, '#000'); g.addColorStop(1, '#0000'); c.fillStyle = g; c.fillRect(0, 0, mask.width, mask.height);
      sightMasks.set(radius, mask);
    }
    fctx.drawImage(mask, e.x * FOG_SCALE - radius, e.y * FOG_SCALE - radius);
  }
  return true;
}

function foundation(e) {
  const r = e.radius; ctx.fillStyle = '#283331'; ctx.fillRect(-r - 5, -r + 7, r * 2 + 10, r * 2 + 2);
  ctx.fillStyle = '#8c9180'; ctx.fillRect(-r, -r, r * 2, r * 2);
  ctx.strokeStyle = '#394842'; ctx.lineWidth = 2; ctx.strokeRect(-r, -r, r * 2, r * 2);
  ctx.fillStyle = '#2b3537'; ctx.fillRect(-r + 5, r - 12, r * 2 - 10, 12);
  for (let i = -r + 9; i < r - 7; i += 16) { ctx.fillStyle = '#d6b36a'; ctx.fillRect(i, r - 6, 7, 3); }
}
function building(e) {
  const team = colors[e.team]; foundation(e);
  if (e.type === 'hq') {
    ctx.fillStyle = '#4b5b57'; ctx.fillRect(-48, -44, 96, 70);
    ctx.fillStyle = '#9ca79a'; ctx.fillRect(-42, -48, 84, 58); ctx.strokeStyle = '#c5ccaa'; ctx.strokeRect(-42, -48, 84, 58);
    ctx.fillStyle = '#596963'; ctx.fillRect(-27, -39, 54, 38); ctx.fillStyle = '#35484b'; ctx.fillRect(-20, -32, 40, 23);
    ctx.fillStyle = team; ctx.fillRect(-40, -48, 80, 5); ctx.fillRect(-26, 12, 52, 5);
    ctx.fillStyle = '#425a5d'; for (let i = 0; i < 4; i++) ctx.fillRect(-31 + i * 18, 21, 10, 10);
    line(ctx, 36, -27, 36, -72, '#d1d9c5', 2); line(ctx, 25, -65, 47, -65, team, 2);
    ctx.fillStyle = team; ctx.fillRect(38, -68, 17, 9);
    ctx.fillStyle = '#a9b0a0'; ctx.fillRect(-52, -24, 9, 43); ctx.fillRect(44, -24, 9, 43);
    ctx.fillStyle = '#233c41'; ctx.fillRect(-13, 17, 26, 30);
  } else if (e.type === 'power') {
    ctx.fillStyle = '#3a4b46'; ctx.fillRect(-27, -17, 54, 43);
    for (const x of [-15, 15]) {
      ctx.fillStyle = '#b4baa0'; ctx.fillRect(x - 10, -29, 20, 40); ellipse(ctx, x, -29, 10, 6, '#d1d2b3');
      ellipse(ctx, x, -29, 6, 3, '#506c68'); line(ctx, x - 6, -18, x + 6, -18, team, 4);
      const pulse = Math.sin(game.time * 2 + x) * 3; ellipse(ctx, x, -40 + pulse, 9, 6, '#d7ddce28');
    }
    ctx.fillStyle = team; ctx.fillRect(-28, 17, 56, 5); ctx.fillStyle = '#c8be79'; ctx.fillRect(-7, 23, 14, 9);
  } else if (e.type === 'refinery') {
    ctx.fillStyle = '#49574a'; ctx.fillRect(-34, -29, 68, 53);
    ctx.fillStyle = '#a2ac91'; ctx.fillRect(-32, -33, 46, 35); ctx.fillStyle = team; ctx.fillRect(-32, -33, 46, 4);
    for (const x of [-21, -2]) { ctx.fillStyle = '#777e66'; ctx.fillRect(x - 6, -56, 12, 35); ellipse(ctx, x, -56, 6, 4, '#b6b697'); ellipse(ctx, x + Math.sin(game.time) * 5, -64 - (game.time * 9 % 15), 7, 5, '#dad6ba35'); }
    ctx.fillStyle = '#252f2d'; ctx.fillRect(-32, 8, 65, 23); ctx.strokeStyle = '#a4ab8c'; ctx.strokeRect(-31, 8, 63, 22);
    ctx.fillStyle = '#b7a65b'; for (let i = 0; i < 5; i++) ctx.fillRect(-25 + i * 12, 15, 8, 9);
    line(ctx, 27, -30, 27, 7, '#b5bfa6', 7);
  } else if (e.type === 'barracks') {
    ctx.fillStyle = '#485b4d'; ctx.fillRect(-27, -21, 54, 46);
    ctx.fillStyle = '#849476'; ctx.beginPath(); ctx.moveTo(-30, -21); ctx.lineTo(0, -37); ctx.lineTo(30, -21); ctx.lineTo(30, 3); ctx.lineTo(-30, 3); ctx.closePath(); ctx.fill();
    line(ctx, 0, -37, 0, 3, '#b2b99a', 2); ctx.fillStyle = team; ctx.fillRect(-28, 4, 56, 5);
    ctx.fillStyle = '#283c3b'; ctx.fillRect(-9, 13, 18, 19); ctx.fillStyle = '#b8c9b3'; ctx.fillRect(-23, 14, 9, 7); ctx.fillRect(14, 14, 9, 7);
  } else if (e.type === 'factory') {
    ctx.fillStyle = '#3e5048'; ctx.fillRect(-40, -35, 80, 67);
    ctx.fillStyle = '#8e9b83'; ctx.fillRect(-40, -40, 80, 39); line(ctx, -35, -33, 34, -33, team, 5);
    for (let x = -29; x < 35; x += 15) line(ctx, x, -26, x, -4, '#5c705d', 6);
    ctx.fillStyle = '#233631'; ctx.fillRect(-27, 3, 54, 35); ctx.strokeStyle = '#b1b99a'; ctx.strokeRect(-27, 3, 54, 35);
    ctx.fillStyle = '#676f56'; ctx.fillRect(-27, 3, 54, 12); ctx.fillStyle = team; ctx.fillRect(-40, 22, 9, 7); ctx.fillRect(32, 22, 9, 7);
  } else if (e.type === 'turret') {
    ctx.fillStyle = '#667966'; ctx.fillRect(-17, -17, 34, 34); ctx.strokeStyle = '#b2b69b'; ctx.strokeRect(-17, -17, 34, 34);
    ctx.rotate(e.angle); ctx.fillStyle = '#a0ac92'; ctx.fillRect(-12, -11, 24, 22); ctx.fillStyle = team; ctx.fillRect(-9, -9, 5, 18); ctx.fillStyle = '#c2c7ab'; ctx.fillRect(8, -3, 25, 6); ctx.fillStyle = '#2b3c3b'; ctx.fillRect(29, -4, 5, 8);
  } else if (e.type === 'airfield') {
    ctx.fillStyle = '#37484c'; ctx.fillRect(-39, -34, 78, 68); ctx.fillStyle = '#253439'; ctx.fillRect(-17, -33, 34, 66);
    ctx.strokeStyle = '#c9c69f'; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(0, 30); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = team; ctx.fillRect(-39, -34, 13, 68); ctx.fillStyle = '#a8b7a0'; ctx.fillRect(20, -27, 18, 25); ctx.fillStyle = '#436469'; ctx.fillRect(22, -24, 14, 7);
  } else if (e.type === 'lab') {
    ctx.fillStyle = '#53615b'; ctx.fillRect(-28, -25, 56, 51); ellipse(ctx, 0, -9, 23, 23, '#abb9a8'); ellipse(ctx, 0, -9, 16, 16, '#354f62'); ellipse(ctx, 0, -9, 9, 9, team);
    line(ctx, -23, 20, 23, 20, team, 5); line(ctx, 24, -22, 24, -47, '#ccd7bf', 2); ellipse(ctx, 24, -47, 5, 5, team);
  }
}
function paintUnit(e, ctx) {
  const team = colors[e.team]; ctx.rotate(e.angle);
  if (e.stats.flying) {
    ctx.fillStyle = '#d0d8bb'; ctx.beginPath(); ctx.moveTo(28, 0); ctx.lineTo(-18, -18); ctx.lineTo(-10, 0); ctx.lineTo(-18, 18); ctx.closePath(); ctx.fill();
    ctx.fillStyle = team; ctx.fillRect(-5, -6, 27, 12); ctx.fillStyle = '#334b5b'; ctx.fillRect(10, -4, 10, 8);
    if (e.type === 'gunship') { line(ctx, 0, -26, 0, 26, '#344d46', 3); line(ctx, -24, 0, 28, 0, '#344d46', 3); }
    else { for (const y of [-17, 17]) { ellipse(ctx, -10, y, 8, 8, '#6d8890'); ellipse(ctx, -10, y, 4, 4, team); } }
  } else if (isInfantry(e.type)) {
    ellipse(ctx, 1, 3, 7, 7, '#14232170'); ctx.fillStyle = '#394a3e'; ctx.fillRect(-6, -5, 9, 3); ctx.fillRect(-6, 3, 9, 3);
    ctx.fillStyle = team; ctx.fillRect(-3, -5, 9, 10); ellipse(ctx, 3, 0, 4, 4, '#bdc3a2'); ctx.fillStyle = '#252f2c'; ctx.fillRect(5, -2, 12, 3);
    if (e.type === 'medic') { ctx.fillStyle = '#ecebd9'; ctx.fillRect(-3, -5, 8, 10); ctx.fillStyle = '#9bc7a6'; ctx.fillRect(-1, -4, 3, 8); ctx.fillRect(-3, -1, 8, 3); }
    if (e.type === 'engineer') { ctx.fillStyle = '#e0bd65'; ctx.fillRect(-2, -5, 7, 10); ctx.fillStyle = '#8e613f'; ctx.fillRect(7, -5, 6, 10); }
    if (e.type === 'rocket') { ctx.fillStyle = '#9ca685'; ctx.fillRect(1, -3, 21, 6); ctx.fillStyle = '#ddad69'; ctx.fillRect(18, -3, 5, 6); }
    if (e.type === 'sniper') { ctx.fillStyle = '#466747'; ctx.fillRect(-3, -5, 8, 10); line(ctx, 6, 0, 25, 0, '#afb49d', 2); }
    if (e.type === 'sentinel') { ctx.strokeStyle = '#b9b1ee'; ctx.lineWidth = 2; ctx.strokeRect(-4, -7, 13, 14); }
  } else {
    ctx.fillStyle = '#23332c'; ctx.fillRect(-20, -17, 40, 9); ctx.fillRect(-20, 8, 40, 9);
    for (let x = -18; x < 20; x += 7) { ctx.fillStyle = '#697467'; ctx.fillRect(x, -15, 3, 5); ctx.fillRect(x, 10, 3, 5); }
    ctx.fillStyle = '#7c9078'; ctx.fillRect(-17, -11, 34, 22); ctx.fillStyle = team; ctx.fillRect(-15, -10, 6, 20);
    if (e.type !== 'harvester') {
      ctx.fillStyle = '#a6b395'; ctx.fillRect(-7, -9, 19, 18); ctx.fillStyle = '#586a58'; ctx.fillRect(-4, -6, 6, 12); ctx.fillStyle = '#c2c9ad'; ctx.fillRect(6, -3, 28, 6); ctx.fillStyle = '#2b3d32'; ctx.fillRect(30, -4, 5, 8);
      if (e.type === 'scout') { ctx.fillStyle = '#354d51'; ctx.fillRect(0, -8, 11, 16); ctx.fillStyle = team; ctx.fillRect(15, -4, 10, 8); }
      if (e.type === 'antiair') { ctx.fillStyle = '#657c78'; ctx.fillRect(8, -9, 15, 5); ctx.fillRect(8, 4, 15, 5); }
      if (e.type === 'heavy') { ctx.fillStyle = '#c5c6a0'; ctx.fillRect(-13, -12, 24, 24); line(ctx, 5, -5, 35, -5, '#dbd2a8', 3); line(ctx, 5, 5, 35, 5, '#dbd2a8', 3); }
      if (e.type === 'laser') { ellipse(ctx, 4, 0, 10, 10, '#bce6e0'); ellipse(ctx, 4, 0, 5, 5, '#439aa9'); line(ctx, 6, 0, 29, 0, '#7bd9e4', 4); }
      if (e.type === 'tesla') { ellipse(ctx, 5, 0, 12, 12, '#899a9b'); ellipse(ctx, 5, 0, 7, 7, '#accde0'); line(ctx, -3, -9, 13, 9, '#dfdcf1', 2); }
      if (e.type === 'artillery') { line(ctx, -4, 0, 38, 0, '#d5ccb1', 7); ctx.fillStyle = '#363f39'; ctx.fillRect(-17, -13, 9, 26); }
      if (e.type === 'walker') { ctx.fillStyle = '#bbb4d3'; ctx.fillRect(-11, -19, 15, 10); ctx.fillRect(-11, 9, 15, 10); ellipse(ctx, 6, 0, 12, 12, '#798ca7'); line(ctx, 13, 0, 31, 0, '#b4a8e8', 5); }
    } else {
      ctx.fillStyle = '#384837'; ctx.fillRect(-13, -8, 18, 16); ctx.fillStyle = '#b5a552'; ctx.fillRect(-12, -7, 16 * e.cargo / 300, 14);
      ctx.fillStyle = '#abb99d'; ctx.fillRect(7, -9, 9, 18); ctx.fillStyle = '#416267'; ctx.fillRect(11, -6, 5, 12);
    }
  }
}
function unit(e) {
  const cargo = Math.floor(e.cargo / 30), key = `${e.type}:${e.team}:${e.type === 'harvester' ? cargo : 0}`;
  let sprite = unitSprites.get(key);
  if (!sprite) {
    const bounds = e.stats.flying ? { x: -30, y: -30, width: 66, height: 60 } : isInfantry(e.type) ? { x: -12, y: -12, width: 40, height: 24 } : { x: -24, y: -22, width: e.type === 'artillery' ? 68 : 64, height: 44 };
    const image = document.createElement('canvas'); image.width = bounds.width * 2; image.height = bounds.height * 2;
    const c = image.getContext('2d'); c.setTransform(2, 0, 0, 2, -bounds.x * 2, -bounds.y * 2);
    paintUnit({ ...e, angle: 0, cargo: cargo * 30 }, c); sprite = { image, ...bounds }; unitSprites.set(key, sprite);
  }
  ctx.rotate(e.angle); ctx.drawImage(sprite.image, sprite.x, sprite.y, sprite.width, sprite.height);
}
function drawEntity(e) {
  const selectedEntity = selected.includes(e.id);
  if (selectedEntity) {
    ellipse(ctx, e.x, e.y + 3, e.radius + 12, (e.radius + 12) * .7, '#98d5cb16');
    ctx.strokeStyle = '#aae4d4'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(e.x, e.y + 3, e.radius + 12, (e.radius + 12) * .7, 0, 0, Math.PI * 2); ctx.stroke();
    if (e.order && !e.building) { ctx.setLineDash([4, 6]); line(ctx, e.x, e.y, e.order.x, e.order.y, '#b6ded466'); ctx.setLineDash([]); }
    if (e.rally) { ctx.setLineDash([5, 7]); line(ctx, e.x, e.y, e.rally.x, e.rally.y, '#d8e8a2'); ctx.setLineDash([]); ellipse(ctx, e.rally.x, e.rally.y, 7, 7, '#d8e8a2'); }
  }
  if (e.shield > 0) { ctx.strokeStyle = '#b4abdf77'; ctx.beginPath(); ctx.ellipse(e.x, e.y, e.radius + 9, e.radius + 9, 0, 0, Math.PI * 2); ctx.stroke(); }
  ellipse(ctx, e.x + 9, e.y + 11, e.radius + 5, e.radius * .7, '#1d2b2a50');
  ctx.save(); ctx.translate(e.x, e.y); if (e.building) building(e); else unit(e); ctx.restore();
  if (selectedEntity || e.hp < e.maxHp) {
    const width = e.building ? 65 : 30, y = e.y - e.radius - (e.building ? 24 : 12);
    ctx.fillStyle = '#1e2925'; ctx.fillRect(e.x - width / 2 - 1, y - 1, width + 2, 5); ctx.fillStyle = e.hp / e.maxHp < .3 ? '#e29369' : e.team === 'player' ? '#bad899' : '#d18675'; ctx.fillRect(e.x - width / 2, y, width * e.hp / e.maxHp, 3);
    if (selectedEntity && e.building) { ctx.fillStyle = '#dce5ce'; ctx.font = '10px system-ui'; ctx.textAlign = 'center'; ctx.fillText(SPECS[e.type].name, e.x, y - 7); }
  }
}
function redrawGround() {
  gctx.drawImage(terrain, 0, 0);
  for (const ore of game.ore) {
    if (ore.amount <= 0) continue;
    ellipse(gctx, ore.x, ore.y, 82, 58, '#857a3740');
    for (let i = 0; i < 45 * ore.amount / 24000; i++) {
      const a = i * 2.399, r = 12 + Math.sqrt(i) * 10, x = ore.x + Math.cos(a) * r, y = ore.y + Math.sin(a) * r * .65;
      gctx.fillStyle = ['#c4b55f', '#a7954b', '#e3d285'][i % 3]; gctx.beginPath(); gctx.moveTo(x - 5, y + 3); gctx.lineTo(x - 2, y - 7); gctx.lineTo(x + 4, y - 5); gctx.lineTo(x + 6, y + 3); gctx.closePath(); gctx.fill();
    }
  }
}
function draw() {
  const now = performance.now();
  updateFog(now);
  const oreState = game.ore.map(o => Math.ceil(45 * o.amount / 24000)).join(',');
  if (oreState !== oreSignature) { redrawGround(); oreSignature = oreState; }
  mapLayer.style.transform = `translate3d(${-camera.x}px, ${-camera.y}px, 0)`;
  ctx.clearRect(0, 0, view.width, view.height); ctx.save(); ctx.translate(-camera.x, -camera.y);
  for (const q of game.queue.filter(q => q.x !== undefined)) {
    const r = SPECS[q.type].radius; ctx.strokeStyle = '#d3dfa0'; ctx.setLineDash([5, 5]); ctx.strokeRect(q.x - r, q.y - r, r * 2, r * 2); ctx.setLineDash([]);
    ctx.fillStyle = '#d3dfa029'; ctx.fillRect(q.x - r, q.y + r - 2 * r * (1 - q.remaining / q.total), r * 2, 2 * r * (1 - q.remaining / q.total));
    ctx.fillStyle = '#d3dfa0'; ctx.font = '10px system-ui'; ctx.textAlign = 'center'; ctx.fillText(`建造中 ${Math.ceil(q.remaining)}s`, q.x, q.y - r - 10);
  }
  for (const e of game.entities.filter(e => e.x + e.radius + 100 > camera.x && e.x - e.radius - 100 < camera.x + view.width && e.y + e.radius + 100 > camera.y && e.y - e.radius - 100 < camera.y + view.height && game.visible(e)).sort((a, b) => (a.stats.flying ? 1 : 0) - (b.stats.flying ? 1 : 0) || a.y - b.y)) drawEntity(e);
  for (const fx of game.effects) {
    if (fx.kind === 'shot') { ctx.globalAlpha = fx.life / fx.maxLife; line(ctx, fx.x, fx.y, fx.tx, fx.ty, fx.team === 'player' ? '#ffecb7' : '#ffad77', 2); ellipse(ctx, fx.tx, fx.ty, 6, 6, '#ffd38b'); }
    else { const p = 1 - fx.life / fx.maxLife; ctx.globalAlpha = 1 - p; ellipse(ctx, fx.x, fx.y, fx.radius * (.3 + p), fx.radius * (.3 + p), fx.kind === 'support' ? FACTIONS[game.faction].color + '88' : '#df925b'); ellipse(ctx, fx.x, fx.y, fx.radius * .5 * p, fx.radius * .5 * p, '#fff2ae'); }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  // The cached ground moves as a compositor layer; only foreground units repaint.
  // Enemy selection and combat still use the simulation's current line of sight.
  if (placement) {
    const p = worldPoint(pointer), valid = game.canBuild(placement, p.x, p.y), r = SPECS[placement].radius;
    ctx.save(); ctx.translate(-camera.x, -camera.y); const hq = game.entities.find(e => e.type === 'hq' && e.team === 'player');
    if (hq) { ctx.strokeStyle = '#d8e8a250'; ctx.setLineDash([5, 7]); ctx.beginPath(); ctx.arc(hq.x, hq.y, 470, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
    ctx.fillStyle = valid ? '#b9dd9255' : '#e6806955'; ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2); ctx.strokeStyle = valid ? '#d8e8a2' : '#e68069'; ctx.strokeRect(p.x - r, p.y - r, r * 2, r * 2); ctx.restore();
  }
  if (drag && distance(pointer, drag) > 5) { ctx.fillStyle = '#adddcc18'; ctx.strokeStyle = '#b3dfc8'; ctx.lineWidth = 1; ctx.fillRect(drag.x, drag.y, pointer.x - drag.x, pointer.y - drag.y); ctx.strokeRect(drag.x, drag.y, pointer.x - drag.x, pointer.y - drag.y); }
  if (attackMode) { ctx.strokeStyle = '#e8a579'; ctx.beginPath(); ctx.arc(pointer.x, pointer.y, 13, 0, Math.PI * 2); ctx.stroke(); }
  if (abilityMode) { ctx.strokeStyle = FACTIONS[game.faction].color; ctx.beginPath(); ctx.arc(pointer.x, pointer.y, FACTIONS[game.faction].ability.radius, 0, Math.PI * 2); ctx.stroke(); }
  if (now - radarTime >= 100) { drawRadar(); radarTime = now; }
}
function drawRadar() {
  const sx = radar.width / WORLD.width, sy = radar.height / WORLD.height;
  rctx.fillStyle = '#344431'; rctx.fillRect(0, 0, radar.width, radar.height);
  rctx.globalAlpha = .35; rctx.drawImage(radarTerrain, 0, 0); rctx.globalAlpha = 1;
  rctx.fillStyle = '#bdad61'; for (const o of game.ore.filter(o => o.amount > 0)) rctx.fillRect(o.x * sx - 3, o.y * sy - 3, 6, 6);
  for (const e of game.entities) { if (!game.visible(e)) continue; const size = e.building ? 5 : 3; rctx.fillStyle = colors[e.team]; rctx.fillRect(e.x * sx - size / 2, e.y * sy - size / 2, size, size); }
  rctx.strokeStyle = '#c6d2b790'; rctx.lineWidth = 1; rctx.strokeRect(camera.x * sx, camera.y * sy, view.width * sx, view.height * sy);
  rctx.strokeStyle = '#9cad8220'; rctx.beginPath(); rctx.moveTo(0, radar.height / 2); rctx.lineTo(radar.width, radar.height / 2); rctx.moveTo(radar.width / 2, 0); rctx.lineTo(radar.width / 2, radar.height); rctx.stroke();
  const scanY = (performance.now() * .015) % radar.height; rctx.fillStyle = '#a4c48b0b'; rctx.fillRect(0, scanY, radar.width, 2);
}

function issue(p, useAttackMode = false) {
  const units = selected.filter(id => game.entities.some(e => e.id === id && !e.building && e.team === 'player'));
  if (!units.length) {
    if (game.entities.some(e => selected.includes(e.id) && ['barracks', 'factory', 'airfield'].includes(e.type))) { game.setRally(selected, p.x, p.y); notify('生产集结点已设置'); }
    else notify('请先选择部队，或选择生产建筑设置集结点'); return;
  }
  const target = hit(p); const enemy = target?.team === 'enemy' ? target : null;
  units.forEach((id, i) => { const spacing = 38, cols = Math.ceil(Math.sqrt(units.length)), e = game.entities.find(e => e.id === id), supportTarget = target?.team === 'player' && ['medic', 'engineer'].includes(e.type) ? target : null; const x = p.x + (i % cols - (cols - 1) / 2) * spacing, y = p.y + (Math.floor(i / cols) - (Math.ceil(units.length / cols) - 1) / 2) * spacing; game.command([id], enemy || supportTarget ? p.x : x, enemy || supportTarget ? p.y : y, (enemy || supportTarget)?.id, useAttackMode); });
  game.effects.push({ kind: 'explosion', x: p.x, y: p.y, radius: 12, life: .45, maxLife: .45 });
  attackMode = false; updateUI();
}
function clearHold() { clearTimeout(holdTimer); holdTimer = null; }
function resetTouch() {
  clearHold();
  const ids = [...touchPointers.keys()];
  touchPointers.clear(); touchGesture = null; lastTouchTap = null; drag = null;
  for (const id of ids) if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
}
function closeCommand() {
  document.body.classList.remove('command-open');
  $('mobile-command').setAttribute('aria-expanded', 'false');
  $('command-panel').inert = touchLayout;
  if (touchLayout && $('command-panel').contains(document.activeElement)) $('mobile-command').focus({ preventScroll: true });
}
function setTouchLayout(enabled) {
  if (enabled === touchLayout) return;
  resetTouch(); touchLayout = enabled; mouseInside = false;
  document.body.classList.toggle('touch-layout', enabled); closeCommand(); resize();
  document.querySelector('.lobby-help').innerHTML = `${enabled ? '点选部队 · 点地面移动 · 长按攻击 · 双指拖动视野' : '左键选择 · 右键移动与攻击 · 中键拖动视野 · 空格暂停'}<br>建造战车工厂 → 航空基地 / 科技中心 → 阵营特色单位`;
  document.querySelector('.pause-label small').textContent = enabled ? '点击顶部继续按钮恢复行动' : '按空格或点击暂停按钮继续';
  canvas.setAttribute('aria-label', enabled ? '即时战略战场：点选部队，点地面移动，长按攻击，单指框选，双指拖动视野' : '即时战略战场：左键选择，右键移动或攻击');
  updateUI();
}
function focusBase() { camera = { x: 410 - view.width / 2, y: 1020 - view.height / 2 }; boundCamera(); }
function selectArmy() {
  selected = game.entities.filter(u => u.team === 'player' && !u.building && u.type !== 'harvester').map(u => u.id); updateUI();
}
function selectSameType(entity) {
  selected = game.entities.filter(u => u.team === 'player' && u.type === entity.type && !u.building && u.x > camera.x && u.x < camera.x + view.width && u.y > camera.y && u.y < camera.y + view.height).map(u => u.id);
  updateUI();
}
function targetAction(p) {
  if (abilityMode) { const result = game.useAbility(p.x, p.y); if (result.ok) abilityMode = false; else notify(result.message); updateUI(); return true; }
  if (placement) { const result = game.build(placement, p.x, p.y); notify(result.ok ? `${SPECS[placement].name}开始建造` : result.message); if (result.ok) { placement = null; renderCatalog(); } updateUI(); return true; }
  if (attackMode) { issue(p, true); return true; }
  return false;
}
function touchAction(point, held = false) {
  if (paused || lobbyOpen || game.result) return;
  if (targetAction(point)) { lastTouchTap = null; return; }
  const entity = hit(point, 22), now = performance.now();
  if (entity?.team === 'player') {
    const canSupport = selected.some(id => game.entities.some(u => u.id === id && ['medic', 'engineer'].includes(u.type)));
    if (held && canSupport) issue(entity);
    else if (!entity.building && (held || (lastTouchTap?.id === entity.id && now - lastTouchTap.time < 350))) selectSameType(entity);
    else selected = [entity.id];
    lastTouchTap = held ? null : { id: entity.id, time: now };
  } else if (selected.length) { issue(entity || point, held && !entity); lastTouchTap = null; }
  else { lastTouchTap = null; if (entity?.team === 'enemy') notify('先点选部队，再点敌军发起攻击'); }
  updateUI();
}
function touchCenter() {
  const points = [...touchPointers.values()];
  return { x: points.reduce((s, p) => s + p.x, 0) / points.length, y: points.reduce((s, p) => s + p.y, 0) / points.length };
}
function touchDown(e) {
  e.preventDefault();
  if (lobbyOpen || game.result || paused) return;
  if (!touchLayout) setTouchLayout(true);
  mouseInside = false; pointer = screenPoint(e); touchPointers.set(e.pointerId, pointer); canvas.setPointerCapture(e.pointerId);
  if (touchPointers.size === 1) {
    touchGesture = { kind: 'tap', start: { ...pointer }, world: worldPoint(pointer) };
    holdTimer = setTimeout(() => {
      if (touchGesture?.kind !== 'tap') return;
      touchGesture.kind = 'held'; touchAction(touchGesture.world, true);
    }, 500);
  } else {
    clearHold(); drag = null; lastTouchTap = null;
    touchGesture = { kind: 'pan', start: touchCenter(), cameraX: camera.x, cameraY: camera.y };
  }
}
function touchMove(e) {
  if (!touchPointers.has(e.pointerId)) return;
  e.preventDefault(); pointer = screenPoint(e); touchPointers.set(e.pointerId, pointer);
  const gesture = touchGesture;
  if (gesture?.kind === 'pan' && touchPointers.size >= 2) {
    const center = touchCenter(); camera.x = gesture.cameraX - (center.x - gesture.start.x); camera.y = gesture.cameraY - (center.y - gesture.start.y); boundCamera();
  } else if (gesture?.kind === 'tap' && distance(pointer, gesture.start) > 10) {
    clearHold(); lastTouchTap = null;
    if (placement || attackMode || abilityMode) gesture.kind = 'cancelled';
    else { gesture.kind = 'box'; drag = { ...gesture.start, world: gesture.world, append: false }; }
  }
}
function touchUp(e) {
  if (!touchPointers.has(e.pointerId)) return;
  e.preventDefault(); clearHold(); pointer = screenPoint(e);
  const gesture = touchGesture;
  touchPointers.delete(e.pointerId);
  if (gesture?.kind === 'tap') touchAction(worldPoint(pointer));
  else if (gesture?.kind === 'box') {
    const p = worldPoint(pointer), x1 = Math.min(gesture.world.x, p.x), x2 = Math.max(gesture.world.x, p.x), y1 = Math.min(gesture.world.y, p.y), y2 = Math.max(gesture.world.y, p.y);
    selected = game.entities.filter(u => u.team === 'player' && !u.building && u.x >= x1 && u.x <= x2 && u.y >= y1 && u.y <= y2).map(u => u.id); updateUI();
  }
  // Lifting either finger ends a pan. The remaining finger cannot issue a command.
  touchGesture = touchPointers.size ? { kind: 'cancelled' } : null; drag = null;
}
canvas.addEventListener('pointerdown', e => {
  if (e.pointerType === 'touch') { touchDown(e); return; }
  pointer = screenPoint(e); const p = worldPoint(pointer);
  if (e.button === 1) {
    e.preventDefault(); pan = { ...pointer, cameraX: camera.x, cameraY: camera.y };
    canvas.style.cursor = 'grabbing'; canvas.setPointerCapture(e.pointerId); return;
  }
  if (game.result || paused || lobbyOpen) return;
  if (e.button === 2) { if (placement || attackMode || abilityMode) { placement = null; attackMode = abilityMode = false; renderCatalog(); updateUI(); } else issue(p); return; }
  if (e.button !== 0) return;
  if (targetAction(p)) return;
  drag = { ...pointer, world: p, append: e.shiftKey }; canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', e => {
  if (e.pointerType === 'touch') { touchMove(e); return; }
  pointer = screenPoint(e);
  if (pan) { camera.x = pan.cameraX - (pointer.x - pan.x); camera.y = pan.cameraY - (pointer.y - pan.y); boundCamera(); }
});
canvas.addEventListener('pointerup', e => {
  if (e.pointerType === 'touch') { touchUp(e); return; }
  if (e.button === 1) { pan = null; canvas.style.cursor = ''; return; }
  if (!drag || e.button !== 0) return;
  pointer = screenPoint(e); const p = worldPoint(pointer); let ids = [];
  if (distance(drag, pointer) > 5) {
    const x1 = Math.min(drag.world.x, p.x), x2 = Math.max(drag.world.x, p.x), y1 = Math.min(drag.world.y, p.y), y2 = Math.max(drag.world.y, p.y);
    ids = game.entities.filter(u => u.team === 'player' && !u.building && u.x >= x1 && u.x <= x2 && u.y >= y1 && u.y <= y2).map(u => u.id);
  } else { const e = hit(p); if (e?.team === 'player') ids = [e.id]; }
  selected = drag.append ? [...new Set([...selected, ...ids])] : ids; drag = null; updateUI();
});
canvas.addEventListener('pointercancel', () => { resetTouch(); drag = pan = null; canvas.style.cursor = ''; });
canvas.addEventListener('lostpointercapture', e => { if (touchPointers.has(e.pointerId)) resetTouch(); });
canvas.addEventListener('dblclick', e => { if (e.sourceCapabilities?.firesTouchEvents) return; const entity = hit(worldPoint(screenPoint(e))); if (entity?.team === 'player' && !entity.building) selectSameType(entity); });
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('pointerenter', e => { if (e.pointerType === 'touch') return; pointer = screenPoint(e); mouseInside = true; }); canvas.addEventListener('pointerleave', () => { mouseInside = false; });
radar.addEventListener('pointerdown', e => { e.preventDefault(); const r = radar.getBoundingClientRect(); camera.x = (e.clientX - r.left) / r.width * WORLD.width - view.width / 2; camera.y = (e.clientY - r.top) / r.height * WORLD.height - view.height / 2; boundCamera(); closeCommand(); });
function togglePause() { if (game.result || lobbyOpen) return; resetTouch(); paused = !paused; $('pause-label').classList.toggle('hidden', !paused); $('pause').innerHTML = paused ? '▶ <span>继续</span>' : 'Ⅱ <span>暂停</span>'; updateUI(); }
function toggleAttack() { if (paused || game.result || lobbyOpen) return; if (!selected.length) { notify('请先选择部队'); return; } attackMode = !attackMode; abilityMode = false; placement = null; renderCatalog(); updateUI(); if (attackMode) { closeCommand(); notify(`进攻移动：${touchLayout ? '点战场' : '左键'}选择目标位置`); } }
window.addEventListener('keydown', e => {
  if (lobbyOpen) { if (e.key === 'Escape' && hasDeployed) closeLobby(); return; }
  if (e.target.closest('input, textarea, select') || e.repeat) return;
  const key = e.key.toLowerCase();
  if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) e.preventDefault();
  if (key === ' ') togglePause();
  if (key === 'a' && !e.ctrlKey && !e.metaKey) { toggleAttack(); return; }
  if (key === 's') { game.stop(selected); updateUI(); return; }
  if (key === 'escape') { placement = null; attackMode = abilityMode = false; selected = []; renderCatalog(); updateUI(); }
  if ((e.ctrlKey || e.metaKey) && key === 'a') { e.preventDefault(); selectArmy(); return; }
  if (key === 'h') focusBase();
  keys.add(key);
});
window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase())); window.addEventListener('blur', () => { keys.clear(); mouseInside = false; resetTouch(); drag = pan = null; canvas.style.cursor = ''; });
$('build-tab').onclick = () => setTab('build'); $('unit-tab').onclick = () => setTab('unit'); $('pause').onclick = togglePause;
$('attack-mode').onclick = toggleAttack; $('stop').onclick = () => { game.stop(selected); notify('部队已停止'); updateUI(); };
$('mobile-select').onclick = selectArmy; $('mobile-attack').onclick = toggleAttack; $('mobile-stop').onclick = $('stop').onclick; $('mobile-home').onclick = focusBase;
$('mobile-cancel').onclick = () => { const aiming = placement || attackMode || abilityMode; placement = null; attackMode = abilityMode = false; if (!aiming) selected = []; resetTouch(); renderCatalog(); updateUI(); };
$('mobile-command').onclick = () => {
  if (document.body.classList.contains('command-open')) { closeCommand(); return; }
  resetTouch(); document.body.classList.add('command-open'); $('command-panel').inert = false; $('mobile-command').setAttribute('aria-expanded', 'true'); $('close-command').focus({ preventScroll: true });
};
$('close-command').onclick = $('command-shade').onclick = closeCommand;
touchQuery.addEventListener('change', () => setTouchLayout(touchQuery.matches));
function restart(options = { country: game.country, enemyCountry: game.enemyCountry, difficulty: game.difficulty }) {
  resetTouch(); closeCommand(); game = new Game(options); colors.player = FACTIONS[game.faction].color; unitSprites.clear(); selected = []; placement = null; attackMode = abilityMode = false; drag = pan = null; keys.clear(); paused = false; resultShown = false; fogSignature = ''; fogTime = radarTime = -Infinity; camera = { x: 0, y: 620 }; if (touchLayout) focusBase(); else boundCamera(); $('result').classList.add('hidden'); $('pause-label').classList.add('hidden'); $('pause').innerHTML = 'Ⅱ <span>暂停</span>'; setTab('build'); $('catalog').scrollTop = 0; document.querySelector('.sidebar').scrollTop = 0; document.querySelector('.objective p').textContent = `对手：${FACTIONS[COUNTRIES[game.enemyCountry].faction].name} · ${COUNTRIES[game.enemyCountry].name} / ${DIFFICULTIES[game.difficulty].name}难度`; updateUI(); notify(`${COUNTRIES[game.country].name}部队已部署。发展经济，建造科技中心解锁特色兵种。`);
}
function renderLobby() {
  const faction = COUNTRIES[chosenCountry].faction;
  $('faction-cards').innerHTML = Object.entries(FACTIONS).map(([id, f]) => `<button data-faction="${id}" class="faction-card ${id === faction ? 'chosen' : ''}" style="--faction:${f.color}"><span class="faction-emblem">${id === 'alliance' ? '✦' : id === 'iron' ? '▣' : '◈'}</span><strong>${f.name}</strong><p>${f.motto}</p><small>${f.trait}</small></button>`).join('');
  $('country-cards').innerHTML = FACTIONS[faction].countries.map(id => `<button data-country="${id}" class="country-card ${chosenCountry === id ? 'chosen' : ''}"><span>${COUNTRIES[id].code}</span><strong>${COUNTRIES[id].name}</strong><small>${COUNTRIES[id].trait}</small></button>`).join('');
  $('faction-units').innerHTML = `<span>特色兵种</span>${FACTIONS[faction].units.map(t => `<div><b>${SPECS[t].icon} ${SPECS[t].name}</b><small>${SPECS[t].desc}</small></div>`).join('')}<div class="lobby-ability"><b>${FACTIONS[faction].ability.name}</b><small>${FACTIONS[faction].ability.desc}</small></div>`;
  for (const b of $('faction-cards').querySelectorAll('button')) b.onclick = () => { chosenCountry = FACTIONS[b.dataset.faction].countries[0]; renderLobby(); };
  for (const b of $('country-cards').querySelectorAll('button')) b.onclick = () => { chosenCountry = b.dataset.country; renderLobby(); };
}
function openLobby() { resetTouch(); closeCommand(); lobbyOpen = true; chosenCountry = game.country; $('enemy-country').value = game.enemyCountry; $('difficulty').value = game.difficulty; keys.clear(); document.querySelector('main').inert = true; document.querySelector('header').inert = true; $('lobby').classList.remove('hidden'); $('resume-game').classList.toggle('hidden', !hasDeployed); renderLobby(); updateUI(); $('deploy').focus(); }
function closeLobby() { lobbyOpen = false; $('lobby').classList.add('hidden'); document.querySelector('main').inert = false; document.querySelector('header').inert = false; updateUI(); }
$('enemy-country').innerHTML = Object.entries(FACTIONS).map(([id, f]) => `<optgroup label="${f.name}">${f.countries.map(c => `<option value="${c}">${COUNTRIES[c].name}</option>`).join('')}</optgroup>`).join('');
$('deploy').onclick = () => { hasDeployed = true; closeLobby(); restart({ country: chosenCountry, enemyCountry: $('enemy-country').value, difficulty: $('difficulty').value }); };
$('resume-game').onclick = closeLobby;
$('restart').onclick = () => restart(); $('new-game').onclick = openLobby;
$('ability').onclick = () => { if (paused) { notify('请先恢复行动'); return; } const a = FACTIONS[game.faction].ability; if (a.instant) { const r = game.useAbility(); if (!r.ok) notify(r.message); } else { abilityMode = !abilityMode; placement = null; attackMode = false; renderCatalog(); if (abilityMode) closeCommand(); notify(a.desc); } updateUI(); };
function frame(now) {
  const dt = Math.min((now - lastTime) / 1000, .1); lastTime = now;
  if (!paused && !game.result && !lobbyOpen) game.update(dt);
  const speed = 520 * dt;
  if (!pan && !touchPointers.size && !lobbyOpen) {
    if (keys.has('arrowleft') || keys.has('j') || (mouseInside && pointer.x < 12)) camera.x -= speed;
    if (keys.has('arrowright') || keys.has('d') || keys.has('l') || (mouseInside && pointer.x > view.width - 12)) camera.x += speed;
    if (keys.has('arrowup') || keys.has('w') || keys.has('i') || (mouseInside && pointer.y < 12)) camera.y -= speed;
    if (keys.has('arrowdown') || keys.has('k') || (mouseInside && pointer.y > view.height - 12)) camera.y += speed;
  }
  boundCamera(); draw();
  if (now - uiTime > 180) { updateUI(); uiTime = now; for (const message of game.events.splice(0)) notify(message); }
  if (game.result && !resultShown) {
    resetTouch(); closeCommand(); resultShown = true; $('result').classList.remove('hidden'); $('result-title').textContent = game.result === 'victory' ? '行动胜利' : '基地失守'; $('result-text').textContent = game.result === 'victory' ? '敌方指挥中心已摧毁，灰岩谷现已控制。' : '我方指挥中心被摧毁。增加防御，保护你的生产线。';
  }
  requestAnimationFrame(frame);
}
setTouchLayout(touchQuery.matches); generateTerrain(); resize(); new ResizeObserver(resize).observe($('field')); renderCatalog(); updateUI(); requestAnimationFrame(frame);
openLobby();
