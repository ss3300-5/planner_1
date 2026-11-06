/* PC版UI（ダッシュボード）。データ層は storage.js / core.js / series.js を共有する */
const $=id=>document.getElementById(id);
const PCOL={important:'#e5384f',star:'#f59e0b',work:'#0077b6',personal:'#7b5ea7',health:'#1fa855'};
const TITLES={dash:'ダッシュボード',cal:'カレンダー',todo:'TODO ＆ メモ',claude:'Claudeの進捗状況'};
const REP={none:'なし',daily:'毎日',weekly:'毎週',yearly:'毎年'};
let page='dash',calMode='week',folderFilter='',EV={};
const colOf=e=>PCOL[e.folder]||'#8a98ad';
const wk=d=>{const s=new Date(d);s.setDate(d.getDate()-d.getDay());s.setHours(0,0,0,0);return s;};
const reg=e=>{const k=e.id+'|'+e.start;EV[k]=e;return k;};
const KN=['〇','一','二','三','四','五','六','七','八','九'];
const kan=n=>n<10?KN[n]:(n<20?'十':KN[Math.floor(n/10)]+'十')+(n%10?KN[n%10]:'');
function range(f,t){return expand(f,t).filter(e=>!folderFilter||e.folder===folderFilter).sort((a,b)=>pD(a.start)-pD(b.start));}
function dayEvs(d){const f=new Date(d);f.setHours(0,0,0,0);const t=new Date(d);t.setHours(23,59,59,999);return range(f,t).filter(e=>sameDay(pD(e.start),d));}

/* モーダル（account.js からも使う） */
function openModal(id){$(id).classList.add('open');}
function closeModal(id){$(id).classList.remove('open');}
function ovClose(e,id){if(e.target===$(id))closeModal(id);}
function dlg(title,html){$('dlgTitle').textContent=title;$('dlgBody').innerHTML=html;openModal('dlg');}

/* 進捗の輪（先端に琥珀色の印） */
function ringSVG(pct,txt){
  const C=389.6,a=pct/100*2*Math.PI,x=(75+62*Math.sin(a)).toFixed(1),y=(75-62*Math.cos(a)).toFixed(1);
  return `<svg viewBox="0 0 150 150"><circle cx="75" cy="75" r="62" fill="none" stroke="#caf0f8" stroke-width="12"/><circle cx="75" cy="75" r="62" fill="none" stroke="#0077b6" stroke-width="12" stroke-linecap="round" stroke-dasharray="${(C*pct/100).toFixed(1)} ${C}" transform="rotate(-90 75 75)"/>${pct>0?`<circle cx="${x}" cy="${y}" r="6" fill="#ffb703"/>`:''}${txt?`<text x="75" y="88" text-anchor="middle" font-family="Cormorant Garamond,serif" font-style="italic" font-weight="700" font-size="40" fill="#03045e">${pct}%</text>`:''}</svg>`;
}
const avgPct=()=>S.cps.length?Math.round(S.cps.reduce((a,p)=>a+p.pct,0)/S.cps.length):0;

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
  $('folders').innerHTML=`<li><a class="${folderFilter?'':'on'}" onclick="setFolder('')">すべて</a></li>`+Object.entries(FOLDERS).map(([k,f])=>`<li><a class="${folderFilter===k?'on':''}" onclick="setFolder('${k}')"><span class="d" style="--c:${PCOL[k]}"></span>${f.label}<em>${S.events.filter(e=>e.folder===k).length}</em></a></li>`).join('');
}
function updateDateBar(){const n=new Date();$('dateBar').textContent=`${n.getFullYear()}年${n.getMonth()+1}/${n.getDate()} ${n.getHours()}:${pad(n.getMinutes())}`;}

/* ダッシュボード */
function nowNext(){
  const n=new Date(),f=new Date(n);f.setDate(f.getDate()-1);const t=new Date(n);t.setDate(t.getDate()+30);
  const l=range(f,t);let cur=null,nx=null;
  for(const e of l){if(pD(e.start)<=n&&pD(e.end)>=n){cur=e;break;}}
  for(const e of l){if(pD(e.start)>n){nx=e;break;}}
  return[cur,nx];
}
const todoLi=(t,del)=>{const d=dueInfo(t);return `<li class="${t.done?'done':''}"><i class="cb${t.done?' on':''}" onclick="togTodo('${t.id}')">${t.done?'<svg class="i"><use href="#ck"/></svg>':''}</i><span>${esc(t.text)}</span>${(t.due||del)?`<label class="due ${d.cls}">${d.label}<input type="date" value="${t.due||''}" onchange="setDue('${t.id}',this.value)"></label>`:''}${del?`<button class="x" onclick="delTodo('${t.id}')">×</button>`:''}</li>`;};
const cpRows=edit=>S.cps.map(p=>`<div class="pj"><div><b>${esc(p.name)}</b><span class="n">${p.pct}%</span>${edit?`<button class="x" onclick="cpDel('${p.id}')">×</button>`:''}</div><div class="bar"><i style="width:${p.pct}%"></i></div>${p.note?`<small>${esc(p.note)}</small>`:''}</div>`).join('')||'<p class="mute">進捗はありません</p>';
function usageHTML(){const t=S.tokens||(S.tokens={used:0,max:500000,apiUsed:0,apiMax:1000});return `<div class="use"><p>トークン使用状況<span><b>${t.used.toLocaleString()}</b> / ${t.max.toLocaleString()}</span></p><p>API使用量<span><b>${t.apiUsed.toLocaleString()}</b> / ${t.apiMax.toLocaleString()}</span></p></div>`;}

/* 今週（7:00〜20:00。高さは画面に合わせて伸縮、重なる予定は横に並ぶ） */
function dashWeek(){
  const ws=wk(new Date()),we=new Date(ws);we.setDate(we.getDate()+7);const l=range(ws,we),today=new Date(),TOT=13*60;
  let head='<div class="wkh"><span></span>',cols='';
  for(let i=0;i<7;i++){
    const d=new Date(ws);d.setDate(ws.getDate()+i);
    head+=`<div class="${sameDay(d,today)?'t':''}"><small>${DJ[i]}</small><b>${d.getDate()}</b></div>`;
    const its=l.filter(e=>sameDay(pD(e.start),d)).map(e=>{const s=pD(e.start),en=pD(e.end);return{ev:e,s,e:en,a:Math.max(0,(s.getHours()-7)*60+s.getMinutes()),b:Math.min(TOT,(en.getHours()-7)*60+en.getMinutes()+(sameDay(en,d)?0:1440))};}).filter(x=>x.b>0&&x.a<TOT);
    layoutCols(its);
    cols+=`<div class="c" onclick="wkClick(event,${d.getTime()})">`+its.map(it=>{const e=it.ev,du=it.b-it.a;return `<div class="e" style="--c:${colOf(e)};top:${(it.a/TOT*100).toFixed(3)}%;height:calc(${(du/TOT*100).toFixed(3)}% - 2px);left:calc(${it._c} * 100% / ${it._n} + 3px);width:calc(100% / ${it._n} - 6px);right:auto" onclick="event.stopPropagation();evDetail('${reg(e)}')">${esc(e.title)}${du>=60&&it._n===1?`<small>${fmtT(it.s)} – ${fmtT(it.e)}</small>`:''}</div>`;}).join('');
    if(sameDay(d,today)){const m=(today.getHours()-7)*60+today.getMinutes();if(m>=0&&m<=TOT)cols+=`<div class="nowl" style="top:${(m/TOT*100).toFixed(3)}%"></div>`;}
    cols+='</div>';
  }
  const hours='<div class="h">'+[...Array(13)].map((_,i)=>`<b style="top:${(i/13*100).toFixed(3)}%">${7+i}:00</b>`).join('')+'</div>';
  return head+'</div><div class="wkb">'+hours+cols+'</div>';
}
function wkClick(ev,ts){const r=ev.currentTarget.getBoundingClientRect(),h=7+Math.floor((ev.clientY-r.top)/r.height*13);evDlg(new Date(ts),Math.min(19,Math.max(7,h)));}

function renderDash(){
  const n=new Date(),[cur,nx]=nowNext(),day=dayEvs(n),dues=dueTodayTodos(),open=S.todos.filter(t=>!t.done);
  const dv=`<p class="date"><span>${kan(n.getMonth()+1)}月${kan(n.getDate())}日</span><span>${DJ[n.getDay()]}曜日</span></p>`;
  let hero='<p class="tag">いま</p><h2>いまの予定は<br>ありません</h2>';
  if(cur){const s=pD(cur.start),e=pD(cur.end),pc=Math.min(100,Math.max(0,(n-s)/(e-s)*100)),left=Math.max(0,Math.round((e-n)/60000));
    hero=`<p class="tag">いま</p><h2 style="font-size:${cur.title.length>10?26:36}px">${esc(cur.title)}</h2><p class="tm">${fmtT(s)} – ${fmtT(e)}<span>あと${left}分</span></p><div class="track"><b style="width:${pc}%"></b></div>`;}
  const next=nx?`<small>つぎ</small><span class="t">${sameDay(pD(nx.start),n)?'':(pD(nx.start).getMonth()+1)+'/'+pD(nx.start).getDate()+' '}${fmtT(pD(nx.start))}</span><b>${esc(nx.title)}</b>`:'<small>つぎ</small><b>予定はありません</b>';
  const rows=[...day.map(e=>{const s=pD(e.start),en=pD(e.end);return `<li class="${en<n?'done':(s<=n&&en>=n?'now':'')}" style="--c:${colOf(e)}" onclick="evDetail('${reg(e)}')"><time>${s.getHours()}:${pad(s.getMinutes())}</time><span>${esc(e.title)}</span></li>`;}),
    ...dues.map(t=>`<li class="tdue"><time>期限</time><span>${esc(t.text)}</span></li>`)];
  const more=rows.length-4;
  const wsd=wk(n),wed=new Date(wsd);wed.setDate(wed.getDate()+6);
  $('p-dash').innerHTML=`<div class="grid"><div class="L"><div class="top">
    <section class="hero"><div class="bg"></div><div class="in" ${cur?`onclick="evDetail('${reg(cur)}')"`:''}>${hero}</div>${dv}<div class="next" ${nx?`onclick="evDetail('${reg(nx)}')"`:''}>${next}</div></section>
    <section class="pn a today"><h3>きょうの予定<span>${n.getMonth()+1}/${n.getDate()}</span></h3><ol class="rail">${rows.slice(0,4).join('')||'<li><span class="mute">予定はありません</span></li>'}</ol>${more>0?`<p class="more">他 ${more} 件　<a onclick="showPage('cal')">カレンダーで見る</a></p>`:''}</section>
  </div>
  <section class="pn a wk"><h3>今週<span>${wsd.getMonth()+1}/${wsd.getDate()} – ${wed.getMonth()+1}/${wed.getDate()}</span></h3>${dashWeek()}</section></div>
  <div class="R">
    <section class="pn b cl" onclick="showPage('claude')"><h3>Claudeの進捗状況</h3><div class="ring">${ringSVG(avgPct(),true)}<p>${S.cps.length?`${S.cps.length}つの作業が<br>進んでいます`:'進行中の作業は<br>ありません'}<small>全体の進捗</small></p></div>${S.cps.slice(0,2).map(p=>`<div class="pj"><div><b>${esc(p.name)}</b><span class="n">${p.pct}%</span></div><div class="bar"><i style="width:${p.pct}%"></i></div>${p.note?`<small>${esc(p.note)}</small>`:''}</div>`).join('')}${usageHTML()}</section>
    <section class="pn b td"><h3>TODO<span>${open.length}件</span></h3><ul class="tdl">${sortTodos(S.todos).slice(0,5).map(t=>todoLi(t,false)).join('')||'<li><span class="mute">タスクなし</span></li>'}</ul><div class="add" onclick="newItem('todo')"><svg class="i"><use href="#pl"/></svg>タスクを追加</div></section>
    <section class="memo" onclick="showPage('todo')"><h3>メモ</h3><p>${esc(S.memo||'').replace(/\n/g,'<br>')||'<span class="mute">メモはありません</span>'}</p></section>
  </div></div>`;
}

/* カレンダー（週は24時間をスクロール、月は6週分） */
function calNav(n){if(calMode==='week')viewDate.setDate(viewDate.getDate()+7*n);else{viewDate.setDate(1);viewDate.setMonth(viewDate.getMonth()+n);}renderCal();}
function renderCal(){
  $('p-cal').innerHTML=`<section class="pn a"><div class="ch cal-h"><div><button class="btn btn-ghost sm" onclick="calNav(-1)">‹</button><button class="btn btn-ghost sm" onclick="viewDate=new Date();renderCal()">今日</button><button class="btn btn-ghost sm" onclick="calNav(1)">›</button></div><b class="cal-t">${viewDate.getFullYear()}年${viewDate.getMonth()+1}月</b></div>${calMode==='week'?weekHTML():monthHTML()}</section>`;
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
    const its=l.filter(e=>sameDay(pD(e.start),d)).map(e=>({ev:e,s:pD(e.start),e:pD(e.end)}));layoutCols(its);
    its.forEach(it=>{const e=it.ev,s=it.s,en=it.e;h+=`<div class="wk-e" style="top:${Math.round((s.getHours()*60+s.getMinutes())/60*H)}px;height:${Math.round(Math.max((en-s)/3600000,.4)*H-2)}px;left:calc(${it._c} * 100% / ${it._n} + 2px);width:calc(100% / ${it._n} - 4px);right:auto;--c:${colOf(e)}" onclick="evDetail('${reg(e)}')"><b>${esc(e.title)}</b><small>${fmtT(s)}</small></div>`;});
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


/* 予定の作成・編集・詳細・削除（繰り返しは「この回だけ／期間／すべて」を選べる）*/
const scopeHTML=(n,label,occ,until)=>`<div class="fg"><label>${label}</label><label class="rd"><input type="radio" name="${n}" value="one" checked onchange="scChg('${n}')"> この回だけ</label><label class="rd"><input type="radio" name="${n}" value="range" onchange="scChg('${n}')"> 期間を指定</label><div class="two" id="${n}R" style="display:none"><div class="fg"><label>開始日</label><input class="finput" type="date" id="${n}From" value="${occ}"></div><div class="fg"><label>終了日</label><input class="finput" type="date" id="${n}To" value="${until||occ}"></div></div><label class="rd"><input type="radio" name="${n}" value="all" onchange="scChg('${n}')"> すべての回</label></div>`;
const scVal=n=>document.querySelector(`input[name=${n}]:checked`).value;
function scChg(n){const v=scVal(n);$(n+'R').style.display=v==='range'?'grid':'none';if(n==='fsc'){const l=v!=='all';$('fRep').disabled=l;$('fUntil').disabled=l;}}
function repChg(){$('fUntilRow').style.display=$('fRep').value!=='none'?'block':'none';}
let edId=null,edOcc=null;
function evDlg(d,h,id,occ){
  const ed=id?S.events.find(x=>x.id===id):null;let s,e;
  if(ed){const du=pD(ed.end)-pD(ed.start);s=occ?pD(occ):pD(ed.start);e=new Date(s.getTime()+du);}
  else{s=new Date(d||new Date());if(h!==undefined)s.setHours(h,0,0,0);else if(!d){s.setMinutes(0,0,0);s.setHours(s.getHours()+1);}e=new Date(s);e.setHours(e.getHours()+1);}
  edId=ed?ed.id:null;edOcc=ed?dayStr(s):null;
  dlg(ed?'予定を編集':'予定を作成',`${ed&&recurring(ed)?scopeHTML('fsc','変更の範囲',edOcc,ed.until):''}<div class="fg"><label>タイトル</label><input class="finput" id="fTitle" value="${ed?esc(ed.title):''}"></div>
  <div class="two"><div class="fg"><label>開始</label><input class="finput" id="fStart" type="datetime-local" value="${localISO(s)}"></div><div class="fg"><label>終了</label><input class="finput" id="fEnd" type="datetime-local" value="${localISO(e)}"></div></div>
  <div class="two"><div class="fg"><label>フォルダー</label><select class="finput" id="fFolder"><option value="">なし</option>${Object.entries(FOLDERS).map(([k,f])=>`<option value="${k}"${ed&&ed.folder===k?' selected':''}>${f.label}</option>`).join('')}</select></div>
  <div class="fg"><label>繰り返し</label><select class="finput" id="fRep" onchange="repChg()">${Object.entries(REP).map(([k,v])=>`<option value="${k}"${ed&&ed.repeat===k?' selected':''}>${v}</option>`).join('')}</select></div></div>
  <div class="fg" id="fUntilRow" style="display:none"><label>繰り返しの終了日（空欄なら続ける）</label><input class="finput" id="fUntil" type="date" value="${ed&&ed.until||''}"></div>
  <div class="fg"><label>説明</label><textarea class="finput" id="fDesc" rows="2">${ed?esc(ed.desc||''):''}</textarea></div>
  <label class="chkrow"><input type="checkbox" id="fNotif" ${!ed||ed.notif?'checked':''}> 通知する</label>
  <div class="btn-row"><button class="btn btn-ghost" onclick="closeModal('dlg')">キャンセル</button><button class="btn btn-prim" onclick="saveEv()">保存</button></div>`);
  if(ed&&recurring(ed))scChg('fsc');repChg();$('fTitle').focus();
}
function saveEv(){
  const title=$('fTitle').value.trim();if(!title){$('fTitle').focus();return;}
  const start=$('fStart').value,end=$('fEnd').value;
  if(!start||!end||end<=start){alert('終了は開始より後にしてください');return;}
  const f={title,start,end,folder:$('fFolder').value,notif:$('fNotif').checked,desc:$('fDesc').value};
  const rep=$('fRep').value,until=rep==='none'?'':$('fUntil').value;
  if(until&&until<start.slice(0,10)){alert('繰り返しの終了日は開始日より後にしてください');return;}
  if(!edId)S.events.push({id:gid(),...f,repeat:rep,until});
  else{
    const e=S.events.find(x=>x.id===edId);
    if(recurring(e)){
      const sc=scVal('fsc');
      if(sc==='all'){
        const delta=Math.round((new Date(start.slice(0,10))-new Date(edOcc))/86400000);
        const bs=pD(e.start);bs.setDate(bs.getDate()+delta);const ns=pD(start);bs.setHours(ns.getHours(),ns.getMinutes(),0,0);
        applyScope(edId,'all',null,null,{...f,start:localISO(bs),end:localISO(new Date(bs.getTime()+(pD(end)-pD(start)))),repeat:rep,until});
      }else{
        const fr=sc==='one'?edOcc:$('fscFrom').value,to=sc==='one'?edOcc:$('fscTo').value;
        if(!fr||!to||fr>to){alert('期間の開始日と終了日を正しく入れてください');return;}
        applyScope(edId,sc,fr,to,f);
      }
    }else applyScope(edId,'all',null,null,{...f,repeat:rep,until});
  }
  save();closeModal('dlg');showPage();
}
function evDetail(k){
  const e=EV[k];if(!e)return;const oid=e.id.replace(/_r\d+$/,'');
  dlg(e.title,`<div class="det"><p>日時：${fmtD(pD(e.start))} ${fmtT(pD(e.start))} – ${fmtT(pD(e.end))}</p><p>フォルダー：${e.folder?FOLDERS[e.folder].label:'なし'}</p><p>繰り返し：${REP[e.repeat]||'なし'}${e.until?'（'+e.until.replace(/-/g,'/')+'まで）':''}</p><p>通知：${e.notif?'あり':'なし'}</p>${e.desc?`<p>${esc(e.desc)}</p>`:''}</div>
  <div class="btn-row"><button class="btn btn-ghost" onclick="closeModal('dlg')">閉じる</button><button class="btn btn-ghost" onclick="evDlg(null,undefined,'${oid}','${e.start}')">編集</button><button class="btn btn-del" onclick="delDlg('${oid}','${e.start}')">削除</button></div>`);
}
function delDlg(id,occ){
  const e=S.events.find(x=>x.id===id);if(!e)return;
  if(!recurring(e)){if(!confirm('この予定を削除しますか？'))return;applyScope(id,'all',null,null,null);save();closeModal('dlg');showPage();return;}
  const o=dayStr(pD(occ));
  dlg('予定を削除',`<p class="mute" style="margin-bottom:10px">「${esc(e.title)}」は繰り返し予定です。</p>${scopeHTML('dsc','削除の範囲',o,e.until)}<div class="btn-row"><button class="btn btn-ghost" onclick="closeModal('dlg')">キャンセル</button><button class="btn btn-del" onclick="delGo('${id}','${o}')">削除する</button></div>`);
}
function delGo(id,o){
  const sc=scVal('dsc'),fr=sc==='one'?o:$('dscFrom').value,to=sc==='one'?o:$('dscTo').value;
  if(sc==='range'&&(!fr||!to||fr>to)){alert('期間の開始日と終了日を正しく入れてください');return;}
  applyScope(id,sc,fr,to,null);save();closeModal('dlg');showPage();
}

/* TODO・メモ（期限つき）*/
function renderTodo(){$('todoList').innerHTML=S.todos.length?`<ul class="tdl">${sortTodos(S.todos).map(t=>todoLi(t,true)).join('')}</ul>`:'<p class="mute">TODOはありません</p>';if(document.activeElement!==$('memoText'))$('memoText').value=S.memo||'';}
function addTodo(){const v=$('todoInput').value.trim();if(!v)return;S.todos.push({id:gid(),text:v,note:'',done:false,due:$('todoDue').value||''});$('todoInput').value='';$('todoDue').value='';save();showPage();}
function setDue(id,v){const t=S.todos.find(x=>x.id===id);if(t){t.due=v||'';save();showPage();}}
function togTodo(id){const t=S.todos.find(x=>x.id===id);if(t){t.done=!t.done;save();showPage();}}
function delTodo(id){S.todos=S.todos.filter(x=>x.id!==id);save();showPage();}
function saveMemo(b){S.memo=$('memoText').value;save();b.textContent='保存しました';setTimeout(()=>b.textContent='保存',1200);}


/* Claude進捗 */
function renderClaude(){
  const open=S.todos.filter(t=>!t.done);
  $('p-claude').innerHTML=`<div class="g2p"><section class="pn a"><h3>進捗<span><a onclick="cpDlg()">＋ 追加</a></span></h3><div class="ring">${ringSVG(avgPct(),true)}<p>${S.cps.length?`${S.cps.length}つの作業が<br>進んでいます`:'進行中の作業は<br>ありません'}<small>全体の進捗</small></p></div>${cpRows(true)}</section>
  <div class="col"><section class="pn b" onclick="tokEdit()"><h3>使用状況</h3>${usageHTML()}<p class="mute" style="margin-top:8px">クリックして数値を更新できます</p></section>
  <section class="pn b" onclick="showPage('todo')"><h3>TODO<span>${open.length}件</span></h3><ul class="tdl">${sortTodos(S.todos).filter(t=>!t.done).slice(0,5).map(t=>todoLi(t,false)).join('')||'<li><span class="mute">タスクなし</span></li>'}</ul></section></div></div>`;
}
function tokEdit(){const t=S.tokens,g=(m,v)=>{const r=prompt(m,v);return r===null?v:(parseInt(r)||0);};t.used=g('トークン使用数',t.used);t.max=g('トークン上限',t.max);t.apiUsed=g('APIリクエスト数',t.apiUsed);t.apiMax=g('APIリクエスト上限',t.apiMax);save();renderClaude();}
function cpDlg(){dlg('プロジェクトを追加',`<div class="fg"><label>プロジェクト名</label><input class="finput" id="cName"></div><div class="fg"><label>進捗 <span id="cPl">0</span>%</label><input type="range" id="cPct" min="0" max="100" value="0" style="width:100%" oninput="$('cPl').textContent=this.value"></div><div class="fg"><label>メモ</label><input class="finput" id="cNote"></div><div class="btn-row"><button class="btn btn-ghost" onclick="closeModal('dlg')">キャンセル</button><button class="btn btn-prim" onclick="cpSave()">保存</button></div>`);}
function cpSave(){const n=$('cName').value.trim();if(!n)return;S.cps.push({id:gid(),name:n,pct:+$('cPct').value,note:$('cNote').value.trim()});save();closeModal('dlg');showPage();}
function cpDel(id){S.cps=S.cps.filter(p=>p.id!==id);save();showPage();}


/* 通知・フォルダーの一覧 */
function notifDlg(){
  const n=new Date(),to=new Date(n);to.setDate(to.getDate()+7);
  const l=expand(n,to).filter(e=>e.notif&&pD(e.end)>=n).sort((a,b)=>pD(a.start)-pD(b.start));
  dlg('通知（7日以内の予定）',l.map(e=>`<div class="nrow" onclick="closeModal('dlg');evDetail('${reg(e)}')"><b>${esc(e.title)}</b><small>${fmtD(pD(e.start))} ${fmtT(pD(e.start))}</small></div>`).join('')||'<p class="mute">通知する予定はありません</p>');
}
function folderDlg(){
  dlg('フォルダー',`<div class="nrow" onclick="closeModal('dlg');setFolder('')"><b>すべて</b><small>${S.events.length}件</small></div>`+Object.entries(FOLDERS).map(([k,f])=>`<div class="nrow" onclick="closeModal('dlg');setFolder('${k}')"><b><span class="d" style="--c:${PCOL[k]}"></span> ${f.label}</b><small>${S.events.filter(e=>e.folder===k).length}件</small></div>`).join(''));
}

/* 新規作成メニュー・起動 */
function toggleNew(e){e.stopPropagation();$('newMenu').classList.toggle('open');}
function newItem(k){
  $('newMenu').classList.remove('open');
  if(k==='ev')evDlg();else{showPage('todo');$(k==='todo'?'todoInput':'memoText').focus();}
}
document.addEventListener('click',()=>$('newMenu').classList.remove('open'));
$('todoInput').addEventListener('keydown',e=>{if(e.key==='Enter')addTodo();});
$('memoText').value=S.memo||'';
updateDateBar();
showPage('dash');
Store.start();
setInterval(()=>{updateDateBar();if(page==='dash')renderDash();},60000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&Store.user)Store.sync();});
