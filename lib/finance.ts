import type {RecordItem} from './domain';
export const hanoiDate=(at=new Date())=>at.toLocaleDateString('en-CA',{timeZone:'Asia/Ho_Chi_Minh'});
export const isOperatingExpense=(r:RecordItem)=>r.kind==='expenses'&&!['Operator cost','Operator payment','Agent cost'].includes(r.data.category);
export function expenseGate(all:RecordItem[],month:string){
 const expenses=all.filter(r=>isOperatingExpense(r)&&String(r.data.date||'').startsWith(month));
 const missing:string[]=[];for(const category of ['Electricity','Water'])if(!expenses.some(r=>r.data.category===category&&Number.isFinite(Number(r.data.amount))&&Number(r.data.amount)>=0))missing.push(category);
 const reviewed=all.filter(r=>r.kind==='settings').map(r=>r.data.reviewedMonths?.[month]||'').sort().pop()||'';
 if(!reviewed||expenses.some(r=>r.updatedAt>reviewed))missing.push('Submit monthly expense review');
 return {ready:missing.length===0,missing};
}
export function monthlyLedger(all:RecordItem[],month:string,currency:string){return all.filter(r=>['payments','transactions'].includes(r.kind)||isOperatingExpense(r)).filter(r=>String(r.data.date||'').startsWith(month)&&r.data.currency===currency);}
export function chartSeries(all:RecordItem[],range:string,currency:string,now=Date.now()){
 const n=range==='1h'?12:range==='1d'?24:7,step=range==='1h'?300000:range==='1d'?3600000:86400000;
 const end=Math.floor(now/step)*step+step,start=end-n*step;
 const bins=Array.from({length:n},(_,i)=>({at:start+i*step,value:0,count:0}));
 for(const r of all){if(!['payments','transactions'].includes(r.kind)||r.data.currency!==currency)continue;const t=Date.parse(r.createdAt),i=Math.floor((t-start)/step);if(i>=0&&i<n){bins[i].value+=(r.data.type==='Refund'?-1:1)*Number(r.data.amount||0);bins[i].count++;}}
 return bins;
}
