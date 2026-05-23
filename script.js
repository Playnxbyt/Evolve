const CATS = [
  {id:"fitness",label:"Fitness",emoji:"💪",color:"#FF6B35",bg:"rgba(255,107,53,0.08)"},
  {id:"mental",label:"Mental Growth",emoji:"🧠",color:"#A78BFA",bg:"rgba(167,139,250,0.08)"}, 
  {id:"social",label:"Social Growth",emoji:"🤝",color:"#FBBF24",bg:"rgba(251,191,36,0.08)"}, 
  {id:"skills",label:"Skills",emoji:"🚀",color:"#34D399",bg:"rgba(52,211,153,0.08)"}, 
]; 

const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"]; 
const QUOTES=["1% better every day.","Progress, not perfection.","Small steps, big wins.","You got this, legend.","Evolve or repeat."]; 

// Default state
let state = { 
  goals:{fitness:[],mental:[],social:[],skills:[]}, 
  done:{}, 
  monthData:{}, 
  expanded:null, 
  activeModal:null, 
  calMonth: new Date().getMonth(), 
  calYear: new Date().getFullYear(), 
  streak:0, 
}; 

// LOAD DATA FROM DEVICE STORAGE
const savedData = localStorage.getItem("evolveAppData");
if (savedData) {
  state = { ...state, ...JSON.parse(savedData) };
}

// SAVE DATA HELPER
function saveData() {
  localStorage.setItem("evolveAppData", JSON.stringify(state));
}

// ESCAPE HTML HELPER (Security Fix)
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[tag]));
}

const today = new Date(); 
const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`; 

// Init date + quote 
document.getElementById("date-label").textContent = today.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"}); 
document.getElementById("tagline").textContent = QUOTES[Math.floor(Math.random()*QUOTES.length)]; 

function totalGoals(){ return CATS.reduce((s,c)=>s+state.goals[c.id].length,0); } 
function doneTodayCount(){ return Object.values(state.done).filter(Boolean).length; } 
function catDone(catId){ return state.goals[catId].filter(g=>state.done[`${catId}-${g.id}`]).length; } 
function getCatMonthCount(catId){ return Object.values(state.monthData).reduce((s,d)=>s+(d[catId]||0),0); } 
function getMonthTotal(){ return Object.values(state.monthData).reduce((s,d)=>s+Object.values(d).reduce((a,b)=>a+b,0),0); } 
function getDayScore(y,m,d){ const k=`${y}-${m}-${d}`; const day=state.monthData[k]; return day?Object.values(day).reduce((a,b)=>a+b,0):0; } 

function calcStreak(){ 
  let streak=0, d=new Date(today); 
  for(let i=0;i<60;i++){ 
    const k=`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; 
    if(state.monthData[k]&&Object.values(state.monthData[k]).some(v=>v>0)){streak++;d.setDate(d.getDate()-1);} 
    else break; 
  } 
  return streak; 
} 

function renderHome(){ 
  const total=totalGoals(), done=doneTodayCount(); 
  const pct=total>0?Math.round((done/total)*100):0; 
  const circ=2*Math.PI*54; 
  
  document.getElementById("ring-progress").setAttribute("stroke-dasharray",`${(pct/100)*circ} ${circ}`); 
  document.getElementById("ring-progress").setAttribute("stroke",pct===100?"#34D399":"url(#rg)"); 
  document.getElementById("ring-pct").textContent=`${pct}%`; 
  document.getElementById("ring-sub").textContent=done===0?"Start checking off your goals!":done===total&&total>0?"🎉 All done! Incredible!":"Keep going, almost there!"; 
  
  const streak=calcStreak(); 
  document.getElementById("streak-num").textContent=streak; 
  document.getElementById("stats-streak").textContent=streak; 
  
  // Pills 
  const pills=document.getElementById("cat-pills"); 
  pills.innerHTML=CATS.map(c=>`<div class="cat-pill" style="background:${c.bg};color:${c.color};border-color:${c.color}30"><span>${c.emoji}</span><span>${catDone(c.id)}/${state.goals[c.id].length}</span></div>`).join(""); 
  
  // Category cards 
  const list=document.getElementById("cats-list"); 
  list.innerHTML=CATS.map(cat=>{ 
    const catGoals=state.goals[cat.id]; 
    const d=catDone(cat.id); 
    const cp=catGoals.length>0?Math.round((d/catGoals.length)*100):0; 
    const isExp=state.expanded===cat.id; 
    const doneBadge=d>0&&d===catGoals.length?`<span class="cat-done-badge" style="background:${cat.color};color:#000">✓ Done</span>`:""; 
    
    const goalsHTML=catGoals.length===0?`<div class="goal-empty">No goals yet — tap + to add one</div>`: 
    catGoals.map((g,i)=>{ 
      const gk=`${cat.id}-${g.id}`; 
      const isDone=!!state.done[gk]; 
      return `<div class="goal-row fade-up" data-cat="${cat.id}" data-gid="${g.id}" onclick="toggleGoal('${cat.id}','${g.id}')" style="background:${isDone?cat.color+"18":"rgba(255,255,255,0.04)"};border-color:${isDone?cat.color+"50":"rgba(255,255,255,0.06)"};animation-delay:${i*0.05}s"> <div class="checkbox" style="border-color:${isDone?cat.color:"rgba(255,255,255,0.2)"};background:${isDone?cat.color:"transparent"}">${isDone?'<span class="check-icon">✓</span>':""}</div> <span class="goal-text" style="color:${isDone?"rgba(255,255,255,0.45)":"rgba(255,255,255,0.85)"};text-decoration:${isDone?"line-through":"none"}">${g.text}</span> <button class="del-btn" onclick="event.stopPropagation();deleteGoal('${cat.id}','${g.id}')">✕</button> </div>`; 
    }).join(""); 
    
    return `<div class="cat-card" style="background:${cat.bg};border:1px solid ${cat.color}25;box-shadow:${isExp?`0 0 24px ${cat.color}40`:"none"}"> <div class="cat-header" onclick="toggleExpand('${cat.id}')"> <span class="cat-emoji">${cat.emoji}</span> <div class="cat-info"> <div class="cat-name-row"><span class="cat-name" style="color:${cat.color}">${cat.label}</span>${doneBadge}</div> ${catGoals.length>0?`<div class="cat-bar-wrap"><div class="cat-bar" style="width:${cp}%;background:${cat.color}"></div></div>`:""} </div> <span class="cat-count" style="color:${cat.color}">${catGoals.length>0?`${d}/${catGoals.length}`:""}</span> <button class="add-btn" style="background:${cat.color}22;border:1.5px solid ${cat.color}55;color:${cat.color}" onclick="event.stopPropagation();openModal('${cat.id}')">+</button> </div> ${isExp?`<div class="goals-list">${goalsHTML}</div>`:""} </div>`; 
  }).join(""); 
  
  // Stats view 
  document.getElementById("stats-total-goals").textContent=total; 
  document.getElementById("stats-today-pct").textContent=`${pct}%`; 
  renderCatStats(); 
} 

function renderCatStats(){ 
  const cards=document.getElementById("cat-stat-cards"); 
  if(!cards)return; 
  cards.innerHTML=CATS.map(cat=>{ 
    const catGoals=state.goals[cat.id]; 
    const d=catDone(cat.id); 
    const mc=getCatMonthCount(cat.id); 
    const r=catGoals.length>0?Math.round((d/catGoals.length)*100):0; 
    return `<div class="cat-stat-card" style="background:${cat.bg};border-color:${cat.color}25"> <div class="cat-stat-header"><span class="cat-stat-emoji">${cat.emoji}</span><div><div class="cat-stat-name" style="color:${cat.color}">${cat.label}</div><div class="cat-stat-sub">${catGoals.length} goals set</div></div></div> <div class="cat-stat-3col"> <div class="cat-stat-cell"><div class="cat-stat-val" style="color:${cat.color}">${d}</div><div class="cat-stat-lbl">Today</div></div> <div class="cat-stat-cell"><div class="cat-stat-val" style="color:${cat.color}">${mc}</div><div class="cat-stat-lbl">Month</div></div> <div class="cat-stat-cell"><div class="cat-stat-val" style="color:${cat.color}">${r}%</div><div class="cat-stat-lbl">Rate</div></div> </div> </div>`; 
  }).join(""); 
} 

function renderCalendar(){ 
  const y=state.calYear, m=state.calMonth; 
  document.getElementById("month-name").textContent=`${MONTHS[m]} ${y}`; 
  const days=new Date(y,m+1,0).getDate(); 
  const first=new Date(y,m,1).getDay(); 
  const grid=document.getElementById("cal-grid"); 
  
  let html=""; 
  for(let i=0;i<first;i++) html+=`<div></div>`; 
  for(let d=1;d<=days;d++){ 
    const score=getDayScore(y,m,d); 
    const isToday=d===today.getDate()&&m===today.getMonth()&&y===today.getFullYear(); 
    const isPast=new Date(y,m,d)<today; 
    const intensity=score===0?0:score<=2?0.3:score<=5?0.6:1; 
    const bg=score>0?`rgba(167,139,250,${intensity*0.5})`:isToday?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.03)"; 
    const shadow=score>0?`box-shadow:0 0 8px rgba(167,139,250,${intensity*0.4})`:""; 
    const numColor=isToday?"#A78BFA":isPast&&score===0?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.8)"; 
    html+=`<div class="cal-day${isToday?" today":""}" style="background:${bg};${shadow}"> <span class="cal-day-num" style="color:${numColor}">${d}</span> ${score>0?`<span class="cal-score">+${score}</span>`:""} </div>`; 
  } 
  grid.innerHTML=html; 
  
  // Monthly stats 
  document.getElementById("month-total").textContent=getMonthTotal(); 
  const best=CATS.reduce((b,c)=>{const cnt=getCatMonthCount(c.id);return cnt>(b.count||0)?{...c,count:cnt}:b},{}); 
  document.getElementById("best-cat-emoji").textContent=best.emoji||"—"; 
  document.getElementById("best-cat-name").textContent=best.label||"None yet"; 
  if(best.color) document.getElementById("best-cat-name").style.color=best.color; 
  
  const maxCount=Math.max(...CATS.map(c=>getCatMonthCount(c.id)),1); 
  document.getElementById("cat-bars").innerHTML=CATS.map(cat=>{ 
    const cnt=getCatMonthCount(cat.id); 
    return `<div class="cat-bar-card" style="background:${cat.bg};border:1px solid ${cat.color}20"> <div class="cat-bar-row"><span class="cat-bar-name">${cat.emoji} ${cat.label}</span><span class="cat-bar-count" style="color:${cat.color}">${cnt}</span></div> <div class="bar-track"><div class="bar-fill" style="width:${(cnt/maxCount)*100}%;background:${cat.color}"></div></div> </div>`; 
  }).join(""); 
} 

function renderAll(){ 
  renderHome(); 
  renderCalendar(); 
} 

function toggleExpand(catId){ 
  state.expanded=state.expanded===catId?null:catId; 
  renderHome(); 
  saveData();
} 

function openModal(catId){ 
  state.activeModal=catId; 
  state.expanded=catId; 
  const cat=CATS.find(c=>c.id===catId); 
  document.getElementById("modal-emoji").textContent=cat.emoji; 
  document.getElementById("modal-cat-name").textContent=cat.label; 
  document.getElementById("modal-cat-name").style.color=cat.color; 
  document.getElementById("modal-add-btn").style.background=`linear-gradient(135deg,${cat.color},${cat.color}aa)`; 
  document.getElementById("modal-input").style.borderColor=`${cat.color}60`; 
  document.getElementById("modal-input").value=""; 
  
  const modal=document.getElementById("modal"); 
  modal.classList.add("open"); 
  modal.style.display="flex"; 
  setTimeout(()=>document.getElementById("modal-input").focus(),350); 
} 

function closeModal(){ 
  document.getElementById("modal").style.display="none"; 
  document.getElementById("modal").classList.remove("open"); 
  state.activeModal=null; 
} 

document.getElementById("modal").addEventListener("click",e=>{ 
  if(e.target===document.getElementById("modal")) closeModal(); 
}); 

document.getElementById("modal-add-btn").addEventListener("click",()=>{ 
  const val=escapeHTML(document.getElementById("modal-input").value.trim()); 
  if(!val||!state.activeModal) return; 
  state.goals[state.activeModal].push({id:Date.now(),text:val}); 
  closeModal(); 
  renderAll(); 
  saveData();
}); 

document.getElementById("modal-input").addEventListener("keydown",e=>{ 
  if(e.key==="Enter") document.getElementById("modal-add-btn").click(); 
}); 

function toggleGoal(catId,goalId){ 
  const k=`${catId}-${goalId}`; 
  state.done[k]=!state.done[k]; 
  const dayData=state.monthData[todayKey]||{}; 
  const curr=dayData[catId]||0; 
  dayData[catId]=Math.max(0,curr+(state.done[k]?1:-1)); 
  state.monthData[todayKey]=dayData; 
  renderAll(); 
  saveData();
} 

function deleteGoal(catId,goalId){ 
  // Fix subtraction bug: if it was checked, remove it from month count
  const k=`${catId}-${goalId}`; 
  if (state.done[k]) {
    const dayData = state.monthData[todayKey];
    if (dayData && dayData[catId]) {
      dayData[catId] = Math.max(0, dayData[catId] - 1);
    }
  }

  state.goals[catId]=state.goals[catId].filter(g=>g.id!=goalId); 
  delete state.done[k]; 
  renderAll(); 
  saveData();
} 

// Nav 
document.querySelectorAll(".nav-btn").forEach(btn=>{ 
  btn.addEventListener("click",()=>{ 
    const v=btn.dataset.view; 
    document.querySelectorAll(".view").forEach(el=>el.classList.remove("active")); 
    document.getElementById(`view-${v}`).classList.add("active"); 
    document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active")); 
    btn.classList.add("active"); 
    ["home","month","stats"].forEach(id=>{ 
      document.getElementById(`dot-${id}`).style.display=id===v?"block":"none"; 
    }); 
    if(v==="month") renderCalendar(); 
    if(v==="stats") renderCatStats(); 
  }); 
}); 

// Calendar nav 
document.getElementById("prev-month").addEventListener("click",()=>{ 
  if(state.calMonth===0){state.calMonth=11;state.calYear--;}else state.calMonth--; 
  renderCalendar(); 
}); 
document.getElementById("next-month").addEventListener("click",()=>{ 
  if(state.calMonth===11){state.calMonth=0;state.calYear++;}else state.calMonth++; 
  renderCalendar(); 
}); 

// Initial render 
renderAll();
    
