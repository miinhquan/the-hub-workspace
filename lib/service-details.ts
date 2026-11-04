import type {RecordItem} from './domain';

// Names on a booking are plain text. Resolve legacy IDs only for older records;
// the removed catalogues are never required to create a new inquiry or booking.
export function serviceDetails(data:Record<string,any>,all:RecordItem[]){
 const tour=all.find(r=>r.kind==='tours'&&r.id===data.tourId);
 const operator=all.find(r=>r.kind==='operators'&&r.id===(data.selectedOperatorId||data.operatorId||tour?.data.operatorId));
 return {
  tourName:typeof data.tourName==='string'?data.tourName.trim():String(tour?.data.name||''),
  operatorName:typeof data.operatorName==='string'?data.operatorName.trim():String(operator?.data.name||''),
 };
}
