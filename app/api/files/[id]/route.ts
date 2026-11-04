import {env} from 'cloudflare:workers';
import {owner} from '@/lib/access';
import {one} from '@/lib/store';
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){try{const u=await owner(),r=await one(u.userId,(await params).id);if(r.kind!=='documents'||!String(r.data.key).startsWith(u.userId+'/'))throw new Error('File not found');const f=await env.BUCKET!.get(r.data.key);if(!f)throw new Error('File not found');return new Response(f.body,{headers:{'Content-Type':'application/octet-stream','Content-Disposition':"attachment; filename*=UTF-8''"+encodeURIComponent(r.data.name),'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}catch{return new Response('Not found',{status:404});}}
