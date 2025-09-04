/* -------- constants -------- */
const MIN = 2500;
const MAX = 300000;
const STEP = 21250;
const LEVELS = [
  "Bich (бомжик)","Тестер крео","Кликосборщик","UTM-адепт",
  "Junior Buyer","Middle Buyer","Senior Buyer","Team Lead",
  "Алхимик трафика","Архитектор воронок","ROI-Slayer","Whale Hunter",
  "Shark","Boss of Offers","Traffic Tsar"
];

/* -------- elements -------- */
const $ = (s)=>document.querySelector(s);
const els = {
  fill: $('#fill'), glow: $('#glow'),
  sumText: $('#sumText'), levelText: $('#levelText'), dealsText: $('#dealsText'),
  addDeal: $('#addDeal'), historyBtn: $('#historyBtn'), yearBtn: $('#yearBtn'), undoBtn: $('#undoBtn'),
  modalAdd: $('#modalAdd'), dealInput: $('#dealInput'), saveDeal: $('#saveDeal'),
  modalHistory: $('#modalHistory'), historyList: $('#historyList'),
};
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click', closeAllModals));

/* -------- Telegram helpers -------- */
const tg = window.Telegram?.WebApp; if (tg) tg.expand();
const haptic = (t='medium') => tg?.HapticFeedback?.impactOccurred?.(t);

/* -------- state & storage -------- */
function monthKey(d=new Date()){ return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0'); }
function loadState(){
  const key = monthKey();
  const raw = localStorage.getItem('sg:'+key);
  if (raw) return JSON.parse(raw);
  return { key, monthly_sum: 0, deals_count: 0, history: [] }; // history: [{id, ts, amount}]
}
let state = loadState();
function saveState(){ localStorage.setItem('sg:'+state.key, JSON.stringify(state)); }

/* -------- math -------- */
const clamp = (v,min,max)=>Math.max(min,Math.min(max,v));
function getLevel(sum){ return clamp(Math.floor((sum - MIN)/STEP)+1, 1, 15); }
function pct(sum){ return clamp(sum,0,MAX)/MAX*100; }
function segBottom(sum){ return (getLevel(sum)-1) * (100/15); }

/* -------- render -------- */
function render(){
  els.sumText.textContent = state.monthly_sum.toLocaleString('ru-RU');
  els.levelText.textContent = getLevel(state.monthly_sum);
  els.dealsText.textContent = state.deals_count;
  els.fill.style.height = pct(state.monthly_sum) + '%';
  els.glow.style.bottom = segBottom(state.monthly_sum) + '%';
  els.glow.style.opacity = .9;
}

/* -------- modals -------- */
function openAdd(){ els.modalAdd.classList.remove('hidden'); els.dealInput.focus(); }
function closeAllModals(){ els.modalAdd.classList.add('hidden'); els.modalHistory.classList.add('hidden'); }

/* -------- history modal -------- */
function openHistory(){
  els.historyList.innerHTML = '';
  const items = [...state.history].reverse(); // последние сверху
  if (!items.length){
    els.historyList.innerHTML = '<li><span class="meta">Пока пусто</span></li>';
  } else {
    for (const it of items){
      const li = document.createElement('li');
      li.innerHTML = `
        <div>
          <div class="sum">${Number(it.amount).toLocaleString('ru-RU')} ₽</div>
          <div class="meta">${new Date(it.ts).toLocaleString('ru-RU')}</div>
        </div>
        <div class="actions">
          <button class="ghost" data-edit="${it.id}">✏️ Править</button>
          <button data-delete="${it.id}">🗑 Удалить</button>
        </div>
      `;
      els.historyList.appendChild(li);
    }
  }
  els.modalHistory.classList.remove('hidden');

  // делегирование
  els.historyList.onclick = (e)=>{
    const editId = e.target?.getAttribute?.('data-edit');
    const delId  = e.target?.getAttribute?.('data-delete');
    if (editId) editDeal(Number(editId));
    if (delId)  deleteDeal(Number(delId));
  };
}

/* -------- operations -------- */
function addDeal(amount){
  amount = Number(amount||0);
  if (!amount || amount<=0) return;
  const id = Date.now();
  state.monthly_sum += amount;
  state.deals_count += 1;
  state.history.push({ id, ts: Date.now(), amount });
  saveState(); render();
  flashImpact(); haptic('medium');

  // сообщим боту
  try{ tg?.sendData(JSON.stringify({ type:'deal', id, amount, monthly_sum: state.monthly_sum })); }catch(e){}
}

function undoLast(){
  if (!state.history.length) return;
  const last = state.history[state.history.length-1];
  state.history.pop();
  state.monthly_sum = clamp(state.monthly_sum - Number(last.amount||0), 0, MAX);
  state.deals_count = Math.max(0, state.deals_count-1);
  saveState(); render();
  haptic('light');
  try{ tg?.sendData(JSON.stringify({ type:'undo', id: last.id })); }catch(e){}
}

function editDeal(id){
  const idx = state.history.findIndex(x=>x.id===id);
  if (idx<0) return;
  const cur = Number(state.history[idx].amount||0);
  const next = Number(prompt('Новая сумма для операции:', String(cur)).replace(',','.'));
  if (!next && next!==0) return;
  const delta = next - cur;
  state.history[idx].amount = next;
  state.monthly_sum = clamp(state.monthly_sum + delta, 0, MAX);
  saveState(); render(); openHistory(); // перерисовать список
  haptic('medium');
  try{ tg?.sendData(JSON.stringify({ type:'edit', id, newAmount: next, delta, monthly_sum: state.monthly_sum })); }catch(e){}
}

function deleteDeal(id){
  const idx = state.history.findIndex(x=>x.id===id);
  if (idx<0) return;
  const amt = Number(state.history[idx].amount||0);
  state.history.splice(idx,1);
  state.monthly_sum = clamp(state.monthly_sum - amt, 0, MAX);
  state.deals_count = Math.max(0, state.deals_count-1);
  saveState(); render(); openHistory();
  haptic('light');
  try{ tg?.sendData(JSON.stringify({ type:'delete', id, amount: amt, monthly_sum: state.monthly_sum })); }catch(e){}
}

/* -------- visuals -------- */
function flashImpact(){
  const pad = document.getElementById('impact-pad');
  pad.animate([{filter:'brightness(1)'},{filter:'brightness(2.2)'},{filter:'brightness(1)'}],{duration:420});
  els.glow.animate([{opacity:1},{opacity:.2},{opacity:1}],{duration:600});
}

/* -------- wire up -------- */
els.addDeal.addEventListener('click', openAdd);
els.saveDeal.addEventListener('click', ()=>{ const v = Number(els.dealInput.value); closeAllModals(); addDeal(v); els.dealInput.value=''; });
els.historyBtn.addEventListener('click', openHistory);
els.undoBtn.addEventListener('click', undoLast);
els.yearBtn.addEventListener('click', ()=> alert('Карта года появится после подключённой БД.'));

render();

/* -------- month rollover (локально) -------- */
setInterval(()=>{
  const k = monthKey();
  if (k !== state.key){
    state = { key:k, monthly_sum:0, deals_count:0, history:[] };
    saveState(); render();
  }
}, 60_000);
