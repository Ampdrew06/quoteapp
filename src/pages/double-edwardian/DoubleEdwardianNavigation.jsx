import {workshopTabs} from './workshopTabs';
import React from 'react';
import {NavLink} from 'react-router-dom';
import {useRememberRoofNavigation} from '../../lib/roofNavigation';
export default function DoubleEdwardianNavigation({showScope=true}={}){
 useRememberRoofNavigation('double-edwardian');
 const tabs=[['/quote','Home'],['/quote/double-edwardian','Design/Options'],...workshopTabs.map(([path,label])=>['/quote/double-edwardian/'+path,label]),['/quote/double-edwardian/summary','Summary'],['/quotes','Quotes'],['/jobs','Jobs'],['/schedule','Schedule'],['/customers','Customers']];
 return <><nav className="print:hidden nav-strip" aria-label="Double Hipped Edwardian navigation" style={{fontFamily:'Inter,system-ui,Arial'}}><div className="nav-inner"><div className="nav-tabs-left">{tabs.map(([to,label]) =><NavLink key={to} to={to} end className={({isActive})=>'nav-tab'+(isActive?' nav-tab-active':'')}>{label}</NavLink>)}</div><div className="nav-tabs-right"><button className="nav-tab nav-tab-ghost" type="button" onClick={()=>window.print()}>Print</button><NavLink className="nav-tab" to="/materials">Materials</NavLink></div></div></nav>{showScope&&<p className="double-edwardian-scope" style={{maxWidth:1100,margin:'12px auto 0',padding:'0 16px',fontFamily:'Inter,system-ui,Arial',fontSize:13}}><strong>Provisional roof package:</strong> valley material allowances are included as selected; fitting and manufacture cutting details remain pending.</p>}</>;
}
