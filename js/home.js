/* ホーム画面（今の予定・つぎ・きょうの予定・TODO・Claude）とボックス詳細・通知一覧 */
const KN=['〇','一','二','三','四','五','六','七','八','九'];
const kan=n=>n<10?KN[n]:(n<20?'十':KN[Math.floor(n/10)]+'十')+(n%10?KN[n%10]:'');
const $h=id=>document.getElementById(id);

/* 進捗の輪（先端に琥珀色の印） */
function ringSVG(pct){
  const C=389.6,a=pct/100*2*Math.PI,x=(75+62*Math.sin(a)).toFixed(1),y=(75-62*Math.cos(a)).toFixed(1);
  return `<svg viewBox="0 0 150 150"><circle cx="75" cy="75" r="62" fill="none" stroke="#caf0f8" stroke-width="12"/><circle cx="75" cy="75" r="62" fill="none" stroke="#0077b6" stroke-width="12" stroke-linecap="round" stroke-dasharray="${(C*pct/100).toFixed(1)} ${C}" transform="rotate(-90 75 75)"/>${pct>0?`<circle cx="${x}" cy="${y}" r="6" fill="#ffb703"/>`:''}</svg>`;
}
function renderClaudeHero(){
  const n=S.cps.length,avg=n?Math.round(S.cps.reduce((a,p)=>a+p.pct,0)/n):0;
  $h('clTitle').innerHTML=n?`${n}つの作業が<br>進んでいます`:'進行中の作業は<br>ありません';
  $h('clBig').innerHTML=ringSVG(avg)+`<div>${avg}<small>%</small></div>`;
}
const _rcl=renderCPList;renderCPList=function(){_rcl();renderClaudeHero();};

function renderHome(){
  const n=new Date(),f=new Date(n);f.setDate(f.getDate()-1);const t=new Date(n);t.setDate(t.getDate()+30);
  const evs=expand(f,t).sort((a,b)=>pD(a.start)-pD(b.start));
  let cur=null,nx=null;
  for(const e of evs){if(pD(e.start)<=n&&pD(e.end)>=n){cur=e;break;}}
  for(const e of evs){if(pD(e.start)>n){nx=e;break;}}
  window._curr=cur;window._nxt=nx;
  const dv=`<p class="date"><span>${kan(n.getMonth()+1)}月${kan(n.getDate())}日</span><span>${DJ[n.getDay()]}曜日</span></p>`;
  if(cur){
    const s=pD(cur.start),e=pD(cur.end),pc=Math.min(100,Math.max(0,(n-s)/(e-s)*100)),left=Math.max(0,Math.round((e-n)/60000));
    $h('homeHero').innerHTML=dv+`<p class="tag">いま</p><h2>${esc(cur.title)}</h2><p class="tm">${fmtT(s)} – ${fmtT(e)}<span>あと${left}分</span></p><div class="track"><b style="width:${pc}%"></b></div>`;
  }else $h('homeHero').innerHTML=dv+'<p class="tag">いま</p><h2>いまの予定は<br>ありません</h2>';
  $h('homeNext').innerHTML=nx?`<small>つぎ</small><span class="t">${sameDay(pD(nx.start),n)?'':pD(nx.start).getMonth()+1+'/'+pD(nx.start).getDate()+' '}${fmtT(pD(nx.start))}</span><b>${esc(nx.title)}</b>`:'<small>つぎ</small><b>予定はありません</b>';

  const d0=new Date(n);d0.setHours(0,0,0,0);const d1=new Date(n);d1.setHours(23,59,59,999);
  const day=expand(d0,d1).filter(e=>sameDay(pD(e.start),n)).sort((a,b)=>pD(a.start)-pD(b.start));
  window._today=day;
  $h('big-today').innerHTML=day.slice(0,5).map(e=>{const s=pD(e.start),en=pD(e.end),c=e.folder&&FOLDERS[e.folder]?FOLDERS[e.folder].color:'';
    return `<li class="${en<n?'done':(s<=n&&en>=n?'now':'')}" ${c?`style="--c:${c}"`:''}><time>${s.getHours()}:${pad(s.getMinutes())}</time><span>${esc(e.title)}</span></li>`;}).join('')||'<li><span class="sec-empty">きょうの予定はありません</span></li>';
  const todos=[...S.todos.filter(x=>!x.done),...S.todos.filter(x=>x.done)].slice(0,4);
  $h('big-todo').innerHTML=todos.map(x=>`<li class="${x.done?'done':''}"><i class="cb${x.done?' on':''}">${x.done?'<svg class="i"><use href="#ck"/></svg>':''}</i><span>${esc(x.text)}</span></li>`).join('')||'<li><span class="sec-empty">タスクなし</span></li>';
  const cn=S.cps.length,avg=cn?Math.round(S.cps.reduce((a,p)=>a+p.pct,0)/cn):0;
  $h('big-claude').innerHTML=cn?`<div class="rgw"><span class="rg">${ringSVG(avg)}</span><span class="pct">${avg}<small>%</small></span></div><p>${S.cps.slice(0,2).map(p=>esc(p.name)+' '+p.pct+'%').join('<br>')}</p>`:'<p>進捗はまだありません</p>';
}
function openCurrDetail(){if(window._curr)showDetail(window._curr);}
function openNextDetail(){if(window._nxt)showDetail(window._nxt);}

function openBoxDetail(k){
  let h='',title='';
  if(k==='today'){
    title='今日の予定';
    h=(window._today||[]).map((e,i)=>`<div class="ev-item" style="cursor:pointer" onclick="closeModal('folderModal');showDetail(window._today[${i}])"><div class="ev-dot" style="background:${e.folder&&FOLDERS[e.folder]?FOLDERS[e.folder].color:'#fff'}"></div><div class="ev-info"><div class="ev-title">${e.title}</div><div class="ev-time">${fmtT(pD(e.start))} – ${fmtT(pD(e.end))}</div></div></div>`).join('')||'<div class="empty">予定はありません</div>';
  }else if(k==='todo'){
    title='TODOリスト';
    h=S.todos.map(t=>`<div class="todo-item"><div class="todo-chk${t.done?' chk':''}" onclick="toggleTodo('${t.id}');renderHome();openBoxDetail('todo')">${t.done?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20,6 9,17 4,12"/></svg>':''}</div><div class="todo-tw"><div class="todo-txt${t.done?' done':''}">${t.text}</div></div></div>`).join('')||'<div class="empty">TODOはありません</div>';
    h+='<div class="btn-row"><button class="btn btn-prim" onclick="closeModal(\'folderModal\');showPage(\'todo\')">TODO＆メモを開く</button></div>';
  }else{
    title='Claudeの進捗状況';
    h=S.cps.map(p=>`<div class="cp-item"><div class="cp-top"><div class="cp-name">${p.name}</div><div class="cp-pct-lbl">${p.pct}%</div></div><div class="cp-track"><div class="cp-fill" style="width:${p.pct}%"></div></div>${p.note?`<div class="cp-note">${p.note}</div>`:''}</div>`).join('')||'<div class="empty">進捗なし</div>';
    h+='<div class="btn-row"><button class="btn btn-prim" onclick="closeModal(\'folderModal\');showPage(\'claude\')">進捗を編集</button></div>';
  }
  document.getElementById('folderModalTitle').textContent=title;
  document.getElementById('folderModalBody').innerHTML=h;
  openModal('folderModal');
}
function openNotifModal(){
  const n=new Date(),to=new Date(n);to.setDate(to.getDate()+7);
  const evs=expand(n,to).filter(e=>e.notif).sort((a,b)=>pD(a.start)-pD(b.start));
  window._nl=evs;
  document.getElementById('folderModalTitle').textContent='通知';
  document.getElementById('folderModalBody').innerHTML=evs.map((e,i)=>`<div class="ev-item" style="cursor:pointer" onclick="closeModal('folderModal');showDetail(window._nl[${i}])"><div class="ev-dot" style="background:#90e0ef"></div><div class="ev-info"><div class="ev-title">${e.title}</div><div class="ev-time">${fmtDT(pD(e.start))}</div></div></div>`).join('')||'<div class="empty">7日以内に通知する予定はありません</div>';
  openModal('folderModal');
}
