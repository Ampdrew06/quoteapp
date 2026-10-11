import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ManufactureBookFront from './ManufactureBookFront';
import GableJobFront from '../pages/gable/GableJobFront';
const find=(node,predicate)=>{
 if(Array.isArray(node)){for(const child of node){const found=find(child,predicate);if(found)return found;}return null;}
 if(!node||typeof node!=='object')return null;
 return predicate(node)?node:find(node.props?.children,predicate);
};
test('all styles use the same information headings and typography',()=>{
 for(const style of ['Lean-To','Hipped Lean-To','Gable']){
 const html=renderToStaticMarkup(<ManufactureBookFront roof={{style,reference:'Current roof',customerName:'Current customer'}} details={{}} onChange={()=>{}} onSave={()=>{}}/>);
 expect(html).toContain('Customer Reference');expect(html).toContain('Box Gutter Details');expect(html).toContain('Glazed Options');expect(html).toContain('Current roof');expect(html).toContain(style);
 expect(html).toContain('.mbf-front .mbf-address{flex:2}');expect(html).toContain('.mbf-front .mbf-instructions{flex:1}');expect(html).toContain('font:400 15px Arial');expect(html).toContain('height:17mm');
 }
});
test('address and instruction edits preserve the other saved details',()=>{
 const changes=[],details={job_number:'J1',order_notes:'Original',delivery_address_json:{deliveryAddress:'Old address',contactName:'Andrew',contactPhone:'123'}};
 const front=ManufactureBookFront({roof:{},details,onChange:value=>changes.push(value),onSave:()=>{}});
 find(front,node=>node.type==='textarea'&&node.props['aria-label']==='Delivery address').props.onChange({target:{value:'New address'}});
 expect(changes[0].delivery_address_json).toEqual({deliveryAddress:'New address',contactName:'Andrew',contactPhone:'123'});expect(changes[0].order_notes).toBe('Original');
 find(front,node=>node.type==='textarea'&&node.props['aria-label']==='Special instructions').props.onChange({target:{value:'New instructions'}});
 expect(changes[1].order_notes).toBe('New instructions');expect(changes[1].delivery_address_json.deliveryAddress).toBe('Old address');
});
test('fresh front has no previous job, quote, address or instructions',()=>{
 const html=renderToStaticMarkup(<ManufactureBookFront roof={{style:'Gable'}} details={{}} onChange={()=>{}} onSave={()=>{}}/>);
 expect(html).not.toContain('Quote 42');expect(html).toContain('aria-label="Delivery address"></textarea>');expect(html).toContain('aria-label="Special instructions"></textarea>');
});
test('Gable adapter supplies roof values to the common template without its own layout',()=>{
 const front=GableJobFront({inputs:{customerReference:'Gable ref',tileProductId:'britmetShingle'},geometry:{pitchDeg:25,frameMM:70,leftSoffitMM:150,rightSoffitMM:150,frontOverhangMM:150,widthMM:3800,projectionMM:4100,manufacturingProjectionMM:4325,externalProjectionMM:4320},model:{installedWeightKg:500,sections:{misc:{lines:[]}}},customerName:'Trade customer',details:{},onChange:()=>{},onSave:()=>{}});
 expect(front.type).toBe(ManufactureBookFront);expect(front.props.roof.style).toBe('Gable');expect(front.props.roof.reference).toBe('Gable ref');expect(front.props.roof.dimensions).toBe('3800 × 4100mm');
});

test('job and quote numbers share one horizontal field',()=>{
 const front=ManufactureBookFront({roof:{},job:{quote_number:'42'},details:{job_number:'J7'},onChange:()=>{},onSave:()=>{}});
 const numbers=find(front,node=>node.props?.className==='mbf-numbers');
 expect(numbers).not.toBeNull();expect(numbers.props.children[0].props.value).toBe('J7');
 expect(numbers.props.children[1].props.children).toEqual(['Quote ','42']);
 const css=find(front,node=>node.type==='style').props.children;
 expect(css).toContain('.mbf-numbers{display:flex;align-items:center');
});
