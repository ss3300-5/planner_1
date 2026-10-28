/* 予定の作成・編集・削除・詳細表示 */
// ===== EVENT CRUD =====
function openAddEvent(date,hour){
  editId=null;
  document.getElementById('evModalTitle').textContent='予定を追加';
  document.getElementById('evTitle').value='';
  document.getElementById('evDesc').value='';
  document.getElementById('evRepeat').value='none';
  document.getElementById('evNotif').checked=true;
  document.getElementById('delEvRow').style.display='none';
  pickedFolder='';
  document.querySelectorAll('.fpill').forEach(p=>p.className='fpill');
  const base=date?new Date(date):new Date();
  if(hour!==undefined)base.setHours(hour,0,0,0);
  const end=new Date(base);end.setHours(end.getHours()+1);
  document.getElementById('evStart').value=localISO(base);
  document.getElementById('evEnd').value=localISO(end);
  openModal('addEventModal');
}
function editEvent(id){
  const ev=S.events.find(e=>e.id===id);if(!ev)return;
  editId=id;
  document.getElementById('evModalTitle').textContent='予定を編集';
  document.getElementById('evTitle').value=ev.title;
  document.getElementById('evDesc').value=ev.desc||'';
  document.getElementById('evStart').value=ev.start;
  document.getElementById('evEnd').value=ev.end;
  document.getElementById('evRepeat').value=ev.repeat||'none';
  document.getElementById('evNotif').checked=!!ev.notif;
  pickedFolder=ev.folder||'';
  document.querySelectorAll('.fpill').forEach(p=>{p.className='fpill';if(p.dataset.f===pickedFolder)p.classList.add('sel-'+pickedFolder);});
  document.getElementById('delEvRow').style.display='block';
  openModal('addEventModal');
}
function pickFolder(f,el){
  pickedFolder=pickedFolder===f?'':f;
  document.querySelectorAll('.fpill').forEach(p=>p.className='fpill');
  if(pickedFolder)el.classList.add('sel-'+f);
}
function saveEvent(){
  const title=document.getElementById('evTitle').value.trim();
  if(!title){alert('タイトルを入力してください');return;}
  const ev={id:editId||gid(),title,start:document.getElementById('evStart').value,end:document.getElementById('evEnd').value,desc:document.getElementById('evDesc').value,folder:pickedFolder,repeat:document.getElementById('evRepeat').value,notif:document.getElementById('evNotif').checked};
  if(editId){const i=S.events.findIndex(e=>e.id===editId);if(i>=0)S.events[i]=ev;}
  else S.events.push(ev);
  save();closeModal('addEventModal');
  if(curPage==='home')renderHome();
  if(curPage==='cal'){renderCalHeader();renderCalGrid();}
}
function askDel(){
  if(!editId)return;
  const ev=S.events.find(e=>e.id===editId);
  document.getElementById('delTitle').textContent=ev?`「${ev.title}」`:'';
  openModal('delModal');
}
function doDelete(){
  if(!editId)return;
  S.events=S.events.filter(e=>e.id!==editId);
  editId=null;save();closeModal('delModal');closeModal('addEventModal');
  if(curPage==='home')renderHome();
  if(curPage==='cal'){renderCalHeader();renderCalGrid();}
}
function openEditFromDetail(id){closeModal('detailModal');setTimeout(()=>editEvent(id),260);}

function showDetail(ev){
  const f=ev.folder&&FOLDERS[ev.folder]?FOLDERS[ev.folder]:null;
  const col=ev.folder&&f?f.color:'rgba(255,255,255,.4)';
  const rm={none:'なし',daily:'毎日',weekly:'毎週',yearly:'毎年'};
  const originId=ev._rep?ev.id.replace(/_r\d+$/,''):ev.id;
  let h=`<div class="det-hdr"><div class="det-dot" style="background:${col}"></div><div class="det-title">${ev.title}</div></div>`;
  if(ev._rep)h+=`<div class="rep-badge">🔁 繰り返し（編集・削除は全回に適用）</div>`;
  h+=`<div class="det-meta"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>${fmtD(pD(ev.start))}</div>`;
  h+=`<div class="det-meta"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>${fmtT(pD(ev.start))} – ${fmtT(pD(ev.end))}</div>`;
  if(f)h+=`<div class="det-meta"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>${f.label}</div>`;
  h+=`<div class="det-meta"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17,1 21,5 17,9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7,23 3,19 7,15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>繰り返し：${rm[ev.repeat]||'なし'}</div>`;
  h+=`<div class="det-meta"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>通知：${ev.notif?'あり':'なし'}</div>`;
  if(ev.desc)h+=`<div class="det-desc">${ev.desc}</div>`;
  h+=`<div class="btn-row"><button class="btn btn-ghost" onclick="closeModal('detailModal')">閉じる</button><button class="btn btn-prim" onclick="openEditFromDetail('${originId}')">編集</button></div>`;
  document.getElementById('detailBody').innerHTML=h;
  openModal('detailModal');
}
