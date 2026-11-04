import {database} from './store';
import type {RecordItem} from './domain';

// D1 batches run as one transaction. Each dependent write is gated by the
// freshly generated mutation marker, so a stale tab cannot partially confirm.
export async function operatorOutcome(owner:string,r:RecordItem,b:RecordItem,status:string,reference:string){
 const db=database(),at=new Date().toISOString(),m=crypto.randomUUID();
 const statements=[db.prepare(`UPDATE records SET data=?,status=?,last_activity=?,updated_at=?,version=version+1,mutation=? WHERE id=? AND owner=? AND version=? AND status='Pending' AND EXISTS(SELECT 1 FROM records b WHERE b.id=? AND b.owner=? AND b.version=? AND b.status NOT IN ('Cancelled','Completed') AND (?!='Booked' OR json_extract(b.data,'$.selectedOperatorId') IS NULL))`).bind(JSON.stringify({...r.data,reference,respondedAt:at}),status,at,at,m,r.id,owner,r.version,b.id,owner,b.version,status),
 db.prepare(`INSERT INTO events(id,owner,record_id,event,detail,actor,at) SELECT ?,owner,id,'operator_outcome',?,?,? FROM records WHERE id=? AND owner=? AND mutation=?`).bind(crypto.randomUUID(),status+(reference?' · '+reference:''),owner,at,r.id,owner,m)];
 if(status==='Booked')statements.push(db.prepare(`UPDATE records SET status='Booked',data=json_set(data,'$.selectedOperatorId',?,'$.selectedRequestId',?,'$.confirmedAt',?),last_activity=?,updated_at=?,version=version+1,mutation=? WHERE id=? AND owner=? AND EXISTS(SELECT 1 FROM records WHERE id=? AND owner=? AND mutation=?)`).bind(r.data.operatorId,r.id,at,at,at,m,b.id,owner,r.id,owner,m),db.prepare(`INSERT INTO events(id,owner,record_id,event,detail,actor,at) SELECT ?,owner,id,'booking_confirmed',?,?,? FROM records WHERE id=? AND owner=? AND mutation=?`).bind(crypto.randomUUID(),'Operator confirmed: '+reference,owner,at,b.id,owner,m));
 const result=await db.batch(statements);if(!result[0].meta.changes)throw new Error('Request or booking changed. Refresh and try again.');
}

export async function recordPayment(owner:string,data:Record<string,any>){
 const db=database(),at=new Date().toISOString(),id=crypto.randomUUID(),m=crypto.randomUUID();
 // Refund balance is checked inside the transaction, not only against the UI
 // snapshot. Two tabs cannot both refund the same remaining money.
 const result=await db.batch([db.prepare(`INSERT INTO records(id,owner,kind,data,status,last_activity,created_at,updated_at,mutation)
 SELECT ?,?,'payments',?,'',?,?,?,? WHERE EXISTS(SELECT 1 FROM records WHERE id=? AND owner=? AND kind='bookings' AND json_extract(data,'$.currency')=?) AND (?!='Refund' OR ? <= (SELECT COALESCE(SUM(CASE WHEN json_extract(data,'$.type')='Refund' THEN -1 ELSE 1 END * CAST(json_extract(data,'$.amount') AS REAL)),0) FROM records WHERE owner=? AND kind='payments' AND json_extract(data,'$.bookingId')=?))`).bind(id,owner,JSON.stringify(data),at,at,at,m,data.bookingId,owner,data.currency,data.type,Number(data.amount),owner,data.bookingId),
 db.prepare(`INSERT INTO events(id,owner,record_id,event,detail,actor,at) SELECT ?,owner,?,'payment_recorded',?,?,? FROM records WHERE id=? AND owner=?`).bind(crypto.randomUUID(),data.bookingId,data.type+' '+data.amount+' '+data.currency+' · '+data.method,owner,at,id,owner)]);
 if(!result[0].meta.changes)throw new Error('Payment balance or booking currency changed. Refresh and try again.');
}
