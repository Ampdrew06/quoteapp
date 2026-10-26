import React from 'react';
import {NavLink} from 'react-router-dom';
import {useRememberRoofNavigation} from '../../lib/roofNavigation';
export default function VictorianHippedNavigation(){
 useRememberRoofNavigation('victorian-hipped');
 const base='/quote/victorian-hipped',tabs=[['/quote','Home'],[base,'Design/Options'],[base+'/plan-manufacture','Manufacture Book'],[base+'/technical','Technical'],['/quotes','Quotes'],['/jobs','Jobs'],['/customers','Customers']];
 return <nav className="nav-strip print:hidden" aria-label="Victorian Hipped navigation"><div className="nav-inner"><div className="nav-tabs-left">{tabs.map(([to,label])=><NavLink key={to} to={to} end className={({isActive})=>'nav-tab'+(isActive?' nav-tab-active':'')}>{label}</NavLink>)}</div><div className="nav-tabs-right"><button type="button" className="nav-tab nav-tab-ghost" onClick={()=>window.print()}>Print</button><NavLink className="nav-tab" to="/materials">Materials</NavLink></div></div></nav>;
}
