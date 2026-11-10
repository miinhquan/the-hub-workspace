import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {DatabaseSync} from 'node:sqlite';

// Exercise the real route and persistence code against an isolated SQLite DB.
const sql=new DatabaseSync(':memory:');
for(const p of fs.readdirSync('drizzle').filter(p=>p.endsWith('.sql')).sort())sql.exec(fs.readFileSync('drizzle/'+p,'utf8'));
const d1={prepare(text){let args=[];return {bind(...a){args=a;return this},async first(){return sql.prepare(text).get(...args)||null},async all(){return {results:sql.prepare(text).all(...args)}},async run(){return {meta:{changes:Number(sql.prepare(text).run(...args).changes)}}}}},async batch(stmts){sql.exec('BEGIN');try{const results=[];for(const s of stmts)results.push(await s.run());sql.exec('COMMIT');return results;}catch(e){sql.exec('ROLLBACK');throw e;}}};
function compile(path,imports={}){const out={};new Function('require','exports',ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(name=>{if(name in imports)return imports[name];throw Error('Unexpected import '+name)},out);return out;}
const domain=compile('lib/domain.ts'),details=compile('lib/service-details.ts');
const env={DB:d1},store=compile('lib/store.ts',{'cloudflare:workers':{env},'./domain':domain});
const tickets=compile('lib/tickets.ts',{'./store':store}),transactions=compile('lib/transactions.ts',{'./store':store});
const finance=compile('lib/finance.ts');let loggedIn=true;
const access={async owner(){if(!loggedIn)throw Error('AUTH_REQUIRED');return {userId:'owner',displayName:'QA',role:'staff'}},sameOrigin(req){if(req.headers.get('origin')!==new URL(req.url).origin)throw Error('Invalid request origin')}};
const api=compile('app/api/workspace/route.ts',{'cloudflare:workers':{env},'@/lib/access':access,'@/lib/store':store,'@/lib/domain':domain,'@/lib/finance':finance,'@/lib/tickets':tickets,'@/lib/transactions':transactions,'@/lib/service-details':details});
const post=body=>api.POST(new Request('https://test.local/api/workspace',{method:'POST',headers:{origin:'https://test.local','content-type':'application/json'},body:JSON.stringify(body)}));
const all=()=>store.allRecords('owner');
async function addInquiry(name){assert.equal((await post({action:'save',kind:'inquiries',status:'New',data:{customerName:name,tourName:'Sapa 2D1N',operatorName:'Manual supplier',travellers:2}})).status,200);return (await all()).find(r=>r.kind==='inquiries'&&r.data.customerName===name);}
const i=await addInquiry('Manual booking');
// Nothing has to be pre-loaded in a tour library or operator directory.
assert.equal((await all()).filter(r=>['operators','tours'].includes(r.kind)).length,0);
assert.equal((await post({action:'ticketOutcome',id:i.id,version:i.version,status:'Booked',data:i.data,reference:''})).status,400);
const confirmed=await post({action:'ticketOutcome',id:i.id,version:i.version,status:'Booked',data:i.data,reference:'Confirmed by supplier in Zalo'});
assert.equal(confirmed.status,200);const bookingId=(await confirmed.json()).bookingId;
const b=await store.one('owner',bookingId);assert.equal(b.status,'Booked');assert.equal(b.data.operatorName,'Manual supplier');assert.equal(b.data.tourName,'Sapa 2D1N');
assert.equal((await post({action:'ticketOutcome',id:i.id,version:i.version,status:'Booked',data:i.data,reference:'Retry'})).status,400);
assert.equal((await all()).filter(r=>r.kind==='bookings').length,1);
assert.equal((await post({action:'save',kind:'bookings',id:b.id,version:b.version,data:{...b.data,sellingPrice:1000000,currency:'VND'}})).status,200);
assert.equal((await post({action:'save',kind:'payments',data:{bookingId:b.id,amount:500000,type:'Payment',method:'Cash',date:'2026-11-05'}})).status,200);
assert.equal((await all()).filter(r=>r.kind==='payments').length,1);
// No Slot and Cancel never create confirmed bookings or financial entries.
const unavailable=await addInquiry('No availability');
assert.equal((await post({action:'ticketOutcome',id:unavailable.id,version:unavailable.version,status:'No Slot',data:{...unavailable.data,operatorName:''},reference:''})).status,200);
const kept=await store.one('owner',unavailable.id);assert.equal(kept.status,'Ready to Book');assert.equal(kept.data.operatorAttempts[0].status,'No Slot');
assert.equal((await post({action:'archive',id:kept.id})).status,200);assert.equal((await post({action:'restore',id:kept.id})).status,200);assert.equal((await store.one('owner',kept.id)).status,'Ready to Book');
const cancel=await addInquiry('Cancelled enquiry');
assert.equal((await post({action:'ticketOutcome',id:cancel.id,version:cancel.version,status:'Cancelled',data:cancel.data,reference:''})).status,200);
assert.equal((await all()).filter(r=>r.kind==='bookings').length,1);
// Existing records remain resolvable and present in backups; new writes to
// the retired catalogues/import module are rejected on the server as well.
for(const [id,kind,data] of [['legacy-op','operators',{name:'Legacy supplier'}],['legacy-tour','tours',{name:'Legacy tour',operatorId:'legacy-op'}],['legacy-pos','imports',{name:'Old POS import',amount:999999,currency:'VND',date:'2026-11-05'}]])await store.insert('owner',kind,data,'',id).statement.run();
assert.deepEqual(details.serviceDetails({tourId:'legacy-tour'},await all()),{tourName:'Legacy tour',operatorName:'Legacy supplier'});
for(const kind of ['operators','tours','imports'])assert.equal((await post({action:'save',kind,data:{name:'Disabled module'}})).status,400);
assert.equal((await all()).filter(r=>['operators','tours','imports'].includes(r.kind)).length,3);
assert.equal(finance.monthlyLedger(await all(),'2026-11','VND').some(r=>r.kind==='imports'),false);
// Older pending bookings can still be confirmed with a manually typed supplier.
const pending=store.insert('owner','bookings',{customerName:'Legacy pending',sellingPrice:0,currency:'VND'},'Pending Operator');await pending.statement.run();
assert.equal((await post({action:'save',kind:'requests',data:{bookingId:pending.id,operatorName:'Supplier A'}})).status,200);
const req=(await all()).find(r=>r.kind==='requests');assert.equal((await post({action:'outcome',id:req.id,status:'Booked',reference:'Phone confirmation'})).status,200);
assert.equal((await store.one('owner',pending.id)).data.operatorName,'Supplier A');
assert.equal((await post({action:'save',kind:'requests',data:{bookingId:pending.id,operatorName:'Supplier B'}})).status,200);
const second=(await all()).find(r=>r.kind==='requests'&&r.data.operatorName==='Supplier B');assert.equal((await post({action:'outcome',id:second.id,status:'Booked',reference:'Duplicate supplier'})).status,400);
assert.equal((await store.one('owner',pending.id)).data.operatorName,'Supplier A');

// A booked order with no price yet is still unpaid. Cancelled and fully paid
// orders must never come back to the collection shortcut.
assert.deepEqual(new Set(domain.unpaidBookings(await all()).map(r=>r.id)),new Set([b.id,pending.id]));
const date=finance.hanoiDate(),month=date.slice(0,7),owner='owner';
const pay=(id,amount,type='Payment',method='Online')=>post({action:'save',kind:'payments',data:{bookingId:id,amount,type,method,date}});
const cancelBooking=(booking,expectedPaid,refundMethod)=>post({action:'bookingStatus',id:booking.id,status:'Cancelled',version:booking.version,expectedPaid,refundMethod});
const addBooking=async (name,sellingPrice,currency='VND')=>{
 const r=store.insert(owner,'bookings',{customerName:name,service:'Tour',sellingPrice,currency},'Booked');
 await r.statement.run();
 return store.one(owner,r.id);
};
const paidTour=await addBooking('Paid tour',1000000);
assert.equal((await pay(paidTour.id,700000)).status,200);
assert.equal((await pay(paidTour.id,300000,'Payment','Cash')).status,200);
assert.equal(domain.unpaidBookings(await all()).some(r=>r.id===paidTour.id),false);
assert.equal((await pay(paidTour.id,200000,'Refund')).status,200);
assert.equal(domain.unpaidBookings(await all()).some(r=>r.id===paidTour.id),true);
await assert.rejects(()=>transactions.cancelBooking(owner,paidTour,1000000,'Online'));
assert.equal((await store.one(owner,paidTour.id)).status,'Booked');
assert.equal((await cancelBooking(paidTour,1000000,'Online')).status,400);
assert.equal((await cancelBooking(paidTour,800000,'Online')).status,200);
assert.equal((await cancelBooking(paidTour,800000,'Online')).status,400);
await assert.rejects(()=>transactions.recordPayment(owner,{bookingId:paidTour.id,currency:'VND',amount:100,type:'Payment',method:'Cash'}));
const after=await all(),linked=after.filter(r=>r.kind==='payments'&&r.data.bookingId===paidTour.id);
assert.equal(linked.length,4);
const automaticRefund=linked.find(r=>r.data.source==='booking_cancellation');
assert.deepEqual(automaticRefund.data,{bookingId:paidTour.id,amount:800000,currency:'VND',method:'Online',type:'Refund',date,source:'booking_cancellation'});
assert.equal(after.find(r=>r.id===paidTour.id).status,'Cancelled');
assert.equal(domain.unpaidBookings(after).some(r=>r.id===paidTour.id),false);
const net=items=>items.reduce((sum,r)=>sum+(r.data.type==='Refund'?-1:1)*r.data.amount,0);
assert.equal(net(finance.monthlyLedger(after,month,'VND').filter(r=>r.data.bookingId===paidTour.id)),0);
assert.equal(finance.chartSeries(linked,'1h','VND',Date.now()).reduce((sum,bin)=>sum+bin.value,0),0);
const history=(await d1.prepare('SELECT event,detail FROM events WHERE owner=? AND record_id=?').bind(owner,paidTour.id).all()).results;
assert.equal(history.filter(r=>r.event==='booking_status'&&r.detail==='Cancelled').length,1);
assert.equal(history.filter(r=>r.detail.startsWith('Cancellation refund')).length,1);

// Cancel without refund leaves actual cash intact. Staff can log that refund later.
const held=await addBooking('Pending refund',0.3,'USD');
for(const n of [0.1,0.2])assert.equal((await pay(held.id,n)).status,200);
assert.equal((await cancelBooking(held,0.3)).status,200);
const heldAfter=await all();
assert.equal(heldAfter.find(r=>r.id===held.id).data.refundReview,true);
assert.equal(domain.paymentSummary(held,heldAfter).paid,0.3);
assert.equal(heldAfter.filter(r=>r.kind==='payments'&&r.data.bookingId===held.id).length,2);
assert.equal((await pay(held.id,0.3,'Refund')).status,200);
assert.equal(domain.paymentSummary(held,await all()).paid,0);

assert.equal((await cancelBooking(await store.one(owner,pending.id),0)).status,200);
assert.equal((await all()).some(r=>r.kind==='payments'&&r.data.bookingId===pending.id),false);
assert.equal((await api.GET()).status,200);loggedIn=false;assert.equal((await api.GET()).status,401);assert.equal((await post({action:'save',kind:'inquiries',data:{customerName:'Unauthorised'}})).status,401);
console.log('PASS: booking workflow, unpaid filters, cancellation and exact refunds, audit history, stale/repeat protection, report totals and authenticated access. Isolated DB; no live account changes.');
