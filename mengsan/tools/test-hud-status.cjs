const { test } = require('node:test');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const moduleAt = name => import(pathToFileURL(path.join(__dirname, '..', name)).href)
  .catch(error => { if (error.code === 'ERR_MODULE_NOT_FOUND') return {}; throw error; });

test('HUD reads strength, duration and charges without changing combat storage', async () => {
  const { collectCombatStatuses } = await moduleAt('ui/hud/status-model.js');
  assert.equal(typeof collectCombatStatuses, 'function');
  const player = { storage: { mengsanStrength_shuying: 3, mengsanSetupStrength_shuying: 2,
    mengsanVulnerable_shuying: 2, mengsanArtifact_shuying: 1, mengsanRinging_shuying: true, mengsanRingingUsed_shuying: 1 } };
  const before = structuredClone(player.storage);
  const statuses = collectCombatStatuses(player, { session: { active: true } });
  assert.equal(statuses.find(s => s.id === 'strength').value, 5);
  assert.equal(statuses.find(s => s.id === 'vulnerable').unit, '回合');
  assert.equal(statuses.find(s => s.id === 'artifact').unit, '次');
  assert.match(statuses.find(s => s.id === 'ringing').detail, /响应/);
  assert.deepEqual(player.storage, before);
});

test('private effect snapshots show signed strength and separate countdown instances', async () => {
  const { collectCombatStatuses } = await moduleAt('ui/hud/status-model.js');
  const { bindCombatStatusSource } = await moduleAt('battle/status-sources.js');
  assert.equal(typeof bindCombatStatusSource, 'function');
  const releases = [], session = { active: true, ownResource: (_, release) => releases.push(release) };
  const player = { storage: { mengsanStrength_shuying: 2 } };
  const state = { powers: { barricade: true, vulnerableDraw: 2 }, negativeStrength: 5,
    bombs: [{ turns: 1, damage: 40 }, { turns: 3, damage: 50 }] };
  bindCombatStatusSource(player, session, 'shared', () => state);
  const result = collectCombatStatuses(player, { session });
  assert.equal(result.find(s => s.id === 'strength').value, -3);
  assert.equal(result.find(s => s.name === '凶恶').value, 2);
  assert.deepEqual(result.filter(s => s.name === '炸弹').map(s => s.value), [1, 3]);
  result.find(s => s.id === 'strength').value = 99;
  assert.equal(player.storage.mengsanStrength_shuying, 2);
  releases.forEach(release => release());
  assert.equal(collectCombatStatuses(player, { session }).filter(s => s.name === '炸弹').length, 0);
});

test('old session release does not remove a new battle status source', async () => {
  const { bindCombatStatusSource, readCombatStatusSources } = await moduleAt('battle/status-sources.js');
  assert.equal(typeof bindCombatStatusSource, 'function');
  let releaseOld;
  const old = { active: true, ownResource: (_, release) => { releaseOld = release; } };
  const next = { active: true, ownResource() {} }, player = {};
  bindCombatStatusSource(player, old, 'cards', () => ({ vigor: 2 }));
  bindCombatStatusSource(player, next, 'cards', () => ({ vigor: 7 }));
  releaseOld();
  assert.equal(readCombatStatusSources(player, next)[0].state.vigor, 7);
  assert.equal(readCombatStatusSources(player, old).length, 0);
});

test('slow display uses layers as well as the current card counter', async () => {
  const { collectCombatStatuses } = await moduleAt('ui/hud/status-model.js');
  const player={storage:{mengsanSlow_shuying:3,mengsanSlowCards_shuying:2},hasSkill:id=>id==='mengsan_slow_shuying'};
  assert.equal(collectCombatStatuses(player,{session:{active:true}}).find(s=>s.id==='slow').value,60);
});
