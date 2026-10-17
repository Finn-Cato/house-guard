'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {documentFixture}=require('./helpers/settings-dom');
const {defaults}=require('../lib/config');
const scripts=['translations.js','i18n.js','alarm-sensor-model.js','setup-model.js','onboarding-model.js','button-feedback.js','setup-ui.js','autosave.js','alarm-ui.js','environment-model.js','environment-ui.js','ui.js'];
function languageFixture(){
  const sandbox={window:{},setTimeout,clearTimeout};
  for(const file of ['translations.js','i18n.js'])vm.runInNewContext(fs.readFileSync('settings/'+file,'utf8'),sandbox,{filename:file});
  return sandbox.window.HouseGuardI18n;
}
async function settingsFixture(language,configure=()=>{},configureData=()=>{}){
  const document=documentFixture(fs.readFileSync('settings/index.html','utf8')),requests=[],config=defaults();
  configure(config);
  config.people.presence=['alex'];config.people.night=['alex'];config.people.notifications=['alex'];
  const catalog={people:{alex:{id:'alex',name:'Innstillinger',available:true}},zones:{},devices:{},flows:[],errors:[]};
  const data={version:'0.4.39',config,catalog,direct:{ready:true,configured:true},status:{connected:true,observation:true,mode:'home',guest:false,reason:'Backend reason',people:{alex:{name:'Innstillinger',present:true,asleep:false,available:true}},devices:{},pending:[],history:[],skipUntil:0},intrusion:{selected:false,mode:'disarmed',faults:[],disabled:[],bypassed:[]},environment:{enabled:false,sensors:[],incidents:[],batches:[]},readiness:{checks:[],deliveries:[]}};
  configureData(data);
  const window={addEventListener(){}};
  const sandbox={window,document,Map,Set,Date,URL,URLSearchParams,Blob,crypto:require('node:crypto').webcrypto,structuredClone,location:{search:''},setInterval:()=>0,setTimeout:()=>0,clearTimeout:()=>{},Option:function(text,value){const node=document.createElement('option');node.textContent=text;node.value=value;return node;}};
  for(const file of scripts){vm.runInNewContext(fs.readFileSync('settings/'+file,'utf8'),sandbox,{filename:file});for(const key of Object.keys(window))if(key.startsWith('HouseGuard'))sandbox[key]=window[key];}
  let ready;const startup=new Promise(resolve=>ready=resolve);
  const homey={getLanguage:()=>language,ready,api(method,path,body,callback){requests.push({method,path,body:structuredClone(body)});callback(null,path==='/catalog'?catalog:path==='/state'?data:body);}};
  window.onHomeyReady(homey);await startup;await new Promise(resolve=>setImmediate(resolve));
  return {document,requests,config,data,i18n:window.HouseGuardI18n,onboarding:sandbox.HouseGuardOnboarding};
}

for (const language of ['en','no']) test('The action editor saves a 72-hour lux condition and keeps other measurement limits in '+language,async()=>{
  const h=await settingsFixture(language,()=>{},data=>{
    data.catalog.devices.lux={id:'lux',name:'Lysmåler',zone:'Kitchen',available:true,capabilities:{'measure_luminance.1':{type:'number',getable:true},measure_temperature:{type:'number',getable:true}}};
    data.catalog.flows=[{id:'lights-on',name:'Lights on',type:'normal',enabled:true,triggerable:true}];
  });
  const card=h.document.getElementById('routine-morning'),add=card.querySelectorAll('button').find(b=>/^(\+ )?(Add action|Legg til handling)$/.test(b.textContent));assert(add);await add.click();
  const get=id=>h.document.getElementById(id);
  get('action-kind').value='flow';await get('action-kind').fire('change');get('action-flow').value='normal:lights-on';
  get('condition-device').value='lux';await get('condition-device').fire('change');
  get('condition-capability').value='measure_luminance.1';await get('condition-capability').fire('change');
  assert.equal(get('condition-age').value,'259200');assert.equal(get('condition-age').max,'259200');assert.equal(get('condition-age-hint').hidden,false);
  assert.equal(get('condition-age-hint').textContent,language==='en'?'Lux readings can be up to 72 hours old.':'Luxverdier kan være opptil 72 timer gamle.');
  get('condition-operator').value='lt';get('condition-value').value='15';await get('action-form').fire('change');
  assert.equal(get('action-error-message').textContent,'');
  await get('action-form').fire('submit');
  const saved=h.requests.filter(r=>r.method==='PUT'&&r.path==='/config').at(-1)?.body;assert(saved);
  assert.equal(saved.routines.find(r=>r.id==='morning').actions[0].condition.maxAgeSeconds,259200);
  assert.equal(saved.routines.find(r=>r.id==='morning').actions[0].flowId,'lights-on');
  get('condition-capability').value='measure_temperature';await get('condition-capability').fire('change');
  assert.equal(get('condition-age').value,'600');assert.equal(get('condition-age').max,'86400');assert.equal(get('condition-age-hint').hidden,true);
  assert(h.requests.every(r=>['GET','PUT'].includes(r.method)||r.method==='POST'&&r.path==='/validate'));
});

test('Settings startup uses English by default before rendering every primary page',async()=>{
  const h=await settingsFixture(undefined);
  assert.equal(h.document.documentElement.getAttribute('lang'),'en');
  assert.equal(h.document.querySelector('[data-tab="routines"]').querySelector('.tab-label').textContent.trim(),'Routines');
  assert.equal(h.document.querySelector('[data-tab="more"]').querySelector('.tab-label').textContent.trim(),'Settings');
  assert.match(h.document.getElementById('routines').textContent,/Last person leaves/);
  assert.match(h.document.getElementById('routines').textContent,/First person arrives/);
  assert.equal(h.document.getElementById('home-lock-state').textContent,'Unknown status');
  assert.equal(h.document.getElementById('direct-api-heading').textContent,'API key · Ready');
  assert.equal(h.document.getElementById('autosave-message').textContent,'All changes are saved automatically');
  assert.match(h.document.getElementById('people-selection').textContent,/Receive push notifications/);
  assert.match(h.document.getElementById('people-selection').textContent,/Innstillinger/); // An actual person's name is not translated.
  assert.equal(h.document.getElementById('mode-reason').textContent,'Backend reason');
  assert.deepEqual(h.requests.map(r=>[r.method,r.path]),[['GET','/state']]);
  assert.equal(h.config.routines.find(r=>r.id==='away').name,'Siste Person forlater');
});

test('Norwegian Homey keeps Norwegian static, runtime and standard routine names without saving config',async()=>{
  const h=await settingsFixture('nn-NO');
  assert.equal(h.document.documentElement.getAttribute('lang'),'nb');
  assert.equal(h.document.querySelector('[data-tab="more"]').querySelector('.tab-label').textContent.trim(),'Innstillinger');
  assert.match(h.document.getElementById('routines').textContent,/Siste Person forlater/);
  assert.equal(h.document.getElementById('direct-api-heading').textContent,'API-nøkkel · Klar');
  assert.equal(h.document.getElementById('direct-api-key').getAttribute('placeholder'),'Lim inn ny nøkkel');
  assert.equal(h.document.getElementById('autosave-message').textContent,'Alle endringer er lagret automatisk');
  assert.deepEqual(h.requests.map(r=>r.method),['GET']);
});

test('Opening English setup guide translates onboarding validation and progress while names remain literal',async()=>{
  const h=await settingsFixture('en');await h.document.getElementById('open-setup').click();
  assert.equal(h.document.getElementById('setup-title').textContent,'What would you like House Guard to do?');
  assert.match(h.document.getElementById('setup-progress').textContent,/Step 1 of/);
  await h.document.getElementById('setup-next').click();
  assert.equal(h.document.getElementById('setup-title').textContent,'API key');
  await h.document.getElementById('setup-next').click();
  assert.equal(h.document.getElementById('setup-title').textContent,'Residents and notifications');
  assert.match(h.document.getElementById('setup-body').textContent,/Innstillinger/);
  assert.match(h.document.getElementById('setup-body').textContent,/Lives here \/ counts as a resident/);
  assert(h.requests.every(r=>r.method==='GET'));
});

test('English action editor shows local validation errors without adding an incomplete action',async()=>{
  const h=await settingsFixture('en'),card=h.document.getElementById('routine-away');
  const add=card.querySelectorAll('button').find(button=>button.textContent==='Add action' || button.textContent==='+ Add action');await add.click();
  assert.equal(h.document.getElementById('action-title').textContent,'Add action');
  h.document.getElementById('action-kind').value='set';await h.document.getElementById('action-form').fire('change');
  assert.equal(h.document.getElementById('action-error-message').textContent,'Not saved: Choose a device and capability.');
  assert.equal(h.config.routines.find(r=>r.id==='away').actions.length,0);
});

test('English default message is presentation only; another checkbox save preserves its original stored value',async()=>{
  const h=await settingsFixture('en'),event=h.document.getElementById('alarm-event-alarm');
  const field=title=>event.querySelectorAll('label').find(label=>label.textContent===title)?.children.find(node=>node.tag==='input');
  assert.equal(field('Push message').value,'Intrusion alarm in {zone}: {reason}');
  assert.equal(h.config.security.responses.alarm.text,'Innbruddsalarm i {zone}: {reason}');
  const critical=field('Use critical push');critical.checked=true;await critical.fire('change');await new Promise(resolve=>setImmediate(resolve));
  const saved=h.requests.find(request=>request.method==='PUT'&&request.path==='/config');assert(saved);
  assert.equal(saved.body.security.responses.alarm.text,'Innbruddsalarm i {zone}: {reason}');
  assert.equal(saved.body.security.responses.alarm.critical,true);
});

test('Custom notification messages remain in their authored language in English settings',async()=>{
  const h=await settingsFixture('en',config=>{config.security.responses.alarm.text='Min egen alarm i {zone}';config.environment.responses.fire.text='Ring naboen, {sensorName}';});
  const field=(root,title)=>root.querySelectorAll('label').find(label=>label.textContent===title)?.children.find(node=>node.tag==='input');
  assert.equal(field(h.document.getElementById('alarm-event-alarm'),'Push message').value,'Min egen alarm i {zone}');
  const fire=h.document.querySelector('[data-environment-section="fire-text"]');assert.equal(field(fire,'Alarm message').value,'Ring naboen, {sensorName}');
  assert(h.requests.every(request=>request.method==='GET'));
});

test('English Flow checklist translates built-in routine titles while custom routine and Flow names stay literal',async()=>{
  const h=await settingsFixture('en'),action={id:'flow-action',kind:'flow',flowId:'lights',flowType:'normal'};
  h.config.routines.find(routine=>routine.id==='away').actions.push({...action});
  h.config.routines.push({id:'custom-one',name:'Siste Person forlater',enabled:true,actions:[{...action}]});
  h.data.catalog.flows=[{id:'lights',type:'normal',name:'Innstillinger',enabled:true,triggerable:true}];
  const before=JSON.stringify(h.config),flowChecks=()=>h.onboarding.checklist(h.config,h.data).filter(check=>check.id.startsWith('flow-'));
  let checks=flowChecks();assert.equal(checks.find(check=>check.id==='flow-away-flow-action').title,'Last person leaves: Innstillinger');
  assert.equal(checks.find(check=>check.id==='flow-custom-one-flow-action').title,'Siste Person forlater: Innstillinger');
  assert(checks.every(check=>check.detail==='This Flow is available and can be started directly.'));
  h.i18n.setLanguage('no');checks=flowChecks();assert(checks.every(check=>check.title==='Siste Person forlater: Innstillinger'));
  assert.equal(JSON.stringify(h.config),before);assert(h.requests.every(request=>request.method==='GET'));
});

test('Language bridge accepts synchronous, callback and Promise getters and unsupported languages fall back English',async()=>{
  const i=languageFixture();assert.equal(i.language,'en');
  for(const value of ['no','nb','nn','nb-NO','no_NO','NN-no'])assert.equal(await i.initialize({getLanguage:()=>value}),'no');
  assert.equal(await i.initialize({getLanguage:callback=>callback(null,'no')}),'no');
  assert.equal(await i.initialize({getLanguage:async()=> 'nb'}),'no');
  for(const value of [undefined,null,'','de','fr','xx'])assert.equal(await i.initialize({getLanguage:()=>value}),'en');
  assert.equal(await i.initialize({getLanguage:()=>{throw Error('Not connected');}}),'en');
  assert.equal(i.t('Mangler: {0}',['Innstillinger <name>']), 'Missing: Innstillinger <name>');
  assert.equal(i.t('Bruk {zone}, {reason} eller {personId} ved behov'),'Use {zone}, {reason} or {personId} if needed');
});

test('Routine names and default template presentation never rewrite custom names, custom messages or config',()=>{
  const i=languageFixture(),routine={id:'away',name:'Siste Person forlater'},custom={id:'custom-one',name:'Siste Person forlater'};
  assert.equal(i.routineName(routine),'Last person leaves');assert.equal(i.routineName(custom),'Siste Person forlater');assert.equal(routine.name,'Siste Person forlater');
  assert.equal(i.defaultMessage('Innbruddsalarm i {zone}: {reason}'),'Intrusion alarm in {zone}: {reason}');
  assert.equal(i.defaultMessage('Min egen Innbruddsalarm i {zone}: {reason}'),'Min egen Innbruddsalarm i {zone}: {reason}');
  assert.equal(i.title({en:'Open',no:'Åpen'},'open'),'Open');i.setLanguage('no');assert.equal(i.title({en:'Open',no:'Åpen'},'open'),'Åpen');
});

function garageFixture(language){
  return settingsFixture(language,c=>{
    c.security.alarmDeviceId='house-guard-internal-alarm';
    Object.assign(c.security.garage,{statusDeviceId:'port',statusCapability:'shelly_input_switch.100',openValue:false});
    c.security.intrusion.sensors=[{deviceId:'motion',capability:'alarm_motion',full:true,partial:false,delay:false}];
  },data=>{
    const cap=value=>({type:'boolean',getable:true,setable:false,value});
    data.catalog.devices={
      port:{id:'port',name:'Portstatus',zone:'Garasje',available:true,capabilities:{'shelly_input_switch.100':cap(true),alarm_generic:cap(false),'button.restart':{...cap(null),setable:true}}},
      door:{id:'door',name:'Garasjedør',zone:'Garasje',available:true,capabilities:{alarm_open:cap(false)}},
      motion:{id:'motion',name:'Motion',zone:'Room',available:true,capabilities:{alarm_motion:cap(false)}},
    };
    data.intrusion.selected=true;
  });
}
const sensorRow=(root,name)=>root.children.find(row=>row.querySelector('strong')?.textContent.startsWith(name+' ·'));
const lastSave=h=>h.requests.filter(r=>r.method==='PUT'&&r.path==='/config').at(-1)?.body;
const settle=async()=>{await new Promise(resolve=>setImmediate(resolve));await new Promise(resolve=>setImmediate(resolve));};

for(const language of ['en','no']){
  test(`Alarm settings show both garage devices in ${language}, save their separate modes and preserve existing sensors`,async()=>{
    const h=await garageFixture(language),root=h.document.getElementById('intrusion-sensors');
    const port=sensorRow(root,'Portstatus'),door=sensorRow(root,'Garasjedør');assert(port);assert(door);
    assert.match(port.textContent,language==='en'?/Garage door/:/Garasjeport/);assert.match(door.textContent,language==='en'?/Door\/window/:/Dør\/vindu/);
    assert.match(port.textContent,language==='en'?/Open when the input is Off/:/Åpen når inngangen er Av/);
    assert(h.requests.every(r=>r.method==='GET'));assert.equal(h.config.security.intrusion.sensors.length,1);
    const full=port.querySelectorAll('input')[0];full.checked=true;await full.fire('change');await settle();
    const partial=sensorRow(root,'Portstatus').querySelectorAll('input')[1];partial.checked=true;await partial.fire('change');await settle();
    const doorPartial=sensorRow(root,'Garasjedør').querySelectorAll('input')[1];doorPartial.checked=true;await doorPartial.fire('change');await settle();
    const saved=lastSave(h);assert(saved);
    assert.deepEqual(structuredClone(saved.security.intrusion.sensors),[
      {deviceId:'motion',capability:'alarm_motion',full:true,partial:false,delay:false},
      {deviceId:'port',capability:'shelly_input_switch.100',activeValue:false,full:true,partial:true,delay:false},
      {deviceId:'door',capability:'alarm_open',full:false,partial:true,delay:false},
    ]);
    assert(h.requests.every(r=>['GET','PUT'].includes(r.method)||r.method==='POST'&&r.path==='/validate'));
  });

  test(`Setup guide offers the same garage devices in ${language} and retains input polarity on selection`,async()=>{
    const h=await garageFixture(language);await h.document.getElementById('reopen-setup').click();
    for(let i=0;i<3;i++)await h.document.getElementById('setup-next').click();
    assert.equal(h.document.getElementById('setup-title').textContent,language==='en'?'Set up the alarm':'Sett opp alarmen');
    const body=h.document.getElementById('setup-body'),list=body.querySelector('.setup-sensors'),port=sensorRow(list,'Portstatus'),door=sensorRow(list,'Garasjedør');assert(port);assert(door);
    const full=port.querySelectorAll('input')[0];full.checked=true;await full.fire('change');await settle();
    assert.equal(lastSave(h).security.intrusion.sensors.find(s=>s.deviceId==='port').activeValue,false);
    assert(!lastSave(h).security.intrusion.sensors.some(s=>s.deviceId==='door'));
    assert(h.requests.every(r=>['GET','PUT'].includes(r.method)||r.method==='POST'&&r.path==='/validate'));
  });
}
