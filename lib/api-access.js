'use strict';
const covers=(scopes,required)=>scopes.some(scope=>scope===required||required.startsWith(scope+'.'));
const capabilities=scopes=>({
  deviceRead:covers(scopes,'homey.device.readonly'),deviceControl:covers(scopes,'homey.device.control'),
  flowRead:covers(scopes,'homey.flow.readonly'),flowStart:covers(scopes,'homey.flow.start'),flowCards:covers(scopes,'homey.flow'),
});
// Read the app-permission client only. This never tests dispatch, uses the
// personal key, exposes token/session identifiers or changes observation mode.
async function appApiAccess(adapter){
  const checkedAt=Date.now(),source='sdk-app-client';
  try{
    const session=await adapter.api.sessions.getSessionMe({$cache:false,$timeout:5000});
    if(!Array.isArray(session.intersectedScopes))return {checkedAt,source,available:false,reasonCode:'SESSION_SCOPES_UNAVAILABLE',scopes:[],capabilities:null};
    const scopes=[...new Set(session.intersectedScopes.filter(scope=>typeof scope==='string'&&/^homey(?:\.[a-z][a-z0-9_-]*)*$/.test(scope)&&scope.length<=200))].sort();
    return {checkedAt,source,available:true,scopes,capabilities:capabilities(scopes)};
  }catch{return {checkedAt,source,available:false,reasonCode:'APP_SESSION_UNAVAILABLE',scopes:[],capabilities:null};}
}
module.exports={appApiAccess};
