import React from 'react';
import {Link,Navigate} from 'react-router-dom';
import {isAdminUser,isTradeUser} from '../lib/userRole';
import {getCurrentCustomer} from '../lib/customers';
import logo from '../timberlite-logo-small.jpg';
import MyQuotesSection from '../components/home/MyQuotesSection';
import './QuoteHome.css';
export default function MyQuotes(){
 if(isAdminUser())return <Navigate to="/quotes" replace/>;
 if(!isTradeUser()||!getCurrentCustomer()?.id)return <Navigate to="/quote" replace/>;
 return <div className="th-home th-myquotes-page"><header className="th-header"><Link to="/quote" className="th-brand"><img src={logo} alt="Timberlite"/></Link><nav aria-label="My Quotes navigation"><Link to="/quote">New quote</Link><Link className="th-active" to="/my-quotes">My Quotes</Link></nav></header><main className="th-main"><MyQuotesSection/></main></div>;
}
