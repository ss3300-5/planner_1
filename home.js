/* ホーム／カレンダー上部ボックスの描画・ボックス詳細・通知一覧 */
// ===== HOME =====
function renderHome(){
  const n=new Date();
  const from=new Date(n);from.setDate(from.getDate()-1);
  const to=new Date(n);to.setDate(to.getDate()+30);
  const evs=expand(from,to).sort((a,b)=>pD(a.start)-pD(b.start));
  let curr=null,nxt=null;
  for(const e of evs){const s=pD(e.start),en=pD(e.end);if(s<=n&&en>=n){curr=e;break;}}
  for(const e of evs){if(pD(e.start)>n){nxt=e;break;}}
  window._curr=curr;window._nxt=nxt;

  function evHTML(ev){
    if(!ev)return'<div class="sec-empty">予定なし</div>';
    const f=ev.folder&&FOLDERS[ev.folder]?FOLDERS[ev.folder]:null;
    return`<div class="ev-item"><div class="ev-dot" style="background:${f?f.color:'rgba(255,255,255,.4)'}"></div><div class="ev-info"><div class="ev-title">${ev.title}</div><div class="ev-time">${fmtT(pD(ev.start))} – ${fmtT(pD(ev.end))}</div>${f?`<div class="ev-folder">${f.label}</div>`:''}</div></div>`;
  }
  document.getElementById('home-now-body').innerHTML=evHTML(curr);
  document.getElementById('home-next-body').innerHTML=evHTML(nxt);

  // TODO mini
  const active=S.todos.filter(t=>!t.done).slice(0,3);
  let thtml=active.length?active.map(t=>`<div class="todo-mini-row"><div class="todo-mini-chk${t.done?' done':''}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20,6 9,17 4,12"/></svg></div><div class="todo-mini-txt">${t.text}</div></div>`).join(''):'<div class="sec-empty">タスクなし</div>';
  const rem=S.todos.filter(t=>!t.done).length;
  if(rem>3)thtml+=`<div style="font-size:10px;color:var(--t3);margin-top:4px">他 ${rem-3} 件</div>`;
  document.getElementById('home-todo-body').innerHTML=thtml;

  // Claude mini
  let chtml=S.cps.length?S.cps.slice(0,2).map(p=>`<div class="cp-mini-row"><div class="cp-mini-name">${p.name}</div><div class="cp-mini-track"><div class="cp-mini-fill" style="width:${p.pct}%"></div></div><div class="cp-mini-pct">${p.pct}%</div></div>`).join(''):'<div class="sec-empty">進捗なし</div>';
  document.getElementById('home-claude-body').innerHTML=chtml;
}
function openCurrDetail(){if(window._curr)showDetail(window._curr);}
function openNextDetail(){if(window._nxt)showDetail(window._nxt);}

// ===== HOME BIG BOXES =====
function renderHomeBig(){
  const n=new Date(),f=new Date(n);f.setHours(0,0,0,0);const t=new Date(n);t.setHours(23,59,59,999);
  const evs=expand(f,t).filter(e=>sameDay(pD(e.start),n)).sort((a,b)=>pD(a.start)-pD(b.start));
  window._today=evs;
  const li=e=>`<div class="ev-item"><div class="ev-dot" style="background:${e.folder&&FOLDERS[e.folder]?FOLDERS[e.folder].color:'#fff'}"></div><div class="ev-info"><div class="ev-title">${e.title}</div><div class="ev-time">${fmtT(pD(e.start))} – ${fmtT(pD(e.end))}</div></div></div>`;
  document.getElementById('big-today').innerHTML=evs.slice(0,2).map(li).join('')||'<div class="sec-empty">予定なし</div>';
  document.getElementById('big-claude').innerHTML=S.cps.slice(0,2).map(p=>`<div class="cp-mini-row"><div class="cp-mini-name">${p.name}</div><div class="cp-mini-track"><div class="cp-mini-fill" style="width:${p.pct}%"></div></div><div class="cp-mini-pct">${p.pct}%</div></div>`).join('')||'<div class="sec-empty">進捗なし</div>';
  document.getElementById('big-todo').innerHTML=S.todos.filter(x=>!x.done).slice(0,3).map(x=>`<div class="todo-mini-row"><div class="todo-mini-chk"></div><div class="todo-mini-txt">${x.text}</div></div>`).join('')||'<div class="sec-empty">タスクなし</div>';
}
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
const _rh=renderHome;renderHome=function(){_rh();renderHomeBig();};
const _rc=renderCalGrid;renderCalGrid=function(){_rc();renderHome();};
