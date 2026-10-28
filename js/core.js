/* データ・定数・日付ヘルパー・繰り返し展開（UIに依存しない部分） */
// ===== STATE =====
let S = Store.load() || {
  events:[
    {id:'e1',title:'デザインレビュー',start:'2026-10-27T10:00',end:'2026-10-27T11:00',folder:'work',repeat:'none',notif:true,desc:'モバイルUI確認'},
    {id:'e2',title:'ランチミーティング',start:'2026-10-27T12:30',end:'2026-10-27T13:30',folder:'personal',repeat:'none',notif:true,desc:''},
    {id:'e3',title:'英会話',start:'2026-10-27T19:00',end:'2026-10-27T20:00',folder:'health',repeat:'weekly',notif:true,desc:''},
    {id:'e4',title:'歯医者',start:'2026-10-28T10:00',end:'2026-10-28T11:00',folder:'important',repeat:'none',notif:true,desc:'定期検診'},
    {id:'e5',title:'ジョギング',start:'2026-10-27T07:00',end:'2026-10-27T07:45',folder:'health',repeat:'daily',notif:false,desc:''},
  ],
  todos:[
    {id:'t1',text:'Figmaのデザイン確認',note:'',done:false},
    {id:'t2',text:'仕様書の更新',note:'v2.1',done:true},
    {id:'t3',text:'テスト実施',note:'',done:false},
  ],
  cps:[
    {id:'c1',name:'予定管理アプリ開発',pct:60,note:'UI刷新中'},
    {id:'c2',name:'APIドキュメント',pct:80,note:'レビュー待ち'},
  ],
  memo:'アプリ改善メモ:\n・フォントサイズ調整\n・カレンダー表示の改善',
  tokens:{used:124500,max:500000,apiUsed:320,apiMax:1000},
};

// 旧データ移行
(()=>{
  const old=localStorage.getItem('plannerV3')||localStorage.getItem('planner2');
  if(old&&!Store.load()){
    try{
      const o=JSON.parse(old);
      if(o&&o.events){
        S.events=o.events; S.todos=o.todos||S.todos;
        S.cps=o.cps||o.claudeProjects||S.cps; S.memo=o.memo||S.memo;
        save();
      }
    }catch(e){}
  }
})();

const FOLDERS={
  important:{label:'重要',fcls:'fc-important',color:'#ef233c'},
  star:     {label:'スター',fcls:'fc-star',color:'#f4a261'},
  work:     {label:'仕事',fcls:'fc-work',color:'#90e0ef'},
  personal: {label:'プライベート',fcls:'fc-personal',color:'#7b5ea7'},
  health:   {label:'健康',fcls:'fc-health',color:'#2d9e6b'},
};
const DJ=['日','月','火','水','木','金','土'];
const DM=['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
const HOUR_H=44;
const pad=n=>String(n).padStart(2,'0');
function pD(s){return new Date(s)}
function sameDay(a,b){return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate()}
function fmtT(d){return `${pad(d.getHours())}:${pad(d.getMinutes())}`}
function fmtD(d){return `${d.getMonth()+1}月${d.getDate()}日(${DJ[d.getDay()]})`}
function fmtDT(d){return `${fmtD(d)} ${fmtT(d)}`}
function localISO(d){return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`}
function gid(){return '_'+Math.random().toString(36).slice(2,9)}
function save(){Store.save(S)}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}

let curPage='home', calView='day', viewDate=new Date(), pickedFolder='', editId=null, editCPId=null;

// ===== EXPAND REPEATS =====
function expand(from,to){
  const res=[],hor=new Date(to);hor.setDate(hor.getDate()+1);
  for(const e of S.events){
    const s=pD(e.start),en=pD(e.end),dur=en-s;
    if(s>=from&&s<=hor)res.push({...e});
    if(e.repeat==='none')continue;
    let cur=new Date(s);
    for(let i=0;i<3000;i++){
      if(e.repeat==='daily')cur.setDate(cur.getDate()+1);
      else if(e.repeat==='weekly')cur.setDate(cur.getDate()+7);
      else if(e.repeat==='yearly')cur.setFullYear(cur.getFullYear()+1);
      if(cur>hor)break;
      if(cur>=from){const ns=new Date(cur),ne=new Date(ns.getTime()+dur);res.push({...e,id:e.id+'_r'+i,start:localISO(ns),end:localISO(ne),_rep:true});}
    }
  }
  return res;
}
