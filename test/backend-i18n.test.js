'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const i18n=require('../lib/backend-i18n'),{harness,step}=require('./helpers'),{defaults}=require('../lib/config');
const {normalizedDevice}=require('../lib/homey-adapter'),{Intrusion,ID}=require('../lib/intrusion'),Environment=require('../lib/environment'),{WaterHealth,HOUR}=require('../lib/water-health');
const homey=language=>({i18n:{getLanguage:()=>language}});

test('Backend uses Homey language, defaults to English, and supports Norwegian language variants',()=>{
 for(const language of ['no','nb','nn','nb-NO','NN_no'])assert.equal(i18n.language(homey(language)),'no');
 for(const language of ['en','de','fr',undefined,''])assert.equal(i18n.language(homey(language)),'en');
 assert.equal(i18n.language(),'en');assert.equal(i18n.language({i18n:{getLanguage:()=>{throw Error('not ready');}}}),'en');
});
test('Named parameters preserve names, braces and translation-looking user values',()=>{
 const name='Aktivering av Nattmodus {reason} $&';
 assert.equal(i18n.t('Ukjent sensor: {name}',{name},homey('en')),'Unknown sensor: '+name);
 assert.equal(i18n.t('Ukjent sensor: {name}',{name},homey('no')),'Ukjent sensor: '+name);
 assert.equal(i18n.text(name,homey('en')),name);
 assert.equal(i18n.text(name+': bevegelse registrert',homey('en')),name+': motion detected');
});
test('State projection translates generated fields without editing configuration, user names or custom action text',()=>{
 const config=defaults(),original=structuredClone(config),custom='Alarmen er avstilt.';
 config.routines.push({id:'custom',name:'Aktivering av Nattmodus',enabled:true,actions:[step('mine',{kind:'notify',text:custom})]});
 const value={config,catalog:{devices:{door:{id:'door',name:'Ukjent sone',zone:'Brann',capabilities:{}}},flows:[{id:'f',name:'Velkomstlys'}],people:{p:{name:'Personer'}},errors:['Personer: Homey er ikke tilkoblet.']},
  status:{reason:'Minst én valgt person er hjemme',people:{p:{name:'Ukjent'}},history:[{message:'Planlagt: Velkomstlys',routineId:'welcome'}],pending:[{routineId:'custom',actions:[{text:custom,error:'Målenheten mangler'}]}]},
  controls:{lock:{options:{true:{allowed:false,reason:'Låsen har ukjent status.'}}}},intrusion:{faults:['Ukjent sensor: Natt'],context:{sensorName:'Natt',zone:'Brann',reason:'Natt: dør/vindu åpnet'}},
  readiness:{checks:[{id:'people',title:'Personer',detail:'Valgte personer har fersk tilstedeværelse.'},{id:'action-custom-mine',title:'Aktivering av Nattmodus',detail:'Målenheten mangler'}]},
  environment:{waterHealth:{sensors:[{name:'Vannsensor',label:'batterinivå'}]},batches:[{context:{reason:'Røykalarm',sensorName:'Røykalarm'},actions:[{text:custom,detail:'Akseptert av Homey.'}]}]}};
 const before=structuredClone(value),result=i18n.projectState(value,homey('en'));
 assert.deepEqual(value,before);assert.deepEqual(result.config,config);assert.deepEqual(original.security.responses,config.security.responses);
 assert.equal(result.catalog.devices.door.name,'Ukjent sone');assert.equal(result.catalog.devices.door.zone,'Brann');assert.equal(result.catalog.flows[0].name,'Velkomstlys');assert.equal(result.catalog.people.p.name,'Personer');
 assert.equal(result.status.reason,'At least one selected resident is home');assert.equal(result.status.people.p.name,'Ukjent');
 assert.equal(result.status.history[0].message,'Planned: Welcome lights');assert.equal(result.catalog.errors[0],'People: Homey is not connected.');
 assert.equal(result.status.pending[0].actions[0].text,custom);assert.equal(result.status.pending[0].actions[0].error,'The target device is missing');
 assert.equal(result.intrusion.context.sensorName,'Natt');assert.equal(result.intrusion.context.zone,'Brann');assert.equal(result.intrusion.context.reason,'Natt: door/window opened');
 assert.equal(result.intrusion.faults[0],'Unknown sensor: Natt');assert.equal(result.controls.lock.options.true.reason,'Lock status is unknown.');
 assert.equal(result.readiness.checks[0].title,'People');assert.equal(result.readiness.checks[1].title,'Aktivering av Nattmodus');
 assert.equal(result.environment.waterHealth.sensors[0].label,'battery level');assert.equal(result.environment.batches[0].actions[0].text,custom);assert.equal(result.environment.batches[0].actions[0].detail,'Accepted by Homey.');
 assert.deepEqual(i18n.projectState(value,homey('no')),value);
});
test('Preview translates fixed routine labels/reasons but preserves custom routine names and action templates',()=>{
 const custom={id:'custom',name:'Velkomstlys',note:'Forhåndsvisning av valgt oppsett med nåværende tilstand. Ingen rutine er startet. Vilkårene kontrolleres på nytt ved faktisk kjøring.',actions:[{id:'custom',text:'Alarmen er avstilt.',reason:'Målenheten mangler',target:'Ukjent'}]};
 const result=i18n.projectPreview(custom,homey('en'));assert.equal(result.name,'Velkomstlys');assert.equal(result.actions[0].text,'Alarmen er avstilt.');assert.equal(result.actions[0].target,'Ukjent');assert.equal(result.actions[0].reason,'The target device is missing');
 const builtin=i18n.projectPreview({...custom,id:'night'},homey('en'));assert.equal(builtin.name,'Night mode activation');assert.match(builtin.note,/No routine has started/);
});
test('Readiness uses stable routine IDs to translate built-in titles while preserving identical custom names',()=>{
 const config=defaults(),fixed=config.routines.find(r=>r.id==='away');fixed.actions=[step('missing',{kind:'set',deviceId:'missing',capability:'onoff',value:true})];
 config.routines.push({id:'custom-away',name:fixed.name,enabled:true,actions:structuredClone(fixed.actions)});
 const readiness=require('../lib/readiness')(config,{people:{},devices:{}},{people:{},devices:{},flows:[]}),source=structuredClone(readiness);
 const projected=i18n.projectState({readiness},homey('en')).readiness;
 assert.equal(projected.checks.find(c=>c.id==='action-away-missing').title,'Last person leaves');assert.equal(projected.checks.find(c=>c.id==='action-custom-away-missing').title,'Siste Person forlater');assert.deepEqual(readiness,source);
});
test('API error translation handles validation lines, preserves metadata and does not translate captured custom names',()=>{
 const source=Error('Svarfrist må være mellom 10 og 900\nUkjent rutine');source.statusCode=400;
 const translated=i18n.error(source,homey('en'));assert.equal(translated.message,'Reply deadline must be between 10 and 900\nUnknown routine');assert.equal(translated.statusCode,400);assert.equal(source.message,'Svarfrist må være mellom 10 og 900\nUkjent rutine');
 const dynamic=i18n.error(Error('Den faste rutinen «Velkomstlys» kan ikke slettes. Bruk avkrysningen for å deaktivere ekstrahandlingene.'),homey('en'));
 assert.match(dynamic.message,/“Velkomstlys”/);assert.match(dynamic.message,/cannot be deleted/);assert.equal(i18n.error(source,homey('no')),source);
});
test('Capability title chooses hub language with English fallback while preserving device and zone names',()=>{
 const source={id:'d',name:'Vannsensor',zone:'z',capabilitiesObj:{alarm_water:{title:{en:'Water alarm',no:'Vannalarm'},value:null}}},zones={z:{name:'Brann'}};
 assert.equal(normalizedDevice(source,zones,homey('en')).capabilities.alarm_water.title,'Water alarm');
 assert.equal(normalizedDevice(source,zones,homey('no')).capabilities.alarm_water.title,'Vannalarm');
 assert.equal(normalizedDevice(source,zones).capabilities.alarm_water.title,'Water alarm');
 assert.equal(normalizedDevice(source,zones,homey('en')).name,'Vannsensor');assert.equal(normalizedDevice(source,zones,homey('en')).zone,'Brann');
});
test('English Homey emits built-in morning and guest notices without rewriting saved configuration',async()=>{
 const h=harness(c=>{c.people.notifications=['a'];c.bridges.notifications=true;});h.adapter.homey=homey('en');
 h.person('a',true,true);h.person('b',true,true);h.ingest();const before=structuredClone(h.config);
 h.person('a',true,false);h.ingest();await h.engine.tick();assert(h.calls.some(c=>c[0]==='timeline'&&c[1]==='House Guard: The house has woken up. Night mode has ended.'));
 h.engine.setGuest(true);await h.engine.tick();const notice=h.calls.find(c=>c[0]==='emit'&&c[1].text.startsWith('Guest mode is on.'));assert(notice);assert.deepEqual(notice[1].recipients,['a']);assert.deepEqual(h.config,before);
});
test('Automatic alarm templates translate before interpolation; custom messages and Sonos sound names stay exact',async()=>{
 const h=harness(c=>{c.security.alarmDeviceId=ID;c.people.notifications=['a'];c.bridges.notifications=true;});h.adapter.homey=homey('en');h.device(ID,'alarm_generic',true);h.ingest();
 h.engine.event('alarm',{id:'alarm',sensorName:'Brann',zone:'Natt',reason:'Brann: bevegelse registrert'});await h.engine.tick();
 assert(h.calls.some(c=>c[0]==='emit'&&c[1].text==='Intrusion alarm in Natt: Brann: motion detected'));
 const custom='Alarmen er avstilt.';assert.equal(i18n.actionText({id:'mine',builtin:false,kind:'notify',text:custom},h.config,'alarm',homey('en')),custom);
 assert.equal(i18n.actionText({id:'response-alarm-audio-0',builtin:true,kind:'sound',text:custom},h.config,'alarm',homey('en')),custom);
 assert.equal(i18n.actionText({id:'response-alarm-push',builtin:true,kind:'notify',text:'Min alarm {zone}'},h.config,'alarm',homey('en')),'Min alarm {zone}');
});
test('Night question is English on an English Homey with unchanged participants and deadline',async()=>{
 const h=harness(c=>{c.night.automatic=true;c.bridges.questions=true;c.security.alarmDeviceId=ID;c.night.zoneId='z';});h.adapter.homey=homey('en');h.device(ID,'homealarm_state','disarmed');h.ingest();
 await h.engine.requestNight();const questions=h.calls.filter(c=>c[0]==='emit'&&c[1].kind==='question');assert.equal(questions.length,2);assert(questions.every(c=>c[1].text==='Activate night mode?'));assert.deepEqual(questions.map(c=>c[1].personId),['a','b']);
});
test('Intrusion English sensor reasons/faults preserve user names, IDs and mode behavior',()=>{
 const config=defaults();config.observation=false;config.security.alarmDeviceId=ID;config.security.intrusion.exitSeconds=0;config.security.intrusion.sensors=[{deviceId:'door',capability:'alarm_contact',full:true,partial:true,delay:false}];
 const model=new Intrusion({config,clock:()=>100,locale:()=>homey('en')});
 const snapshot={connected:true,devices:{door:{id:'door',name:'Brann',zone:'Natt',capabilities:{alarm_contact:{value:false}}}}};model.mode('armed',snapshot);snapshot.devices.door.capabilities.alarm_contact.value=true;model.update(snapshot);
 assert.equal(model.state.mode,'armed');assert.equal(model.state.context.reason,'Brann: door/window opened');assert.equal(model.state.context.sensorName,'Brann');assert.equal(model.device().capabilities.homealarm_state.title,'Alarm mode');
});
test('Fire/water built-in notifications are English and custom templates stay unchanged',async()=>{
 const config=defaults();config.observation=false;config.environment.enabled=true;config.environment.sensors=[{deviceId:'smoke',capability:'alarm_smoke'}];config.people.notifications=['a'];
 const calls=[],adapter={homey:homey('en'),direct:{ready:true},emit:async data=>calls.push(data),timeline:async()=>{}};
 const model=new Environment({getConfig:()=>config,adapter,clock:()=>1000}),device={id:'smoke',name:'Røykalarm',zone:'Brann',capabilities:{alarm_smoke:{value:false}}};
 model.update({connected:true,devices:{smoke:device}});model.observeEvent('smoke','alarm_smoke',true,device);await model.drain();
 assert.equal(calls[0].text,'House Guard: Smoke alarm · Brann. Sensor: Røykalarm.');assert.deepEqual(calls[0].recipients,['a']);
 model.observeEvent('smoke','alarm_smoke',false,device);await model.drain();assert.equal(calls.at(-1).text,'House Guard: Fire – sensors no longer report an alarm. Brann');
 config.environment.responses.fire.text='Alarmen er avstilt. {sensorName}';model.configure();model.observeEvent('smoke','alarm_smoke',true,device);await model.drain();assert.equal(calls.at(-1).text,'Alarmen er avstilt. Røykalarm');model.close();
});
test('Water health notices translate generated lines while preserving sensor/room names and measurements',()=>{
 let now=HOUR,config=defaults();config.observation=false;config.environment.enabled=true;config.environment.waterHealth.thresholdHours=1;config.environment.sensors=[{deviceId:'water',capability:'alarm_water'}];const notices=[];
 const model=new WaterHealth({getConfig:()=>config,clock:()=>now,locale:()=>homey('en'),alert:notice=>notices.push(notice)});
 const snapshot={connected:true,devices:{water:{id:'water',name:'Kontroll av vannsensorer',zone:'Brann',capabilities:{measure_temperature:{value:22,updatedAt:now}}}}};
 model.update(snapshot);now+=HOUR;model.update(snapshot);assert.equal(notices.length,1);assert.match(notices[0].text,/Check the water sensors/);assert.match(notices[0].text,/Kontroll av vannsensorer · Brann: temperature last updated 1 hours ago \(22 °C\)/);assert.match(notices[0].text,/does not confirm that the sensor is offline/);
});
