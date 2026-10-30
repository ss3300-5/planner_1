/* PC版UI（ダッシュボード）。データ層は storage.js / core.js を共有する */
const $=id=>document.getElementById(id);
const PCOL={important:'#e5384f',star:'#f59e0b',work:'#0077b6',personal:'#7b5ea7',health:'#1fa855'};
const TITLES={dash:'ダッシュボード',cal:'カレンダー',todo:'TODO ＆ メモ',claude:'Claudeの進捗状況'};
const REP={none:'なし',daily:'毎日',weekly:'毎週',yearly:'毎年'};
let page='dash',calMode='week',folderFilter='',EV={};
const colOf=e=>PCOL[e.folder]||'#8a98ad';
const wk=d=>{const s=new Date(d);s.setDate(d.getDate()-d.getDay());s.setHours(0,0,0,0);return s;};
const reg=e=>{const k=e.id+'|'+e.start;EV[k]=e;return k;};
function range(f,t){return expand(f,t).filter(e=>!folderFilter||e.folder===folderFilter).sort((a,b)=>pD(a.start)-pD(b.start));}
function dayEvs(d){const f=new Date(d);f.setHours(0,0,0,0);const t=new Date(d);t.setHours(23,59,59,999);return range(f,t).filter(e=>sameDay(pD(e.start),d));}

/* モーダル（account.js からも使う） */
function openModal(id){$(id).classList.add('open');}
function closeModal(id){$(id).classList.remove('open');}
function ovClose(e,id){if(e.target===$(id))closeModal(id);}
function dlg(title,html){$('dlgTitle').textContent=title;$('dlgBody').innerHTML=html;openModal('dlg');}

/* 画面切替 */
function showPage(p){
  if(p)page=p;curPage=page;
  document.querySelectorAll('.page').forEach(el=>el.classList.toggle('on',el.id==='p-'+page));
  document.querySelectorAll('.nav a[data-p]').forEach(a=>a.classList.toggle('on',a.dataset.p===page));
  $('title').textContent=TITLES[page];
  $('tabs').innerHTML=page==='cal'?[['week','週'],['month','月']].map(([a,b])=>`<button class="${calMode===a?'on':''}" onclick="setMode('${a}')">${b}</button>`).join(''):'';
  renderSide();
  ({dash:renderDash,cal:renderCal,todo:renderTodo,claude:renderClaude})[page]();
}
function setMode(m){calMode=m;showPage('cal');}
function setFolder(k){folderFilter=k;showPage();}
function renderSide(){
  const open=S.todos.filter(t=>!t.done).length,today=dayEvs(new Date()).length;
  $('bTodo').textContent=open;$('bTodo').style.display=open?'':'none';
  $('bCal').textContent=today;$('bCal').style.display=today?'':'none';
  $('folders').innerHTML=`<a class="${folderFilter?'':'on'}" onclick="setFolder('')">すべて</a>`+Object.entries(FOLDERS).map(([k,f])=>`<a class="${folderFilter===k?'on':''}" onclick="setFolder('${k}')"><i style="background:${PCOL[k]}"></i>${f.label}<em>${S.events.filter(e=>e.folder===k).length}</em></a>`).join('');
}

/* ダッシュボード */
function nowNext(){
  const n=new Date(),f=new Date(n);f.setDate(f.getDate()-1);const t=new Date(n);t.setDate(t.getDate()+30);
  const l=range(f,t);let cur=null,nx=null;
  for(const e of l){if(pD(e.start)<=n&&pD(e.end)>=n){cur=e;break;}}
  for(const e of l){if(pD(e.start)>n){nx=e;break;}}
  return[cur,nx];
}
const evRow=e=>`<div class="row" onclick="evDetail('${reg(e)}')"><i style="background:${colOf(e)}"></i><div><b>${esc(e.title)}</b><small>${fmtT(pD(e.start))} – ${fmtT(pD(e.end))}${e.folder?' ・'+FOLDERS[e.folder].label:''}</small></div></div>`;
const todoRow=t=>`<div class="row todo"><span class="chk ${t.done?'on':''}" onclick="togTodo('${t.id}')"></span><div class="${t.done?'done':''}"><b>${esc(t.text)}</b></div><button class="x" onclick="delTodo('${t.id}')">×</button></div>`;
const cpRows=edit=>S.cps.map(p=>`<div class="cp"><div class="cp-t"><b>${esc(p.name)}</b><span>${p.pct}%</span>${edit?`<button class="x" onclick="cpDel('${p.id}')">×</button>`:''}</div><div class="bar"><u style="width:${p.pct}%"></u></div>${p.note?`<small class="mute">${esc(p.note)}</small>`:''}</div>`).join('')||'<p class="mute">進捗はありません</p>';
function renderDash(){
  const [cur,nx]=nowNext();
  const big=(cls,label,e)=>`<div class="card ${cls}" ${e?`onclick="evDetail('${reg(e)}')"`:''}><span class="lbl">${label}</span>${e?`<h3>${esc(e.title)}</h3><p>${fmtD(pD(e.start))} ${fmtT(pD(e.start))} – ${fmtT(pD(e.end))}</p>`:'<h3 class="mute">予定なし</h3>'}</div>`;
  const open=S.todos.filter(t=>!t.done),avg=S.cps.length?Math.round(S.cps.reduce((a,p)=>a+p.pct,0)/S.cps.length):0;
  $('p-dash').innerHTML=`<div class="grid4">${big('hero','今の予定',cur)}${big('','次の予定',nx)}
    <div class="card" onclick="showPage('todo')"><span class="lbl">TODO</span><h3>${open.length}<small> 件 未完了</small></h3><p>${esc(open[0]?open[0].text:'タスクなし')}</p></div>
    <div class="card" onclick="showPage('claude')"><span class="lbl">Claude</span><h3>${avg}<small> % 平均進捗</small></h3><div class="bar"><u style="width:${avg}%"></u></div></div></div>
    <div class="grid2">
    <div class="card"><div class="ch"><b>今日の予定</b><a onclick="showPage('cal')">カレンダーへ</a></div>${dayEvs(new Date()).map(evRow).join('')||'<p class="mute">予定はありません</p>'}</div>
    <div class="card"><div class="ch"><b>TODO</b><a onclick="showPage('todo')">すべて見る</a></div>${open.slice(0,6).map(todoRow).join('')||'<p class="mute">タスクなし</p>'}</div>
    <div class="card"><div class="ch"><b>Claudeの進捗状況</b><a onclick="showPage('claude')">詳細</a></div>${cpRows(false)}</div>
    <div class="card"><div class="ch"><b>メモ</b><a onclick="showPage('todo')">編集</a></div><p class="memo">${esc(S.memo||'')}</p></div></div>`;
}

/* カレンダー */
function calNav(n){if(calMode==='week')viewDate.setDate(viewDate.getDate()+7*n);else{viewDate.setDate(1);viewDate.setMonth(viewDate.getMonth()+n);}renderCal();}
function renderCal(){
  $('p-cal').innerHTML=`<div class="card"><div class="ch cal-h"><div><button class="btn btn-ghost sm" onclick="calNav(-1)">‹</button><button class="btn btn-ghost sm" onclick="viewDate=new Date();renderCal()">今日</button><button class="btn btn-ghost sm" onclick="calNav(1)">›</button></div><b>${viewDate.getFullYear()}年${viewDate.getMonth()+1}月</b></div>${calMode==='week'?weekHTML():monthHTML()}</div>`;
  const s=$('wkScroll');if(s)s.scrollTop=7*48;
}
function weekHTML(){
  const ws=wk(viewDate),we=new Date(ws);we.setDate(we.getDate()+7);const l=range(ws,we),today=new Date(),H=48;
  let h='<div class="wk-h"><span></span>';
  for(let i=0;i<7;i++){const d=new Date(ws);d.setDate(ws.getDate()+i);h+=`<div class="${sameDay(d,today)?'today':''}"><small>${DJ[i]}</small><b>${d.getDate()}</b></div>`;}
  h+='</div><div class="wk-s" id="wkScroll"><div class="wk-g"><div class="wk-t">'+[...Array(25)].map((_,i)=>`<span style="top:${i*H}px">${i}:00</span>`).join('')+'</div>';
  for(let i=0;i<7;i++){
    const d=new Date(ws);d.setDate(ws.getDate()+i);
    h+=`<div class="wk-c" style="height:${24*H}px">`+[...Array(24)].map((_,x)=>`<div class="hr" style="height:${H}px" onclick="evDlg(new Date(${d.getTime()}),${x})"></div>`).join('');
    l.filter(e=>sameDay(pD(e.start),d)).forEach(e=>{const s=pD(e.start),en=pD(e.end);h+=`<div class="wk-e" style="top:${Math.round((s.getHours()*60+s.getMinutes())/60*H)}px;height:${Math.round(Math.max((en-s)/3600000,.4)*H-2)}px;--c:${colOf(e)}" onclick="evDetail('${reg(e)}')"><b>${esc(e.title)}</b><small>${fmtT(s)}</small></div>`;});
    if(sameDay(d,today))h+=`<div class="nowl" style="top:${Math.round((today.getHours()*60+today.getMinutes())/60*H)}px"></div>`;
    h+='</div>';
  }
  return h+'</div></div>';
}
function monthHTML(){
  const y=viewDate.getFullYear(),m=viewDate.getMonth(),f=new Date(y,m,1),s=new Date(f);s.setDate(1-f.getDay());
  const e=new Date(s);e.setDate(e.getDate()+42);const l=range(s,e),today=new Date();
  let h='<div class="mo">'+DJ.map(d=>`<div class="dw">${d}</div>`).join('');
  for(let i=0;i<42;i++){
    const d=new Date(s);d.setDate(s.getDate()+i);const ev=l.filter(x=>sameDay(pD(x.start),d));
    h+=`<div class="md ${d.getMonth()!==m?'out':''} ${sameDay(d,today)?'today':''}" onclick="evDlg(new Date(${d.getTime()}),9)"><b>${d.getDate()}</b>${ev.slice(0,3).map(x=>`<div class="chip" style="--c:${colOf(x)}" onclick="event.stopPropagation();evDetail('${reg(x)}')">${fmtT(pD(x.start))} ${esc(x.title)}</div>`).join('')}${ev.length>3?`<small class="mute">+${ev.length-3}</small>`:''}</div>`;
  }
  return h+'</div>';
}

/* 予定の作成・詳細・削除 */
function evDlg(d,h){
  const s=new Date(d||new Date());
  if(h!==undefined)s.setHours(h,0,0,0);else if(!d){s.setMinutes(0,0,0);s.setHours(s.getHours()+1);}
  const e=new Date(s);e.setHours(e.getHours()+1);
  dlg('予定を作成',`<div class="fg"><label>タイトル</label><input class="finput" id="fTitle"></div>
  <div class="two"><div class="fg"><label>開始</label><input class="finput" id="fStart" type="datetime-local" value="${localISO(s)}"></div><div class="fg"><label>終了</label><input class="finput" id="fEnd" type="datetime-local" value="${localISO(e)}"></div></div>
  <div class="two"><div class="fg"><label>フォルダー</label><select class="finput" id="fFolder"><option value="">なし</option>${Object.entries(FOLDERS).map(([k,f])=>`<option value="${k}">${f.label}</option>`).join('')}</select></div>
  <div class="fg"><label>繰り返し</label><select class="finput" id="fRep">${Object.entries(REP).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></div></div>
  <div class="fg"><label>説明</label><textarea class="finput" id="fDesc" rows="2"></textarea></div>
  <label class="chkrow"><input type="checkbox" id="fNotif" checked> 通知する</label>
  <div class="btn-row"><button class="btn btn-ghost" onclick="closeModal('dlg')">キャンセル</button><button class="btn btn-prim" onclick="saveEv()">保存</button></div>`);
  $('fTitle').focus();
}
function saveEv(){
  const title=$('fTitle').value.trim();if(!title){$('fTitle').focus();return;}
  S.events.push({id:gid(),title,start:$('fStart').value,end:$('fEnd').value,folder:$('fFolder').value,repeat:$('fRep').value,notif:$('fNotif').checked,desc:$('fDesc').value});
  save();closeModal('dlg');showPage();
}
function evDetail(k){
  const e=EV[k];if(!e)return;const oid=e.id.replace(/_r\d+$/,'');
  dlg(e.title,`<div class="det"><p>日時：${fmtD(pD(e.start))} ${fmtT(pD(e.start))} – ${fmtT(pD(e.end))}</p><p>フォルダー：${e.folder?FOLDERS[e.folder].label:'なし'}</p><p>繰り返し：${REP[e.repeat]||'なし'}</p><p>通知：${e.notif?'あり':'なし'}</p>${e.desc?`<p>${esc(e.desc)}</p>`:''}</div>
  <div class="btn-row"><button class="btn btn-ghost" onclick="closeModal('dlg')">閉じる</button><button class="btn btn-del" onclick="delEv('${oid}')">削除</button></div>`);
}
function delEv(id){
  if(!confirm('この予定を削除しますか？（繰り返し予定は全回が対象です）'))return;
  S.events=S.events.filter(x=>x.id!==id);save();closeModal('dlg');showPage();
}

/* TODO・メモ */
function renderTodo(){$('todoList').innerHTML=S.todos.map(todoRow).join('')||'<p class="mute">TODOはありません</p>';if(document.activeElement!==$('memoText'))$('memoText').value=S.memo||'';}
function addTodo(){const v=$('todoInput').value.trim();if(!v)return;S.todos.push({id:gid(),text:v,note:'',done:false});$('todoInput').value='';save();showPage();}
function togTodo(id){const t=S.todos.find(x=>x.id===id);if(t){t.done=!t.done;save();showPage();}}
function delTodo(id){S.todos=S.todos.filter(x=>x.id!==id);save();showPage();}
function saveMemo(b){S.memo=$('memoText').value;save();b.textContent='保存しました';setTimeout(()=>b.textContent='保存',1200);}

/* Claude進捗 */
function renderClaude(){
  const t=S.tokens||(S.tokens={used:0,max:500000,apiUsed:0,apiMax:1000}),pc=(a,b)=>Math.min(100,Math.round(a/(b||1)*100));
  $('p-claude').innerHTML=`<div class="grid2 g2"><div class="card"><div class="ch"><b>進捗</b><a onclick="cpDlg()">＋ 追加</a></div>${cpRows(true)}</div>
  <div class="col"><div class="card" onclick="tokEdit()"><span class="lbl">トークン使用状況</span><h3>${t.used.toLocaleString()}<small> / ${t.max.toLocaleString()}</small></h3><div class="bar"><u style="width:${pc(t.used,t.max)}%"></u></div></div>
  <div class="card" onclick="tokEdit()"><span class="lbl">API使用量</span><h3>${t.apiUsed.toLocaleString()}<small> / ${t.apiMax.toLocaleString()}</small></h3><div class="bar"><u style="width:${pc(t.apiUsed,t.apiMax)}%"></u></div></div></div></div>`;
}
function tokEdit(){const t=S.tokens,g=(m,v)=>{const r=prompt(m,v);return r===null?v:(parseInt(r)||0);};t.used=g('トークン使用数',t.used);t.max=g('トークン上限',t.max);t.apiUsed=g('APIリクエスト数',t.apiUsed);t.apiMax=g('APIリクエスト上限',t.apiMax);save();renderClaude();}
function cpDlg(){dlg('プロジェクトを追加',`<div class="fg"><label>プロジェクト名</label><input class="finput" id="cName"></div><div class="fg"><label>進捗 <span id="cPl">0</span>%</label><input type="range" id="cPct" min="0" max="100" value="0" style="width:100%" oninput="$('cPl').textContent=this.value"></div><div class="fg"><label>メモ</label><input class="finput" id="cNote"></div><div class="btn-row"><button class="btn btn-ghost" onclick="closeModal('dlg')">キャンセル</button><button class="btn btn-prim" onclick="cpSave()">保存</button></div>`);}
function cpSave(){const n=$('cName').value.trim();if(!n)return;S.cps.push({id:gid(),name:n,pct:+$('cPct').value,note:$('cNote').value.trim()});save();closeModal('dlg');showPage();}
function cpDel(id){S.cps=S.cps.filter(p=>p.id!==id);save();showPage();}

/* 新規作成メニュー・起動 */
function toggleNew(e){e.stopPropagation();$('newMenu').classList.toggle('open');}
function newItem(k){
  $('newMenu').classList.remove('open');
  if(k==='ev')evDlg();else{showPage('todo');$(k==='todo'?'todoInput':'memoText').focus();}
}
document.addEventListener('click',()=>$('newMenu').classList.remove('open'));
$('todoInput').addEventListener('keydown',e=>{if(e.key==='Enter')addTodo();});
$('memoText').value=S.memo||'';
showPage('dash');
Store.start();
setInterval(()=>{if(page==='dash')renderDash();},60000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&Store.user)Store.sync();});
