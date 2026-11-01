/* OFTY A-prime v0.4.0 HT01 isolated staging. Clinical producers remain unchanged. */
(() => {
 'use strict';
 const routes={'iop-cct':'m1','target-iop':'m2','vf-progression':'m3','rnfl-progression':'m4'};
 const module=routes[location.pathname.split('/').filter(Boolean).find(p=>routes[p])];
 if(!module)return;
 let host=null,token=null,seq=0,notifyFailures=0;
 try{if(window!==top&&parent.location.origin===location.origin&&parent.Gate2Host?.protocol==='ofty-aprime-host-1'&&frameElement.dataset.gate2Module===module){host=parent.Gate2Host;token=crypto.randomUUID();}}catch{}
 const reason=window===top?'standalone_mode':'framed_by_non_host';
 if(host){
  Object.defineProperty(window,'__OFTY_APRIME_FRAME__',{value:Object.freeze({module,token,get seq(){return seq;},get notifyFailures(){return notifyFailures;}}),configurable:false,writable:false});
  const capture=e=>{
   seq++;
   try{host.markDirty(module,token,{type:e.type,key:e.key??null,trusted:e.isTrusted,seq});}catch{notifyFailures++;}
  };
  for(const type of ['click','dblclick','auxclick','input','beforeinput','change','keydown','paste','cut','drop','reset','submit','compositionend','error','unhandledrejection'])addEventListener(type,capture,{capture:true});
  addEventListener('pagehide',()=>{seq++;try{host.frameUnloading(module,token);}catch{notifyFailures++;}});
 }
 const same=(a,b)=>!!a&&!!b&&['assessment_id','generation','eye','acquisition_epoch','input_revision'].every(k=>a[k]===b[k]);
 function current(){try{return host?.context(module,token)||null;}catch{return null;}}
 function publish(m,payload,eye){
  if(!host||m!==module)return {status:'standalone_nonintegrated',reason:m!==module?'module_route_mismatch':reason};
  try{return host.publish(module,token,payload,eye,seq);}catch{notifyFailures++;try{host.frameError(module,token,'host_publish_failed');}catch{}return {status:'standalone_nonintegrated',reason:'host_publish_failed'};}
 }
 window.Gate2Session=Object.freeze({current,publish,same,newAssessment(){throw Error('standalone_mode');},resume(){throw Error('standalone_mode');},invalidate(m){if(host&&m===module){seq++;try{host.markDirty(module,token,{type:'explicit_invalidate',seq});}catch{notifyFailures++;}}}});
 function mount(){
  const box=document.createElement('section');box.id='g2context';box.style.cssText='background:#fff5d9;color:#17263b;padding:12px;border:2px solid #ac7417;margin:12px;font:14px system-ui';
  box.append(document.createTextNode(host?'A′ embedded producer · synthetic staging · Calculate after each edit.':'Standalone calculator · no integrated assessment publication.'));
  if(module==='m2'){
   const row=document.createElement('div');row.innerHTML='<label><input id="g2gatattest" type="checkbox"> Current value is selected measured on-treatment Goldmann GAT</label> <label>Observation ID <input id="g2observation"></label> <label>Observed at <input id="g2observed" type="datetime-local"></label>';box.append(row);row.querySelector('#g2observation').value=crypto.randomUUID();
  }
  document.body.prepend(box);
  if(host){try{if(document.body.dataset.gate2Module!==module)throw Error('module_route_mismatch');host.register(module,token,window);}catch{notifyFailures++;try{host.frameError(module,token,'module_route_mismatch');}catch{}}}
 }
 if(document.readyState==='loading')addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
