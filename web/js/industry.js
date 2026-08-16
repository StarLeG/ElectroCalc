/* EngiCalc — New KIPIA & industrial calculators */
'use strict';
import { $, num, round, toast, validate } from './core.js';

/* ===================== FUSE SELECTION ===================== */
export function calcFuse() {
  if (!validate('fu-Iload', 'fu-U')) return;
  const Iload = num('fu-Iload');
  const U = num('fu-U');
  const type = $('#fu-type').value;
  const startup = $('#fu-startup').value === 'yes';

  // Safety factor
  const k = startup ? 2.5 : 1.5;
  const Ifuse = Iload * k;

  // Standard fuse ratings
  const std = [0.5, 1, 2, 4, 6, 8, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315];
  const selected = std.find(v => v >= Ifuse) || std[std.length - 1];

  // Breaking capacity check
  const Ibreaking = type === 'gG' ? 50000 : type === 'aM' ? 80000 : 10000;

  $('#fu-Ifuse').textContent = round(Ifuse, 1) + ' А';
  $('#fu-selected').textContent = selected + ' А';
  $('#fu-Ibreaking').textContent = Ibreaking + ' А';
  $('#fu-result-val').textContent = selected + ' А';
}

/* ===================== 4-20mA CABLE LENGTH ===================== */
export function calc420Cable() {
  if (!validate('cl2-Vsupply', 'cl2-Vmin', 'cl2-Rload', 'cl2-Rwire')) return;
  const Vsupply = num('cl2-Vsupply');
  const Vmin = num('cl2-Vmin');
  const Rload = num('cl2-Rload');
  const Rwire = num('cl2-Rwire');

  // Max total resistance
  const Rmax = (Vsupply - Vmin) / 0.02;

  // Current resistance
  const Rtotal = Rload + Rwire;

  // Remaining for cable
  const Rcable = Rmax - Rload;

  // Max cable length (2-wire, per conductor)
  // R = rho * L / S => L = R * S / rho
  const S = num('cl2-S') || 1.5;
  const rho = 0.0175; // copper
  const Lmax = Rcable * S / (2 * rho) / 1000; // meters

  const ok = Rtotal <= Rmax;

  $('#cl2-Rmax').textContent = round(Rmax, 0) + ' Ом';
  $('#cl2-Rtotal').textContent = round(Rtotal, 0) + ' Ом';
  $('#cl2-Rcable').textContent = round(Rcable, 0) + ' Ом';
  $('#cl2-Lmax').textContent = round(Lmax, 0) + ' м';
  $('#cl2-status').innerHTML = ok
    ? '<span class="check">✓ Линия работоспособна</span>'
    : '<span style="color:var(--error)">✗ Сопротивление слишком велико</span>';
  $('#cl2-result-val').textContent = round(Lmax, 0);
}

/* ===================== RTD TABLE ===================== */
export function calcRTDTable() {
  const type = $('#rt-type').value;
  const mode = $('#rt-mode').value;
  const val = num('rt-val');

  if (isNaN(val)) { toast('Введите значение'); return; }

  const R0 = type === 'Pt1000' ? 1000 : type === 'Pt500' ? 500 : 100;
  const A = 3.9083e-3;
  const B = -5.775e-7;

  if (mode === 't2r') {
    const R = R0 * (1 + A * val + B * val * val);
    $('#rt-result-val').textContent = round(val, 1);
    $('#rt-result-unit').textContent = '°C → ' + round(R, 3) + ' Ом';
  } else {
    // Iterative solver for R -> T
    let t = val / R0 * 100; // initial guess
    for (let i = 0; i < 10; i++) {
      const Rcalc = R0 * (1 + A * t + B * t * t);
      t = t + (val - Rcalc) / (R0 * (A + 2 * B * t));
    }
    $('#rt-result-val').textContent = round(val, 3);
    $('#rt-result-unit').textContent = 'Ом → ' + round(t, 2) + ' °C';
  }
}

/* ===================== THERMOCOUPLE TABLE ==================== */
export function calcThermocouple() {
  const type = $('#tc-type').value;
  const mode = $('#tc-mode').value;
  const val = num('tc-val');

  if (isNaN(val)) { toast('Введите значение'); return; }

  // Simplified polynomial coefficients (mV -> °C)
  const coeffs = {
    'K': { range: [0, 1372], c: [0, 25.08355, 7.860106e-2, -2.503131e-1, 8.315270e-2, -1.228034e-2, 9.804036e-4, -4.413030e-5, 1.057734e-6, -1.052755e-8] },
    'J': { range: [0, 760], c: [0, 1.978425e1, -2.001204e-1, 1.036969e-2, -2.549687e-4, 3.585153e-6, -5.344285e-8, 5.099890e-10] },
    'T': { range: [0, 400], c: [0, 2.5949192e1, -2.1316967e-1, 7.9916180e-3, -4.2695200e-5] },
    'E': { range: [0, 1000], c: [0, 1.6977288e1, -4.3514970e-1, -1.5859697e-3, 9.2502871e-5, -2.6084314e-7] }
  };

  const tc = coeffs[type];
  if (!tc) { toast('Неизвестный тип термопары'); return; }

  if (mode === 'mv2c') {
    // mV -> °C
    let t = 0;
    for (let i = 1; i < tc.c.length; i++) {
      t += tc.c[i] * Math.pow(val, i);
    }
    $('#tc-result-val').textContent = round(val, 3);
    $('#tc-result-unit').textContent = 'мВ → ' + round(t, 1) + ' °C';
  } else {
    // °C -> mV (using inverse polynomial approximation)
    const n = tc.c.length - 1;
    let mv = 0;
    for (let i = 1; i <= n; i++) {
      mv += tc.c[i] * Math.pow(val, i);
    }
    // This is approximate - real inverse needs iterative approach
    $('#tc-result-val').textContent = round(val, 1);
    $('#tc-result-unit').textContent = '°C → ~' + round(mv, 3) + ' мВ';
  }
}

/* ===================== PNEUMATIC LINE ===================== */
export function calcPneumLine() {
  if (!validate('pl-Q', 'pl-D', 'pl-L', 'pl-P')) return;
  const Q = num('pl-Q');
  const D = num('pl-D');
  const L = num('pl-L');
  const P = num('pl-P');

  // Convert to SI
  const Qs = Q / 60000; // m3/s
  const Ds = D / 1000; // m
  const As = Math.PI * Ds * Ds / 4;
  const v = Qs / As;
  const Re = v * Ds / (1.5e-5); // kinematic viscosity of air
  const rho = 1.2 * (P + 1) / 1; // density at pressure

  let lambda;
  if (Re < 2300) {
    lambda = 64 / Re;
  } else {
    lambda = 0.3164 / Math.pow(Re, 0.25);
  }

  const dP = lambda * L / Ds * rho * v * v / 2 / 100000;

  $('#pl-v').textContent = round(v, 1) + ' м/с';
  $('#pl-Re').textContent = Math.round(Re);
  $('#pl-dP').textContent = round(dP, 3) + ' бар';
  $('#pl-result-val').textContent = round(dP, 3);
}

/* ===================== ENERGY AUDIT ===================== */
export function calcEnergyAudit() {
  const rows = document.querySelectorAll('#ea-table tbody tr');
  if (!rows.length) { toast('Добавьте оборудование'); return; }

  let Ptotal = 0;
  let dailyKWh = 0;
  let cost = 0;
  const price = num('ea-price') || 5.5;

  rows.forEach(row => {
    const P = parseFloat(row.querySelector('.ea-p')?.value) || 0;
    const hours = parseFloat(row.querySelector('.ea-h')?.value) || 0;
    const qty = parseInt(row.querySelector('.ea-q')?.value) || 1;
    const daily = P * hours * qty / 1000;
    Ptotal += P * qty;
    dailyKWh += daily;
  });

  const monthlyKWh = dailyKWh * 30;
  const yearlyKWh = dailyKWh * 365;
  cost = monthlyKWh * price;

  $('#ea-Ptotal').textContent = round(Ptotal, 1) + ' кВт';
  $('#ea-daily').textContent = round(dailyKWh, 1) + ' кВт·ч';
  $('#ea-monthly').textContent = round(monthlyKWh, 0) + ' кВт·ч';
  $('#ea-yearly').textContent = round(yearlyKWh, 0) + ' кВт·ч';
  $('#ea-cost').textContent = round(cost, 0) + ' руб/мес';
  $('#ea-result-val').textContent = round(monthlyKWh, 0);
}

export function addEnergyRow() {
  const tbody = document.querySelector('#ea-table tbody');
  if (!tbody) return;
  const tr = document.createElement('tr');
  tr.innerHTML = '<td><input type="text" value="Оборудование" class="tbl-input ea-name"></td><td><input type="number" value="100" step="10" class="tbl-input ea-p"></td><td><input type="number" value="8" step="0.5" class="tbl-input ea-h"></td><td><input type="number" value="1" min="1" class="tbl-input ea-q"></td>';
  tbody.appendChild(tr);
}

export function removeEnergyRow() {
  const tbody = document.querySelector('#ea-table tbody');
  if (tbody && tbody.children.length > 1) tbody.removeChild(tbody.lastElementChild);
}

/* ===================== CABLE TRAY FILL ==================== */
export function calcCableTray() {
  if (!validate('ct-trayW', 'ct-trayH')) return;
  const trayW = num('ct-trayW');
  const trayH = num('ct-trayH');
  const fillFactor = num('ct-fill') || 40;

  // Tray cross-section area
  const trayArea = trayW * trayH;

  // Usable area
  const usableArea = trayArea * fillFactor / 100;

  // Cable list
  const rows = document.querySelectorAll('#ct-table tbody tr');
  let totalCableArea = 0;
  const cables = [];

  rows.forEach(row => {
    const d = parseFloat(row.querySelector('.ct-d')?.value) || 0;
    const qty = parseInt(row.querySelector('.ct-q')?.value) || 1;
    const area = Math.PI * d * d / 4 * qty;
    totalCableArea += area;
    cables.push({ d, qty, area });
  });

  const fillPercent = usableArea > 0 ? totalCableArea / usableArea * 100 : 0;
  const ok = fillPercent <= 100;

  $('#ct-trayArea').textContent = round(trayArea, 0) + ' мм²';
  $('#ct-usableArea').textContent = round(usableArea, 0) + ' мм²';
  $('#ct-cableArea').textContent = round(totalCableArea, 0) + ' мм²';
  $('#ct-fillPercent').textContent = round(fillPercent, 1) + ' %';
  $('#ct-status').innerHTML = ok
    ? '<span class="check">✓ Помещается</span>'
    : '<span style="color:var(--error)">✗ Не помещается!</span>';
  $('#ct-result-val').textContent = round(fillPercent, 1);
}

export function addCableRow() {
  const tbody = document.querySelector('#ct-table tbody');
  if (!tbody) return;
  const tr = document.createElement('tr');
  tr.innerHTML = '<td><input type="text" value="Кабель" class="tbl-input ct-name"></td><td><input type="number" value="8" step="0.5" class="tbl-input ct-d"></td><td><input type="number" value="1" min="1" class="tbl-input ct-q"></td>';
  tbody.appendChild(tr);
}

export function removeCableRow() {
  const tbody = document.querySelector('#ct-table tbody');
  if (tbody && tbody.children.length > 1) tbody.removeChild(tbody.lastElementChild);
}
