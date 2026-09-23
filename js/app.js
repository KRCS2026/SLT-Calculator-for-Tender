/* মেইন কন্ট্রোল: ইভেন্ট লিসেনার + হিসাব প্রবাহ */
import { evaluateTenders, convertNPPIToAmount } from './calculator.js';
import {
  generateCompanyFields, getCompanyData, renderResults,
  renderEvaluationTable, renderWinner, renderSpecialCase,
  saveToLocalStorage, loadFromLocalStorage, generatePDF
} from './ui.js';

// DOM লোড হলে সব বাটনে ইভেন্ট বসানো
document.addEventListener('DOMContentLoaded', () => {
  // সংরক্ষিত ডেটা থাকলে লোড, নাহলে ৫টি খালি ফিল্ড
  if (!loadFromLocalStorage()) generateCompanyFields(5);

  // ফিল্ড তৈরি
  document.getElementById('generateFields').addEventListener('click', () => {
    const c = Number(document.getElementById('companyCount').value);
    if (!c || c < 1 || c > 50) { alert('১–৫০ এর মধ্যে সংখ্যা দিন'); return; }
    generateCompanyFields(c);
    saveToLocalStorage();
  });

  // হিসাব করুন
  document.getElementById('calculateBtn').addEventListener('click', onCalculate);

  // রিসেট
  document.getElementById('resetBtn').addEventListener('click', onReset);

  // প্রিন্ট / PDF / নতুন হিসাব
  document.getElementById('printBtn').addEventListener('click', () => window.print());
  document.getElementById('pdfBtn').addEventListener('click', generatePDF);
  document.getElementById('newCalcBtn').addEventListener('click', () => {
    document.getElementById('resultPanel').scrollIntoView({ behavior: 'smooth' });
  });

  // ইনপুট বদলালে অটো-সেভ
  ['oce', 'nppiValue'].forEach(id =>
    document.getElementById(id)?.addEventListener('input', saveToLocalStorage));
});

// মূল হিসাব প্রবাহ
function onCalculate() {
  const companies = getCompanyData();
  if (!companies) return;
  const oce = Number(document.getElementById('oce').value);
  const nppiValue = Number(document.getElementById('nppiValue').value);
  // NPPI সরাসরি টাকায় ইনপুট হয়
  const nppiAmt = convertNPPIToAmount(oce, nppiValue);
  // মূল্যায়ন → রেন্ডার
  const data = evaluateTenders(companies, oce, nppiAmt);
  renderResults(data, oce, nppiAmt);
  renderEvaluationTable(data);
  renderWinner(data);
  renderSpecialCase(companies, oce);
  saveToLocalStorage();
  // কনসোলে যাচাই (টেস্ট কেস মিলিয়ে দেখুন)
  console.log('[SLT]', { avgBid: data.avgBid, weightedAvg: data.weightedAvg, sd: data.sd, floor: data.floor, winner: data.winner?.name });
}

// সব মুছে ফেলা
function onReset() {
  if (!confirm('সব তথ্য মুছবেন?')) return;
  localStorage.removeItem('slt-data');
  document.getElementById('companyFields').innerHTML = '<p class="empty-note">উপরে সংখ্যা দিয়ে ফিল্ড তৈরি করুন।</p>';
  document.getElementById('companyCount').value = '';
  document.getElementById('oce').value = '';
  document.getElementById('nppiValue').value = '';
  ['resultPanel', 'evalSection', 'winnerCard', 'specialCasePanel'].forEach(id =>
    document.getElementById(id)?.classList.add('hidden'));
}
