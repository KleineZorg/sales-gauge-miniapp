const MIN=2500, MAX=300000, STEP=21250;
const LEVELS=["Bich","Тестер крео","Кликосборщик","UTM-адепт","Jr Buyer","Mid Buyer","Sr Buyer","Team Lead","Алхимик","Архитектор","ROI-Slayer","Whale Hunter","Shark","Boss of Offers","Traffic Tsar"];
const el={fill:$('#fill'),glow:$('#glow'),sumText:$('#sumText'),levelText:$('#levelText'),dealsText:$('#dealsText'),modal:$('#modal'),input:$('#dealInput')};
function $(s){return document.querySelector(s)}
const tg=window.Telegram?.WebApp; tg&&tg.expand();
function key(d=new Date()){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,'0')}
let state=load(); function load(){const r=localStorage.getItem('sg:'+key());return r?JSON.parse(r):{key:key(),monthly_sum:0,deals_count:0,history:[]}}
function save(){localStorage.setItem('sg:'+state.key,JSON.stringify(state))}
function lvl(sum){return Math.max(1,Math.min(15,Math.floor((sum-MIN)/STEP)+1))}
function pct(sum){return Math.max(0,Math.min(sum,MAX))/MAX*100}
function segBottom(sum){return (lvl(sum)-1)*(100/15)}
function render(){el.sumText.textContent=state.monthly_sum.toLocaleString('ru-RU'); el.levelText.textContent=lvl(state.monthly_sum); el.dealsText.textContent=state.deals_count; el.fill.style.height=pct(state.monthly_sum)+'%'; el.glow.style.bottom=segBottom(state.monthly_sum)+'%'; el.glow.style.opacity=.85}
function openM(){el.modal.classList.remove('hidden'); el.input.focus()}
function closeM(){el.modal.classList.add('hidden'); el.input.value=''}
function addDeal(a){a=Number(a||0); if(!a) return; state.monthly_sum+=a; state.deals_count++; state.history.push({ts:Date.now(),amount:a}); save(); render();
  try{tg?.sendData(JSON.stringify({type:'deal',amount:a,monthly_sum:state.monthly_sum}))}catch(e){}}
$('#addDeal').onclick=openM; $('#cancel').onclick=closeM; $('#save').onclick=()=>{const v=el.input.value; closeM(); addDeal(v)}
render(); setInterval(()=>{const k=key(); if(k!==state.key){state={key:k,monthly_sum:0,deals_count:0,history:[]}; save(); render()}},6e4);
