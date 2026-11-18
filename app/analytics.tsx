'use client';
import {useLocale} from './locale';
import {useState} from 'react';
import {chartSeries,hanoiDate} from '@/lib/finance';
import type {RecordItem} from '@/lib/domain';

export default function Analytics({records}:{records:RecordItem[]}){
 const {t,locale}=useLocale();
 const [range,setRange]=useState('1d');
 const [currency,setCurrency]=useState('VND');
 const bins=chartSeries(records,range,currency);
 const max=Math.max(1,...bins.map(bin=>Math.abs(bin.value)));
 const total=bins.reduce((sum,bin)=>sum+bin.value,0);
 const monthly=range==='1m';
 const label=(at:number)=>new Date(at).toLocaleString(locale,{
  timeZone:'Asia/Ho_Chi_Minh',
  ...(range==='1w'||monthly?{day:'2-digit',month:'short'}:{hour:'2-digit',minute:'2-digit'})
 });
 const period=monthly?new Date(hanoiDate()+'T12:00:00+07:00').toLocaleString(locale,{
  timeZone:'Asia/Ho_Chi_Minh',month:'long',year:'numeric'
 }):t({'1h':'1 hour','1d':'1 day','1w':'1 week'}[range]||range);
 return <section className="desk-tile analytics">
  <header><h2>{t('Sales analytics')}</h2><select aria-label={t('Analytics currency')} value={currency} onChange={e=>setCurrency(e.target.value)}><option>VND</option><option>USD</option></select></header>
  <div className="chart-controls">
   <div>{[['1h','1 hour'],['1d','1 day'],['1w','1 week'],['1m','This month']].map(([key,name])=><button key={key} className={range===key?'chosen':''} aria-pressed={range===key} onClick={()=>setRange(key)}>{t(name)}</button>)}</div>
   <strong>{total.toLocaleString(locale,{maximumFractionDigits:currency==='VND'?0:2})} <small>{currency}</small></strong>
  </div>
  {monthly&&<p className="analytics-period">{period} · {t('Hanoi time')}</p>}
  <div className="bars" role="img" aria-label={t('Net receipts ')+total+' '+currency+t(' over ')+period}>
   {bins.map((bin,index)=><div key={bin.at} className="bar-slot">
    <div className={bin.value<0?'bar negative':'bar'} style={{height:Math.max(2,Math.abs(bin.value)/max*125)}} title={label(bin.at)+' · '+bin.value.toLocaleString(locale)+' '+currency}><span>{bin.value!==0?bin.value:''}</span></div>
    <small>{bins.length<=7||index%Math.ceil(bins.length/6)===0?label(bin.at):''}</small>
   </div>)}
  </div>
  <footer>{t('Actual recorded payments only. Not profit. No operator costs or POS imports.')}</footer>
 </section>;
}
