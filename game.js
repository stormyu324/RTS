import { Game, WORLD, SPECS, distance } from './engine.js';

const $ = id => document.getElementById(id);
const canvas = $('battle'), ctx = canvas.getContext('2d'), radar = $('radar'), rctx = radar.getContext('2d', { alpha: false });
const ground = $('ground'), gctx = ground.getContext('2d', { alpha: false });
const mapLayer = $('map-layer');
ground.width = WORLD.width; ground.height = WORLD.height;
let game = new Game(), selected = [], tab = 'build', placement = null, attackMode = false, paused = false;
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
let fogTime = -Infinity, radarTime = -Infinity;
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
  const box = canvas.getBoundingClientRect(); view.width = box.width; view.height = box.height;
  const dpr = Math.min(devicePixelRatio, 2); canvas.width = box.width * dpr; canvas.height = box.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); radarTime = -Infinity; boundCamera();
}
function boundCamera() { camera.x = clamp(camera.x, 0, Math.max(0, WORLD.width - view.width)); camera.y = clamp(camera.y, 0, Math.max(0, WORLD.height - view.height)); }
function screenPoint(event) { const r = canvas.getBoundingClientRect(); return { x: event.clientX - r.left, y: event.clientY - r.top }; }
function worldPoint(p) { return { x: p.x + camera.x, y: p.y + camera.y }; }
function hit(p) { return game.entities.filter(e => game.visible(e) && distance(e, p) < e.radius + 12).sort((a, b) => distance(a, p) - distance(b, p))[0]; }
function notify(message) { $('notice').textContent = message; $('notice').classList.add('show'); clearTimeout(noticeTimer); noticeTimer = setTimeout(() => $('notice').classList.remove('show'), 3200); }
function setTab(next) { tab = next; $('build-tab').classList.toggle('active', tab === 'build'); $('unit-tab').classList.toggle('active', tab === 'unit'); $('catalog-title').textContent = tab === 'build' ? '基础设施' : '战斗与支援'; renderCatalog(); }
function renderCatalog() {
  const types = tab === 'build' ? ['power', 'barracks', 'refinery', 'factory', 'turret'] : ['rifle', 'tank', 'harvester'];
  $('catalog').innerHTML = types.map(type => { const s = SPECS[type]; return `<button class="card ${placement === type ? 'active' : ''}" data-type="${type}"><span class="card-icon">${s.icon}</span><span class="card-name">${s.name}</span><span class="card-cost">¥${s.cost}</span><small class="card-desc">${s.desc}</small></button>`; }).join('');
  for (const button of $('catalog').querySelectorAll('button')) button.addEventListener('click', () => {
    if (game.result) return;
    const type = button.dataset.type;
    if (tab === 'build') {
      if (game.credits < SPECS[type].cost) { notify('资金不足，等待矿车运回矿石'); return; }
      placement = placement === type ? null : type; attackMode = false; renderCatalog(); updateUI();
      if (placement) notify(`部署${SPECS[type].name}：左键选择位置，右键取消`);
    } else { const result = game.train(type); notify(result.ok ? `${SPECS[type].name}已加入生产队列` : result.message); updateUI(); }
  });
  updateUI();
}
function updateUI() {
  selected = selected.filter(id => game.entities.some(e => e.id === id));
  $('credits').textContent = `¥ ${Math.floor(game.credits).toLocaleString()}`;
  const p = game.power; $('power').textContent = `${p.used} / ${p.supply}`; $('power').style.color = p.used > p.supply ? '#df9d7a' : '#d9e1dd';
  const seconds = Math.floor(game.time); $('clock').textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  $('attack-mode').classList.toggle('active', attackMode);
  $('selection-count').textContent = `${selected.length} 个单位`;
  const entities = game.entities.filter(e => selected.includes(e.id));
  if (entities.length) {
    const e = entities[0], percent = entities.reduce((v, e) => v + e.hp / e.maxHp, 0) / entities.length * 100;
    setPanelHTML('selected', `<div class="selected-info"><span class="unit-icon">${SPECS[e.type].icon}</span><div><strong>${entities.length > 1 ? `混合小队 · ${entities.length} 个单位` : SPECS[e.type].name}</strong><small>${entities.length > 1 ? '右键下达编队指令' : `${Math.ceil(e.hp)} / ${e.maxHp} 生命值${e.type === 'harvester' ? ` · 载矿 ${Math.floor(e.cargo)}` : ''}`}</small><div class="health"><span style="width:${percent.toFixed(1)}%"></span></div></div></div>`);
  } else setPanelHTML('selected', '<div class="empty-selection">⌖<p>选择部队或建筑<small>按住 Shift 可追加选择</small></p></div>');
  $('queue-count').textContent = game.queue.length ? `${game.queue.length} 项生产中` : '空闲';
  setPanelHTML('queue', game.queue.length ? game.queue.map(q => `<div class="queue-item">${SPECS[q.type].name} <span style="float:right">${Math.ceil(q.remaining)}s</span><div class="health"><span style="width:${((1 - q.remaining / q.total) * 100).toFixed(1)}%"></span></div></div>`).join('') : '暂无生产任务');
  for (const b of $('catalog').querySelectorAll('button')) {
    const spec = SPECS[b.dataset.type]; b.disabled = !!game.result || (!!spec.producer && !game.has(spec.producer));
    if (spec.producer && !game.has(spec.producer)) b.title = `需要${SPECS[spec.producer].name}`;
    else b.title = `${spec.name} · ${spec.time} 秒`;
  }
}
function setPanelHTML(id, html) {
  if (uiCache.get(id) === html) return;
  $(id).innerHTML = html; uiCache.set(id, html);
}

function updateFog(now) {
  if (now - fogTime < 100) return false;
  fogTime = now;
  fctx.globalCompositeOperation = 'source-over'; fctx.clearRect(0, 0, fog.width, fog.height);
  fctx.fillStyle = '#101a20c7'; fctx.fillRect(0, 0, fog.width, fog.height);
  fctx.globalCompositeOperation = 'destination-out';
  for (const e of game.entities) {
    if (e.team !== 'player') continue;
    const radius = (e.building ? 340 : 390) * FOG_SCALE;
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
  }
}
function paintUnit(e, ctx) {
  const team = colors[e.team]; ctx.rotate(e.angle);
  if (e.type === 'rifle') {
    ellipse(ctx, 1, 3, 7, 7, '#14232170'); ctx.fillStyle = '#394a3e'; ctx.fillRect(-6, -5, 9, 3); ctx.fillRect(-6, 3, 9, 3);
    ctx.fillStyle = team; ctx.fillRect(-3, -5, 9, 10); ellipse(ctx, 3, 0, 4, 4, '#bdc3a2'); ctx.fillStyle = '#252f2c'; ctx.fillRect(5, -2, 12, 3);
  } else {
    ctx.fillStyle = '#23332c'; ctx.fillRect(-20, -17, 40, 9); ctx.fillRect(-20, 8, 40, 9);
    for (let x = -18; x < 20; x += 7) { ctx.fillStyle = '#697467'; ctx.fillRect(x, -15, 3, 5); ctx.fillRect(x, 10, 3, 5); }
    ctx.fillStyle = '#7c9078'; ctx.fillRect(-17, -11, 34, 22); ctx.fillStyle = team; ctx.fillRect(-15, -10, 6, 20);
    if (e.type === 'tank') {
      ctx.fillStyle = '#a6b395'; ctx.fillRect(-7, -9, 19, 18); ctx.fillStyle = '#586a58'; ctx.fillRect(-4, -6, 6, 12); ctx.fillStyle = '#c2c9ad'; ctx.fillRect(6, -3, 28, 6); ctx.fillStyle = '#2b3d32'; ctx.fillRect(30, -4, 5, 8);
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
    sprite = document.createElement('canvas'); sprite.width = 128; sprite.height = 88;
    const c = sprite.getContext('2d'); c.setTransform(2, 0, 0, 2, 48, 44);
    paintUnit({ ...e, angle: 0, cargo: cargo * 30 }, c); unitSprites.set(key, sprite);
  }
  ctx.rotate(e.angle); ctx.drawImage(sprite, -24, -22, 64, 44);
}
function drawEntity(e) {
  const selectedEntity = selected.includes(e.id);
  if (selectedEntity) {
    ellipse(ctx, e.x, e.y + 3, e.radius + 12, (e.radius + 12) * .7, '#98d5cb16');
    ctx.strokeStyle = '#aae4d4'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(e.x, e.y + 3, e.radius + 12, (e.radius + 12) * .7, 0, 0, Math.PI * 2); ctx.stroke();
    if (e.order && !e.building) { ctx.setLineDash([4, 6]); line(ctx, e.x, e.y, e.order.x, e.order.y, '#b6ded466'); ctx.setLineDash([]); }
  }
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
  for (const e of game.entities.filter(e => e.x + e.radius + 100 > camera.x && e.x - e.radius - 100 < camera.x + view.width && e.y + e.radius + 100 > camera.y && e.y - e.radius - 100 < camera.y + view.height && game.visible(e)).sort((a, b) => a.y - b.y)) drawEntity(e);
  for (const fx of game.effects) {
    if (fx.kind === 'shot') { ctx.globalAlpha = fx.life / fx.maxLife; line(ctx, fx.x, fx.y, fx.tx, fx.ty, fx.team === 'player' ? '#ffecb7' : '#ffad77', 2); ellipse(ctx, fx.tx, fx.ty, 6, 6, '#ffd38b'); }
    else { const p = 1 - fx.life / fx.maxLife; ctx.globalAlpha = 1 - p; ellipse(ctx, fx.x, fx.y, fx.radius * (.3 + p), fx.radius * (.3 + p), '#df925b'); ellipse(ctx, fx.x, fx.y, fx.radius * .5 * p, fx.radius * .5 * p, '#fff2ae'); }
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
  if (!units.length) { notify('请先选择可移动的部队'); return; }
  const target = hit(p); const enemy = target?.team === 'enemy' ? target : null;
  units.forEach((id, i) => { const spacing = 38, cols = Math.ceil(Math.sqrt(units.length)); const x = p.x + (i % cols - (cols - 1) / 2) * spacing, y = p.y + (Math.floor(i / cols) - (Math.ceil(units.length / cols) - 1) / 2) * spacing; game.command([id], enemy ? p.x : x, enemy ? p.y : y, enemy?.id, useAttackMode); });
  game.effects.push({ kind: 'explosion', x: p.x, y: p.y, radius: 12, life: .45, maxLife: .45 });
  attackMode = false; updateUI();
}
canvas.addEventListener('pointerdown', e => {
  pointer = screenPoint(e); const p = worldPoint(pointer);
  if (e.button === 1) {
    e.preventDefault(); pan = { ...pointer, cameraX: camera.x, cameraY: camera.y };
    canvas.style.cursor = 'grabbing'; canvas.setPointerCapture(e.pointerId); return;
  }
  if (game.result || paused) return;
  if (e.button === 2) { if (placement || attackMode) { placement = null; attackMode = false; renderCatalog(); updateUI(); } else issue(p); return; }
  if (e.button !== 0) return;
  if (placement) { const result = game.build(placement, p.x, p.y); notify(result.ok ? `${SPECS[placement].name}开始建造` : result.message); if (result.ok) { placement = null; renderCatalog(); } updateUI(); return; }
  if (attackMode) { issue(p, true); return; }
  drag = { ...pointer, world: p, append: e.shiftKey }; canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', e => {
  pointer = screenPoint(e);
  if (pan) { camera.x = pan.cameraX - (pointer.x - pan.x); camera.y = pan.cameraY - (pointer.y - pan.y); boundCamera(); }
});
canvas.addEventListener('pointerup', e => {
  if (e.button === 1) { pan = null; canvas.style.cursor = ''; return; }
  if (!drag || e.button !== 0) return;
  pointer = screenPoint(e); const p = worldPoint(pointer); let ids = [];
  if (distance(drag, pointer) > 5) {
    const x1 = Math.min(drag.world.x, p.x), x2 = Math.max(drag.world.x, p.x), y1 = Math.min(drag.world.y, p.y), y2 = Math.max(drag.world.y, p.y);
    ids = game.entities.filter(u => u.team === 'player' && !u.building && u.x >= x1 && u.x <= x2 && u.y >= y1 && u.y <= y2).map(u => u.id);
  } else { const e = hit(p); if (e?.team === 'player') ids = [e.id]; }
  selected = drag.append ? [...new Set([...selected, ...ids])] : ids; drag = null; updateUI();
});
canvas.addEventListener('pointercancel', () => { drag = pan = null; canvas.style.cursor = ''; });
canvas.addEventListener('dblclick', e => { const entity = hit(worldPoint(screenPoint(e))); if (entity?.team === 'player' && !entity.building) { selected = game.entities.filter(u => u.team === 'player' && u.type === entity.type && u.x > camera.x && u.x < camera.x + view.width && u.y > camera.y && u.y < camera.y + view.height).map(u => u.id); updateUI(); } });
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('pointerenter', () => { mouseInside = true; }); canvas.addEventListener('pointerleave', () => { mouseInside = false; });
radar.addEventListener('pointerdown', e => { const r = radar.getBoundingClientRect(); camera.x = (e.clientX - r.left) / r.width * WORLD.width - view.width / 2; camera.y = (e.clientY - r.top) / r.height * WORLD.height - view.height / 2; boundCamera(); });
function togglePause() { if (game.result) return; paused = !paused; $('pause-label').classList.toggle('hidden', !paused); $('pause').innerHTML = paused ? '▶ <span>继续</span>' : 'Ⅱ <span>暂停</span>'; }
function toggleAttack() { if (!selected.length) { notify('请先选择部队'); return; } attackMode = !attackMode; placement = null; renderCatalog(); updateUI(); if (attackMode) notify('进攻移动：左键选择目标位置'); }
window.addEventListener('keydown', e => {
  if (e.target.closest('input, textarea') || e.repeat) return;
  const key = e.key.toLowerCase();
  if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) e.preventDefault();
  if (key === ' ') togglePause();
  if (key === 'a' && !e.ctrlKey && !e.metaKey) { toggleAttack(); return; }
  if (key === 's') { game.stop(selected); updateUI(); return; }
  if (key === 'escape') { placement = null; attackMode = false; selected = []; renderCatalog(); updateUI(); }
  if ((e.ctrlKey || e.metaKey) && key === 'a') { e.preventDefault(); selected = game.entities.filter(u => u.team === 'player' && !u.building && u.type !== 'harvester').map(u => u.id); updateUI(); return; }
  if (key === 'h') { camera = { x: 410 - view.width / 2, y: 1020 - view.height / 2 }; boundCamera(); }
  keys.add(key);
});
window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase())); window.addEventListener('blur', () => { keys.clear(); mouseInside = false; drag = pan = null; canvas.style.cursor = ''; });
$('build-tab').onclick = () => setTab('build'); $('unit-tab').onclick = () => setTab('unit'); $('pause').onclick = togglePause;
$('attack-mode').onclick = toggleAttack; $('stop').onclick = () => { game.stop(selected); notify('部队已停止'); updateUI(); };
function restart() { game = new Game(); selected = []; placement = null; attackMode = false; paused = false; resultShown = false; fogTime = radarTime = -Infinity; camera = { x: 0, y: 620 }; boundCamera(); $('result').classList.add('hidden'); $('pause-label').classList.add('hidden'); $('pause').innerHTML = 'Ⅱ <span>暂停</span>'; renderCatalog(); updateUI(); notify('基地已部署。建造战车工厂，准备迎击敌军。'); }
$('restart').onclick = restart; $('new-game').onclick = restart;
function frame(now) {
  const dt = Math.min((now - lastTime) / 1000, .1); lastTime = now;
  if (!paused && !game.result) game.update(dt);
  const speed = 520 * dt;
  if (!pan) {
    if (keys.has('arrowleft') || keys.has('j') || (mouseInside && pointer.x < 12)) camera.x -= speed;
    if (keys.has('arrowright') || keys.has('d') || keys.has('l') || (mouseInside && pointer.x > view.width - 12)) camera.x += speed;
    if (keys.has('arrowup') || keys.has('w') || keys.has('i') || (mouseInside && pointer.y < 12)) camera.y -= speed;
    if (keys.has('arrowdown') || keys.has('k') || (mouseInside && pointer.y > view.height - 12)) camera.y += speed;
  }
  boundCamera(); draw();
  if (now - uiTime > 180) { updateUI(); uiTime = now; for (const message of game.events.splice(0)) notify(message); }
  if (game.result && !resultShown) {
    resultShown = true; $('result').classList.remove('hidden'); $('result-title').textContent = game.result === 'victory' ? '行动胜利' : '基地失守'; $('result-text').textContent = game.result === 'victory' ? '敌方指挥中心已摧毁，灰岩谷现已控制。' : '我方指挥中心被摧毁。增加防御，保护你的生产线。';
  }
  requestAnimationFrame(frame);
}
generateTerrain(); resize(); new ResizeObserver(resize).observe($('field')); renderCatalog(); updateUI(); requestAnimationFrame(frame);
notify('欢迎，指挥官。左键选择，右键移动；先建造战车工厂。');
