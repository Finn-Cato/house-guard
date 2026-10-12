'use strict';
window.HouseGuardEnvironment = (() => {
  const t = (source, values = []) => typeof HouseGuardI18n === 'undefined' ? String(source).replace(/\{(\d+)\}/g, (_, index) => String(values[index] ?? '')) : HouseGuardI18n.t(source, values);
  const locale = () => typeof HouseGuardI18n === 'undefined' ? 'nb-NO' : HouseGuardI18n.locale;

  const model = HouseGuardEnvironmentModel, types = { get fire() { return t("Brann"); }, get water() { return t("Vann"); } }, sounds = new Map(), acknowledging = new Set();
  let testing = false;
  const $ = id => document.getElementById(id);
  function sensorGroups(sensors) {
    const groups = new Map();
    for (const sensor of sensors) {
      const id = JSON.stringify([sensor.deviceId, sensor.kind]);
      if (!groups.has(id)) groups.set(id, { ...sensor, id, members: [] });
      groups.get(id).members.push(sensor);
    }
    return [...groups.values()].map(group => {
      const selected = group.members.filter(sensor => sensor.selected).length;
      return { ...group, selected: selected === group.members.length, partial: selected > 0 && selected < group.members.length };
    });
  }
  function sensorStatus(group) {
    const active = group.members.filter(sensor => sensor.value === true);
    if (active.length) return { text: [...new Set(active.map(sensor => model.reason(sensor.capability)))].join(' · '), className: 'error' };
    if (group.members.some(sensor => sensor.available === false)) return {
      text: group.members.every(sensor => sensor.available === false) ? t("Utilgjengelig") : t("Én eller flere alarmtyper er utilgjengelige"), className: 'missing',
    };
    if (group.members.every(sensor => sensor.value === false)) return { text: t("Ingen alarm"), className: '' };
    return { text: group.members.some(sensor => sensor.value === false) ? t("Ukjent status for én eller flere alarmtyper") : model.label(group.members[0]), className: '' };
  }
  function jump(part) { document.querySelector('[data-tab="environment"]').click(); document.querySelector('[data-environment-tab="' + part + '"]').click(); }
  function initializeTabs() {
    const tabs = [...document.querySelectorAll('[data-environment-tab]')];
    const select = (tab, focus = false) => {
      for (const button of tabs) { const active = button === tab; button.setAttribute('aria-selected', String(active)); button.tabIndex = active ? 0 : -1; }
      document.querySelectorAll('[data-environment-panel]').forEach(panel => { panel.hidden = panel.dataset.environmentPanel !== tab.dataset.environmentTab; });
      if (focus) tab.focus();
    };
    tabs.forEach((tab, index) => {
      tab.onclick = () => select(tab);
      tab.onkeydown = event => {
        const next = { ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1 }[event.key];
        if (next !== undefined) { event.preventDefault(); select(tabs[next], true); }
      };
    });
  }
  function render(ctx) {
    const { config, data, el, options, changed, api, flush, load, toast, demo } = ctx, c = config.environment;
    const groups = sensorGroups(model.discover(data.catalog, c.sensors, data.environment?.sensors || []));
    const rerender = () => render(ctx);
    const selectSensors = sensors => {
      const selected = new Set(c.sensors.map(model.key)), missing = [];
      for (const sensor of sensors) if (!selected.has(model.key(sensor))) {
        selected.add(model.key(sensor)); missing.push({ deviceId: sensor.deviceId, capability: sensor.capability });
      }
      if (c.sensors.length + missing.length > 100) {
        toast(t("Du kan velge høyst 100 alarmtyper. Velg færre sensorer før du legger til denne gruppen.")); return false;
      }
      c.sensors.push(...missing); return true;
    };
    const devices = Object.values(data.catalog.devices || {});
    const speakers = devices.filter(d => d.driverId?.includes('sonos')).map(d => ({ id: d.id, label: d.name + ' · ' + d.zone }));
    const lights = devices.filter(d => d.class === 'light' && d.capabilities?.onoff?.setable && ![config.security.lockDeviceId, config.security.garage.commandDeviceId].includes(d.id));
    const cameras = devices.filter(d => d.images?.some(i => i.type === 'camera')).map(d => ({ id: d.id, label: d.name + ' · ' + d.zone }));
    function field(parent, title, object, name, type = 'checkbox', items, limits) {
      const label = el('label', type === 'checkbox' ? undefined : title, type === 'checkbox' ? 'check' : undefined), input = el(items ? 'select' : 'input');
      if (items) options(input, items, object[name]);
      else { input.type = type; if (type === 'checkbox') input.checked = object[name]; else input.value = typeof HouseGuardI18n==='undefined'?object[name]:HouseGuardI18n.defaultMessage(object[name]); }
      if (limits) { input.min = String(limits[0]); input.max = String(limits[1]); }
      if (type === 'text') input.maxLength = 500;
      const update = () => {
        if (!input.checkValidity() || type === 'number' && input.value === '') return;
        object[name] = type === 'checkbox' ? input.checked : type === 'number' ? Number(input.value) : input.value;
        changed(type === 'checkbox' || !!items);
      };
      if (['text','number'].includes(type) && !items) input.oninput = update; else input.onchange = update;
      label.append(input); if (type === 'checkbox') label.append(document.createTextNode(title)); parent.append(label); return input;
    }
    function remove(parent, list, item, text) {
      const button = el('button', text); button.onclick = () => { list.splice(list.indexOf(item), 1); changed(true); rerender(); }; parent.append(button);
    }
    const overview = $('environment-overview'); overview.replaceChildren();
    const setup = el('div', undefined, 'card'); overview.append(setup);
    setup.append(el('h2', t("Overvåking hele døgnet")));
    setup.append(el('p', t("Valgte brann- og vannsensorer overvåkes automatisk hele døgnet, uansett husmodus. Fysiske røykvarslere beholder sin egen alarm."), 'hint'));
    const buttons = el('div', undefined, 'button-row'); setup.append(buttons);
    for (const [part, text] of [['sensors',t("Velg sensorer")], ['responses',t("Velg varsler og handlinger")]]) { const button = el('button', text); button.onclick = () => jump(part); buttons.append(button); }
    setup.append(el('p', undefined, 'hint')); setup.lastChild.id = 'environment-monitoring-state'; setup.lastChild.setAttribute('role', 'status');
    const incidents = el('div'); incidents.id = 'environment-incidents'; overview.append(incidents);
    const deliveries = el('div', undefined, 'card'); deliveries.id = 'environment-deliveries'; overview.append(deliveries);
    const oldFlows = el('details', undefined, 'card'); oldFlows.append(el('summary', t("Eksisterende brann- og vannflows")), el('p', t("Har du allerede Flows som varsler eller styrer enheter ved brann/vann? Gå gjennom dem før du aktiverer samme handling her, slik at du unngår doble varsler. House Guard endrer eller sletter ikke eksisterende Flows."), 'hint')); overview.append(oldFlows);

    const healthOpen=$('water-health-settings')?.open || false;
    const sensors = $('environment-sensors'); sensors.replaceChildren();
    const introduction = el('div', undefined, 'card'); introduction.append(el('h2', t("Velg sensorer")), el('p', t("Kompatible sensorer finnes automatisk. Temperatur og batteri vises som informasjon. Røyk-, brann-, varme- og vannalarm er det som utløser varsler."), 'hint')); sensors.append(introduction);
    for (const type of Object.keys(types)) {
      const card = el('div', undefined, 'card'), items = groups.filter(s => s.kind === type); sensors.append(card);
      card.append(el('h2', type === 'fire' ? t("Røyk og brann") : t("Vannlekkasje")));
      if (type === 'fire') card.append(el('p', t("Hver enhet vises én gang. Når du velger enheten, overvåkes alle alarmtypene den støtter."), 'hint'));
      if (items.some(sensor => sensor.partial)) card.append(el('p', t("Noen alarmtyper er valgt fra før. Kryss av enheten for å overvåke alle."), 'hint'));
      const selectAll = el('button', t("Velg alle i denne gruppen")); selectAll.disabled = !items.length;
      selectAll.onclick = () => { if (selectSensors(items.flatMap(sensor => sensor.members))) changed(true); rerender(); }; card.append(selectAll);
      for (const sensor of items) {
        const row = el('label', undefined, 'environment-sensor'), check = el('input'), copy = el('div'); check.type = 'checkbox'; check.checked = sensor.selected; check.indeterminate = sensor.partial;
        copy.append(el('strong', sensor.name + ' · ' + sensor.zone));
        const status = el('small'); status.dataset.environmentSensor = sensor.id; copy.append(status); row.append(check, copy); card.append(row);
        check.onchange = () => {
          if (check.checked) {
            if (!selectSensors(sensor.members)) { rerender(); return; }
          } else {
            const keys = new Set(sensor.members.map(model.key));
            for (let i = c.sensors.length - 1; i >= 0; i--) if (keys.has(model.key(c.sensors[i]))) c.sensors.splice(i, 1);
          }
          changed(true); rerender();
        };
      }
      if (!items.length) card.append(el('p', t("Ingen kompatible sensorer funnet i denne gruppen."), 'hint'));
      if (type === 'water') card.append(el('p', t("En ny vannsensor kan rapportere temperatur før den har rapportert sin første vannalarmverdi. Den kan likevel velges og overvåkes."), 'hint'));
      if(type==='water') {
        const health=el('details',undefined,'water-health-settings');health.id='water-health-settings';health.open=healthOpen;health.append(el('summary',t("Kontroll av vannsensorer")));
        const grid=el('div',undefined,'form-grid'),h=c.waterHealth;health.append(grid);
        field(grid,t("Kontroller at vannsensorene rapporterer jevnlig"),h,'enabled');
        field(grid,t("Varsle etter timer uten måleoppdatering"),h,'thresholdHours','number',undefined,[1,720]);
        field(grid,t("Send kontrollvarsel til valgte pushmottakere"),h,'push');field(grid,t("Bruk kritisk push for kontrollvarselet"),h,'critical');
        field(grid,t("Vis kontrollvarsel i tidslinjen"),h,'timeline');field(grid,t("Gjenta ukvittert kontrollvarsel etter timer"),h,'repeatHours','number',undefined,[1,720]);
        field(grid,t("Send vanlig push når sensorene rapporterer igjen"),h,'restoredPush');
        health.append(el('p',t("Standard er 24 timer. Appen følger siste registrerte temperatur, RSSI, batterispenning eller batterinivå, og kontrollerer hvert femte minutt. En faktisk alarmrapport teller også som kontakt. Nye sensorer får tid til å rapportere."),'hint'));
        health.append(el('p',t("Dette er et kontrollvarsel om rapporteringen. Det utløser ingen lekkasjealarm eller enhets-/Flow-handlinger. En gammel måleverdi alene beviser ikke at sensoren er offline."),'hint'));
        const report=el('div');report.id='water-health-status';health.append(report);card.append(health);
      }
    }

    const responses = $('environment-responses'), open = new Set([...responses.querySelectorAll('details[open][data-environment-section]')].map(d => d.dataset.environmentSection)); responses.replaceChildren();
    const recipients = el('div', undefined, 'card'); responses.append(recipients);
    recipients.append(el('h2', t("Mottakere")), el('p', config.people.notifications.length ? config.people.notifications.map(id => data.catalog.people[id]?.name || t("Utilgjengelig person")).join(', ') : t("Velg hvem som skal motta push under Personer."), 'hint'));
    const people = el('button', t("Velg mottakere")); people.onclick = () => document.querySelector('[data-tab="people"]').click(); recipients.append(people);
    if (!data.direct?.ready) {
      recipients.append(el('p', t("Legg inn API-nøkkelen for direkte push, kamerabilder, Sonos og start av Flows."), 'hint'));
      const connection = el('button', t("Åpne API-nøkkel")); connection.onclick = () => { document.querySelector('[data-tab="more"]').click(); $('direct-api-settings').open = true; $('direct-api-settings').scrollIntoView({ block: 'start' }); }; recipients.append(connection);
    }
    function section(parent, id, title) {
      const detail = el('details', undefined, 'response-part'); detail.dataset.environmentSection = id; detail.open = open.has(id); detail.append(el('summary', title)); parent.append(detail); return detail;
    }
    for (const type of Object.keys(types)) {
      const r = c.responses[type], card = el('details', undefined, 'card'); card.dataset.environmentSection = type; card.open = open.has(type);
      card.append(el('summary', type === 'fire' ? t("Ved røyk eller brannalarm") : t("Ved vannlekkasje"))); responses.append(card);
      const body = el('div', undefined, 'details-body'), grid = el('div', undefined, 'form-grid'); card.append(body); body.append(grid);
      field(grid, t("Send push til valgte mottakere"), r, 'push'); field(grid, t("Bruk kritisk push"), r, 'critical');
      field(grid, t("Vis hendelsen i Homeys tidslinje"), r, 'timeline'); field(grid, t("Send vanlig push når sensorene slutter å melde alarm"), r, 'restoredPush');
      body.append(el('p', t("Kritisk push må være tillatt for Homey på telefonen. Push sendes først; kamerabilder sendes som egne bildevarsler etterpå."), 'hint'));
      const cameraPart = section(body, type + '-cameras', t("Kamerabilder (valgfritt)"));
      for (const id of r.imageDeviceIds) { const row = el('div', undefined, 'row'); row.append(el('span', data.catalog.devices[id]?.name || t("Kamera mangler"))); remove(row, r.imageDeviceIds, id, t("Fjern kamera")); cameraPart.append(row); }
      const cameraAdd = el('select'); options(cameraAdd, cameras.filter(item => !r.imageDeviceIds.includes(item.id)), '', t("Legg til kamera …")); cameraAdd.setAttribute('aria-label', t("Legg til kamera for ") + types[type]); cameraAdd.disabled = r.imageDeviceIds.length >= 3;
      cameraAdd.onchange = () => { if (cameraAdd.value && r.imageDeviceIds.length < 3) { r.imageDeviceIds.push(cameraAdd.value); changed(true); rerender(); } }; cameraPart.append(cameraAdd, el('p', t("Inntil tre kameraer. Ett bildevarsel per kamera til hver mottaker."), 'hint')); field(cameraPart, t("Send også bilder ved gjentatte varsler"), r, 'imageOnRepeat');
      const messagePart = section(body, type + '-text', t("Tilpass alarmmeldingen")); field(messagePart, t("Alarmmelding"), r, 'text', 'text'); messagePart.append(el('p', t("{zone}, {sensorName}, {reason} og {type} fylles inn automatisk."), 'hint'));
      const repeatPart = section(body, type + '-repeat', t("Gjentatte varsler")); field(repeatPart, t("Gjenta push til noen kvitterer varselet"), r, 'repeatEnabled'); field(repeatPart, t("Gjenta hvert (sekunder)"), r, 'repeatSeconds', 'number', undefined, [60, 3600]); repeatPart.append(el('p', t("Gjentakelse gjelder push og eventuelt bilder. Lyd, lys, vannstyring og Flows kjøres én gang ved starten av en hendelse."), 'hint'));
      const audioPart = section(body, type + '-audio', t("Lyd på Sonos (valgfritt)"));
      for (const audio of r.audio) {
        const row = el('div', undefined, 'form-grid'); audioPart.append(row); const speaker = field(row, t("Høyttaler"), audio, 'deviceId', 'text', speakers);
        speaker.onchange = () => { audio.deviceId = speaker.value; changed(true); rerender(); };
        const audioKind = field(row, t("Beskjed"), audio, 'kind', 'text', [{ id: 'speak', label: t("Tale") }, { id: 'sound', label: t("Alarmlyd") }]);
        audioKind.onchange = () => { audio.kind = audioKind.value; audio.text = audio.kind === 'sound' ? 'alarm3' : r.text; changed(true); rerender(); };
        if (audio.kind === 'speak') field(row, t("Talebeskjed"), audio, 'text', 'text');
        else {
          const sound = field(row, t("Alarmlyd"), audio, 'text', 'text', sounds.get(audio.deviceId) || [{ id: audio.text, label: audio.text }]);
          if (!demo && !sounds.has(audio.deviceId)) api('POST', '/alarm-sounds', { deviceId: audio.deviceId }).then(items => { sounds.set(audio.deviceId, items); if (sound.isConnected) options(sound, items, audio.text, null); }).catch(() => {});
        }
        field(row, t("Volum"), audio, 'volume', 'number', undefined, [1, 100]); remove(row, r.audio, audio, t("Fjern høyttaler"));
      }
      const speakerAdd = el('select'); options(speakerAdd, speakers.filter(s => !r.audio.some(a => a.deviceId === s.id)), '', t("Legg til høyttaler …")); speakerAdd.setAttribute('aria-label', t("Legg til høyttaler for ") + types[type]); speakerAdd.onchange = () => { if (speakerAdd.value) { r.audio.push({ deviceId: speakerAdd.value, kind: 'speak', text: r.text, volume: 35 }); changed(true); rerender(); } }; audioPart.append(speakerAdd);
      const lightPart = section(body, type + '-lights', t("Slå på lys (valgfritt)"));
      for (const id of r.lights) { const row = el('div', undefined, 'row'); row.append(el('span', data.catalog.devices[id]?.name || t("Lys mangler"))); remove(row, r.lights, id, t("Fjern lys")); lightPart.append(row); }
      const lightAdd = el('select'); options(lightAdd, lights.filter(d => !r.lights.includes(d.id)).map(d => ({ id: d.id, label: d.name + ' · ' + d.zone })), '', t("Legg til lys …")); lightAdd.setAttribute('aria-label', t("Legg til lys for ") + types[type]); lightAdd.onchange = () => { if (lightAdd.value) { r.lights.push(lightAdd.value); changed(true); rerender(); } }; lightPart.append(lightAdd);
      const controls = section(body, type + '-controls', type === 'water' ? t("Steng vannet (valgfritt)") : t("Lås opp ytterdøren (valgfritt)"));
      if (type === 'water') {
        const devicesForWater = devices.filter(d => d.capabilities?.onoff?.setable && d.capabilities.onoff.type === 'boolean' && d.class !== 'light' && d.class !== 'lock' && !d.capabilities.locked && !d.capabilities.lock_unlock_open && ![config.security.garage.commandDeviceId, config.security.lockDeviceId].includes(d.id)).map(d => ({ id: d.id, label: d.name + ' · ' + d.zone }));
        const relay = field(controls, t("Enhet som stenger vannet når den slås AV"), r.shutoff, 'deviceId', 'text', devicesForWater);
        relay.onchange = () => { r.shutoff.deviceId = relay.value; r.shutoff.validated = false; r.shutoff.enabled = false; changed(true); rerender(); };
        const validated = field(controls, t("Jeg har bekreftet at AV på denne enheten stenger vannet"), r.shutoff, 'validated'); validated.disabled = !r.shutoff.deviceId;
        validated.onchange = () => { r.shutoff.validated = validated.checked; if (!r.shutoff.validated) r.shutoff.enabled = false; changed(true); rerender(); };
        const shutoff = field(controls, t("Slå AV denne enheten ved vannalarm"), r.shutoff, 'enabled'); shutoff.disabled = !r.shutoff.validated;
        controls.append(el('p', t("Homey kan bekrefte AV på enheten, men en bryter uten ventilstatus bekrefter ikke fysisk stengt vann. Vannet åpnes aldri automatisk når alarmen opphører."), 'hint'));
      } else {
        const unlock = field(controls, t("Lås opp valgt ytterdør ved røyk eller brannalarm"), r, 'unlockDoor'); unlock.disabled = !config.security.lockDeviceId && !r.unlockDoor;
        controls.append(el('p', config.security.lockDeviceId ? t("Gjelder ") + (data.catalog.devices[config.security.lockDeviceId]?.name || t("valgt ytterdør")) + t(". Krever en ekte alarmhendelse; test av røykvarsler utløser ikke dette.") : t("Velg ytterdørlåsen under Alarm → Lås og port først."), 'hint'));
      }
      const flowPart = section(body, type + '-flows', t("Egne Flows (valgfritt)"));
      for (const flow of r.flows) { const row = el('div', undefined, 'row'); row.append(el('span', data.catalog.flows.find(f => f.id === flow.flowId && f.type === flow.flowType)?.name || t("Flow mangler"))); remove(row, r.flows, flow, t("Fjern Flow")); flowPart.append(row); }
      const flowAdd = el('select'); options(flowAdd, data.catalog.flows.filter(f => f.enabled !== false && !f.broken && f.triggerable !== false && !r.flows.some(item => item.flowId === f.id && item.flowType === f.type)).map(f => ({ id: f.type + ':' + f.id, label: f.name + (f.type === 'advanced' ? ' · Advanced' : '') })), '', t("Legg til Flow …")); flowAdd.setAttribute('aria-label', t("Legg til Flow for ") + types[type]); flowAdd.onchange = () => { if (flowAdd.value && r.flows.length < 10) { const [flowType, flowId] = flowAdd.value.split(':'); r.flows.push({ flowType, flowId }); changed(true); rerender(); } }; flowPart.append(flowAdd);
      flowPart.append(el('p', t("Velg en Flow som kan startes direkte. For egne avanserte automasjoner finnes også House Guard-kortene «Brann- eller vannalarm starter» og «Sensorene melder ikke lenger brann- eller vannalarm»."), 'hint'));
      const test = section(body, type + '-test', t("Prøv varsler på telefonen")); test.append(el('p', t("Sender bare testvarsler til valgte mottakere. Ingen sensoralarm, lyd, lys, lås, vannstyring eller Flow utløses. Kritisk test kan gi lyd på telefonen."), 'hint'));
      const testButtons = el('div', undefined, 'button-row'), status = el('p', undefined, 'hint'); status.setAttribute('role', 'status'); test.append(testButtons, status);
      for (const [notificationType, text] of [['normal',t("Test vanlig push")], ['critical',t("Test kritisk push")], ['image',t("Test kamerabilder")]]) {
        const button = el('button', text); button.disabled = demo || testing || !data.direct?.ready || !config.people.notifications.length || notificationType === 'image' && !r.imageDeviceIds.length; testButtons.append(button);
        button.onclick = () => HouseGuardButtons.run(button, async () => {
          if (testing) return; testing = true; status.textContent = t("Sender test …");
          try { await flush(); const result = await api('POST', '/direct-test', { type: 'push', notificationType, environmentType: type }); status.textContent = result.results ? result.results.map(item => item.name + ': ' + (item.accepted ? t("akseptert av Homey") : t("feilet"))).join(' · ') + t(". Kontroller telefonen.") : t("Homey har akseptert testvarselet. Kontroller telefonen."); }
          catch (error) { status.textContent = error.message; }
          finally { testing = false; }
        }, { peers: testButtons.children, label: t("Sender …") });
      }
    }
    renderStatus(ctx);
  }
  function renderStatus(ctx) {
    const { data, config, el, api, flush, load, toast } = ctx, status = data.environment || { incidents: [], batches: [], sensors: [] };
    const selected = model.discover(data.catalog, config.environment.sensors, status.sensors || []), byKey = new Map(selected.map(s => [model.key(s), s]));
    const grouped = new Map(sensorGroups(selected).map(sensor => [sensor.id, sensor]));
    const sensorCount = new Set(config.environment.sensors.map(sensor => sensor.deviceId)).size;
    const text = $('environment-monitoring-state');
    if (text) text.textContent = !sensorCount ? t("Velg brann- og vannsensorer under Sensorer. De overvåkes automatisk.") : status.observing ? t("Sensorene er valgt. Fullfør grunnoppsettet før varsler og handlinger aktiveres.") : t("Overvåker ") + sensorCount + t(" sensorer hele døgnet.");
    for (const node of document.querySelectorAll('[data-environment-sensor]')) {
      const sensor = grouped.get(node.dataset.environmentSensor); if (!sensor) continue;
      const state = sensorStatus(sensor), temperature = sensor.members.find(member => typeof member.temperature === 'number')?.temperature, battery = sensor.members.find(member => typeof member.battery === 'number')?.battery;
      node.textContent = [state.text, typeof temperature === 'number' ? temperature + ' °C' : '', typeof battery === 'number' ? t("Batteri ") + battery + ' %' : ''].filter(Boolean).join(' · ');
      node.className = state.className;
    }
    const root = $('environment-incidents'); if (!root) return; root.replaceChildren();
    const active = (status.incidents || []).filter(i => i.active), home = $('home-environment-alerts'); home.replaceChildren(); home.hidden = !active.length;
    for (const incident of active) {
      const sources = incident.sensors.filter(s => s.active), card = el('div', undefined, 'card environment-incident'); root.append(card);
      card.append(el('h2', types[incident.type] + t(" – alarm registrert")), el('p', sources.map(s => s.name + ' · ' + s.zone).join(', ')), el('p', t("Startet ") + new Date(incident.startedAt).toLocaleString(locale(), { timeZone: config.timeZone }), 'hint'));
      for (const sensor of sources) {
        const reading = byKey.get(model.key(sensor));
        if (!reading?.selected || reading.available === false || reading.value === null) card.append(el('p', sensor.name + ': ' + (!reading?.selected ? t("Sensoren er ikke lenger valgt. Velg den igjen for å lese alarmstatus.") : reading.available === false ? t("Sensoren er utilgjengelig; alarmhendelsen beholdes.") : t("Venter på ny alarmstatus.")), 'hint'));
      }
      card.append(el('p', incident.acknowledgedAt ? t("Varslet er kvittert. Sensoralarm er fortsatt registrert.") : t("Kvittering stopper gjentatte House Guard-varsler. Den avstiller ikke fysiske røykvarslere."), 'hint'));
      const acknowledge = el('button', incident.acknowledgedAt ? t("Varslet er kvittert") : t("Jeg har sett varselet")); acknowledge.disabled = !!incident.acknowledgedAt || acknowledging.has(incident.id); card.append(acknowledge);
      acknowledge.onclick = () => HouseGuardButtons.run(acknowledge, async () => {
        if (acknowledging.has(incident.id)) return; acknowledging.add(incident.id);
        try { await flush(); await api('POST', '/command', { type: 'environment-ack', id: incident.id }); await load(); }
        catch (error) { toast(error.message); }
        finally { acknowledging.delete(incident.id); }
      }, { label: t("Kvitterer …") });
      const homeCard = el('div', undefined, 'card environment-incident'); homeCard.append(el('h2', types[incident.type] + t(" – alarm registrert")), el('p', sources.map(s => s.zone + ' · ' + s.name).join(', ')));
      const open = el('button', t("Se alarmhendelsen")); open.onclick = () => jump('overview'); homeCard.append(open); home.append(homeCard);
    }
    if (!active.length) { const card = el('div', undefined, 'card'); card.append(el('h2', t("Ingen aktive alarmhendelser"))); const last = [...(status.incidents || [])].reverse().find(i => !i.active); if (last) card.append(el('p', t("Sist avsluttet: ") + types[last.type] + ' · ' + new Date(last.endedAt).toLocaleString(locale(), { timeZone: config.timeZone }), 'hint')); root.append(card); }
    const health=status.waterHealth,healthRoot=$('water-health-status');
    if(healthRoot){
      healthRoot.replaceChildren();
      const labels={ok:t("Har rapportert innen fristen"),paused:t("Kontrollen er ikke aktivert"),waiting:t("Venter på første måleoppdatering"),stale:t("Gammel måleoppdatering – kontroller sensoren"),missing:t("Ingen rapportert måleoppdatering"),unsupported:t("Ingen egnet måling å følge")};
      for(const sensor of health?.sensors || []){
        const row=el('div',undefined,'summary-line');row.append(el('strong',sensor.name+' · '+sensor.zone),el('p',labels[sensor.status]||t("Venter på kontroll"),'hint'));
        const value=typeof sensor.value==='boolean'?(sensor.value?t("sensoren meldte alarm"):t("sensoren meldte ikke alarm")):sensor.value+(sensor.unit?' '+sensor.unit:'');
        if(sensor.lastSignalAt!==null)row.append(el('p',t("Sist registrert ")+(sensor.label||t("rapport"))+': '+new Date(sensor.lastSignalAt).toLocaleString(locale(),{timeZone:config.timeZone})+(sensor.value!==null?' · '+value:''),'hint'));healthRoot.append(row);
      }
      if(!health?.sensors?.length)healthRoot.append(el('p',t("Velg vannsensorer og aktiver overvåkingen for å bruke kontrollen."),'hint'));
    }
    const warning=health?.warning;
    if(config.environment.waterHealth.enabled&&warning?.active){
      const card=el('div',undefined,'card environment-maintenance');card.append(el('h2',t("Vannsensorer trenger kontroll")),el('p',warning.names.join(', ')),el('p',t("Måleoppdateringene er gamle eller mangler. Dette er et kontrollvarsel om rapportering; ingen lekkasje er registrert av denne kontrollen."),'hint'));
      const ack=el('button',warning.acknowledgedAt?t("Kontrollvarsel er kvittert"):t("Kvitter kontrollvarsel"));ack.disabled=!!warning.acknowledgedAt||acknowledging.has(warning.id);card.append(ack);
      ack.onclick=()=>HouseGuardButtons.run(ack,async()=>{
        if(acknowledging.has(warning.id))return;acknowledging.add(warning.id);
        try{await flush();await api('POST','/command',{type:'environment-health-ack',id:warning.id});await load();}catch(error){toast(error.message);}finally{acknowledging.delete(warning.id);}
      },{label:t("Kvitterer …")});root.append(card);
      const homeCard=el('div',undefined,'card environment-maintenance');homeCard.append(el('h2',t("Vannsensorer trenger kontroll")),el('p',warning.names.join(', ')));
      const open=el('button',t("Se kontrollvarselet"));open.onclick=()=>jump('sensors');homeCard.append(open);home.append(homeCard);home.hidden=false;
    }
    const deliveries = $('environment-deliveries'); deliveries.replaceChildren(el('h2', t("Siste varsler og handlinger")));
    const names = { pending: t("Venter"), sending: t("Sender"), waiting: t("Venter på enhetsstatus"), accepted: t("Akseptert av Homey"), confirmed: t("Enhetsstatus bekreftet"), failed: t("Feilet"), unknown: t("Ukjent utfall"), cancelled: t("Avbrutt") };
    const actions = (status.batches || []).flatMap(batch => batch.actions.map(a => ({ ...a, type: batch.type,health:batch.health }))).slice(-12).reverse();
    for (const action of actions) {
      const title = action.kind === 'notify' ? action.notificationType === 'image' ? t("Kamerabilde") : action.notificationType === 'critical' ? t("Kritisk push") : t("Push") : action.kind === 'timeline' ? t("Tidslinje") : action.kind === 'flow' ? t("Flow") : ['speak','sound'].includes(action.kind) ? t("Sonos") : t("Enhetsstyring");
      const row = el('div', undefined, 'summary-line'); row.append(el('strong', (action.health?t("Vannsensorkontroll"):types[action.type]) + ' · ' + title + ' · ' + (names[action.status] || action.status))); if (action.detail) row.append(el('p', action.detail, ['failed','unknown'].includes(action.status) ? 'error' : 'hint')); deliveries.append(row);
    }
    if (!actions.length) deliveries.append(el('p', t("Ingen varsler eller handlinger utført ennå."), 'hint'));
  }
  return { render, renderStatus, initializeTabs };
})();
