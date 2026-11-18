'use strict';
window.chrome={runtime:{onMessage:{addListener(fn){window.veiloListener=fn;}}}};
window.VeiloDemo={send(msg){let result;window.veiloListener(msg,{},s=>result=s);return result;},preferences:{},tabsCreated:[]};
window.addEventListener('DOMContentLoaded',()=>{
 document.getElementById('invite').onclick=()=>{document.getElementById('page-feedback').textContent='Invite clicked — page interactions are working.';};
 document.querySelectorAll('.person').forEach(b=>b.onclick=()=>{document.getElementById('page-feedback').textContent=`Opened ${b.textContent}.`;});
});
