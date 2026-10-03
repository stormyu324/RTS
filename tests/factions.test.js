import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, COUNTRIES, FACTIONS, SPECS, distance } from '../engine.js';

const advance = (g, seconds) => { for (let i = 0; i < seconds * 10; i++) g.update(.1); };
test('六个国家有正确阵营及各自的特色生产名单', () => {
  assert.equal(Object.keys(COUNTRIES).length, 6);
  for (const country of Object.keys(COUNTRIES)) {
    const g = new Game({ country }); assert.equal(g.faction, COUNTRIES[country].faction);
    assert.equal(g.availableUnits().length, 11);
    for (const type of FACTIONS[g.faction].units) assert.ok(g.availableUnits().includes(type));
    for (const [id, f] of Object.entries(FACTIONS)) if (id !== g.faction) for (const type of f.units) assert.equal(g.availableUnits().includes(type), false);
  }
});
test('国家加成实际改变生命、伤害、生产时间、速度与射程', () => {
  assert.equal(new Game({ country: 'usa' }).spec('gunship').damage, SPECS.gunship.damage * 1.2);
  assert.equal(new Game({ country: 'germany' }).spec('tank').hp, Math.round(SPECS.tank.hp * 1.18));
  assert.equal(new Game({ country: 'russia' }).spec('tank').damage, SPECS.tank.damage * 1.15);
  assert.equal(new Game({ country: 'china' }).spec('rifle').time, SPECS.rifle.time * .82);
  assert.equal(new Game({ country: 'japan' }).spec('walker').speed, SPECS.walker.speed * 1.2);
  assert.equal(new Game({ country: 'korea' }).spec('sentinel').range, SPECS.sentinel.range * 1.12);
  assert.equal(new Game({ country: 'korea' }).power.used, 48);
  assert.equal(new Game({ country: 'china' }).spec('tank').hp, Math.round(SPECS.tank.hp * 1.12));
});
test('科技和阵营限制不能绕过，正确解锁后可完成生产', () => {
  const g = new Game(); g.credits = 10000;
  assert.equal(g.canBuild('lab', 650, 780), false);
  g.add('factory', 'player', 720, 1050);
  const credits = g.credits;
  assert.equal(g.train('laser').ok, false); assert.equal(g.train('heavy').ok, false); assert.equal(g.train('gunship').ok, false); assert.equal(g.credits, credits);
  g.add('lab', 'player', 650, 780); g.add('airfield', 'player', 200, 1040); g.add('power', 'player', 400, 1250);
  assert.equal(g.train('laser').ok, true); assert.equal(g.train('gunship').ok, true); advance(g, 13);
  assert.ok(g.entities.some(e => e.team === 'player' && e.type === 'laser')); assert.ok(g.entities.some(e => e.team === 'player' && e.type === 'gunship'));
});
test('空中单位越过岩石而不执行地面寻路', () => {
  const g = new Game(); const u = g.add('gunship', 'player', 500, 350); let paths = 0;
  const original = g.findPath.bind(g); g.findPath = (...args) => { paths++; return original(...args); };
  g.command([u.id], 800, 350); advance(g, 3); assert.ok(distance(u, { x: 800, y: 350 }) < 1); assert.equal(paths, 0);
});
test('地面坦克无法射击空中单位，防空车可以击落空军', () => {
  const g = new Game({ enemyCountry: 'japan' }); g.entities = [];
  const tank = g.add('tank', 'player', 500, 500), drone = g.add('drone', 'enemy', 660, 500);
  g.command([tank.id], drone.x, drone.y, drone.id); advance(g, 2); assert.equal(drone.hp, drone.maxHp);
  g.add('antiair', 'player', 520, 530); advance(g, 4); assert.ok(drone.hp < drone.maxHp);
});
test('护盾先吸收伤害，脱战后恢复，生命不凭空恢复', () => {
  const g = new Game({ country: 'japan' }), u = g.add('sentinel', 'player', 800, 1200);
  g.hurt(u, 60); assert.equal(u.hp, u.maxHp); assert.equal(u.shield, 40);
  g.hurt(u, 100); assert.equal(u.hp, u.maxHp - 60); assert.equal(u.shield, 0);
  advance(g, 6); assert.ok(u.shield > 0); assert.equal(u.hp, u.maxHp - 60);
});
test('医疗兵治疗步兵，工程师维修建筑并占领敌方炮塔', () => {
  const g = new Game(); const rifle = g.add('rifle', 'player', 700, 1100); rifle.hp = 40;
  g.add('medic', 'player', 705, 1100); advance(g, 2); assert.ok(rifle.hp > 40);
  const hq = g.entities.find(e => e.team === 'player' && e.type === 'hq'); hq.hp -= 200;
  g.add('engineer', 'player', hq.x + 65, hq.y); advance(g, 2); assert.ok(hq.hp > hq.maxHp - 200);
  const turret = g.add('turret', 'enemy', 800, 1100), engineer = g.add('engineer', 'player', 770, 1100);
  g.command([engineer.id], turret.x, turret.y, turret.id); g.update(.1); assert.equal(turret.team, 'player'); assert.equal(g.entities.some(e => e.id === engineer.id), false);
});
test('工程师无法占领指挥中心', () => {
  const g = new Game(), hq = g.entities.find(e => e.team === 'enemy' && e.type === 'hq');
  const u = g.add('engineer', 'player', hq.x - 65, hq.y); g.command([u.id], hq.x, hq.y, hq.id); g.update(.1);
  assert.equal(hq.team, 'enemy'); assert.equal(g.result, null);
});
test('战地维修有区域效果、扣款和冷却，远处迷雾内不能使用', () => {
  const g = new Game(), tank = g.entities.find(e => e.team === 'player' && e.type === 'tank'); tank.hp = 250;
  assert.equal(g.useAbility(2000, 1400).ok, false); assert.equal(g.credits, 2400);
  assert.equal(g.useAbility(tank.x, tank.y).ok, true); assert.equal(tank.hp, 600); assert.equal(g.credits, 2000);
  assert.equal(g.useAbility(tank.x, tank.y).ok, false);
});
test('火力压制伤害敌军，不误伤我军；能源技能有持续时间', () => {
  const g = new Game({ country: 'russia' }), t = g.add('tank', 'enemy', 600, 990), friendly = g.entities.find(e => e.team === 'player' && e.type === 'tank');
  assert.equal(g.useAbility(t.x, t.y).ok, true); assert.equal(t.hp, t.maxHp - 300); assert.equal(friendly.hp, friendly.maxHp);
  const sky = new Game({ country: 'japan' }), sentinel = sky.add('sentinel', 'player', 700, 1200); sentinel.shield = 0;
  assert.equal(sky.useAbility().ok, true); assert.equal(sky.power.supply, 250); assert.equal(sentinel.shield, sentinel.maxShield); advance(sky, 31); assert.equal(sky.power.supply, 100);
});
test('生产集结点赋予新单位进攻移动指令', () => {
  const g = new Game(), barracks = g.entities.find(e => e.team === 'player' && e.type === 'barracks');
  g.setRally([barracks.id], 800, 900); g.train('rifle'); advance(g, 4.1);
  const u = g.entities.filter(e => e.team === 'player' && e.type === 'rifle').at(-1); assert.equal(u.order.x, 800); assert.equal(u.order.attackMove, true);
});
test('中国加速生产真正提前交付；敌方国家决定增援兵种', () => {
  const g = new Game({ country: 'china', enemyCountry: 'japan' }); const before = g.entities.length; g.train('rifle'); advance(g, 3.4); assert.equal(g.entities.length, before + 1);
  g.time = 209; g.wave = 3; g.waveAt = 209; g.update(.1); assert.ok(g.entities.some(e => e.team === 'enemy' && e.type === 'drone'));
});
test('轻松难度延后首波进攻，挑战难度提前进攻', () => {
  const easy = new Game({ difficulty: 'easy' }); advance(easy, 66); assert.equal(easy.wave, 0);
  const hard = new Game({ difficulty: 'hard' }); advance(hard, 50.2); assert.equal(hard.wave, 1);
});
