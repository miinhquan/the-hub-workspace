import {account} from '@/lib/access';
import {database} from '@/lib/store';

const headers={'Cache-Control':'private, no-store',Vary:'Accept'};

export async function GET(req:Request){
 try{
  await account(req);
  const row=await database().prepare('SELECT revision FROM wa_sync WHERE id=1').first<{revision:number}>();
  const revision=row?.revision??0;
  if(req.headers.get('accept')?.includes('application/json'))return Response.json({revision},{headers});

  // Existing tabs reconnect with the last event ID. One check per request
  // avoids running repeated authentication and database reads in a stream.
  const changed=req.headers.get('last-event-id')!==String(revision);
  const event=changed?`id: ${revision}\nevent: change\ndata: ${revision}\n\n`:'';
  return new Response('retry: 15000\n\n'+event,{headers:{...headers,'Content-Type':'text/event-stream'}});
 }catch(e){
  const unauthorized=e instanceof Error&&e.message==='AUTH_REQUIRED';
  return Response.json({error:unauthorized?'Please log in':'WhatsApp updates are temporarily unavailable.'},{status:unauthorized?401:500,headers});
 }
}
