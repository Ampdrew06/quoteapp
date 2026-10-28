import React from 'react';
import {NavLink} from 'react-router-dom';
import {useRememberRoofNavigation} from '../../lib/roofNavigation';
import '../../components/AppPageLayout.css';
export default function VictorianHippedNavigation(){
 useRememberRoofNavigation('victorian-hipped');
 const base='/quote/victorian-hipped',tabs=[['/quote','Home'],[base,'Design/Options'],[base+'/plan-manufacture','Manufacture Book'],[base+'/technical','Technical'],[base+'/tiles-laths','Tiles/Laths'],[base+'/idiot-list','Idiot List'],[base+'/summary','Summary'],['/quotes','Quotes'],['/jobs','Jobs'],['/customers','Customers']];
 return <nav className="nav-strip print:hidden" aria-label="Victorian Hipped navigation"><div className="nav-inner"><div className="nav-tabs-left">{tabs.map(([to,label])=>to?<NavLink key={label} to={to} end className={({isActive})=>'nav-tab'+(isActive?' nav-tab-active':'')}>{label}</NavLink>:<span key={label} className="nav-tab" aria-disabled="true" title={`${label} is not yet connected for Victorian Hipped Lean-To`} style={{opacity:.6,cursor:'default'}}>{label}</span>)}</div><div className="nav-tabs-right"><button type="button" className="nav-tab nav-tab-ghost" onClick={()=>window.print()}>Print</button><NavLink className={({isActive})=>'nav-tab'+(isActive?' nav-tab-active':'')} to="/materials">Materials</NavLink></div></div></nav>;
}
