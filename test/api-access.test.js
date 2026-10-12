'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{appApiAccess}=require('../lib/api-access');
function fixture(session){
  const calls=[],adapter={api:{sessions:{getSessionMe:async options=>{calls.push(options);return session;}}}};
  Object.defineProperty(adapter,'direct',{get(){throw Error('The personal-key client must not be accessed');}});
  return {adapter,calls};
}
test('App-scope audit reports only actual granted scopes and fixed capabilities without secrets',async()=>{
  const h=fixture({id:'private-session',userId:'private-user',token:'fake-sensitive-token',headers:{authorization:'Bearer fake-secret'},intersectedScopes:['homey.flow.start','homey.device.readonly','homey.flow.readonly','homey.flow.start']});
  const result=await appApiAccess(h.adapter);assert.equal(result.source,'sdk-app-client');assert.equal(result.available,true);
  assert.deepEqual(result.scopes,['homey.device.readonly','homey.flow.readonly','homey.flow.start']);
  assert.deepEqual(result.capabilities,{deviceRead:true,deviceControl:false,flowRead:true,flowStart:true,flowCards:false});
  assert.deepEqual(h.calls,[{$cache:false,$timeout:5000}]);assert(!/private|secret|token|authorization/.test(JSON.stringify(result)));
});
test('Full app Flow scope covers native cards; root covers device controls without a write probe',async()=>{
  for(const scopes of [['homey.flow'],['homey']]){
    const result=await appApiAccess(fixture({intersectedScopes:scopes}).adapter);assert.equal(result.capabilities.flowCards,true);assert.equal(result.capabilities.flowStart,true);
    assert.equal(result.capabilities.deviceControl,scopes[0]==='homey');
  }
});
test('Requested scopes alone and a failed read remain unknown rather than claimed permissions',async()=>{
  const result=await appApiAccess(fixture({scopes:['homey']}).adapter);assert.equal(result.available,false);assert.equal(result.capabilities,null);assert.equal(result.reasonCode,'SESSION_SCOPES_UNAVAILABLE');
  const failed=await appApiAccess({api:{sessions:{getSessionMe:async()=>{throw Error('Bearer fake-sensitive-token');}}}});assert.equal(failed.available,false);assert.equal(failed.capabilities,null);assert(!JSON.stringify(failed).includes('fake-sensitive-token'));
});
test('API handler is read-only with no dependency on active/observation settings or caller arguments',async()=>{
  const h=fixture({intersectedScopes:['homey.flow.readonly']}),homey={app:{adapter:h.adapter,engine:{config:{observation:false}}}};
  const result=await require('../api').appApiAccess({homey,body:{runFlow:true,notify:true}});assert.equal(result.available,true);assert.equal(result.capabilities.flowCards,false);assert.equal(h.calls.length,1);
});
