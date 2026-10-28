import React from 'react';
// Shared wording and interaction; roof adapters retain their own geometry.
export default function SoffitRequirementControl({mode='automatic',size='',onModeChange,onSizeChange,style,allowSideRestriction=true}){
 return <><label>Soffit requirement<select aria-label="Soffit requirement" value={mode} onChange={e=>onModeChange(e.target.value)} style={style}><option value="automatic">Automatic</option>{allowSideRestriction&&<option value="specified">Soffit restriction to side</option>}<option value="none">No soffit</option></select></label>{mode==='specified'&&allowSideRestriction&&<label>Required side soffit (mm)<input aria-label="Required side soffit (mm)" type="number" min="0" step="0.1" placeholder="e.g. 80" value={size} onChange={e=>onSizeChange(e.target.value)} style={style}/></label>}</>;
}
