'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const api = require('../api');
const Engine = require('../lib/engine');
const { defaults } = require('../lib/config');
const { step } = require('./helpers');

function fixture(language) {
  const calls = [], homey = { i18n: { getLanguage: () => language } }, config = defaults();
  config.people.presence = ['resident'];
  config.people.notifications = ['resident'];
  config.routines.find(routine => routine.id === 'away').actions = [step('fixed-extra', { kind: 'notify', text: 'Alarmen er avstilt.' })];
  config.routines.push({ id: 'custom-literal', name: 'Velkomstlys', enabled: true, execution: 'sequential', actions: [step('custom-extra', { kind: 'notify', text: 'Målenheten mangler' })] });
  config.environment.responses.fire.text = 'Ring Brann, {sensorName}';
  const catalog = {
    people: { resident: { id: 'resident', name: 'Personer', athomId: 'account', available: true } },
    devices: { sensor: { id: 'sensor', name: 'Ukjent sone', zone: 'Brann', available: true, capabilities: { alarm_contact: { value: false, type: 'boolean' } } } },
    flows: [{ id: 'flow', name: 'Velkomstlys', type: 'normal', enabled: true, triggerable: true }], zones: {}, errors: ['Personer: Homey er ikke tilkoblet.'],
  };
  const adapter = {
    homey, catalogue: catalog, direct: { status: () => ({ configured: false, ready: false, problem: 'Ingen API-nøkkel er lagt inn.' }) },
    catalog: async () => { calls.push(['catalog']); return catalog; },
    snapshot: async () => { calls.push(['snapshot']); return structuredClone(engine.snapshot); },
  };
  const engine = new Engine({ config, adapter });
  engine.snapshot = { connected: true, people: { resident: { id: 'resident', name: 'Personer', present: true, asleep: false, available: true, observedAt: Date.now() } }, devices: catalog.devices };
  engine.state.mode = 'home'; engine.state.reason = 'Minst én valgt person er hjemme';
  const app = {
    adapter, engine,
    saveConfig: async body => { calls.push(['saveConfig', structuredClone(body)]); return body; },
    configureApiKey: async body => { calls.push(['configureApiKey', structuredClone(body)]); return adapter.direct.status(); },
  };
  homey.app = app;
  return { homey, app, engine, catalog, calls };
}

for (const [language, expected] of [
  ['en', { reason: 'At least one selected resident is home', people: 'People', unavailable: 'People: Homey is not connected.', away: 'Last person leaves', key: 'No API key has been entered.' }],
  ['no', { reason: 'Minst én valgt person er hjemme', people: 'Personer', unavailable: 'Personer: Homey er ikke tilkoblet.', away: 'Siste Person forlater', key: 'Ingen API-nøkkel er lagt inn.' }],
]) {
  test(`API state is readable in ${language} without translating saved settings or user values`, async () => {
    const h = fixture(language), before = structuredClone(h.engine.config), result = await api.getState({ homey: h.homey });
    assert.equal(result.status.reason, expected.reason);
    assert.equal(result.readiness.checks.find(check => check.id === 'people').title, expected.people);
    assert.equal(result.catalog.errors[0], expected.unavailable);
    assert.equal(result.direct.problem, expected.key);
    assert.equal(result.catalog.people.resident.name, 'Personer');
    assert.equal(result.catalog.devices.sensor.name, 'Ukjent sone'); assert.equal(result.catalog.devices.sensor.zone, 'Brann');
    assert.equal(result.catalog.flows[0].name, 'Velkomstlys');
    assert.deepEqual(result.config, before); assert.deepEqual(h.engine.config, before);
    result.config.environment.responses.fire.text = 'Changed response';
    assert.equal(h.engine.config.environment.responses.fire.text, 'Ring Brann, {sensorName}');
    assert.deepEqual(h.calls, []);
  });

  test(`API validation and save return original custom settings in ${language}`, async () => {
    const h = fixture(language), source = structuredClone(h.engine.config), validated = await api.validateConfig({ homey: h.homey, body: source });
    assert.equal(validated.routines.find(routine => routine.id === 'custom-literal').name, 'Velkomstlys');
    assert.equal(validated.routines.find(routine => routine.id === 'custom-literal').actions[0].text, 'Målenheten mangler');
    assert.equal(validated.security.responses.alarm.text, 'Innbruddsalarm i {zone}: {reason}');
    assert.equal(validated.environment.responses.fire.text, 'Ring Brann, {sensorName}');
    const saved = await api.saveConfig({ homey: h.homey, body: validated });
    assert.deepEqual(saved, validated); assert.deepEqual(h.calls, [['saveConfig', validated]]);
  });

  test(`API catalog translates application error prefixes in ${language} while keeping household names`, async () => {
    const h = fixture(language), source = structuredClone(h.catalog), catalog = await api.getCatalog({ homey: h.homey });
    assert.equal(catalog.errors[0], expected.unavailable);
    assert.deepEqual(catalog.people, source.people); assert.deepEqual(catalog.devices, source.devices); assert.deepEqual(catalog.flows, source.flows);
    assert.deepEqual(h.catalog, source); assert.deepEqual(h.calls, [['catalog']]);
  });

  test(`API preview distinguishes fixed and custom routine names in ${language} without running routines`, async () => {
    const h = fixture(language), source = structuredClone(h.engine.config);
    const fixed = await api.previewRoutine({ homey: h.homey, body: { id: 'away' } });
    const custom = await api.previewRoutine({ homey: h.homey, body: { id: 'custom-literal' } });
    assert.equal(fixed.name, expected.away); assert.equal(custom.name, 'Velkomstlys');
    assert.equal(fixed.actions.find(action => action.id === 'fixed-extra').text, 'Alarmen er avstilt.');
    assert.equal(custom.actions.find(action => action.id === 'custom-extra').text, 'Målenheten mangler');
    assert.match(fixed.note, language === 'en' ? /No routine has started/ : /Ingen rutine er startet/);
    assert.deepEqual(h.engine.config, source); assert.equal(h.engine.runs.length, 0);
    assert.deepEqual(h.calls, [['snapshot'], ['snapshot']]);
  });

  test(`API command returns ${language} status with exact dispatch arguments and custom payload`, async () => {
    const h = fixture(language), source = { reason: 'Minst én valgt person er hjemme', people: { resident: { name: 'Personer' } }, pending: [{ routineId: 'custom-literal', actions: [{ text: 'Målenheten mangler', error: 'Målenheten mangler' }] }] };
    h.app.setGuestMode = async value => h.calls.push(['guest', value]); h.engine.status = () => source;
    const result = await api.command({ homey: h.homey, body: { type: 'guest', value: true } });
    assert.equal(result.reason, expected.reason); assert.equal(result.people.resident.name, 'Personer');
    assert.equal(result.pending[0].actions[0].text, 'Målenheten mangler');
    assert.equal(result.pending[0].actions[0].error, language === 'en' ? 'The target device is missing' : 'Målenheten mangler');
    assert.deepEqual(h.calls, [['guest', true]]); assert.equal(source.reason, 'Minst én valgt person er hjemme');
  });

  test(`API errors from commands and concurrent settings writes are localized in ${language} without changing error metadata`, async () => {
    const h = fixture(language), original = Object.assign(Error('Slå av gjestemodus før du starter nattmodus. Gjester holder huset hjemme og alarmen frakoblet.'), { code: 'GUEST_ACTIVE', statusCode: 409 });
    h.engine.manual = async mode => { h.calls.push(['manual', mode]); throw original; };
    await assert.rejects(api.command({ homey: h.homey, body: { type: 'mode', mode: 'night' } }), error => {
      assert.match(error.message, language === 'en' ? /^Turn guest mode off before/ : /^Slå av gjestemodus før/);
      assert.equal(error.code, 'GUEST_ACTIVE'); assert.equal(error.statusCode, 409); return true;
    });
    assert.match(original.message, /^Slå av gjestemodus før/); assert.deepEqual(h.calls, [['manual', 'night']]);
    await assert.rejects(api.saveConfig({ homey: h.homey, body: { revision: h.engine.config.revision + 1 } }), error => {
      assert.match(error.message, language === 'en' ? /^Settings changed in another view/ : /^Oppsettet er endret i en annen visning/); return true;
    });
    assert.deepEqual(h.calls, [['manual', 'night']]);
  });

  test(`API explains a deleted built-in routine by its translated fixed name in ${language}`, async () => {
    const h = fixture(language), source = structuredClone(h.engine.config), missing = structuredClone(source);
    missing.routines = missing.routines.filter(routine => routine.id !== 'morning');
    await assert.rejects(api.validateConfig({ homey: h.homey, body: missing }), error => {
      assert.match(error.message, language === 'en' ? /The built-in routine “Night mode deactivation” cannot be deleted/ : /Den faste rutinen «Deaktivering av Nattmodus» kan ikke slettes/);
      assert.equal(error.code, 'BUILTIN_ROUTINE_REQUIRED'); assert.equal(error.routineId, 'morning'); return true;
    });
    assert.deepEqual(h.engine.config, source); assert.deepEqual(h.calls, []);
    const customRemoved = structuredClone(source);
    customRemoved.routines = customRemoved.routines.filter(routine => routine.id !== 'custom-literal');
    const valid = await api.validateConfig({ homey: h.homey, body: customRemoved });
    assert(valid.routines.some(routine => routine.id === 'morning'));
    assert(!valid.routines.some(routine => routine.id === 'custom-literal'));
    assert.deepEqual(h.calls, []);
  });
}

test('API key check exposes localized connection status and retains check arguments', async () => {
  const h = fixture('en'), result = await api.saveApiKey({ homey: h.homey, body: { check: true } });
  assert.equal(result.problem, 'No API key has been entered.');
  assert.equal(Object.keys(result).sort().join(','), 'configured,problem,ready');
  assert.deepEqual(h.calls, [['configureApiKey', { check: true }]]);
});
