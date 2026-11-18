import {env} from 'cloudflare:workers';
import type {RecordItem,Kind} from './domain';
import {isStale} from './domain';
export const database=()=>env.DB!;
const map=(r:any):RecordItem=>({id:r.id,kind:r.kind,data:JSON.parse(r.data),status:r.status,version:r.version,createdAt:r.created_at,updatedAt:r.updated_at,lastActivity:r.last_activity,archivedAt:r.archived_at,previousStatus:r.previous_status});
export async function allRecords(owner:string){return (await database().prepare('SELECT * FROM records WHERE owner=? ORDER BY created_at DESC').bind(owner).all()).results.map(map);}
export async function one(owner:string,id:string){const r=await database().prepare('SELECT * FROM records WHERE owner=? AND id=?').bind(owner,id).first();if(!r)throw new Error('Record not found');return map(r);}
export async function archivePending(owner:string,records:{id:string;version:number}[]){
 const at=new Date().toISOString();
 const statements=records.flatMap(record=>{
  const mutation=crypto.randomUUID();
  return [
   database().prepare(`UPDATE records SET data=json_set(data,'$.archiveReason','manual'),previous_status=status,status='Archived',archived_at=?,updated_at=?,version=version+1,mutation=?
    WHERE id=? AND owner=? AND version=? AND kind='inquiries' AND status='New' AND archived_at IS NULL
    AND NOT EXISTS(SELECT 1 FROM records linked WHERE linked.owner=records.owner AND json_extract(linked.data,'$.inquiryId')=records.id AND (linked.kind='bookings' OR (linked.kind='requests' AND linked.status IN ('Pending','Booked'))))`)
    .bind(at,at,mutation,record.id,owner,record.version),
   database().prepare('INSERT INTO events(id,owner,record_id,event,detail,actor,at) SELECT ?,owner,id,?,?,?,? FROM records WHERE id=? AND owner=? AND mutation=?')
    .bind(crypto.randomUUID(),'archived','Cleared from pending inquiries',owner,at,record.id,owner,mutation)
  ];
 });
 if(!statements.length)return 0;
 const results=await database().batch(statements);
 return results.reduce((count,result,index)=>count+(index%2===0?Number(result.meta.changes||0):0),0);
}
export function event(owner:string,id:string,type:string,detail:string,actor=owner,at=new Date().toISOString()){return database().prepare('INSERT INTO events(id,owner,record_id,event,detail,actor,at) VALUES(?,?,?,?,?,?,?)').bind(crypto.randomUUID(),owner,id,type,detail,actor,at);}
export function insert(owner:string,kind:Kind,data:any,status:string,id=crypto.randomUUID(),at=new Date().toISOString()) {return {id,statement:database().prepare('INSERT INTO records(id,owner,kind,data,status,last_activity,created_at,updated_at,mutation) VALUES(?,?,?,?,?,?,?,?,?)').bind(id,owner,kind,JSON.stringify(data),status,at,at,at,crypto.randomUUID())};}
export async function update(owner:string,record:RecordItem,data:any,status:string,type:string,detail:string,archive?:{archivedAt:string|null,previousStatus:string|null},touch=true){const at=new Date().toISOString(),mutation=crypto.randomUUID();const result=await database().batch([
 database().prepare('UPDATE records SET data=?,status=?,last_activity=?,archived_at=?,previous_status=?,updated_at=?,version=version+1,mutation=? WHERE id=? AND owner=? AND version=?').bind(JSON.stringify(data),status,touch?at:record.lastActivity,archive?archive.archivedAt:record.archivedAt,archive?archive.previousStatus:record.previousStatus,at,mutation,record.id,owner,record.version),
 database().prepare('INSERT INTO events(id,owner,record_id,event,detail,actor,at) SELECT ?,owner,id,?,?,?,? FROM records WHERE id=? AND owner=? AND mutation=?').bind(crypto.randomUUID(),type,detail,owner,at,record.id,owner,mutation)
 ]);if(!result[0].meta.changes)throw new Error('This record changed in another tab. Refresh and try again.');}
export async function archiveStale(owner:string){const all=await allRecords(owner);let count=0;for(const r of all.filter(x=>isStale(x,all))){const at=new Date().toISOString();await update(owner,r,{...r.data,archiveReason:'inactivity_timeout'},'Archived','auto_archived',JSON.stringify({reason:'inactivity_timeout',thresholdHours:48,lastActivity:r.lastActivity}),{archivedAt:at,previousStatus:r.status},false);count++;}return count;}
