import {useRememberRoofNavigation} from '../../lib/roofNavigation';
import React from 'react';
import {NavLink} from 'react-router-dom';
import {isAdminUser,isTradeUser} from '../../lib/userRole';
export default function VictorianNavigation({five=false}={}){
 useRememberRoofNavigation(five?'victorian-five':'victorian');
 const admin=isAdminUser(),family=five?'victorian-five':'victorian',tabs=[['/quote','Home'],['/quote/'+family,'Design/Options'],...(admin?[['/quote/'+family+'/plan-manufacture','Manufacture Book'],['/quote/'+family+'/technical','Technical'],['/quote/'+family+'/tiles-laths','Tiles/Laths'],['/quote/'+family+'/idiot-list','Idiot List'],['/quote/'+family+'/summary','Summary'],['/quotes','Quotes'],['/jobs','Jobs'],['/customers','Customers']]:isTradeUser()?[['/my-quotes','My Quotes']]:[])];
 return <nav className="print:hidden nav-strip" aria-label="Victorian navigation" style={{fontFamily:'Inter,system-ui,Arial'}}><div className="nav-inner"><div className="nav-tabs-left">{tabs.map(([to,label])=><NavLink key={to} to={to} end className={({isActive})=>'nav-tab'+(isActive?' nav-tab-active':'')}>{label}</NavLink>)}</div>{admin&&<div className="nav-tabs-right"><button className="nav-tab nav-tab-ghost" type="button" onClick={()=>window.print()}>Print</button><NavLink className="nav-tab" to="/materials">Materials</NavLink></div>}</div></nav>;
}
