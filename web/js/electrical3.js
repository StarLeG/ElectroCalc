/* EngiCalc — Electrical installation & engineering calculators */
'use strict';
import { $, $$, num, round, toast, validate, validateRange } from './core.js';
import { RESISTIVITY, BREAKER_RATINGS, nextStandard } from './data/cable-data.js';

/* ===================== THREE-PHASE POWER ===================== */
export function calc3PhasePower() {
  if (!validate('tp-U', 'tp-I') || !validateRange('tp-cos', 0.01, 1)) return;
  const U = num('tp-U'), I = num('tp-I'), cos = num('tp-cos') || 0.85;
  const sin = Math.sqrt(1 - cos * cos);
  const P = Math.sqrt(3) * U * I * cos / 1000;
  const Q = Math.sqrt(3) * U * I * sin / 1000;
  const S = Math.sqrt(3) * U * I / 1000;
  const pf = cos;
  $('#tp-P').textContent = round(P, 2) + ' кВт';
  $('#tp-Q').textContent = round(Q, 2) + ' квар';
  $('#tp-S').textContent = round(S, 2) + ' кВА';
  $('#tp-pf').textContent = round(pf, 3);
  $('#tp-result-val').textContent = round(P, 2);
}

/* ===================== DC VOLTAGE DROP ===================== */
export function calcDCVoltageDrop() {
  if (!validate('dc-I', 'dc-L', 'dc-S', 'dc-U')) return;
  const I = num('dc-I'), L = num('dc-L'), S = num('dc-S'), U = num('dc-U');
  const mat = $('#dc-mat')?.value || 'Cu';
  const rho = RESISTIVITY[mat];
  const R = 2 * rho * L / S;
  const dU = I * R;
  const pct = dU / U * 100;
  const Ploss = I * I * R;
  $('#dc-R').textContent = round(R, 3) + ' Ом';
  $('#dc-dU').textContent = round(dU, 2) + ' В';
  $('#dc-pct').textContent = round(pct, 2) + ' %';
  $('#dc-Ploss').textContent = round(Ploss, 1) + ' Вт';
  $('#dc-Uend').textContent = round(U - dU, 2) + ' В';
  $('#dc-result-val').textContent = round(pct, 2);
}

/* ===================== CONDUIT FILL ===================== */
export function calcConduitFill() {
  if (!validate('cf-D')) return;
  const conduitD = num('cf-D');
  const rows = document.querySelectorAll('#cf-table tbody tr');
  const fillLimit = num('cf-limit') || 40;
  let totalCableArea = 0;

  rows.forEach(row => {
    const d = parseFloat(row.querySelector('.cf-d')?.value) || 0;
    const qty = parseInt(row.querySelector('.cf-q')?.value) || 1;
    totalCableArea += Math.PI * d * d / 4 * qty;
  });

  const conduitArea = Math.PI * conduitD * conduitD / 4;
  const fillPct = conduitArea > 0 ? totalCableArea / conduitArea * 100 : 0;
  const ok = fillPct <= fillLimit;

  // Recommend conduit size
  const std = [16, 20, 25, 32, 40, 50, 63, 80, 100];
  const minD = Math.ceil(2 * Math.sqrt(totalCableArea / (Math.PI * fillLimit / 100)));
  const recommended = std.find(d => d >= minD) || std[std.length - 1];

  $('#cf-conduitArea').textContent = round(conduitArea, 0) + ' мм²';
  $('#cf-cableArea').textContent = round(totalCableArea, 0) + ' мм²';
  $('#cf-fillPct').textContent = round(fillPct, 1) + ' %';
  $('#cf-recommended').textContent = recommended + ' мм';
  $('#cf-status').innerHTML = ok
    ? '<span class="check">✓ Помещается (' + round(fillPct, 1) + '%)</span>'
    : '<span style="color:var(--error)">✗ Превышено (' + round(fillPct, 1) + '% > ' + fillLimit + '%)</span>';
  $('#cf-result-val').textContent = round(fillPct, 1);
}

export function addConduitRow() {
  const tbody = document.querySelector('#cf-table tbody');
  if (!tbody) return;
  const tr = document.createElement('tr');
  tr.innerHTML = '<td><input type="text" value="Кабель" class="tbl-input cf-name"></td><td><input type="number" value="8" step="0.5" class="tbl-input cf-d"></td><td><input type="number" value="1" min="1" class="tbl-input cf-q"></td>';
  tbody.appendChild(tr);
}

export function removeConduitRow() {
  const tbody = document.querySelector('#cf-table tbody');
  if (tbody && tbody.children.length > 1) tbody.removeChild(tbody.lastElementChild);
}

/* ===================== MOTOR STARTING ===================== */
export function calcMotorStart() {
  if (!validate('ms-P', 'ms-U', 'ms-k', 'ms-Zgrid')) return;
  const P = num('ms-P'), U = num('ms-U'), k = num('ms-k'), Zgrid = num('ms-Zgrid');
  const cos = num('ms-cos') || 0.85, eta = num('ms-eta') || 0.9;
  const method = $('#ms-method')?.value || 'DOL';

  const Inom = P * 1000 / (Math.sqrt(3) * U * cos * eta);
  const Imult = method === 'DOL' ? k : method === 'star' ? k / 3 : k * 0.45;
  const Istart = Inom * Imult;

  // Voltage dip during start
  const Zmotor = U / (Math.sqrt(3) * Inom * k);
  const Ztotal = Zgrid + Zmotor;
  const Ustart = U * Zmotor / Ztotal;
  const dip = (U - Ustart) / U * 100;

  // Подбор автомата из стандартного ряда, а не округлением до кратного 5 А
  const breaker = nextStandard(BREAKER_RATINGS, Istart * 1.2) ?? 0;

  // Cable section (by starting current, short duration)
  const cableByStart = Math.ceil(Istart / 8);
  const cableByNom = Math.ceil(Inom / 6);
  const cable = Math.max(cableByStart, cableByNom);

  $('#ms-Inom').textContent = round(Inom, 1) + ' А';
  $('#ms-Istart').textContent = round(Istart, 0) + ' А';
  $('#ms-dip').textContent = round(dip, 1) + ' %';
  $('#ms-breaker').textContent = breaker + ' А';
  $('#ms-cable').textContent = cable + ' мм²';
  $('#ms-status').innerHTML = dip <= 15
    ? '<span class="check">✓ Допустимо (' + round(dip, 1) + '%)</span>'
    : '<span style="color:var(--error)">✗ Большой провал (' + round(dip, 1) + '% > 15%)</span>';
  $('#ms-result-val').textContent = round(dip, 1);
}

/* ===================== NEUTRAL CURRENT ===================== */
export function calcNeutralCurrent() {
  if (!validate('nc-IL1', 'nc-IL2', 'nc-IL3')) return;
  const IL1 = num('nc-IL1'), IL2 = num('nc-IL2'), IL3 = num('nc-IL3');
  const cos1 = num('nc-cos1') || 1, cos2 = num('nc-cos2') || 1, cos3 = num('nc-cos3') || 1;

  // Real and imaginary components
  const IR1 = IL1 * cos1, II1 = IL1 * Math.sqrt(1 - cos1 * cos1);
  const IR2 = IL2 * cos2, II2 = IL2 * Math.sqrt(1 - cos2 * cos2);
  const IR3 = IL3 * cos3, II3 = IL3 * Math.sqrt(1 - cos3 * cos3);

  // Phase shift 120 degrees
  const a = Math.PI * 2 / 3;
  const IR = IR1 + IR2 * Math.cos(a) + IR3 * Math.cos(2 * a) - (II2 * Math.sin(a) + II3 * Math.sin(2 * a));
  const II = II1 + II2 * Math.cos(a) + II3 * Math.cos(2 * a) + (IR2 * Math.sin(a) + IR3 * Math.sin(2 * a));
  const In = Math.sqrt(IR * IR + II * II);

  const Imax = Math.max(IL1, IL2, IL3);
  const Imin = Math.min(IL1, IL2, IL3);
  const imbalance = Imax > 0 ? (Imax - Imin) / Imax * 100 : 0;

  // Neutral current as % of phase current
  const InPct = Imax > 0 ? In / Imax * 100 : 0;

  $('#nc-In').textContent = round(In, 1) + ' А';
  $('#nc-InPct').textContent = round(InPct, 1) + ' %';
  $('#nc-imbalance').textContent = round(imbalance, 1) + ' %';
  $('#nc-status').innerHTML = InPct <= 30
    ? '<span class="check">✓ Допустимо</span>'
    : '<span style="color:var(--warn)">⚠ Высокий ток нейтрали</span>';
  $('#nc-result-val').textContent = round(In, 1);
}

/* ===================== CABLE POWER LOSS ===================== */
export function calcCableLoss() {
  if (!validate('cl-I', 'cl-L', 'cl-S', 'cl-U')) return;
  const I = num('cl-I'), L = num('cl-L'), S = num('cl-S'), U = num('cl-U');
  const mat = $('#cl-mat')?.value || 'Cu';
  const phase = parseInt($('#cl-phase')?.value) || 3;
  const rho = RESISTIVITY[mat];

  const R = phase === 1 ? 2 * rho * L / S : rho * L / S;
  const Ploss = phase === 1 ? I * I * R : 3 * I * I * R;
  const Pload = phase === 1 ? U * I / 1000 : Math.sqrt(3) * U * I / 1000;
  const lossPct = Pload > 0 ? Ploss / (Pload * 1000) * 100 : 0;
  const annualKWh = Ploss * 8760 / 1000;
  const cost = annualKWh * (num('cl-price') || 5.5);

  $('#cl-R').textContent = round(R, 3) + ' Ом';
  $('#cl-Ploss').textContent = round(Ploss, 1) + ' Вт';
  $('#cl-lossPct').textContent = round(lossPct, 2) + ' %';
  $('#cl-annual').textContent = round(annualKWh, 0) + ' кВт·ч/год';
  $('#cl-cost').textContent = round(cost, 0) + ' руб/год';
  $('#cl-result-val').textContent = round(lossPct, 2);
}

/* ===================== EMERGENCY LIGHTING ===================== */
export function calcEmergencyLight() {
  if (!validate('el-area', 'el-lux', 'el-duration')) return;
  const area = num('el-area'), lux = num('el-lux'), duration = num('el-duration');
  const lumenPerW = num('el-lpw') || 100;

  // Minimum illuminance (10% of normal for escape routes)
  const minLux = Math.max(lux * 0.1, 1);
  const totalLumen = minLux * area;
  const totalW = totalLumen / lumenPerW;
  const batteryWh = totalW * duration / 60;

  // Standard battery sizes
  const std = [20, 40, 65, 100, 150, 200, 300, 500];
  const batteryAh = batteryWh / 12; // 12V battery
  const recommendedAh = std.find(v => v >= batteryAh) || std[std.length - 1];

  $('#el-minLux').textContent = round(minLux, 1) + ' лк';
  $('#el-totalLumen').textContent = round(totalLumen, 0) + ' лм';
  $('#el-totalW').textContent = round(totalW, 0) + ' Вт';
  $('#el-batteryWh').textContent = round(batteryWh, 0) + ' Вт·ч';
  $('#el-batteryAh').textContent = round(batteryAh, 1) + ' А·ч (12В)';
  $('#el-recommended').textContent = recommendedAh + ' А·ч';
  $('#el-result-val').textContent = recommendedAh;
}

/* ===================== SOLAR PANEL ===================== */
export function calcSolarPanel() {
  if (!validate('sp-demand', 'sp-sun', 'sp-panel')) return;
  const demand = num('sp-demand');
  const sunHours = num('sp-sun');
  const panelW = num('sp-panel');
  const efficiency = num('sp-eff') || 0.85;
  const autonomy = num('sp-auto') || 1;

  const dailyKWh = demand;
  const panelCount = Math.ceil(dailyKWh * 1000 / (panelW * sunHours * efficiency));
  const totalPanelW = panelCount * panelW;
  const batteryKWh = dailyKWh * autonomy;
  const batteryAh = batteryKWh * 1000 / 48; // 48V system

  // Inverter sizing
  const peakLoad = dailyKWh / 8; // assume 8h average
  const inverterKW = Math.ceil(peakLoad * 1.25 * 10) / 10;

  $('#sp-panelCount').textContent = panelCount + ' шт';
  $('#sp-totalW').textContent = round(totalPanelW, 0) + ' Вт';
  $('#sp-batteryKWh').textContent = round(batteryKWh, 1) + ' кВт·ч';
  $('#sp-batteryAh').textContent = round(batteryAh, 0) + ' А·ч (48В)';
  $('#sp-inverter').textContent = inverterKW + ' кВт';
  $('#sp-result-val').textContent = panelCount;
}

/* ===================== ARC FLASH ===================== */
export function calcArcFlash() {
  if (!validate('af-Ibf', 'af-V', 'af-t')) return;
  const Ibf = num('af-Ibf');
  const V = num('af-V');
  const t = num('af-t');
  const gap = num('af-gap') || 32; // mm, typical for 480V
  const distance = num('af-dist') || 610; // mm, working distance

  // IEEE 1584 simplified (for 208V-15kV, 700A-106kA)
  // Incident energy (cal/cm²)
  const k1 = -0.00043;
  const k2 = 0.159;
  const k3 = 0.0014;
  const G = gap;
  const logIbf = Math.log10(Ibf);
  const logE = k1 + 1.087 * logIbf + 0.0011 * G + k2 + k3 * distance / 1000;
  const E = Math.pow(10, logE) * t / 0.2; // normalize to 0.2s

  // Arc flash boundary (mm)
  const Elimit = 1.2; // cal/cm² threshold for 2nd degree burn
  const Cb = 1000 * Math.pow(Elimit / (Math.pow(10, logE)), 0.5);

  // PPE category
  let ppeCategory, ppeColor;
  if (E <= 4) { ppeCategory = '1 (HRC 1)'; ppeColor = 'var(--result)'; }
  else if (E <= 8) { ppeCategory = '2 (HRC 2)'; ppeColor = 'var(--accent)'; }
  else if (E <= 25) { ppeCategory = '3 (HRC 3)'; ppeColor = 'var(--warn)'; }
  else if (E <= 40) { ppeCategory = '4 (HRC 4)'; ppeColor = 'var(--error)'; }
  else { ppeCategory = '> 40 cal — запрещено'; ppeColor = 'var(--error)'; }

  $('#af-E').textContent = round(E, 1) + ' кал/см²';
  $('#af-boundary').textContent = Math.round(Cb) + ' мм';
  $('#af-ppe').innerHTML = '<span style="color:' + ppeColor + ';font-weight:700">' + ppeCategory + '</span>';
  $('#af-result-val').textContent = round(E, 1);
}

/* ===================== HARMONICS (THD) ===================== */
export function calcTHD() {
  const rows = document.querySelectorAll('#thd-table tbody tr');
  if (!rows.length) { toast('Добавьте гармоники'); return; }
  const fund = num('thd-fund') || 100;

  let sumSq = 0;
  rows.forEach(row => {
    const order = parseInt(row.querySelector('.thd-order')?.value) || 1;
    const amp = parseFloat(row.querySelector('.thd-amp')?.value) || 0;
    if (order > 1) sumSq += amp * amp;
  });

  const thd = Math.sqrt(sumSq) / fund * 100;
  const rms = fund * Math.sqrt(1 + thd * thd / 10000);

  const ok = thd <= 5;
  $('#thd-value').textContent = round(thd, 2) + ' %';
  $('#thd-rms').textContent = round(rms, 1);
  $('#thd-status').innerHTML = ok
    ? '<span class="check">✓ Допустимо (≤5%)</span>'
    : '<span style="color:var(--warn)">⚠ Высокий THD (' + round(thd, 1) + '% > 5%)</span>';
  $('#thd-result-val').textContent = round(thd, 2);
}

export function addTHDRow() {
  const tbody = document.querySelector('#thd-table tbody');
  if (!tbody) return;
  const n = tbody.children.length + 2;
  const tr = document.createElement('tr');
  tr.innerHTML = '<td><input type="number" value="' + n + '" min="2" class="tbl-input thd-order"></td><td><input type="number" value="10" step="0.1" class="tbl-input thd-amp"></td>';
  tbody.appendChild(tr);
}

export function removeTHDRow() {
  const tbody = document.querySelector('#thd-table tbody');
  if (tbody && tbody.children.length > 1) tbody.removeChild(tbody.lastElementChild);
}
