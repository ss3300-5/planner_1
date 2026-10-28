/* データ保存層。保存先へのアクセスはここだけに集約する。
   クラウド保存（Supabase / Firebase 等）に替える場合は Store の中身だけ差し替える。 */
const Store={
  KEY:'plannerV4',
  load(){try{return JSON.parse(localStorage.getItem(this.KEY)||'null');}catch(e){return null;}},
  save(data){try{localStorage.setItem(this.KEY,JSON.stringify(data));}catch(e){console.error(e);}}
};

function exportData(){
  const blob=new Blob([JSON.stringify(S,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='planner-backup-'+new Date().toISOString().slice(0,10)+'.json';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}

function importData(){
  const inp=document.createElement('input');inp.type='file';inp.accept='application/json,.json';
  inp.onchange=()=>{
    const f=inp.files[0];if(!f)return;
    const r=new FileReader();
    r.onload=()=>{
      try{
        const d=JSON.parse(r.result);
        if(!d||!Array.isArray(d.events)||!Array.isArray(d.todos))throw new Error('形式が違います');
        S=d;
        if(!S.cps)S.cps=[];
        if(!S.tokens)S.tokens={used:0,max:500000,apiUsed:0,apiMax:1000};
        save();
        document.getElementById('memoText').value=S.memo||'';
        showPage(curPage);
        alert('読み込みました');
      }catch(e){alert('読み込めませんでした: '+e.message);}
    };
    r.readAsText(f);
  };
  inp.click();
}
