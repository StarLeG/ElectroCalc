/* EngiCalc — New electrical calculators */
'use strict';
import { $, $$, num, round, toast, validate, validateRange } from './core.js';
import { RESISTIVITY, K_THERMAL } from './data/cable-data.js';

/* ===================== GROUND CIRCUIT ===================== */
export function calcGroundCircuit() {
  if (!validate('gc-rho', 'gc-Lv', 'gc-dv', 'gc-Lh', 'gc-n', 'gc-Rreq')) return;
  const rho = num('gc-rho');
  const Lv = num('gc-Lv');
  const dv = num('gc-dv') / 1000;
  const Lh = num('gc-Lh');
  const bh = (num('gc-bh') || 40) / 1000;   // ширина полосы, м
  const hh = num('gc-hh') || 0.7;           // глубина заложения, м
  const n = num('gc-n');
  const Rreq = num('gc-Rreq');

  if (!(Lv > 0) || !(dv > 0) || !(Lh > 0) || !(bh > 0) || !(hh > 0) || !(n >= 1)) {
    toast('Проверьте данные');
    return;
  }

  // Сопротивление одного вертикального электрода.
  const Rv = rho / (2 * Math.PI * Lv) * Math.log(4 * Lv / dv);

  // Горизонтальная полоса в траншее: Rг = ρ/(2πL)·ln(2L²/(b·h)),
  // где b — ширина полосы, h — глубина заложения. Раньше под логарифмом стояло
  // 2L²/(0.01·L), то есть просто 200·L — величина без физического смысла,
  // и вдобавок вычиталась единица, которой в формуле полосы нет.
  const Rh = rho / (2 * Math.PI * Lh) * Math.log(2 * Lh * Lh / (bh * hh));

  // Коэффициенты использования: вертикальных электродов и соединяющей полосы.
  // ВНИМАНИЕ: значения ориентировочные, подлежат сверке со справочными таблицами.
  const eta = n <= 3 ? 0.7 : n <= 6 ? 0.65 : n <= 10 ? 0.6 : n <= 20 ? 0.55 : 0.5;
  const etaH = n <= 4 ? 0.45 : n <= 6 ? 0.40 : n <= 10 ? 0.34 : n <= 20 ? 0.27 : 0.22;

  // Проводимости складываются, каждая — со своим коэффициентом использования.
  // Раньше полоса входила с η = 1, что занижало итоговое сопротивление.
  const Rtotal = 1 / (n * eta / Rv + etaH / Rh);

  const ok = Rtotal <= Rreq;

  $('#gc-Rv').textContent = round(Rv, 2) + ' Ом';
  $('#gc-Rh').textContent = round(Rh, 2) + ' Ом';
  $('#gc-Rtotal').textContent = round(Rtotal, 2) + ' Ом';
  $('#gc-eta').textContent = round(eta, 2) + ' / ' + round(etaH, 2);
  $('#gc-status').innerHTML = ok
    ? '<span class="check">✓ Достаточно</span>'
    : '<span style="color:var(--error)">✗ Нужно больше электродов</span>';
  $('#gc-result-val').textContent = round(Rtotal, 2);
}

/* ===================== KZ CABLE CHECK ===================== */
export function calcKZCableCheck() {
  if (!validate('kz-Ikz', 'kz-t', 'kz-S')) return;
  const Ikz = num('kz-Ikz');
  const t = num('kz-t');
  const S = num('kz-S');
  const mat = $('#kz-mat')?.value || 'Cu';

  // Коэффициент термической стойкости, А·с^0.5/мм².
  // Страница не спрашивает тип изоляции, поэтому берётся сшитый полиэтилен —
  // как было и раньше (143/95). Для ПВХ коэффициент почти на четверть ниже,
  // см. K_THERMAL в data/cable-data.js.
  const k = K_THERMAL[mat].xlpe;

  // Minimum section for KZ thermal stability
  const Smin = Ikz * Math.sqrt(t) / k;

  const ok = S >= Smin;

  $('#kz-Smin').textContent = round(Smin, 1) + ' мм²';
  $('#kz-status').innerHTML = ok
    ? '<span class="check">✓ Кабель выдержит</span>'
    : '<span style="color:var(--error)">✗ Сечение недостаточно!</span>';
  $('#kz-result-val').textContent = round(Smin, 1);
}

/* ===================== BUSBAR ===================== */
export function calcBusbar() {
  if (!validate('bb-I', 'bb-w', 'bb-h', 'bb-Tenv')) return;
  const I = num('bb-I');
  const w = num('bb-w');
  const h = num('bb-h');
  const Tenv = num('bb-Tenv');
  const mat = $('#bb-mat').value;
  const n = num('bb-n') || 1;

  // Cross-section area mm²
  const S = w * h * n;

  // Current density (A/mm²) - approximate for copper busbar
  const jMax = mat === 'Cu' ? 2.5 : 1.6;

  // Max current by density
  const Imax = S * jMax;

  // Temperature derating
  const kt = Tenv <= 35 ? 1.0 : Tenv <= 40 ? 0.94 : Tenv <= 45 ? 0.88 : Tenv <= 50 ? 0.82 : 0.75;
  const Iderated = Imax * kt;

  // Voltage drop per meter (approximate)
  const rho = RESISTIVITY[mat];
  const Rm = rho / S * 1000;
  const dU = I * Rm / 1000;

  const ok = I <= Iderated;

  $('#bb-S').textContent = round(S, 1) + ' мм²';
  $('#bb-Imax').textContent = round(Iderated, 0) + ' А';
  $('#bb-kt').textContent = round(kt, 2);
  $('#bb-Rm').textContent = round(Rm, 4) + ' мОм/м';
  $('#bb-dU').textContent = round(dU, 3) + ' В/м';
  $('#bb-status').innerHTML = ok
    ? '<span class="check">✓ Допустимо</span>'
    : '<span style="color:var(--error)">✗ Перегрузка</span>';
  $('#bb-result-val').textContent = round(Iderated, 0);
}

/* ===================== DEMAND FACTOR ===================== */
export function calcDemandFactor() {
  const rows = document.querySelectorAll('#df-table tbody tr');
  if (!rows.length) { toast('Добавьте группы'); return; }

  let Ptotal = 0, Pcalc = 0;
  rows.forEach(row => {
    const P = parseFloat(row.querySelector('.df-p')?.value) || 0;
    const ks = parseFloat(row.querySelector('.df-ks')?.value) || 1;
    Ptotal += P;
    Pcalc += P * ks;
  });

  const koverall = Ptotal > 0 ? Pcalc / Ptotal : 0;

  $('#df-Ptotal').textContent = round(Ptotal, 1) + ' кВт';
  $('#df-Pcalc').textContent = round(Pcalc, 1) + ' кВт';
  $('#df-koverall').textContent = round(koverall, 3);
  $('#df-result-val').textContent = round(Pcalc, 1);
}

export function addDemandRow() {
  const tbody = document.querySelector('#df-table tbody');
  if (!tbody) return;
  const tr = document.createElement('tr');
  tr.innerHTML = '<td><input type="text" value="Группа" class="tbl-input df-name"></td><td><input type="number" value="1.0" step="0.1" class="tbl-input df-p"></td><td><input type="number" value="0.8" step="0.05" min="0" max="1" class="tbl-input df-ks"></td>';
  tbody.appendChild(tr);
}

export function removeDemandRow() {
  const tbody = document.querySelector('#df-table tbody');
  if (tbody && tbody.children.length > 1) tbody.removeChild(tbody.lastElementChild);
}
