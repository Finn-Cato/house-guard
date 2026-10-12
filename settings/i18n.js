'use strict';
// UI translation is explicit: only catalog keys and annotated static markup
// are translated. Catalog names, IDs and user-authored text are never scanned.
(function(root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./translations'));
  else root.HouseGuardI18n = factory(root.HouseGuardTranslations);
})(typeof window === 'undefined' ? globalThis : window, function(catalog) {
  let language = 'en';
  function normalize(value) { return /^(?:no|nb|nn)(?:[-_]|$)/i.test(String(value || '')) ? 'no' : 'en'; }
  function setLanguage(value) { language = normalize(value); return language; }
  function t(source, values = []) {
    const text = language === 'no' ? source : Object.hasOwn(catalog, source) ? catalog[source] : source;
    // Numeric placeholders are UI interpolation; alarm message tokens such as
    // {zone} remain literal for editing. Parameters are copied verbatim.
    return String(text).replace(/\{(\d+)\}/g, (match, index) => index in values ? String(values[index]) : match);
  }
  function apply(document) {
    document.documentElement?.setAttribute('lang', language === 'no' ? 'nb' : 'en');
    for (const node of document.querySelectorAll('[data-i18n]')) node.textContent = t(node.getAttribute('data-i18n'));
    for (const attr of ['aria-label', 'placeholder', 'title']) {
      for (const node of document.querySelectorAll('[data-i18n-' + attr + ']')) node.setAttribute(attr, t(node.getAttribute('data-i18n-' + attr)));
    }
  }
  const routineTitles = {
    away: 'Siste Person forlater', home: 'Første Person som ankommer', night: 'Aktivering av Nattmodus', morning: 'Deaktivering av Nattmodus',
    nightArrival: 'Ankomst om natten', firstWake: 'Første person våkner', guestOn: 'Gjestemodus på', guestOff: 'Gjestemodus av',
    guestActivated: 'Gjestemodus på', guestDeactivated: 'Gjestemodus av', arming: 'Tilkoblingsforsinkelse', alarm: 'Utløst alarm',
    alarmOff: 'Alarm avstilt', activeSensor: 'Aktiv sensor', entryDelay: 'Inngangsforsinkelse', welcome: 'Velkomstlys', wakeNotice: 'Huset våkner',
  };
  const defaultMessages = new Set([
    'Innbruddsalarm i {zone}: {reason}', 'House Guard kobles til om {seconds} sekunder.',
    'Du har {seconds} sekunder på å slå av alarmen. {zone}: {reason}', 'Aktiv sensor ved tilkobling: {reason}', 'Alarmen er avstilt.',
    'House Guard: {reason} · {zone}. Sensor: {sensorName}.',
  ]);
  function routineName(routine) {
    if (!routine) return '';
    return Object.hasOwn(routineTitles, routine.id) ? t(routineTitles[routine.id]) : routine.name;
  }
  function defaultMessage(value) { return defaultMessages.has(value) ? t(value) : value; }
  function title(value, fallback = '') {
    if (!value || typeof value !== 'object') return value || fallback;
    return language === 'no' ? value.no || value.nb || value.nn || value.en || fallback : value.en || value.no || value.nb || value.nn || fallback;
  }
  async function initialize(homey, document) {
    let value;
    try {
      if (typeof homey?.getLanguage === 'function') {
        // Homey Settings provides a synchronous getter. Also accept callback
        // or Promise adapters so an unavailable bridge falls back to English.
        if (homey.getLanguage.length > 0) value = await new Promise(resolve => {
          let settled = false;
          const finish = value => { if (settled) return; settled = true; clearTimeout(timer); resolve(value); };
          const timer = setTimeout(() => finish(undefined), 1500);
          const result = homey.getLanguage((error, lang) => finish(lang === undefined && typeof error === 'string' ? error : error ? undefined : lang));
          if (typeof result === 'string') finish(result);
          else if (result?.then) result.then(finish, () => finish(undefined));
        });
        else value = await homey.getLanguage();
      }
    } catch { /* Missing/unsupported language uses the required English default. */ }
    setLanguage(value);
    if (document) apply(document);
    return language;
  }
  return { t, setLanguage, normalize, initialize, apply, routineName, defaultMessage, title,
    get language() { return language; }, get locale() { return language === 'no' ? 'nb-NO' : 'en-GB'; },
    has: key => Object.hasOwn(catalog, key), keys: () => Object.keys(catalog),
  };
});
