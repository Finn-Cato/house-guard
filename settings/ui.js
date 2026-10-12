'use strict';
(() => {
  const t = (source, values = []) => typeof HouseGuardI18n === 'undefined' ? String(source).replace(/\{(\d+)\}/g, (_, index) => String(values[index] ?? '')) : HouseGuardI18n.t(source, values);
  const locale = () => typeof HouseGuardI18n === 'undefined' ? 'nb-NO' : HouseGuardI18n.locale;

  const $ = id => document.getElementById(id);
  const feedback = HouseGuardButtons;
  const labels = { get alarm() { return t("Alarm"); }, get lights() { return t("Lys"); }, get av() { return t("Lyd og TV"); }, get ventilation() { return t("Ventilasjon"); }, get lock() { return t("Lås"); }, get garage() { return t("Garasjeport"); }, get notification() { return t("Varsler"); }, get people() { return t("Personstatus"); }, get other() { return t("Andre handlinger"); } };
  const kinds = { get set() { return t("Sett enhet"); }, get flow() { return t("Start Flow"); }, get notify() { return t("Varsel"); }, get speak() { return t("Si tekst"); }, get sound() { return t("Spill lyd"); }, get timeline() { return t("Tidslinje"); }, get person() { return t("Sovestatus"); }, get garage() { return t("Lukk port"); }, get verify() { return t("Bekreft tilstand"); } };
  const resultNames = { get planned() { return t("Ville utført"); }, get info() { return t("Informasjon"); }, get pending() { return t("Venter"); }, get checking() { return t("Kontrollerer"); }, get dispatching() { return t("Klargjør sending"); }, get sent() { return t("Sendt"); }, get waiting() { return t("Venter på tilstand"); }, get accepted() { return t("Akseptert"); }, get confirmed() { return t("Bekreftet"); }, get observed() { return t("Ikke utført under oppsett"); }, get skipped() { return t("Hoppet over"); }, get cancelled() { return t("Avbrutt"); }, get failed() { return t("Feil"); }, get unknown() { return t("Ukjent utfall"); } };
  const modeNames = { get home() { return t("Hjemme"); }, get away() { return t("Borte"); }, get night() { return t("Natt"); }, get unknown() { return t("Ukjent"); } };
  const alarmRoutineIds = ['alarm','arming','entryDelay','activeSensor','alarmOff'];
  let data, config, dirty = false, homey, demo = false, actionRoutine, editedAction, toastTimer, autosave, actionChanged = false;
  let wizard;
  const controlBusy = new Set(), controlErrors = {};
  let apiKeyBusy=false,apiKeyMessage='';
  function el(tag, text, className) { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (className) e.className = className; if(tag==='button')e.classList.add('hy-nostyle'); return e; }
  function get(object, path) { return path.split('.').reduce((v, key) => v?.[key], object); }
  function put(object, path, value) { const parts = path.split('.'); const key = parts.pop(); get(object, parts.join('.'))[key] = value; }
  function setDirty(immediate = false) { autosave.change(config, immediate); if(data && config) renderConnectionRecipes(); }
  function savingState(state) {
    dirty = state.pending;
    $('autosave-status').dataset.state = state.phase;
    const message = state.phase === 'error' ? t("Ikke lagret: {0}", [state.error?.message || t("Last inn lagret oppsett.")]) : state.phase === 'saving' ? t("Lagrer …") : t("Alle endringer er lagret automatisk");
    document.querySelectorAll('[data-autosave-message]').forEach(node => { node.textContent = message; node.classList.toggle('error', state.phase === 'error'); });
    $('reload-config').hidden = state.phase !== 'error';
    if (data) renderIntegrations();
  }
  async function flush() { if (autosave) await autosave.flush(); }
  function toast(message) { $('toast').textContent = message; $('toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('toast').hidden = true; }, 6500); }
  function api(method, path, body) {
    if (demo) return fetch(`/api${path}`, { method, headers: { 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) }).then(async r => { const value = await r.json(); if (!r.ok) throw new Error(value.error || t("API-feil")); return value; });
    return new Promise((resolve, reject) => homey.api(method, path, body || null, (error, value) => error ? reject(new Error(error.message || error)) : resolve(value)));
  }
  function options(select, items, value, empty = t("Ikke valgt")) {
    select.replaceChildren(); if (empty !== null) select.add(new Option(empty, ''));
    for (const item of items) select.add(new Option(item.label, item.id));
    if (value && !items.some(i => i.id === String(value))) select.add(new Option(t("Mangler: {0}", [value]), value));
    select.value = value ?? '';
  }
  function deviceItems(filter = 'any') {
    const devices = Object.values(data.catalog.devices || {});
    return devices.filter(d=>!(d.driverId?.endsWith(':alarm-panel') || d.driverId==='alarm-panel')).filter(d => filter === 'camera' ? d.class === 'camera' || d.images?.some(i => i.type === 'camera') : Object.entries(d.capabilities).some(([id, c]) => filter === 'any' || (filter === 'writable' ? c.setable : filter === 'boolean' ? c.type === 'boolean' : id === filter || id.startsWith(`${filter}.`))))
      .map(d => {
        const duplicate = devices.filter(other => other.name === d.name && other.zone === d.zone).length > 1;
        const detail = d.capabilities.locked ? t("lås") : d.capabilities.alarm_contact ? t("kontakt") : d.id.slice(-8);
        return { id: d.id, label: `${d.name} · ${d.zone || t("Uten sone")}${duplicate ? ` · ${detail}` : ''}${d.available === false ? t(" · utilgjengelig") : ''}` };
      }).sort((a, b) => a.label.localeCompare(b.label, locale()));
  }
  function fillSelects() {
    document.querySelectorAll('select[data-device]').forEach(s => options(s, deviceItems(s.dataset.device==='welcome-trigger'?(config.welcome.sensorType==='motion'?'alarm_motion':'alarm_contact'):s.dataset.device), get(config, s.dataset.bind)));
    document.querySelectorAll('select[data-capabilities]').forEach(s => {
      const d = data.catalog.devices[get(config, s.dataset.capabilities)];
      const items = Object.entries(d?.capabilities || {}).filter(([id, c]) => (!s.dataset.prefix || id===s.dataset.prefix || id.startsWith(s.dataset.prefix+'.')) && (!s.dataset.write || c.setable) && (!s.dataset.capType || c.type === s.dataset.capType)).map(([id, c]) => ({ id, label: `${c.title || id} (${id})` }));
      if(s.dataset.prefix)s.parentElement.hidden=items.length<=1;
      options(s, items, get(config, s.dataset.bind));
    });
    document.querySelectorAll('select[data-source="zones"]').forEach(s => options(s, Object.values(data.catalog.zones || {}).map(z => ({ id: z.id, label: z.name })), get(config, s.dataset.bind)));
  }
  function fillBindings() {
    fillSelects();
    document.querySelectorAll('[data-bind]').forEach(input => { const v = get(config, input.dataset.bind); if (input.type === 'checkbox') input.checked = input.dataset.checkedValue ? v === input.dataset.checkedValue : !!v; else input.value = String(v ?? ''); });
    $('timezone').textContent = t("Tidssone: {0}. Følger Homeys innstilling.", [config.timeZone]);
  }
  function bindEvents() {
    const changed = event => {
      const input = event.target; if (!input.dataset.bind) return;
      let value = input.type === 'checkbox' ? input.checked : input.type === 'number' ? (input.value === '' ? null : Number(input.value)) : input.value;
      if (input.dataset.checkedValue) value = input.checked ? input.dataset.checkedValue : '';
      if (input.dataset.valueType === 'boolean') value = value === 'true';
      if (input.dataset.valueType === 'scalar') value = scalar(value);
      if (!input.dataset.bind.includes('.')) config[input.dataset.bind] = value; else put(config, input.dataset.bind, value);
      if(input.dataset.bind==='morning.motion.deviceId'){
        config.morning.motion.capability=Object.keys(data.catalog.devices[value]?.capabilities || {}).find(id=>id==='alarm_motion' || id.startsWith('alarm_motion.')) || 'alarm_motion';
        if(!value){config.morning.motion.enabled=false;document.querySelector('[data-bind="morning.motion.enabled"]').checked=false;}
      }
      if(['welcome.sensorType','welcome.doorDeviceId'].includes(input.dataset.bind)) {
        const prefix=config.welcome.sensorType==='motion'?'alarm_motion':'alarm_contact';
        const matching=Object.keys(data.catalog.devices[config.welcome.doorDeviceId]?.capabilities || {}).find(id=>id===prefix || id.startsWith(prefix+'.'));
        config.welcome.doorCapability=matching || prefix;
        if(!matching)config.welcome.doorDeviceId='';
        fillSelects();
      }
      if (input.dataset.bind.startsWith('security.garage.') && !['security.garage.enabled', 'security.garage.validated'].includes(input.dataset.bind)) {
        config.security.garage.validated = false; config.security.garage.enabled = false;
        document.querySelector('[data-bind="security.garage.validated"]').checked = false;
        document.querySelector('[data-bind="security.garage.enabled"]').checked = false;
      }
      if (input.dataset.device) fillSelects(); setDirty(event.type === 'change'); renderConnectionRecipes();
      renderConditionalFields();renderAlarmChecklist();if(input.dataset.bind==='security.alarmDeviceId')renderIntrusion();
      if(input.dataset.bind==='welcome.delaySeconds')renderRoutines();
    };
    document.addEventListener('change', changed);
    document.addEventListener('input', event => { if (['text', 'number', 'time'].includes(event.target.type)) changed(event); });
    document.addEventListener('click', event => {
      const button=event.target.closest('[data-settings-target]');
      if(button)navigateSettings({tab:button.dataset.settingsTab,id:button.dataset.settingsTarget,alarmTab:button.dataset.settingsAlarmTab});
    });
  }
  function renderLogs(container, entries) {
    container.replaceChildren();
    if (!entries.length) { container.append(el('p', t("Ingen hendelser ennå."), 'empty')); return; }
    for (const entry of [...entries].reverse()) {
      const row = el('div', undefined, 'log-entry'), time = el('time', new Date(entry.at).toLocaleString(locale(), { day:'2-digit', month:'2-digit', hour: '2-digit', minute: '2-digit', timeZone: config.timeZone }));
      time.dateTime = new Date(entry.at).toISOString(); const copy = el('div', entry.message);
      if (entry.result || entry.routineId) copy.append(el('small', [resultNames[entry.result], HouseGuardI18n.routineName(config.routines.find(r => r.id === entry.routineId))].filter(Boolean).join(' · ')));
      row.append(time, copy); container.append(row);
    }
  }
  function renderStatus() {
    const s = data.status;
    renderIntrusionStatus();
    HouseGuardEnvironment.renderStatus(environmentContext());
    $('connection').textContent = demo ? t("DEMO · Kun eksempeldata. Ingen tilkobling til Homey eller huset.") : !s.connected ? t("Homey-data er utilgjengelige. Handlinger krever fersk, bekreftet tilstand.") : s.observation ? t("Fullfør oppsettet for å ta House Guard i bruk.") : '';
    $('connection').hidden=!demo && s.connected && !s.observation;
    $('connection').className = `banner ${!s.connected ? 'error' : s.observation ? 'warning' : 'ready'}`;
    $('mode-title').textContent = modeNames[s.mode] || t("Ukjent"); $('mode-reason').textContent = s.reason;
    $('home-overview').hidden=!data.config.people.presence.length && !s.guest;
    $('home-history').hidden=!data.config.people.presence.length && !data.config.setupCompleted;
    $('mode-icon').textContent = { home: '⌂', away: '↗', night: '☾', unknown: '?' }[s.mode];
    $('mode-badge').hidden=true;
    $('guest-toggle').checked = s.guest;$('guest-toggle').disabled=!!s.observation;
    const people = $('home-people'); people.replaceChildren();
    for (const id of data.config.people.presence) {
      const p = s.people[id] || data.catalog.people[id] || { name: t("Mangler: {0}", [id]), available: false };
      const pill = el('div', undefined, 'person-pill'), copy = el('div'); copy.append(el('strong', p.name || id));
      copy.append(el('small', p.available === false || p.present === null || p.present === undefined ? t("Ukjent status") : p.present ? (p.asleep === true ? t("Hjemme · sover") : p.asleep === false ? t("Hjemme · våken") : t("Hjemme · søvn ukjent")) : t("Borte")));
      pill.append(el('div', (p.name || '?').slice(0, 1).toUpperCase(), 'avatar'), copy); people.append(pill);
    }
    if (!people.children.length) people.append(el('p', t("Velg personer i Personer-fanen for å beregne modus for huset."), 'empty'));
    renderHomeControls();
    const changed = data.config.people.night.filter(id => s.people[id]?.present === true && s.people[id]?.available !== false).map(id => s.people[id]?.name || id);
    $('manual-explanation').textContent = changed.length ? t("Nattmodus vil sette disse sovende: {0}.{1}", [changed.join(', '), s.observation ? t(" Fullfør oppsettet først.") : '']) : t("Ingen personstatuser vil endres av nattoppsettet.");
    $('skip-status').textContent = s.skipUntil > Date.now() ? t("Automatisk natt hoppes over til {0}.", [new Date(s.skipUntil).toLocaleString(locale(), { timeZone: config.timeZone })]) : '';
    const pending = $('pending-list'); pending.replaceChildren();
    let count = 0;
    for (const run of s.pending || []) for (const a of run.actions.filter(a => ['pending', 'checking', 'dispatching', 'sent', 'waiting'].includes(a.status))) {
      count++; const row = el('div', undefined, 'action-row'); const copy = el('div', `${HouseGuardI18n.routineName(config.routines.find(r => r.id === run.routineId)) || (run.routineId==='wakeNotice'?t("Huset våkner"):run.routineId)} · ${describeAction(a)}`, 'action-copy');
      copy.append(el('small', `${resultNames[a.status]} · ${new Date(run.dueAt + a.delaySeconds * 1000).toLocaleTimeString(locale(), { timeZone: config.timeZone })}`)); row.append(copy); pending.append(row);
    }
    if (!count) pending.append(el('p', t("Ingen handlinger venter."), 'empty')); $('pending-count').textContent = count;$('home-pending').hidden=!count;
    renderLogs($('recent-log'), s.history.slice(-5));
    const filter = $('log-filter').value; renderLogs($('full-log'), s.history.filter(e => filter === 'all' || (filter === 'failed' ? ['failed', 'unknown'].includes(e.result) : e.result === filter)));
    $('question-card').hidden = !s.question || !!s.question.decided;
    if (s.question && !s.question.decided) {
      const card = $('question-card'); card.replaceChildren(el('h2', t("Venter på felles nattbeslutning")), el('p', t("Svarfrist: {0}", [new Date(s.question.deadline).toLocaleTimeString(locale())]), 'hint'));
      for (const id of s.question.recipients) card.append(el('p', `${s.people[id]?.name || id}: ${s.question.answers[id] === 'yes' ? t("Ja") : s.question.answers[id] === 'no' ? t("Nei") : s.question.answers[id] === 'error' ? t("Teknisk feil") : t("Venter på svar")}`));
    }
    $('demo-panel').hidden = !demo;
    renderIntegrations();
  }
  function renderHomeControls() {
    const c=data.config.security,s=data.status,cap=(id,key)=>s.devices?.[id]?.available!==false?s.devices?.[id]?.capabilities?.[key]?.value:undefined;
    const locked=cap(c.lockDeviceId,'locked'),port=cap(c.garage.statusDeviceId,c.garage.statusCapability);
    $('home-lock').hidden=!c.lockDeviceId;
    $('home-garage').hidden=!c.garage.statusDeviceId && !c.garage.commandDeviceId;
    $('home-alarm').hidden=!data.intrusion?.selected && !data.intrusion?.active && !data.intrusion?.target && !data.intrusion?.entryAt;
    $('security-status').hidden=[...$('security-status').children].every(node=>node.hidden);
    $('manual-controls').hidden=!data.config.people.presence.length || !!s.observation;
    $('home-night-controls').hidden=!data.config.people.presence.length;
    $('night-command-help').hidden=$('home-night-controls').hidden;
    $('home-people').hidden=!data.config.people.presence.length;
    document.querySelectorAll('[data-command]').forEach(button=>{const unavailable=!!s.observation || (['home','away'].includes(button.dataset.command) && !data.direct?.ready);feedback.disable(button,unavailable);button.title=unavailable?t("Koble til Homey under Innstillinger for å endre personstatus."):'';});
    $('home-lock-state').textContent=locked===true?t("Låst"):locked===false?t("Ulåst"):t("Ukjent status");
    $('home-lock-status').dataset.state=locked===true?'closed':locked===false?'open':'unknown';
    $('home-garage-state').textContent=typeof port==='boolean'?(port===c.garage.openValue?t("Åpen"):t("Lukket")):t("Ukjent status");
    $('home-garage-status').dataset.state=typeof port==='boolean'?(port===c.garage.openValue?'open':'closed'):'unknown';
    for(const target of ['lock','garage']){
      const control=data.controls?.[target],pending=controlBusy.has(target) || control?.pending;
      const current=target==='lock'?locked:typeof port==='boolean'?port===c.garage.openValue:undefined;
      document.querySelectorAll('[data-control="'+target+'"]').forEach(button=>{
        const value=button.dataset.controlValue==='true',option=control?.options[String(value)];
        feedback.disable(button,!!s.observation || !option?.allowed || value===current,!!pending);
        button.title=pending?t("Venter på bekreftet status"):option?.reason || '';
      });
      const next=typeof current==='boolean'?String(!current):'true';
      $(target+'-control-note').textContent=controlErrors[target] || (pending?t("Kommando pågår – venter på bekreftet status."):control?.options[next]?.reason || (s.observation?t("Fullfør oppsettet før du styrer enheten."):t("Status leses fra Homey.")));
    }
  }
  function renderPeople() {
    const container=$('people-selection');container.replaceChildren();
    const ids=[...new Set([...Object.keys(data.catalog.people),...Object.values(config.people).flat()])];
    for(const id of ids){
      const p=data.catalog.people[id],row=el('div',undefined,'person-config');row.append(el('strong',p?.name || t("Utilgjengelig valgt person"),!p?'missing':''));
      const roles=el('div',undefined,'person-roles'),night=el('details');night.append(el('summary',t("Natt og spørsmål")));
      for(const [role,title]of [['presence',t("Bor her / teller med")],['notifications',t("Motta pushvarsler")],['night',t("Teller med når huset går i nattmodus")],['questions',t("Motta spørsmål om nattmodus")]]){
        const label=el('label',undefined,'check'),check=el('input');check.type='checkbox';check.checked=config.people[role].includes(id);
        check.onchange=()=>{config.people[role]=check.checked?[...new Set([...config.people[role],id])]:config.people[role].filter(v=>v!==id);if(role==='presence'&&!check.checked)config.people.night=config.people.night.filter(v=>v!==id);if(role==='night'&&check.checked&&!config.people.presence.includes(id))config.people.presence.push(id);setDirty(true);renderPeople();renderConditionalFields();};
        label.append(check,document.createTextNode(title));(['presence','notifications'].includes(role)?roles:night).append(label);
      }
      night.open=config.people.night.includes(id)||config.people.questions.includes(id);
      if(config.people.questions.includes(id)&&!config.night.automatic)night.append(el('p',t("Nattspørsmål er av. De kan aktiveres under Rutiner → Aktivering av Nattmodus."),'hint'));
      row.append(roles,night);container.append(row);
    }
    if(!ids.length)container.append(el('p',t("Ingen personer funnet. Kontroller Homey-forbindelsen under Innstillinger."),'empty'));
  }
  function describeAction(a) {
    const target = data.catalog.devices[a.deviceId]?.name || a.deviceId || data.catalog.people[a.personId]?.name || a.personId || data.catalog.flows.find(f => f.id === a.flowId)?.name || a.flowId || '';
    const booleanLabels=a.kind==='person'?[t("Våken"),t("Sovende")]:{onoff:[t("Av"),t("På")],locked:[t("Ulåst"),t("Låst")],alarm_contact:[t("Lukket"),t("Åpen")],alarm_motion:[t("Ingen bevegelse"),t("Bevegelse")]}[a.capability] || [t("Inaktiv / nei"),t("Aktiv / ja")];
    const value=typeof a.value==='boolean'?booleanLabels[Number(a.value)]:String(a.value);
    return `${kinds[a.kind] || a.kind}${target ? ` · ${target}` : ''}${a.value !== undefined ? ` → ${value}` : ''}${a.text ? ` · ${a.text}` : ''}`;
  }
  function renderRoutines() {
    const root=$('routines'),list=$('routine-list');
    const opened=new Set([...root.querySelectorAll('[data-routine][open]')].map(node=>node.dataset.routine));
    const executionOpened=new Set([...root.querySelectorAll('[data-execution][open]')].map(node=>node.dataset.execution));
    const slots=new Map([...root.querySelectorAll('[data-routine-slot]')].map(node=>[node.dataset.routineSlot,node]));
    root.querySelectorAll('[data-routine-list],[data-routine-slot]').forEach(node=>node.replaceChildren());
    for (const routine of config.routines) {
      if(['guestOn','guestOff',...alarmRoutineIds].includes(routine.id)||(routine.id.startsWith('custom-')&&routine.hidden))continue;
      const slot=slots.get(routine.id);
      const target=slot || $(['away','home'].includes(routine.id)?'presence-routines':['nightArrival','firstWake'].includes(routine.id)?'wake-routines':['guestActivated','guestDeactivated'].includes(routine.id)?'guest-routine-list':'routine-list');
      const editing=$('action-dialog').open && routine.id===actionRoutine?.id;
      target.append(renderRoutine(routine,{inline:!!slot,open:opened.has(routine.id)||editing,executionOpen:executionOpened.has(routine.id),title:slot?{welcome:t("Hva skal skje?"),night:t("Ekstra handlinger ved nattmodus"),morning:t("Ekstra handlinger"),nightArrival:t("Ekstra handlinger ved nattankomst")}[routine.id]:undefined}));
      if(editing)revealSettings($('routine-'+routine.id));
    }
    if(!list.children.length)list.append(el('p',t("Lag en egen rutine hvis du trenger flere handlinger som kan startes manuelt eller fra en Homey Flow."),'hint'));
  }
  function renderRoutineViews() { renderRoutines();renderAlarmResponses(); }
  function renderRoutine(routine,{inline=false,open=false,title,onEnabledChange,executionOpen=false}={}) {
      const custom=routine.id.startsWith('custom-'),alarmEvent=alarmRoutineIds.includes(routine.id);
      const card=el(inline?'section':'details',undefined,inline?'routine-actions':'card'),heading=el(inline?'h3':'summary'),body=el('div',undefined,inline?'routine-body':'details-body');
      const headingFor=(heading,routine)=>{heading.replaceChildren(el('span',title || HouseGuardI18n.routineName(routine)));if(inline)return;const count=routine.actions.length;heading.append(el('small',count?(routine.enabled?'':t("Ekstrahandlinger på pause · "))+routine.actions.slice(0,2).map(describeAction).join(' · ')+(count>2?' · +'+(count-2)+t(" til"):''):t("Ingen ekstrahandlinger"),'routine-meta'));};
      card.dataset.routine=routine.id;card.id='routine-'+routine.id;card.setAttribute('aria-label',HouseGuardI18n.routineName(routine));if(!inline)card.open=open;headingFor(heading,routine);
      if(custom){const nameLabel = el('label', t("1. Gi rutinen et navn")), nameInput = el('input'); nameInput.type = 'text'; nameInput.value = routine.name;nameInput.placeholder=t("For eksempel: Rolig kveld");
      nameInput.oninput = () => { routine.name = nameInput.value; headingFor(heading,routine); setDirty(); }; nameLabel.append(nameInput); body.append(nameLabel); }
      const enabledWrap = el('label', undefined, 'check'), check = el('input'); check.type = 'checkbox'; check.checked = routine.enabled;
      check.onchange = () => { routine.enabled = check.checked;headingFor(heading,routine);const run=body.querySelector('[data-routine-start]');if(run)run.disabled=!routine.enabled || !routine.actions.length;setDirty(true);onEnabledChange?.(); }; enabledWrap.append(check, document.createTextNode(custom ? t("Rutinen er aktiv") : t("Ekstra handlinger er aktive")));
      body.append(enabledWrap);
      if(custom){body.append(el('h3',t("2. Slik starter du rutinen")),el('p',t("Trykk «Start rutine» her, eller bruk Homey-kortet House Guard → Start navngitt rutine i en Flow. Velg denne rutinens navn i kortet."),'hint'),el('h3',t("3. Velg hva som skal skje")),el('p',t("Legg til én eller flere handlinger, for eksempel slå på et lys, starte en Flow eller sende et varsel. Vilkår avgjør om en handling utføres når rutinen starter."),'hint'));}
      const advanced=el('details',undefined,'routine-execution');advanced.dataset.execution=routine.id;advanced.dataset.responsePart=routine.id+'-execution';advanced.open=executionOpen;
      const executionHeading=el('summary'),executionTitle=()=>{executionHeading.textContent=routine.execution==='parallel'?t("Handlingene kjøres parallelt"):t("Handlingene kjøres i rekkefølge");};executionTitle();
      const executionChoices=el('fieldset',undefined,'execution-choices');executionChoices.append(el('legend',t("Rekkefølge på handlingene")));
      for(const [value,label,help] of [['sequential',t("I rekkefølge"),t("Følger listen og venter på eventuell tilstandsbekreftelse.")],['parallel',t("Parallelt"),t("Følger hver handlings forsinkelse og eventuelle avhengigheter.")]]){
        const choice=el('label',undefined,'execution-choice'),radio=el('input'),copy=el('span');radio.type='radio';radio.name='routine-execution-'+routine.id;radio.value=value;radio.checked=routine.execution===value;
        copy.append(el('strong',label),el('small',help));choice.append(radio,copy);executionChoices.append(choice);
        radio.onchange=()=>{if(!radio.checked)return;routine.execution=value;executionTitle();setDirty(true);};
      }
      advanced.append(executionHeading,executionChoices);
      const builtin = { away: t("Alarmen følger valgene under Alarm → Oversikt."), home: t("Alarm og opplåsing følger valgene under Alarm."), night: t("Hjemmeværende i nattutvalget settes sovende. Nattalarm velges under Alarm."), morning: t("Hjemmeværende i nattutvalget settes våkne. Frakobling velges under Alarm."), arming: t("Valgt lås og garasjeport følger sikkerhetsoppsettet."), nightArrival: t("Valget over bestemmer om den ankomne settes våken. Frakobling følger valget for hjemkomst under Alarm."), alarm: t("Gjentas mens alarm er bekreftet aktiv. {zone} og {reason} kommer fra lagret alarmkontekst."), alarmOff: t("Ingen lys slukkes som standard.") }[routine.id];
      if (builtin) body.append(el('p', builtin, 'hint'));
      const alarmRule={away:'alarm-away-delay',home:'alarm-home-rule',night:'alarm-night-rule',morning:'alarm-morning-rule',nightArrival:'alarm-home-rule',firstWake:'alarm-wake-rule'}[routine.id];
      if(alarmRule){const link=el('button',t("Alarmvalg for denne hendelsen"),'settings-link');link.onclick=()=>navigateSettings({tab:'security',alarmTab:'overview',id:alarmRule});body.append(link);}
      if(['home','arming'].includes(routine.id)){const link=el('button',t("Innstillinger for lås og port"),'settings-link');link.onclick=()=>navigateSettings({tab:'security',alarmTab:'doors',id:'lock-settings'});body.append(link);}
      if(['guestActivated','guestDeactivated'].includes(routine.id))body.append(el('p',routine.id==='guestActivated'?t("Kjøres én gang når gjestemodus slås på. Legg til egne handlinger, for eksempel en Flow eller en talemelding. Pushvarselet og frakobling av alarmen er allerede innebygd."):t("Kjøres én gang når gjestemodus slås av. Legg til egne handlinger etter behov. Pushvarselet er innebygd. Vanlig borterutine starter automatisk hvis alle beboerne er borte."),'hint'));
      if (!routine.actions.length) body.append(el('p',custom?t("Trykk «Legg til handling» for å velge hva rutinen skal gjøre."):alarmEvent?t("Ingen egne handlinger valgt."):t("Ingen ekstra handlinger valgt."), 'empty'));
      routine.actions.forEach((a, index) => {
        const row = el('div', undefined, 'action-row'), copy = el('div', describeAction(a), 'action-copy');
        const delay=routine.id==='welcome'?t("Samlet ventetid: {0} s ({1} + {2})", [config.welcome.delaySeconds+a.delaySeconds, config.welcome.delaySeconds, a.delaySeconds]):`${a.delaySeconds} s`;
        copy.append(el('small', `${delay} · ${labels[a.category]} · ${a.when || t("Rutinens vilkår")}${a.condition ? t(" · med enhetsvilkår") : ''}${a.requireConfirmed ? t(" · krever bekreftet avhengighet") : ''}`));
        const remove = el('button', '×', 'icon-button'); remove.setAttribute('aria-label', t("Fjern {0}", [describeAction(a)])); remove.onclick = () => {
          if (routine.actions.some(other => other.dependsOn === a.id)) { toast(t("Fjern avhengige handlinger først.")); return; }
          routine.actions.splice(index, 1); setDirty(true); renderRoutineViews();
        };
        const edit = el('button', t("Rediger"), 'small-button'); edit.onclick = () => openAction(routine, a);
        row.append(el('span', index + 1, 'action-number'), copy, edit, remove); body.append(row);
      });
      const add = el('button', t("+ Legg til handling")); add.onclick = () => openAction(routine); body.append(add);
      const preview = el('button',t("Hva ville skjedd nå?")); preview.onclick = () => feedback.run(preview,async () => {
        try {
          const p = await api('POST','/preview',{ id:routine.id, config });
          $('preview-title').textContent = p.name; $('preview-note').textContent = `${p.note}${dirty ? t(" Noen endringer er ennå ikke lagret.") : ''}`;
          const container = $('preview-actions'); container.replaceChildren();
          if (!p.actions.length) container.append(el('p',t("Ingen handlinger i denne rutinen med det valgte oppsettet."),'empty'));
          for (const a of p.actions) { const row = el('div',undefined,'action-row'), copy = el('div',describeAction(a),'action-copy'); copy.append(el('small',`${a.builtin ? t("Innebygd") : t("Ekstra handling")} · ${a.delaySeconds} s · ${a.reason}`)); row.append(copy,el('span',resultNames[a.result] || a.result,`badge ${a.result === 'skipped' ? 'warn' : 'ok'}`)); container.append(row); }
          $('preview-dialog').showModal();
        } catch (error) { toast(error.message); }
      },{label:t("Henter …")}); body.append(preview);
      if (custom) {
        const run = el('button', t("Start rutine"));run.disabled=!routine.enabled || !routine.actions.length;run.dataset.routineStart=routine.id; run.onclick = () => feedback.run(run,async () => { try { await flush(); await api('POST', '/command', { type: 'routine', id: routine.id }); await load(); toast(t("Rutinen er startet.")); } catch (error) { toast(error.message); } }); body.append(run);
        const removeRoutine = el('button',t("Slett egen rutine"));
        removeRoutine.onclick = () => {config.routines.splice(config.routines.indexOf(routine),1);actionRoutine=null;setDirty(true);renderRoutineViews();};body.append(removeRoutine);
      }
      body.append(advanced);
      if(!custom)body.append(el('p',t("Fast hendelse. Krysset gjelder bare ekstrahandlingene dine."),'hint'));
      if(!inline||title)card.append(heading);card.append(body);
      return card;
  }
  function renderIntegrations() {
    renderApiKey();
    const container = $('integration-list'); container.replaceChildren();
    const checks = data.readiness?.checks || [], names = { ready:t("Klar"), missing:t("Krever oppsett"), off:t("Ikke valgt"), review:t("Se over") };
    const seen = new Set();
    const active = checks.filter(c => {
      const key=`${c.title}|${c.level}|${c.detail}`;
      if(c.level==='off'||c.id==='alarm-events'||seen.has(key))return false;
      seen.add(key);return true;
    });
    const issues = active.filter(c => ['missing','review'].includes(c.level));
    for (const check of [...issues,...active.filter(c=>c.level==='ready')]) { const row = el('div', undefined, 'integration-row'), copy = el('div'); copy.append(el('strong',check.title),el('p',check.detail)); row.append(copy,el('span',names[check.level],`badge ${check.level === 'ready' ? 'ok' : 'warn'}`)); container.append(row); }
    const issueCount = issues.length + (data.catalog.errors || []).length;
    const pending=HouseGuardOnboarding.checklist(config,data,HouseGuardOnboarding.inferFeatures(config)).filter(c=>c.required&&!c.ready),next=pending[0];
    const attention=next || issues[0];
    $('home-attention').hidden = !config.setupCompleted || (!attention && !config.observation && !issueCount);
    $('home-attention-text').textContent = next ? next.title : attention ? attention.title : config.observation ? t("Fullfør oppsettet") : t("Kontroller Homey-forbindelsen");
    $('home-attention-detail').textContent = next?.detail || attention?.detail || (config.observation?t("Huset styres ikke automatisk. Se over oppsettet før du tar appen i bruk."):t("Se systemstatus for mer informasjon."));
    $('show-system-status').dataset.setupStep=next?.step || (!attention && config.observation?'finish':'');
    $('show-system-status').textContent=next?t("Fullfør oppsett"):!attention && config.observation?t("Se over og ta i bruk"):t("Se detaljer");
    $('system-status-heading').textContent = issueCount ? t("Systemstatus · {0} å se over", [issueCount]) : t("Systemstatus · Alt klart");
    const deliveries = $('delivery-status'); deliveries.replaceChildren(el('h3',t("Siste leveringsresultater")));
    const recent = data.readiness?.deliveries?.slice(-5) || [];
    if (!recent.length) deliveries.append(el('p',t("Ingen varsler er sendt ennå."),'hint'));
    for (const d of recent.reverse()) deliveries.append(el('p',`${new Date(d.at).toLocaleString(locale(),{timeZone:config.timeZone})} · ${kinds[d.kind] || t("Nattspørsmål")} · ${resultNames[d.result]}${d.detail ? ` · ${d.detail}` : ''}`,'summary-line'));
    for (const error of data.catalog.errors || []) container.append(el('p', error, 'error'));
  }
  function renderApiKey() {
    const status=data?.direct || data?.catalog?.direct || {};
    $('direct-api-heading').textContent = t("API-nøkkel · {0}", [status.ready?t("Klar"):status.configured?t("Må kontrolleres"):t("Ikke satt opp")]);
    const panel=$('direct-api-settings');
    if(!panel.dataset.initialized){panel.open=!status.ready;panel.dataset.initialized='true';}
    $('direct-api-status').textContent=apiKeyMessage || (status.configured?(status.ready?t("API-nøkkel er klar. Nøkkelen er lagret."):status.problem || t("Forbindelsen må kontrolleres.")):t("Legg inn API-nøkkel for direkte Flow-start, push og Sonos."));
    $('direct-api-key').disabled=apiKeyBusy || demo;
    feedback.disable($('direct-api-check'),demo || !status.configured,apiKeyBusy);
    feedback.disable($('direct-api-remove'),demo || !status.configured,apiKeyBusy);
  }
  async function updateApiKey(body,rethrow=false) {
    if(apiKeyBusy)return;apiKeyBusy=true;apiKeyMessage=t("Kontrollerer og lagrer …");renderApiKey();
    try{await flush();const result=await api('PUT','/api-key',body);$('direct-api-key').value='';data.direct=result;apiKeyMessage='';await load();}
    catch(error){$('direct-api-key').value='';apiKeyMessage=error.message;if(rethrow)throw error;}
    finally{apiKeyBusy=false;renderApiKey();}
  }
  function renderSetupEntry() {
    $('setup-intro').hidden = config.setupCompleted === true;
    $('open-setup').textContent = config.people.presence.length ? t("Fortsett oppsettet") : t("Start oppsettet");
  }
  function editConfig(change) {
    const next=structuredClone(config);change(next);config=next;setDirty(true);renderConfig();
  }
  async function refreshSetup() {
    await flush();const latest=await api('GET','/state');
    if(autosave.observe(latest.config))config=structuredClone(latest.config);
    data=latest;data.catalog=await api('GET','/catalog');renderConfig();renderStatus();
  }
  function revealSettings(node) {
    for(let parent=node;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;
  }
  function navigateSettings(target) {
    document.querySelector('[data-tab="'+target.tab+'"]').click();
    if(target.alarmTab)document.querySelector('[data-alarm-tab="'+target.alarmTab+'"]').click();
    if(target.id){const node=$(target.id);if(node){revealSettings(node);node.scrollIntoView({block:'start'});}}
  }
  function navigateGuide(target) {
    navigateSettings(target);
    document.querySelectorAll('[data-guide-return]').forEach(node=>node.remove());
    const note=el('div',undefined,'banner row');note.dataset.guideReturn='true';note.append(el('span',t("Endringene lagres automatisk. Fortsett i veiviseren når du er klar.")));
    const back=el('button',t("Tilbake til veiviseren"));back.onclick=()=>{note.remove();void openSetup(target.step);};note.append(back);$(target.tab).prepend(note);
  }
  function renderConditionalFields() {
    document.querySelectorAll('[data-show-when]').forEach(node=>{node.hidden=!get(config,node.dataset.showWhen);});
    $('night-rule-help').hidden=config.night.rule!=='auto-no-answer';
    const motion=$('morning-motion-settings');if(!motion.dataset.initialized){motion.open=!!config.morning.motion.enabled;motion.dataset.initialized='true';}
    const sunset=config.welcome.lightMode==='sunset',welcomeMotion=config.welcome.sensorType==='motion';
    document.querySelectorAll('[data-welcome-lux]').forEach(node=>{node.hidden=sunset;});
    $('welcome-sensor-label').textContent=welcomeMotion?t("Bevegelsessensor"):t("Dørkontakt");
    $('welcome-delay-label').textContent=welcomeMotion?t("Vent etter bevegelse (sekunder)"):t("Vent etter døråpning (sekunder)");
    $('welcome-sunset-help').hidden=!sunset;
    const warning=$('welcome-sunset-warning');warning.hidden=!sunset || !!data.direct?.ready || demo;
    warning.textContent=t("Legg inn eller kontroller API-nøkkelen under Innstillinger før velkomstlys etter solnedgang kan brukes.");
  }
  function renderAlarmChecklist() {
    const root=$('alarm-setup-checklist');root.replaceChildren();
    if(config.security.alarmDeviceId!=='house-guard-internal-alarm'){root.append(el('p',t("Velg alarmen over for å sette opp sensorer og automatikk."),'hint'));return;}
    for(const [title,copy,tab]of [
      [t("Sensorer"),config.security.intrusion.sensors.length+t(" valgt · velg borte og natt"),'sensors'],
      [t("Automatikk"),t("Velg når alarmen kobles til og fra"),'overview'],
      [t("Varsler og test"),config.people.notifications.length+t(" mottakere · prøv varsling på telefonen"),'notifications']
    ]){const button=el('button',undefined,'setup-shortcut');button.append(el('strong',title),el('small',copy));button.onclick=()=>{document.querySelector('[data-alarm-tab="'+tab+'"]').click();if(tab==='overview'){$('alarm-automation').open=true;$('alarm-automation').scrollIntoView({block:'start'});}};root.append(button);}
  }
  function renderAlarmResponses() {
    HouseGuardAlarm.render({root:$('alarm-responses'),config,data,el,options,deviceItems,changed:setDirty,api,flush,demo,renderRoutine:(id,onEnabledChange,executionOpen)=>renderRoutine(config.routines.find(r=>r.id===id),{inline:true,onEnabledChange,executionOpen})});
  }
  function environmentContext() { return { config, data, el, options, changed:setDirty, api, flush, load, toast, demo }; }
  function renderEnvironment() { HouseGuardEnvironment.render(environmentContext()); }
  function initializeAlarmTabs() {
    const tabs=[...document.querySelectorAll('[data-alarm-tab]')];
    function select(tab,focus=false) {
      for(const button of tabs){const selected=button===tab;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;}
      document.querySelectorAll('[data-alarm-panel]').forEach(panel=>{panel.hidden=panel.dataset.alarmPanel!==tab.dataset.alarmTab;});
      if(focus)tab.focus();
    }
    tabs.forEach((tab,index)=>{
      tab.onclick=()=>select(tab);
      tab.onkeydown=event=>{
        const next={ArrowRight:(index+1)%tabs.length,ArrowLeft:(index+tabs.length-1)%tabs.length,Home:0,End:tabs.length-1}[event.key];
        if(next===undefined)return;event.preventDefault();select(tabs[next],true);
      };
    });
  }
  function renderConfig() { document.querySelectorAll('[data-app-version]').forEach(node=>node.textContent=data.version || ''); renderAlarmResponses(); renderEnvironment(); renderSetupEntry(); fillBindings(); renderPeople(); renderRoutines(); renderIntegrations(); renderConnectionRecipes(); renderIntrusion(); renderConditionalFields(); renderAlarmChecklist(); }
  function renderIntrusionStatus() {
    const s=data.intrusion;if(!s)return;
    const phase=s.active?t("ALARM UTLØST"):s.entryAt?t("Inngangsforsinkelse"):s.target?t("Utgangsforsinkelse"):{disarmed:t("Frakoblet"),armed:t("Tilkoblet"),partially_armed:t("Delvis")}[s.mode];
    const seconds=Math.max(0,Math.ceil(((s.entryAt || s.exitAt || 0)-Date.now())/1000));
    const disabled=s.disabledSensors || [],modeName=mode=>mode==='armed'?t("full alarm"):t("nattalarm");
    const disabledText=disabled.length?t("Deaktivert fra Flow: ")+disabled.map(sensor=>`${data.catalog.devices[sensor.deviceId]?.name || sensor.name} (${modeName(sensor.mode)})`).join(', ')+'.':'';
    const currentMode=s.target || s.mode,emptyWarning=currentMode!=='disarmed' && s.sensorCounts?.[currentMode]===0?t("Ingen sensorer overvåkes i denne alarmmodusen."):'';
    $('intrusion-status').textContent=`${s.observation?t("Oppsett ikke fullført · "):''}${phase}${s.entryAt || s.target?` · ${seconds} s`:''}${s.context && (s.active || s.entryAt)?` · ${s.context.zone} · ${s.context.reason}`:''}${s.faults.length?` · ${s.faults.join(' · ')}`:''}`;
    $('home-alarm-phase').textContent=s.selected?phase:t("Alarm ikke aktivert");
    $('intrusion-status').textContent+=[disabledText,emptyWarning].filter(Boolean).map(text=>' · '+text).join('');
    $('home-alarm').classList.toggle('alarm-active',!!s.active);
    $('home-alarm-details').textContent=!s.selected?t("Slå på House Guard-alarm under Alarm."):[
      s.observation?t("Fullfør oppsettet for å bruke alarmen."):'',
      s.context && (s.active || s.entryAt)?s.context.zone+' · '+s.context.reason:'',
      s.target || s.entryAt?seconds+t(" sekunder igjen."):'',
      ...(s.faults || []),
      disabledText,emptyWarning,
    ].filter(Boolean).join(' ');
    $('home-alarm-bypassed').hidden=!s.bypassed?.length;
    $('home-alarm-bypassed').textContent=s.bypassed?.length?t("Venter på inaktive sensorer: ")+s.bypassed.map(sensor=>sensor.name+' ('+sensor.zone+')').join(', ')+t(". Resten av alarmen er tilkoblet."):'';
    feedback.disable($('home-disarm'),!s.selected || (!s.active && !s.target && !s.entryAt && s.mode==='disarmed'));
    document.querySelectorAll('[data-alarm]').forEach(button=>{if(button.dataset.alarm!=='disarmed')feedback.disable(button,!!data.config.observation);});
    document.querySelectorAll('[data-sensor-flow-status]').forEach(node=>{const [id,cap]=JSON.parse(node.dataset.sensorFlowStatus),items=disabled.filter(d=>d.deviceId===id && d.capability===cap);node.textContent=items.length?t("Deaktivert fra Flow: ")+items.map(d=>modeName(d.mode)).join(t(" og "))+t(". Bruk «Aktiver alarmsensor» for å ta den med igjen."):'';node.hidden=!items.length;});
  }
  function renderIntrusion() {
    $('intrusion-settings').hidden=config.security.alarmDeviceId!=='house-guard-internal-alarm' && !(data.intrusion?.selected && (data.intrusion.mode!=='disarmed' || data.intrusion.target || data.intrusion.active));
    const wrap=$('intrusion-sensors'),query=$('sensor-search').value.toLocaleLowerCase(locale());wrap.replaceChildren();
    const sensors=config.security.intrusion.sensors, choices=HouseGuardAlarmSensors.discover(data.catalog,config);
    $('sensor-counts').textContent=t("{0} valgt for bortealarm · {1} for nattalarm", [sensors.filter(s=>s.full).length, sensors.filter(s=>s.partial).length]);
    for(const choice of choices.sort((a,b)=>(a.d.name||'').localeCompare(b.d.name||'',locale()))) {
      const {d,cap}=choice,name=d.name||t("Mangler valgt sensor");
      if(!`${name} ${d.zone || ''}`.toLocaleLowerCase(locale()).includes(query))continue;
      const row=el('div',undefined,'person-config');row.append(el('strong',`${name} · ${d.zone || t("Uten sone")} · ${t(HouseGuardAlarmSensors.label(cap))}${d.available===false?t(" · utilgjengelig"):''}`));
      const selected=sensors.find(s=>s.deviceId===d.id && s.capability===cap),roles=el('div',undefined,'person-roles');
      for(const [key,title]of [['full',t("Borte")],['partial',t("Natt")],['delay',t("Forsinket")]]) {
        const label=el('label',undefined,'check'),check=el('input');check.type='checkbox';check.checked=!!selected?.[key];check.disabled=key==='delay'&&!selected;
        check.onchange=()=>{let sensor=sensors.find(s=>s.deviceId===d.id && s.capability===cap);if(!sensor){sensor=HouseGuardAlarmSensors.selection(choice);sensors.push(sensor);}sensor[key]=check.checked;if(!sensor.full&&!sensor.partial)sensors.splice(sensors.indexOf(sensor),1);setDirty(true);renderIntrusion();};
        label.append(check,document.createTextNode(title));roles.append(label);
      }
      row.append(roles);
      if(HouseGuardAlarmSensors.kind(cap)==='garage')row.append(el('p',t("Åpen når inngangen er {0}.",[choice.activeValue?t("På"):t("Av")])+t(" Åpen/lukket er hentet fra portoppsettet. Velg sensoren på nytt hvis portens åpen/lukket-verdi endres."),'hint'));
      if(selected){const status=el('p','','hint');status.dataset.sensorFlowStatus=JSON.stringify([d.id,cap]);row.append(status);}
      wrap.append(row);
    }
    if(!wrap.children.length)wrap.append(el('p',choices.length?t("Ingen sensorer passer søket."):t("Ingen dør- eller bevegelsessensorer funnet. Oppdater enheter under Innstillinger."),'hint'));
    renderIntrusionStatus();
  }
  function renderConnectionRecipes() {}
  async function openSetup(target) {
    try {await wizard.open(typeof target==='string'?target:undefined);}catch(error){toast(error.message);}
  }
  async function load(initial = false) {
    try {
      data = await api('GET', '/state');
      if (!autosave) {
        config = structuredClone(data.config);
        autosave = HouseGuardAutosave.create({ initial:config, write:body=>api('PUT','/config',body), read:async()=>(await api('GET','/state')).config, validate:body=>api('POST','/validate',body), onState:savingState,
          onSaved:saved=>{ data.config = saved; config.revision = saved.revision; config.bridges = structuredClone(saved.bridges); config.timeZone = saved.timeZone; renderSetupEntry(); } });
        renderConfig(); savingState({phase:'saved',pending:false});
      } else if (autosave.observe(data.config)) { config = structuredClone(data.config); renderConfig(); }
      autosave.recover();
      renderStatus();
    } catch (error) { $('connection').textContent = t("Kunne ikke lese Homey: {0}", [error.message]); $('connection').className = 'banner error'; }
  }
  function scalar(value) { if (value === 'true') return true; if (value === 'false') return false; if (value.trim() && Number.isFinite(Number(value))) return Number(value); return value; }
  function updateActionFields() {
    const kind = $('action-kind').value, device = ['set', 'verify', 'speak', 'sound'].includes(kind);
    const show = (cls, on) => document.querySelectorAll(`.${cls}`).forEach(e => { e.hidden = !on; });
    show('action-device', device); show('action-cap', ['set', 'verify'].includes(kind)); show('action-value', ['set', 'verify', 'person'].includes(kind));
    show('action-flow', kind === 'flow'); show('action-person', kind === 'person'); show('action-text', ['notify', 'timeline', 'speak', 'sound'].includes(kind));
    show('action-notification', kind === 'notify');
    show('action-volume', ['speak', 'sound'].includes(kind)); show('action-confirm', ['set', 'verify', 'person'].includes(kind));
    options($('action-device'), deviceItems(kind === 'verify' ? 'any' : ['speak', 'sound'].includes(kind) ? 'speaker_playing' : 'writable'), $('action-device').value);
    updateCapabilities();
  }
  function updateCapabilities() {
    const d = data.catalog.devices[$('action-device').value], verify = $('action-kind').value === 'verify';
    const protectedDevice = d && (d.class === 'lock' || d.capabilities.locked || d.capabilities.lock_unlock_open || [config.security.lockDeviceId,config.security.garage.commandDeviceId].includes(d.id));
    options($('action-capability'), Object.entries(d?.capabilities || {}).filter(([id, c]) => verify || (c.setable && !protectedDevice && !/^(locked|lock_unlock_open)(\.|$)|^homealarm_state$/.test(id))).map(([id, c]) => ({ id, label: `${c.title || id} (${id})` })), '', t("Velg funksjon"));
    updateActionValue();
  }
  function updateActionValue() {
    const kind=$('action-kind').value,cap=data.catalog.devices[$('action-device').value]?.capabilities[$('action-capability').value],value=$('action-value').value;
    let choices=[];
    if(kind==='person')choices=[{id:'false',label:t("Våken")},{id:'true',label:t("Sovende")}];
    else if(cap?.type==='boolean')choices=[{id:'true',label:$('action-capability').value==='onoff'?t("På"):t("Aktiv / ja")},{id:'false',label:$('action-capability').value==='onoff'?t("Av"):t("Inaktiv / nei")}];
    else if(cap?.type==='enum')choices=(cap.values || []).map(v=>({id:typeof v==='string'?v:v.id,label:typeof v==='string'?v:typeof v.title==='object'?HouseGuardI18n.title(v.title, v.id):(v.title || v.id)}));
    $('action-value').hidden=choices.length>0;$('action-value-choice').hidden=!choices.length;
    if(choices.length)options($('action-value-choice'),choices,value,t("Velg resultat"));
    $('action-value').placeholder=cap?.type==='number'?t("Tall{0}{1}", [cap.min!==undefined && cap.max!==undefined?t(" mellom {0} og {1}", [cap.min, cap.max]):'', cap.units?` (${cap.units})`:'']):t("Skriv ønsket verdi");
  }
  function updateConditionCapabilities(value = '') {
    const d = data.catalog.devices[$('condition-device').value];
    options($('condition-capability'), Object.entries(d?.capabilities || {}).filter(([, c]) => c.getable !== false).map(([id, c]) => ({ id, label: `${c.title || id} (${id})` })), value);
  }
  function openAction(routine, existing = null) {
    actionRoutine = routine; editedAction = existing; actionChanged = false; $('action-form').reset(); $('action-error-message').textContent = '';
    $('action-advanced').open=!!(existing?.when || existing?.condition || existing?.dependsOn || existing?.onError==='continue' || existing?.confirmSeconds && existing.confirmSeconds!==60);
    $('action-also-timeline').checked=!!existing?.alsoTimeline;
    $('action-title').textContent = existing ? t("Rediger handling") : t("Legg til handling");
    options($('action-category'), Object.entries(labels).map(([id, label]) => ({ id, label })), 'lights', null);
    options($('action-flow'), data.catalog.flows.map(f => ({ id: `${f.type}:${f.id}`, label: `${f.name}${f.broken ? t(" · brutt") : ''}` })), '');
    options($('action-person'), Object.values(data.catalog.people).map(p => ({ id: p.id, label: p.name })), '');
    options($('action-camera'), Object.values(data.catalog.devices).filter(d => d.class === 'camera').map(d => ({ id: d.id, label: `${d.name} · ${d.zone}` })), existing?.imageDeviceId || '');
    options($('condition-device'), deviceItems(), existing?.condition?.deviceId || ''); updateConditionCapabilities(existing?.condition?.capability);
    if (existing?.condition) { $('condition-value').value = String(existing.condition.value); $('condition-operator').value = existing.condition.operator; $('condition-age').value = existing.condition.maxAgeSeconds; }
    options($('action-dependency'), routine.actions.slice(0, existing ? routine.actions.indexOf(existing) : routine.actions.length).map(a => ({ id: a.id, label: describeAction(a) })), '', t("Ingen"));
    if (existing) $('action-kind').value = existing.kind;
    updateActionFields();
    if (existing) {
      for (const [field, value] of Object.entries({ category: existing.category, device: existing.deviceId || '', person: existing.personId || '', flow: existing.flowId ? `${existing.flowType}:${existing.flowId}` : '', value: existing.value ?? '', text: existing.text || '', volume: existing.volume ?? 35, delay: existing.delaySeconds, when: existing.when || '', error: existing.onError, dependency: existing.dependsOn || '', confirm: existing.confirmSeconds || 60, notification: existing.notificationType || 'normal' })) $('action-' + field).value = String(value);
      updateCapabilities();
      $('action-capability').value = existing.capability || '';
    }
    updateActionValue();$('action-dialog').showModal();
  }
  function download(filename, value) {
    const a = el('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' })); a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  async function initialize() {
    await HouseGuardI18n.initialize(demo ? { getLanguage: () => window.HouseGuardPreviewLanguage || 'en' } : homey, document);
    initializeAlarmTabs();
    HouseGuardEnvironment.initializeTabs();
    wizard=HouseGuardWizard.create({el,api,flush,demo,read:()=>({config,data}),change:editConfig,replace:next=>{config=next;setDirty(true);renderConfig();},refresh:refreshSetup,reload:load,key:body=>updateApiKey(body,true),navigate:navigateGuide});
    bindEvents(); await load(true); if (homey) homey.ready();
    $('open-setup').onclick=()=>feedback.run($('open-setup'),()=>openSetup(),{label:t("Åpner …")});$('reopen-setup').onclick=()=>feedback.run($('reopen-setup'),()=>openSetup('features'),{label:t("Åpner …")});
    $('sensor-search').oninput=renderIntrusion;
    $('show-system-status').onclick=()=>{
      const step=$('show-system-status').dataset.setupStep;
      if(step){void openSetup(step);return;}
      document.querySelector('[data-tab=more]').click();$('system-status').open=true;$('system-status-heading').focus();$('system-status').scrollIntoView({block:'start'});
    };
    document.querySelectorAll('[data-tab]').forEach(button => button.onclick = () => { if(button.dataset.tab==='security')renderAlarmResponses(); document.querySelectorAll('.panel').forEach(panel => { panel.hidden = panel.id !== button.dataset.tab; }); document.querySelectorAll('[data-tab]').forEach(b => { b.classList.toggle('active', b === button); if (b === button) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); }); });
    document.querySelectorAll('[data-command]').forEach(button => button.onclick = () => feedback.run(button,async () => {
      const mode=button.dataset.command;
      try { await flush(); await api('POST', '/command', ['home','away'].includes(mode) ? {type:'presence',present:mode==='home'} : mode === 'skip' ? { type: 'skip' } : { type: 'mode', mode }); await load(); toast(t("Kommando behandlet. Se status og logg.")); }
      catch (error) { toast(error.message);await load().catch(()=>{}); }
      finally {renderHomeControls();}
    },{peers:document.querySelectorAll('[data-command]')}));
    document.querySelectorAll('[data-alarm]').forEach(button=>button.onclick=()=>feedback.run(button,async()=>{try{if(button.dataset.alarm!=='disarmed')await flush();await api('POST','/command',{type:'alarm',mode:button.dataset.alarm});if(button.dataset.alarm==='disarmed')await flush();await load();}catch(error){toast(error.message);}},{peers:document.querySelectorAll('[data-alarm="'+button.dataset.alarm+'"]')}));
    document.querySelectorAll('[data-control]').forEach(button=>button.onclick=()=>feedback.run(button,async()=>{
      const target=button.dataset.control,value=button.dataset.controlValue==='true';
      if(controlBusy.has(target))return;controlBusy.add(target);delete controlErrors[target];renderHomeControls();
      try{await flush();await api('POST','/command',{type:'control',target,value});await load();}
      catch(error){controlErrors[target]=error.message;}
      finally{controlBusy.delete(target);renderHomeControls();}
    },{peers:document.querySelectorAll('[data-control="'+button.dataset.control+'"]')}));
    $('guest-toggle').onchange = async event => { const value=event.target.checked;event.target.disabled=true;try { await flush(); await api('POST', '/command', { type: 'guest', value }); await load(); } catch (error) { toast(error.message); event.target.checked = data.status.guest; } finally{event.target.disabled=false;} };
    document.querySelectorAll('[data-scenario]').forEach(button => button.onclick = async () => { try { await api('POST', '/scenario', { scenario: button.dataset.scenario }); await load(); } catch (error) { toast(error.message); } });
    $('reload-config').onclick = () => feedback.run($('reload-config'),async () => {
      try { const latest = await api('GET','/state'); autosave.reset(latest.config); data = latest; config = structuredClone(latest.config); renderConfig(); renderStatus(); }
      catch(error) { toast(error.message); }
    },{label:t("Laster …")});
    $('new-routine').onclick = () => { const routine={ id: `custom-${crypto.randomUUID()}`, name: t("Egen rutine {0}", [config.routines.filter(r => r.id.startsWith('custom')).length + 1]), enabled: true, execution: 'sequential', actions: [] };config.routines.push(routine);setDirty(true);renderRoutines();const card=$('routine-'+routine.id);revealSettings(card);card.scrollIntoView({block:'start'}); };
    $('action-kind').onchange = updateActionFields; $('action-device').onchange = updateCapabilities; $('action-capability').onchange=updateActionValue;$('action-value-choice').onchange=()=>{$('action-value').value=$('action-value-choice').value;};$('close-action').onclick = () => $('action-dialog').close();
    $('condition-device').onchange = () => updateConditionCapabilities();
    function saveAction(immediate = false) {
      try {
        const kind = $('action-kind').value, a = { id: editedAction?.id || `action-${crypto.randomUUID()}`, kind, category: $('action-category').value, delaySeconds: Number($('action-delay').value), onError: $('action-error').value };
        if ([...$('action-form').elements].some(input => !input.closest('[hidden]') && !input.checkValidity())) throw new Error(t("Fullfør feltene med gyldige verdier."));
        if (editedAction?.setupManaged === true) a.setupManaged = true;
        if (['set', 'verify', 'speak', 'sound'].includes(kind)) a.deviceId = $('action-device').value;
        if (['set', 'verify'].includes(kind)) { a.capability = $('action-capability').value; if (!a.deviceId || !a.capability) throw new Error(t("Velg enhet og funksjon.")); }
        if (['set', 'verify', 'person'].includes(kind)) { const raw=$('action-value').value,cap=data.catalog.devices[a.deviceId]?.capabilities[a.capability];a.value=cap?.type==='enum'?raw:scalar(raw); a.confirmSeconds = Number($('action-confirm').value); if (raw === '') throw new Error(t("Velg ønsket resultat.")); }
        if (kind === 'person') { a.personId = $('action-person').value; if (!a.personId || typeof a.value !== 'boolean') throw new Error(t("Velg person og om personen skal være våken eller sovende.")); }
        if (kind === 'flow') { const selected = $('action-flow').value; if (!selected) throw new Error(t("Velg en Flow.")); [a.flowType, a.flowId] = selected.split(':'); }
        if (['notify', 'timeline', 'speak', 'sound'].includes(kind)) { a.text = $('action-text').value; if (!a.text.trim()) throw new Error(t("Skriv tekst eller lydnavn.")); }
        if (kind === 'notify') { a.alsoTimeline=$('action-also-timeline').checked; a.notificationType = $('action-notification').value; a.imageDeviceId = $('action-camera').value; if (a.notificationType === 'image' && !a.imageDeviceId) throw new Error(t("Velg kamera for bildevarsel.")); }
        if (['speak', 'sound'].includes(kind)) { a.volume = Number($('action-volume').value); if (!a.deviceId || !a.volume) throw new Error(t("Velg lydenhet og et volum fra 1 til 100.")); }
        if ($('action-when').value) a.when = $('action-when').value;
        if ($('condition-device').value) {
          if (!$('condition-capability').value || $('condition-value').value === '') throw new Error(t("Fullfør det ekstra enhetsvilkåret."));
          a.condition = { deviceId: $('condition-device').value, capability: $('condition-capability').value, operator: $('condition-operator').value, value: scalar($('condition-value').value), maxAgeSeconds: Number($('condition-age').value) };
        }
        if ($('action-dependency').value) { a.dependsOn = $('action-dependency').value; a.requireConfirmed = true; }
        actionRoutine = config.routines.find(r=>r.id===actionRoutine.id);
        const index = actionRoutine.actions.findIndex(item=>item.id===a.id);
        if (index >= 0) actionRoutine.actions[index] = a; else actionRoutine.actions.push(a);
        editedAction = a;
        $('action-error-message').textContent = ''; setDirty(immediate); renderRoutineViews(); return true;
      } catch (error) { $('action-error-message').textContent = t("Ikke lagret: {0}", [error.message]); return false; }
    }
    $('action-form').addEventListener('input', event => { if (!['SELECT','INPUT','TEXTAREA'].includes(event.target.tagName) || ['checkbox','select-one'].includes(event.target.type)) return; actionChanged = true; saveAction(); });
    $('action-form').addEventListener('change', () => { actionChanged = true; saveAction(true); });
    $('action-form').onsubmit = event => { event.preventDefault(); if (actionChanged && !saveAction(true)) return; return feedback.run($('action-form').querySelector('[type="submit"]'),async()=>{try { await flush(); $('action-dialog').close(); } catch(error) { $('action-error-message').textContent = t("Ikke lagret: {0}", [error.message]); }},{label:t("Lagrer …")}); };
    $('log-filter').onchange = renderStatus;
    $('refresh-catalog').onclick = () => feedback.run($('refresh-catalog'),async () => { try { data.catalog = await api('GET', '/catalog'); renderConfig(); toast(t("Personer og enheter oppdatert.")); } catch (error) { toast(error.message); } },{label:t("Oppdaterer …")});
    $('direct-api-key').onchange=()=>{const token=$('direct-api-key').value.trim();if(token)void updateApiKey({token});};
    $('direct-api-key').onpaste=()=>setTimeout(()=>{const token=$('direct-api-key').value.trim();if(token)void updateApiKey({token});},0);
    $('direct-api-check').onclick=()=>feedback.run($('direct-api-check'),()=>updateApiKey({check:true}),{peers:[$('direct-api-remove')],label:t("Kontrollerer …")});
    $('direct-api-remove').onclick=()=>feedback.run($('direct-api-remove'),()=>updateApiKey({token:''}),{peers:[$('direct-api-check')],label:t("Fjerner …")});
    $('export-config').onclick = () => download('house-guard-oppsett.json', config);
    $('export-log').onclick = () => download('house-guard-logg.json', data.status.history);
    $('import-config').onchange = async event => {
      try { const file = event.target.files[0]; if (!file || file.size > 1000000) throw new Error(t("Velg en JSON-fil under 1 MB.")); await flush(); const imported = JSON.parse(await file.text()); config = await api('POST', '/validate', { ...imported, setupCompleted:false, observation: true, revision: config.revision }); setDirty(true); renderConfig(); await flush(); toast(t("Oppsett importert. Fullfør veiviseren for å ta det i bruk.")); }
      catch (error) { toast(t("Import feilet: {0}", [error.message])); }
    };
    window.addEventListener('online', () => { flush().catch(()=>{}); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) flush().catch(()=>{}); });
    setInterval(() => { if (!document.hidden && !$('action-dialog').open && !$('setup-dialog').open) load(); }, 5000);
  }
  window.onHomeyReady = h => { homey = h; initialize().catch(e => { $('connection').textContent = e.message; homey.ready(); }); };
  if (new URLSearchParams(location.search).get('demo') === '1') { demo = true; initialize().catch(e => { $('connection').textContent = e.message; }); }
})();
