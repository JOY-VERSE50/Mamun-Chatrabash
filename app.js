const $=id=>document.getElementById(id);
let state={borders:[],payments:[]};

function hideAll(){["loginView","adminLogin","adminView","userView"].forEach(id=>$(id).classList.add("hidden"))}
function goHome(){hideAll();$("loginView").classList.remove("hidden")}
function showAdminLogin(){hideAll();$("adminLogin").classList.remove("hidden")}
async function showUserPanel(){hideAll();$("userView").classList.remove("hidden");await loadData()}
function adminLogin(){
  const u=$("adminUser").value.trim(),p=$("adminPass").value;
  if(!u||!p){$("loginMsg").textContent="Username ও password দিন।";return}
  api("adminLogin",{username:u,password:p}).then(r=>{
    if(r.ok){sessionStorage.setItem("adminToken",r.token);hideAll();$("adminView").classList.remove("hidden");loadData()}
    else $("loginMsg").textContent=r.message||"Login failed";
  }).catch(e=>$("loginMsg").textContent=e.message);
}
function logoutAdmin(){sessionStorage.removeItem("adminToken");goHome()}
async function api(action,data={}){
  if(API_URL.includes("PASTE_")) throw new Error("প্রথমে config.js-এ Apps Script Web App URL বসান।");
  const body={action,...data};
  const token=sessionStorage.getItem("adminToken"); if(token) body.token=token;
  const r=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(body)});
  return await r.json();
}
async function loadData(){
  try{
    const r=await api("getData"); if(!r.ok) throw new Error(r.message||"Data load failed");
    state=r.data; renderAll();
  }catch(e){
    $("userTable").innerHTML=`<p class="msg">${e.message}</p>`;
    $("adminTable").innerHTML=`<p class="msg">${e.message}</p>`;
  }
}
function renderAll(){
  const totals={}; state.borders.forEach(b=>totals[b.id]=0);
  state.payments.forEach(p=>totals[p.borderId]=(totals[p.borderId]||0)+Number(p.amount||0));
  $("totalBorders").textContent=state.borders.length;
  $("totalPaid").textContent="৳"+Object.values(totals).reduce((a,b)=>a+b,0).toLocaleString("en-BD");
  $("payBorder").innerHTML=state.borders.map(b=>`<option value="${b.id}">${esc(b.name)} — রুম ${esc(b.room)}</option>`).join("");
  $("adminTable").innerHTML=makeTable(totals,true);
  $("userTable").innerHTML=makeTable(totals,false);
}
function makeTable(totals,admin){
  if(!state.borders.length)return "<p class='muted'>এখনো কোনো বর্ডার যোগ করা হয়নি।</p>";
  let h="<table><thead><tr><th>রুম</th><th>নাম</th><th>মোট জমা</th>";
  if(admin)h+="<th>পেমেন্ট সংখ্যা</th>";
  h+="</tr></thead><tbody>";
  state.borders.forEach(b=>{
    const ps=state.payments.filter(p=>p.borderId===b.id);
    h+=`<tr><td>${esc(b.room)}</td><td>${esc(b.name)}</td><td class="paid">৳${Number(totals[b.id]||0).toLocaleString("en-BD")}</td>`;
    if(admin)h+=`<td>${ps.length}</td>`;
    h+="</tr>";
  });
  return h+"</tbody></table>";
}
async function addBorder(){
  const name=$("newName").value.trim(),room=$("newRoom").value.trim();
  if(!name||!room){$("adminMsg").textContent="নাম ও রুম নম্বর দিন।";return}
  const r=await api("addBorder",{name,room});
  $("adminMsg").textContent=r.ok?"বর্ডার যোগ হয়েছে।":(r.message||"ব্যর্থ");
  if(r.ok){$("newName").value="";$("newRoom").value="";await loadData()}
}
async function addPayment(){
  const borderId=$("payBorder").value,date=$("payDate").value,amount=Number($("payAmount").value),note=$("payNote").value.trim();
  if(!borderId||!date||!amount){$("payMsg").textContent="বর্ডার, তারিখ ও টাকার পরিমাণ দিন।";return}
  const r=await api("addPayment",{borderId,date,amount,note});
  $("payMsg").textContent=r.ok?"পেমেন্ট সংরক্ষণ হয়েছে।":(r.message||"ব্যর্থ");
  if(r.ok){$("payAmount").value="";$("payNote").value="";await loadData()}
}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
$("refreshBtn").onclick=loadData;
$("payDate").value=new Date().toISOString().slice(0,10);
