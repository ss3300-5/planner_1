/* 重なる予定の並べ方・繰り返し予定の範囲指定（この回だけ／期間／すべて）・TODOの期限（モバイル・PC共通）*/
const dayStr=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const recurring=e=>!!(e&&e.repeat&&e.repeat!=='none');
function stepDate(d,rep){const x=new Date(d);if(rep==='daily')x.setDate(x.getDate()+1);else if(rep==='weekly')x.setDate(x.getDate()+7);else if(rep==='yearly')x.setFullYear(x.getFullYear()+1);return x;}

/* 同じ時間帯の予定を横に並べる：items=[{s,e}] に _c(何列目) _n(列数) を付ける */
function layoutCols(items){
  const a=items.slice().sort((x,y)=>x.s-y.s||y.e-x.e);
  let cl=[],end=0;
  const flush=()=>{const cols=[];cl.forEach(it=>{let c=cols.findIndex(t=>t<=+it.s);if(c<0){c=cols.length;cols.push(0);}cols[c]=+it.e;it._c=c;});cl.forEach(it=>it._n=cols.length);cl=[];};
  for(const it of a){if(cl.length&&+it.s>=end){flush();end=0;}cl.push(it);end=Math.max(end,+it.e);}
  flush();return items;
}

/* 繰り返し予定の発生日時を並べる（終了日があればそこまで） */
function seriesOccurrences(e){
  const out=[],lim=e.until?new Date(e.until+'T23:59:59'):null;let cur=pD(e.start);
  for(let i=0;i<3000;i++){
    if(lim&&cur>lim)break;out.push(new Date(cur));
    if(!recurring(e))break;cur=stepDate(cur,e.repeat);
  }
  return out;
}
/* from〜to（YYYY-MM-DD）で「前・範囲内・後」に分ける */
function splitSeries(e,fromD,toD){
  const occ=seriesOccurrences(e),dur=pD(e.end)-pD(e.start);
  const B=occ.filter(d=>dayStr(d)<fromD),M=occ.filter(d=>dayStr(d)>=fromD&&dayStr(d)<=toD),A=occ.filter(d=>dayStr(d)>toD);
  let before=null,after=null;
  if(B.length){before={...e,until:dayStr(B[B.length-1])};if(B.length===1){before.repeat='none';before.until='';}}
  if(A.length){const s=A[0];after={...e,id:gid(),start:localISO(s),end:localISO(new Date(s.getTime()+dur))};if(A.length===1&&e.until){after.repeat='none';after.until='';}}
  return{before,M,after};
}
/* scope: 'one'=この回だけ / 'range'=from〜to / 'all'=すべて。ch=null なら削除 */
function applyScope(id,scope,from,to,ch){
  const i=S.events.findIndex(x=>x.id===id);if(i<0)return;const e=S.events[i];
  if(scope==='all'||!recurring(e)){if(ch)S.events[i]={...e,...ch};else S.events.splice(i,1);return;}
  const {before,M,after}=splitSeries(e,from,to),out=[];
  if(before)out.push(before);
  if(ch&&M.length){
    if(scope==='one')out.push({...e,...ch,id:gid(),repeat:'none',until:''});
    else{
      const t0=pD(ch.start),dn=pD(ch.end)-t0,st=new Date(M[0]);st.setHours(t0.getHours(),t0.getMinutes(),0,0);
      const many=M.length>1;
      out.push({...e,...ch,id:gid(),start:localISO(st),end:localISO(new Date(st.getTime()+dn)),repeat:many?e.repeat:'none',until:many?dayStr(M[M.length-1]):''});
    }
  }
  if(after)out.push(after);
  S.events.splice(i,1,...out);
}

/* TODOの期限 */
function dueInfo(t){
  if(!t.due)return{label:'期限なし',cls:'none'};
  const d=new Date(t.due+'T00:00:00'),lab=`${d.getMonth()+1}/${d.getDate()}`,td=dayStr(new Date());
  if(t.done)return{label:lab,cls:'done'};
  if(t.due<td)return{label:lab+' 期限切れ',cls:'over'};
  if(t.due===td)return{label:'きょうまで',cls:'today'};
  return{label:lab+'まで',cls:''};
}
const dueKey=t=>t.due||'9999';
const sortTodos=l=>l.slice().sort((a,b)=>(+!!a.done)-(+!!b.done)||(dueKey(a)<dueKey(b)?-1:dueKey(a)>dueKey(b)?1:0));
const dueTodayTodos=()=>{const td=dayStr(new Date());return S.todos.filter(t=>!t.done&&t.due&&t.due<=td);};
