/* EngiCalc — Wire Cabinet Calculator: wire length + НШВИ */
'use strict';
import { $, $$, num, round, toast, validate, lang } from './core.js';

/* ===================== НШВИ REFERENCE ===================== */
const NSHVI_MAP = [
  { min: 0, max: 0.5, nshvi: 'НШВИ 0.5-8', nshvi2: 'НШВИ 2×0.5-8' },
  { min: 0.5, max: 0.75, nshvi: 'НШВИ 0.75-8', nshvi2: 'НШВИ 2×0.75-8' },
  { min: 0.75, max: 1.0, nshvi: 'НШВИ 1.0-8', nshvi2: 'НШВИ 2×1.0-8' },
  { min: 1.0, max: 1.5, nshvi: 'НШВИ 1.5-8', nshvi2: 'НШВИ 2×1.5-8' },
  { min: 1.5, max: 2.5, nshvi: 'НШВИ 2.5-10', nshvi2: 'НШВИ 2×2.5-10' },
  { min: 2.5, max: 4.0, nshvi: 'НШВИ 4-10', nshvi2: 'НШВИ 2×4-10' },
  { min: 4.0, max: 6.0, nshvi: 'НШВИ 6-12', nshvi2: 'НШВИ 2×6-12' },
  { min: 6.0, max: 10.0, nshvi: 'НШВИ 10-12', nshvi2: 'НШВИ 2×10-12' },
  { min: 10.0, max: 16.0, nshvi: 'НШВИ 16-16', nshvi2: 'НШВИ 2×16-16' },
  { min: 16.0, max: 25.0, nshvi: 'НШВИ 25-18', nshvi2: 'НШВИ 2×25-18' },
  { min: 25.0, max: 35.0, nshvi: 'НШВИ 35-20', nshvi2: 'НШВИ 2×35-20' },
  { min: 35.0, max: 50.0, nshvi: 'НШВИ 50-24', nshvi2: 'НШВИ 2×50-24' },
];

function getNshviSize(section) {
  const entry = NSHVI_MAP.find(e => section > e.min && section <= e.max);
  return entry || { nshvi: `НШВИ ${section}-?`, nshvi2: `НШВИ 2×${section}-?` };
}

/* ===================== MODE SWITCH ===================== */
export function switchWirecabMode(mode) {
  const quick = $('#wc-quick-panel');
  const advanced = $('#wc-advanced-panel');
  if (quick) quick.style.display = mode === 'quick' ? '' : 'none';
  if (advanced) advanced.style.display = mode === 'advanced' ? '' : 'none';
  // Update radio buttons
  $$('input[name="wc-mode"]').forEach(r => r.checked = r.value === mode);
}

/* ===================== QUICK MODE ===================== */
export function calcWirecabQuick() {
  if (!validate('wc-H', 'wc-W', 'wc-N', 'wc-ends')) return;
  const H = num('wc-H');       // mm
  const W = num('wc-W');       // mm
  const N = num('wc-N');       // wire count
  const reserve = num('wc-reserve') || 10;
  const multi = $('#wc-type')?.value === 'multi';
  const ends = num('wc-ends'); // НШВИ ends per wire (0, 1, 2)

  const Lavg = (H + W) / 2000 + 0.4; // meters
  const Ltotal = N * Lavg * (1 + reserve / 100);
  const nshvi = multi ? Math.ceil(N * ends * (1 + reserve / 100)) : 0;
  const nshvi2 = 0;
  const marking = Math.ceil(N * 2 * (1 + reserve / 100));

  renderQuickResults(Lavg, Ltotal, nshvi, nshvi2, marking);
}

function renderQuickResults(Lavg, Ltotal, nshvi, nshvi2, marking) {
  $('#wc-Lavg').textContent = round(Lavg, 2) + ' м';
  $('#wc-Ltotal').textContent = round(Ltotal, 1) + ' м';
  $('#wc-nshvi').textContent = nshvi + ' шт';
  $('#wc-nshvi2').textContent = nshvi2 + ' шт';
  $('#wc-marking').textContent = marking + ' шт';
  // Store for CSV
  window._wcQuickResult = { Lavg, Ltotal, nshvi, nshvi2, marking };
}

/* ===================== ADVANCED MODE ===================== */
let groupCounter = 0;

export function addWirecabGroup() {
  groupCounter++;
  const tbody = document.querySelector('#wc-groups-table tbody');
  if (!tbody) return;
  const tr = document.createElement('tr');
  tr.dataset.groupId = groupCounter;
  tr.innerHTML = `
    <td><input type="text" value="Группа ${groupCounter}" class="tbl-input wc-g-name"></td>
    <td><input type="number" value="10" min="1" class="tbl-input wc-g-count"></td>
    <td><select class="tbl-input wc-g-section">
      <option value="0.5">0.5</option><option value="0.75">0.75</option><option value="1.0" selected>1.0</option>
      <option value="1.5">1.5</option><option value="2.5">2.5</option><option value="4">4</option>
      <option value="6">6</option><option value="10">10</option><option value="16">16</option>
      <option value="25">25</option><option value="35">35</option>
    </select></td>
    <td><input type="number" value="1.5" step="0.1" min="0.1" class="tbl-input wc-g-length"></td>
    <td><select class="tbl-input wc-g-type">
      <option value="multi">Многожильный</option><option value="single">Одножильный</option>
    </select></td>
    <td><select class="tbl-input wc-g-ends">
      <option value="2" selected>2</option><option value="1">1</option><option value="0">0</option>
    </select></td>
    <td><input type="number" value="0" min="0" class="tbl-input wc-g-nshvi2"></td>
    <td><input type="number" value="0" min="0" class="tbl-input wc-g-ring"></td>
  `;
  tbody.appendChild(tr);
}

export function removeWirecabGroup() {
  const tbody = document.querySelector('#wc-groups-table tbody');
  if (tbody && tbody.children.length > 1) {
    tbody.removeChild(tbody.lastElementChild);
  }
}

export function calcWirecabAdvanced() {
  const rows = document.querySelectorAll('#wc-groups-table tbody tr');
  const reserve = num('wc-adv-reserve') || 10;
  const results = [];
  let totalLength = 0, totalNshvi = 0, totalNshvi2 = 0, totalRing = 0, totalMarking = 0;
  const bySection = {};

  rows.forEach(row => {
    const name = row.querySelector('.wc-g-name')?.value || '';
    const count = parseInt(row.querySelector('.wc-g-count')?.value) || 0;
    const section = parseFloat(row.querySelector('.wc-g-section')?.value) || 1.0;
    const length = parseFloat(row.querySelector('.wc-g-length')?.value) || 1.5;
    const multi = row.querySelector('.wc-g-type')?.value === 'multi';
    const ends = parseInt(row.querySelector('.wc-g-ends')?.value) ?? 2;
    const nshvi2count = parseInt(row.querySelector('.wc-g-nshvi2')?.value) || 0;
    const ringCount = parseInt(row.querySelector('.wc-g-ring')?.value) || 0;

    const Lgroup = count * length * (1 + reserve / 100);
    const nshviSize = getNshviSize(section);
    const nshviSingle = multi ? Math.ceil(count * ends * (1 + reserve / 100)) : 0;
    const nshvi2total = multi ? Math.ceil(nshvi2count * (1 + reserve / 100)) : 0;
    const ringTotal = Math.ceil(ringCount * (1 + reserve / 100));
    const marking = Math.ceil(count * 2 * (1 + reserve / 100));

    totalLength += Lgroup;
    totalNshvi += nshviSingle;
    totalNshvi2 += nshvi2total;
    totalRing += ringTotal;
    totalMarking += marking;

    // Aggregate by section
    if (!bySection[section]) bySection[section] = { length: 0, nshvi: 0, nshvi2: 0, ring: 0, nshviSize: nshviSize };
    bySection[section].length += Lgroup;
    bySection[section].nshvi += nshviSingle;
    bySection[section].nshvi2 += nshvi2total;
    bySection[section].ring += ringTotal;

    results.push({ name, count, section, length, Lgroup, nshviSingle, nshvi2total, ringTotal, marking, nshviSize });
  });

  renderAdvancedResults(results, bySection, totalLength, totalNshvi, totalNshvi2, totalRing, totalMarking);
}

function renderAdvancedResults(results, bySection, totalLength, totalNshvi, totalNshvi2, totalRing, totalMarking) {
  // Totals
  $('#wc-adv-Ltotal').textContent = round(totalLength, 1) + ' м';
  $('#wc-adv-nshvi').textContent = totalNshvi + ' шт';
  $('#wc-adv-nshvi2').textContent = totalNshvi2 + ' шт';
  $('#wc-adv-ring').textContent = totalRing + ' шт';
  $('#wc-adv-marking').textContent = totalMarking + ' шт';

  // Summary by section
  const summaryBody = document.querySelector('#wc-summary-table tbody');
  if (summaryBody) {
    summaryBody.innerHTML = '';
    Object.keys(bySection).sort((a, b) => a - b).forEach(sec => {
      const s = bySection[sec];
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${sec} мм²</td><td>${s.nshviSize.nshvi}</td><td>${round(s.length, 1)} м</td><td>${s.nshvi} шт</td><td>${s.nshvi2} шт</td><td>${s.ring} шт</td>`;
      summaryBody.appendChild(tr);
    });
  }

  // Store for CSV
  window._wcAdvResult = { results, bySection, totalLength, totalNshvi, totalNshvi2, totalRing, totalMarking };
}

/* ===================== CSV EXPORT ===================== */
export function downloadWirecabCSV() {
  const mode = $('input[name="wc-mode"]:checked')?.value;
  let csv = '';

  if (mode === 'quick') {
    const r = window._wcQuickResult;
    if (!r) { toast('Сначала рассчитайте'); return; }
    csv = 'Параметр;Значение\n';
    csv += `Средняя длина провода;${r.Lavg} м\n`;
    csv += `Общий метраж;${r.Ltotal} м\n`;
    csv += `НШВИ одинарные;${r.nshvi} шт\n`;
    csv += `НШВИ двойные;${r.nshvi2} шт\n`;
    csv += `Маркировка;${r.marking} шт\n`;
  } else {
    const r = window._wcAdvResult;
    if (!r) { toast('Сначала рассчитайте'); return; }
    csv = 'Группа;Кол-во;Сечение;Длина;Метраж;НШВИ;НШВИ-2;Кольцевые;Маркировка\n';
    r.results.forEach(row => {
      csv += `${row.name};${row.count};${row.section};${row.length};${round(row.Lgroup, 1)};${row.nshviSingle};${row.nshvi2total};${row.ringTotal};${row.marking}\n`;
    });
    csv += '\nСводка по сечениям\n';
    csv += 'Сечение;Размер НШВИ;Метраж;НШВИ;НШВИ-2;Кольцевые\n';
    Object.keys(r.bySection).sort((a, b) => a - b).forEach(sec => {
      const s = r.bySection[sec];
      csv += `${sec} мм²;${s.nshviSize.nshvi};${round(s.length, 1)} м;${s.nshvi};${s.nshvi2};${s.ring}\n`;
    });
    csv += `\nИТОГО;;${round(r.totalLength, 1)} м;${r.totalNshvi};${r.totalNshvi2};${r.totalRing}\n`;
  }

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'engicalc-wirecab.csv';
  a.click();
  URL.revokeObjectURL(url);
}

/* ===================== RESET ===================== */
export function resetWirecabQuick() {
  ['#wc-H', '#wc-W', '#wc-N', '#wc-reserve', '#wc-ends'].forEach(sel => {
    const el = $(sel);
    if (el) el.value = el.defaultValue;
  });
  ['#wc-Lavg', '#wc-Ltotal', '#wc-nshvi', '#wc-nshvi2', '#wc-marking'].forEach(sel => {
    const el = $(sel);
    if (el) el.textContent = '—';
  });
  window._wcQuickResult = null;
}

export function resetWirecabAdvanced() {
  const tbody = document.querySelector('#wc-groups-table tbody');
  if (tbody) tbody.innerHTML = '';
  groupCounter = 0;
  addWirecabGroup(); // Add one default row
  ['#wc-adv-Ltotal', '#wc-adv-nshvi', '#wc-adv-nshvi2', '#wc-adv-ring', '#wc-adv-marking'].forEach(sel => {
    const el = $(sel);
    if (el) el.textContent = '—';
  });
  const summaryBody = document.querySelector('#wc-summary-table tbody');
  if (summaryBody) summaryBody.innerHTML = '';
  window._wcAdvResult = null;
}

/* ===================== INIT ===================== */
export function initWirecab() {
  // Mode switch radios
  $$('input[name="wc-mode"]').forEach(radio => {
    radio.addEventListener('change', () => switchWirecabMode(radio.value));
  });
  // Start in quick mode
  switchWirecabMode('quick');
}
