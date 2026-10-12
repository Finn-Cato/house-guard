'use strict';
window.HouseGuardAlarm = (() => {
  const t = (source, values = []) => typeof HouseGuardI18n === 'undefined' ? String(source).replace(/\{(\d+)\}/g, (_, index) => String(values[index] ?? '')) : HouseGuardI18n.t(source, values);
  const locale = () => typeof HouseGuardI18n === 'undefined' ? 'nb-NO' : HouseGuardI18n.locale;

  const events = {get alarm() { return t("Når alarmen utløses"); },get arming() { return t("Ved tilkoblingsforsinkelse"); },get entryDelay() { return t("Ved inngangsforsinkelse"); },get activeSensor() { return t("Når en sensor er aktiv ved tilkobling"); },get alarmOff() { return t("Når alarmen avstilles"); }};
  const when = () => [{id:'',label:t("Alltid")},{id:'home',label:t("Når noen er hjemme")},{id:'away',label:t("Når alle er borte")},{id:'asleep',label:t("Når noen hjemme sover")},{id:'awake',label:t("Når ingen hjemme sover")},{id:'night',label:t("I nattmodus")}];
  const sounds = new Map();
  let testing = false;
  function render({root,config,data,el,options,deviceItems,changed,api,flush,demo,renderRoutine}) {
    const opened = new Set([...root.querySelectorAll('details[open][data-event]')].map(e=>e.dataset.event));
    const parts = new Map([...root.querySelectorAll('details[data-response-part]')].map(e=>[e.dataset.responsePart,e.open]));
    const first = !root.children.length;
    const testControls=[];
    const testDisabled=type=>testing||demo||!data.direct?.ready||!config.people.notifications.length||(type==='image'&&!config.security.responses.alarm.imageDeviceIds.length);
    root.replaceChildren();
    {
      const recipients=el('div',undefined,'card');recipients.append(el('h2',t("Hvem får varsler?")),el('p',config.people.notifications.length?config.people.notifications.map(id=>data.catalog.people[id]?.name || t("Utilgjengelig person")).join(', '):t("Ingen mottakere valgt."),'hint'));
      const choose=el('button',t("Velg mottakere"));choose.onclick=()=>document.querySelector('[data-tab="people"]').click();recipients.append(choose);
      if(!data.direct?.ready){recipients.append(el('p',t("Koble til Homey for å sende varsler direkte."),'hint'));const connect=el('button',t("Koble til Homey"));connect.onclick=()=>{document.querySelector('[data-tab="more"]').click();document.getElementById('direct-api-settings').open=true;document.getElementById('direct-api-settings').scrollIntoView({block:'start'});};recipients.append(connect);}
      root.append(recipients);
    }
    const devices = Object.values(data.catalog.devices || {});
    const speakers = devices.filter(d=>d.driverId?.includes('sonos') && d.available !== false).map(d=>({id:d.id,label:`${d.name} · ${d.zone || ''}`}));
    const lights = devices.filter(d=>d.class==='light' && d.capabilities?.onoff?.setable && ![config.security.lockDeviceId,config.security.garage.commandDeviceId].includes(d.id)).map(d=>({id:d.id,label:`${d.name} · ${d.zone || ''}`}));
    const rerender=()=>render({root,config,data,el,options,deviceItems,changed,api,flush,demo,renderRoutine});
    function part(parent,id,name,title,defaultOpen=false) {
      const panel=el('details',undefined,'response-part'),key=id+'-'+name;
      panel.dataset.responsePart=key;panel.open=parts.has(key)?parts.get(key):defaultOpen;
      panel.append(el('summary',title));parent.append(panel);return panel;
    }
    function field(parent,title,object,key,type='text',items) {
      const label=el('label',type==='checkbox'?undefined:title,type==='checkbox'?'check':undefined);
      const input=el(items?'select':'input');
      if(items) options(input,items,object[key],null);
      else {input.type=type;if(type==='checkbox')input.checked=object[key];else input.value=typeof HouseGuardI18n==='undefined'?object[key]:HouseGuardI18n.defaultMessage(object[key]);}
      if(type==='number'){input.min='1';input.max='100';}
      const update=()=>{if(!input.checkValidity())return;object[key]=type==='checkbox'?input.checked:type==='number'?Number(input.value):input.value;changed(type==='checkbox'||!!items);for(const [button,type] of testControls)HouseGuardButtons.disable(button,testDisabled(type));};
      if(type==='text'||type==='number')input.oninput=update;else input.onchange=update;
      label.append(input);if(type==='checkbox')label.append(document.createTextNode(title));parent.append(label);return input;
    }
    function remove(parent,items,item,title) { const button=el('button',title);button.onclick=()=>{items.splice(items.indexOf(item),1);changed(true);rerender();};parent.append(button); }
    for(const [id,title] of Object.entries(events)) {
      const r=config.security.responses[id],card=el('details',undefined,'card');card.dataset.event=id;card.open=opened.has(id)||(first&&id==='alarm');
      card.id='alarm-event-'+id;
      card.append(el('summary',title));const eventBody=el('div',undefined,'details-body'),grid=el('div',undefined,'form-grid');card.append(eventBody);eventBody.append(el('h3',t("Push og tidslinje")),grid);root.append(card);
      let body=eventBody;
      field(grid,t("Send push til valgte mottakere"),r,'push','checkbox');
      field(grid,t("Bruk kritisk push"),r,'critical','checkbox');
      const cameraPanel=part(body,id,'cameras',t("Kamerabilder")+(r.imageDeviceIds.length?' · '+r.imageDeviceIds.length+t(" valgt"):t(" (valgfritt)")),r.imageDeviceIds.length>0);
      const cameras=deviceItems('camera');
      for(const cameraId of r.imageDeviceIds) {
        const row=el('div',undefined,'row');row.append(el('span',cameras.find(c=>c.id===cameraId)?.label || (data.catalog.devices?.[cameraId]?.name || cameraId)+t(" · utilgjengelig")));
        remove(row,r.imageDeviceIds,cameraId,t("Fjern kamera"));cameraPanel.append(row);
      }
      const cameraAdd=el('select');options(cameraAdd,cameras.filter(c=>!r.imageDeviceIds.includes(c.id)),'',t("Legg til kamera …"));
      cameraAdd.setAttribute('aria-label',t("Legg til kamera: ")+title);cameraAdd.disabled=r.imageDeviceIds.length>=3;
      cameraAdd.onchange=()=>{if(!cameraAdd.value||r.imageDeviceIds.length>=3)return;r.imageDeviceIds.push(cameraAdd.value);changed(true);rerender();};cameraPanel.append(cameraAdd);
      cameraPanel.append(el('p',t("Velg opptil tre kameraer. Ett eget bildevarsel per kamera sendes til alle valgte pushmottakere."),'hint'));
      if(id==='alarm')field(cameraPanel,t("Send bilder også ved gjentatt alarm"),r,'imageOnRepeat','checkbox');
      field(grid,t("Vis også i Homeys tidslinje"),r,'timeline','checkbox');
      if(id==='alarm')body.append(el('p',t("Velg mottakere under Personer → Motta pushvarsler. Alarmmeldingen sendes først, deretter ett bildevarsel per valgt kamera. Kritiske varsler må være tillatt for Homey på telefonen. Tidslinjen erstatter ikke push."),'hint'));
      if(id==='activeSensor')body.append(el('p',t("House Guard sender alltid et vanlig push om sensorer som holdes midlertidig utenfor ved tilkobling. De overvåkes automatisk når de blir inaktive. Valgene over gjelder øvrige sensorvarsler."),'hint'));
      const textOptions=part(body,id,'messages',t("Tilpass meldingene")),textBody=el('div',undefined,'form-grid');textOptions.append(textBody);
      field(textBody,t("Pushmelding"),r,'text');field(textBody,t("Tekst i tidslinjen"),r,'timelineText');textBody.append(el('p',t("{zone}, {reason}, {sensorName} og {seconds} fylles inn av House Guard."),'hint'));
      const audioPanel=part(eventBody,id,'audio',t("Lyd og lys")+(r.audio.length||r.lights.length?t(" · {0} høyttalere, {1} lys", [r.audio.length, r.lights.length]):t(" (valgfritt)")));
      body=el('div',undefined,'response-body');audioPanel.append(body);
      body.append(el('h3',t("Lyd på Sonos")));
      for(const audio of r.audio) {
        const row=el('div',undefined,'card form-grid');body.append(row);
        const speaker=field(row,t("Høyttaler"),audio,'deviceId','text',speakers);
        speaker.onchange=()=>{audio.deviceId=speaker.value;changed(true);rerender();};
        const kind=field(row,t("Beskjed"),audio,'kind','text',[{id:'sound',label:t("Alarmlyd")},{id:'speak',label:t("Tale")}]);
        kind.onchange=()=>{audio.kind=kind.value;audio.text=audio.kind==='sound'?'alarm3':t("Alarmen er utløst i {zone}. {reason}");changed(true);rerender();};
        if(audio.kind==='speak')field(row,t("Talebeskjed"),audio,'text');
        else {
          const sound=field(row,t("Alarmlyd"),audio,'text','text',sounds.get(audio.deviceId)||[{id:audio.text,label:audio.text}]);
          if(!sounds.has(audio.deviceId) && !demo)api('POST','/alarm-sounds',{deviceId:audio.deviceId}).then(items=>{sounds.set(audio.deviceId,items);if(sound.isConnected)options(sound,items,audio.text,null);}).catch(()=>{if(sound.isConnected)row.append(el('p',t("Kunne ikke hente lydlisten. Kontroller at Sonos er tilgjengelig."),'error'));});
        }
        field(row,t("Volum"),audio,'volume','number');field(row,t("Spill når"),audio,'when','text',when());remove(row,r.audio,audio,t("Fjern lydvalg"));
      }
      const audioAdd=el('select');options(audioAdd,speakers,'',t("Legg til høyttaler …"));audioAdd.setAttribute('aria-label',t("Legg til høyttaler: {0}", [title]));audioAdd.onchange=async()=>{
        const deviceId=audioAdd.value;if(!deviceId)return;audioAdd.disabled=true;
        try {
          const items=sounds.get(deviceId)||await api('POST','/alarm-sounds',{deviceId});
          if(!items.length)throw Error(t("Høyttaleren har ingen tilgjengelige alarmlyder."));
          sounds.set(deviceId,items);if(!audioAdd.isConnected)return;
          r.audio.push({deviceId,kind:'sound',text:(items.find(s=>s.id==='alarm3')||items[0]).id,volume:35,when:''});changed(true);rerender();
        } catch(error){audioAdd.disabled=false;body.append(el('p',error.message,'error'));}
      };body.append(audioAdd);
      body.append(el('h3',t("Slå på lys")));
      for(const light of r.lights) {const row=el('div',undefined,'form-grid');body.append(row);field(row,t("Lys"),light,'deviceId','text',lights);field(row,t("Slå på når"),light,'when','text',when());remove(row,r.lights,light,t("Fjern lysvalg"));}
      const lightAdd=el('select');options(lightAdd,lights.filter(d=>!r.lights.some(a=>a.deviceId===d.id)),'',t("Legg til lys …"));lightAdd.setAttribute('aria-label',t("Legg til lys: {0}", [title]));lightAdd.onchange=()=>{if(!lightAdd.value)return;r.lights.push({deviceId:lightAdd.value,when:'',confirmSeconds:60});changed(true);rerender();};body.append(lightAdd);
      if(id==='alarm'){
        const repeat=part(eventBody,id,'repeat',t("Gjentakelse mens alarmen er aktiv")),repeatBody=el('div',undefined,'form-grid');repeat.append(repeatBody);
        const enabled=field(repeatBody,t("Gjenta varsling mens alarmen er aktiv"),config.security,'repeatEnabled','checkbox');
        const interval=field(repeatBody,t("Gjenta hvert (sekunder)"),config.security,'repeatSeconds','number');interval.min='30';interval.max='3600';interval.parentElement.hidden=!enabled.checked;
        enabled.addEventListener('change',()=>{interval.parentElement.hidden=!enabled.checked;});
        repeat.append(el('p',t("Gjelder varslene, lyd, lys og egne handlinger for utløst alarm. Kamerabilder gjentas bare når det er valgt under Kamerabilder."),'hint'));
      }
      const routine=config.routines.find(r=>r.id===id);
      const extraTitle=()=>t("Egne handlinger")+(routine.actions.length?` · ${routine.actions.length}${routine.enabled?'':t(" på pause")}`:t(" (valgfritt)"));
      const extra=part(eventBody,id,'extra',extraTitle());
      extra.append(el('p',t("Legg til en egen Flow eller andre handlinger for denne hendelsen. Push, kamera, lyd og lys velges ovenfor."),'hint'),renderRoutine(id,()=>{extra.querySelector('summary').textContent=extraTitle();},parts.get(id+'-execution') || false));
    }
    const test=el('div',undefined,'card');test.append(el('h2',t("Prøv varsler på telefonen")),el('p',t("Vanlig og kritisk test sender ett varsel per mottaker. Kameratesten bruker kameraene under «Når alarmen utløses»: ")+config.security.responses.alarm.imageDeviceIds.length+t(" kameraer × ")+config.people.notifications.length+t(" mottakere = ")+(config.security.responses.alarm.imageDeviceIds.length*config.people.notifications.length)+t(" bildevarsler. Ingen alarm, lyd, lys, lås eller port aktiveres. Kritisk test kan gi lyd på telefonen."),'hint'));
    const status=el('p');status.setAttribute('role','status');const buttons=el('div',undefined,'button-row');test.append(buttons,status);root.append(test);
    for(const [type,title] of [['normal',t("Test vanlig push")],['critical',t("Test kritisk push")],['image',t("Test kameravarsler")]]) {
      const button=el('button',title);button.disabled=testDisabled(type);testControls.push([button,type]);buttons.append(button);
      button.onclick=()=>HouseGuardButtons.run(button,async()=>{if(testing)return;testing=true;status.textContent=t("Sender test …");
        try {await flush();const result=await api('POST','/direct-test',{type:'push',notificationType:type,...(type==='image'?{alarmCameras:true}:{})});status.textContent=result.results ? result.results.map(r=>r.name+': '+(r.accepted?t("akseptert av Homey"):t("feilet eller ukjent utfall – ")+r.error)).join(' · ')+t(" Kontroller bildene på telefonen.") : t("Homey har akseptert testvarselet. Kontroller at det kom på telefonen.");}
        catch(error){status.textContent=error.message;}
        finally{testing=false;for(const [button,type] of testControls)HouseGuardButtons.disable(button,testDisabled(type));}
      },{peers:buttons.children,label:t("Sender …")});
    }
    if(config.observation)test.append(el('p',t("Du kan prøve varsling før oppsettet er fullført. Disse knappene starter ingen rutiner."),'hint'));
    if(!data.direct?.ready)test.append(el('p',t("Legg inn og kontroller API-nøkkelen under Innstillinger → API-nøkkel."),'hint'));
    if(!config.people.notifications.length)test.append(el('p',t("Velg pushmottakere under Personer."),'hint'));
  }
  return {render};
})();
