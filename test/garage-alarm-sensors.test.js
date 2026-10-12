'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const sensors=require('../settings/alarm-sensor-model'),{defaults,validate}=require('../lib/config'),{Intrusion,ID}=require('../lib/intrusion'),flows=require('../lib/sensor-flows');
const input='shelly_input_switch.100';
const boolean=(value=false)=>({type:'boolean',getable:true,setable:false,value});
function setup(openValue=true,change=()=>{},saved={}){
  const config=defaults();config.observation=false;config.security.alarmDeviceId=ID;
  Object.assign(config.security.garage,{statusDeviceId:'port',statusCapability:input,openValue});
  config.security.intrusion={exitSeconds:0,entrySeconds:5,sensors:[]};change(config);
  const devices={port:{id:'port',name:'Portstatus',zone:'Garasje',available:true,capabilities:{[input]:boolean(!openValue),alarm_generic:boolean(), 'button.restart':{...boolean(),setable:true}}},door:{id:'door',name:'Garasjedør',zone:'Garasje',available:true,capabilities:{alarm_open:boolean(),measure_rotation:{type:'number',value:0}}},motion:{id:'motion',name:'Motion',zone:'Room',available:true,capabilities:{'alarm_motion.1':boolean()}}};
  const snapshot={connected:true,devices},events=[];let now=10000,persisted;
  const model=new Intrusion({config:validate(config),saved,clock:()=>now,persist:s=>persisted=structuredClone(s),emit:(type,payload)=>events.push({type,payload}),locale:()=> 'en'});
  return {config:model.config,model,snapshot,devices,events,update:()=>model.update(snapshot),advance:ms=>now+=ms,saved:()=>persisted};
}
const portSensor=openValue=>({deviceId:'port',capability:input,activeValue:openValue,full:true,partial:true,delay:false});

test('Discovery offers Shelly door-open alarms and the configured port input without selecting sensors or error/command capabilities',()=>{
  const h=setup(false),before=structuredClone(h.config),choices=sensors.discover({devices:h.devices},h.config);
  assert.deepEqual(choices.map(c=>[c.d.id,c.cap]).sort(),[['door','alarm_open'],['motion','alarm_motion.1'],['port',input]].sort());
  assert.equal(choices.find(c=>c.cap===input).activeValue,false);assert.deepEqual(h.config,before);
  const extra={id:'light-input',name:'Light switch',capabilities:{[input]:boolean(),alarm_generic:boolean()}};
  assert(!sensors.discover({devices:{...h.devices,extra}},h.config).some(c=>c.d.id==='light-input'));
  const faulty=structuredClone(h.config);faulty.security.garage.statusCapability='alarm_generic';assert(!sensors.discover({devices:h.devices},faulty).some(c=>c.cap==='alarm_generic'));
  h.devices.port.capabilities[input].setable=true;assert(!sensors.discover({devices:h.devices},h.config).some(c=>c.cap===input));
});

test('Selecting an input captures polarity; changed garage settings cannot silently flip or replace an existing alarm sensor',()=>{
  const h=setup(false),choice=sensors.discover({devices:h.devices},h.config).find(c=>c.cap===input),selected=sensors.selection(choice);
  assert.deepEqual(selected,{...portSensor(false),full:false,partial:false});selected.full=true;h.config.security.intrusion.sensors.push(selected);
  h.config.security.garage.openValue=true;
  assert.equal(sensors.discover({devices:h.devices},h.config).find(c=>c.cap===input).activeValue,false);
  h.config.security.garage.statusDeviceId='another';assert.equal(sensors.discover({devices:h.devices},h.config).find(c=>c.cap===input).activeValue,false);
  assert.equal(validate(h.config).security.intrusion.sensors[0].activeValue,false);
});

test('Configuration accepts door-open and input polarity but rejects missing polarity, error alarms, command buttons and normal sensor inversion',()=>{
  const h=setup(false,c=>c.security.intrusion.sensors=[portSensor(false),{deviceId:'door',capability:'alarm_open',full:true,partial:true,delay:true}]);
  assert.deepEqual(validate(h.config),h.config);
  for(const bad of [{...portSensor(false),activeValue:undefined},{...portSensor(false),activeValue:'false'},{...portSensor(false),capability:'alarm_generic'},{...portSensor(false),capability:'button.restart'},{deviceId:'door',capability:'alarm_open',activeValue:false,full:true,partial:true,delay:false}]){
    const c=structuredClone(h.config);c.security.intrusion.sensors=[bad];assert.throws(()=>validate(c));
  }
  const legacy=defaults(),before=structuredClone(legacy);assert.deepEqual(validate(legacy),before);
});

for(const openValue of [true,false])for(const mode of ['armed','partially_armed']){
  test(`Port input raises exactly one ${mode} alarm when raw ${openValue} means open`,()=>{
    const h=setup(openValue,c=>c.security.intrusion.sensors=[portSensor(openValue)]);h.model.mode(mode,h.snapshot);
    assert.equal(h.model.state.active,false);h.devices.port.capabilities[input].value=openValue;h.update();h.update();
    assert.equal(h.model.state.mode,mode);assert.equal(h.events.filter(e=>e.type==='alarm').length,1);
    assert.equal(h.model.state.context.sensorName,'Portstatus');assert.equal(h.model.state.context.reason,'Portstatus: garage door opened');
  });
}

test('Shelly door-open alarms use the existing entry delay and closing cannot cancel the countdown',()=>{
  const h=setup(true,c=>c.security.intrusion.sensors=[{deviceId:'door',capability:'alarm_open',full:true,partial:true,delay:true}]);h.model.mode('partially_armed',h.snapshot);
  h.devices.door.capabilities.alarm_open.value=true;h.update();assert(h.model.state.entryAt);assert(!h.model.state.active);
  assert.equal(h.model.state.context.reason,'Garasjedør: door/window opened');h.devices.door.capabilities.alarm_open.value=false;h.update();h.advance(5000);h.update();assert(h.model.state.active);
});

test('Open-at-arming inverted input waits for confirmed closed state, including unknown readings and restart',()=>{
  const h=setup(false,c=>c.security.intrusion.sensors=[portSensor(false)]);h.devices.port.capabilities[input].value=false;h.model.mode('armed',h.snapshot);
  assert.equal(h.model.state.mode,'armed');assert.equal(h.model.state.bypassed.length,1);assert(!h.model.state.active);
  const restarted=setup(false,c=>c.security.intrusion.sensors=[portSensor(false)],h.saved());restarted.devices.port.capabilities[input].value=false;restarted.update();assert(!restarted.model.state.active);
  for(const value of [null,undefined,'true']){restarted.devices.port.capabilities[input].value=value;restarted.update();assert.equal(restarted.model.state.bypassed.length,1);}
  restarted.snapshot.connected=false;restarted.devices.port.capabilities[input].value=true;restarted.update();assert.equal(restarted.model.state.bypassed.length,1);
  restarted.snapshot.connected=true;restarted.update();assert.equal(restarted.model.state.bypassed.length,0);restarted.devices.port.capabilities[input].value=false;restarted.update();assert(restarted.model.state.active);
});

test('Unknown or unavailable port inputs prevent arming and never become a false closed value',()=>{
  for(const mutate of [h=>h.devices.port.capabilities[input].value=null,h=>h.devices.port.capabilities[input].value='false',h=>h.devices.port.available=false,h=>delete h.snapshot.devices.port]){
    const h=setup(false,c=>c.security.intrusion.sensors=[portSensor(false)]);mutate(h);assert.throws(()=>h.model.mode('armed',h.snapshot));assert.equal(h.model.state.mode,'disarmed');
  }
});

test('Flow disable and re-enable preserve per-mode protection and use normalized closed state for inverted inputs',()=>{
  const sensor=portSensor(false),h=setup(false,c=>c.security.intrusion.sensors=[sensor]);h.model.mode('armed',h.snapshot);flows.set(h.model,sensor,'armed',false);
  h.devices.port.capabilities[input].value=false;h.update();assert(!h.model.state.active);flows.set(h.model,sensor,'armed',true);h.update();assert.equal(h.model.state.bypassed.length,1);
  h.devices.port.capabilities[input].value=true;h.update();assert.equal(h.model.state.bypassed.length,0);h.devices.port.capabilities[input].value=false;h.update();assert(h.model.state.active);
  h.model.mode('disarmed',h.snapshot);flows.set(h.model,sensor,'armed',false);h.devices.port.capabilities[input].value=true;h.model.mode('partially_armed',h.snapshot);h.devices.port.capabilities[input].value=false;h.update();assert(h.model.state.active);
});

test('Polarity edits are blocked while armed, while unrelated edits preserve the selected sensor and mode',()=>{
  const h=setup(false,c=>c.security.intrusion.sensors=[portSensor(false)]);h.model.mode('armed',h.snapshot);
  const edited=structuredClone(h.config);edited.security.intrusion.sensors[0].activeValue=true;assert.throws(()=>h.model.configure(edited),/Frakoble/);
  const unrelated=structuredClone(h.config);unrelated.security.garage.openValue=true;h.model.configure(unrelated);assert.equal(h.model.state.mode,'armed');assert.equal(h.model.config.security.intrusion.sensors[0].activeValue,false);
});

test('Flow autocomplete labels the garage input and Shelly door contact correctly and keeps stable selected IDs',async()=>{
  const h=setup(false,c=>c.security.intrusion.sensors=[portSensor(false),{deviceId:'door',capability:'alarm_open',full:true,partial:false,delay:true}]),cards={};
  const app={engine:{config:h.config},adapter:{homey:{i18n:{getLanguage:()=> 'en'}},catalogue:{devices:h.devices}},homey:{flow:{getActionCard:id=>cards[id]={registerArgumentAutocompleteListener:(_,fn)=>cards[id].autocomplete=fn,registerRunListener:()=>{}}}}};flows.register(app);
  const all=await cards.disable_alarm_sensor.autocomplete('',{mode:'armed'});assert.equal(all.find(s=>s.deviceId==='port').name,'Portstatus · Garage door');assert.equal(all.find(s=>s.deviceId==='door').name,'Garasjedør · Door/window');
  const night=await cards.enable_alarm_sensor.autocomplete('',{mode:'partially_armed'});assert.equal(night.length,1);assert.equal(night[0].id,JSON.stringify(['port',input]));
});
