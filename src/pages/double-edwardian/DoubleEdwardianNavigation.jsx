import React from 'react';
import {NavLink} from 'react-router-dom';
import {useRememberRoofNavigation} from '../../lib/roofNavigation';
export default function DoubleEdwardianNavigation(){
 useRememberRoofNavigation('double-edwardian');
 const tabs=[['/quote','Home'],['/quote/double-edwardian','Design/Options'],['/quote/double-edwardian/summary','Summary'],['/quotes','Quotes'],['/jobs','Jobs'],['/schedule','Schedule'],['/customers','Customers']];
 return <><nav className="print:hidden nav-strip" aria-label="Double Hipped Edwardian navigation" style={{fontFamily:'Inter,system-ui,Arial'}}><div className="nav-inner"><div className="nav-tabs-left">{tabs.map(([to,label])=><NavLink key={to} to={to} end className={({isActive})=>'nav-tab'+(isActive?' nav-tab-active':'')}>{label}</NavLink>)}</div><div className="nav-tabs-right"><NavLink className="nav-tab" to="/materials">Materials</NavLink></div></div></nav><p style={{maxWidth:1100,margin:'12px auto 0',padding:'0 16px',fontFamily:'Inter,system-ui,Arial',fontSize:13}}><strong>Provisional roof package:</strong> external valley waterproofing and manufacture cutting integration remain pending.</p></>;
}
