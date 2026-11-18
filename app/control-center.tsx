'use client';
import {useLocale} from './locale';
import Analytics from './analytics';
import WhatsAppInbox from './whatsapp-inbox';
import {expenseGate,hanoiDate} from '@/lib/finance';
import {useEffect,useRef,useState} from 'react';
import {ArrowUpRight,Plus,Check,Clock,ArrowRight,Receipt,Wallet,BookOpen,Trash2,X} from 'lucide-react';
import {paymentSummary,unpaidBookings,pendingInquiries,type RecordItem} from '@/lib/domain';
type Props={records:RecordItem[];events:any[];busy:boolean;connected:boolean;open:(r:RecordItem)=>void;edit:(kind:string)=>void;go:(p:string)=>void;act:(action:string,data?:any)=>Promise<any>;copy:(s:string)=>void;openWhatsApp:(id?:string)=>void;refresh:()=>void};
const requestId=()=>typeof crypto.randomUUID==='function'?crypto.randomUUID():Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('').replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/,'$1-$2-$3-$4-$5');
const money=(n:number,c='VND')=>new Intl.NumberFormat('en-US',{style:'currency',currency:c}).format(n||0);
export default function ControlCenter({records,events,busy,connected,open,edit,go,act,copy,openWhatsApp,refresh}:Props){const {t,locale}=useLocale();
 const [tab,setTab]=useState('Pending'),[sale,setSale]=useState({customerName:'',service:'Laundry',amount:'',method:'',currency:'VND',reference:''}),[key,setKey]=useState(()=>requestId()),[saving,setSaving]=useState(false),[activityLimit,setActivityLimit]=useState(3);
 const [queueLimit,setQueueLimit]=useState(3);
 const [clearSelection,setClearSelection]=useState<{id:string;version:number}[]|null>(null);
 const [clearNotice,setClearNotice]=useState('');
 const clearDialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{
  if(clearSelection)clearDialog.current?.showModal();
  else clearDialog.current?.close();
 },[clearSelection]);
 const messages=records.filter(r=>r.kind==='notifications').sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
 const openBookingIds=new Set(records.filter(r=>r.kind==='bookings'&&!['Cancelled','Completed'].includes(r.status)).map(r=>r.id));
 const pending=records.filter(r=>r.kind==='requests'&&r.status==='Pending'&&openBookingIds.has(r.data.bookingId));
 const inquiries=records.filter(r=>r.kind==='inquiries'&&!r.archivedAt&&!['Converted','Lost','Cancelled'].includes(r.status));
 const unpaid=unpaidBookings(records);
 const departures=records.filter(r=>r.kind==='bookings'&&r.status==='Booked'&&r.data.date&&r.data.date>=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Ho_Chi_Minh'})).sort((a,b)=>a.data.date.localeCompare(b.data.date));
 const buckets:Record<string,RecordItem[]>={'Pending':pendingInquiries(records),'Waiting customer':inquiries.filter(r=>r.status==='Waiting Customer'),'Waiting for you':[...pending,...inquiries.filter(r=>['Quoted','Following Up','Ready to Book','Waiting Operator'].includes(r.status))]};const queue=(buckets[tab]||[]).sort((a,b)=>a.lastActivity.localeCompare(b.lastActivity));const gate=expenseGate(records,hanoiDate().slice(0,7));
 return <div className="control-center">
 <div className="command-bar"><button className="primary" onClick={()=>edit('inquiries')}><Plus size={16}/>{t("New inquiry")}</button><button className={!gate.ready?'expense-warning':''} onClick={()=>go('expenses')}><Receipt size={15}/>{t("Expense")}</button><button onClick={()=>go('finance')}><Wallet size={15}/>{t("Finance")}</button><button onClick={()=>go('bookings')}><BookOpen size={15}/>{t("Booking Log")}</button><button onClick={()=>edit('inquiries')}>{t("New booking")}</button><a href="https://chat.zalo.me/" target="_blank" rel="noopener noreferrer">Zalo <ArrowUpRight size={14}/></a><a href="https://docs.google.com/spreadsheets/d/1XT3TFX5PkWHG4klumHKP40zq7ZCw8qbsfyImcTMCQoM/edit?usp=sharing" target="_blank" rel="noopener noreferrer">{t("Price Sheet")} <ArrowUpRight size={14}/></a><button title={gate.missing.map(t).join(', ')} className={gate.ready?'primary finance-export':'export-blocked'} disabled={!gate.ready} onClick={()=>go('finance')}>{t("Monthly export")} <ArrowRight size={14}/></button>{!gate.ready&&<small className="missing-text">{t("Export missing:")} {gate.missing.map(t).join(', ')}</small>}</div>
 <WhatsAppInbox compact onOpen={openWhatsApp} openInquiry={id=>{const r=records.find(x=>x.id===id);if(r)open(r);}} onChange={refresh}/>
 <section className="desk-tile queue-tile">
 <header><div><span className="tile-symbol"><Clock size={20}/></span><h2>{t("Needs your attention")}</h2></div><button onClick={()=>go('bookings')}>{t("All records ↗")}</button></header>
 <div className="queue-tabs">{Object.entries(buckets).map(([label,items])=><button className={tab===label?'active':''} key={label} onClick={()=>{setTab(label);setQueueLimit(3);}}>{t(label)} <span>{items.length}</span></button>)}</div>
 {tab==='Pending'&&buckets.Pending.length>0&&<div className="queue-actions"><button className="pending-clear" disabled={busy} onClick={()=>setClearSelection(buckets.Pending.map(({id,version})=>({id,version})))}><Trash2 size={14}/>{t("Delete all pending")}</button></div>}
 {clearNotice&&<p className="queue-notice" role="status">{t(clearNotice)}</p>}
 <div className="work-list" id="attention-list">{queue.slice(0,queueLimit).map(r=>{
  const booking=r.kind==='requests'?records.find(b=>b.id===r.data.bookingId):r;
  return <button key={r.id} className="work-item" onClick={()=>open(r)}><span className={'work-dot '+(r.kind==='requests'?'orange':'')}/><span><b>{booking?.data.customerName||r.data.customerName}</b><small>{r.kind==='requests'?t("Operator reply needed"):t(r.data.service||'Inquiry')} · {booking?.data.date||t("Date not set")}</small></span><em>{t(r.status)}</em><ArrowRight size={14}/></button>;
 })}{!queue.length&&<div className="desk-empty"><Check size={30}/><b>{t("Nothing waiting here.")}</b><p>{t("Real inquiries, operator requests and upcoming departures appear as you add them.")}</p></div>}</div>
 {queue.length>3&&<footer className="list-controls">
 {queueLimit<queue.length&&<button aria-controls="attention-list" aria-expanded={queueLimit>3} onClick={()=>setQueueLimit(count=>count+10)}>{t("See more")}</button>}
 {queueLimit>3&&<button aria-controls="attention-list" onClick={()=>setQueueLimit(3)}>{t("Collapse")}</button>}
 <small>{Math.min(queueLimit,queue.length)} / {queue.length}</small>
 </footer>}
 <dialog className="record-dialog pending-dialog" ref={clearDialog} aria-labelledby="clear-pending-title" onCancel={()=>setClearSelection(null)}>
 <div className="dialog-title"><h2 id="clear-pending-title">{t("Delete all pending")}</h2><button aria-label={t("Close form")} disabled={busy} onClick={()=>setClearSelection(null)}><X size={20}/></button></div>
 <p>{clearSelection?.length} {t("pending inquiries will move to Archived. You can restore them from Inquiries.")}</p>
 <div className="pending-dialog-actions"><button disabled={busy} onClick={()=>setClearSelection(null)}>{t("Cancel")}</button><button className="pending-clear" disabled={busy} onClick={async()=>{
  const result=await act('clearPending',{records:clearSelection});
  if(result){
   setClearSelection(null);
   setQueueLimit(3);
   setClearNotice(result.skipped?'Changed inquiries were kept. Review the remaining pending list.':'Pending inquiries cleared.');
  }
 }}>{busy?t("Saving…"):t("Confirm clear pending")}</button></div>
 </dialog>
 </section>
 <div className="sales-column"> <section className="desk-tile quick-sale"><header><div><span className="tile-symbol"><Receipt size={20}/></span><h2>{t("Record a sale")} <small>{t("Walk-in · cash or online")}</small></h2></div>
 <select className={'unpaid-bookings-select '+(unpaid.length?'expense-warning':'')} aria-label={t("Unpaid bookings")} value="" disabled={!unpaid.length} onChange={e=>{const booking=unpaid.find(r=>r.id===e.target.value);if(booking)open(booking);}}>
 <option value="" disabled>{unpaid.length?t("Unpaid bookings")+' ('+unpaid.length+')':t("No unpaid bookings")}</option>
 {unpaid.map(r=>{const {balance}=paymentSummary(r,records);return <option key={r.id} value={r.id}>{[r.data.customerName,r.data.tourName||t(r.data.service||'Booking'),r.data.date,balance>0?money(balance,r.data.currency):null,r.id.slice(0,8).toUpperCase()].filter(Boolean).join(' · ')}</option>;})}
 </select></header><form onSubmit={async e=>{e.preventDefault();setSaving(true);try{if(await act('quickSale',{idempotencyKey:key,data:{...sale,amount:Number(sale.amount)}})){setSale({...sale,customerName:'',amount:'',reference:''});setKey(requestId());}}finally{setSaving(false);}}}><label>{t("Customer name")}<input required value={sale.customerName} onChange={e=>setSale({...sale,customerName:e.target.value})} placeholder={t("Name only is enough")}/></label><label>{t("Service")}<select value={sale.service} onChange={e=>setSale({...sale,service:e.target.value})}>{['Laundry','Tour','Bus ticket','Train ticket','SIM / eSIM','Other'].map(s=><option key={s} value={s}>{t(s)}</option>)}</select></label><label>{t("Amount")}<input required type="text" inputMode="decimal" pattern={sale.currency==='VND'?'[0-9]+':'[0-9]+([.][0-9]{1,2})?'} value={sale.amount} onChange={e=>setSale({...sale,amount:e.target.value.replace(/,/g,'')})} placeholder="0"/></label><label>{t("Currency")}<select value={sale.currency} onChange={e=>setSale({...sale,currency:e.target.value})}><option>VND</option><option>USD</option></select></label><label>{t("Note")}<input value={sale.reference} onChange={e=>setSale({...sale,reference:e.target.value})} placeholder={t("Optional")}/></label><div className="pay-method">{['Cash','Online'].map(m=><button type="button" className={sale.method===m?'chosen':''} key={m} onClick={()=>setSale({...sale,method:m})}>{t(m)}</button>)}</div><button className="primary sale-submit" disabled={busy||saving||!sale.method}>{saving?t("Saving…"):t("Record payment")} <Check size={15}/></button></form></section></div>
 <Analytics records={records}/>
 <section className="desk-tile recent-activity" aria-labelledby="recent-activity-heading">
 <header><h2 id="recent-activity-heading">{t("Recent activity")}</h2><button onClick={()=>go('activity')}>{t("All activity ↗")}</button></header>
 <div id="recent-activity-list">{events.slice(0,activityLimit).map(e=>{const record=records.find(x=>x.id===e.record_id);return <button className="recent-event" key={e.id} disabled={!record} onClick={()=>{if(record)open(record);}}><b>{record?.data.customerName||record?.data.name||t(e.event)}</b><span>{e.detail}</span><time>{new Date(e.at).toLocaleString(locale,{timeZone:'Asia/Ho_Chi_Minh'})}</time></button>})}</div>
 {!events.length&&<p className="muted">{t("No recorded activity yet.")}</p>}
 {events.length>3&&<footer className="activity-controls">{activityLimit<events.length&&<button aria-controls="recent-activity-list" aria-expanded={activityLimit>3} onClick={()=>setActivityLimit(n=>n+10)}>{t("See more")}</button>}{activityLimit>3&&<button aria-controls="recent-activity-list" aria-expanded={true} onClick={()=>setActivityLimit(3)}>{t("Collapse")}</button>}<small>{Math.min(activityLimit,events.length)} / {events.length}</small></footer>}
 </section>

 </div>
}
