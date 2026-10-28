/* カレンダー（日／週／月の連続スクロール） */
// ===== CALENDAR =====
function switchCalView(v){
  calView=v;sessionStorage.setItem('p_calview',v);if(v==='year')window._yrCenter=null;
  ['day','week','year'].forEach(x=>document.getElementById('vt-'+x).classList.toggle('active',x===v));
  renderCalHeader();renderCalGrid();
}
function saveVD(){sessionStorage.setItem('p_date',viewDate.toISOString())}
function navPrev(){
  if(calView==='day')viewDate.setDate(viewDate.getDate()-1);
  else if(calView==='week')viewDate.setDate(viewDate.getDate()-7);
  else{viewDate.setDate(1);viewDate.setMonth(viewDate.getMonth()-1);window._yrCenter=new Date(viewDate);}
  saveVD();renderCalHeader();renderCalGrid();
}
function navNext(){
  if(calView==='day')viewDate.setDate(viewDate.getDate()+1);
  else if(calView==='week')viewDate.setDate(viewDate.getDate()+7);
  else{viewDate.setDate(1);viewDate.setMonth(viewDate.getMonth()+1);window._yrCenter=new Date(viewDate);}
  saveVD();renderCalHeader();renderCalGrid();
}
function goToday(){viewDate=new Date();saveVD();renderCalHeader();renderCalGrid();}

function renderCalHeader(){
  const today=new Date();
  // month button
  if(calView==='day') document.getElementById('calMonthBtn').textContent=`${viewDate.getMonth()+1}月`;
  else if(calView==='week'){const ws=wkStart(viewDate);document.getElementById('calMonthBtn').textContent=`${ws.getMonth()+1}月`;}
  else document.getElementById('calMonthBtn').textContent=`${viewDate.getFullYear()}年`;
  // week days row
  const row=document.getElementById('weekDaysRow');
  if(calView==='year'){row.innerHTML='';return;}
  const ws=calView==='day'?new Date(viewDate):wkStart(viewDate);
  let html='';
  for(let i=0;i<7;i++){
    const d=new Date(ws);d.setDate(ws.getDate()+i);
    const isT=sameDay(d,today);
    const from2=new Date(d);from2.setHours(0,0,0,0);
    const to2=new Date(d);to2.setHours(23,59,59,999);
    const hasEv=calView==='week'&&expand(from2,to2).some(e=>sameDay(pD(e.start),d));
    const isSel=calView==='day'&&sameDay(d,viewDate);
    html+=`<div class="wd-cell" onclick="clickDay(${d.getFullYear()},${d.getMonth()},${d.getDate()})">
      <div class="wd-name">${DJ[d.getDay()]}</div>
      <div class="wd-num${isT?' today':''}" style="${isSel&&!isT?'background:rgba(255,255,255,.2)':''}">${d.getDate()}</div>
      ${hasEv?'<div class="wd-dot"></div>':''}
    </div>`;
  }
  row.innerHTML=html;
}

function clickDay(yr,m,d){
  viewDate=new Date(yr,m,d);saveVD();
  if(calView!=='day'){calView='day';sessionStorage.setItem('p_calview','day');['day','week','year'].forEach(x=>document.getElementById('vt-'+x).classList.toggle('active',x==='day'));}
  renderCalHeader();renderCalGrid();
}

function renderCalGrid(){
  const tg=document.getElementById('timeGrid');
  const wg=document.getElementById('weekGridWrap');
  const yb=document.getElementById('yearBody');
  const cs=document.getElementById('calScroll');
  tg.style.display='none';wg.style.display='none';yb.style.display='none';
  if(calView==='day'){tg.style.display='block';renderDay();cs.style.background='var(--cal-bg)';}
  else if(calView==='week'){wg.style.display='flex';renderWeek();cs.style.background='var(--cal-bg)';}
  else{yb.style.display='block';renderYear();cs.style.background='var(--bg)';}
}

function wkStart(d){const s=new Date(d);s.setDate(d.getDate()-d.getDay());s.setHours(0,0,0,0);return s;}

function renderDay(){
  const tgt=new Date(viewDate);
  const from=new Date(tgt);from.setHours(0,0,0,0);
  const to=new Date(tgt);to.setHours(23,59,59,999);
  const evs=expand(from,to).filter(e=>sameDay(pD(e.start),tgt));
  const grid=document.getElementById('timeGrid');
  grid.innerHTML='';
  for(let h=0;h<24;h++){
    const row=document.createElement('div');row.className='time-row';row.style.height=HOUR_H+'px';
    row.innerHTML=`<div class="tl-col"><span class="tl-text">${h}:00</span></div><div class="tc-line" id="tcl-${h}"></div>`;
    grid.appendChild(row);
    if(h<23)document.getElementById('tcl-'+h).ondblclick=()=>openAddEvent(tgt,h);
  }
  const endRow=document.createElement('div');endRow.className='time-row';endRow.style.height='0';endRow.innerHTML='<div class="tl-col"><span class="tl-text">24:00</span></div><div class="tc-line"></div>';grid.appendChild(endRow);
  for(const e of evs){
    const s=pD(e.start),en=pD(e.end);
    const top=(s.getHours()*60+s.getMinutes())/60*HOUR_H;
    const ht=Math.max((en-s)/3600000,.25)*HOUR_H-2;
    const fcls=e.folder&&FOLDERS[e.folder]?FOLDERS[e.folder].fcls:'fc-none';
    const el=document.createElement('div');el.className=`ev-block ${fcls}`;
    el.style.cssText=`position:absolute;top:${top}px;height:${ht}px;left:56px;right:4px;`;
    el.innerHTML=`<div class="evb-title">${e.title}</div>${ht>28?`<div class="evb-time">${fmtT(s)} – ${fmtT(en)}</div>`:''}`;
    el.onclick=()=>showDetail(e);grid.appendChild(el);
  }
  // now line
  document.querySelectorAll('.now-line').forEach(el=>el.remove());
  const n=new Date();
  if(sameDay(tgt,n)){
    const top=(n.getHours()*60+n.getMinutes())/60*HOUR_H;
    const nl=document.createElement('div');nl.className='now-line';nl.style.top=top+'px';
    nl.innerHTML='<div class="now-dot"></div><div class="now-bar"></div>';
    grid.appendChild(nl);
  }
  setTimeout(()=>{const n2=new Date();const sc=sameDay(tgt,n2)?Math.max(0,(n2.getHours()-1)*HOUR_H):8*HOUR_H;document.getElementById('calScroll').scrollTop=sc;},60);
}

function renderWeek(){
  const today=new Date(),ws=wkStart(viewDate);
  const wrap=document.getElementById('weekGridWrap');wrap.innerHTML='';
  wrap.style.cssText='display:flex;position:relative;';
  // times col
  const tc=document.createElement('div');tc.className='wg-times-col';
  for(let h=0;h<24;h++){const r=document.createElement('div');r.className='wg-time-row';r.style.height=HOUR_H+'px';r.innerHTML=`<span>${h}:00</span>`;tc.appendChild(r);}
  const er=document.createElement('div');er.className='wg-time-row';er.style.height='0';er.innerHTML='<span>24:00</span>';tc.appendChild(er);
  wrap.appendChild(tc);
  // days
  const dc=document.createElement('div');dc.style.cssText='flex:1;display:flex;position:relative;';
  const we=new Date(ws);we.setDate(we.getDate()+6);we.setHours(23,59,59,999);
  const evs=expand(ws,we);
  for(let i=0;i<7;i++){
    const d=new Date(ws);d.setDate(ws.getDate()+i);
    const col=document.createElement('div');col.className='wg-day-col';
    for(let h=0;h<24;h++){const ln=document.createElement('div');ln.className='wg-hour-line';ln.style.height=HOUR_H+'px';ln.ondblclick=()=>openAddEvent(d,h);col.appendChild(ln);}
    evs.filter(e=>sameDay(pD(e.start),d)).forEach(e=>{
      const s=pD(e.start),en=pD(e.end);
      const top=(s.getHours()*60+s.getMinutes())/60*HOUR_H;
      const ht=Math.max((en-s)/3600000,.25)*HOUR_H-2;
      const fcls=e.folder&&FOLDERS[e.folder]?FOLDERS[e.folder].fcls:'fc-none';
      const ev=document.createElement('div');ev.className=`ev-block ${fcls}`;
      ev.style.cssText=`top:${top}px;height:${ht}px;left:1px;right:1px;`;
      ev.textContent=e.title;ev.onclick=()=>showDetail(e);col.appendChild(ev);
    });
    dc.appendChild(col);
  }
  // now
  const n=new Date(),di=Math.floor((n-ws)/86400000);
  if(di>=0&&di<7){
    const top=(n.getHours()*60+n.getMinutes())/60*HOUR_H;
    const nw=document.createElement('div');nw.className='week-now';
    const cw=100/7;nw.style.cssText=`top:${top}px;left:${di*cw}%;width:${cw}%;position:absolute;`;
    nw.innerHTML='<div class="week-now-dot"></div><div class="week-now-bar"></div>';dc.appendChild(nw);
  }
  wrap.appendChild(dc);
  setTimeout(()=>{document.getElementById('calScroll').scrollTop=Math.max(0,(new Date().getHours()-1)*HOUR_H);},60);
}

function renderYear(){
  const yr=viewDate.getFullYear(),today=new Date();
  const from=new Date(yr,0,1),to=new Date(yr,11,31);
  const evs=expand(from,to);let html='';
  for(let m=0;m<12;m++){
    const first=new Date(yr,m,1),sdow=first.getDay(),dim=new Date(yr,m+1,0).getDate();
    html+=`<div class="yr-month"><div class="yr-mname">${DM[m]}</div><div class="yr-dow-row">${DJ.map(d=>`<span>${d}</span>`).join('')}</div><div class="yr-grid">`;
    for(let x=0;x<sdow;x++)html+='<div class="yr-cell"></div>';
    for(let d=1;d<=dim;d++){
      const dt=new Date(yr,m,d),isT=sameDay(dt,today),hasEv=evs.some(e=>sameDay(pD(e.start),dt));
      html+=`<div class="yr-cell${isT?' today':hasEv?' has-ev':''}" onclick="clickDay(${yr},${m},${d})">${d}${hasEv&&!isT?'<div class="yr-dot"></div>':''}</div>`;
    }
    html+='</div></div>';
  }
  document.getElementById('yearBody').innerHTML=html;
}

// ===== 月表示（連続スクロール・年をまたぐ） =====
function renderYear(){
  const today=new Date(),c=window._yrCenter||today;
  const base=new Date(c.getFullYear(),c.getMonth(),1);
  const from=new Date(base.getFullYear(),base.getMonth()-24,1),to=new Date(base.getFullYear(),base.getMonth()+36,0);
  const keys=new Set(expand(from,to).map(e=>pD(e.start).toDateString()));
  let html=`<div class="yr-dow-row yr-sticky">${DJ.map(d=>`<span>${d}</span>`).join('')}</div>`;
  for(let i=-24;i<36;i++){
    const f=new Date(base.getFullYear(),base.getMonth()+i,1),y=f.getFullYear(),m=f.getMonth(),dim=new Date(y,m+1,0).getDate();
    html+=`<div class="yr-month"><div class="yr-mname">${y}年${DM[m]}</div><div class="yr-grid">`;
    for(let x=0;x<f.getDay();x++)html+='<div class="yr-cell"></div>';
    for(let d=1;d<=dim;d++){
      const dt=new Date(y,m,d),isT=sameDay(dt,today),has=keys.has(dt.toDateString());
      const foc=window._yrCenter?sameDay(dt,c):isT;
      html+=`<div class="yr-cell${isT?' today':has?' has-ev':''}" ${foc?'id="yrFocus"':''} onclick="clickDay(${y},${m},${d})">${d}${has&&!isT?'<div class="yr-dot"></div>':''}</div>`;
    }
    html+='</div></div>';
  }
  document.getElementById('yearBody').innerHTML=html;
  setTimeout(()=>{const t=document.getElementById('yrFocus'),s=document.getElementById('calScroll');if(!t)return;const a=t.getBoundingClientRect(),b=s.getBoundingClientRect();s.scrollTop+=a.top-b.top-(b.height-a.height)/2;},60);
}
