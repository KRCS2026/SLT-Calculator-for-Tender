/* UI লজিক পার্ট-১: ফিল্ড তৈরি + ডেটা সংগ্রহ + ফরম্যাট */
import { evaluateSingleBid } from './calculator.js';

// কোম্পানির ইনপুট ফিল্ড তৈরি
export function generateCompanyFields(count, preset = []) {
  const wrap = document.getElementById('companyFields');
  wrap.innerHTML = '';
  const n = Math.max(1, Math.min(50, Number(count) || 0));
  for (let i = 0; i < n; i++) {
    const row = document.createElement('div');
    row.className = 'comp-row';
    const nm = preset[i]?.name ?? `কোম্পানি ${i + 1}`;
    const pr = preset[i]?.price ?? '';
    row.innerHTML =
      `<div class="sl">${i + 1}</div>` +
      `<input type="text" placeholder="কোম্পানির নাম" value="${nm}" data-name />` +
      `<input type="number" min="0" placeholder="দর (টাকা)" value="${pr}" data-price />` +
      `<button class="rm" title="মুছুন">×</button>`;
    row.querySelector('.rm').addEventListener('click', () => {
      row.remove(); renumberRows(); saveToLocalStorage();
    });
    wrap.appendChild(row);
  }
  wrap.querySelectorAll('input').forEach(el =>
    el.addEventListener('input', saveToLocalStorage));
}

// সারি মুছলে ক্রম ঠিক করা
function renumberRows() {
  document.querySelectorAll('#companyFields .comp-row').forEach((r, i) => {
    r.querySelector('.sl').textContent = i + 1;
  });
}

// ইনপুট থেকে ডেটা সংগ্রহ + ভ্যালিডেশন
export function getCompanyData() {
  const rows = [...document.querySelectorAll('#companyFields .comp-row')];
  if (rows.length === 0) { alert('প্রথমে ফিল্ড তৈরি করুন'); return null; }
  const data = [];
  for (const r of rows) {
    const name = r.querySelector('[data-name]').value.trim();
    const price = Number(r.querySelector('[data-price]').value);
    if (!name) { alert('সব কোম্পানির নাম দিন'); return null; }
    if (!price || price <= 0) { alert(`"${name}" এর সঠিক দর দিন`); return null; }
    data.push({ name, price });
  }
  const oce = Number(document.getElementById('oce').value);
  if (!oce || oce <= 0) { alert('সঠিক OCE দিন'); return null; }
  return data;
}

// বাংলা সংখ্যা ফরম্যাট
export function formatBengaliNumber(num) {
  try {
    return new Intl.NumberFormat('bn-BD', { maximumFractionDigits: 0 }).format(Math.round(num));
  } catch { return Math.round(num).toLocaleString('en-IN'); }
}
export function formatBDT(num) { return formatBengaliNumber(num) + ' ৳'; }
// ফলাফল প্যানেল রেন্ডার
export function renderResults(data, oce, nppiAmt) {
  document.getElementById('rCount').textContent = formatBengaliNumber(data.results.length);
  document.getElementById('rAvg').textContent = formatBDT(data.avgBid);
  document.getElementById('rOce').textContent = formatBDT(oce);
  document.getElementById('rNppi').textContent = formatBDT(nppiAmt);
  document.getElementById('rWAvg').textContent = formatBDT(data.weightedAvg);
  document.getElementById('rSd').textContent = formatBDT(data.sd);
  document.getElementById('rFloor').textContent = formatBDT(data.floor);
  document.getElementById('resultPanel').classList.remove('hidden');
}
// মূল্যায়ন টেবিল + মোবাইল কার্ড
export function renderEvaluationTable(data) {
  const tb = document.getElementById('evaluationTable');
  tb.innerHTML = '';
  const mc = document.getElementById('mobileCards');
  mc.innerHTML = '';
  data.results.forEach(r => {
    let cls = '', pill = '', label = '';
    if (r.status === 'slt') { cls = 'row-slt'; pill = 'pill-slt'; label = 'SLT'; }
    else if (r.status === 'rejected_high') { cls = 'row-rej'; pill = 'pill-rej'; label = 'বাতিল'; }
    else if (r.rank === 'L1') { cls = 'row-l1'; pill = 'pill-l1'; label = 'L1'; }
    else { cls = 'row-ok'; pill = 'pill-ok'; label = r.rank || 'গ্রহণযোগ্য'; }
    const tr = document.createElement('tr');
    tr.className = cls;
    tr.innerHTML = `<td>${r.index}</td><td>${r.name}</td><td>${formatBDT(r.price)}</td><td><span class="pill ${pill}">${label}</span></td><td>${r.comment}</td>`;
    tb.appendChild(tr);
    const card = document.createElement('div');
    card.className = 'm-card ' + (r.status === 'slt' ? 'slt' : r.status === 'rejected_high' ? 'rej' : r.rank === 'L1' ? 'l1' : 'ok');
    card.innerHTML = `<strong>${r.index}. ${r.name}</strong><br>দর: ${formatBDT(r.price)}<br><span class="pill ${pill}">${label}</span><br><small>${r.comment}</small>`;
    mc.appendChild(card);
  });
  document.getElementById('evalSection').classList.remove('hidden');
}
// বিজয়ী কার্ড
export function renderWinner(data) {
  const card = document.getElementById('winnerCard');
  const txt = document.getElementById('winnerText');
  const sub = document.getElementById('winnerSub');
  card.classList.remove('hidden');
  if (data.allSLT) {
    txt.textContent = 'সব দর SLT — পুনঃটেন্ডারের সুপারিশ';
    sub.textContent = `Floor ${formatBDT(data.floor)} এর নিচে সব দর।`;
  } else if (data.winner) {
    txt.textContent = `চুক্তি সম্পাদনের নোটিশ পাবে: ${data.winner.name}`;
    sub.textContent = `দর ${formatBDT(data.winner.price)} | Floor ${formatBDT(data.floor)}`;
  } else {
    txt.textContent = 'কোনো গ্রহণযোগ্য দর নেই — পুনঃটেন্ডার করুন';
    sub.textContent = '';
  }
  card.scrollIntoView({ behavior: 'smooth' });
}
// বিশেষ কেস (১টি দর)
export function renderSpecialCase(companies, oce) {
  const panel = document.getElementById('specialCasePanel');
  const box = document.getElementById('specialCaseText');
  if (companies.length === 1) {
    const r = evaluateSingleBid(companies[0], oce);
    panel.classList.remove('hidden');
    box.innerHTML = `<p><strong>${companies[0].name}</strong>: ${r.message}</p>`;
  } else panel.classList.add('hidden');
}
// স্টোরেজ
export function saveToLocalStorage() {
  const rows = [...document.querySelectorAll('#companyFields .comp-row')].map(r => ({
    name: r.querySelector('[data-name]').value,
    price: r.querySelector('[data-price]').value
  }));
  localStorage.setItem('slt-data', JSON.stringify({
    rows, oce: document.getElementById('oce').value,
    nppiValue: document.getElementById('nppiValue').value
  }));
}
export function loadFromLocalStorage() {
  try {
    const d = JSON.parse(localStorage.getItem('slt-data'));
    if (!d) return false;
    if (d.rows?.length) generateCompanyFields(d.rows.length, d.rows);
    if (d.oce) document.getElementById('oce').value = d.oce;
    if (d.nppiValue) document.getElementById('nppiValue').value = d.nppiValue;
    return !!d.rows?.length;
  } catch { return false; }
}
export function generatePDF() { window.print(); }
