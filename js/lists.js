/* TODO・メモ・Claude進捗・トークン／API使用量 */
// ===== TODO =====
function renderTodoPage(){
  const n=new Date();
  const from=new Date(n);from.setDate(from.getDate()-1);
  const to=new Date(n);to.setDate(to.getDate()+30);
  const evs=expand(from,to).sort((a,b)=>pD(a.start)-pD(b.start));
  let curr=null,nxt=null;
  for(const e of evs){const s=pD(e.start),en=pD(e.end);if(s<=n&&en>=n){curr=e;break;}}
  for(const e of evs){if(pD(e.start)>n){nxt=e;break;}}
  window._curr=curr;window._nxt=nxt;
  function evMini(ev){
    if(!ev)return'<div class="sec-empty">予定なし</div>';
    const f=ev.folder&&FOLDERS[ev.folder]?FOLDERS[ev.folder]:null;
    return`<div class="ev-title" style="font-size:12px;color:var(--t1)">${ev.title}</div><div class="ev-time" style="font-size:10px;color:var(--t3);font-family:var(--mono);margin-top:2px">${fmtT(pD(ev.start))} – ${fmtT(pD(ev.end))}</div>`;
  }
  document.getElementById('todo-now-body').innerHTML=evMini(curr);
  document.getElementById('todo-next-body').innerHTML=evMini(nxt);
}
function renderTodoList(){
  const el=document.getElementById('todoList');
  if(!S.todos.length){el.innerHTML='<div class="empty">TODOはありません</div>';return;}
  el.innerHTML=S.todos.map(t=>`<div class="todo-item">
    <div class="todo-chk${t.done?' chk':''}" onclick="toggleTodo('${t.id}')">${t.done?`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20,6 9,17 4,12"/></svg>`:''}</div>
    <div class="todo-tw"><div class="todo-txt${t.done?' done':''}">${t.text}</div>${t.note?`<div class="todo-note">${t.note}</div>`:''}</div>
    <button class="todo-del-btn" onclick="deleteTodo('${t.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
  </div>`).join('');
  // claude pageのTODOも更新
  const cl=document.getElementById('claude-todo-body');
  if(cl){
    const active=S.todos.filter(t=>!t.done).slice(0,3);
    cl.innerHTML=active.length?active.map(t=>`<div class="todo-mini-row"><div class="todo-mini-chk"></div><div class="todo-mini-txt">${t.text}</div></div>`).join(''):'<div class="sec-empty">タスクなし</div>';
  }
}
function addTodo(){
  const txt=document.getElementById('todoInput').value.trim();if(!txt)return;
  S.todos.push({id:gid(),text:txt,note:'',done:false});
  document.getElementById('todoInput').value='';
  save();renderTodoList();
}
function toggleTodo(id){const t=S.todos.find(t=>t.id===id);if(t){t.done=!t.done;save();renderTodoList();}}
function deleteTodo(id){S.todos=S.todos.filter(t=>t.id!==id);save();renderTodoList();}

// ===== MEMO =====
function saveMemo(e){S.memo=document.getElementById('memoText').value;save();const btn=e.target;btn.textContent='✓ 保存済み';setTimeout(()=>btn.textContent='保存',1500);}

// ===== CLAUDE PROGRESS =====
function renderCPList(){
  const el=document.getElementById('claude-cp-list');
  if(!S.cps.length){el.innerHTML='<div class="empty" style="margin-bottom:8px">プロジェクトなし</div>';return;}
  el.innerHTML=S.cps.map(p=>`<div class="cp-item">
    <div class="cp-top"><div class="cp-name">${p.name}</div><div class="cp-pct-lbl">${p.pct}%</div></div>
    <div class="cp-track"><div class="cp-fill" style="width:${p.pct}%"></div></div>
    ${p.note?`<div class="cp-note">${p.note}</div>`:''}
    <div class="cp-btns"><button class="cp-btn cp-edit" onclick="openEditCP('${p.id}')">編集</button><button class="cp-btn cp-del" onclick="deleteCP('${p.id}')">削除</button></div>
  </div>`).join('');
}
function saveCP(){
  const name=document.getElementById('cpName').value.trim();if(!name){alert('名前を入力してください');return;}
  const pct=Math.max(0,Math.min(100,parseInt(document.getElementById('cpPct').value)||0));
  const note=document.getElementById('cpNote').value.trim();
  if(editCPId){const p=S.cps.find(p=>p.id===editCPId);if(p){p.name=name;p.pct=pct;p.note=note;}editCPId=null;}
  else S.cps.push({id:gid(),name,pct,note});
  document.getElementById('cpName').value='';document.getElementById('cpPct').value=0;document.getElementById('cpPctLbl').textContent='0';document.getElementById('cpNote').value='';
  document.getElementById('cpModalTitle').textContent='プロジェクトを追加';
  save();closeModal('cpAddModal');renderCPList();if(curPage==='home')renderHome();
}
function openEditCP(id){
  const p=S.cps.find(p=>p.id===id);if(!p)return;
  editCPId=id;
  document.getElementById('cpModalTitle').textContent='プロジェクトを編集';
  document.getElementById('cpName').value=p.name;
  document.getElementById('cpPct').value=p.pct;
  document.getElementById('cpPctLbl').textContent=p.pct;
  document.getElementById('cpNote').value=p.note||'';
  openModal('cpAddModal');
}
function deleteCP(id){S.cps=S.cps.filter(p=>p.id!==id);save();renderCPList();if(curPage==='home')renderHome();}

// ===== TOKENS =====
function renderTokens(){
  const t=S.tokens;
  document.getElementById('token-val').textContent=t.used?t.used.toLocaleString():'—';
  document.getElementById('api-val').textContent=t.apiUsed?t.apiUsed.toLocaleString():'—';
  document.getElementById('token-bar').style.width=t.max?Math.min(100,t.used/t.max*100)+'%':'0%';
  document.getElementById('api-bar').style.width=t.apiMax?Math.min(100,t.apiUsed/t.apiMax*100)+'%':'0%';
  // tap to edit
  document.querySelectorAll('.token-card').forEach(c=>c.onclick=()=>{
    document.getElementById('tokenInput').value=t.used||'';
    document.getElementById('apiInput').value=t.apiUsed||'';
    document.getElementById('tokenMax').value=t.max||'';
    document.getElementById('apiMax').value=t.apiMax||'';
    openModal('tokenModal');
  });
}
function saveToken(){
  S.tokens.used=parseInt(document.getElementById('tokenInput').value)||0;
  S.tokens.apiUsed=parseInt(document.getElementById('apiInput').value)||0;
  S.tokens.max=parseInt(document.getElementById('tokenMax').value)||500000;
  S.tokens.apiMax=parseInt(document.getElementById('apiMax').value)||1000;
  save();closeModal('tokenModal');renderTokens();
}
