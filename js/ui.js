/* 画面切替・モーダル・ハンバーガーメニュー・フォルダー一覧 */
// ===== PAGE NAV =====
const PAGE_TITLES={home:'ホーム',cal:'📅 カレンダー',claude:'Claudeの進捗状況',todo:'TODOリスト＆メモ'};
function showPage(p){
  document.querySelectorAll('.page').forEach(el=>el.classList.remove('active'));
  document.querySelectorAll('.bnav-item').forEach(el=>el.classList.remove('active'));
  document.getElementById('page-'+p).classList.add('active');
  document.querySelector('.app').classList.toggle('cal-active',p==='cal');
  document.getElementById('topbarTitle').textContent=PAGE_TITLES[p];
  curPage=p;
  sessionStorage.setItem('p_page',p);
  // FAB: カレンダーページのみ表示
  document.getElementById('fabBtn').className=p==='cal'?'fab':'fab hidden';
  if(p==='home') renderHome();
  if(p==='cal'){renderCalHeader();renderCalGrid();}
  if(p==='claude'){renderCPList();renderTokens();}
  if(p==='todo'){renderTodoPage();renderTodoList();}
}

// ===== MODALS =====
function openModal(id){document.getElementById(id).classList.add('open')}
function closeModal(id){
  const el=document.getElementById(id),m=el.querySelector('.modal');
  if(m){m.style.transform='scale(.91) translateY(16px)';m.style.opacity='0';}
  el.style.opacity='0';
  setTimeout(()=>{el.classList.remove('open');if(m){m.style.transform='';m.style.opacity='';}el.style.opacity='';},220);
}
function ovClose(e,id){if(e.target===document.getElementById(id))closeModal(id)}

// ===== HAMBURGER =====
function openHMenu(){document.getElementById('hmenuOverlay').classList.add('open')}
function closeHMenu(){document.getElementById('hmenuOverlay').classList.remove('open')}

// ===== FOLDER =====
function openFolderModal(){
  let html='';
  Object.entries(FOLDERS).forEach(([k,f])=>{
    const cnt=S.events.filter(e=>e.folder===k).length;
    html+=`<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.1);cursor:pointer" onclick="showFolderDetail('${k}')">
      <div style="display:flex;align-items:center;gap:10px;font-size:14px;font-weight:600;color:var(--t1)"><div style="width:9px;height:9px;border-radius:50%;background:${f.color}"></div>${f.label}</div>
      <div style="font-size:12px;color:var(--t3)">${cnt}件 ›</div>
    </div>`;
  });
  document.getElementById('folderModalTitle').textContent='フォルダー';
  document.getElementById('folderModalBody').innerHTML=html;
  openModal('folderModal');
}
function showFolderDetail(key){
  const f=FOLDERS[key];
  const evs=expand(new Date(2020,0,1),new Date(2030,11,31)).filter(e=>e.folder===key).sort((a,b)=>pD(a.start)-pD(b.start));
  let html=`<button onclick="openFolderModal()" style="background:none;border:none;color:var(--c7);font-size:13px;cursor:pointer;font-family:var(--font);margin-bottom:12px;padding:0">‹ 戻る</button>`;
  html+=evs.length?evs.map(ev=>`<div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.1);cursor:pointer" onclick="closeModal('folderModal');showDetail(${esc(JSON.stringify(ev))})">
    <div style="width:8px;height:8px;border-radius:50%;background:${f.color};margin-top:4px;flex-shrink:0"></div>
    <div><div style="font-size:13px;font-weight:600;color:var(--t1)">${ev.title}</div><div style="font-size:11px;color:var(--t3);margin-top:2px">${fmtDT(pD(ev.start))}</div></div>
  </div>`).join(''):'<div class="empty">予定なし</div>';
  document.getElementById('folderModalTitle').textContent=f.label;
  document.getElementById('folderModalBody').innerHTML=html;
}
