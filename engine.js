export const WORLD = { width: 2200, height: 1500 };
export const SPECS = {
  hq: { name: '指挥中心', hp: 2400, radius: 60, powerUse: 20, icon: '▥' },
  power: { name: '发电站', cost: 500, time: 8, hp: 850, radius: 36, power: 100, icon: 'ϟ', desc: '提供 100 点电力' },
  refinery: { name: '矿石精炼厂', cost: 900, time: 12, hp: 1100, radius: 44, powerUse: 30, icon: '▤', desc: '矿车卸货与资金收入' },
  barracks: { name: '兵营', cost: 400, time: 8, hp: 800, radius: 32, powerUse: 10, icon: '⌂', desc: '训练步枪兵' },
  factory: { name: '战车工厂', cost: 1200, time: 16, hp: 1400, radius: 48, powerUse: 40, icon: '▦', desc: '生产坦克与采矿车' },
  turret: { name: '防御炮塔', cost: 600, time: 10, hp: 650, radius: 22, powerUse: 20, range: 250, damage: 36, reload: 1.4, icon: '⊕', desc: '自动攻击附近敌军' },
  rifle: { name: '步枪兵', cost: 120, time: 4, hp: 130, radius: 9, speed: 78, range: 155, damage: 12, reload: .65, producer: 'barracks', icon: '♟', desc: '灵活的基础战斗单位' },
  tank: { name: '主战坦克', cost: 650, time: 9, hp: 650, radius: 18, speed: 62, range: 230, damage: 50, reload: 1.5, producer: 'factory', icon: '▰', desc: '装甲与远程火力' },
  harvester: { name: '采矿车', cost: 700, time: 10, hp: 550, radius: 19, speed: 52, producer: 'factory', icon: '▣', desc: '自动采集并运送矿石' }
};
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export class Game {
  constructor() {
    this.time = 0; this.credits = 2400; this.entities = []; this.nextId = 1; this.queue = []; this.effects = []; this.result = null; this.waveAt = 65; this.wave = 0; this.events = [];
    this.ore = [{ x: 245, y: 1210, amount: 16000 }, { x: 900, y: 680, amount: 24000 }, { x: 1920, y: 190, amount: 16000 }];
    this.rocks = [{ x: 1060, y: 270, radius: 70 }, { x: 650, y: 350, radius: 95 }, { x: 1370, y: 1000, radius: 85 }, { x: 1620, y: 1300, radius: 70 }, { x: 720, y: 1320, radius: 60 }];
    this.add('hq', 'player', 410, 1020); this.add('power', 'player', 245, 930); this.add('refinery', 'player', 310, 1105); this.add('barracks', 'player', 555, 1080);
    this.add('harvester', 'player', 270, 1200); this.add('tank', 'player', 530, 930); this.add('tank', 'player', 575, 935); this.add('rifle', 'player', 520, 990); this.add('rifle', 'player', 548, 1000);
    this.add('hq', 'enemy', 1820, 350); this.add('power', 'enemy', 1960, 355); this.add('factory', 'enemy', 1700, 270); this.add('barracks', 'enemy', 1730, 440); this.add('turret', 'enemy', 1610, 430); this.add('turret', 'enemy', 1840, 515);
    this.add('tank', 'enemy', 1600, 570); this.add('tank', 'enemy', 1710, 590); this.add('rifle', 'enemy', 1780, 550); this.add('rifle', 'enemy', 1750, 560);
  }
  add(type, team, x, y, extra = {}) {
    const s = SPECS[type]; const e = { id: this.nextId++, type, team, x, y, hp: s.hp, maxHp: s.hp, radius: s.radius, building: !s.speed, cooldown: 0, angle: team === 'player' ? -.6 : 2.4, order: null, path: [], repath: 0, cargo: 0, ...extra };
    this.entities.push(e); return e;
  }
  get power() {
    const e = this.entities.filter(e => e.team === 'player' && e.building);
    return { supply: e.reduce((v, e) => v + (SPECS[e.type].power || 0), 0), used: e.reduce((v, e) => v + (SPECS[e.type].powerUse || 0), 0) };
  }
  has(type, team = 'player') { return this.entities.some(e => e.type === type && e.team === team && e.hp > 0); }
  notify(message) { this.events.push(message); }
  canBuild(type, x, y) {
    if (!SPECS[type] || SPECS[type].speed || type === 'hq' || this.result) return false;
    const r = SPECS[type].radius;
    return x > r + 10 && y > r + 10 && x < WORLD.width - r - 10 && y < WORLD.height - r - 10 && this.entities.some(e => e.team === 'player' && e.type === 'hq' && distance(e, { x, y }) < 470) && ![...this.entities.filter(e => e.building), ...this.rocks].some(e => distance(e, { x, y }) < e.radius + r + 25) && !this.ore.some(e => distance(e, { x, y }) < r + 75) && !this.queue.some(e => e.x !== undefined && distance(e, { x, y }) < SPECS[e.type].radius + r + 25);
  }
  build(type, x, y) {
    if (!this.canBuild(type, x, y)) return { ok: false, message: '请部署在基地范围内，避开建筑和矿区' };
    const s = SPECS[type]; if (this.credits < s.cost) return { ok: false, message: '资金不足，等待矿车运回矿石' };
    this.credits -= s.cost; this.queue.push({ type, x, y, remaining: s.time, total: s.time }); return { ok: true };
  }
  train(type) {
    const s = SPECS[type]; if (!s?.producer || this.result) return { ok: false, message: '无法生产此单位' };
    const producer = this.entities.find(e => e.team === 'player' && e.type === s.producer);
    if (!producer) return { ok: false, message: `请先建造${SPECS[s.producer].name}` };
    if (this.queue.length >= 12) return { ok: false, message: '生产队列已满' };
    if (this.credits < s.cost) return { ok: false, message: '资金不足' };
    this.credits -= s.cost; this.queue.push({ type, producerId: producer.id, remaining: s.time, total: s.time }); return { ok: true };
  }
  command(ids, x, y, targetId = null, attackMove = false) {
    for (const e of this.entities.filter(e => ids.includes(e.id) && e.team === 'player' && !e.building)) {
      e.order = { x: clamp(x, 15, WORLD.width - 15), y: clamp(y, 15, WORLD.height - 15), targetId, attackMove };
      e.path = []; e.repath = 0;
    }
  }
  stop(ids) { for (const e of this.entities.filter(e => ids.includes(e.id) && e.team === 'player' && !e.building)) { e.order = null; e.path = []; } }
  visible(e) { return e.team === 'player' || this.entities.some(p => p.team === 'player' && distance(p, e) < (p.building ? 340 : 390)); }
  // A* on a small navigation grid; buildings and rock outcrops are impassable.
  findPath(e, target) {
    const cell = 50, cols = 44, rows = 30;
    const obstacles = [...this.entities.filter(b => b.building), ...this.rocks];
    const blocked = (x, y) => x < 0 || y < 0 || x >= cols || y >= rows || obstacles.some(b => Math.hypot(x * cell + 25 - b.x, y * cell + 25 - b.y) < b.radius + e.radius + 8);
    const sx = clamp(Math.floor(e.x / cell), 0, cols - 1), sy = clamp(Math.floor(e.y / cell), 0, rows - 1);
    let tx = clamp(Math.floor(target.x / cell), 0, cols - 1), ty = clamp(Math.floor(target.y / cell), 0, rows - 1);
    if (blocked(tx, ty)) {
      let best = Infinity; const originalX = tx, originalY = ty;
      for (let y = Math.max(0, originalY - 4); y <= Math.min(rows - 1, originalY + 4); y++) for (let x = Math.max(0, originalX - 4); x <= Math.min(cols - 1, originalX + 4); x++) {
        const d = Math.hypot(x * cell + 25 - target.x, y * cell + 25 - target.y);
        if (!blocked(x, y) && d < best) { best = d; tx = x; ty = y; }
      }
    }
    const start = sy * cols + sx, goal = ty * cols + tx, open = [start], g = new Map([[start, 0]]), came = new Map();
    const h = id => Math.hypot(id % cols - tx, Math.floor(id / cols) - ty);
    let count = 0;
    while (open.length && count++ < 1500) {
      open.sort((a, b) => g.get(b) + h(b) - g.get(a) - h(a)); const current = open.pop();
      if (current === goal) {
        const path = []; let id = current;
        while (id !== start) { path.unshift({ x: (id % cols) * cell + 25, y: Math.floor(id / cols) * cell + 25 }); id = came.get(id); }
        if (!blocked(Math.floor(target.x / cell), Math.floor(target.y / cell))) path.push({ x: target.x, y: target.y });
        return path;
      }
      const x = current % cols, y = Math.floor(current / cols);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        if (blocked(x + dx, y + dy) || (dx && dy && (blocked(x + dx, y) || blocked(x, y + dy)))) continue;
        const next = (y + dy) * cols + x + dx, score = g.get(current) + (dx && dy ? 1.414 : 1);
        if (score < (g.get(next) ?? Infinity)) { came.set(next, current); g.set(next, score); if (!open.includes(next)) open.push(next); }
      }
    }
    return [];
  }
  move(e, target, dt) {
    e.repath -= dt;
    if (e.repath <= 0) { e.path = this.findPath(e, target); e.repath = 2; }
    const p = e.path[0]; if (!p) return;
    const d = distance(e, p), step = SPECS[e.type].speed * dt;
    e.angle = Math.atan2(p.y - e.y, p.x - e.x);
    if (d <= step + 2) { e.x = p.x; e.y = p.y; e.path.shift(); } else { e.x += Math.cos(e.angle) * step; e.y += Math.sin(e.angle) * step; }
  }
  harvest(e, dt) {
    const refinery = this.entities.filter(b => b.type === 'refinery' && b.team === e.team).sort((a, b) => distance(a, e) - distance(b, e))[0];
    if (!refinery) return;
    const availableOre = this.ore.filter(o => o.amount > 0).sort((a, b) => distance(a, e) - distance(b, e));
    if (e.cargo >= 300 || (!availableOre.length && e.cargo > 0)) {
      if (distance(e, refinery) < refinery.radius + 80) { this.credits += e.cargo; e.cargo = 0; e.path = []; e.repath = 0; }
      else this.move(e, refinery, dt);
    } else {
      const ore = availableOre[0];
      if (!ore) return;
      if (distance(e, ore) < 65) { const amount = Math.min(ore.amount, dt * 45, 300 - e.cargo); e.cargo += amount; ore.amount -= amount; }
      else this.move(e, ore, dt);
    }
  }
  update(dt) {
    if (this.result) return;
    dt = Math.max(0, Math.min(dt, .1)); this.time += dt;
    const power = this.power, productionRate = power.used > power.supply ? .4 : 1;
    const activeProducers = new Set();
    for (const q of this.queue) {
      const lane = q.producerId ?? 'construction'; if (activeProducers.has(lane)) continue; activeProducers.add(lane);
      if (q.producerId && !this.entities.some(e => e.id === q.producerId)) { this.credits += SPECS[q.type].cost; q.cancelled = true; continue; }
      q.remaining -= dt * productionRate;
      if (q.remaining <= 0) {
        if (q.x !== undefined) { this.add(q.type, 'player', q.x, q.y); if (q.type === 'refinery') this.add('harvester', 'player', q.x + 70, q.y + 70); }
        else { const p = this.entities.find(e => e.id === q.producerId); this.add(q.type, 'player', p.x + p.radius + 35, p.y + 30); }
        this.notify(`${SPECS[q.type].name}已就绪`);
      }
    }
    this.queue = this.queue.filter(q => q.remaining > 0 && !q.cancelled);
    if (this.time >= this.waveAt && this.has('hq', 'enemy')) {
      this.wave++; this.waveAt += 48; this.notify('雷达警报：敌方突击小队正在接近');
      const hq = this.entities.find(e => e.team === 'player' && e.type === 'hq');
      if (hq) for (let i = 0; i < Math.min(2 + this.wave, 7); i++) {
        const type = i % 3 === 0 ? 'tank' : 'rifle', u = this.add(type, 'enemy', 1620 + i * 28, 600);
        u.order = { x: hq.x, y: hq.y, attackMove: true };
      }
    }
    for (const e of this.entities) {
      if (e.hp <= 0) continue;
      const s = SPECS[e.type]; e.cooldown -= dt;
      const explicit = this.entities.find(t => t.id === e.order?.targetId && t.hp > 0 && t.team !== e.team);
      if (e.order?.targetId && !explicit) { e.order = null; e.path = []; }
      let target = explicit;
      if (!target && s.damage && (e.building || !e.order || e.order.attackMove || e.team === 'enemy')) {
        const search = e.building ? s.range : (e.order?.attackMove ? 340 : s.range);
        target = this.entities.filter(t => t.team !== e.team && t.hp > 0 && distance(e, t) <= search + t.radius).sort((a, b) => distance(e, a) - distance(e, b))[0];
      }
      if (target && s.damage && (e.team !== 'player' || this.visible(target))) {
        const d = distance(e, target); e.angle = Math.atan2(target.y - e.y, target.x - e.x);
        if (d <= s.range + target.radius) {
          if (e.cooldown <= 0 && (e.type !== 'turret' || e.team === 'enemy' || power.supply >= power.used)) {
            target.hp -= s.damage; e.cooldown = s.reload;
            this.effects.push({ kind: 'shot', x: e.x, y: e.y, tx: target.x, ty: target.y, team: e.team, life: .18, maxLife: .18 });
          }
        } else if (!e.building) this.move(e, target, dt);
      } else if (!e.building && e.order) {
        this.move(e, e.order, dt);
        if (distance(e, e.order) < 12) { e.order = null; e.path = []; }
      } else if (e.type === 'harvester') this.harvest(e, dt);
    }
    // Soft separation keeps squads readable without changing navigation obstacles.
    const units = this.entities.filter(e => !e.building && e.hp > 0);
    for (let i = 0; i < units.length; i++) for (let j = i + 1; j < units.length; j++) {
      const a = units[i], b = units[j], d = distance(a, b), min = a.radius + b.radius + 3;
      if (d < min) {
        const angle = d < .01 ? (a.id * 2.4) : Math.atan2(b.y - a.y, b.x - a.x), push = Math.min((min - d) * .5, 40 * dt);
        a.x -= Math.cos(angle) * push; a.y -= Math.sin(angle) * push; b.x += Math.cos(angle) * push; b.y += Math.sin(angle) * push;
      }
    }
    for (const e of this.entities.filter(e => e.hp <= 0)) {
      this.effects.push({ kind: 'explosion', x: e.x, y: e.y, radius: e.radius * 2, life: .65, maxLife: .65 });
      if (e.type === 'hq') this.result = e.team === 'enemy' ? 'victory' : 'defeat';
    }
    this.entities = this.entities.filter(e => e.hp > 0);
    for (const fx of this.effects) fx.life -= dt;
    this.effects = this.effects.filter(fx => fx.life > 0);
  }
}
