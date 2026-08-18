/* EngiCalc — New KIPIA & industrial calculators */
'use strict';
import { $, num, round, toast, validate } from './core.js';
import { RESISTIVITY } from './data/cable-data.js';
import { rtdR0, rtdResistance, rtdTemperature, RTD_RANGE } from './data/rtd.js';

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
  const rho = RESISTIVITY.Cu;                       // Ом·мм²/м — результат сразу в метрах
  // Петля двухпроводная: на длину L приходится 2L проводника.
  const Lmax = Math.max(0, Rcable) * S / (2 * rho);

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

  const R0 = rtdR0(type);

  if (mode === 't2r') {
    if (val < RTD_RANGE[0] || val > RTD_RANGE[1]) {
      toast(`Диапазон ${RTD_RANGE[0]}…${RTD_RANGE[1]} °C`);
      return;
    }
    $('#rt-result-val').textContent = round(val, 1);
    $('#rt-result-unit').textContent = '°C → ' + round(rtdResistance(R0, val), 3) + ' Ом';
  } else {
    if (!(val > 0)) { toast('Введите значение'); return; }
    $('#rt-result-val').textContent = round(val, 3);
    $('#rt-result-unit').textContent = 'Ом → ' + round(rtdTemperature(R0, val), 2) + ' °C';
  }
}

/* ===================== THERMOCOUPLE TABLE ====================
 * Обратные полиномы NIST ITS-90 (мВ → °C). Каждый набор действует только в
 * своём поддиапазоне: range — по температуре, mvMax — соответствующий предел
 * по термо-ЭДС. За границей полином расходится, поэтому вход проверяется.
 *
 * ВНИМАНИЕ. У типа K это набор для 0…500 °C, а не для всей шкалы до 1372 °C:
 * раньше здесь стояла подпись [0, 1372], и она вводила в заблуждение.
 */
export const TC_COEFFS = {
  'K': { range: [0, 500],  mvMax: 20.644, c: [0, 25.08355, 7.860106e-2, -2.503131e-1, 8.315270e-2, -1.228034e-2, 9.804036e-4, -4.413030e-5, 1.057734e-6, -1.052755e-8] },
  'J': { range: [0, 760],  mvMax: 42.919, c: [0, 1.978425e1, -2.001204e-1, 1.036969e-2, -2.549687e-4, 3.585153e-6, -5.344285e-8, 5.099890e-10] },
  'T': { range: [0, 400],  mvMax: 20.872, c: [0, 2.5949192e1, -2.1316967e-1, 7.9916180e-3, -4.2695200e-5] },
  'E': { range: [0, 1000], mvMax: 76.373, c: [0, 1.6977288e1, -4.3514970e-1, -1.5859697e-3, 9.2502871e-5, -2.6084314e-7] }
};

export function calcThermocouple() {
  const type = $('#tc-type').value;
  const mode = $('#tc-mode').value;
  const val = num('tc-val');

  if (isNaN(val)) { toast('Введите значение'); return; }

  const tc = TC_COEFFS[type];
  if (!tc) { toast('Неизвестный тип термопары'); return; }

  if (mode === 'mv2c') {
    if (val < 0 || val > tc.mvMax) {
      toast(`Для типа ${type} диапазон 0…${tc.mvMax} мВ`);
      return;
    }
    const t = mvToC(tc, val);
    $('#tc-result-val').textContent = round(val, 3);
    $('#tc-result-unit').textContent = 'мВ → ' + round(t, 1) + ' °C';
  } else {
    if (val < tc.range[0] || val > tc.range[1]) {
      toast(`Для типа ${type} диапазон ${tc.range[0]}…${tc.range[1]} °C`);
      return;
    }
    const mv = cToMv(tc, val);
    $('#tc-result-val').textContent = round(val, 1);
    $('#tc-result-unit').textContent = '°C → ' + round(mv, 3) + ' мВ';
  }
}

/**
 * Термо-ЭДС → температура по полиному NIST ITS-90.
 * @param {{c:number[]}} tc набор коэффициентов
 * @param {number} mv термо-ЭДС, мВ
 * @returns {number} температура, °C
 */
export function mvToC(tc, mv) {
  let t = 0;
  for (let i = 1; i < tc.c.length; i++) t += tc.c[i] * Math.pow(mv, i);
  return t;
}

/**
 * Температура → термо-ЭДС.
 *
 * Прямого полинома T→E в таблице нет, и подставлять температуру в обратный
 * полином нельзя — это другая функция, ошибка получается на порядки. Поэтому
 * обратное преобразование считается численно: mvToC монотонно возрастает,
 * значит корень уравнения mvToC(mv) = t ищется делением отрезка пополам.
 * Так прямое и обратное преобразования согласованы между собой по определению.
 *
 * @param {{c:number[], range:number[]}} tc набор коэффициентов
 * @param {number} tC температура, °C
 * @returns {number} термо-ЭДС, мВ
 */
export function cToMv(tc, tC) {
  let lo = 0, hi = tc.mvMax;            // за mvMax полином расходится и теряет монотонность
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (mvToC(tc, mid) < tC) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
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
  const rho = 1.2 * (P + 1);     // плотность воздуха при избыточном давлении P, кг/м³

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
    Ptotal += P * qty / 1000;            // таблица в ваттах, итог показываем в кВт
    dailyKWh += daily;
  });

  const monthlyKWh = dailyKWh * 30;
  const yearlyKWh = dailyKWh * 365;
  cost = monthlyKWh * price;

  $('#ea-Ptotal').textContent = round(Ptotal, 2) + ' кВт';
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

  rows.forEach(row => {
    const d = parseFloat(row.querySelector('.ct-d')?.value) || 0;
    const qty = parseInt(row.querySelector('.ct-q')?.value) || 1;
    totalCableArea += Math.PI * d * d / 4 * qty;
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
