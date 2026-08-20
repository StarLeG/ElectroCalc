/* EngiCalc — подбор соединительной гильзы и её заполнение
 *
 * Задача монтажника: скрутить в одну гильзу несколько проводников и понять,
 * тот ли это типоразмер. Гильза подбирается по СУММАРНОМУ сечению жил — так
 * устроены каталоги, — а заполнение считается по площади канала, потому что
 * именно оно решает, соберётся соединение или гильзу порвёт при опрессовке.
 *
 * calcSleeve() и sleeveWireLayout() — чистые функции без DOM, их зовут тесты.
 * Ниже них — обвязка страницы.
 */
'use strict';

import { $, round, toast, T, lang } from './core.js';
import { ALL_SECTIONS } from './data/cable-data.js';
import { SLEEVES, SLEEVE_FAMILIES, FLEX_FILL, FILL_LIMITS } from './data/sleeve-data.js';

/**
 * Материал жил -> допустимый материал гильзы.
 *
 * Соединять медь с алюминием обычной гильзой нельзя: влага замыкает пару в
 * гальванический элемент, алюминий разрушается, контакт греется и выгорает.
 * Отсюда отдельный вариант 'cu-al', отбирающий только биметалл.
 */
const SLEEVE_MATERIAL = { cu: 'cu', al: 'al', 'cu-al': 'bi' };

/**
 * Подобрать гильзу под набор скручиваемых жил.
 *
 * @param {{conductors: {S:number, qty:number}[], material: string, flexClass: number}} input
 */
export function calcSleeve({ conductors = [], material = 'cu', flexClass = 1, family = '' } = {}) {
  const fill = FLEX_FILL[flexClass] ?? FLEX_FILL[1];
  const sleeveMaterial = SLEEVE_MATERIAL[material] ?? 'cu';

  const range = SLEEVES.filter(s => s.material === sleeveMaterial && (!family || s.family === family));
  if (!range.length) return { ok: false, messageKey: 'sleeve.err_no_family' };

  if (conductors.some(c => c.S < 0 || c.qty < 0)) return { ok: false, messageKey: 'sleeve.err_section' };

  // sumS — величина, по которой гильза подбирается в каталогах.
  // condArea — площадь, которую жилы реально занимают в канале.
  const sumS = conductors.reduce((acc, c) => acc + c.S * c.qty, 0);
  const condArea = conductors.reduce((acc, c) => acc + (c.S / fill) * c.qty, 0);
  if (!(sumS > 0)) return { ok: false, messageKey: 'sleeve.err_empty' };

  const warnings = [];
  const biggest = range[range.length - 1];
  if (sumS > biggest.sMax) return { ok: false, messageKey: 'sleeve.err_over_range' };

  // Ниже ряда отказывать незачем: наименьшая гильза подходит, её только надо
  // добить проволокой. Предупреждение при этом обязательно — соединение вне
  // штатного применения типоразмера.
  let sleeve = range.find(s => sumS >= s.sMin && sumS <= s.sMax);
  if (!sleeve) {
    sleeve = range[0];
    warnings.push('sleeve.warn_below_range');
  }

  const channel = Math.PI * sleeve.dIn ** 2 / 4;
  const fillPct = condArea / channel * 100;

  const status = fillPct < FILL_LIMITS.loose ? 'loose'
    : fillPct < FILL_LIMITS.tight ? 'ok'
    : fillPct <= FILL_LIMITS.over ? 'tight' : 'over';

  // Добивка: сколько мм² проволоки доложить, чтобы дойти до нижнего порога.
  const filler = Math.max(0, channel * FILL_LIMITS.loose / 100 - condArea);

  if (status === 'loose') warnings.push('sleeve.warn_filler');
  if (status === 'tight') warnings.push('sleeve.warn_tight');
  if (status === 'over') warnings.push('sleeve.warn_over_fill');

  return { ok: true, sumS, condArea, sleeve, fillPct, status, filler, warnings };
}

/**
 * Разложить жилы концентрическими кольцами для разреза гильзы.
 *
 * Толстая жила уходит в центр, остальные встают кольцом вокруг неё; сколько
 * штук помещается в кольцо, считается по углу, который занимает жила на его
 * окружности. Укладка приблизительная и служит наглядности: при плотном
 * заполнении круги могут выйти за канал — реальные жилы в этом месте сминаются
 * при опрессовке, а рисунок этого показать не умеет.
 *
 * @param {{S:number, qty:number}[]} conductors
 * @param {number} flexClass класс гибкости — от него зависит габарит жилы
 * @returns {{x:number, y:number, d:number}[]} координаты центров и диаметры, мм
 */
export function sleeveWireLayout(conductors = [], flexClass = 1) {
  const fill = FLEX_FILL[flexClass] ?? FLEX_FILL[1];

  const diameters = [];
  for (const c of conductors) {
    if (!(c.S > 0) || !(c.qty > 0)) continue;
    const d = 2 * Math.sqrt(c.S / fill / Math.PI);
    for (let i = 0; i < c.qty; i++) diameters.push(d);
  }
  diameters.sort((a, b) => b - a);
  if (!diameters.length) return [];

  const wires = [{ x: 0, y: 0, d: diameters[0] }];
  let ringRadius = diameters[0] / 2;

  for (let i = 1; i < diameters.length;) {
    const d = diameters[i];
    const r = ringRadius + d / 2;

    // Половина угла, который жила занимает на окружности кольца. Если жила
    // толще самого кольца, в него встаёт одна штука — дальше кольцо растёт.
    const halfAngle = Math.asin(Math.min(1, d / (2 * r)));
    const capacity = Math.max(1, Math.floor(Math.PI / halfAngle));
    const count = Math.min(capacity, diameters.length - i);

    for (let k = 0; k < count; k++) {
      const a = 2 * Math.PI * k / count;
      wires.push({ x: r * Math.cos(a), y: r * Math.sin(a), d });
    }
    i += count;
    ringRadius = r + d / 2;
  }
  return wires;
}


/**
 * Во сколько раз ужать раскладку, чтобы она поместилась в канал.
 *
 * Круги той же площади укладываются в канал хуже реальных жил: жила при
 * опрессовке сминается и заполняет углы между соседками, а круг остаётся
 * кругом. Из-за этого честный масштаб показывал бы жилы за стенкой канала уже
 * при 70 % заполнения — то есть спорил бы со статусом «норма». Поэтому
 * раскладка вписывается в канал, и наружу жилы выходят только при
 * переполнении, где это и есть ответ калькулятора.
 *
 * @param {{x:number, y:number, d:number}[]} wires раскладка
 * @param {number} channelR радиус канала, мм
 * @param {string} status статус заполнения
 * @returns {number} коэффициент масштаба, не больше 1
 */
export function sleeveCutScale(wires = [], channelR = 0, status = 'ok') {
  if (status === 'over') return 1;
  const reach = wires.reduce((max, w) => Math.max(max, Math.hypot(w.x, w.y) + w.d / 2), 0);
  if (!(reach > channelR)) return 1;
  return channelR / reach;
}


/* ===================== СТРАНИЦА ===================== */

/** Сколько строк проводников можно завести на странице. */
const MAX_ROWS = 10;

/** Цвет заливки жил в разрезе — тот же токен, что и у плитки статуса. */
const STATUS_COLOR = {
  loose: 'var(--warn)',
  ok: 'var(--result)',
  tight: 'var(--warn)',
  over: 'var(--error)'
};

/** Класс плитки статуса. */
const STATUS_CLASS = { loose: 'state-warn', ok: 'state-ok', tight: 'state-warn', over: 'state-error' };

/** Строка таблицы проводников: сечение из ряда и количество. */
function rowHtml(section = 2.5, qty = 2) {
  const options = ALL_SECTIONS
    .map(S => `<option value="${S}"${S === section ? ' selected' : ''}>${S}</option>`)
    .join('');
  return `<td><select class="tbl-input slv-s">${options}</select></td>
    <td><input type="number" class="tbl-input slv-q" min="1" max="20" value="${qty}"></td>`;
}

/** Добавляет строку проводника. */
export function addSleeveRow() {
  const tbody = document.querySelector('#slv-table tbody');
  if (!tbody || tbody.children.length >= MAX_ROWS) return;
  const tr = document.createElement('tr');
  tr.innerHTML = rowHtml();
  tbody.appendChild(tr);
}

/** Убирает последнюю строку, не давая опустошить таблицу. */
export function removeSleeveRow() {
  const tbody = document.querySelector('#slv-table tbody');
  if (tbody && tbody.children.length > 1) tbody.removeChild(tbody.lastElementChild);
}

/** Заполняет список семейств и заводит первую строку таблицы. */
export function initSleeveForm() {
  const family = $('#slv-family');
  if (!family) return;

  const any = family.querySelector('option[value=""]');
  family.innerHTML = '';
  if (any) family.appendChild(any);
  for (const [id, f] of Object.entries(SLEEVE_FAMILIES)) {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = id;
    opt.title = lang === 'en' ? f.noteEn : f.noteRu;
    family.appendChild(opt);
  }

  const tbody = document.querySelector('#slv-table tbody');
  if (tbody && !tbody.children.length) {
    const tr = document.createElement('tr');
    tr.innerHTML = rowHtml();
    tbody.appendChild(tr);
  }
}

/** Читает таблицу проводников. */
function readConductors() {
  return [...document.querySelectorAll('#slv-table tbody tr')].map(row => ({
    S: parseFloat(row.querySelector('.slv-s')?.value),
    qty: parseInt(row.querySelector('.slv-q')?.value, 10)
  }));
}

/**
 * Рисует разрез: канал гильзы и жилы в нём.
 *
 * Масштаб берётся по большему из двух радиусов — канала и раскладки, — иначе
 * при переполнении жилы уехали бы за край картинки и переполнение перестало бы
 * быть видно именно там, где о нём важнее всего сказать.
 */
function renderCut(res, conductors, flexClass) {
  const wires = sleeveWireLayout(conductors, flexClass);
  const channelR = res.sleeve.dIn / 2;
  const wallR = res.sleeve.dOut / 2;
  const scale = sleeveCutScale(wires, channelR, res.status);
  const reach = wires.reduce((max, w) => Math.max(max, Math.hypot(w.x, w.y) + w.d / 2), 0) * scale;
  const view = Math.max(wallR, reach) * 2.1;
  const color = STATUS_COLOR[res.status];

  const circles = wires
    .map(w => `<circle cx="${round(w.x * scale, 3)}" cy="${round(w.y * scale, 3)}" r="${round(w.d * scale / 2, 3)}"
      fill="${color}" fill-opacity="0.55" stroke="${color}" stroke-width="${round(view / 200, 3)}"/>`)
    .join('');

  return `<svg viewBox="${-view / 2} ${-view / 2} ${view} ${view}" role="img"
    aria-label="Разрез гильзы ${res.sleeve.id}">
    <circle cx="0" cy="0" r="${wallR}" fill="var(--bg-input)" stroke="var(--text-muted)"
      stroke-width="${round(view / 150, 3)}"/>
    <circle cx="0" cy="0" r="${channelR}" fill="var(--bg-base)" stroke="var(--border)"
      stroke-width="${round(view / 200, 3)}"/>
    ${circles}
  </svg>`;
}

/** Расчёт по кнопке: читает форму, считает, рисует результат и разрез. */
export function calcSleeveFill() {
  const conductors = readConductors();
  const flexClass = parseInt($('#slv-flex')?.value, 10) || 1;
  const res = calcSleeve({
    conductors,
    material: $('#slv-material')?.value || 'cu',
    flexClass,
    family: $('#slv-family')?.value || ''
  });

  if (!res.ok) {
    toast(T(res.messageKey));
    return;
  }

  const mm2 = T('sleeve.mm2');
  const mm = T('sleeve.unit_mm');

  $('#slv-result-val').textContent = res.sleeve.id;
  $('#slv-sum').textContent = round(res.sumS, 2) + ' ' + mm2;
  $('#slv-fill').textContent = round(res.fillPct, 1) + ' %';
  $('#slv-die').textContent = res.sleeve.die;
  $('#slv-geometry').textContent =
    `⌀${res.sleeve.dIn} / ${res.sleeve.dOut} ${mm} · ${res.sleeve.len} ${mm}`;
  $('#slv-filler').textContent = res.filler > 0
    ? round(res.filler, 2) + ' ' + mm2
    : T('sleeve.no_filler');

  const status = $('#slv-status');
  status.textContent = T('sleeve.status_' + res.status);
  status.className = 'val ' + STATUS_CLASS[res.status];

  $('#slv-section').innerHTML = renderCut(res, conductors, flexClass);

  $('#slv-warnings').innerHTML = res.warnings
    .map(key => `<div class="warn-item">${T(key)}</div>`)
    .join('');
}
