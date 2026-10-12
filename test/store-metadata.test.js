'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { createRequire } = require('node:module');
const manifest = require('../app.json');

function generate() {
  const filename = path.resolve(__dirname, '../scripts/manifest.js'), localRequire = createRequire(filename);
  let result;
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {
    require: id => id === 'node:fs' ? { writeFileSync: (file, text) => { assert.equal(file, 'app.json'); result = JSON.parse(text); } } : localRequire(id),
  }, { filename });
  return result;
}

test('Store readmes are short localized product summaries, without setup/testing dumps or markup', () => {
  for (const filename of ['README.txt', 'README.no.txt']) {
    const text = fs.readFileSync(path.resolve(__dirname, '..', filename), 'utf8').trim();
    assert.equal(text.split(/\r?\n\s*\r?\n/).length, 2, filename);
    assert(text.split(/\s+/).length <= 120, filename);
    assert(!/(https?:|^#|\]\(|`|API[- ]|test release|testversjon|settings interface is currently)/im.test(text), filename);
  }
});

test('Every Flow argument appears in the formatted sentence in English and Norwegian', () => {
  for (const cards of Object.values(manifest.flow)) for (const card of cards) {
    if (!card.args?.length) continue;
    for (const language of ['en', 'no']) {
      const sentence = card.titleFormatted?.[language];
      assert.equal(typeof sentence, 'string', `${card.id}: ${language}`);
      const placeholders = [...sentence.matchAll(/\[\[([^\]]+)\]\]/g)].map(match => match[1]);
      assert.deepEqual([...new Set(placeholders)].sort(), card.args.map(arg => arg.name).sort(), `${card.id}: ${language}`);
      if (!card.deprecated) assert(!sentence.includes(':') && !sentence.includes(' · '), `${card.id} must integrate arguments in a sentence`);
      for (const arg of card.args) {
        if (arg.title) assert.equal(typeof arg.title[language], 'string', `${card.id}.${arg.name}: ${language}`);
        for (const value of arg.values || []) assert.equal(typeof value.title[language], 'string', `${card.id}.${arg.name}.${value.id}: ${language}`);
      }
    }
  }
});

test('Fire/water source definitions contain formatted titles and the generator preserves them', () => {
  const definitions = require('../lib/environment-flows').definitions(), generated = generate();
  for (const [type, cards] of Object.entries(definitions)) for (const card of cards) {
    assert(card.titleFormatted.en.includes('[[type]]'), card.id);
    assert(card.titleFormatted.no.includes('[[type]]'), card.id);
    assert.deepEqual(generated.flow[type].find(actual => actual.id === card.id).titleFormatted, card.titleFormatted);
    assert.deepEqual(manifest.flow[type].find(actual => actual.id === card.id).titleFormatted, card.titleFormatted);
  }
  const condition = manifest.flow.conditions.find(card => card.id === 'environment_alarm_active');
  assert.equal(condition.titleFormatted.en, 'A [[type]] alarm is !{{active|inactive}}');
  assert.equal(condition.titleFormatted.no, '[[type]]alarm er !{{aktiv|inaktiv}}');
});

test('Generating the manifest preserves the complete installed routes, drivers, capabilities and Flow schema', () => {
  assert.deepEqual(generate(), manifest);
  assert.deepEqual(manifest.contributors.developers, [{ name: 'Finn-Cato' }]);
  assert.deepEqual(manifest.api.appApiAccess, { method: 'GET', path: '/api-access' });
  assert.deepEqual(manifest.drivers.map(driver => driver.id).sort(), ['alarm-panel', 'guest-mode', 'night-mode']);
});
