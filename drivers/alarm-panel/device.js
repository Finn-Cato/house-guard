'use strict';
const Homey=require('homey');
const i18n=require('../../lib/backend-i18n');
module.exports=class AlarmPanelDevice extends Homey.Device {
  async onInit() {
    this.stopped=false;this.queue=Promise.resolve();
    // Existing paired panels must lose the independent arming control too.
    if(this.hasCapability('homealarm_state'))await this.removeCapability('homealarm_state');
    const options={title:{no:'Avstill alarm',en:'Dismiss alarm'}};
    if(JSON.stringify(this.getCapabilityOptions('button').title)!==JSON.stringify(options.title))await this.setCapabilityOptions('button',options);
    this.registerCapabilityListener('button',async()=>{try{await this.homey.app.setAlarmMode('disarmed');await this.sync();}catch(error){throw i18n.error(error,this.homey);}});
    this.listener=()=>this.refresh();this.homey.app.on('intrusion_changed',this.listener);
    this.timer=this.homey.setInterval(()=>this.refresh(),5000);await this.refresh();
  }
  sync() {
    this.queue=this.queue.catch(()=>{}).then(async()=>{
      if(this.stopped)return;const s=this.homey.app.getAlarmStatus();
      if(!s.selected){await this.setUnavailable(this.homey.__('alarm.not_selected'));return;}
      const phase=s.active?'triggered':s.entryAt?'entry':s.target?'exit':s.mode;
      const disabled=s.disabledSensors?.filter(sensor=>sensor.mode===(s.target || s.mode)).length || 0;
      const status=`${s.observation?this.homey.__('alarm.observation')+' · ':''}${this.homey.__('alarm.'+phase)}${s.active && s.context?' · '+i18n.text(s.context.reason,this.homey):''}${s.bypassed?.length?' · '+i18n.t('Venter på: {names}',{names:s.bypassed.map(x=>x.name).join(', ')},this.homey):''}${disabled?' · '+i18n.t('{count} sensor(er) deaktivert fra Flow',{count:disabled},this.homey):''}${s.mode!=='disarmed' && s.sensorCounts?.[s.mode]===0?' · '+i18n.t('Ingen sensorer overvåkes',{},this.homey):''}${s.faults.length?' · '+s.faults.map(source=>i18n.text(source,this.homey)).join(' · '):''}`;
      for(const [id,value]of [['alarm_generic',s.active],['alarm_status',status]])if(this.getCapabilityValue(id)!==value)await this.setCapabilityValue(id,value);
      if(!this.stopped)await this.setAvailable();
    });return this.queue;
  }
  async refresh(){try{await this.sync();}catch(error){this.error(error);if(!this.stopped)await this.setUnavailable(this.homey.__('alarm.unavailable')).catch(()=>{});}}
  onUninit(){this.stopped=true;if(this.timer)this.homey.clearInterval(this.timer);if(this.listener)this.homey.app.removeListener('intrusion_changed',this.listener);}
  onDeleted(){this.onUninit();}
};
