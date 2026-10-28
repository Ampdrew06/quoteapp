import React,{useState,useEffect} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import TradeLogin from '../TradeLogin';
import logo from '../timberlite-logo-small.jpg';
import {isAdminUser,isTradeUser} from '../lib/userRole';
import RoofStylePlan from '../components/home/RoofStylePlan';
import {roofStyles,startRoofDesign} from '../components/home/roofStyles';
import {victorianHippedDesignDefaults} from '../lib/geometry/victorianHippedGeometry';
import MyQuotesSection from '../components/home/MyQuotesSection';
import './QuoteHome.css';
export default function QuoteWizard(){
 const navigate=useNavigate(),[,refresh]=useState(0);
 useEffect(()=>{const update=()=>refresh(n=>n+1);window.addEventListener('quoteapp_user_role_updated',update);window.addEventListener('quoteapp_customer_updated',update);return()=>{window.removeEventListener('quoteapp_user_role_updated',update);window.removeEventListener('quoteapp_customer_updated',update);};},[]);
 const admin=isAdminUser(),trade=isTradeUser();
 return <div className="th-home"><header className="th-header"><Link to="/quote" className="th-brand"><img src={logo} alt="Timberlite solid roof systems"/></Link><div className="th-login"><TradeLogin onLogin={()=>refresh(n=>n+1)}/></div><nav aria-label="Home navigation"><Link className="th-active" to="/quote">New quote</Link>{(admin||trade)&&<Link to={admin?'/quotes':'/my-quotes'}>{admin?'Saved Quotes':'My Quotes'}</Link>}</nav><span className="th-account-label">{admin?'Admin':trade?'Trade account':'Roof quotations'}</span></header>
 <main className="th-main"><div className="th-intro"><div><span className="th-eyebrow">YOUR NEXT ROOF STARTS HERE</span><h1>Which shape matches your roof?</h1><p>Choose the plan that looks like your conservatory. We’ll take care of the details.</p></div><span className="th-plan-note">Plans shown from above</span></div>
 <div className="th-roofs th-shape-gallery" aria-label="Roof shapes">{roofStyles.map(r=><button type="button" key={r.id} className={'th-roof-card'+(r.wide?' th-wide-roof':'')} disabled={!r.ready&&!(admin&&r.id==='victorian-hipped')} onClick={()=>admin&&r.id==='victorian-hipped'?(localStorage.setItem('victorianHippedPreviewInputs',JSON.stringify(victorianHippedDesignDefaults)),navigate('/quote/victorian-hipped')):startRoofDesign(r.id,navigate)} aria-label={r.name+(r.ready||(admin&&r.id==='victorian-hipped')?' — open dimensions and options':admin&&r.id==='victorian-five'?' — admin plan preview':' — coming soon')}><div className="th-roof-diagram"><RoofStylePlan id={r.id} name={r.name}/></div><strong>{r.name}</strong>{!r.ready&&<span className="th-coming-badge">{admin&&(r.id==='victorian-five'||r.id==='victorian-hipped')?'Admin preview':'Coming soon'}</span>}</button>)}</div>
 {trade&&<MyQuotesSection compact/>}
 {admin&&<section className="th-admin"><h2>Admin tools</h2><div><Link to="/quotes">Quotes</Link><Link to="/jobs">Jobs</Link><Link to="/customers">Customers</Link><Link to="/materials">Materials</Link><Link to="/tiles-laths?mode=manual">Tile Calc</Link><Link to="/quote/victorian-hipped">Victorian Hipped Preview</Link></div></section>}
 </main><footer className="th-footer">Timberlite · Made in Hull<span>Your roof. Clearly quoted.</span></footer></div>;
}
