import {roofStyles,startRoofDesign} from './roofStyles';
function store(){const values={activeDesignRecord:'old',leanBookDetails:'old'};return {values,getItem:key=>values[key]??null,setItem:(key,value)=>values[key]=value,removeItem:key=>delete values[key]};}
test('working roof cards start a fresh design detached from the saved quote',()=>{
 for(const roof of roofStyles.filter(r=>r.ready)){
  const storage=store(),navigate=jest.fn();expect(startRoofDesign(roof.id,navigate,storage)).toBe(true);
  expect(storage.values.activeDesignRecord).toBe(undefined);expect(storage.values.leanBookDetails).toBe(undefined);
  expect(navigate).toHaveBeenCalledTimes(1);expect(navigate.mock.calls[0][1].state.fresh).toBe(true);
 }
});
test('coming-soon and unknown cards never navigate or clear a saved record',()=>{
 for(const id of [...roofStyles.filter(r=>!r.ready).map(r=>r.id),'unknown']){
  const storage=store(),navigate=jest.fn();expect(startRoofDesign(id,navigate,storage)).toBe(false);
  expect(navigate).not.toHaveBeenCalled();expect(storage.values.activeDesignRecord).toBe('old');
 }
});
