import React from 'react';
import {NavLink} from 'react-router-dom';
import {isAdminUser} from '../../lib/userRole';
export default function GableNavigation(){
 const admin=isAdminUser(),tabs=[['/quote','Home'],['/quote/gable','Design/Options'],...(admin?[['/quote/gable/technical','Technical'],['/quote/gable/plan-manufacture','Manufacture Book'],['/quote/gable/idiot-list','Idiot List'],['/quote/gable/summary','Summary'],['/quotes','Quotes'],['/jobs','Jobs'],['/customers','Customers']]:[])];
 return <nav className="print:hidden nav-strip" aria-label="Gable navigation"><div className="nav-inner"><div className="nav-tabs-left">{tabs.map(([to,label])=><NavLink key={to} to={to} end className={({isActive})=>'nav-tab'+(isActive?' nav-tab-active':'')}>{label}</NavLink>)}</div>{admin&&<div className="nav-tabs-right"><button type="button" className="nav-tab nav-tab-ghost" onClick={()=>window.print()}>Print</button><NavLink className="nav-tab" to="/materials">Materials</NavLink></div>}</div></nav>;
}
