'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { defaults, validate, LUX_MAX_AGE_SECONDS } = require('../lib/config');
const { harness, add, step } = require('./helpers');
const HOUR = 3600000;
const lightFlow = (fields = {}) => step('morning-lights', {
  kind: 'flow', flowId: 'lights-on', flowType: 'normal', category: 'lights',
  condition: { deviceId: 'lux', capability: 'measure_luminance', operator: 'lt', value: 15, maxAgeSeconds: LUX_MAX_AGE_SECONDS }, ...fields,
});
test('Existing morning lux conditions are upgraded once, preserving all other routine choices', () => {
  const old = defaults(); delete old.morning.luxAgeVersion; old.revision = 200;
  const condition = { ...lightFlow().condition, maxAgeSeconds: 600 };
  add(old, 'morning', [lightFlow({ condition, delaySeconds: 5, onError: 'continue' }), lightFlow({ id: 'morning-temperature', condition: { ...condition, capability: 'measure_temperature' } })]);
  add(old, 'home', [lightFlow({ condition: { ...condition } })]);
  const before = structuredClone(old), expected = structuredClone(old);
  expected.morning.luxAgeVersion = 1;
  expected.routines.find(r => r.id === 'morning').actions[0].condition.maxAgeSeconds = 259200;
  const next = validate(old);
  assert.deepEqual(old, before); assert.deepEqual(next, expected); assert.deepEqual(validate(next), next);
  const custom = structuredClone(next); custom.routines.find(r => r.id === 'morning').actions[0].condition.maxAgeSeconds = 1800;
  assert.equal(validate(custom).routines.find(r => r.id === 'morning').actions[0].condition.maxAgeSeconds, 1800);
});
test('The 72-hour age limit supports instanced lux capabilities but does not relax other numeric conditions', () => {
  for (const capability of ['measure_luminance', 'measure_luminance.1']) {
    const c = defaults(); add(c, 'morning', [lightFlow({ condition: { ...lightFlow().condition, capability } })]);
    assert.doesNotThrow(() => validate(c));
    c.routines.find(r => r.id === 'morning').actions[0].condition.maxAgeSeconds++;
    assert.throws(() => validate(c), /maksimale alder/);
  }
  const c = defaults(); add(c, 'morning', [lightFlow({ condition: { ...lightFlow().condition, capability: 'measure_temperature' } })]);
  assert.throws(() => validate(c), /maksimale alder/); assert.equal(c.freshnessSeconds, 120); assert.equal(c.welcome.maxAgeSeconds, 600);
});
test('Old imports do not hide invalid lux age values during the one-time update', () => {
  for (const maxAgeSeconds of [0, -1, '600', null]) {
    const c = defaults(); delete c.morning.luxAgeVersion;
    add(c, 'morning', [lightFlow({ condition: { ...lightFlow().condition, maxAgeSeconds } })]);
    assert.throws(() => validate(c), /maksimale alder/);
  }
});
for (const [label, lux, age, expected] of [
  ['36-hour reading', 10, 36 * HOUR, true],
  ['exactly 72 hours', 10, 72 * HOUR, true],
  ['older than 72 hours', 10, 72 * HOUR + 1, false],
  ['fresh bright reading', 20, 0, false],
  ['old bright reading', 20, 36 * HOUR, false],
  ['at the lux threshold', 15, 0, false],
  ['unknown reading', null, 0, false],
  ['future timestamp', 10, -1000, false],
]) test('Morning light Flow: ' + label, async () => {
  const h = harness(c => { c.people.night = []; add(c, 'morning', [lightFlow()]); });
  h.device('lux', 'measure_luminance', lux, h.now() - age); h.ingest();
  h.engine.morning('manual'); await h.engine.tick();
  assert.deepEqual(h.calls.filter(call => call[0] === 'flow'), expected ? [['flow', 'lights-on', 'normal']] : []);
});
test('An old saved morning rule actually starts the light Flow with a 36-hour lux reading', async () => {
  const h = harness(c => { delete c.morning.luxAgeVersion; c.people.night = []; add(c, 'morning', [lightFlow({ condition: { ...lightFlow().condition, maxAgeSeconds: 600 } })]); });
  assert.equal(h.config.routines.find(r => r.id === 'morning').actions[0].condition.maxAgeSeconds, 259200);
  h.device('lux', 'measure_luminance', 10, h.now() - 36 * HOUR); h.ingest(); h.engine.morning('manual'); await h.engine.tick();
  assert.deepEqual(h.calls.filter(call => call[0] === 'flow'), [['flow', 'lights-on', 'normal']]);
});
test('Unavailable sensors and missing timestamps still stop the morning light Flow', async () => {
  for (const scenario of ['unavailable', 'missing-timestamp']) {
    const h = harness(c => { c.people.night = []; add(c, 'morning', [lightFlow()]); });
    h.device('lux', 'measure_luminance', 10);
    if (scenario === 'unavailable') h.snapshot.devices.lux.available = false;
    else delete h.snapshot.devices.lux.capabilities.measure_luminance.updatedAt;
    h.ingest(); h.engine.morning('manual'); await h.engine.tick();
    assert.equal(h.calls.filter(call => call[0] === 'flow').length, 0);
  }
});
test('A fresh bright value received while the light Flow is waiting still prevents lighting', async () => {
  const h = harness(c => { c.people.night = []; add(c, 'morning', [lightFlow({ delaySeconds: 5 })]); });
  h.device('lux', 'measure_luminance', 10, h.now() - 36 * HOUR); h.ingest(); h.engine.morning('manual');
  h.advance(5000); h.device('lux', 'measure_luminance', 20); h.ingest(); await h.engine.tick();
  assert.equal(h.calls.filter(call => call[0] === 'flow').length, 0);
});
