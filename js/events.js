/* 予定の作成・編集・削除・詳細表示 */
// ===== EVENT CRUD =====
let editOcc=null;
const $e=id=>document.getElementById(id);
function openAddEvent(date,hour){
  editId=null;editOcc=null;
  $e('evModalTitle').textContent='予定を追加';
  $e('evTitle').value='';$e('evDesc').value='';$e('evRepeat').value='none';$e('evUntil').value='';
  $e('evRepeat').disabled=false;$e('evUntil').disabled=false;
  $e('evNotif').checked=true;$e('delEvRow').style.display='none';$e('scopeBox').style.display='none';
  pickedFolder='';document.querySelectorAll('.fpill').forEach(p=>p.className='fpill');
  const base=date?new Date(date):new Date();if(hour!==undefined)base.setHours(hour,0,0,0);
  const end=new Date(base);end.setHours(end.getHours()+1);
  $e('evStart').value=localISO(base);$e('evEnd').value=localISO(end);
  repChange();openModal('addEventModal');
}
function editEvent(id,occ){
  const ev=S.events.find(e=>e.id===id);if(!ev)return;
  editId=id;
  const st=occ?pD(occ):pD(ev.start),dur=pD(ev.end)-pD(ev.start);editOcc=dayStr(st);
  $e('evModalTitle').textContent='予定を編集';
  $e('evTitle').value=ev.title;$e('evDesc').value=ev.desc||'';
  $e('evStart').value=localISO(st);$e('evEnd').value=localISO(new Date(st.getTime()+dur));
  $e('evRepeat').value=ev.repeat||'none';$e('evUntil').value=ev.until||'';
  $e('evNotif').checked=!!ev.notif;
  pickedFolder=ev.folder||'';
  document.querySelectorAll('.fpill').forEach(p=>{p.className='fpill';if(p.dataset.f===pickedFolder)p.classList.add('sel-'+pickedFolder);});
  $e('delEvRow').style.display='block';
  $e('scopeBox').style.display=recurring(ev)?'block':'none';
  document.querySelector('input[name=evScope][value=one]').checked=true;
  $e('scFrom').value=editOcc;$e('scTo').value=ev.until||editOcc;
  scopeChange();openModal('addEventModal');
}
function pickFolder(f,el){
  pickedFolder=pickedFolder===f?'':f;
  document.querySelectorAll('.fpill').forEach(p=>p.className='fpill');
  if(pickedFolder)el.classList.add('sel-'+f);
}
function curScope(){const r=document.querySelector('input[name=evScope]:checked');return r?r.value:'all';}
function repChange(){$e('untilRow').style.display=$e('evRepeat').value!=='none'?'block':'none';}
function scopeChange(){
  const sc=curScope(),rec=$e('scopeBox').style.display!=='none';
  $e('scRange').style.display=rec&&sc==='range'?'grid':'none';
  const lock=rec&&sc!=='all';
  if(lock){const e=S.events.find(x=>x.id===editId);$e('evRepeat').value=e.repeat;$e('evUntil').value=e.until||'';}
  $e('evRepeat').disabled=lock;$e('evUntil').disabled=lock;
  repChange();
}
function refreshAfterEvent(){
  if(curPage==='home')renderHome();
  if(curPage==='cal'){renderCalHeader();renderCalGrid();}
}
function saveEvent(){
  const title=$e('evTitle').value.trim();
  if(!title){alert('タイトルを入力してください');return;}
  const start=$e('evStart').value,end=$e('evEnd').value;
  if(!start||!end||end<=start){alert('終了は開始より後にしてください');return;}
  const f={title,start,end,desc:$e('evDesc').value,folder:pickedFolder,notif:$e('evNotif').checked};
  const rep=$e('evRepeat').value,until=rep==='none'?'':$e('evUntil').value;
  if(until&&until<start.slice(0,10)){alert('繰り返しの終了日は開始日より後にしてください');return;}
  if(!editId)S.events.push({id:gid(),...f,repeat:rep,until});
  else{
    const e=S.events.find(x=>x.id===editId);
    if(recurring(e)){
      const sc=curScope();
      if(sc==='all'){
        const delta=Math.round((new Date(start.slice(0,10))-new Date(editOcc))/86400000);
        const bs=pD(e.start);bs.setDate(bs.getDate()+delta);const ns=pD(start);bs.setHours(ns.getHours(),ns.getMinutes(),0,0);
        applyScope(editId,'all',null,null,{...f,start:localISO(bs),end:localISO(new Date(bs.getTime()+(pD(end)-pD(start)))),repeat:rep,until});
      }else{
        const fr=sc==='one'?editOcc:$e('scFrom').value,to=sc==='one'?editOcc:$e('scTo').value;
        if(!fr||!to||fr>to){alert('期間の開始日と終了日を正しく入れてください');return;}
        applyScope(editId,sc,fr,to,f);
      }
    }else applyScope(editId,'all',null,null,{...f,repeat:rep,until});
  }
  save();closeModal('addEventModal');refreshAfterEvent();
}
function askDel(){
  if(!editId)return;
  const ev=S.events.find(e=>e.id===editId);
  $e('delTitle').textContent=ev?`「${ev.title}」`:'';
  $e('dScope').style.display=recurring(ev)?'block':'none';
  document.querySelector('input[name=delScope][value=one]').checked=true;
  $e('dFrom').value=editOcc||'';$e('dTo').value=(ev&&ev.until)||editOcc||'';
  delScopeChange();openModal('delModal');
}
function delScopeChange(){const r=document.querySelector('input[name=delScope]:checked');$e('dRange').style.display=r&&r.value==='range'?'grid':'none';}
function doDelete(){
  if(!editId)return;
  const e=S.events.find(x=>x.id===editId);
  if(recurring(e)){
    const r=document.querySelector('input[name=delScope]:checked'),sc=r?r.value:'all';
    const fr=sc==='one'?editOcc:$e('dFrom').value,to=sc==='one'?editOcc:$e('dTo').value;
    if(sc==='range'&&(!fr||!to||fr>to)){alert('期間の開始日と終了日を正しく入れてください');return;}
    applyScope(editId,sc,fr,to,null);
  }else applyScope(editId,'all',null,null,null);
  editId=null;save();closeModal('delModal');closeModal('addEventModal');refreshAfterEvent();
}
function openEditFromDetail(id,occ){closeModal('detailModal');setTimeout(()=>editEvent(id,occ),260);}

function showDetail(ev){
  const f=ev.folder&&FOLDERS[ev.folder]?FOLDERS[ev.folder]:null;
  const col=ev.folder&&f?f.color:'#8a98ad';
  const rm={none:'なし',daily:'毎日',weekly:'毎週',yearly:'毎年'};
  const originId=ev._rep?ev.id.replace(/_r\d+$/,''):ev.id;
  let h=`<div class="det-hdr"><div class="det-dot" style="background:${col}"></div><div class="det-title">${ev.title}</div></div>`;
  if(recurring(ev))h+=`<div class="rep-badge">🔁 繰り返し予定（変更・削除のとき範囲を選べます）</div>`;
  h+=`<div class="det-meta"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>${fmtD(pD(ev.start))}</div>`;
  h+=`<div class="det-meta"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>${fmtT(pD(ev.start))} – ${fmtT(pD(ev.end))}</div>`;
  if(f)h+=`<div class="det-meta"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>${f.label}</div>`;
  h+=`<div class="det-meta"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17,1 21,5 17,9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7,23 3,19 7,15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>繰り返し：${rm[ev.repeat]||'なし'}${ev.until?'（'+ev.until.replace(/-/g,'/')+'まで）':''}</div>`;
  h+=`<div class="det-meta"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>通知：${ev.notif?'あり':'なし'}</div>`;
  if(ev.desc)h+=`<div class="det-desc">${ev.desc}</div>`;
  h+=`<div class="btn-row"><button class="btn btn-ghost" onclick="closeModal('detailModal')">閉じる</button><button class="btn btn-prim" onclick="openEditFromDetail('${originId}','${ev.start}')">編集</button></div>`;
  document.getElementById('detailBody').innerHTML=h;
  openModal('detailModal');
}
