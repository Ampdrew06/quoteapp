import React from 'react';
import {NavLink} from 'react-router-dom';
import {isAdminUser,isTradeUser} from '../../lib/userRole';
export default function VictorianNavigation(){
 const admin=isAdminUser(),tabs=[['/quote','Home'],['/quote/victorian','Design/Options'],...(admin?[[ '/quote/victorian/plan-manufacture','Manufacture Book'],['/quote/victorian/technical','Technical'],['/quote/victorian/technical#victorian-tiles-laths','Tiles/Laths'],['/quote/victorian/idiot-list','Idiot List'],['/quote/victorian/summary','Summary'],['/quotes','Quotes'],['/jobs','Jobs'],['/customers','Customers']]:isTradeUser()?[['/my-quotes','My Quotes']]:[])];
 return <nav className="print:hidden nav-strip" aria-label="Victorian navigation" style={{fontFamily:'Inter,system-ui,Arial'}}><div className="nav-inner"><div className="nav-tabs-left">{tabs.map(([to,label])=><NavLink key={to} to={to} end className={({isActive})=>'nav-tab'+(isActive?' nav-tab-active':'')}>{label}</NavLink>)}</div>{admin&&<div className="nav-tabs-right"><button className="nav-tab nav-tab-ghost" type="button" onClick={()=>window.print()}>Print</button><NavLink className="nav-tab" to="/materials">Materials</NavLink></div>}</div></nav>;
}
