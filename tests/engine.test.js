import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, distance } from '../engine.js';

function advance(game, seconds) { for (let i = 0; i < seconds * 10; i++) game.update(.1); }

test('采矿车实际采集矿石并增加资金', () => {
  const g = new Game(), initial = g.credits, ore = g.ore[0].amount;
  advance(g, 20);
  assert.ok(g.credits > initial); assert.ok(g.ore[0].amount < ore);
});
test('部署校验、扣款、施工完成和战车生产', () => {
  const g = new Game();
  assert.equal(g.build('factory', 410, 1020).ok, false);
  assert.equal(g.build('factory', 1900, 1300).ok, false);
  assert.equal(g.train('tank').ok, false);
  assert.equal(g.build('factory', 720, 1050).ok, true);
  assert.equal(g.credits, 1200); advance(g, 17);
  assert.equal(g.has('factory'), true);
  assert.equal(g.train('tank').ok, true); advance(g, 10);
  assert.equal(g.entities.filter(e => e.type === 'tank' && e.team === 'player').length, 3);
});
test('同一建筑逐个生产，不同时完成整个队列', () => {
  const g = new Game(), before = g.entities.filter(e => e.type === 'rifle' && e.team === 'player').length;
  g.train('rifle'); g.train('rifle'); advance(g, 4.1);
  assert.equal(g.entities.filter(e => e.type === 'rifle' && e.team === 'player').length, before + 1);
  assert.equal(g.queue.length, 1); advance(g, 4.1); assert.equal(g.queue.length, 0);
});
test('电力不足会降低生产速度', () => {
  const g = new Game(); g.entities = g.entities.filter(e => e.type !== 'power' || e.team !== 'player');
  g.train('rifle'); advance(g, 5); assert.equal(g.queue.length, 1); advance(g, 5.2); assert.equal(g.queue.length, 0);
});
test('建筑被摧毁后退回未完成的单位生产费用', () => {
  const g = new Game(), credits = g.credits; g.train('rifle');
  g.entities = g.entities.filter(e => !(e.team === 'player' && e.type === 'barracks'));
  g.update(.1); assert.equal(g.queue.length, 0); assert.equal(g.credits, credits);
});
test('寻路绕过岩石到达目标', () => {
  const g = new Game(); const tank = g.entities.find(e => e.team === 'player' && e.type === 'tank');
  tank.x = 500; tank.y = 350; g.command([tank.id], 800, 350); advance(g, 15);
  assert.ok(distance(tank, { x: 800, y: 350 }) < 20, `单位未到达：${tank.x},${tank.y}`);
  assert.ok(distance(tank, g.rocks[1]) > g.rocks[1].radius + tank.radius);
});
test('敌人脱离视野隐藏，进入视野后可见', () => {
  const g = new Game(), enemy = g.entities.find(e => e.team === 'enemy' && e.type === 'hq');
  assert.equal(g.visible(enemy), false); g.add('rifle', 'player', enemy.x - 200, enemy.y); assert.equal(g.visible(enemy), true);
});
test('指定目标攻击摧毁敌方指挥中心并触发胜利', () => {
  const g = new Game(), hq = g.entities.find(e => e.type === 'hq' && e.team === 'enemy');
  hq.hp = 90; g.entities = g.entities.filter(e => e.team === 'player' || e.id === hq.id);
  const tank = g.add('tank', 'player', hq.x - 150, hq.y); g.command([tank.id], hq.x, hq.y, hq.id);
  advance(g, 4); assert.equal(g.result, 'victory');
});
test('敌方 AI 生成波次并攻击基地', () => {
  const g = new Game(); advance(g, 65.2);
  assert.equal(g.wave, 1); assert.ok(g.entities.some(e => e.team === 'enemy' && e.order?.attackMove));
  advance(g, 20);
  assert.ok(g.entities.some(e => e.team === 'enemy' && !e.building && e.x < 1400));
});
test('我方指挥中心被毁后失败，结算冻结模拟', () => {
  const g = new Game(); g.entities.find(e => e.type === 'hq' && e.team === 'player').hp = 0;
  g.update(.1); assert.equal(g.result, 'defeat'); const time = g.time; g.update(.1); assert.equal(g.time, time);
});
