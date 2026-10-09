import React,{useEffect} from 'react';
import {NavLink,Navigate,useLocation,useNavigate} from 'react-router-dom';
import {isAdminUser} from '../../lib/userRole';
import GableDesignPreview from './GableDesignPreview';
import GableSummary from './GableSummary';

export default function GablePage({technical=false,summary=false}) {
 const location=useLocation(),navigate=useNavigate(),admin=isAdminUser();
 useEffect(()=>{
  if(!technical&&!summary&&location.state?.fresh)navigate(location.pathname,{replace:true,state:{...location.state,fresh:false}});
 },[technical,summary,location.pathname,location.state,navigate]);
 if((technical||summary)&&!admin)return <Navigate to="/quote/gable" replace />;
 const tabs=[['/quote','Home'],['/quote/gable','Design/Options'],...(admin?[['/quote/gable/summary','Summary'],['/quote/gable/technical','Technical'],['/materials','Materials'],['/quotes','Quotes']]:[])];
 return <>
  <nav className="print:hidden nav-strip" aria-label="Gable navigation"><div className="nav-inner"><div className="nav-tabs-left">
   {tabs.map(([to,label])=><NavLink key={to} to={to} end className={({isActive})=>'nav-tab'+(isActive?' nav-tab-active':'')}>{label}</NavLink>)}
  </div></div></nav>
  {summary?<GableSummary />:<GableDesignPreview key={technical?'technical':'design'} mode={technical?'technical':'design'} fresh={!technical&&!!location.state?.fresh} />}
 </>;
}
