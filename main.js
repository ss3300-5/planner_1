/* 起動処理 */
// ===== INIT =====
function init(){
  // 旧sessionStorage
  const sp=sessionStorage.getItem('p_page'),sv=sessionStorage.getItem('p_calview'),sd=sessionStorage.getItem('p_date');
  if(sv) calView=sv;
  if(sd) viewDate=new Date(sd);
  updateDateBar();
  showPage(sp||'home');
  document.getElementById('memoText').value=S.memo||'';
  document.getElementById('fabBtn').onclick=()=>openAddEvent();
  setInterval(()=>{updateDateBar();if(curPage==='home')renderHome();},60000);
}

window.addEventListener('pageshow',e=>{
  if(e.persisted){
    S=Store.load()||S;
    const sp=sessionStorage.getItem('p_page')||'home';
    const sv=sessionStorage.getItem('p_calview'),sd=sessionStorage.getItem('p_date');
    if(sv)calView=sv; if(sd)viewDate=new Date(sd);
    updateDateBar(); showPage(sp);
    document.getElementById('memoText').value=S.memo||'';
  }
});
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible'){
    S=Store.load()||S;
    updateDateBar();
    if(curPage==='home')renderHome();
  }
});

function updateDateBar(){
  const n=new Date();
  document.getElementById('dateBar').textContent=`${n.getFullYear()}年${n.getMonth()+1}/${n.getDate()} ${n.getHours()}:${pad(n.getMinutes())}`;
}

init();
