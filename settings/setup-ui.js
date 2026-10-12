'use strict';
// The guide edits the same settings as the normal pages. Guide preferences never
// enable/disable a feature, and opening or navigating it never writes config.
window.HouseGuardWizard = (() => {
  const t = (source, values = []) => typeof HouseGuardI18n === 'undefined' ? String(source).replace(/\{(\d+)\}/g, (_, index) => String(values[index] ?? '')) : HouseGuardI18n.t(source, values);
  const locale = () => typeof HouseGuardI18n === 'undefined' ? 'nb-NO' : HouseGuardI18n.locale;

  const titles={get features() { return t("Hva vil du bruke House Guard til?"); },get connection() { return t("API-nøkkel"); },get people() { return t("Beboere og varsler"); },get alarm() { return t("Sett opp alarmen"); },get routines() { return t("Lys og ekstra handlinger"); },get night() { return t("Natt og morgen"); },get finish() { return t("Fullfør oppsettet"); }};
  function create(ctx) {
    const {el,api,flush,demo}=ctx,$=id=>document.getElementById(id);
    let features,step='features',storageKey,busy=false,testMessage='';
    const read=()=>ctx.read(),steps=()=>HouseGuardOnboarding.steps(features);
    function remember(){try{localStorage.setItem(storageKey,JSON.stringify({features,step}));}catch{/* Storage may be unavailable inside Homey. */}}
    function error(e){$('setup-error').textContent=e.message || String(e);}
    function button(parent,title,fn,primary=false){const b=el('button',title,primary?'primary':'');b.type='button';b.onclick=()=>HouseGuardButtons.run(b,async()=>{if(busy)return;busy=true;try{await fn();}catch(e){error(e);}finally{busy=false;}});parent.append(b);return b;}
    function choice(parent,title,checked,fn){const label=el('label',undefined,'check'),input=el('input');input.type='checkbox';input.checked=checked;input.onchange=()=>{try{fn(input.checked);}catch(e){input.checked=!input.checked;error(e);}};label.append(input,document.createTextNode(title));parent.append(label);return input;}
    function update(fn,rerender=true){ctx.change(fn);if(rerender)render();}
    function detail(parent,title){const d=el('details'),s=el('summary',title);d.append(s);parent.append(d);return d;}
    function names(ids){const {data}=read();return ids.map(id=>data.catalog.people[id]?.name || t("Utilgjengelig person")).join(', ');}
    function go(next){if(!steps().includes(next)&&['alarm','routines','night'].includes(next))features[next]=true;step=next;remember();render();$('setup-dialog').scrollTop=0;$('setup-title').focus();}
    function checks(){const {config,data}=read();return HouseGuardOnboarding.checklist(config,data,features);}
    async function open(target){
      await flush();await ctx.refresh();
      const {config,data}=read(),actual=HouseGuardOnboarding.inferFeatures(config);
      storageKey='houseguard.guide.v2:'+Object.keys(data.catalog.people || {}).sort().join(',');
      let saved;try{saved=JSON.parse(localStorage.getItem(storageKey));}catch{}
      features=Object.fromEntries(Object.keys(actual).map(key=>[key,actual[key]||saved?.features?.[key]===true]));
      step=target || (steps().includes(saved?.step)?saved.step:'features');
      if(!steps().includes(step)){if(['alarm','routines','night'].includes(step))features[step]=true;else step='features';}
      testMessage='';render();$('setup-dialog').showModal();
    }
    function render(){
      const {config,data}=read(),body=$('setup-body'),list=steps();
      $('setup-title').textContent=titles[step];$('setup-progress').textContent=t("Steg {0} av {1}", [list.indexOf(step)+1, list.length]);
      $('setup-back').hidden=step==='features';$('setup-next').hidden=step==='finish';$('setup-next').textContent=t("Neste");$('setup-error').textContent='';body.replaceChildren();
      if(step==='features'){
        body.append(el('p',t("Velg hva du vil ha hjelp til å sette opp. Du kan legge til mer senere."),'hint'));
        for(const [id,title,copy]of [['alarm',t("Alarm"),t("Overvåk huset når dere er borte eller sover.")],['routines',t("Lys og rutiner"),t("Start Homey-Flows ved borte, hjemkomst og natt.")],['night',t("Natt og morgen"),t("La huset følge hvem som sover og hvem som er våken.")]]){
          const card=el('div',undefined,'setup-choice');choice(card,title,features[id],value=>{features[id]=value;remember();render();});card.append(el('p',copy,'hint'));body.append(card);
        }
        body.append(el('p',t("Valgene tilpasser veiviseren. Funksjoner du allerede bruker fortsetter som før. Du kan også bruke bare tilstedeværelse og gjestemodus."),'hint'));
      }else if(step==='connection'){
        const direct=data.direct || data.catalog.direct || {};
        body.append(el('p',t("Forbindelsen lar House Guard starte dine Flows og sende push, kamerabilder og sovestatus direkte."),'hint'),el('p',direct.ready?t("Forbindelsen er klar."):direct.configured?t("Forbindelsen må kontrolleres."):t("Forbindelse er ikke satt opp."),direct.ready?'setup-success':'setup-notice'));
        if(!direct.ready){
          const how=el('ol',undefined,'setup-instructions');for(const text of [t("Åpne Homeys nettapp → Innstillinger → API-nøkler."),t("Opprett en nøkkel med Flows-tilgang (full tilgang)."),t("Lim inn nøkkelen nedenfor. Den lagres og kontrolleres automatisk.")])how.append(el('li',text));body.append(how);
          const label=el('label',t("API-nøkkel")),input=el('input');input.type='password';input.autocomplete='new-password';input.spellcheck=false;input.placeholder=t("Lim inn nøkkelen fra Homey");input.disabled=demo;label.append(input);body.append(label);
          const save=async()=>{const token=input.value.trim();if(!token||busy)return;busy=true;input.disabled=true;input.value='';try{await ctx.key({token});render();}catch(e){error(e);}finally{busy=false;if(input.isConnected)input.disabled=demo;}};
          input.onchange=save;input.onpaste=()=>setTimeout(save,0);
          body.append(el('p',t("Nøkkelen vises ikke igjen og blir ikke med i sikkerhetskopier. Tilgangskontrollen sender ingen varsler eller enhetskommandoer."),'hint'));
        }
        if(direct.configured)button(body,t("Kontroller forbindelse"),async()=>{await ctx.key({check:true});render();}).disabled=demo;
        if(direct.problem)body.append(el('p',direct.problem,'error'));
        if(demo)body.append(el('p',t("Demoen kobler ikke til Homey. Du kan gå gjennom resten av oppsettet."),'hint'));
        else if(!direct.ready)body.append(el('p',t("Du kan fylle ut resten først. Sjekklisten til slutt viser hvilke valgte funksjoner som trenger forbindelsen."),'hint'));
      }else if(step==='people'){
        body.append(el('p',t("Beboere teller med når huset avgjør om noen er hjemme. Velg separat hvem som skal få alle appens pushvarsler."),'hint'));
        const ids=[...new Set([...Object.keys(data.catalog.people || {}),...config.people.presence,...config.people.notifications])];
        for(const id of ids){
          const p=data.catalog.people[id],row=el('div',undefined,'person-config');row.append(el('strong',p?.name || t("Utilgjengelig person")));
          const roles=el('div',undefined,'person-roles');
          for(const [role,title]of [['presence',t("Bor her / teller med")],['notifications',t("Motta pushvarsler")]])choice(roles,title,config.people[role].includes(id),value=>update(c=>{c.people[role]=value?[...new Set([...c.people[role],id])]:c.people[role].filter(x=>x!==id);if(role==='presence'&&!value)c.people.night=c.people.night.filter(x=>x!==id);}));
          row.append(roles);if(!p||p.available===false)row.append(el('p',t("Personen er utilgjengelig i Homey."),'error'));body.append(row);
        }
        if(!ids.length)body.append(el('p',t("Ingen personer funnet. Kontroller forbindelsen og oppdater listen."),'error'));
        button(body,t("Oppdater personer"),async()=>{await ctx.refresh();render();});
      }else if(step==='alarm'){
        const selected=config.security.alarmDeviceId==='house-guard-internal-alarm';
        const alarmBusy=data.intrusion&&(data.intrusion.mode!=='disarmed'||data.intrusion.target||data.intrusion.active||data.intrusion.entryAt);
        choice(body,t("Bruk House Guard-alarm"),selected,value=>update(c=>{c.security.alarmDeviceId=value?'house-guard-internal-alarm':'';})).disabled=selected&&!!alarmBusy;
        if(selected){
          if(config.observation && data.intrusion && (data.intrusion.mode!=='disarmed'||data.intrusion.target||data.intrusion.active||data.intrusion.entryAt)){
            body.append(el('p',t("Testalarmen er fortsatt tilkoblet. Frakoble den før du endrer sensorer eller tar appen i bruk."),'setup-notice'));
            button(body,t("Frakoble alarmen"),async()=>{const live=await api('GET','/state');if(!live.config.observation)throw Error(t("Appen er nå i aktiv drift. Kontroller alarmen under Alarm."));await api('POST','/command',{type:'alarm',mode:'disarmed'});await ctx.refresh();render();});
          }
          if(!config.observation&&alarmBusy){body.append(el('p',t("Alarmen er tilkoblet. Sensorvalgene kan endres når alarmen er frakoblet."),'setup-notice'));button(body,t("Åpne alarmoversikt"),()=>{remember();$('setup-dialog').close();ctx.navigate({tab:'security',alarmTab:'overview',id:'intrusion-settings',step:'alarm'});});}
          body.append(el('h3',t("Når skal alarmen være på?")));
          body.append(el('p',t("Full bortealarm kobles alltid til når alle beboere er bekreftet borte og gjestemodus er av. De vanlige forsinkelsene gjelder."),'hint'));
          for(const [id,title]of [['night',t("Nattalarm når huset går i nattmodus")],['home',t("Frakoble når noen kommer hjem")]])choice(body,title,config.security.automation[id],value=>update(c=>{c.security.automation[id]=value;}));
          const extra=detail(body,t("Morgen og oppvåkning"));for(const [id,title]of [['firstWake',t("Frakoble når første hjemmeværende våkner")],['morning',t("Frakoble når morgenmodus starter")]])choice(extra,title,config.security.automation[id],value=>update(c=>{c.security.automation[id]=value;},false));
          body.append(el('h3',t("Hvilke sensorer skal følge med?")),el('p',t("Borte: vanligvis alle sensorer. Natt: dører og vinduer, og andre sensorer som ikke forstyrres når dere beveger dere inne."),'hint'));
          renderSensors(body,config,data);
          body.append(el('h3',t("Varsling ved alarm")));
          choice(body,t("Send push når alarmen utløses"),config.security.responses.alarm.push,value=>update(c=>{c.security.responses.alarm.push=value;}));
          body.append(el('p',config.people.notifications.length?t("Mottakere: ")+names(config.people.notifications)+'.':t("Ingen pushmottakere valgt. Velg dem i steget Beboere og varsler."),'hint'));
          body.append(el('p',t("Alarmen bruker eksisterende inn-/utgangsforsinkelser. Kamera, kritisk push, lyd, lys og forsinkelser kan tilpasses under Alarm. Gjestemodus holder alarmen frakoblet."),'hint'));
        }
      }else if(step==='routines'){
        body.append(el('p',t("Valgfritt: Velg Flows du har laget i Homey, for eksempel «Slå av alle lys». House Guards alarm trenger ingen hjelpeflow."),'hint'));
        const flows=HouseGuardSetup.flowChoices(data.catalog),selections=HouseGuardSetup.selections(config);
        for(const [id,title]of [['away',t("Når alle drar")],['home',t("Når første person kommer hjem")],['night',t("Når nattmodus starter")]]){
          const label=el('label',title,'setup-flow'),select=el('select');select.add(new Option(t("Ingen ekstra Flow"),''));
          for(const flow of flows){const option=new Option(`${flow.name}${flow.type==='advanced'?' · Advanced Flow':''}${flow.reason?' · '+flow.reason:''}`,flow.key);option.disabled=!flow.selectable;select.add(option);}
          if(selections[id]&&!flows.some(f=>f.key===selections[id])){const option=new Option(t("Valgt Flow er utilgjengelig"),selections[id]);option.disabled=true;select.add(option);}
          select.value=selections[id];select.onchange=()=>{try{ctx.replace(HouseGuardSetup.change(read().config,{flows:{[id]:select.value}},read().data.catalog));render();}catch(e){render();error(e);}};label.append(select);body.append(label);
          const routine=config.routines.find(r=>r.id===id),oldLights=routine?.actions.filter(a=>a.setupManaged&&a.kind==='set').length;
          if(oldLights)body.append(el('p',t("{0} tidligere lysvalg fra veiviseren erstattes hvis du endrer dette Flow-valget.", [oldLights]),'hint'));
          if((routine?.actions.length || 0)>1)body.append(el('p',t("Denne rutinen har flere handlinger. De kan ses og endres under Rutiner."),'hint'));
        }
        const help=detail(body,t("Om Flow-valgene"));help.append(el('p',t("Advanced Flow trenger et Start-kort. Deaktiverte Flows, Flows med feil og Flows som krever en tagg kan ikke velges. Egne handlinger beholdes; samme Flow legges ikke til to ganger."),'hint'));
        button(body,t("Oppdater Flow-listen"),async()=>{await ctx.refresh();render();});
      }else if(step==='night'){
        body.append(el('p',t("Velg hvem som skal telle med når huset går i nattmodus. Bare de som er hjemme settes sovende."),'hint'));
        for(const id of config.people.presence)choice(body,data.catalog.people[id]?.name || t("Utilgjengelig person"),config.people.night.includes(id),value=>update(c=>{c.people.night=value?[...new Set([...c.people.night,id])]:c.people.night.filter(x=>x!==id);},false));
        body.append(el('h3',t("Hva skal skje?")));
        body.append(el('p',t("Hjemmeværende i nattutvalget settes alltid sovende når nattmodus starter."),'hint'));
        choice(body,t("Ved nattankomst: sett bare den som kommer hjem våken"),config.night.wakeArrival,value=>update(c=>{c.night.wakeArrival=value;},false));
        body.append(el('p',t("Natt og morgen kan startes fra Hjem eller egne Homey-Flows. Under Rutiner setter du opp nattspørsmål i Aktivering av Nattmodus, og morgenstart, bevegelse og oppvåkning i Deaktivering av Nattmodus."),'hint'));
        for(const [title,id] of [[t("Aktivering av Nattmodus"),'night-activation-settings'],[t("Deaktivering av Nattmodus"),'alarm-deactivation-settings']])button(body,t("Åpne ")+title,()=>{remember();$('setup-dialog').close();ctx.navigate({tab:'routines',id,step:'night'});});
      }else renderFinish(body,config,data);
    }
    function renderSensors(body,config,data){
      const filter=el('input');filter.type='search';filter.placeholder=t("Søk etter sensor eller rom");filter.setAttribute('aria-label',t("Søk etter alarmsensor"));body.append(filter);
      const list=el('div',undefined,'setup-sensors');body.append(list);const choices=HouseGuardAlarmSensors.discover(data.catalog,config);
      for(const sensorChoice of choices.sort((a,b)=>`${a.d.zone||''} ${a.d.name||''}`.localeCompare(`${b.d.zone||''} ${b.d.name||''}`,locale()))){
        const {d,cap}=sensorChoice,name=d.name||t("Utilgjengelig valgt sensor");
        const row=el('div',undefined,'person-config'),selected=config.security.intrusion.sensors.find(s=>s.deviceId===d.id&&s.capability===cap);row.dataset.search=`${name} ${d.zone || ''}`.toLocaleLowerCase(locale());
        row.append(el('strong',`${name} · ${d.zone || t("Uten rom")} · ${t(HouseGuardAlarmSensors.label(cap))}`));const roles=el('div',undefined,'person-roles');
        for(const [key,title]of [['full',t("Bortealarm")],['partial',t("Nattalarm")]])choice(roles,title,!!selected?.[key],value=>update(c=>{const sensors=c.security.intrusion.sensors;let s=sensors.find(s=>s.deviceId===d.id&&s.capability===cap);if(!s){s=HouseGuardAlarmSensors.selection(sensorChoice);sensors.push(s);}s[key]=value;if(!s.full&&!s.partial)sensors.splice(sensors.indexOf(s),1);},false)).disabled=!!(data.intrusion?.selected&&(data.intrusion.mode!=='disarmed'||data.intrusion.target||data.intrusion.active||data.intrusion.entryAt));
        if(HouseGuardAlarmSensors.kind(cap)==='garage')row.append(el('p',t("Åpen når inngangen er {0}.",[sensorChoice.activeValue?t("På"):t("Av")])+t(" Åpen/lukket er hentet fra portoppsettet. Velg sensoren på nytt hvis portens åpen/lukket-verdi endres."),'hint'));
        row.append(roles);if(d.available===false)row.append(el('p',t("Utilgjengelig i Homey"),'error'));list.append(row);
      }
      filter.oninput=()=>{for(const row of list.children)row.hidden=!(row.dataset.search || '').includes(filter.value.toLocaleLowerCase(locale()));};
      if(!choices.length)list.append(el('p',t("Ingen dør- eller bevegelsessensorer funnet."),'hint'));
    }
    function renderFinish(body,config,data){
      body.append(el('p',t("Se hva som er klart, prøv et varsel og velg når huset skal styres."),'hint'));
      const items=checks(),missing=items.filter(c=>c.required&&!c.ready),list=el('ul',undefined,'setup-checklist'),completed=el('ul',undefined,'setup-checklist');
      for(const item of items){const row=el('li'),copy=el('div');copy.append(el('strong',item.title+(item.required?'':t(" (valgfritt)"))),el('p',item.detail,'hint'));row.append(el('span',item.ready?'✓':item.required?'!':'○',item.ready?'check-ok':'check-missing'),copy);if(!item.ready)button(row,t("Se oppsett"),()=>{if(item.target){remember();$('setup-dialog').close();ctx.navigate({...item.target,step:item.step});}else go(item.step);});(item.ready?completed:list).append(row);}body.append(list);
      if(completed.children.length){const done=detail(body,completed.children.length+t(" punkter er klare"));done.append(completed);}
      if(!missing.length)body.append(el('p',t("Oppsettet er klart. Prøv varsling på telefonen før du aktiverer huset."),'setup-success'));
      button(body,t("Oppdater sjekklisten"),async()=>{await ctx.refresh();render();});
      const alarm=config.security.alarmDeviceId==='house-guard-internal-alarm';
      body.append(el('p',t("Beboere: {0}. Varselmottakere: {1}.", [names(config.people.presence) || t("Ingen"), names(config.people.notifications) || t("Ingen")]),'summary-line'));
      if(alarm)body.append(el('p',t("Alarm: {0} valgt for borte, {1} for natt.", [config.security.intrusion.sensors.filter(s=>s.full).length, config.security.intrusion.sensors.filter(s=>s.partial).length]),'summary-line'));
      const selectedFlows=config.routines.filter(r=>r.enabled).flatMap(r=>r.actions.filter(a=>a.kind==='flow').map(a=>`${typeof HouseGuardI18n==='undefined'?r.name:HouseGuardI18n.routineName(r)}: ${data.catalog.flows?.find(f=>f.id===a.flowId&&f.type===a.flowType)?.name || t("Utilgjengelig Flow")}`));
      if(selectedFlows.length)body.append(el('p',t("Flows: ")+selectedFlows.join(' · '),'summary-line'));
      if(config.people.night.length)body.append(el('p',t("Teller med om natten: ")+names(config.people.night)+'.','summary-line'));
      body.append(el('h3',t("Prøv varsling")));
      const test=button(body,t("Send testvarsel"),async()=>{await flush();const result=await api('POST','/direct-test',{type:'push',notificationType:'normal'});testMessage=result.accepted===false?t("Varselet ble ikke akseptert."):t("Homey har akseptert testvarselet. Kontroller at det kom på telefonen.");render();});test.disabled=demo||!(data.direct || data.catalog.direct)?.ready||!config.people.notifications.length;
      body.append(el('p',testMessage || t("Sender ett vanlig testvarsel til hver valgt mottaker. Testen aktiverer ingen alarm eller rutiner og kan også brukes før oppsettet er ferdig."),'hint'));
      if(data.config.observation){
        body.append(el('h3',t("Ta i bruk")),el('p',t("Når du aktiverer styringen, kan alarm, rutiner, personstatus og varsler følge innstillingene dine. Kontroller at oppsummeringen stemmer."),'hint'));
        const activate=button(body,t("Ta i bruk House Guard"),async()=>{await flush();await ctx.refresh();const outstanding=checks().filter(c=>c.required&&!c.ready);if(outstanding.length){render();throw Error(t("Fullfør punktene som mangler før du aktiverer styringen."));}ctx.replace(HouseGuardOnboarding.finish(read().config));await flush();await ctx.reload();$('setup-dialog').close();remember();},true);activate.disabled=demo||missing.length>0;
        if(missing.length)body.append(el('p',t("{0} {1} fullføres før aktivering. Du kan lukke og fortsette senere.", [missing.length, missing.length===1?t("punkt må"):t("punkter må")]),'hint'));
        if(demo)body.append(el('p',t("Aktivering og testvarsler er slått av i demoen."),'hint'));
        button(body,t("Fortsett senere"),async()=>{ctx.replace(HouseGuardOnboarding.defer(read().config));await flush();await ctx.reload();$('setup-dialog').close();remember();});
      }else{
        body.append(el('p',t("Oppsettet er i bruk. Endringer lagres automatisk."),'setup-success'));
        button(body,t("Ferdig"),async()=>{update(c=>{c.setupCompleted=true;},false);await flush();await ctx.reload();$('setup-dialog').close();remember();},true);
      }
    }
    $('setup-back').onclick=()=>{if(!busy)go(steps()[steps().indexOf(step)-1]);};
    $('setup-next').onclick=()=>HouseGuardButtons.run($('setup-next'),async()=>{if(busy)return;busy=true;try{if(step==='people'&&!read().config.people.presence.length)throw Error(t("Velg minst én beboer som skal telle med."));await flush();const next=steps()[steps().indexOf(step)+1];if(next==='finish')await ctx.refresh();go(next);}catch(e){error(e);}finally{busy=false;}},{peers:[$('setup-back')]});
    $('close-setup').onclick=()=>{$('setup-dialog').close();remember();};
    $('setup-dialog').addEventListener('cancel',remember);
    return {open,render};
  }
  return {create};
})();
