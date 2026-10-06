import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const html=`<!doctype html><html><head><title>FORM / STUDIO · Everyday Chair</title><style>body{margin:0;background:#e5e7df;min-height:100vh;display:flex;align-items:center;justify-content:center}lynx-view{display:block;width:440px;height:820px;box-shadow:0 20px 70px #1c271b24}</style></head><body><lynx-view url="/dist/main.web.bundle"></lynx-view><script type="module" src="/node_modules/@lynx-js/web-core/dist/client_prod/static/js/client.js"></script><script>
let lastWheel=0;
document.addEventListener('wheel',event=>{
 const photo=event.composedPath().find(node=>node.classList?.contains('photo'));
 if(!photo || Math.abs(event.deltaX)<=Math.abs(event.deltaY))return;
 event.preventDefault();
 if(Date.now()-lastWheel<400)return;
 lastWheel=Date.now();
 const track=photo.querySelector('.photo-track');
 const rect=photo.getBoundingClientRect();
 const x=rect.left+rect.width/2,y=rect.top+rect.height/2;
 const send=(type,dx)=>{const touch=new Touch({identifier:1,target:track,clientX:x+dx,clientY:y});track.dispatchEvent(new TouchEvent(type,{bubbles:true,composed:true,touches:type==='touchend'?[]:[touch],changedTouches:[touch]}));};
 send('touchstart',0);send('touchmove',Math.sign(event.deltaX)*rect.width);send('touchend',Math.sign(event.deltaX)*rect.width);
},{passive:false});
</script></body></html>`;
const types={'.png':'image/png','.js':'text/javascript','.css':'text/css','.json':'application/json','.wasm':'application/wasm','.html':'text/html'};
http.createServer(async(req,res)=>{try{if(req.url==='/'){res.setHeader('Content-Type','text/html');res.end(html);return}const pathname=new URL(req.url,'http://localhost').pathname;const p=path.resolve('.', pathname.startsWith('/static/')?'./dist'+pathname:'.'+pathname);if(!p.startsWith(process.cwd()+'/'))throw Error('path');res.setHeader('Content-Type',types[path.extname(p)]||'application/octet-stream');res.end(await readFile(p));}catch{res.writeHead(404);res.end('not found')}}).listen(4180,'127.0.0.1');
