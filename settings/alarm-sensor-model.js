(function(root,factory){
  'use strict';
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.HouseGuardAlarmSensors=factory();
})(typeof window==='undefined'?globalThis:window,()=>{
  'use strict';
  const key=sensor=>JSON.stringify([sensor.deviceId,sensor.capability]);
  function kind(capability){
    if(/^alarm_motion(?:\.[\w-]+)?$/.test(capability))return 'motion';
    if(/^alarm_(?:contact|open)(?:\.[\w-]+)?$/.test(capability))return 'contact';
    if(/^shelly_input_switch(?:\.[\w-]+)?$/.test(capability))return 'garage';
    return null;
  }
  const label=capability=>({motion:'Bevegelse',contact:'Dør/vindu',garage:'Garasjeport'}[kind(capability)]||'Sensor');
  function active(sensor,value){
    if(typeof value!=='boolean'||!kind(sensor.capability))return null;
    if(kind(sensor.capability)==='garage')return typeof sensor.activeValue==='boolean'?value===sensor.activeValue:null;
    return value;
  }
  function discover(catalog,config){
    const devices=catalog.devices||{},choices=new Map(),selected=config.security.intrusion.sensors;
    const add=(d,cap,activeValue)=>choices.set(key({deviceId:d.id,capability:cap}),{d,cap,activeValue});
    for(const d of Object.values(devices))for(const [cap,c]of Object.entries(d.capabilities||{})){
      if(['contact','motion'].includes(kind(cap))&&c.getable!==false&&(c.type===undefined||c.type==='boolean'))add(d,cap,true);
    }
    // A Shelly switch input is a port contact only through the user's explicit
    // garage-status configuration. Never offer error alarms or command buttons.
    const garage=config.security.garage,d=devices[garage.statusDeviceId],c=d?.capabilities?.[garage.statusCapability];
    if(kind(garage.statusCapability)==='garage'&&c?.type==='boolean'&&c.getable!==false&&c.setable!==true&&typeof garage.openValue==='boolean')add(d,garage.statusCapability,garage.openValue);
    // Keep previously chosen inputs and their polarity after garage setup changes.
    for(const sensor of selected){
      const id=key(sensor),d=devices[sensor.deviceId],c=d?.capabilities?.[sensor.capability];
      if(choices.has(id)){
        if(kind(sensor.capability)==='garage')choices.get(id).activeValue=sensor.activeValue;
      }else add(c&&c.getable!==false&&(c.type===undefined||c.type==='boolean')?d:{id:sensor.deviceId,available:false},sensor.capability,sensor.activeValue);
    }
    return [...choices.values()];
  }
  function selection(choice){
    return {deviceId:choice.d.id,capability:choice.cap,full:false,partial:false,delay:false,
      ...(kind(choice.cap)==='garage'?{activeValue:choice.activeValue}:{})};
  }
  return {key,kind,label,active,discover,selection};
});
