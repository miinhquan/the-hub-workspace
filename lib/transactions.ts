import {database} from './store';
import type {RecordItem} from './domain';

const netPaidSql=`SELECT ROUND(COALESCE(SUM(CASE WHEN json_extract(data,'$.type')='Refund' THEN -1 ELSE 1 END * CAST(json_extract(data,'$.amount') AS REAL)),0),2) FROM records WHERE owner=? AND kind='payments' AND json_extract(data,'$.bookingId')=?`;

export async function cancelBooking(owner:string,booking:RecordItem,paid:number,refundMethod?:'Cash'|'Online'){
 const db=database(),at=new Date().toISOString(),mutation=crypto.randomUUID(),{id,version}=booking;
 // Check the exact net paid amount at write time. If another tab recorded a
 // payment/refund since the cancellation dialog opened, neither write applies.
 const statements=[db.prepare(`UPDATE records SET status='Cancelled',data=json_set(data,'$.refundReview',json(?)),last_activity=?,updated_at=?,version=version+1,mutation=? WHERE id=? AND owner=? AND version=? AND kind='bookings' AND status!='Cancelled' AND (? = (${netPaidSql}))`)
  .bind(paid>0&&!refundMethod?'true':'false',at,at,mutation,id,owner,version,paid,owner,id),
  db.prepare(`INSERT INTO events(id,owner,record_id,event,detail,actor,at) SELECT ?,owner,id,'booking_status','Cancelled',?,? FROM records WHERE id=? AND owner=? AND mutation=?`)
   .bind(crypto.randomUUID(),owner,at,id,owner,mutation)];
 if(refundMethod&&paid>0){
  const currency=booking.data.currency||'VND';
  const data={bookingId:id,amount:paid,currency,method:refundMethod,type:'Refund',date:new Date(at).toLocaleDateString('en-CA',{timeZone:'Asia/Ho_Chi_Minh'}),source:'booking_cancellation'};
  statements.push(
   db.prepare(`INSERT INTO records(id,owner,kind,data,status,last_activity,created_at,updated_at,mutation) SELECT ?,owner,'payments',?,'',?,?,?,? FROM records WHERE id=? AND owner=? AND mutation=?`)
    .bind(crypto.randomUUID(),JSON.stringify(data),at,at,at,mutation,id,owner,mutation),
   db.prepare(`INSERT INTO events(id,owner,record_id,event,detail,actor,at) SELECT ?,owner,id,'payment_recorded',?,?,? FROM records WHERE id=? AND owner=? AND mutation=?`)
    .bind(crypto.randomUUID(),'Cancellation refund · '+paid+' '+currency+' · '+refundMethod,owner,at,id,owner,mutation));
 }
 const result=await db.batch(statements);
 if(!result[0].meta.changes)throw new Error('Booking or payment changed. Reopen the cancellation form and try again.');
}

// D1 batches run as one transaction. Each dependent write is gated by the
// freshly generated mutation marker, so a stale tab cannot partially confirm.
export async function operatorOutcome(owner:string,r:RecordItem,b:RecordItem,status:string,reference:string){
 const db=database(),at=new Date().toISOString(),m=crypto.randomUUID();
 const statements=[db.prepare(`UPDATE records SET data=?,status=?,last_activity=?,updated_at=?,version=version+1,mutation=? WHERE id=? AND owner=? AND version=? AND status='Pending' AND EXISTS(SELECT 1 FROM records b WHERE b.id=? AND b.owner=? AND b.version=? AND b.status NOT IN ('Cancelled','Completed') AND (?!='Booked' OR (json_extract(b.data,'$.selectedOperatorId') IS NULL AND json_extract(b.data,'$.selectedRequestId') IS NULL AND b.status!='Booked')))`).bind(JSON.stringify({...r.data,reference,respondedAt:at}),status,at,at,m,r.id,owner,r.version,b.id,owner,b.version,status),
 db.prepare(`INSERT INTO events(id,owner,record_id,event,detail,actor,at) SELECT ?,owner,id,'operator_outcome',?,?,? FROM records WHERE id=? AND owner=? AND mutation=?`).bind(crypto.randomUUID(),status+(reference?' · '+reference:''),owner,at,r.id,owner,m)];
 if(status==='Booked')statements.push(db.prepare(`UPDATE records SET status='Booked',data=json_set(data,'$.selectedOperatorId',?,'$.operatorName',?,'$.selectedRequestId',?,'$.confirmedAt',?),last_activity=?,updated_at=?,version=version+1,mutation=? WHERE id=? AND owner=? AND EXISTS(SELECT 1 FROM records WHERE id=? AND owner=? AND mutation=?)`).bind(r.data.operatorId||null,r.data.operatorName||b.data.operatorName||'',r.id,at,at,at,m,b.id,owner,r.id,owner,m),db.prepare(`INSERT INTO events(id,owner,record_id,event,detail,actor,at) SELECT ?,owner,id,'booking_confirmed',?,?,? FROM records WHERE id=? AND owner=? AND mutation=?`).bind(crypto.randomUUID(),'Operator confirmed: '+reference,owner,at,b.id,owner,m));
 const result=await db.batch(statements);if(!result[0].meta.changes)throw new Error('Request or booking changed. Refresh and try again.');
}

export async function recordPayment(owner:string,data:Record<string,any>){
 const db=database(),at=new Date().toISOString(),id=crypto.randomUUID(),m=crypto.randomUUID();
 // Refund balance is checked inside the transaction, not only against the UI
 // snapshot. Two tabs cannot both refund the same remaining money.
 const result=await db.batch([db.prepare(`INSERT INTO records(id,owner,kind,data,status,last_activity,created_at,updated_at,mutation)
 SELECT ?,?,'payments',?,'',?,?,?,? WHERE EXISTS(SELECT 1 FROM records WHERE id=? AND owner=? AND kind='bookings' AND COALESCE(json_extract(data,'$.currency'),'VND')=? AND (?='Refund' OR status IN ('Booked','Completed'))) AND (?!='Refund' OR ? <= (${netPaidSql}))`).bind(id,owner,JSON.stringify(data),at,at,at,m,data.bookingId,owner,data.currency,data.type,data.type,Number(data.amount),owner,data.bookingId),
 db.prepare(`INSERT INTO events(id,owner,record_id,event,detail,actor,at) SELECT ?,owner,?,'payment_recorded',?,?,? FROM records WHERE id=? AND owner=?`).bind(crypto.randomUUID(),data.bookingId,data.type+' '+data.amount+' '+data.currency+' · '+data.method,owner,at,id,owner)]);
 if(!result[0].meta.changes)throw new Error('Payment balance or booking currency changed. Refresh and try again.');
}
