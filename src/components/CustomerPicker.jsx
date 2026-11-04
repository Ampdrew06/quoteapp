import React,{useState,useEffect,useRef,useId} from 'react';
import {sortCustomerList,isCustomerFavourite} from '../lib/customerListOrder';
export function matchingCustomers(customers,query){
 const text=String(query||'').trim().toLocaleLowerCase('en-GB');
 return sortCustomerList(customers).filter(c=>c.active!==false&&(!text||[c.name,c.customerCode,c.contactName].some(v=>String(v||'').toLocaleLowerCase('en-GB').includes(text))));
}
export default function CustomerPicker({customers=[],value='retail',onChange,style={},disabled=false}){
 const [query,setQuery]=useState(''),[open,setOpen]=useState(false),[cursor,setCursor]=useState(-1),root=useRef(null),id=useId();
 const selected=customers.find(c=>String(c.id)===String(value)),label=value==='retail'?'Retail (No Discount)':selected?.name||'Selected customer (loading)';
 const options=[{id:'retail',name:'Retail (No Discount)'},...matchingCustomers(customers.filter(c=>c.id!=='retail'),query)].filter(c=>c.id!=='retail'||!query||'retail'.includes(query.toLowerCase()));
 useEffect(()=>{const close=e=>{if(root.current&&!root.current.contains(e.target)){setOpen(false);setQuery('');}};document.addEventListener('mousedown',close);return()=>document.removeEventListener('mousedown',close);},[]);
 useEffect(()=>{if(open&&cursor>=0)document.getElementById(`${id}-${cursor}`)?.scrollIntoView({block:'nearest'});},[cursor,open,id]);
 const choose=c=>{onChange({target:{value:String(c.id)}});setOpen(false);setQuery('');setCursor(-1);};
 return <span ref={root} style={{position:'relative',display:'inline-block',minWidth:0,width:320,maxWidth:'100%',...style}}>
 <input aria-label="Customer" role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={id} aria-activedescendant={open&&cursor>=0?`${id}-${cursor}`:undefined} disabled={disabled} value={open?query:label} placeholder={open?'Type customer name or code…':label} onFocus={()=>{setOpen(true);setQuery('');setCursor(-1);}} onChange={e=>{setQuery(e.target.value);setCursor(-1);setOpen(true);}} onBlur={e=>{if(!e.currentTarget.parentElement.contains(e.relatedTarget)){setOpen(false);setQuery('');}}} onKeyDown={e=>{if(e.key==='Escape'){setOpen(false);setQuery('');return;}if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();setOpen(true);setCursor(i=>Math.max(0,Math.min(options.length-1,i+(e.key==='ArrowDown'?1:-1))));}if(e.key==='Enter'){e.preventDefault();if(open&&options[cursor])choose(options[cursor]);}}} style={{width:'100%',boxSizing:'border-box',height:34,padding:'5px 28px 5px 8px',border:'1px solid #cbd5e1',borderRadius:8,font:'inherit',background:'white'}}/>
 <span aria-hidden="true" style={{position:'absolute',right:10,top:8,pointerEvents:'none'}}>▾</span>
 {open&&<span id={id} role="listbox" style={{position:'absolute',display:'block',top:'100%',left:0,right:0,maxHeight:260,overflowY:'auto',zIndex:1000,background:'white',border:'1px solid #94a3b8',borderRadius:6,boxShadow:'0 4px 12px #0002'}}>{options.length?options.map((c,i)=><span id={`${id}-${i}`} key={c.id} role="option" aria-selected={String(c.id)===String(value)} onMouseDown={e=>e.preventDefault()} onClick={()=>choose(c)} style={{display:'block',padding:'9px 10px',cursor:'pointer',background:cursor===i?'#e0f2fe':String(c.id)===String(value)?'#f1f5f9':'white',borderBottom:'1px solid #f1f5f9'}}>{isCustomerFavourite(c.id)?'★ ':''}{c.name}{c.customerCode?' · '+c.customerCode:''}{c.id!=='retail'?' · '+Number(c.discountPct||0)+'%':''}</span>):<span style={{display:'block',padding:10}}>No matching customers</span>}</span>}
 </span>;
}
