export const kinds=['customers','inquiries','bookings','requests','operators','tours','payments','expenses','documents','imports','transactions','settings','notifications'] as const;
export type Kind=typeof kinds[number];
export type RecordItem={id:string;kind:Kind;data:Record<string,any>;status:string;version:number;createdAt:string;updatedAt:string;lastActivity:string;archivedAt:string|null;previousStatus:string|null};
export const inquiryStatuses=['New','Quoted','Following Up','Waiting Customer','Waiting Operator','Ready to Book','Lost','Cancelled'];
export function isStale(r:RecordItem,all:RecordItem[],now=Date.now()){
 return r.kind==='inquiries'&&!r.archivedAt&&!['Converted','Archived','Lost','Cancelled','Waiting Operator','Booking Requested','Booked','Completed'].includes(r.status)&&Date.parse(r.lastActivity)<=now-48*3600000&&!all.some(b=>b.kind==='bookings'&&b.data.inquiryId===r.id)&&!all.some(b=>b.kind==='requests'&&b.data.inquiryId===r.id&&['Pending','Booked'].includes(b.status));
}
export function paymentSummary(booking:RecordItem,all:RecordItem[]){const paid=all.filter(r=>r.kind==='payments'&&r.data.bookingId===booking.id).reduce((s,r)=>s+(r.data.type==='Refund'?-1:1)*Number(r.data.amount||0),0);const total=Number(booking.data.sellingPrice||0);return {paid,balance:Math.max(0,total-paid),status:paid<=0?'Unpaid':paid>=total?'Fully Paid':'Partially Paid'};}
export function safeUrl(value:string){try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}}
export function csvCell(v:unknown){const s=String(v??'');return '"'+(/^[=+@\-\t\r]/.test(s)?"'":'')+s.replaceAll('"','""')+'"';}
