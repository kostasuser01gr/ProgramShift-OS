// Official code mapping must be verified by managers against their current CODED sheet.
export const CODE_TO_SHIFT = Object.freeze({
  '422':'04:00-12:00','201':'05:00-13:00','202':'06:00-14:00','203':'07:00-15:00',
  '403':'07:30-15:30','301':'08:00-16:00','206':'09:00-17:00','208':'10:00-18:00',
  '209':'10:30-18:30','210':'11:00-19:00','211':'12:00-20:00','404':'12:30-20:30',
  '212':'13:00-21:00','405':'13:30-21:30','213':'14:00-22:00','406':'14:30-22:30',
  '214':'15:00-23:00','402':'15:30-23:30','215':'16:00-00:00','333':'17:00-01:00',
  '218':'18:00-02:00','216':'22:00-06:00','217':'23:00-07:00',
  '243':'07:00-13:40','232':'08:00-14:40','233':'09:00-15:40','234':'10:00-16:40',
  '235':'11:00-17:40','236':'12:00-18:40','237':'13:00-19:40','238':'14:00-20:40',
  '239':'15:00-21:40','240':'16:00-22:40','241':'16:30-23:10','242':'17:00-23:40',
  'R':'ΡΕΠΟ', 'L':'ΑΔΕΙΑ', 'S':'ΑΝΑΡΡΩΤΙΚΗ'
});
export const SHIFT_CODES = Object.keys(CODE_TO_SHIFT);
export function shiftInterval(code, day) {
  const hours = CODE_TO_SHIFT[code];
  if (!hours || !hours.includes('-')) return null;
  const [start, end] = hours.split('-');
  const minutes = v => { const [h, m] = v.split(':').map(Number); return h * 60 + m; };
  const begin = Date.parse(day + 'T00:00:00Z') + minutes(start)*60000;
  let finish = Date.parse(day + 'T00:00:00Z') + minutes(end)*60000;
  if (finish <= begin) finish += 86400000;
  return {begin, finish};
}
export function reviewWarnings(shifts, employees) {
  const grouped = new Map();
  for(const shift of shifts) {
    if (!shift.employeeKey) continue;
    const events = grouped.get(shift.employeeKey) || [];
    events.push(shift); grouped.set(shift.employeeKey, events);
  }
  const warnings=[];
  for(const [key, events] of grouped){
    events.sort((a,b)=>a.date.localeCompare(b.date));
    const person=employees.find(p=>p.key===key)?.name || key;
    let prior=null;
    for(const event of events){
      if (event.code && !CODE_TO_SHIFT[event.code]) warnings.push({employeeKey:key,employee:person,date:event.date,type:'unknown',message:'Μη αναγνωρισμένος κωδικός'});
      const span=shiftInterval(event.code,event.date);
      if(span && prior) {
        const hours=(span.begin-prior.finish)/3600000;
        if(hours < 11) warnings.push({employeeKey:key,employee:person,date:event.date,type:'rest11',message:`Ανάπαυση ${hours.toFixed(1)} ωρών (<11)`});
      }
      if(span) prior=span;
    }
  }
  return warnings;
}
