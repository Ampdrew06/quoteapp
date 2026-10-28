// Same server route used by the existing roof quotation pages.
export async function lookupDeliveryDistance(postcode,{request=globalThis.fetch}={}){
 const code=String(postcode||'').trim();if(!code)throw new Error('Enter a delivery postcode.');
 const response=await request('/api/delivery-distance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({destinationPostcode:code})});
 const data=await response.json(),raw=data.distanceMiles,miles=Number(raw);
 if(!response.ok||!['number','string'].includes(typeof raw)||String(raw).trim()===''||!Number.isFinite(miles)||miles<0)throw new Error(data.error||'Delivery distance could not be calculated. Check the postcode and try again.');
 return {deliveryDistanceMiles:miles,deliveryDistancePostcode:code};
}
