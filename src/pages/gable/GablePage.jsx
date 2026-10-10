import React,{useEffect} from 'react';
import {Navigate,useLocation,useNavigate} from 'react-router-dom';
import {isAdminUser} from '../../lib/userRole';
import GableDesignPreview from './GableDesignPreview';
import GableSummary from './GableSummary';
import GableNavigation from './GableNavigation';
import GableIdiotList from './GableIdiotList';

export default function GablePage({technical=false,summary=false,idiotList=false}) {
 const location=useLocation(),navigate=useNavigate(),admin=isAdminUser();
 useEffect(()=>{
  if(!technical&&!summary&&!idiotList&&location.state?.fresh)navigate(location.pathname,{replace:true,state:{...location.state,fresh:false}});
 },[technical,summary,idiotList,location.pathname,location.state,navigate]);
 if((technical||summary||idiotList)&&!admin)return <Navigate to="/quote/gable" replace />;
 return <>
  <GableNavigation />
  {idiotList?<GableIdiotList />:summary?<GableSummary />:<GableDesignPreview key={technical?'technical':'design'} mode={technical?'technical':'design'} fresh={!technical&&!!location.state?.fresh} />}
 </>;
}
