import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const html=`<!doctype html><html><head><title>Lynx e2e Cloud</title><style>body{margin:0}lynx-view{display:block;width:640px;height:600px}</style></head><body><lynx-view url="/dist/main.web.bundle"></lynx-view><script type="module" src="/node_modules/@lynx-js/web-core/dist/client_prod/static/js/client.js"></script></body></html>`;
const types={'.js':'text/javascript','.css':'text/css','.json':'application/json','.wasm':'application/wasm','.html':'text/html'};
http.createServer(async(req,res)=>{try{if(req.url==='/'){res.setHeader('Content-Type','text/html');res.end(html);return}const p=path.resolve('.','.'+new URL(req.url,'http://localhost').pathname);if(!p.startsWith(process.cwd()+'/'))throw Error('path');res.setHeader('Content-Type',types[path.extname(p)]||'application/octet-stream');res.end(await readFile(p));}catch{res.writeHead(404);res.end('not found')}}).listen(4180,'127.0.0.1');
