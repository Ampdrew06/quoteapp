import {useRememberRoofNavigation} from '../../lib/roofNavigation';
import React from 'react';
import {NavLink} from 'react-router-dom';
export default function CombinationNavigation(){
 useRememberRoofNavigation('combination');
 const tabs=[['/quote','Home'],['/quote/combination','Design/Options'],['/quote/combination/plan-manufacture','Manufacture Book'],['/quote/combination/technical','Technical'],['/quote/combination/tiles-laths','Tiles/Laths'],['/quote/combination/idiot-list','Idiot List'],['/quote/combination/summary','Summary'],['/quotes','Quotes'],['/jobs','Jobs'],['/schedule','Schedule'],['/customers','Customers']];
 return <nav className="print:hidden nav-strip" aria-label="Combination navigation" style={{fontFamily:'Inter,system-ui,Arial'}}><div className="nav-inner"><div className="nav-tabs-left">{tabs.map(([to,label])=><NavLink key={to} to={to} end className={({isActive})=>'nav-tab'+(isActive?' nav-tab-active':'')}>{label}</NavLink>)}</div><div className="nav-tabs-right"><button type="button" className="nav-tab nav-tab-ghost" onClick={()=>window.print()}>Print</button><NavLink className="nav-tab" to="/materials">Materials</NavLink></div></div></nav>;
}
