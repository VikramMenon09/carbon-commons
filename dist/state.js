import {DEFAULTS,calculateScenario} from './model.js';
import {BUSINESS_DEFAULTS,calculateBusiness} from './business.js';
export const STORAGE_KEY='carbon-commons-v1';
export const defaults={business:BUSINESS_DEFAULTS,policy:DEFAULTS};
export function validateInput(mode,input){
  if(!Object.hasOwn(defaults,mode)||!input||typeof input!=='object'||Array.isArray(input))throw new Error('Invalid scenario');
  const values={};
  for(const key of Object.keys(defaults[mode])){if(typeof input[key]!=='number'||!Number.isFinite(input[key]))throw new Error('Invalid scenario');values[key]=input[key]===0?0:input[key];}
  (mode==='business'?calculateBusiness:calculateScenario)(values);
  return values;
}
export function freshState(){return {version:1,business:{...BUSINESS_DEFAULTS},policy:{...DEFAULTS},saved:[]};}
export function loadState(storage){
  const state=freshState();
  try{
    const raw=storage.getItem(STORAGE_KEY);if(!raw)return {state,warning:''};
    const data=JSON.parse(raw);if(!data||data.version!==1)throw new Error('Unknown saved format');
    for(const mode of ['business','policy']){try{state[mode]=validateInput(mode,data[mode]);}catch{}}
    if(Array.isArray(data.saved)){
      const seen=new Set();const counts={business:0,policy:0};
      state.saved=data.saved.slice(0,100).flatMap(s=>{
        try{
          if(!s||typeof s.id!=='string'||!s.id.trim()||s.id.length>80||seen.has(s.id)||!Object.hasOwn(counts,s.mode)||counts[s.mode]>=3)return [];
          const input=validateInput(s.mode,s.input);seen.add(s.id);counts[s.mode]++;
          return [{id:s.id,mode:s.mode,input,name:typeof s.name==='string'&&s.name.trim()?s.name.slice(0,80):'Saved scenario'}];
        }catch{return [];}
      });
    }
    return {state,warning:''};
  }catch{return {state,warning:'Saved scenarios could not be read. You can still use the lab and export your results.'};}
}
export function saveState(storage,state){try{storage.setItem(STORAGE_KEY,JSON.stringify(state));return true;}catch{return false;}}
export function buildHash(mode,input){const values=validateInput(mode,input);return `#${mode}?${new URLSearchParams(Object.entries(values).map(([k,v])=>[k,String(v)]))}`;}
export function parseHash(hash){
  const [route,query]=(hash||'').replace(/^#/,'').split('?');
  const mode=['business','policy','contribute'].includes(route)?route:'business';
  if(!query||mode==='contribute')return {mode,input:null,error:''};
  try{
    const params=new URLSearchParams(query);const candidate={};
    for(const key of Object.keys(defaults[mode])){const raw=params.get(key);if(raw===null||raw.trim()===''||params.getAll(key).length!==1)throw new Error('Incomplete scenario');candidate[key]=Number(raw);}
    return {mode,input:validateInput(mode,candidate),error:''};
  }catch{return {mode,input:null,error:'This scenario link contains invalid values. Your last valid scenario is shown.'};}
}
