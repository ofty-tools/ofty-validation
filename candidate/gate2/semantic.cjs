'use strict';
// Author-approved semantic selector; no numeric reclassification or fixture lookup.
const progression=new Set(['moderate_progression','fast_progression','very_fast_progression']);
const clone=x=>JSON.parse(JSON.stringify(x));
const STRUCTURAL_STATES=new Set(['adequate_stable','progressing','floor','suspicious','signal_limited','unclassifiable','insufficient','not_assessed']);
function normalizeStructural(native){
 if(native==null)return 'not_assessed';
 const map={floor_effect:'floor',fast_progression:'progressing',suspicious_trend:'suspicious',myopia_limited_structural_signal:'signal_limited',erm_limited_structural_signal:'signal_limited',unclassifiable:'unclassifiable'};
 if(native.classification==='stable_trend')return native.data_quality==='insufficient'?'insufficient':'adequate_stable';
 return Object.prototype.hasOwnProperty.call(map,native.classification)?map[native.classification]:'unknown';
}
function collectM4Cautions(native){
 if(native==null)return {codes:[],priority1:false,unknown:false};
 const flags=new Set(Array.isArray(native.caution_flags)?native.caution_flags:[]),codes=new Set();
 const artifact=flags.has('artifact_suspected_due_to_quality');
 const vshape=artifact&&String(native.logic_trace?.vshape_rule_applied).startsWith('applied:');
 const finalLow=flags.has('final_scan_low_reliability_rate_confirmation_required');
 const poorCap=!finalLow&&flags.has('poor_quality_final_scan_cap');
 if(vshape)codes.add('vshape_artifact_detected');
 if(finalLow)codes.add('final_scan_low_reliability_rate_confirmation_required');
 if(!vshape&&!finalLow&&!poorCap&&artifact)codes.add('artifact_suspected_due_to_quality');
 if(poorCap)codes.add('poor_quality_final_scan_cap');
 const priority1=codes.size>0;
 const other=['rnfl_floor_effect','floor_effect','myopia_limits_oct_interpretation','myopia_limited','erm_limits_oct_interpretation','erm_maculopathy','slope_not_statistically_significant'];
 for(const c of other)if(flags.has(c))codes.add(c);
 const known=new Set(['artifact_suspected_due_to_quality','final_scan_low_reliability_rate_confirmation_required','poor_quality_final_scan_cap',...other,'rnfl_near_floor','n2_single_interval_limitation','regression_failed','insufficient_data','no_input','low_test_count']);
 const unknown=!Array.isArray(native.caution_flags)||[...flags].some(c=>!known.has(c));
 return {codes:[...codes],priority1,unknown};
}
// Provisional staging surface copy; machine hero vocabulary is preserved.
function structuralPresentation(state,insufficient,priority1,concordant){
 const partial=['floor','signal_limited','unclassifiable'].includes(state);
 const signal=['progressing','suspicious'].includes(state);
 const limitation=state==='floor'?'OCT floor effect limits structural assessment.':state==='signal_limited'?'OCT interpretation is limited by the source-reported myopia or ERM.':state==='unclassifiable'?'OCT structural assessment is unclassifiable.':null;
 const independent=signal?(state==='progressing'&&!priority1?(concordant?'Functional and structural progression signals are concordant.':'Independent structural progression signal; functional confirmation is not established.'):'Unconfirmed structural signal; source quality or trend limitations require review.'):null;
 return {copy_status:'REQUIRES_AUTHOR_FINAL_COPY_APPROVAL',assessment_qualification:partial?'Integrated assessment is incomplete.':null,oct_limitation:limitation,independently_scoped_structural_signal:independent,functional_insufficient_preserved:insufficient,artifact_role:'raw_JSON_staging_harness_not_production_equivalent_M5'};
}
function select(f){
 const n=f.native,label=['No progression','No progression detected'].includes(f.display.label)?'Stable':f.display.label,q=n.data_quality,cls=n.classification;
 const valid=['Stable','Suspicious trend','Progressing','Not assessable'].includes(label)&&['adequate','limited','insufficient'].includes(q)&&((q==='insufficient'&&cls==='unclassifiable')||(['adequate','limited'].includes(q)&&(progression.has(cls)||cls==='no_or_slow_progression')))&&!(label==='Not assessable'&&['adequate','limited'].includes(q)&&['fast_progression','very_fast_progression'].includes(cls));
 if(!valid)return 'SAFE_MATERIAL_FALLBACK';
 if(q==='insufficient'||cls==='unclassifiable'||f.display.assessability==='not_assessable'||label==='Not assessable')return 'INSUFFICIENT';
 if(label==='Stable')return progression.has(cls)?'A1':'CLEAN_DOMAIN';
 if(label==='Suspicious trend')return 'A2';
 return progression.has(cls)?'PROGRESSION':'B1';
}
function semantic(input){
 const inp=clone(input),f=inp.functional,n=f.native,d=f.display,p=inp.pressure,s=inp.structural,obs=f.source_observation;
 const rule=select(f),label=['No progression','No progression detected'].includes(d.label)?'Stable':d.label;
 const insufficient=n.data_quality==='insufficient'||n.classification==='unclassifiable'||d.assessability==='not_assessable'||label==='Not assessable';
 const b1=label==='Progressing'&&(!progression.has(n.classification)||insufficient),codes=new Set(),guards=new Set();
 const declared=s.state,effective=s.native!=null?normalizeStructural(s.native):STRUCTURAL_STATES.has(declared)?declared:'not_assessed';
 if(!STRUCTURAL_STATES.has(declared)||effective==='unknown'||declared!==effective){codes.add('structural_state_native_mismatch');guards.add('STRUCTURAL_STATE_MISMATCH');}
 s.state=effective;
 const m4Cautions=collectM4Cautions(s.native);
 for(const c of m4Cautions.codes)codes.add(c);
 if(m4Cautions.priority1)guards.add('M4_SIGNAL_VALIDITY');
 if(m4Cautions.unknown){codes.add('unmapped_upstream_caution_m4');guards.add('UNMAPPED_UPSTREAM_CAUTION');}
 if(rule==='CLEAN_DOMAIN'&&['progressing','suspicious'].includes(s.state)){codes.add('m3_m4_discordant_signals');codes.add('structural_progression_without_functional_confirmation');guards.add('P7B_STRUCTURAL_LEAD');}
 const binding=inp.producer_binding||inp.context;
 const context=binding.eye!==inp.context.eye?'mixed_eye':binding.assessment_id!==inp.context.assessment_id?'foreign_assessment':binding.generation!==inp.context.generation?'stale_generation':null;
 const incompatible=(inp.received_policy_contract||inp.versions.policy_contract)!==inp.versions.policy_contract;
 const m1=inp.m1_context||{},same=!!(m1.observation_id&&m1.observation_id===p.observation_id&&m1.gat!=null&&p.value_mmhg!=null&&m1.gat!==p.value_mmhg);
 const eligible=p.value_mmhg!==null&&p.method==='GAT'&&p.role==='current_on_treatment'&&p.attested===true&&p.selected===true;
 let pos=same?'withheld':!eligible?'not_available':p.value_mmhg<p.target[0]?'below_range':p.value_mmhg>p.target[1]?'above_range':'within_range';
 if(context||incompatible){pos='withheld';codes.add(context||'incompatible_policy_version');guards.add('CONTEXT');}
 if(same){codes.add('same_observation_raw_conflict');guards.add('PRESSURE_CONFLICT');}
 if(pos==='not_available')codes.add('current_GAT_not_available');
 const t1=n.caution_flags.includes('inconsistent_functional_pattern'),t2=d.assessability==='not_assessable';
 const lowlast=obs.lastMD<=-25&&obs.lastRelLow&&label==='Stable'&&!((n.progression_rate.slope_md_per_year!==null&&n.progression_rate.slope_md_per_year<=-1)||obs.maxReliableDrop>4.5);
 if(t2){codes.add(f.executed_source_statements.includes('M3.source.L3321')?'m3_not_assessable_floor':'m3_not_assessable_source');guards.add('T2');}
 if(lowlast){codes.add('m3_low_reliability_at_floor');guards.add('LOWLAST');}
 if(t1){codes.add('inconsistent_functional_pattern');guards.add('T1');}
 if(insufficient){codes.add(n.classification==='unclassifiable'||n.data_quality==='insufficient'?'native_functional_insufficient':'m3_not_assessable_source');guards.add('INSUFFICIENT');}
 if(b1){codes.add('source_display_progressing_native_nonconfirmation');codes.add('unconfirmed_functional_signal_review_required');guards.add('B1');if(!f.executed_source_statements.length)codes.add('source_branch_provenance_unavailable');}
 if(rule==='SAFE_MATERIAL_FALLBACK'){codes.add('unaccounted_material_source_combination');guards.add(rule);}
 if(rule==='A1'){codes.add(f.executed_source_statements.includes('M3.source.L3568')?'history_vs_current_plateau':'unresolved_history_vs_current_interpretation');guards.add('A1');}
 if(rule==='A2'){codes.add('unconfirmed_functional_signal_review_required');guards.add('A2');}
 if(!t2&&label==='Suspicious trend'&&f.candidate.state==='suspicious_trend'){codes.add('unconfirmed_functional_signal_review_required');guards.add('A2');}
 for(const c of n.caution_flags)if(['low_reliability_fields_present','low_test_reliability'].includes(c)||(c==='non_significant_trend'&&progression.has(n.classification))||(c==='inference_unavailable_exact_fit'&&progression.has(n.classification)))codes.add(c);
 if(s.state==='floor')codes.add('rnfl_floor_effect');
 if(inp.m2?.stage==='NTG'&&inp.m2.mode==='B'&&inp.m2.progression==='confirmed'){codes.add('clinical_override_recommended');codes.add('limited_input_scope');}
 const concordant=!t2&&label==='Progressing'&&progression.has(n.classification),partial=pos==='not_available'||s.state==='floor'||!['adequate_stable','progressing'].includes(s.state),blocked=guards.size>0;
 let hero=context||incompatible?'context_blocked':insufficient?'not_assessable':rule==='A1'?'history_vs_current_conflict':['A2','B1'].includes(rule)?'unconfirmed_functional_signal':rule==='PROGRESSION'?'functional_progression':lowlast||t1||same||rule==='SAFE_MATERIAL_FALLBACK'||['M4_SIGNAL_VALIDITY','P7B_STRUCTURAL_LEAD','STRUCTURAL_STATE_MISMATCH','UNMAPPED_UPSTREAM_CAUTION'].some(g=>guards.has(g))?'review_required':'no_signal';
 const disposition=context||incompatible?'context_blocked':blocked?'protective_review_required':partial?'partial':'complete';
 const concern=blocked||partial||(!concordant&&s.state!=='adequate_stable')?'not_graded':concordant?(['fast_progression','very_fast_progression'].includes(n.classification)?'high':'relevant'):pos==='above_range'?'relevant':'low';
 const clean=rule==='CLEAN_DOMAIN'&&!blocked&&s.state==='adequate_stable';
 if(pos==='below_range')codes.add('below_target_not_control_or_tolerability_evidence');
 const reason=[...codes].sort(),guard=[...guards].sort();
 const integration={disposition,concern,concern_scope:blocked?'integrated_with_reasons':partial?'partial_integrated':'assessed_domains_global_MD_average_RNFL',unqualified_reassurance:false,qualified_low_eligible:!blocked&&!partial&&!concordant&&s.state==='adequate_stable'&&pos==='within_range',guards:guard,reason_codes:reason,review_status:blocked?'review_required':'no_material_review_guard',clean_domain_concern:clean?'low':'not_graded',pressure_low_eligibility:pos==='within_range',concern_basis:'inherited_v03_qualified_integration_or_material_review',low_eligibility_reason:pos==='below_range'?'below_target_not_control_or_tolerability_evidence':blocked||partial||concordant||pos!=='within_range'?'material_or_partial_scope':'assessed_clean_domains_and_eligible_current_GAT_within_target'};
 if(clean&&pos==='below_range'&&concern==='low')Object.assign(integration,{concern_basis:'clean_assessed_domains_and_eligible_measured_GAT_not_above_range_inherited_R8',concern_scope:'qualified_integrated_R8_clean_global_MD_and_average_RNFL_with_measured_GAT_below_range_excludes_pressure_control_or_tolerability',concern_category:'qualified_integrated_low_below_range',concern_derivation:{rule:'inherited_M5_R8_concordant_stable_and_IOP_at_or_below_target',functional:'assessable_native_no_or_slow_progression_clean_domain_rule',structural:'adequate_stable_average_RNFL',pressure:'eligible_selected_attested_on_treatment_measured_GAT_position_below_range',pressure_role:'gate_not_above_range_only_not_evidence_of_control_tolerability_or_safety',not_substitutable_by:['M1_corrected_estimate','ORA_IOPcc','Corvis_bIOP','untreated_baseline']},prohibited_inferences:['pressure_controlled','target_achieved_as_clinical_status','well_tolerated','treatment_safe','low_individual_disease_risk_from_below_target_measurement'],qualified_low_eligible:false,pressure_low_eligibility:false});
 if(integration.concern==='low'&&(s.state!=='adequate_stable'||guards.size))throw new Error('unsafe_structural_low');
 return {semantic_version:'gate2-semantic-0.3.1',context:inp.context,hero:{signal:hero,qualified:true,material_codes:reason},pressure:{position:pos,raw_GAT_mmhg:eligible?p.value_mmhg:null,range:p.target,basis:eligible&&!['withheld','not_available'].includes(pos)?'selected_attested_current_GAT':pos,selected_observation_id:eligible?p.observation_id:null,contextual_estimate_operative:false},functional:{native_classification:n.classification,numbers:n.progression_rate,p_status:n.progression_rate.p_value!==null?'available_native_convention_unchanged':'not_available',display:d,candidate:f.candidate,source_predicates:f.source_predicates,branch_ids:f.executed_source_statements,windows:f.windows,reliability:f.reliability,source_caution_flags:n.caution_flags,native_progression_band_preserved:progression.has(n.classification),independently_supported_progression_visible:concordant,candidate_confirms_progression:false,advanced_context_visible:obs.lastMD<=-12,advanced_context_basis:'existing M3.calculate source context L3616-L3624, not an M5 risk threshold',global_MD_scope:true,primary_assessability:insufficient?'insufficient':'assessable',primary_state:insufficient?'not_assessable':progression.has(n.classification)?'mathematical_progression':'numerical_no_or_slow_progression',contextual_signal:b1||label==='Suspicious trend'?'unconfirmed_functional_signal':'absent',selected_rule:rule,native_data_quality:n.data_quality,native_sufficiency_rule:n.logic_trace?.sufficiency_rule_applied,numerical_progression_visible:progression.has(n.classification)},structural:{state:s.state,declared_state:declared,source_data_quality:s.native?.data_quality||null,floor_context_visible:s.state==='floor',independent_progression_visible:s.state==='progressing',native:s.native||null,average_RNFL_scope:true},integration,confidence:{native_M3:n.confidence_level,display_M3:d.confidence,integrated:blocked||partial?'indeterminate':concordant&&s.state==='adequate_stable'?'low':n.confidence_level==='low'?'low':'medium',scope:context||incompatible?'blocked':blocked||partial?'partial_or_uncertain':'assessed_domains'},cautions:reason.map(code=>({code,material:true,source:'approved_contract/source_evidence'})),surface_material_sets:Object.fromEntries(['hero','card','copy','print','json'].map(k=>[k,reason.slice()])),presentation:{...structuralPresentation(s.state,insufficient,m4Cautions.priority1,concordant),material_hidden_count:0,secondary_only_cap:3,below_is_control_proof:false,management:'disabled',final_wording:'pending_author_review'},m2_policy:{original_cct:inp.m2?.cct||null,effective_cct:inp.m2?.covered_thick?'average':inp.m2?.cct||null,covered_thick_modifier_count:0,old_range:inp.m2?.old_range||null,target_range:p.target},provenance:{versions:inp.versions,candidate_execution:'EXECUTED_SYNTHETIC_CANDIDATE',artifact_role:'isolated_candidate',oracle:'oracle-spec-0.4.1'}};
}
// C1-A (author-approved 2026-10-11): canonical honest-absence shapes emitted by the staging integrate() when no
// M3 / M2 producer result exists. Anything else is treated as an M3 functional or M2 pressure assertion that needs a producer.
const ABSENT_FUNCTIONAL={native:{classification:'unclassifiable',data_quality:'insufficient',progression_rate:{slope_md_per_year:null,p_value:null},confidence_level:'low',caution_flags:[],logic_trace:{}},display:{label:'Not assessable',assessability:'not_assessable',confidence:'low',concern:'not_graded'},candidate:{state:'absent'},source_predicates:{},executed_source_statements:[],windows:{},reliability:{},source_observation:{lastMD:null,lastRelLow:false,maxReliableDrop:0}};
const ABSENT_PRESSURE={method:null,role:null,value_mmhg:null,attested:false,selected:false,observation_id:null,target:[null,null]};
const canon=x=>Array.isArray(x)?'['+x.map(canon).join(',')+']':x&&typeof x==='object'?'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canon(x[k])).join(',')+'}':JSON.stringify(x);
const isAbsentFunctional=f=>canon(f)===canon(ABSENT_FUNCTIONAL);
const isAbsentPressure=(p,m2)=>m2==null&&canon(p)===canon(ABSENT_PRESSURE);
// Every public integrated call requires a contemporaneous producer inventory.
function compute(input,active,producers){
 const reasons=[];
 const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 if(input?.versions?.policy_contract!=='G1-v0.2+G1-D03a-v0.1+PRECODE-H2-A2-v0.1+B1A-approved-2026-10-10')reasons.push('incompatible_policy_version');
 for(const [m,state] of Object.entries(active?.producers||{})){
  if(state?.state!=='ready')reasons.push('invalidated_producer_'+m);
  else if(!(producers||[]).some(p=>p?.module===m))reasons.push('missing_producer_envelope_'+m);
 }
 const m4Envelope=(producers||[]).find(p=>p?.module==='m4');
 if(input?.structural?.state!=='not_assessed'&&!m4Envelope)reasons.push('structural_state_without_producer');
 // C1-A: an asserted M3 functional state or M2 pressure/target with the producer absent from BOTH the active inventory and the
 // envelopes fails closed with a domain-specific reason. Inventoried-but-missing/invalid/stale producers keep their existing exact reasons.
 const hasEnvelope=m=>(producers||[]).some(p=>p?.module===m),inventoried=m=>Object.prototype.hasOwnProperty.call(active?.producers||{},m);
 const functionalAbsent=isAbsentFunctional(input?.functional);
 if(!functionalAbsent&&!hasEnvelope('m3')&&!inventoried('m3'))reasons.push('functional_state_without_producer');
 if(!isAbsentPressure(input?.pressure,input?.m2)&&!hasEnvelope('m2')&&!inventoried('m2'))reasons.push('pressure_attestation_without_producer');
 if(!STRUCTURAL_STATES.has(input?.structural?.state)||m4Envelope&&(normalizeStructural(m4Envelope.payload)==='unknown'||input.structural.state!==normalizeStructural(m4Envelope.payload)))reasons.push('structural_state_native_mismatch');
 const pressure=input?.pressure;
 if(!pressure||!Array.isArray(pressure.target)||pressure.target.length!==2||
    (pressure.value_mmhg!==null&&(!Number.isFinite(pressure.value_mmhg)||!pressure.target.every(Number.isFinite)||pressure.target[0]>pressure.target[1])))reasons.push('invalid_pressure_types');
 if(!active||!input?.context)reasons.push('missing_active_context');
 else for(const k of ['assessment_id','generation','eye','acquisition_epoch','input_revision'])if(input.context[k]!==active[k])reasons.push('context_mismatch_'+k);
 if(!Array.isArray(producers)||!producers.length)reasons.push('unattested_producers');
 for(const p of producers||[]){if(!p||p.contract!=='gate2-producer-0.1.0'||!Number.isInteger(p.revision)||p.revision<1||!p.epoch)reasons.push('incompatible_producer');else{
  for(const k of ['assessment_id','generation','eye','acquisition_epoch','input_revision'])if(p.context?.[k]!==active?.[k])reasons.push('producer_context_'+k);
  if(active?.producers?.[p.module]?.revision!==p.revision||active?.producers?.[p.module]?.epoch!==p.epoch)reasons.push('stale_producer');
  if(active?.producers?.[p.module]?.state!=='ready')reasons.push('invalidated_producer');
  if(p.module==='m3'&&!equal(input.functional,p.payload?.functional))reasons.push('functional_payload_mismatch');
  if(p.module==='m2'&&!equal(input.pressure,p.payload?.pressure_observation))reasons.push('pressure_observation_mismatch');
  if(p.module==='m4'&&!equal(input.structural?.native,p.payload))reasons.push('structural_payload_mismatch');
  const supported={m1:'1.0.0',m2:'1.1.0-gate2.1',m3:'2.3.1',m4:'1.3.1'};
  if(p.payload?.algorithm_version!==supported[p.module])reasons.push('unsupported_source_version');
  if(p.module==='m2'&&p.payload?.target_policy_version!=='B-narrow-O1-0.4.1')reasons.push('unsupported_target_policy');
 }}
 if(reasons.length)return {status:'context_blocked',integration:{disposition:'context_blocked',concern:'not_graded'},reason_codes:[...new Set(reasons)],final_copy_status:'REQUIRES_AUTHOR_FINAL_COPY_APPROVAL'};
 try{const r=semantic(input);
  // C1-A: missing M3 is reported as missing, never only as genuine native insufficiency.
  if(functionalAbsent&&!hasEnvelope('m3')){const code='functional_producer_absent';const add=a=>[...new Set([...(a||[]),code])].sort();
   r.integration.reason_codes=add(r.integration.reason_codes);r.hero.material_codes=add(r.hero.material_codes);
   r.cautions=r.integration.reason_codes.map(c=>({code:c,material:true,source:'approved_contract/source_evidence'}));
   for(const k of Object.keys(r.surface_material_sets))r.surface_material_sets[k]=r.integration.reason_codes.slice();
   r.provenance={...r.provenance,functional_producer:'absent_no_m3_producer'};
   if(r.integration.concern==='low'||r.integration.qualified_low_eligible)throw new Error('unsafe_low_without_m3');}
  return r;}catch(e){return {status:'context_blocked',reason_codes:['invalid_typed_input'],integration:{disposition:'context_blocked',concern:'not_graded'}};}
}
if(typeof module!=='undefined')module.exports={semantic,select,compute,normalizeStructural,collectM4Cautions,ABSENT_FUNCTIONAL,ABSENT_PRESSURE};
if(typeof window!=='undefined')window.Gate2Semantic={select,compute,normalizeStructural};
