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
