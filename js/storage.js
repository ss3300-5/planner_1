/* データ保存層。保存先へのアクセスはここだけに集約する。
   - 常にこの端末(localStorage)へ保存し、ログイン中はSupabaseへも同期する
   - 衝突時は更新時刻が新しい方を採用（個人利用向けの簡易方式） */
const CFG=(typeof CLOUD_CONFIG!=='undefined')?CLOUD_CONFIG:{url:'',anonKey:''};
const Store={
  KEY:'plannerV4',sb:null,user:null,status:'この端末のみに保存',_t:null,
  load(){try{return JSON.parse(localStorage.getItem(this.KEY)||'null');}catch(e){return null;}},
  _local(d){try{localStorage.setItem(this.KEY,JSON.stringify(d));}catch(e){console.error(e);}},
  save(d){d._updatedAt=new Date().toISOString();this._local(d);this.push();},
  url(){let u=(CFG.url||'').trim();if(!/^https?:\/\//.test(u))u='https://'+u;try{return new URL(u).origin;}catch(e){return u;}},
  enabled(){return !!(typeof supabase!=='undefined'&&CFG.url&&CFG.anonKey);},
  setStatus(m){this.status=m;if(typeof authRender==='function')authRender();},
  async start(){
    if(!this.enabled())return;
    this.sb=supabase.createClient(this.url(),CFG.anonKey.trim());
    const {data}=await this.sb.auth.getSession();
    this.user=data.session?data.session.user:null;
    if(this.user)await this.sync();
    setInterval(()=>{if(document.visibilityState==='visible'&&this.user)this.sync();},60000);
  },
  async afterLogin(){
    const {data}=await this.sb.auth.getUser();
    this.user=data.user;await this.sync();
  },
  async sync(){
    if(!this.user)return;
    try{
      const {data:row,error}=await this.sb.from('planner_data').select('data,updated_at').maybeSingle();
      if(error)throw error;
      const rt=row?new Date(row.data._updatedAt||row.updated_at):0,lt=new Date(S._updatedAt||0);
      if(row&&rt>lt){
        S=row.data;this._local(S);
        document.getElementById('memoText').value=S.memo||'';
        showPage(curPage);
        this.setStatus('同期済み（クラウドの内容を反映）');
      }else{await this._push();}
    }catch(e){this.setStatus('同期エラー: '+e.message);}
  },
  push(){if(!this.user)return;clearTimeout(this._t);this._t=setTimeout(()=>this._push(),800);},
  async _push(){
    try{
      const {error}=await this.sb.from('planner_data').upsert({user_id:this.user.id,data:S,updated_at:S._updatedAt||new Date().toISOString()});
      if(error)throw error;
      this.setStatus('同期済み');
    }catch(e){this.setStatus('同期エラー: '+e.message);}
  }
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

/* 表示の切り替え（PC版 / モバイル版）。選択はこの端末のブラウザに保存する */
function setViewMode(v){
  try{if(v==='auto')localStorage.removeItem('plannerView');else localStorage.setItem('plannerView',v);}catch(e){}
  location.href=v==='pc'?'pc.html':v==='mobile'?'index.html?mobile':'index.html';
}
(function(){try{if(localStorage.getItem('plannerView')){const e=document.getElementById('viewAuto');if(e)e.style.display='';}}catch(x){}})();

