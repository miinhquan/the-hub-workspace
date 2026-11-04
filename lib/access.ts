import {headers} from 'next/headers';import {env} from 'cloudflare:workers';import {digest} from './passwords';
export const SESSION_COOKIE='hub_session';
export async function account(req?:Request){const h=req?.headers||await headers(),token=h.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(SESSION_COOKIE+'='))?.slice(SESSION_COOKIE.length+1)||'';if(!/^[a-f0-9]{64}$/.test(token))throw new Error('AUTH_REQUIRED');const u=await env.DB!.prepare('SELECT u.id,u.login,u.role FROM auth_users u JOIN auth_sessions s ON s.user_id=u.id WHERE s.token_hash=? AND s.expires_at>?').bind(await digest(token),Date.now()).first<{id:string;login:string;role:string}>();if(!u)throw new Error('AUTH_REQUIRED');return u;}
export async function owner(){const u=await account();return {userId:'owner',accountId:u.id,email:u.login,displayName:u.login,role:u.role,provider:'password'};}
export async function admin(){const u=await account();if(u.role!=='admin')throw new Error('ADMIN_REQUIRED');return u;}
export function sameOrigin(req:Request){if(req.headers.get('origin')!==new URL(req.url).origin)throw new Error('Invalid request origin');}
export function sessionCookie(req:Request,value:string,maxAge:number){const secure=new URL(req.url).protocol==='https:';return SESSION_COOKIE+'='+value+'; Path=/; HttpOnly; Max-Age='+maxAge+(secure?'; SameSite=None; Secure; Partitioned':'; SameSite=Lax');}
