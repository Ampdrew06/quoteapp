import React from 'react';
import {NavLink} from 'react-router-dom';
import {isAdminUser,isTradeUser} from '../../lib/userRole';
export default function EdwardianNavigation(){
 const admin=isAdminUser(),tabs=[['/quote','Home'],['/quote/edwardian','Design/Options'],...(admin?[[ '/quote/edwardian/plan-manufacture','Manufacture Book'],['/quote/edwardian/technical','Technical'],['/quote/edwardian/technical#edwardian-tiles-laths','Tiles/Laths'],['/quote/edwardian/idiot-list','Idiot List'],['/quote/edwardian/summary','Summary'],['/quotes','Quotes'],['/jobs','Jobs'],['/customers','Customers']]:isTradeUser()?[['/my-quotes','My Quotes']]:[])];
 return <nav className="print:hidden nav-strip" aria-label="Edwardian navigation" style={{fontFamily:'Inter,system-ui,Arial'}}><div className="nav-inner"><div className="nav-tabs-left">{tabs.map(([to,label])=><NavLink key={to} to={to} end className={({isActive})=>'nav-tab'+(isActive?' nav-tab-active':'')}>{label}</NavLink>)}</div>{admin&&<div className="nav-tabs-right"><button className="nav-tab nav-tab-ghost" type="button" onClick={()=>window.print()}>Print</button><NavLink className="nav-tab" to="/materials">Materials</NavLink></div>}</div></nav>;
}
