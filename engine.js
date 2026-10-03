export const WORLD = { width: 2200, height: 1500 };
export const SPECS = {
  hq: { name: '指挥中心', hp: 2400, radius: 60, powerUse: 20, icon: '▥' },
  power: { name: '发电站', cost: 500, time: 8, hp: 850, radius: 36, power: 100, icon: 'ϟ', desc: '提供 100 点电力' },
  refinery: { name: '矿石精炼厂', cost: 900, time: 12, hp: 1100, radius: 44, powerUse: 30, icon: '▤', desc: '矿车卸货与资金收入' },
  barracks: { name: '兵营', cost: 400, time: 8, hp: 800, radius: 32, powerUse: 10, icon: '⌂', desc: '训练步枪兵' },
  factory: { name: '战车工厂', cost: 1200, time: 16, hp: 1400, radius: 48, powerUse: 40, icon: '▦', desc: '生产坦克与采矿车' },
  turret: { name: '防御炮塔', cost: 600, time: 10, hp: 650, radius: 22, powerUse: 20, range: 250, damage: 36, reload: 1.4, icon: '⊕', desc: '自动攻击附近敌军' },
  airfield: { name: '航空基地', cost: 1000, time: 14, hp: 1000, radius: 45, powerUse: 35, icon: '✈', desc: '生产空中作战单位', requires: 'factory' },
  lab: { name: '科技中心', cost: 1400, time: 18, hp: 900, radius: 35, powerUse: 30, icon: '◈', desc: '解锁阵营高级兵种', requires: 'factory' },
  rifle: { name: '步枪兵', cost: 120, time: 4, hp: 130, radius: 9, speed: 78, range: 155, damage: 12, reload: .65, producer: 'barracks', icon: '♟', desc: '灵活的基础战斗单位' },
  tank: { name: '主战坦克', cost: 650, time: 9, hp: 650, radius: 18, speed: 62, range: 230, damage: 50, reload: 1.5, producer: 'factory', icon: '▰', desc: '装甲与远程火力' },
  harvester: { name: '采矿车', cost: 700, time: 10, hp: 550, radius: 19, speed: 52, producer: 'factory', icon: '▣', desc: '自动采集并运送矿石' },
  rocket: { name: '火箭兵', cost: 250, time: 5, hp: 160, radius: 10, speed: 65, range: 220, damage: 30, reload: 1.6, antiAir: true, armorBonus: 1.6, producer: 'barracks', icon: '↗', desc: '反装甲 · 可对空' },
  medic: { name: '医疗兵', cost: 220, time: 5, hp: 120, radius: 9, speed: 75, heal: 35, producer: 'barracks', icon: '✚', desc: '自动治疗附近步兵' },
  engineer: { name: '工程师', cost: 450, time: 6, hp: 140, radius: 9, speed: 65, heal: 28, producer: 'barracks', icon: '⚒', desc: '维修 · 占领非总部建筑' },
  scout: { name: '侦察战车', cost: 300, time: 5, hp: 290, radius: 14, speed: 110, range: 165, damage: 14, reload: .5, sight: 510, infantryBonus: 1.5, producer: 'factory', icon: '▱', desc: '高速侦察 · 反步兵' },
  antiair: { name: '防空战车', cost: 550, time: 7, hp: 450, radius: 17, speed: 72, range: 290, damage: 26, reload: .65, antiAir: true, airBonus: 2.3, groundBonus: .45, producer: 'factory', icon: '⇈', desc: '对空强势 · 地面火力弱' },
  sniper: { name: '游骑狙击手', faction: 'alliance', cost: 400, time: 7, hp: 100, radius: 9, speed: 72, range: 350, damage: 45, reload: 2, infantryBonus: 2.4, producer: 'barracks', icon: '⌖', desc: '远程反步兵' },
  laser: { name: '棱光战车', faction: 'alliance', cost: 1000, time: 12, hp: 600, radius: 18, speed: 68, range: 290, damage: 60, reload: 1.3, requires: 'lab', producer: 'factory', icon: '◇', desc: '科技兵种 · 精准光束' },
  gunship: { name: '苍鹰武装直升机', faction: 'alliance', cost: 900, time: 12, hp: 420, radius: 20, speed: 130, flying: true, range: 240, damage: 42, reload: 1.2, splash: 35, producer: 'airfield', icon: '✈', desc: '越过地形 · 对地打击' },
  heavy: { name: '堡垒重型坦克', faction: 'iron', cost: 1000, time: 13, hp: 1150, radius: 22, speed: 42, range: 240, damage: 85, reload: 1.9, producer: 'factory', icon: '▣', desc: '厚重装甲 · 突破前线' },
  tesla: { name: '雷霆电磁战车', faction: 'iron', cost: 1100, time: 14, hp: 700, radius: 18, speed: 58, range: 250, damage: 55, reload: 1.6, splash: 65, requires: 'lab', producer: 'factory', icon: 'ϟ', desc: '科技兵种 · 范围电击' },
  artillery: { name: '破城自行火炮', faction: 'iron', cost: 850, time: 11, hp: 350, radius: 19, speed: 45, range: 430, minRange: 110, damage: 105, reload: 3.5, splash: 65, requires: 'lab', producer: 'factory', icon: '↗', desc: '远程范围炮击 · 怕近身' },
  sentinel: { name: '护盾卫士', faction: 'sky', cost: 350, time: 6, hp: 210, shield: 100, radius: 10, speed: 76, range: 215, damage: 24, reload: .8, antiAir: true, producer: 'barracks', icon: '⬡', desc: '能量护盾 · 可对空' },
  walker: { name: '星陨战斗机甲', faction: 'sky', cost: 1050, time: 13, hp: 800, shield: 150, radius: 20, speed: 70, range: 280, damage: 65, reload: 1.5, antiAir: true, requires: 'lab', producer: 'factory', icon: '♜', desc: '科技兵种 · 地空双用' },
  drone: { name: '蜂群攻击无人机', faction: 'sky', cost: 650, time: 8, hp: 260, radius: 15, speed: 155, flying: true, range: 190, damage: 24, reload: .7, antiAir: true, producer: 'airfield', icon: '✥', desc: '高速空战 · 地空双用' }
};
export const FACTIONS = {
  alliance: { name: '联邦同盟', color: '#78bdd2', motto: '情报先行，精准制胜', trait: '全军视野 +15%', countries: ['usa', 'germany'], units: ['sniper', 'laser', 'gunship'], ability: { name: '战地维修', cost: 400, cooldown: 60, desc: '点击地面，修复范围内的己方装甲与建筑', radius: 170 } },
  iron: { name: '钢铁联盟', color: '#dc9b77', motto: '钢铁洪流，火力压制', trait: '装甲单位生命 +12%', countries: ['russia', 'china'], units: ['heavy', 'tesla', 'artillery'], ability: { name: '火力压制', cost: 600, cooldown: 75, desc: '点击已探明地面，炮击范围内敌方地面单位', radius: 135 } },
  sky: { name: '天穹议会', color: '#b9a5ec', motto: '能量护盾，机甲突袭', trait: '建筑耗电 −20%', countries: ['japan', 'korea'], units: ['sentinel', 'walker', 'drone'], ability: { name: '应急能源', cost: 350, cooldown: 70, desc: '立即获得 30 秒额外 150 电力，并恢复己方护盾', instant: true } }
};
export const COUNTRIES = {
  usa: { name: '美国', faction: 'alliance', code: 'US', trait: '空中单位火力 +20%' },
  germany: { name: '德国', faction: 'alliance', code: 'DE', trait: '装甲单位生命 +18%' },
  russia: { name: '俄罗斯', faction: 'iron', code: 'RU', trait: '装甲单位火力 +15%' },
  china: { name: '中国', faction: 'iron', code: 'CN', trait: '单位生产时间 −18%' },
  japan: { name: '日本', faction: 'sky', code: 'JP', trait: '机甲、卫士与无人机速度 +20%' },
  korea: { name: '韩国', faction: 'sky', code: 'KR', trait: '作战单位射程 +12%' }
};
export const COMMON_UNITS = ['rifle', 'rocket', 'medic', 'engineer', 'tank', 'scout', 'antiair', 'harvester'];
export const DIFFICULTIES = { easy: { name: '轻松', firstWave: 90, interval: 60, count: -1 }, normal: { name: '标准', firstWave: 65, interval: 48, count: 0 }, hard: { name: '挑战', firstWave: 50, interval: 36, count: 2 } };
export const isInfantry = type => ['rifle', 'rocket', 'medic', 'engineer', 'sniper', 'sentinel'].includes(type);
export const isArmor = type => !!SPECS[type]?.speed && !isInfantry(type) && !SPECS[type].flying;
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export class Game {
  constructor({ country = 'usa', enemyCountry = 'russia', difficulty = 'normal' } = {}) {
    this.country = COUNTRIES[country] ? country : 'usa'; this.enemyCountry = COUNTRIES[enemyCountry] ? enemyCountry : 'russia'; this.faction = COUNTRIES[this.country].faction;
    this.difficulty = DIFFICULTIES[difficulty] ? difficulty : 'normal'; this.statCache = new Map(); this.navVersion = 0; this.abilityReadyAt = 0; this.energyUntil = 0;
    this.time = 0; this.credits = 2400; this.entities = []; this.nextId = 1; this.queue = []; this.effects = []; this.result = null; this.waveAt = DIFFICULTIES[this.difficulty].firstWave; this.wave = 0; this.events = [];
    this.ore = [{ x: 245, y: 1210, amount: 16000 }, { x: 900, y: 680, amount: 24000 }, { x: 1920, y: 190, amount: 16000 }];
    this.rocks = [{ x: 1060, y: 270, radius: 70 }, { x: 650, y: 350, radius: 95 }, { x: 1370, y: 1000, radius: 85 }, { x: 1620, y: 1300, radius: 70 }, { x: 720, y: 1320, radius: 60 }];
    this.add('hq', 'player', 410, 1020); this.add('power', 'player', 245, 930); this.add('refinery', 'player', 310, 1105); this.add('barracks', 'player', 555, 1080);
    this.add('harvester', 'player', 270, 1200); this.add('tank', 'player', 530, 930); this.add('tank', 'player', 575, 935); this.add('rifle', 'player', 520, 990); this.add('rifle', 'player', 548, 1000);
    this.add('hq', 'enemy', 1820, 350); this.add('power', 'enemy', 1960, 355); this.add('factory', 'enemy', 1700, 270); this.add('barracks', 'enemy', 1730, 440); this.add('turret', 'enemy', 1610, 430); this.add('turret', 'enemy', 1840, 515);
    this.add('tank', 'enemy', 1600, 570); this.add('tank', 'enemy', 1710, 590); this.add('rifle', 'enemy', 1780, 550); this.add('rifle', 'enemy', 1750, 560);
  }
  spec(type, team = 'player') {
    const country = team === 'player' ? this.country : this.enemyCountry, key = `${country}:${type}`;
    if (this.statCache.has(key)) return this.statCache.get(key);
    const s = { ...SPECS[type] }, faction = COUNTRIES[country].faction;
    s.sight = (s.sight || (s.speed ? 390 : 340)) * (faction === 'alliance' ? 1.15 : 1);
    if (faction === 'iron' && isArmor(type)) s.hp = Math.round(s.hp * 1.12);
    if (faction === 'sky' && s.powerUse) s.powerUse = Math.ceil(s.powerUse * .8);
    if (country === 'usa' && s.flying && s.damage) s.damage *= 1.2;
    if (country === 'germany' && isArmor(type)) s.hp = Math.round(s.hp * 1.18);
    if (country === 'russia' && isArmor(type) && s.damage) s.damage *= 1.15;
    if (country === 'china' && s.speed) s.time *= .82;
    if (country === 'japan' && ['walker', 'sentinel', 'drone'].includes(type)) s.speed *= 1.2;
    if (country === 'korea' && s.speed && s.range) s.range *= 1.12;
    this.statCache.set(key, s); return s;
  }
  availableUnits(team = 'player') { return [...COMMON_UNITS, ...FACTIONS[COUNTRIES[team === 'player' ? this.country : this.enemyCountry].faction].units]; }
  requirement(type, team = 'player') {
    const s = SPECS[type];
    if (!s || (s.speed && !this.availableUnits(team).includes(type))) return '此兵种不属于当前阵营';
    if (s.producer && !this.has(s.producer, team)) return `需要${SPECS[s.producer].name}`;
    if (s.requires && !this.has(s.requires, team)) return `需要${SPECS[s.requires].name}`;
    return '';
  }
  add(type, team, x, y, extra = {}) {
    const s = this.spec(type, team); const e = { id: this.nextId++, type, team, stats: s, x, y, hp: s.hp, maxHp: s.hp, shield: s.shield || 0, maxShield: s.shield || 0, lastHit: -10, radius: s.radius, building: !s.speed, cooldown: 0, angle: team === 'player' ? -.6 : 2.4, order: null, path: [], pathTarget: null, repath: 0, cargo: 0, ...extra };
    if (e.building) this.navVersion++;
    this.entities.push(e); return e;
  }
  get power() {
    const e = this.entities.filter(e => e.team === 'player' && e.building);
    return { supply: e.reduce((v, e) => v + (e.stats.power || 0), 0) + (this.energyUntil > this.time ? 150 : 0), used: e.reduce((v, e) => v + (e.stats.powerUse || 0), 0) };
  }
  has(type, team = 'player') { return this.entities.some(e => e.type === type && e.team === team && e.hp > 0); }
  notify(message) { this.events.push(message); }
  canBuild(type, x, y) {
    if (!SPECS[type] || SPECS[type].speed || type === 'hq' || this.result) return false;
    if (this.requirement(type)) return false;
    const r = SPECS[type].radius;
    return x > r + 10 && y > r + 10 && x < WORLD.width - r - 10 && y < WORLD.height - r - 10 && this.entities.some(e => e.team === 'player' && e.type === 'hq' && distance(e, { x, y }) < 470) && ![...this.entities.filter(e => e.building), ...this.rocks].some(e => distance(e, { x, y }) < e.radius + r + 25) && !this.ore.some(e => distance(e, { x, y }) < r + 75) && !this.queue.some(e => e.x !== undefined && distance(e, { x, y }) < SPECS[e.type].radius + r + 25);
  }
  build(type, x, y) {
    if (!this.canBuild(type, x, y)) return { ok: false, message: '请部署在基地范围内，避开建筑和矿区' };
    const s = this.spec(type); if (this.credits < s.cost) return { ok: false, message: '资金不足，等待矿车运回矿石' };
    this.credits -= s.cost; this.queue.push({ type, x, y, cost: s.cost, remaining: s.time, total: s.time }); return { ok: true };
  }
  train(type) {
    const s = this.spec(type); if (!s?.producer || this.result) return { ok: false, message: '无法生产此单位' };
    const missing = this.requirement(type); if (missing) return { ok: false, message: missing };
    const producer = this.entities.find(e => e.team === 'player' && e.type === s.producer);
    if (!producer) return { ok: false, message: `请先建造${SPECS[s.producer].name}` };
    if (this.queue.length >= 12) return { ok: false, message: '生产队列已满' };
    if (this.credits < s.cost) return { ok: false, message: '资金不足' };
    this.credits -= s.cost; this.queue.push({ type, producerId: producer.id, cost: s.cost, remaining: s.time, total: s.time }); return { ok: true };
  }
  command(ids, x, y, targetId = null, attackMove = false) {
    for (const e of this.entities.filter(e => ids.includes(e.id) && e.team === 'player' && !e.building)) {
      e.order = { x: clamp(x, 15, WORLD.width - 15), y: clamp(y, 15, WORLD.height - 15), targetId, attackMove };
      e.path = []; e.pathTarget = null; e.repath = 0;
    }
  }
  stop(ids) { for (const e of this.entities.filter(e => ids.includes(e.id) && e.team === 'player' && !e.building)) { e.order = null; e.path = []; } }
  visible(e) { return e.team === 'player' || this.entities.some(p => p.team === 'player' && distance(p, e) < p.stats.sight); }
  setRally(ids, x, y) { for (const e of this.entities) if (ids.includes(e.id) && e.team === 'player' && ['barracks', 'factory', 'airfield'].includes(e.type)) e.rally = { x: clamp(x, 20, WORLD.width - 20), y: clamp(y, 20, WORLD.height - 20), attackMove: true }; }
  useAbility(x, y) {
    const a = FACTIONS[this.faction].ability;
    if (this.result || !this.has('hq')) return { ok: false, message: '指挥中心不可用' };
    if (this.time < this.abilityReadyAt) return { ok: false, message: '支援技能冷却中' };
    if (this.credits < a.cost) return { ok: false, message: '支援资金不足' };
    if (!a.instant && (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0 || x > WORLD.width || y > WORLD.height || !this.visible({ team: 'enemy', x, y }))) return { ok: false, message: '请选择当前视野内的位置' };
    this.credits -= a.cost; this.abilityReadyAt = this.time + a.cooldown;
    if (this.faction === 'sky') { this.energyUntil = this.time + 30; for (const e of this.entities.filter(e => e.team === 'player')) e.shield = e.maxShield; }
    else for (const e of this.entities) {
      if (distance(e, { x, y }) > a.radius + e.radius) continue;
      if (this.faction === 'alliance' && e.team === 'player' && (e.building || isArmor(e.type))) e.hp = Math.min(e.maxHp, e.hp + 350);
      if (this.faction === 'iron' && e.team === 'enemy' && !e.stats.flying) this.hurt(e, 300);
    }
    if (!a.instant) this.effects.push({ kind: 'support', x, y, radius: a.radius, life: .8, maxLife: .8 });
    this.notify(`${a.name}已执行`); return { ok: true };
  }
  hurt(e, damage) { const absorbed = Math.min(e.shield, damage); e.shield -= absorbed; e.hp -= damage - absorbed; e.lastHit = this.time; }
  support(e, dt) {
    const requested = e.order?.targetId ? this.entities.find(t => t.id === e.order.targetId && t.hp > 0) : null;
    if (e.type === 'engineer' && requested?.team !== e.team && requested?.building && requested.type !== 'hq') {
      if (distance(e, requested) <= requested.radius + 50) { requested.team = e.team; requested.stats = this.spec(requested.type, e.team); requested.maxHp = requested.stats.hp; requested.hp = Math.min(requested.hp, requested.maxHp); requested.rally = null; e.hp = 0; this.notify(`工程师已占领${SPECS[requested.type].name}`); }
      else this.move(e, requested, dt);
      return true;
    }
    const valid = t => t.team === e.team && t.hp > 0 && (e.type === 'medic' ? isInfantry(t.type) : t.building);
    if (requested && valid(requested)) {
      if (distance(e, requested) > requested.radius + 95) this.move(e, requested, dt);
      else if (requested.hp < requested.maxHp) requested.hp = Math.min(requested.maxHp, requested.hp + e.stats.heal * dt);
      return true;
    }
    if (!e.order) {
      const t = this.entities.find(t => valid(t) && t.hp < t.maxHp && distance(e, t) < t.radius + 100);
      if (t) { t.hp = Math.min(t.maxHp, t.hp + e.stats.heal * dt); return true; }
    }
    return false;
  }
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
    if (e.stats.flying) { const d = distance(e, target), step = Math.min(d, e.stats.speed * dt); e.angle = Math.atan2(target.y - e.y, target.x - e.x); e.x += Math.cos(e.angle) * step; e.y += Math.sin(e.angle) * step; return; }
    e.repath -= dt;
    if (!e.pathTarget || e.pathVersion !== this.navVersion || (e.repath <= 0 && distance(e.pathTarget, target) > 40)) { e.path = this.findPath(e, target); e.pathTarget = { x: target.x, y: target.y }; e.pathVersion = this.navVersion; e.repath = 1; }
    const p = e.path[0]; if (!p) return;
    const d = distance(e, p), step = e.stats.speed * dt;
    e.angle = Math.atan2(p.y - e.y, p.x - e.x);
    if (d <= step + 2) { e.x = p.x; e.y = p.y; e.path.shift(); } else { e.x += Math.cos(e.angle) * step; e.y += Math.sin(e.angle) * step; }
  }
  harvest(e, dt) {
    const refinery = this.entities.filter(b => b.type === 'refinery' && b.team === e.team).sort((a, b) => distance(a, e) - distance(b, e))[0];
    if (!refinery) return;
    const availableOre = this.ore.filter(o => o.amount > 0).sort((a, b) => distance(a, e) - distance(b, e));
    if (e.cargo >= 300 || (!availableOre.length && e.cargo > 0)) {
      if (distance(e, refinery) < refinery.radius + 80) { this.credits += e.cargo; e.cargo = 0; e.path = []; e.pathTarget = null; e.repath = 0; }
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
      if (q.producerId && !this.entities.some(e => e.id === q.producerId && e.team === 'player')) { this.credits += q.cost; q.cancelled = true; continue; }
      q.remaining -= dt * productionRate;
      if (q.remaining <= 0) {
        if (q.x !== undefined) { this.add(q.type, 'player', q.x, q.y); if (q.type === 'refinery') this.add('harvester', 'player', q.x + 70, q.y + 70); }
        else { const p = this.entities.find(e => e.id === q.producerId); const unit = this.add(q.type, 'player', p.x + p.radius + 35, p.y + 30); if (p.rally) unit.order = { ...p.rally }; }
        this.notify(`${SPECS[q.type].name}已就绪`);
      }
    }
    this.queue = this.queue.filter(q => q.remaining > 0 && !q.cancelled);
    if (this.time >= this.waveAt && this.has('hq', 'enemy')) {
      this.wave++; this.waveAt += DIFFICULTIES[this.difficulty].interval; this.notify(`雷达警报：敌方第 ${this.wave} 波进攻`);
      const hq = this.entities.find(e => e.team === 'player' && e.type === 'hq');
      const specials = FACTIONS[COUNTRIES[this.enemyCountry].faction].units;
      const roster = ['tank', 'rifle', 'rocket', 'scout', ...(this.wave >= 2 ? specials.filter(t => !SPECS[t].flying) : []), ...(this.wave >= 4 ? specials.filter(t => SPECS[t].flying) : [])];
      if (hq) for (let i = 0; i < Math.min(2 + this.wave + DIFFICULTIES[this.difficulty].count, 10); i++) {
        const type = roster[(i + this.wave - 1) % roster.length], u = this.add(type, 'enemy', 1620 + i * 32, 600);
        u.order = { x: hq.x, y: hq.y, attackMove: true };
      }
    }
    for (const e of this.entities) {
      if (e.hp <= 0) continue;
      const s = e.stats; e.cooldown -= dt;
      if (e.maxShield && this.time - e.lastHit > 5) e.shield = Math.min(e.maxShield, e.shield + dt * 18);
      if (s.heal && this.support(e, dt)) continue;
      const explicit = e.order?.targetId ? this.entities.find(t => t.id === e.order.targetId && t.hp > 0 && t.team !== e.team) : null;
      if (e.order?.targetId && !explicit) { e.order = null; e.path = []; }
      let target = explicit;
      if (target?.stats.flying && !s.antiAir) target = null;
      if (!target && s.damage && (e.building || !e.order || e.order.attackMove || e.team === 'enemy')) {
        const search = e.building ? s.range : (e.order?.attackMove ? Math.max(340, s.range) : s.range);
        let nearest = Infinity;
        for (const t of this.entities) { if (t.team === e.team || t.hp <= 0 || (t.stats.flying && !s.antiAir)) continue; const d = distance(e, t); if (d <= search + t.radius && d < nearest) { target = t; nearest = d; } }
      }
      if (target && s.damage && (e.team !== 'player' || this.visible(target))) {
        const d = distance(e, target); e.angle = Math.atan2(target.y - e.y, target.x - e.x);
        if (s.minRange && d < s.minRange + target.radius && !e.building) { const a = Math.atan2(e.y - target.y, e.x - target.x); this.move(e, { x: clamp(e.x + Math.cos(a) * 130, 30, WORLD.width - 30), y: clamp(e.y + Math.sin(a) * 130, 30, WORLD.height - 30) }, dt); }
        else if (d <= s.range + target.radius) {
          if (e.cooldown <= 0 && (e.type !== 'turret' || e.team === 'enemy' || power.supply >= power.used)) {
            const damage = s.damage * (target.stats.flying ? (s.airBonus || 1) : (s.groundBonus || 1)) * (isArmor(target.type) ? (s.armorBonus || 1) : 1) * (isInfantry(target.type) ? (s.infantryBonus || 1) : 1);
            this.hurt(target, damage); e.cooldown = s.reload;
            if (s.splash) for (const other of this.entities) if (other.id !== target.id && other.team !== e.team && other.hp > 0 && !!other.stats.flying === !!target.stats.flying && distance(other, target) < s.splash + other.radius) this.hurt(other, damage * .55);
            this.effects.push({ kind: 'shot', x: e.x, y: e.y, tx: target.x, ty: target.y, team: e.team, life: .18, maxLife: .18 });
          }
        } else if (!e.building) this.move(e, target, dt);
      } else if (!e.building && e.order) {
        this.move(e, e.order, dt);
        if (distance(e, e.order) < (s.flying ? .01 : 12)) { e.order = null; e.path = []; }
      } else if (e.type === 'harvester') this.harvest(e, dt);
    }
    // Soft separation keeps squads readable without changing navigation obstacles.
    const units = this.entities.filter(e => !e.building && e.hp > 0);
    for (let i = 0; i < units.length; i++) for (let j = i + 1; j < units.length; j++) {
      const a = units[i], b = units[j], d = distance(a, b), min = a.radius + b.radius + 3;
      if (!!a.stats.flying !== !!b.stats.flying) continue;
      if (d < min) {
        const angle = d < .01 ? (a.id * 2.4) : Math.atan2(b.y - a.y, b.x - a.x), push = Math.min((min - d) * .5, 40 * dt);
        a.x -= Math.cos(angle) * push; a.y -= Math.sin(angle) * push; b.x += Math.cos(angle) * push; b.y += Math.sin(angle) * push;
      }
    }
    for (const e of this.entities.filter(e => e.hp <= 0)) {
      if (e.building) this.navVersion++;
      this.effects.push({ kind: 'explosion', x: e.x, y: e.y, radius: e.radius * 2, life: .65, maxLife: .65 });
      if (e.type === 'hq') this.result = e.team === 'enemy' ? 'victory' : 'defeat';
    }
    this.entities = this.entities.filter(e => e.hp > 0);
    for (const fx of this.effects) fx.life -= dt;
    this.effects = this.effects.filter(fx => fx.life > 0);
  }
}
