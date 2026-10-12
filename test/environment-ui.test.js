'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {defaults,validate}=require('../lib/config');

// A small DOM test double exercises the production event handlers and actual
// settings markup. It cannot verify rendered pixels or replace mobile QA.
const {documentFixture}=require('./helpers/settings-dom');

function fixture(language) {
  const document=documentFixture(fs.readFileSync('settings/index.html','utf8')),config=defaults(),changes=[],requests=[],navigation=[];
  config.people.notifications=['alex'];
  const cap=(value,type='boolean',setable=false)=>({value,type,setable,getable:true});
  const devices={smoke:{id:'smoke',name:'Røykvarsler',zone:'Soverom',available:true,capabilities:{alarm_smoke:cap(false),measure_temperature:cap(22,'number')}},water:{id:'water',name:'Ny vannsensor',zone:'Bad',available:true,capabilities:{alarm_water:cap(null),measure_temperature:cap(23,'number'),measure_battery:cap(90,'number')}},
    valve:{id:'valve',name:'Vannstyring',zone:'Teknisk',class:'socket',available:true,capabilities:{onoff:cap(true,'boolean',true)}},valve2:{id:'valve2',name:'Annen vannstyring',zone:'Teknisk',class:'socket',available:true,capabilities:{onoff:cap(true,'boolean',true)}},
    lock:{id:'lock',name:'Ytterdør',class:'lock',available:true,capabilities:{locked:cap(true,'boolean',true),onoff:cap(true,'boolean',true)}},
    light:{id:'light',name:'Downlights',zone:'Soverom',class:'light',available:true,capabilities:{onoff:cap(false,'boolean',true)}}};
  for(let i=1;i<=4;i++)devices['camera'+i]={id:'camera'+i,name:'Kamera '+i,zone:'Ute',available:true,images:[{type:'camera'}],capabilities:{}};
  const data={catalog:{devices,people:{alex:{name:'Alex'}},flows:[{id:'normal',type:'normal',name:'Min Flow',enabled:true,triggerable:true},{id:'bad',type:'advanced',name:'Ikke startbar',triggerable:false}]},direct:{ready:true},environment:{enabled:false,observing:false,sensors:[],incidents:[],batches:[]}};
  const sandbox={window:{},document,HouseGuardEnvironmentModel:require('../settings/environment-model'),HouseGuardButtons:{run:async(button,fn)=>fn()},Map,Set,Date};
  if(language!==undefined){
    for(const file of ['translations.js','i18n.js'])vm.runInNewContext(fs.readFileSync('settings/'+file,'utf8'),sandbox,{filename:file});
    sandbox.HouseGuardI18n=sandbox.window.HouseGuardI18n;sandbox.HouseGuardI18n.setLanguage(language);sandbox.HouseGuardI18n.apply(document);
    vm.runInNewContext(fs.readFileSync('settings/environment-model.js','utf8'),sandbox,{filename:'environment-model.js'});sandbox.HouseGuardEnvironmentModel=sandbox.window.HouseGuardEnvironmentModel;
  }
  vm.runInNewContext(fs.readFileSync('settings/environment-ui.js','utf8'),sandbox,{filename:'environment-ui.js'});
  for(const button of document.querySelectorAll('[data-tab]'))button.onclick=()=>navigation.push(button.dataset.tab);
  const el=(tag,text,className)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;};
  const ctx={config,data,el,demo:false,options:(select,items,value)=>{select.items=items;select.value=value??'';},changed:()=>{changes.push(structuredClone(config));},api:async(method,path,body)=>{requests.push({method,path,body:structuredClone(body)});return {accepted:true};},flush:async()=>{validate(config);},load:async()=>{},toast:text=>{throw Error(text);}};
  const ui=sandbox.window.HouseGuardEnvironment;ui.initializeTabs();ui.render(ctx);
  const label=(text,root=document)=>root.querySelectorAll('label').find(n=>n.textContent===text)?.children.find(n=>['input','select'].includes(n.tag));
  const button=(text,root=document)=>root.querySelectorAll('button').find(n=>n.textContent===text);
  return {document,config,data,ctx,changes,requests,navigation,ui,label,button,render:()=>ui.render(ctx)};
}
function multiAlarmFixture() {
  const h=fixture(),caps=h.data.catalog.devices.smoke.capabilities;
  caps.alarm_heat={value:false,type:'boolean',getable:true};caps.alarm_fire={value:false,type:'boolean',getable:true};
  h.render();return h;
}
function sensorRow(h,deviceId,type='fire') {
  return h.document.getElementById('environment-sensors').querySelectorAll('label').find(row=>row.className==='environment-sensor'&&row.querySelector('[data-environment-sensor]')?.dataset.environmentSensor===JSON.stringify([deviceId,type]));
}
const sensorCheck=(h,deviceId,type='fire')=>sensorRow(h,deviceId,type).children.find(node=>node.tag==='input');
const sensorStatus=(h,deviceId,type='fire')=>sensorRow(h,deviceId,type).querySelector('[data-environment-sensor]');

test('Ny GUI finner vann- og røykvarslere og viser temperatur ved manglende første vannalarmverdi',()=>{
  const h=fixture(),text=h.document.getElementById('environment-sensors').textContent;
  assert.match(text,/Ny vannsensor · Bad/);assert.match(text,/Ingen vannalarm rapportert ennå · 23 °C · Batteri 90 %/);assert.equal(h.document.getElementById('environment-overview').querySelectorAll('input').length,0);
  assert(!h.document.getElementById('environment-sensors').querySelectorAll('label').some(n=>/Ytterdør|Downlights/.test(n.textContent)));assert.deepEqual(h.requests,[]);
});

test('Sensorvalg lagrer automatisk uten overvåkingsbryter, Flow eller prøvealarm',async()=>{
  const h=fixture(),waterGroup=h.document.getElementById('environment-sensors').children.at(-1);await h.button('Velg alle i denne gruppen',waterGroup).click();
  assert.deepEqual(structuredClone(h.config.environment.sensors),[{deviceId:'water',capability:'alarm_water'}]);assert.equal(h.document.getElementById('environment-overview').querySelectorAll('input').length,0);assert.equal(h.config.environment.enabled,true);validate(h.config);assert(h.changes.length);assert.deepEqual(h.requests,[]);
});

test('Bytte av vannstyring nullstiller bekreftelsen atomisk før en eneste lagring',async()=>{
  const h=fixture();h.config.environment.responses.water.shutoff={deviceId:'valve',enabled:true,validated:true};h.render();
  const select=h.label('Enhet som stenger vannet når den slås AV');assert(!select.items.some(item=>item.id==='lock'));select.value='valve2';await select.fire('change');
  assert.equal(h.changes.length,1);assert.deepEqual(h.changes[0].environment.responses.water.shutoff,{deviceId:'valve2',enabled:false,validated:false});validate(h.config);assert.equal(h.label('Slå AV denne enheten ved vannalarm').disabled,true);
});

test('Kameravalg begrenses til tre, og Flow-velgeren utelater ikke-startbare Flows',async()=>{
  const h=fixture();for(let i=1;i<=3;i++){const select=h.document.querySelector('[aria-label="Legg til kamera for Brann"]');select.value='camera'+i;await select.fire('change');}
  const select=h.document.querySelector('[aria-label="Legg til kamera for Brann"]');assert.equal(select.disabled,true);select.value='camera4';await select.fire('change');assert.deepEqual(h.config.environment.responses.fire.imageDeviceIds,['camera1','camera2','camera3']);
  const flows=h.document.querySelector('[aria-label="Legg til Flow for Brann"]');assert.deepEqual(flows.items.map(item=>item.id),['normal:normal']);flows.value='normal:normal';await flows.fire('change');assert.deepEqual(structuredClone(h.config.environment.responses.fire.flows),[{flowType:'normal',flowId:'normal'}]);validate(h.config);
});

test('Aktiv alarm vises på hjem og i egen oversikt; kvittering sender bare riktig hendelses-ID',async()=>{
  const h=fixture();h.data.environment.incidents=[{id:'active-id',type:'water',active:true,startedAt:Date.now(),sensors:[{deviceId:'water',capability:'alarm_water',name:'Vannsensor',zone:'Bad',active:true}]}];h.config.environment.sensors=[{deviceId:'water',capability:'alarm_water'}];h.data.environment.sensors=[{deviceId:'water',capability:'alarm_water',available:true,value:true,kind:'water',temperature:23,battery:90}];h.render();
  assert.equal(h.document.getElementById('home-environment-alerts').hidden,false);assert.match(h.document.getElementById('environment-incidents').textContent,/Vann – alarm registrert/);await h.button('Jeg har sett varselet').click();assert.deepEqual(h.requests,[{method:'POST',path:'/command',body:{type:'environment-ack',id:'active-id'}}]);
});

test('Varseltest er eksplisitt og sender kun diagnostikk for valgt brann/vann-profil',async()=>{
  const h=fixture(),water=h.document.getElementById('environment-responses').children.at(-1);await h.button('Test kritisk push',water).click();assert.deepEqual(h.requests,[{method:'POST',path:'/direct-test',body:{type:'push',notificationType:'critical',environmentType:'water'}}]);assert.equal(h.config.observation,true);
});

test('Underfaner støtter tastatur, korrekt aria-status og skjuler andre paneler',async()=>{
  const h=fixture(),tab=h.document.getElementById('environment-tab-overview');await tab.fire('keydown',{key:'ArrowRight',preventDefault(){}});
  assert.equal(h.document.getElementById('environment-tab-sensors').getAttribute('aria-selected'),'true');assert.equal(h.document.getElementById('environment-panel-sensors').hidden,false);assert.equal(h.document.getElementById('environment-panel-overview').hidden,true);assert.equal(h.document.activeElement.id,'environment-tab-sensors');
});

test('24-timerskontrollens valg ligger samlet under Sensorer og lagres automatisk',async()=>{
  const h=fixture(),root=h.document.getElementById('water-health-settings');assert.match(root.textContent,/Kontroll av vannsensorer/);assert.equal(h.label('Varsle etter timer uten måleoppdatering',root).value,24);assert.equal(h.label('Kontroller at vannsensorene rapporterer jevnlig',root).checked,true);
  const limit=h.label('Varsle etter timer uten måleoppdatering',root);limit.value='48';await limit.fire('input');assert.equal(h.config.environment.waterHealth.thresholdHours,48);validate(h.config);assert.equal(h.changes.length,1);assert.deepEqual(h.requests,[]);
});

test('Teknisk kontrollvarsel vises separat fra lekkasje og kvitterer bare kontroll-ID',async()=>{
  const h=fixture();h.config.environment.enabled=true;h.config.environment.sensors=[{deviceId:'water',capability:'alarm_water'}];h.data.environment.waterHealth={sensors:[{deviceId:'water',name:'Ny vannsensor',zone:'Bad',status:'stale',lastSignalAt:Date.now()-25*3600000,label:'temperatur',value:23,unit:'°C'}],warning:{id:'health-id',active:true,names:['Ny vannsensor'],zones:['Bad'],acknowledgedAt:null}};h.render();
  assert.equal(h.document.getElementById('home-environment-alerts').hidden,false);assert.match(h.document.getElementById('environment-incidents').textContent,/Ingen aktive alarmhendelser/);assert.match(h.document.getElementById('environment-incidents').textContent,/Vannsensorer trenger kontroll/);assert.match(h.document.getElementById('water-health-status').textContent,/Sist registrert temperatur/);
  await h.button('Kvitter kontrollvarsel').click();assert.deepEqual(h.requests,[{method:'POST',path:'/command',body:{type:'environment-health-ack',id:'health-id'}}]);
});

test('Én rad per fysisk brannvarsler, også med flere alarmtyper og enheter med samme navn',()=>{
  const h=multiAlarmFixture();
  h.data.catalog.devices.smoke2={...h.data.catalog.devices.smoke,id:'smoke2'};
  h.render();
  let rows=h.document.getElementById('environment-sensors').querySelectorAll('label').filter(row=>row.className==='environment-sensor');
  assert.equal(rows.length,3);assert(sensorRow(h,'smoke'));assert(sensorRow(h,'smoke2'));assert(sensorRow(h,'water','water'));assert.equal(h.changes.length,0);assert.deepEqual(h.requests,[]);
  // A combined device still belongs to both relevant sections; its water alarm
  // must not get lost when its fire capabilities are grouped.
  h.data.catalog.devices.smoke.capabilities={...h.data.catalog.devices.smoke.capabilities,alarm_water:{value:null,type:'boolean',getable:true}};h.render();
  rows=h.document.getElementById('environment-sensors').querySelectorAll('label').filter(row=>row.className==='environment-sensor');
  assert.equal(rows.length,4);assert(sensorRow(h,'smoke','water'));
});

test('Felles avkrysning velger alle brannalarmtyper og fjerner bare denne enhetens valg',async()=>{
  const h=multiAlarmFixture(),responses=structuredClone(h.config.environment.responses);
  let check=sensorCheck(h,'smoke');check.checked=true;await check.fire('change');
  assert.deepEqual(structuredClone(h.config.environment.sensors),[{deviceId:'smoke',capability:'alarm_smoke'},{deviceId:'smoke',capability:'alarm_heat'},{deviceId:'smoke',capability:'alarm_fire'}]);
  assert.equal(h.changes.length,1);assert.equal(sensorCheck(h,'smoke').checked,true);assert.equal(sensorCheck(h,'smoke').indeterminate,false);validate(h.config);
  h.config.environment.sensors.push({deviceId:'water',capability:'alarm_water'});h.config.environment.enabled=true;h.render();
  check=sensorCheck(h,'smoke');check.checked=false;await check.fire('change');
  assert.deepEqual(structuredClone(h.config.environment.sensors),[{deviceId:'water',capability:'alarm_water'}]);assert.equal(h.config.environment.enabled,true);
  check=sensorCheck(h,'water','water');check.checked=false;await check.fire('change');assert.equal(h.config.environment.enabled,true);assert.equal(h.config.environment.sensors.length,0);assert.match(h.document.getElementById('environment-monitoring-state').textContent,/De overvåkes automatisk/);
  assert.deepEqual(h.config.environment.responses,responses);assert.deepEqual(h.requests,[]);validate(h.config);
});

test('Eksisterende delvise valg vises med strek og beholdes uten lagring til brukeren velger alle',async()=>{
  const h=multiAlarmFixture();h.config.environment.sensors=[{deviceId:'smoke',capability:'alarm_heat'},{deviceId:'water',capability:'alarm_water'}];h.config.environment.enabled=true;
  const before=structuredClone(h.config);h.render();const check=sensorCheck(h,'smoke');
  assert.equal(check.checked,false);assert.equal(check.indeterminate,true);assert.deepEqual(h.config,before);assert.equal(h.changes.length,0);assert.match(h.document.getElementById('environment-sensors').textContent,/Noen alarmtyper er valgt fra før/);
  check.checked=true;await check.fire('change');
  assert.deepEqual(structuredClone(h.config.environment.sensors),[{deviceId:'smoke',capability:'alarm_heat'},{deviceId:'water',capability:'alarm_water'},{deviceId:'smoke',capability:'alarm_smoke'},{deviceId:'smoke',capability:'alarm_fire'}]);
  assert.equal(sensorCheck(h,'smoke').indeterminate,false);assert.equal(sensorCheck(h,'smoke').checked,true);assert.equal(h.changes.length,1);assert.deepEqual(h.requests,[]);validate(h.config);
});

test('Velg alle tar med alle alarmtyper uten duplikater og oversikten teller fysiske sensorer',async()=>{
  const h=multiAlarmFixture();h.data.catalog.devices.smoke2={id:'smoke2',name:'Røykvarsler 2',zone:'Kjøkken',available:true,capabilities:{alarm_smoke:{value:false,type:'boolean',getable:true},'alarm_heat.1':{value:false,type:'boolean',getable:true}}};
  h.config.environment.sensors=[{deviceId:'smoke',capability:'alarm_heat'},{deviceId:'water',capability:'alarm_water'}];h.config.environment.enabled=true;h.render();
  const fireGroup=()=>h.document.getElementById('environment-sensors').children.find(card=>card.querySelector('h2')?.textContent==='Røyk og brann');
  await h.button('Velg alle i denne gruppen',fireGroup()).click();await h.button('Velg alle i denne gruppen',fireGroup()).click();
  assert.equal(h.config.environment.sensors.length,6);assert.equal(new Set(h.config.environment.sensors.map(s=>s.deviceId+':'+s.capability)).size,6);
  assert.equal(sensorCheck(h,'smoke').checked,true);assert.equal(sensorCheck(h,'smoke2').checked,true);assert.match(h.document.getElementById('environment-monitoring-state').textContent,/Overvåker 3 sensorer hele døgnet/);assert.deepEqual(h.requests,[]);validate(h.config);
});

test('Alarm fra sekundære alarmtyper vises samlet i én rad og oppdateres ved ny status',()=>{
  const h=multiAlarmFixture();h.data.catalog.devices.smoke.capabilities['alarm_fire.2']={value:false,type:'boolean',getable:true};
  h.data.environment.sensors=[{deviceId:'smoke',capability:'alarm_heat',available:true,value:true},{deviceId:'smoke',capability:'alarm_fire',available:true,value:true},{deviceId:'smoke',capability:'alarm_fire.2',available:true,value:true}];h.render();
  let status=sensorStatus(h,'smoke');assert.equal(status.className,'error');assert.match(status.textContent,/Varmealarm/);assert.match(status.textContent,/Brannalarm/);assert.equal(status.textContent.match(/Brannalarm/g).length,1);assert.match(status.textContent,/22 °C/);
  for(const sensor of h.data.environment.sensors)sensor.value=false;h.ui.renderStatus(h.ctx);status=sensorStatus(h,'smoke');assert.equal(status.className,'');assert.match(status.textContent,/Ingen alarm/);assert.deepEqual(h.requests,[]);
});

test('Ukjent eller utilgjengelig sekundær alarmtype kan ikke få samlet Ingen alarm-status',()=>{
  const h=multiAlarmFixture();h.data.catalog.devices.smoke.capabilities.alarm_heat.value=null;h.ui.renderStatus(h.ctx);
  let status=sensorStatus(h,'smoke');assert.match(status.textContent,/Ukjent status/);assert.doesNotMatch(status.textContent,/Ingen alarm/);
  h.data.environment.sensors=[{deviceId:'smoke',capability:'alarm_heat',available:false,value:false}];h.ui.renderStatus(h.ctx);
  status=sensorStatus(h,'smoke');assert.equal(status.className,'missing');assert.match(status.textContent,/alarmtyper er utilgjengelige/);assert.doesNotMatch(status.textContent,/Ingen alarm/);
  h.data.environment.sensors=[];h.data.catalog.devices.smoke.capabilities.alarm_heat.value=false;h.ui.renderStatus(h.ctx);assert.match(sensorStatus(h,'smoke').textContent,/Ingen alarm/);
});

test('Grensen for alarmtyper avviser hele gruppevalget og bevarer tidligere oppsett',async()=>{
  const h=multiAlarmFixture(),messages=[];h.ctx.toast=text=>messages.push(text);
  h.config.environment.sensors=Array.from({length:99},(_,i)=>({deviceId:'existing-water-'+i,capability:'alarm_water'}));h.config.environment.enabled=true;h.render();
  const before=JSON.stringify(h.config);let check=sensorCheck(h,'smoke');check.checked=true;await check.fire('change');
  assert.equal(JSON.stringify(h.config),before);assert.equal(sensorCheck(h,'smoke').checked,false);assert.equal(sensorCheck(h,'smoke').indeterminate,false);
  const fireGroup=h.document.getElementById('environment-sensors').children.find(card=>card.querySelector('h2')?.textContent==='Røyk og brann');await h.button('Velg alle i denne gruppen',fireGroup).click();
  assert.equal(JSON.stringify(h.config),before);assert.equal(h.changes.length,0);assert.equal(messages.length,2);assert(messages.every(text=>text.includes('100 alarmtyper')));assert.deepEqual(h.requests,[]);validate(h.config);
});

test('Aktive hendelser beholder status per alarmtype etter at sensorradene er samlet',()=>{
  const h=multiAlarmFixture();h.config.environment.sensors=[{deviceId:'smoke',capability:'alarm_smoke'},{deviceId:'smoke',capability:'alarm_heat'}];h.config.environment.enabled=true;
  h.data.environment.incidents=[{id:'fire-id',type:'fire',active:true,startedAt:Date.now(),sensors:[{deviceId:'smoke',capability:'alarm_heat',name:'Røykvarsler',zone:'Soverom',active:true}]}];
  h.data.environment.sensors=[{deviceId:'smoke',capability:'alarm_heat',available:true,value:null}];h.render();
  let text=h.document.getElementById('environment-incidents').textContent;assert.match(text,/Venter på ny alarmstatus/);assert.doesNotMatch(text,/ikke lenger valgt/);
  h.data.environment.sensors[0].available=false;h.ui.renderStatus(h.ctx);assert.match(h.document.getElementById('environment-incidents').textContent,/Sensoren er utilgjengelig; alarmhendelsen beholdes/);
  h.config.environment.sensors=[{deviceId:'smoke',capability:'alarm_smoke'}];h.ui.renderStatus(h.ctx);assert.match(h.document.getElementById('environment-incidents').textContent,/Sensoren er ikke lenger valgt/);assert.deepEqual(h.requests,[]);
});

test('English settings show translated sensor states, controls and diagnostics while device/person/Flow names stay untouched',async()=>{
  const h=fixture('en');
  assert.equal(h.document.querySelector('[data-tab="people"]').textContent.trim(),'People');
  assert.equal(h.document.querySelector('[data-tab="environment"]').textContent.trim(),'Fire and water');
  assert.match(h.document.getElementById('environment-sensors').textContent,/Ny vannsensor · Bad/);
  assert.match(h.document.getElementById('environment-sensors').textContent,/No water alarm state reported yet · 23 °C · Battery 90 %/);
  assert.equal(h.document.getElementById('environment-overview').querySelectorAll('input').length,0);
  assert.match(h.document.getElementById('environment-overview').textContent,/monitored automatically/);
  assert(h.document.getElementById('environment-responses').textContent.includes('Alex'));
  const flows=h.document.querySelector('[aria-label="Add Flow for Fire"]');assert.equal(flows.items[0].label,'Min Flow');
  h.data.environment.incidents=[{id:'english-fire',type:'fire',active:true,startedAt:Date.now(),sensors:[{deviceId:'smoke',capability:'alarm_smoke',name:'Røykvarsler',zone:'Soverom',active:true}]}];
  h.ui.renderStatus(h.ctx);assert.match(h.document.getElementById('environment-incidents').textContent,/Fire – alarm detected/);assert(h.button('I have seen the notification'));
  const testSection=h.document.querySelector('[data-environment-section="fire-test"]');await h.button('Test critical push',testSection).click();
  assert.match(testSection.textContent,/Homey accepted the test notification\. Check your phone\./);
  assert.deepEqual(h.requests,[{method:'POST',path:'/direct-test',body:{type:'push',notificationType:'critical',environmentType:'fire'}}]);
});

test('Norwegian Homey language retains native UI and translated static accessibility labels',()=>{
  const h=fixture('nb-NO');
  assert.equal(h.document.querySelector('[data-tab="people"]').textContent.trim(),'Personer');
  assert.match(h.document.getElementById('environment-sensors').textContent,/Ingen vannalarm rapportert ennå/);
  assert.equal(h.document.getElementById('environment-overview').querySelectorAll('input').length,0);assert.match(h.document.getElementById('environment-overview').textContent,/overvåkes automatisk/);
  assert.equal(h.document.getElementById('direct-api-key').getAttribute('placeholder'),'Lim inn ny nøkkel');
  assert.equal(h.document.getElementById('setup-dialog').querySelector('[aria-label]').getAttribute('aria-label'),'Lukk veiviseren');
});
