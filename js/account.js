/* アカウント／同期の画面 */
function authRender(){
  const st=document.getElementById('authStatus');if(!st)return;
  const on=Store.enabled(),u=Store.user;
  st.textContent=!on?'クラウド保存は未設定です（js/config.js に接続情報を入れると有効になります）。現在はこの端末のみに保存されます。':u?`ログイン中: ${u.email}\n${Store.status}`:'未ログイン（この端末のみに保存）';
  document.getElementById('authForm').style.display=on&&!u?'block':'none';
  document.getElementById('authOut').style.display=u?'block':'none';
}
function openAuth(){authRender();openModal('authModal');}
function authCred(){return{email:document.getElementById('authEmail').value.trim(),password:document.getElementById('authPass').value};}
async function authSignIn(){
  const {error}=await Store.sb.auth.signInWithPassword(authCred());
  if(error){alert('ログインできませんでした: '+error.message);return;}
  await Store.afterLogin();authRender();
}
async function authSignUp(){
  const {data,error}=await Store.sb.auth.signUp(authCred());
  if(error){alert('登録できませんでした: '+error.message);return;}
  if(!data.session){alert('確認メールを送りました。メール内のリンクで認証してからログインしてください。');return;}
  await Store.afterLogin();authRender();
}
async function authSignOut(){
  await Store.sb.auth.signOut();Store.user=null;Store.status='この端末のみに保存';authRender();
}

/* 接続診断：どこで止まっているかを画面に表示する */
async function authDiagnose(){
  const L=[],ok=m=>L.push('✅ '+m),ng=m=>L.push('❌ '+m),el=document.getElementById('authDiag');
  el.textContent='診断中…';
  typeof supabase!=='undefined'?ok('Supabaseライブラリの読み込み'):ng('Supabaseライブラリが読み込めていません（通信の遮断・広告ブロック・古いキャッシュの可能性）');
  CLOUD_CONFIG.url?ok('URL: '+CLOUD_CONFIG.url):ng('js/config.js の url が空です');
  CLOUD_CONFIG.anonKey?ok('キー: '+CLOUD_CONFIG.anonKey.slice(0,12)+'…'):ng('js/config.js の anonKey が空です');
  if(Store.sb){
    try{
      const {data,error}=await Store.sb.auth.getSession();
      if(error)throw error;
      if(!data.session)ng('未ログインです（メール確認が済んでいるか確認）');
      else{
        ok('ログイン中: '+data.session.user.email);
        const r=await Store.sb.from('planner_data').select('updated_at').maybeSingle();
        if(r.error)ng('テーブルの読み取りに失敗: '+r.error.message+'（setup.sql を実行したか確認）');
        else{
          ok('テーブル読み取りOK（クラウドのデータ: '+(r.data?'あり '+r.data.updated_at:'なし')+'）');
          Store.user=data.session.user;await Store.sync();
          Store.status.startsWith('同期エラー')?ng(Store.status):ok('同期処理: '+Store.status);
        }
      }
    }catch(e){ng('通信エラー: '+e.message+'（URLが正しいか確認）');}
  }
  L.push('端末のデータ更新時刻: '+(S._updatedAt||'なし'));
  el.textContent=L.join('\n');
}
