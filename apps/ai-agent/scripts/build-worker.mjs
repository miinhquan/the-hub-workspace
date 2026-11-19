import { build } from "esbuild";
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join, extname } from "node:path";
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};
const assets = {};
async function walk(dir, prefix = "") {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === "server") continue;
    const path = join(dir, entry.name),
      key = prefix + "/" + entry.name;
    if (entry.isDirectory()) await walk(path, key);
    else
      assets[key] = {
        body: (await readFile(path)).toString("base64"),
        type: mime[extname(path)] || "application/octet-stream",
      };
  }
}
await walk("dist");
await mkdir("dist/server", { recursive: true });
const wrapped = await build({
  stdin: {
    contents: `import {handleApi,securityHeaders} from './worker/api.ts';\nconst assets=${JSON.stringify(assets)};\nexport default { async fetch(request,env) { const url=new URL(request.url); let response; if(url.pathname.startsWith('/api/')) response=await handleApi(request,env); else if(request.method!=='GET'&&request.method!=='HEAD') response=new Response('Method not allowed',{status:405}); else { let asset=assets[url.pathname]; if(!asset&&(url.pathname==='/'||url.pathname==='/ai'||url.pathname==='/ai/'||url.pathname==='/ai/admin/effects')) asset=assets['/index.html']; if(!asset)response=new Response('Not found',{status:404}); else response=new Response(request.method==='HEAD'?null:Uint8Array.from(atob(asset.body),c=>c.charCodeAt(0)),{headers:securityHeaders(asset.type,url.pathname.startsWith('/assets/')||url.pathname.startsWith('/images/')||url.pathname.startsWith('/fonts/')?'public, max-age=86400':'no-store')}); }const headers=new Headers(response.headers); const secure=securityHeaders(headers.get('content-type')||'application/json'); for(const [key,value] of Object.entries(secure))if(key!=='Content-Type'&&key!=='Cache-Control')headers.set(key,value); return new Response(response.body,{status:response.status,headers}); } };`,
    resolveDir: process.cwd(),
    sourcefile: "entry.ts",
    loader: "ts",
  },
  bundle: true,
  write: false,
  platform: "browser",
  format: "esm",
  target: "es2022",
  minify: true,
});

await writeFile("dist/server/index.js", wrapped.outputFiles[0].contents);
console.log(
  `Preview Worker built · ${Object.keys(assets).length} assets · ${Math.round(wrapped.outputFiles[0].contents.length / 1024)} KB`,
);
