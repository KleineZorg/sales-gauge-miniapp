const MIN = 2500;
const MAX = 300000;
const STEP = 21250;
const LEVELS = [
  "Bich (бомжик)","Тестер крео (junior)","Кликосборщик","UTM-адепт",
  "Junior Media Buyer","Middle Media Buyer","Senior Media Buyer","Team Lead",
  "Алхимик трафика","Архитектор воронок","ROI-Slayer","Whale Hunter",
  "Shark","Boss of Offers","Traffic Tsar"
];

const els = {
  fill: document.getElementById('fill'),
  glow: document.getElementById('glow'),
  sumText: document.getElementById('sumText'),
  levelText: document.getElementById('levelText'),
  dealsText: document.getElementById('dealsText'),
  addDeal: document.getElementById('addDeal'),
  historyBtn: document.getElementById('historyBtn'),
  yearBtn: document.getElementById('yearBtn'),
  modal: document.getElementById('modal'),
  input: document.getElementById('dealInput'),
  save: document.getElementById('save'),
  cancel: document.getElementById('cancel'),
};

const tg = window.Telegram?.WebApp; tg && tg.expand();

function monthKey(d=new Date()){ return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0'); }
let state = loadState();
function loadState(){
  const key = monthKey();
  const raw = localStorage.getItem('sg:'+key);
  if(raw) return JSON.parse(raw);
  return { key, monthly_sum: 0, deals_count: 0, history: [] };
}
function saveState(){ localStorage.setItem('sg:'+state.key, JSON.stringify(state)); }
function getLevel(sum){ const lvl = Math.floor((sum - MIN) / STEP) + 1; return Math.max(1, Math.min(15, lvl)); }
function pct(sum){ const clamped = Math.max(0, Math.min(sum, MAX)); return (clamped / MAX) * 100; }
function currentSegmentBottom(sum){ const lvl = getLevel(sum); const segPct = 100/15; return (lvl-1)*segPct; }
function render(){
  els.sumText.textContent = state.monthly_sum.toLocaleString('ru-RU');
  const level = getLevel(state.monthly_sum);
  els.levelText.textContent = level;
  els.dealsText.textContent = state.deals_count;
  const h = pct(state.monthly_sum); els.fill.style.height = h + '%';
  const bottom = currentSegmentBottom(state.monthly_sum); els.glow.style.bottom = bottom + '%'; els.glow.style.opacity = 0.85;
}
function openModal(){ els.modal.classList.remove('hidden'); els.input.focus(); }
function closeModal(){ els.modal.classList.add('hidden'); els.input.value=''; }
function addDeal(amount){
  if(!amount || amount <= 0) return;
  state.monthly_sum += Number(amount);
  state.deals_count += 1;
  state.history.push({ ts: Date.now(), amount: Number(amount) });
  saveState(); render(); milestoneAlert();
  try{ tg?.sendData(JSON.stringify({ type:'deal', amount:Number(amount), monthly_sum: state.monthly_sum })); }catch(e){}
}
function milestoneAlert(){
  const level = getLevel(state.monthly_sum);
  const title = LEVELS[level-1] || 'Level';
  if (tg && tg.MainButton) {
    tg.MainButton.text = `🔓 Уровень ${level}: ${title}`;
    tg.MainButton.show();
    setTimeout(()=>tg.MainButton.hide(), 2200);
  }
}
els.addDeal.addEventListener('click', openModal);
els.cancel.addEventListener('click', closeModal);
els.save.addEventListener('click', ()=>{ const v = Number(els.input.value); closeModal(); addDeal(v); });
render();
setInterval(()=>{ const key = monthKey(); if(key !== state.key){ state = { key, monthly_sum: 0, deals_count: 0, history: [] }; saveState(); render(); } }, 60000);
