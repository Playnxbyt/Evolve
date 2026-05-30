/* ═══════════════════════════════════════════════
   EVOLVE — Upgraded PWA Script
   Features: XP/Levels, Mood Tracking, Quick-Add FAB,
   Day-tap Goals, Monthly %, Analytics Dashboard,
   Particle BG, Badges, Progress Graph
═══════════════════════════════════════════════ */

// ── Sound Engine ───────────────────────────────
const SOUNDS = {
  advancement: new Audio('sounds/ADVANCEMENT_MADE_.mp3'),
  finish:      new Audio('sounds/Finish_Tasks.mp3'),
  check:       new Audio('sounds/Check.mp3'),
  click:       new Audio('sounds/Click.mp3'),
  uiPop:       new Audio('sounds/UI_POP.mp3'),
  uiSwipe:     new Audio('sounds/UI_SWIPE.mp3'),
};
SOUNDS.advancement.volume = 0.8;
SOUNDS.finish.volume      = 0.9;
SOUNDS.check.volume       = 0.7;
SOUNDS.click.volume       = 0.6;
SOUNDS.uiPop.volume       = 0.6;
SOUNDS.uiSwipe.volume     = 0.65;

function playSound(name) {
  const s = SOUNDS[name];
  if (!s) return;
  s.currentTime = 0;
  s.play().catch(() => {});
}

const CATS = [
  {id:"fitness",  label:"Fitness",      emoji:"💪", color:"#FF6B35", bg:"rgba(255,107,53,0.09)"},
  {id:"mental",   label:"Mental Growth",emoji:"🧠", color:"#A78BFA", bg:"rgba(167,139,250,0.09)"},
  {id:"social",   label:"Social Growth", emoji:"🤝", color:"#FBBF24", bg:"rgba(251,191,36,0.09)"},
  {id:"skills",   label:"Skills",        emoji:"🚀", color:"#34D399", bg:"rgba(52,211,153,0.09)"},
];

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const QUOTES = ["1% better every day.","Progress, not perfection.","Small steps, big wins.","You got this, legend.","Evolve or repeat.","Consistency beats intensity.","Show up. Always."];

// XP / Level config
const LEVELS = [
  {min:0,   max:99,   title:"Seedling",    icon:"🌱"},
  {min:100, max:249,  title:"Grinder",     icon:"⚡"},
  {min:250, max:499,  title:"Warrior",     icon:"⚔️"},
  {min:500, max:999,  title:"Champion",    icon:"🏆"},
  {min:1000,max:1999, title:"Legend",      icon:"🌟"},
  {min:2000,max:9999, title:"Transcendent",icon:"🔮"},
];

const BADGES = [
  {id:"first_goal",  label:"First Goal",  icon:"🎯", desc:"Complete your first goal"},
  {id:"streak3",     label:"On Fire",     icon:"🔥", desc:"3-day streak"},
  {id:"streak7",     label:"Week Warrior",icon:"📅", desc:"7-day streak"},
  {id:"streak30",    label:"Iron Will",   icon:"💎", desc:"30-day streak"},
  {id:"all_cats",    label:"All-Rounder", icon:"🌈", desc:"Complete a goal in every category today"},
  {id:"perfect_day", label:"Perfect Day", icon:"⭐", desc:"100% completion in a day"},
  {id:"century",     label:"Century",     icon:"💯", desc:"100 total goals completed"},
];

const MOOD_LABELS = {good:"Feeling good 😃",meh:"Feeling okay 😐",bad:"Feeling rough 😞"};
const MOOD_EMOJI  = {good:"😃", meh:"😐", bad:"😞", "":""};

// ── Default state ──────────────────────────────
let state = {
  goals:    {fitness:[],mental:[],social:[],skills:[]},
  done:     {},
  monthData:{},
  expanded: null,
  activeModal: null,
  calMonth: new Date().getMonth(),
  calYear:  new Date().getFullYear(),
  streak:   0,
  xp:       0,
  badges:   [],
  moodLog:  {},   // dateKey → "good"|"meh"|"bad"
  fabOpen:  false,
};

// Load persisted data
const savedData = localStorage.getItem("evolveAppData");
if (savedData) {
  try { state = {...state, ...JSON.parse(savedData)}; } catch(e){}
}

function saveData() {
  localStorage.setItem("evolveAppData", JSON.stringify(state));
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, t => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":"&#39;",'"':'&quot;'}[t]));
}

// ── Date helpers ───────────────────────────────
const today    = new Date();
const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

document.getElementById("date-label").textContent =
  today.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
document.getElementById("tagline").textContent =
  QUOTES[Math.floor(Math.random()*QUOTES.length)];

// ── Counters ───────────────────────────────────
function totalGoals()   { return CATS.reduce((s,c)=>s+state.goals[c.id].length,0); }
function doneTodayCount(){ return Object.values(state.done).filter(Boolean).length; }
function catDone(catId) { return state.goals[catId].filter(g=>state.done[`${catId}-${g.id}`]).length; }
function getCatMonthCount(catId){ return Object.values(state.monthData).reduce((s,d)=>s+(d[catId]||0),0); }
function getMonthTotal(){ return Object.values(state.monthData).reduce((s,d)=>s+Object.values(d).reduce((a,b)=>a+b,0),0); }
function getDayScore(y,m,d){ const k=`${y}-${m}-${d}`; const day=state.monthData[k]; return day?Object.values(day).reduce((a,b)=>a+b,0):0; }
function getAllTimeCompleted(){ return Object.values(state.monthData).reduce((s,d)=>s+Object.values(d).reduce((a,b)=>a+b,0),0); }

function calcStreak(){
  let streak=0, d=new Date(today);
  for(let i=0;i<90;i++){
    const k=`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if(state.monthData[k]&&Object.values(state.monthData[k]).some(v=>v>0)){streak++;d.setDate(d.getDate()-1);}
    else break;
  }
  return streak;
}

// ── XP / Level system ──────────────────────────
function getLevelData(xp) {
  for(let i=LEVELS.length-1;i>=0;i--){
    if(xp>=LEVELS[i].min) return {level:i+1,...LEVELS[i]};
  }
  return {level:1,...LEVELS[0]};
}
function getXPProgress(xp) {
  const ld=getLevelData(xp);
  if(ld.level>=LEVELS.length) return 100;
  return Math.round(((xp-ld.min)/(ld.max-ld.min+1))*100);
}
function getXPToNext(xp) {
  const ld=getLevelData(xp);
  if(ld.level>=LEVELS.length) return 0;
  return ld.max+1-xp;
}

function addXP(amount) {
  const prevLevel = getLevelData(state.xp).level;
  state.xp = (state.xp||0)+amount;
  const newLevel = getLevelData(state.xp).level;
  if(newLevel>prevLevel) showLevelUpToast(getLevelData(state.xp));
  renderXP();
  saveData();
}

function renderXP() {
  const ld  = getLevelData(state.xp||0);
  const pct = getXPProgress(state.xp||0);
  const toNext = getXPToNext(state.xp||0);

  // Header badge
  document.getElementById("xp-level").textContent    = `Lv ${ld.level}`;
  document.getElementById("xp-title").textContent    = ld.icon+" "+ld.title;
  document.getElementById("xp-bar-fill").style.width = pct+"%";

  // Stats card
  const lvBig = document.getElementById("xp-level-big");
  const ttBig = document.getElementById("xp-title-big");
  const bfill = document.getElementById("xp-big-fill");
  const xpsub = document.getElementById("xp-sub");
  if(lvBig) lvBig.textContent   = `Lv ${ld.level}`;
  if(ttBig) ttBig.textContent   = ld.icon+" "+ld.title;
  if(bfill) bfill.style.width   = pct+"%";
  if(xpsub) xpsub.textContent   = toNext>0?`${state.xp} XP · ${toNext} to next level`:`MAX LEVEL 🔮`;
}

function showLevelUpToast(ld) {
  const toast = document.getElementById("levelup-toast");
  document.getElementById("levelup-title").textContent = `Level ${ld.level}!`;
  document.getElementById("levelup-sub").textContent   = `You are now a ${ld.title} ${ld.icon}`;
  toast.classList.add("show");
  playSound('advancement');
  setTimeout(()=>toast.classList.remove("show"),3500);
}

// ── Badge system ───────────────────────────────
function checkBadges() {
  const badges = state.badges || [];
  const streak = calcStreak();
  const allDone = CATS.every(c=>catDone(c.id)>0&&state.goals[c.id].length>0);
  const pct     = totalGoals()>0?Math.round((doneTodayCount()/totalGoals())*100):0;
  const total   = getAllTimeCompleted();

  const checks = [
    {id:"first_goal",  cond: doneTodayCount()>=1},
    {id:"streak3",     cond: streak>=3},
    {id:"streak7",     cond: streak>=7},
    {id:"streak30",    cond: streak>=30},
    {id:"all_cats",    cond: allDone},
    {id:"perfect_day", cond: pct===100&&totalGoals()>0},
    {id:"century",     cond: total>=100},
  ];

  checks.forEach(({id,cond})=>{
    if(cond&&!badges.includes(id)){
      badges.push(id);
      const b=BADGES.find(x=>x.id===id);
      if(b) showBadgeToast(b);
    }
  });
  state.badges=badges;
  renderBadges();
}

function showBadgeToast(b) {
  const toast = document.getElementById("levelup-toast");
  document.getElementById("levelup-title").textContent = b.label+" Unlocked!";
  document.getElementById("levelup-sub").textContent   = b.icon+" "+b.desc;
  toast.classList.add("show");
  playSound('advancement');
  setTimeout(()=>toast.classList.remove("show"),3500);
}

function renderBadges() {
  const row = document.getElementById("badges-row");
  if(!row) return;
  row.innerHTML = BADGES.map(b=>{
    const earned = (state.badges||[]).includes(b.id);
    return `<div class="badge-chip ${earned?"earned":"locked"}">${b.icon} ${b.label}</div>`;
  }).join("");
}

// ── Mood tracking ──────────────────────────────
function setMood(mood) {
  state.moodLog = state.moodLog||{};
  state.moodLog[todayKey] = mood;
  document.querySelectorAll(".mood-btn").forEach(b=>{
    b.classList.toggle("selected", b.dataset.mood===mood);
  });
  document.getElementById("mood-set-label").textContent = MOOD_LABELS[mood]||"";
  saveData();
  renderMoodHistory();
}

function loadMoodUI() {
  const todayMood = (state.moodLog||{})[todayKey];
  if(todayMood){
    document.querySelectorAll(".mood-btn").forEach(b=>{
      b.classList.toggle("selected", b.dataset.mood===todayMood);
    });
    document.getElementById("mood-set-label").textContent = MOOD_LABELS[todayMood]||"";
  }
}

function renderMoodHistory() {
  const row = document.getElementById("mood-history-row");
  if(!row) return;
  const items = [];
  for(let i=6;i>=0;i--){
    const d=new Date(today);
    d.setDate(d.getDate()-i);
    const k=`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const mood=(state.moodLog||{})[k]||"";
    items.push({day:DAY_NAMES[d.getDay()],mood,emoji:MOOD_EMOJI[mood]||"·"});
  }
  row.innerHTML = items.map(it=>`
    <div class="mood-history-item">
      <div class="mood-history-emoji">${it.emoji}</div>
      <div class="mood-history-day">${it.day}</div>
    </div>
  `).join("");
}

// ── Monthly completion % ───────────────────────
function calcMonthlyCompletion(y,m) {
  const total=totalGoals();
  if(total===0) return 0;
  const daysInMonth=new Date(y,m+1,0).getDate();
  const today2=new Date();
  // Only count days up to today for current month
  const isCurrentMonth=y===today2.getFullYear()&&m===today2.getMonth();
  const daysToCount=isCurrentMonth?today2.getDate():daysInMonth;
  let totalPossible=daysToCount*total;
  let totalDone=0;
  for(let d=1;d<=daysToCount;d++){
    const k=`${y}-${m}-${d}`;
    if(y===today2.getFullYear()&&m===today2.getMonth()&&d===today2.getDate()){
      totalDone+=doneTodayCount();
    } else {
      const data=state.monthData[k];
      if(data) totalDone+=Math.min(total,Object.values(data).reduce((a,b)=>a+b,0));
    }
  }
  return totalPossible>0?Math.round((totalDone/totalPossible)*100):0;
}

// ── Monthly Line Graph ─────────────────────────
function renderMonthlyLineGraph() {
  const canvas=document.getElementById("monthly-line-chart");
  const footer=document.getElementById("monthly-line-footer");
  const badge=document.getElementById("graph-month-badge");
  if(!canvas) return;

  const y=today.getFullYear(), m=today.getMonth();
  const daysInMonth=new Date(y,m+1,0).getDate();
  const daysToShow=today.getDate();
  const total=totalGoals();

  if(badge) badge.textContent=MONTHS[m]+" "+y;

  // Build data points
  const pts=[];
  for(let d=1;d<=daysToShow;d++){
    const pct=getDayPct(y,m,d);
    pts.push({d,pct});
  }

  // Render footer — Days In = current day, Days Total = actual days in month
  if(footer){
    const avgPct=pts.length>0?Math.round(pts.reduce((s,p)=>s+p.pct,0)/pts.length):0;
    const monthPct=calcMonthlyCompletion(y,m);
    footer.innerHTML=`
      <div class="monthly-stat"><span class="monthly-stat-val" style="color:#A78BFA">${monthPct}%</span><span class="monthly-stat-lbl">Overall</span></div>
      <div class="monthly-stat"><span class="monthly-stat-val" style="color:#2DD4BF">${avgPct}%</span><span class="monthly-stat-lbl">Avg/Day</span></div>
      <div class="monthly-stat"><span class="monthly-stat-val" style="color:#FBBF24">${daysToShow}</span><span class="monthly-stat-lbl">Day ${daysToShow}</span></div>
      <div class="monthly-stat"><span class="monthly-stat-val" style="color:#34D399">${daysInMonth}</span><span class="monthly-stat-lbl">in ${MONTHS[m]}</span></div>
    `;
  }

  // DPR-aware canvas setup for crisp rendering on retina/mobile screens
  const dpr=window.devicePixelRatio||1;
  const cssW=canvas.parentElement.clientWidth||300;
  const cssH=160;
  canvas.style.width=cssW+"px";
  canvas.style.height=cssH+"px";
  canvas.width=Math.round(cssW*dpr);
  canvas.height=Math.round(cssH*dpr);
  const ctx=canvas.getContext("2d");
  ctx.scale(dpr,dpr);
  const W=cssW, H=cssH;
  ctx.clearRect(0,0,W,H);

  if(pts.length<2){
    ctx.fillStyle="rgba(255,255,255,0.18)";
    ctx.font="600 13px 'DM Sans', sans-serif";
    ctx.textAlign="center";
    ctx.fillText("Check off goals to see your trend",W/2,H/2);
    return;
  }

  const PAD={top:18,right:16,bottom:28,left:34};
  const gW=W-PAD.left-PAD.right;
  const gH=H-PAD.top-PAD.bottom;

  const getX=d=>PAD.left+((d-1)/(daysToShow-1||1))*gW;
  const getY=pct=>PAD.top+gH-(pct/100)*gH;

  // Grid lines
  [0,25,50,75,100].forEach(v=>{
    const yy=getY(v);
    ctx.beginPath();
    ctx.strokeStyle=v===0?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.05)";
    ctx.lineWidth=1;
    if(v>0) ctx.setLineDash([2,5]);
    ctx.moveTo(PAD.left,yy);
    ctx.lineTo(W-PAD.right,yy);
    ctx.stroke();
    ctx.setLineDash([]);
    if(v>0){
      ctx.fillStyle="rgba(255,255,255,0.22)";
      ctx.font=`600 9px 'DM Mono',monospace`;
      ctx.textAlign="right";
      ctx.fillText(v+"%",PAD.left-5,yy+3.5);
    }
  });

  // Vertical grid every 5 days
  for(let d=5;d<=daysToShow;d+=5){
    ctx.beginPath();
    ctx.strokeStyle="rgba(255,255,255,0.04)";
    ctx.lineWidth=1;
    ctx.moveTo(getX(d),PAD.top);
    ctx.lineTo(getX(d),PAD.top+gH);
    ctx.stroke();
  }

  // Smooth bezier path helper
  function buildPath(points){
    ctx.beginPath();
    ctx.moveTo(getX(points[0].d),getY(points[0].pct));
    for(let i=1;i<points.length;i++){
      const p0=points[i-1],p1=points[i];
      const tension=0.35;
      const cpx0=getX(p0.d)+(getX(p1.d)-getX(p0.d))*tension;
      const cpx1=getX(p1.d)-(getX(p1.d)-getX(p0.d))*tension;
      ctx.bezierCurveTo(cpx0,getY(p0.pct),cpx1,getY(p1.pct),getX(p1.d),getY(p1.pct));
    }
  }

  // Gradient area fill
  const areaGrad=ctx.createLinearGradient(0,PAD.top,0,PAD.top+gH);
  areaGrad.addColorStop(0,"rgba(167,139,250,0.28)");
  areaGrad.addColorStop(0.6,"rgba(167,139,250,0.08)");
  areaGrad.addColorStop(1,"rgba(167,139,250,0)");
  buildPath(pts);
  ctx.lineTo(getX(pts[pts.length-1].d),PAD.top+gH);
  ctx.lineTo(getX(pts[0].d),PAD.top+gH);
  ctx.closePath();
  ctx.fillStyle=areaGrad;
  ctx.fill();

  // Main line — gradient stroke
  const lineGrad=ctx.createLinearGradient(PAD.left,0,W-PAD.right,0);
  lineGrad.addColorStop(0,"#E879F9");
  lineGrad.addColorStop(0.45,"#A78BFA");
  lineGrad.addColorStop(1,"#2DD4BF");
  buildPath(pts);
  ctx.strokeStyle=lineGrad;
  ctx.lineWidth=2.5;
  ctx.lineJoin="round";
  ctx.lineCap="round";
  ctx.stroke();

  // Small dots at each data point (non-zero only) — skip clutter when many days
  const skipDots=daysToShow>15;
  pts.forEach((p,i)=>{
    const isLast=i===pts.length-1;
    const cx=getX(p.d),cy=getY(p.pct);
    if(!isLast&&(skipDots||p.pct===0)) return;
    ctx.beginPath();
    ctx.arc(cx,cy,isLast?5.5:2.5,0,Math.PI*2);
    ctx.fillStyle=isLast?"#E879F9":lineGrad;
    if(isLast){
      ctx.shadowColor="#E879F9";
      ctx.shadowBlur=14;
    }
    ctx.fill();
    ctx.shadowBlur=0;

    if(isLast){
      // White outer ring
      ctx.beginPath();
      ctx.arc(cx,cy,8,0,Math.PI*2);
      ctx.strokeStyle="rgba(232,121,249,0.3)";
      ctx.lineWidth=1.5;
      ctx.stroke();

      // Label
      const labelY=cy<PAD.top+22?cy+20:cy-14;
      ctx.fillStyle="#fff";
      ctx.font=`800 11px 'DM Mono',monospace`;
      ctx.textAlign="center";
      ctx.shadowColor="rgba(0,0,0,0.8)";
      ctx.shadowBlur=6;
      ctx.fillText(p.pct+"%",cx,labelY);
      ctx.shadowBlur=0;
    }
  });

  // X-axis day labels
  ctx.fillStyle="rgba(255,255,255,0.28)";
  ctx.font=`600 9px 'DM Mono',monospace`;
  ctx.textAlign="center";
  const step=daysToShow<=10?1:daysToShow<=20?5:5;
  for(let d=1;d<=daysToShow;d+=step){
    ctx.fillText(d,getX(d),H-6);
  }
  if(daysToShow%step!==0) ctx.fillText(daysToShow,getX(daysToShow),H-6);
}


function getDayPct(y,m,d){
  const total=totalGoals();
  if(total===0) return 0;
  const k=`${y}-${m}-${d}`;
  // For today use live done count
  const isToday=d===today.getDate()&&m===today.getMonth()&&y===today.getFullYear();
  if(isToday) return Math.round((doneTodayCount()/total)*100);
  const data=state.monthData[k];
  if(!data) return 0;
  const score=Object.values(data).reduce((a,b)=>a+b,0);
  return Math.min(100,Math.round((score/total)*100));
}

function renderProgressGraph() {
  const wrap = document.getElementById("progress-graph");
  const days = document.getElementById("graph-days");
  if(!wrap||!days) return;

  const data=[];
  for(let i=6;i>=0;i--){
    const d=new Date(today);
    d.setDate(d.getDate()-i);
    const pct=getDayPct(d.getFullYear(),d.getMonth(),d.getDate());
    data.push({day:DAY_NAMES[d.getDay()],pct,isToday:i===0});
  }

  wrap.innerHTML=data.map((item)=>{
    const h=Math.max(4,item.pct);
    const isToday=item.isToday;
    const color=isToday
      ?`linear-gradient(180deg,#E879F9,#A78BFA)`
      :item.pct>0?"rgba(167,139,250,0.45)":"rgba(255,255,255,0.07)";
    const shadow=isToday?"0 0 10px rgba(167,139,250,0.6)":item.pct>0?"0 0 4px rgba(167,139,250,0.2)":"none";
    return `<div class="graph-bar-wrap">
      <div class="graph-bar-pct" style="color:${isToday?"#E879F9":"rgba(255,255,255,0.3)"};font-size:9px;text-align:center;margin-bottom:3px;font-family:'DM Mono',monospace;font-weight:700">${item.pct>0?item.pct+"%":""}</div>
      <div class="graph-bar" style="height:${h}%;background:${color};box-shadow:${shadow}"></div>
    </div>`;
  }).join("");

  days.innerHTML=data.map(item=>`<div class="graph-day-lbl" style="${item.isToday?"color:#A78BFA;font-weight:800":""}">${item.day}</div>`).join("");
}

// ── Insights (most consistent / weakest) ──────
function renderInsights() {
  const sorted=[...CATS].sort((a,b)=>getCatMonthCount(b.id)-getCatMonthCount(a.id));
  const best=sorted[0],worst=sorted[sorted.length-1];
  const mc=document.getElementById("most-consistent");
  const wa=document.getElementById("weakest-area");
  if(mc) mc.innerHTML=`<span style="color:${best.color}">${best.emoji} ${best.label}</span>`;
  if(wa) wa.innerHTML=`<span style="color:${worst.color}">${worst.emoji} ${worst.label}</span>`;
}

// ── Render Home ────────────────────────────────
function renderHome() {
  const total=totalGoals(), done=doneTodayCount();
  const pct=total>0?Math.round((done/total)*100):0;
  const circ=2*Math.PI*56;

  document.getElementById("ring-progress").setAttribute("stroke-dasharray",`${(pct/100)*circ} ${circ}`);
  document.getElementById("ring-progress").setAttribute("stroke",pct===100?"#34D399":"url(#rg)");
  document.getElementById("ring-progress").classList.toggle("complete", pct===100);
  document.getElementById("ring-pct").textContent=`${pct}%`;
  document.getElementById("ring-sub").textContent=
    done===0?"Start checking off your goals!":
    done===total&&total>0?"🎉 All done! Incredible!":
    "Keep going, almost there!";

  const streak=calcStreak();
  document.getElementById("streak-num").textContent=streak;
  const statsStreak=document.getElementById("stats-streak");
  if(statsStreak) statsStreak.textContent=streak;

  // Pills
  const pills=document.getElementById("cat-pills");
  pills.innerHTML=CATS.map(c=>{
    const d=catDone(c.id),total=state.goals[c.id].length;
    const donePct=total>0?Math.round((d/total)*100):0;
    return `<div class="cat-pill" style="background:${c.bg};color:${c.color};border-color:${c.color}30">
      <span>${c.emoji}</span><span>${d}/${total}</span>
    </div>`;
  }).join("");

  // Category cards
  const list=document.getElementById("cats-list");
  list.innerHTML=CATS.map(cat=>{
    const catGoals=state.goals[cat.id];
    const d=catDone(cat.id);
    const cp=catGoals.length>0?Math.round((d/catGoals.length)*100):0;
    const isExp=state.expanded===cat.id;
    const doneBadge=d>0&&d===catGoals.length?`<span class="cat-done-badge" style="background:${cat.color};color:#000">✓ Done</span>`:"";

    const goalsHTML=catGoals.length===0
      ?`<div class="goal-empty">No goals yet — tap + to add</div>`
      :catGoals.map((g,i)=>{
        const gk=`${cat.id}-${g.id}`;
        const isDone=!!state.done[gk];
        return `<div class="goal-row fade-up" data-cat="${cat.id}" data-gid="${g.id}" onclick="toggleGoal('${cat.id}','${g.id}')" style="background:${isDone?cat.color+"20":"rgba(255,255,255,0.04)"};border-color:${isDone?cat.color+"60":"rgba(255,255,255,0.07)"};animation-delay:${i*0.05}s">
          <div class="checkbox" style="border-color:${isDone?cat.color:"rgba(255,255,255,0.2)"};background:${isDone?cat.color:"transparent"}">${isDone?'<span class="check-icon">✓</span>':""}</div>
          <span class="goal-text" style="color:${isDone?"rgba(255,255,255,0.4)":"rgba(255,255,255,0.88)"};text-decoration:${isDone?"line-through":"none"}">${g.text}</span>
          <button class="del-btn" onclick="event.stopPropagation();deleteGoal('${cat.id}','${g.id}')">✕</button>
        </div>`;
      }).join("");

    const allDone = catGoals.length > 0 && d === catGoals.length;
    return `<div class="cat-card${allDone?' all-done':''}" style="--cat-glow:${cat.color}66;background:${cat.bg};border:1px solid ${cat.color}28;box-shadow:${isExp?`0 0 28px ${cat.color}35`:"none"}">
      <div class="cat-header" onclick="toggleExpand('${cat.id}')">
        <span class="cat-emoji">${cat.emoji}</span>
        <div class="cat-info">
          <div class="cat-name-row"><span class="cat-name" style="color:${cat.color}">${cat.label}</span>${doneBadge}</div>
          ${catGoals.length>0?`<div class="cat-bar-wrap"><div class="cat-bar" style="width:${cp}%;background:linear-gradient(90deg,${cat.color}aa,${cat.color})"></div></div>`:""}
        </div>
        <span class="cat-count" style="color:${cat.color}">${catGoals.length>0?`${d}/${catGoals.length}`:""}</span>
        <button class="add-btn" style="background:${cat.color}25;border:1.5px solid ${cat.color}55;color:${cat.color}" onclick="event.stopPropagation();openModal('${cat.id}')">+</button>
      </div>
      ${isExp?`<div class="goals-list">${goalsHTML}</div>`:""}
    </div>`;
  }).join("");

  // Stats panel updates
  const stg=document.getElementById("stats-total-goals");
  const stp=document.getElementById("stats-today-pct");
  if(stg) stg.textContent=total;
  // Middle card now shows monthly %
  if(stp){
    const monthPct=calcMonthlyCompletion(today.getFullYear(),today.getMonth());
    stp.textContent=`${monthPct}%`;
  }

  renderXP();
  renderCatStats();
  renderInsights();
  renderProgressGraph();
  renderMonthlyLineGraph();
  renderMoodHistory();
  renderBadges();
  loadMoodUI();
}

function renderCatStats() {
  const cards=document.getElementById("cat-stat-cards");
  if(!cards) return;
  const y=today.getFullYear(), m=today.getMonth();
  const daysInMonth=new Date(y,m+1,0).getDate();
  const daysElapsed=today.getDate();

  cards.innerHTML=`<div class="cat-stat-section-label">Category Breakdown</div>`+CATS.map(cat=>{
    const catGoals=state.goals[cat.id];
    const mc=getCatMonthCount(cat.id);
    const maxPossible=catGoals.length*daysElapsed;
    const monthRate=maxPossible>0?Math.round((mc/maxPossible)*100):0;
    const allTime=Object.values(state.monthData).reduce((s,d)=>s+(d[cat.id]||0),0);
    const streak=calcCatStreak(cat.id);

    return `<div class="cat-stat-card" style="background:${cat.bg};border-color:${cat.color}28">
      <div class="cat-stat-header">
        <span class="cat-stat-emoji">${cat.emoji}</span>
        <div style="flex:1">
          <div class="cat-stat-name" style="color:${cat.color}">${cat.label}</div>
          <div class="cat-stat-sub">${catGoals.length} goal${catGoals.length!==1?"s":""} · ${mc} completions this month</div>
        </div>
        <div class="cat-stat-rate-badge" style="background:${cat.color}20;border:1px solid ${cat.color}40;color:${cat.color}">${monthRate}%</div>
      </div>
      <div class="cat-stat-bar-track"><div class="cat-stat-bar-fill" style="width:${monthRate}%;background:linear-gradient(90deg,${cat.color}70,${cat.color})"></div></div>
      <div class="cat-stat-2col">
        <div class="cat-stat-cell"><div class="cat-stat-val" style="color:${cat.color}">${allTime}</div><div class="cat-stat-lbl">All-Time</div></div>
        <div class="cat-stat-cell"><div class="cat-stat-val" style="color:${cat.color}">${streak}🔥</div><div class="cat-stat-lbl">Streak</div></div>
      </div>
    </div>`;
  }).join("");
}

function calcCatStreak(catId) {
  let streak=0, d=new Date(today);
  for(let i=0;i<90;i++){
    const k=`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if(state.monthData[k]&&(state.monthData[k][catId]||0)>0){streak++;d.setDate(d.getDate()-1);}
    else break;
  }
  return streak;
}

function toggleTaskCat(catId) {
  const panel = document.getElementById(`cat-expand-${catId}`);
  const card  = panel ? panel.closest('.task-month-cat-card') : null;
  const chevron = card ? card.querySelector('.task-month-chevron') : null;
  if (!panel) return;

  const isOpen = panel.classList.contains('expanded');

  // Subtle card press
  if (card) {
    card.style.transition = "transform 0.18s cubic-bezier(0.34,1.56,0.64,1)";
    card.style.transform  = "scale(0.983)";
    setTimeout(() => { card.style.transform = "scale(1)"; }, 180);
  }

  if (isOpen) {
    // ── Collapse ─────────────────────────────
    panel.classList.remove('expanded');
    if (chevron) chevron.style.transform = "rotate(0deg)";

    // Fade rows out instantly, then collapse height
    panel.querySelectorAll(".task-goal-row").forEach(row => {
      row.style.transition = "opacity 0.15s ease";
      row.style.opacity    = "0";
    });

    // Lock current height, then animate to 0
    panel.style.height  = panel.offsetHeight + "px";
    panel.style.opacity = "1";
    // Force a reflow so the browser registers the locked height
    panel.offsetHeight; // eslint-disable-line no-unused-expressions
    panel.style.transition = "height 0.38s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease, padding 0.38s cubic-bezier(0.4,0,0.2,1)";
    panel.style.height  = "0";
    panel.style.opacity = "0";
    panel.style.paddingTop    = "0";
    panel.style.paddingBottom = "0";

    const onCollapseDone = () => {
      panel.style.display = "none";
      // Reset inline styles so CSS takes over on next open
      panel.style.cssText = "display:none";
    };
    panel.addEventListener("transitionend", onCollapseDone, { once: true });

  } else {
    // ── Expand ───────────────────────────────
    // Pre-position goal rows so they're invisible but laid out
    panel.querySelectorAll(".task-goal-row").forEach(row => {
      row.style.transition = "none";
      row.style.opacity    = "0";
      row.style.transform  = "translateY(8px)";
    });

    // Make visible off-screen-height to measure
    panel.style.cssText = "display:flex;flex-direction:column;gap:10px;height:0;opacity:0;padding:0 16px;overflow:hidden;border-top:1px solid rgba(255,255,255,0.06);box-sizing:border-box;will-change:height,opacity";
    // Force reflow to get accurate scrollHeight
    const fullH = panel.scrollHeight + 26; // +26 for top+bottom padding we'll add

    requestAnimationFrame(() => {
      panel.style.transition    = "height 0.42s cubic-bezier(0.4,0,0.2,1), opacity 0.32s ease, padding 0.42s cubic-bezier(0.4,0,0.2,1)";
      panel.style.height        = fullH + "px";
      panel.style.opacity       = "1";
      panel.style.paddingTop    = "12px";
      panel.style.paddingBottom = "14px";

      if (chevron) chevron.style.transform = "rotate(180deg)";

      // Stagger goal rows after container starts opening
      panel.querySelectorAll(".task-goal-row").forEach((row, i) => {
        setTimeout(() => {
          row.style.transition = "opacity 0.26s ease, transform 0.3s cubic-bezier(0.34,1.4,0.64,1)";
          row.style.opacity    = "1";
          row.style.transform  = "translateY(0)";
        }, 100 + i * 55);
      });

      panel.addEventListener("transitionend", () => {
        panel.style.height = "auto"; // allow content to grow freely
        panel.classList.add("expanded");
      }, { once: true });
    });
  }
}

// ── Calendar ───────────────────────────────────
function renderCalendar() {
  const y=state.calYear, m=state.calMonth;
  document.getElementById("month-name").textContent=`${MONTHS[m]} ${y}`;
  const days=new Date(y,m+1,0).getDate();
  const first=new Date(y,m,1).getDay();
  const grid=document.getElementById("cal-grid");
  const maxScore=Math.max(1,...Array.from({length:days},(_,i)=>getDayScore(y,m,i+1)));

  let html="";
  for(let i=0;i<first;i++) html+=`<div></div>`;
  for(let d=1;d<=days;d++){
    const score=getDayScore(y,m,d);
    const isToday=d===today.getDate()&&m===today.getMonth()&&y===today.getFullYear();
    const isPast=new Date(y,m,d)<today;

    // More vivid intensity steps
    let intensity=0;
    if(score>0){
      const ratio=score/maxScore;
      intensity=ratio<=0.2?0.2:ratio<=0.4?0.4:ratio<=0.65?0.65:ratio<=0.85?0.85:1;
    }

    const bg=score>0
      ?`rgba(167,139,250,${intensity*0.75})`
      :isToday?"rgba(167,139,250,0.1)":"rgba(255,255,255,0.03)";
    const border=isToday?"1.5px solid #A78BFA":"1px solid rgba(255,255,255,0.05)";
    const shadow=score>0?`box-shadow:0 0 ${10*intensity}px rgba(167,139,250,${intensity*0.5})`:"";
    const numColor=isToday?"#A78BFA":score>0?"#fff":isPast?"rgba(255,255,255,0.22)":"rgba(255,255,255,0.75)";

    html+=`<div class="cal-day${isToday?' today':''}${score>0?' has-score':''}" style="background:${bg};border:${border};${shadow};animation-delay:${(d*0.018).toFixed(2)}s" onclick="showDayGoals(${y},${m},${d})">
      <span class="cal-day-num" style="color:${numColor}">${d}</span>
      ${score>0?`<span class="cal-score">+${score}</span>`:""}
    </div>`;
  }
  grid.innerHTML=html;

  // Monthly completion %
  const pct=calcMonthlyCompletion(y,m);
  const pctEl=document.getElementById("month-pct-num");
  const fillEl=document.getElementById("month-pct-fill");
  if(pctEl) pctEl.textContent=`${pct}%`;
  if(fillEl) fillEl.style.width=`${pct}%`;

  // Per-task monthly completion % cards
  const daysInMonth2=new Date(y,m+1,0).getDate();
  const today2=new Date();
  const isCurrentMonth2=y===today2.getFullYear()&&m===today2.getMonth();
  const daysElapsed=isCurrentMonth2?today2.getDate():daysInMonth2;

  const taskStats=document.getElementById("task-month-stats");
  if(taskStats){
    const hasAnyGoals=CATS.some(c=>state.goals[c.id].length>0);
    if(!hasAnyGoals){
      taskStats.innerHTML=`<div style="text-align:center;padding:20px;color:rgba(255,255,255,0.2);font-size:13px">No goals yet — add some to track monthly progress</div>`;
    } else {
      taskStats.innerHTML=`<div class="task-month-header">Goal Completion This Month</div>`+
        CATS.map(cat=>{
          const catGoals=state.goals[cat.id];
          if(catGoals.length===0) return "";
          // Category-level monthly %
          const mc=getCatMonthCount(cat.id);
          const maxPossible=catGoals.length*daysElapsed;
          const catPct=maxPossible>0?Math.round((mc/maxPossible)*100):0;
          const expandId=`cat-expand-${cat.id}`;

          const goalRows=catGoals.map(g=>{
            let doneCount=0;
            for(let dd=1;dd<=daysElapsed;dd++){
              const k2=`${y}-${m}-${dd}`;
              const isToday2=dd===today2.getDate()&&isCurrentMonth2;
              if(isToday2){
                if(state.done[`${cat.id}-${g.id}`]) doneCount++;
              } else {
                const dd_data=state.monthData[k2];
                if(dd_data&&dd_data[cat.id]>0){
                  const catTotal=catGoals.length;
                  if(catTotal>0) doneCount+=dd_data[cat.id]/catTotal;
                }
              }
            }
            const gDone=Math.round(doneCount);
            const gPct=daysElapsed>0?Math.round((doneCount/daysElapsed)*100):0;
            return `<div class="task-goal-row">
              <div class="task-goal-left">
                <div class="task-goal-dot" style="background:${cat.color}"></div>
                <span class="task-goal-text">${g.text}</span>
              </div>
              <div class="task-goal-right">
                <span class="task-goal-frac" style="color:rgba(255,255,255,0.35)">${gDone}/${daysElapsed}d</span>
                <span class="task-goal-pct" style="color:${cat.color}">${gPct}%</span>
              </div>
              <div class="task-goal-bar-track"><div class="task-goal-bar-fill" style="width:${gPct}%;background:${cat.color}80"></div></div>
            </div>`;
          }).join("");

          return `<div class="task-month-cat-card" style="border-color:${cat.color}22;background:${cat.bg}">
            <div class="task-month-cat-header" onclick="toggleTaskCat('${cat.id}')">
              <span class="task-month-emoji">${cat.emoji}</span>
              <div style="flex:1">
                <div class="task-month-cat-name" style="color:${cat.color}">${cat.label}</div>
                <div class="task-month-cat-sub">${catGoals.length} goal${catGoals.length!==1?"s":""}</div>
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <span class="task-month-pct" style="color:${cat.color}">${catPct}%</span>
                <span class="task-month-chevron" style="color:rgba(255,255,255,0.3);font-size:13px;transition:transform 0.35s cubic-bezier(0.4,0,0.2,1);display:inline-block">›</span>
              </div>
            </div>
            <div class="task-month-bar-track" style="margin:0 0 0 0"><div class="task-month-bar-fill" style="width:${catPct}%;background:linear-gradient(90deg,${cat.color}60,${cat.color})"></div></div>
            <div class="task-cat-goals" id="${expandId}" style="display:none">${goalRows}</div>
          </div>`;
        }).join("");
    }
  }

  const maxCount=Math.max(...CATS.map(c=>getCatMonthCount(c.id)),1);
  document.getElementById("cat-bars").innerHTML=CATS.map(cat=>{
    const cnt=getCatMonthCount(cat.id);
    return `<div class="cat-bar-card" style="background:${cat.bg};border:1px solid ${cat.color}22">
      <div class="cat-bar-row"><span class="cat-bar-name">${cat.emoji} ${cat.label}</span><span class="cat-bar-count" style="color:${cat.color}">${cnt}</span></div>
      <div class="bar-track"><div class="bar-fill" style="width:${(cnt/maxCount)*100}%;background:linear-gradient(90deg,${cat.color}88,${cat.color})"></div></div>
    </div>`;
  }).join("");
}

// ── Day Goals Modal (tap calendar day) ─────────
function showDayGoals(y,m,d) {
  playSound('uiSwipe');
  const dateKey=`${y}-${m}-${d}`;
  const dayData=state.monthData[dateKey]||{};
  const dateStr=new Date(y,m,d).toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});

  document.getElementById("day-modal-date").textContent=dateStr;

  const goalItems=[];
  CATS.forEach(cat=>{
    state.goals[cat.id].forEach(g=>{
      const gk=`${cat.id}-${g.id}`;
      // For historical days, approximate from monthData; for today use done state
      const isToday=d===today.getDate()&&m===today.getMonth()&&y===today.getFullYear();
      const isDone=isToday?!!state.done[gk]:(dayData[cat.id]>0);
      goalItems.push({cat,text:g.text,isDone});
    });
  });

  if(goalItems.length===0) {
    document.getElementById("day-modal-goals").innerHTML=
      `<div style="text-align:center;color:rgba(255,255,255,0.25);font-size:13px;padding:20px 0">No goals set for this day</div>`;
  } else {
    document.getElementById("day-modal-goals").innerHTML=goalItems.map(item=>`
      <div class="day-goal-item" style="background:${item.cat.bg};border-color:${item.cat.color}30">
        <div class="day-goal-dot" style="background:${item.isDone?item.cat.color:"rgba(255,255,255,0.15)"}"></div>
        <span class="day-goal-text ${item.isDone?"day-goal-done":""}">${item.text}</span>
        <span style="color:${item.cat.color};font-size:11px;font-weight:700">${item.cat.emoji}</span>
      </div>
    `).join("");
  }

  const modal=document.getElementById("day-modal");
  modal.classList.add("open");
  setTimeout(()=>{
    document.querySelectorAll(".day-goal-item").forEach((el,i)=>{
      el.style.animationDelay=(i*0.07)+"s";
    });
  },50);
}

function closeDayModal() {
  const modal=document.getElementById("day-modal");
  modal.classList.remove("open");
}

document.getElementById("day-modal").addEventListener("click",e=>{
  if(e.target===document.getElementById("day-modal")) closeDayModal();
});

// ── Quick-Add FAB ──────────────────────────────
function openFabMenu() {
  state.fabOpen=!state.fabOpen;
  const fab=document.getElementById("fab");
  const menu=document.getElementById("fab-menu");
  fab.classList.toggle("open",state.fabOpen);
  menu.classList.toggle("open",state.fabOpen);
  if(state.fabOpen){ playSound('uiPop'); buildFabMenu(); }
}

function buildFabMenu() {
  const inner=document.getElementById("fab-menu-inner");
  inner.innerHTML=CATS.map((cat,i)=>`
    <div class="fab-item" style="animation-delay:${i*0.05}s" onclick="fabSelectCat('${cat.id}')">
      <div class="fab-item-label" style="color:${cat.color}">${cat.label}</div>
      <div class="fab-item-dot" style="background:${cat.bg};border-color:${cat.color}55;color:${cat.color}">${cat.emoji}</div>
    </div>
  `).join("");
}

function fabSelectCat(catId) {
  state.fabOpen=false;
  document.getElementById("fab").classList.remove("open");
  document.getElementById("fab-menu").classList.remove("open");
  openModal(catId);
}

// Close FAB on outside tap
document.addEventListener("click",e=>{
  if(state.fabOpen&&!e.target.closest(".fab")&&!e.target.closest(".fab-menu")){
    state.fabOpen=false;
    document.getElementById("fab").classList.remove("open");
    document.getElementById("fab-menu").classList.remove("open");
  }
});

// ── Modal ──────────────────────────────────────
function openModal(catId) {
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

function closeModal() {
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
  playSound('click');
  closeModal();
  renderAll();
  saveData();
});

document.getElementById("modal-input").addEventListener("keydown",e=>{
  if(e.key==="Enter") document.getElementById("modal-add-btn").click();
});

// ── Goal interactions ──────────────────────────
function toggleGoal(catId,goalId) {
  const k=`${catId}-${goalId}`;
  const wasChecked=!!state.done[k];
  state.done[k]=!wasChecked;
  if(state.done[k]){
    const row=document.querySelector(`[data-cat="${catId}"][data-gid="${goalId}"]`);
    if(row){row.classList.add('just-checked');setTimeout(()=>row.classList.remove('just-checked'),450);}
    playSound('check');
  }

  const dayData=state.monthData[todayKey]||{};
  dayData[catId]=Math.max(0,(dayData[catId]||0)+(state.done[k]?1:-1));
  state.monthData[todayKey]=dayData;

  // XP gain
  if(state.done[k]) addXP(10);

  // Finish sound when all goals complete
  const total=totalGoals(), done=doneTodayCount();
  if(state.done[k] && total>0 && done===total) playSound('finish');

  checkBadges();
  renderAll();
  saveData();
}

function deleteGoal(catId,goalId) {
  const k=`${catId}-${goalId}`;
  if(state.done[k]){
    const dayData=state.monthData[todayKey];
    if(dayData&&dayData[catId]) dayData[catId]=Math.max(0,dayData[catId]-1);
  }
  state.goals[catId]=state.goals[catId].filter(g=>g.id!=goalId);
  delete state.done[k];
  renderAll();
  saveData();
}

function toggleExpand(catId) {
  state.expanded=state.expanded===catId?null:catId;
  renderHome();
  saveData();
}

// ── Navigation ─────────────────────────────────
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
    if(v==="stats"){ renderCatStats();renderProgressGraph();renderMonthlyLineGraph();renderMoodHistory();renderBadges();renderInsights();renderXP(); }
  });
});

document.getElementById("prev-month").addEventListener("click",()=>{
  if(state.calMonth===0){state.calMonth=11;state.calYear--;}else state.calMonth--;
  renderCalendar();
});
document.getElementById("next-month").addEventListener("click",()=>{
  if(state.calMonth===11){state.calMonth=0;state.calYear++;}else state.calMonth++;
  renderCalendar();
});

// ── Particle Background ────────────────────────
(function initParticles() {
  const canvas=document.getElementById("particle-canvas");
  const ctx=canvas.getContext("2d");
  let W,H,particles=[];

  function resize(){
    W=canvas.width=window.innerWidth;
    H=canvas.height=window.innerHeight;
  }
  resize();
  window.addEventListener("resize",resize);

  const COLORS=["rgba(167,139,250,","rgba(232,121,249,","rgba(45,212,191,","rgba(255,107,53,"];

  function mkParticle(){
    return {
      x:Math.random()*W,
      y:Math.random()*H,
      r:Math.random()*1.8+0.4,
      dx:(Math.random()-0.5)*0.22,
      dy:(Math.random()-0.5)*0.22,
      alpha:Math.random()*0.45+0.05,
      color:COLORS[Math.floor(Math.random()*COLORS.length)],
    };
  }

  for(let i=0;i<55;i++) particles.push(mkParticle());

  function draw(){
    ctx.clearRect(0,0,W,H);
    particles.forEach(p=>{
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=p.color+p.alpha+")";
      ctx.fill();
      p.x+=p.dx; p.y+=p.dy;
      if(p.x<0||p.x>W||p.y<0||p.y>H){Object.assign(p,mkParticle());}
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

// Re-render canvas on resize
window.addEventListener("resize",()=>{
  if(document.getElementById("view-stats").classList.contains("active")){
    renderMonthlyLineGraph();
  }
});

// ── Render all ─────────────────────────────────
function renderAll(){
  renderHome();
  renderCalendar();
}

renderAll();
