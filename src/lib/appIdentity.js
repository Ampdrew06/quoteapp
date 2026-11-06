// Supplement the static public manifest so existing CRA HTML templates also
// receive Timberlite branding. No worker, cache, login or database is changed.
export function configureTimberliteIdentity(doc,publicUrl=''){
 if(!doc?.head)return;
 let base=String(publicUrl||'').replace(/\/+$/,'');if(base==='.')base='';
 const asset=path=>base+'/'+path;
 const link=(rel,href,extra={})=>{
  const existing=Array.from(doc.head.querySelectorAll(`link[rel="${rel}"]`)),node=existing.shift()||doc.createElement('link');
  existing.forEach(el=>el.remove());node.setAttribute('rel',rel);node.setAttribute('href',href);Object.entries(extra).forEach(([k,v])=>node.setAttribute(k,v));if(!node.parentNode)doc.head.appendChild(node);
 };
 const meta=(name,content)=>{let node=doc.head.querySelector(`meta[name="${name}"]`);if(!node){node=doc.createElement('meta');node.setAttribute('name',name);doc.head.appendChild(node);}node.setAttribute('content',content);};
 doc.title='Timberlite';
 link('manifest',asset('manifest.json'));
 link('icon',asset('favicon.ico?v=284'),{type:'image/x-icon',sizes:'16x16 32x32 48x48'});
 link('apple-touch-icon',asset('timberlite-icons/apple-touch-icon.png'),{sizes:'180x180'});
 meta('application-name','Timberlite');meta('theme-color','#0284c7');meta('apple-mobile-web-app-title','Timberlite');meta('apple-mobile-web-app-capable','yes');meta('mobile-web-app-capable','yes');meta('apple-mobile-web-app-status-bar-style','default');
}
