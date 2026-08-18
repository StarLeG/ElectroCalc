/* EngiCalc — расчёт светодиодных лент: сечение провода, точки питания, блок питания
 *
 * Главное отличие от расчёта силового кабеля: у ленты нагрузка распределённая.
 * Ток убывает вдоль трассы, потому что светодиоды разбирают его по пути, и
 * падение на дорожках получается интегралом, а не произведением:
 *
 *     ΔU = r · i · L² / 2      (питание с одного конца)
 *
 * Зависимость квадратичная по длине. Отсюда практический вывод, ради которого
 * калькулятор и нужен: питание с двух концов снижает просадку вчетверо, а не
 * вдвое, и на длинных трассах вторая точка питания даёт больше, чем любое
 * утолщение провода.
 *
 * calcStripSystem() — чистая функция без DOM, её вызывают тесты.
 * calcLedStrip()    — обвязка страницы.
 */
'use strict';

import { $, num, round, toast, T } from './core.js';
import {
  CABLE_TABLE, RESISTIVITY, K_LAYING, K_TEMP_AIR, K_CORES,
  interpolateK, nextStandard
} from './data/cable-data.js';
import {
  STRIP_TYPES, PSU_RATINGS, PSU_RESERVE, SMALL_WIRE_TABLE,
  MIN_SECTION_MECHANICAL, MAX_RUN_RULE,
  stripDropDivisor, feedCurrentShare
} from './data/led-strip-data.js';
import { plotXY, plotLegend, themeColor, SERIES_COLORS } from './chart.js';

/** Полный ряд проводов: мелкие монтажные сечения плюс силовая таблица. */
const WIRE_TABLE = [...SMALL_WIRE_TABLE, ...CABLE_TABLE];

/** Порог, выше которого просадка считается недопустимой при любых настройках, %. */
const HARD_DROP_LIMIT = 10;

/** Верхняя граница перебора числа точек питания. */
const MAX_FEED_POINTS = 20;

/** Число точек, по которым строится эпюра одной ленты. */
const PROFILE_SAMPLES = 120;

/** Приоритет критериев при равном требуемом сечении. */
const CRITERIA_ORDER = ['heating', 'drop', 'mechanical'];

/**
 * Число с подстановкой значения по умолчанию: пустое поле даёт NaN, а не
 * undefined, поэтому `??` тут не помогает.
 * @param {*} value исходное значение
 * @param {number} fallback значение по умолчанию
 * @returns {number}
 */
function numOr(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Суммарный поправочный коэффициент к табличному допустимому току провода.
 * Лента питается двухжильным проводом, поэтому число нагруженных жил — 2.
 * @param {object} inp нормализованные входные данные
 * @returns {number}
 */
function wireDerating(inp) {
  const laying = K_LAYING[inp.laying] ?? 1;
  const temp = interpolateK(K_TEMP_AIR, inp.ambientTemp);
  return laying * temp * (K_CORES[2] ?? 1);
}

/**
 * Просадка на токоведущих дорожках ленты.
 * @param {object} strip параметры ленты
 * @param {number} currentPerMeter ток на метр, А/м
 * @returns {number} падение до самого дальнего светодиода, В
 */
function stripDrop(strip, currentPerMeter) {
  const divisor = stripDropDivisor(strip.feedScheme, strip.feedPoints);
  return strip.trackResistance * currentPerMeter * strip.length ** 2 / divisor;
}

/**
 * Падение на двухпроводной линии постоянного тока.
 * @param {number} current ток, А
 * @param {number} length длина линии в одну сторону, м
 * @param {number} section сечение жилы, мм²
 * @param {string} material 'Cu' или 'Al'
 * @param {number} parallel число параллельных проводов
 * @returns {number} падение, В
 */
function wireDrop(current, length, section, material, parallel) {
  const rho = RESISTIVITY[material] ?? RESISTIVITY.Cu;
  return 2 * current * length * rho / (section * Math.max(1, parallel));
}

/**
 * Допустимый ток провода с учётом условий прокладки.
 * @param {object} row строка WIRE_TABLE
 * @param {object} inp нормализованные входные данные
 * @returns {number} ток, А
 */
function wireAmpacity(row, inp) {
  const base = inp.material === 'Al' ? row.IAl : row.ICu;
  return base * wireDerating(inp) * Math.max(1, inp.parallelWires);
}

/**
 * Подбор сечения одного участка провода.
 *
 * @param {object} inp нормализованные входные данные
 * @param {number} current ток участка, А
 * @param {number} length длина участка, м
 * @param {number} dropBudget сколько вольт разрешено потерять на этом участке
 * @returns {object|null} {section, drop, allowedCurrent, limiting, criteria} либо null
 */
function selectWire(inp, current, length, dropBudget) {
  const evaluated = WIRE_TABLE.map(row => {
    const drop = length > 0 ? wireDrop(current, length, row.S, inp.material, inp.parallelWires) : 0;
    const allowed = wireAmpacity(row, inp);
    return {
      section: row.S,
      drop,
      allowedCurrent: allowed,
      checks: {
        heating: allowed >= current,
        drop: drop <= dropBudget,
        mechanical: row.S >= MIN_SECTION_MECHANICAL
      }
    };
  });

  const names = Object.keys(evaluated[0].checks);
  const required = {};
  for (const name of names) {
    const hit = evaluated.find(e => e.checks[name]);
    required[name] = hit ? hit.section : null;
  }

  const best = evaluated.find(e => names.every(n => e.checks[n]));
  if (!best) return null;

  const limiting = CRITERIA_ORDER.find(n => names.includes(n) && required[n] === best.section) ?? null;

  return {
    section: best.section,
    drop: best.drop,
    allowedCurrent: best.allowedCurrent,
    limiting,
    criteria: names.map(name => ({ name, required: required[name], passed: best.checks[name] }))
  };
}

/**
 * Наименьшее число точек питания, при котором лента укладывается в бюджет.
 * @param {object} strip параметры ленты
 * @param {number} currentPerMeter ток на метр, А/м
 * @param {number} budget допустимая просадка на дорожках, В
 * @returns {number|null} число точек либо null, если не помогает и двадцать
 */
function optimalFeedPoints(strip, currentPerMeter, budget) {
  if (stripDrop({ ...strip, feedScheme: 'one' }, currentPerMeter) <= budget) return 1;
  for (let n = 2; n <= MAX_FEED_POINTS; n++) {
    const probe = { ...strip, feedScheme: 'multi', feedPoints: n };
    if (stripDrop(probe, currentPerMeter) <= budget) return n;
  }
  return null;
}

/**
 * Эпюра напряжения вдоль ленты.
 *
 * Питание с одного конца: U(x) = Uвх − r·i·(L·x − x²/2).
 * Пролёт, питаемый с двух сторон: U(x) = Uвх − r·i·(ℓ·x/2 − x²/2), где x —
 * координата внутри пролёта. Кривая кусочно-параболическая и симметричная
 * внутри каждого пролёта.
 *
 * @param {object} strip параметры ленты
 * @param {number} currentPerMeter ток на метр, А/м
 * @param {number} feedVoltage напряжение в точке питания, В
 * @returns {Array<[number, number]>} точки [координата, напряжение]
 */
function voltageProfile(strip, currentPerMeter, feedVoltage) {
  const { length: L, trackResistance: r, feedScheme } = strip;
  const k = r * currentPerMeter;
  const points = [];

  const spans = feedScheme === 'one'
    ? 1
    : feedScheme === 'multi'
      ? Math.max(1, (Math.floor(strip.feedPoints) || 2) - 1)
      : 1;
  const spanLength = feedScheme === 'one' ? L : L / spans;

  for (let i = 0; i <= PROFILE_SAMPLES; i++) {
    const x = L * i / PROFILE_SAMPLES;
    let u;
    if (feedScheme === 'one') {
      u = feedVoltage - k * (L * x - x * x / 2);
    } else {
      const local = x % spanLength;
      // Хвост последнего пролёта из-за плавающей точки может дать local ≈ spanLength,
      // формула это переносит корректно: на границе пролёта просадка нулевая.
      u = feedVoltage - k * (spanLength * local / 2 - local * local / 2);
    }
    points.push([x, u]);
  }
  return points;
}

/**
 * Нормализация описания одной ленты.
 * @param {object} raw сырые данные ленты
 * @param {object} inp общие параметры
 * @param {number} index порядковый номер
 * @returns {object}
 */
function normalizeStrip(raw, inp, index) {
  const preset = STRIP_TYPES.find(t => t.id === raw.stripType);
  return {
    label: raw.label || `${index + 1}`,
    length: numOr(raw.length, 0),
    wattPerMeter: numOr(raw.wattPerMeter, preset?.wattPerMeter ?? 14.4),
    trackResistance: numOr(raw.trackResistance, preset?.trackResistance ?? 0.6),
    branchLength: numOr(raw.branchLength, 0),
    feedScheme: raw.feedScheme ?? 'one',
    feedPoints: numOr(raw.feedPoints, 2)
  };
}

/**
 * Проверка входных данных.
 * @param {object} inp нормализованные входные данные
 * @returns {string|null} ключ сообщения об ошибке либо null
 */
function validateInput(inp) {
  if (!(inp.voltage > 0)) return 'ledstrip.err_voltage';
  if (!(inp.maxDropPercent > 0)) return 'ledstrip.err_drop';
  if (!(inp.parallelWires >= 1)) return 'ledstrip.err_parallel';
  if (!inp.strips.length) return 'ledstrip.err_no_strips';
  for (const strip of inp.strips) {
    if (!(strip.length > 0)) return 'ledstrip.err_length';
    if (!(strip.wattPerMeter > 0)) return 'ledstrip.err_power';
    if (!(strip.trackResistance >= 0)) return 'ledstrip.err_track';
    if (strip.feedScheme === 'multi' && !(strip.feedPoints >= 2)) return 'ledstrip.err_points';
  }
  return null;
}

/**
 * Расчёт системы «блок питания — провод — лента».
 *
 * @param {object} raw входные данные, см. поля ниже
 * @returns {object} {ok, error?, ...результаты}
 */
export function calcStripSystem(raw) {
  const inp = {
    mode: raw.mode === 'multi-strip' ? 'multi-strip' : 'single',
    voltage: numOr(raw.voltage, 24),
    material: raw.material === 'Al' ? 'Al' : 'Cu',
    parallelWires: numOr(raw.parallelWires, 1),
    maxDropPercent: numOr(raw.maxDropPercent, 5),
    ambientTemp: numOr(raw.ambientTemp, 25),
    laying: raw.laying ?? 'air',
    psuReserve: numOr(raw.psuReserve, PSU_RESERVE.recommended),
    psuLimitWatts: numOr(raw.psuLimitWatts, 0),
    commonWireLength: numOr(raw.commonWireLength, 0),
    strips: []
  };

  if (inp.mode === 'single') {
    inp.strips = [normalizeStrip({
      label: raw.label,
      length: raw.length,
      wattPerMeter: raw.wattPerMeter,
      trackResistance: raw.trackResistance,
      stripType: raw.stripType,
      branchLength: raw.wireLength,
      feedScheme: raw.feedScheme,
      feedPoints: raw.feedPoints
    }, inp, 0)];
    inp.commonWireLength = 0;
  } else {
    inp.strips = (raw.strips ?? []).map((s, i) => normalizeStrip(s, inp, i));
  }

  const error = validateInput(inp);
  if (error) return { ok: false, error };

  const budgetVolts = inp.voltage * inp.maxDropPercent / 100;

  // Ток и мощность каждой ленты.
  const stripState = inp.strips.map(strip => {
    const currentPerMeter = strip.wattPerMeter / inp.voltage;
    const current = currentPerMeter * strip.length;
    return {
      strip,
      currentPerMeter,
      current,
      power: strip.wattPerMeter * strip.length,
      dropStrip: stripDrop(strip, currentPerMeter),
      feedCurrent: current * feedCurrentShare(strip.feedScheme, strip.feedPoints)
    };
  });

  const totalCurrent = stripState.reduce((sum, s) => sum + s.current, 0);
  const totalPower = stripState.reduce((sum, s) => sum + s.power, 0);

  // Общий провод подбирается перебором: берём первое сечение, при котором все
  // ветки укладываются в допуск. Так бюджет падения распределяется сам, без
  // произвольной константы вроде «половина на магистраль».
  let commonWire = null;
  let branches = null;

  const commonCandidates = inp.commonWireLength > 0
    ? WIRE_TABLE
    : [WIRE_TABLE[0]];

  for (const row of commonCandidates) {
    const drop = inp.commonWireLength > 0
      ? wireDrop(totalCurrent, inp.commonWireLength, row.S, inp.material, inp.parallelWires)
      : 0;
    const allowed = wireAmpacity(row, inp);
    if (inp.commonWireLength > 0 && allowed < totalCurrent) continue;
    if (drop >= budgetVolts) continue;

    const attempt = stripState.map(state => {
      const rest = budgetVolts - drop - state.dropStrip;
      if (rest < 0) return null;
      return selectWire(inp, state.feedCurrent, state.strip.branchLength, rest);
    });

    if (attempt.every(Boolean)) {
      commonWire = inp.commonWireLength > 0
        ? { current: totalCurrent, section: row.S, drop, allowedCurrent: allowed }
        : null;
      branches = attempt;
      break;
    }
  }

  // Ни одно сечение не укладывается в допуск — почти всегда потому, что бюджет
  // съеден просадкой на самих дорожках. Провод всё равно надо чем-то показать,
  // и берём его так, будто лента идеальна: это лучшее, что провод может дать.
  // Тогда «оптимум точек питания» считается от реального остатка бюджета и
  // выдаёт полезное число, а не null. Если и так не выходит — только по нагреву.
  const failed = !branches;
  if (failed) {
    const commonRow = inp.commonWireLength > 0
      ? (selectWire(inp, totalCurrent, inp.commonWireLength, budgetVolts)
         ?? selectWire(inp, totalCurrent, inp.commonWireLength, Infinity))
      : null;
    const drop = commonRow ? commonRow.drop : 0;
    commonWire = commonRow
      ? { current: totalCurrent, section: commonRow.section, drop, allowedCurrent: commonRow.allowedCurrent }
      : null;
    const rest = Math.max(0, budgetVolts - drop);
    branches = stripState.map(state =>
      selectWire(inp, state.feedCurrent, state.strip.branchLength, rest)
      ?? selectWire(inp, state.feedCurrent, state.strip.branchLength, Infinity));
  }

  const commonDrop = commonWire ? commonWire.drop : 0;

  const result = stripState.map((state, i) => {
    const wire = branches[i];
    const dropTotal = commonDrop + (wire?.drop ?? 0) + state.dropStrip;
    const rho = RESISTIVITY[inp.material];
    const wireOhms = state.strip.branchLength > 0 && wire
      ? 2 * state.strip.branchLength * rho / (wire.section * Math.max(1, inp.parallelWires))
      : 0;
    return {
      label: state.strip.label,
      length: state.strip.length,
      currentPerMeter: state.currentPerMeter,
      current: state.current,
      power: state.power,
      feedCurrent: state.feedCurrent,
      feedScheme: state.strip.feedScheme,
      feedPoints: state.strip.feedScheme === 'multi' ? state.strip.feedPoints : null,
      section: wire?.section ?? null,
      allowedCurrent: wire?.allowedCurrent ?? null,
      limiting: wire?.limiting ?? null,
      criteria: wire?.criteria ?? [],
      dropWire: (wire?.drop ?? 0) + commonDrop,
      dropStrip: state.dropStrip,
      dropTotal,
      dropPercent: dropTotal / inp.voltage * 100,
      minVoltage: inp.voltage - dropTotal,
      powerLoss: state.feedCurrent ** 2 * wireOhms,
      optimalFeedPoints: optimalFeedPoints(
        state.strip, state.currentPerMeter,
        Math.max(0, budgetVolts - commonDrop - (wire?.drop ?? 0))
      )
    };
  });

  // Худшая ветка — с максимальной суммой просадок, а не самая длинная лента:
  // короткая лента на длинном ответвлении легко обгоняет длинную на коротком.
  let worstBranch = 0;
  for (let i = 1; i < result.length; i++) {
    if (result[i].dropTotal > result[worstBranch].dropTotal) worstBranch = i;
  }
  const worst = result[worstBranch];

  const psuWatts = totalPower * inp.psuReserve;
  const psu = {
    required: psuWatts,
    watts: nextStandard(PSU_RATINGS, psuWatts) ?? 0,
    current: psuWatts / inp.voltage,
    reserve: inp.psuReserve,
    enough: inp.psuLimitWatts > 0 ? inp.psuLimitWatts >= psuWatts : null
  };

  // Эпюра: напряжение в точке питания ленты за вычетом просадки на проводах.
  const profile = result.map((branch, i) => ({
    label: branch.label,
    points: voltageProfile(
      inp.strips[i], stripState[i].currentPerMeter,
      inp.voltage - branch.dropWire
    )
  }));

  return {
    ok: true,
    mode: inp.mode,
    voltage: inp.voltage,
    budgetVolts,
    totalCurrent,
    totalPower,
    commonWire,
    branches: result,
    worstBranch,
    dropTotal: worst.dropTotal,
    dropPercent: worst.dropPercent,
    minVoltage: worst.minVoltage,
    psu,
    profile,
    warnings: collectWarnings(inp, result, worst, psu, failed)
  };
}

/**
 * Предупреждения о нестандартных и опасных ситуациях.
 * @param {object} inp нормализованные входные данные
 * @param {object[]} branches результаты по веткам
 * @param {object} worst худшая ветка
 * @param {object} psu параметры блока питания
 * @param {boolean} failed не удалось уложиться в допуск ни одним сечением
 * @returns {string[]} ключи сообщений
 */
function collectWarnings(inp, branches, worst, psu, failed) {
  const warnings = [];

  if (failed) warnings.push('ledstrip.warn_no_solution');

  // Просадка на дорожках не зависит от провода: если она одна съела бюджет,
  // утолщать провод бесполезно, нужны точки питания или другое напряжение.
  if (worst.dropStrip > inp.voltage * inp.maxDropPercent / 100) {
    warnings.push('ledstrip.warn_strip_dominates');
  }
  if (worst.dropPercent > HARD_DROP_LIMIT) warnings.push('ledstrip.warn_over_hard_limit');

  const rule = MAX_RUN_RULE[inp.voltage];
  if (rule) {
    const longRun = inp.strips.some((s, i) =>
      branches[i].feedScheme === 'one' && s.length > rule);
    if (longRun) warnings.push('ledstrip.warn_max_run');
  }

  if (inp.voltage <= 12 && inp.strips.some(s => s.length > 5)) {
    warnings.push('ledstrip.warn_prefer_24v');
  }
  if (psu.enough === false) warnings.push('ledstrip.warn_psu_small');
  if (psu.watts === 0) warnings.push('ledstrip.warn_psu_range');
  if (inp.parallelWires > 1) warnings.push('ledstrip.warn_parallel');
  if (branches.some(b => b.optimalFeedPoints === null)) {
    warnings.push('ledstrip.warn_feed_points_hopeless');
  }

  return warnings;
}

/* ─────────────────────────── обвязка страницы ─────────────────────────── */

/** Значение выпадающего списка по id. */
const sel = id => document.getElementById(id)?.value;

/** Разметка строки таблицы лент. */
function stripRowHtml(index) {
  const options = ['one', 'both', 'multi']
    .map(v => `<option value="${v}">${T('ledstrip.scheme_' + v)}</option>`).join('');
  return `<td><input type="text" value="${T('ledstrip.strip')} ${index}" class="tbl-input lst-label"></td>`
    + `<td><input type="number" step="0.1" min="0" value="5" class="tbl-input lst-len"></td>`
    + `<td><input type="number" step="0.1" min="0" value="14.4" class="tbl-input lst-wpm"></td>`
    + `<td><input type="number" step="0.01" min="0" value="0.6" class="tbl-input lst-r"></td>`
    + `<td><input type="number" step="0.1" min="0" value="2" class="tbl-input lst-branch"></td>`
    + `<td><select class="tbl-input lst-scheme">${options}</select></td>`;
}

/** Добавляет строку в таблицу лент. */
export function addStripRow() {
  const tbody = document.querySelector('#lst-table tbody');
  if (!tbody) return;
  const tr = document.createElement('tr');
  tr.innerHTML = stripRowHtml(tbody.children.length + 1);
  tbody.appendChild(tr);
}

/** Убирает последнюю строку, не давая опустошить таблицу. */
export function removeStripRow() {
  const tbody = document.querySelector('#lst-table tbody');
  if (tbody && tbody.children.length > 1) tbody.removeChild(tbody.lastElementChild);
}

/** Читает таблицу лент. */
function readStripTable() {
  return [...document.querySelectorAll('#lst-table tbody tr')].map(row => ({
    label: row.querySelector('.lst-label')?.value,
    length: parseFloat(row.querySelector('.lst-len')?.value),
    wattPerMeter: parseFloat(row.querySelector('.lst-wpm')?.value),
    trackResistance: parseFloat(row.querySelector('.lst-r')?.value),
    branchLength: parseFloat(row.querySelector('.lst-branch')?.value),
    feedScheme: row.querySelector('.lst-scheme')?.value
  }));
}

/** Собирает входные данные со страницы. */
function readForm() {
  const mode = sel('lst-mode');
  const common = {
    mode,
    voltage: num('lst-U'),
    material: sel('lst-mat'),
    parallelWires: num('lst-par'),
    maxDropPercent: num('lst-drop'),
    ambientTemp: num('lst-temp'),
    laying: sel('lst-lay'),
    psuReserve: num('lst-reserve'),
    psuLimitWatts: num('lst-psu-have')
  };

  if (mode === 'multi-strip') {
    return { ...common, commonWireLength: num('lst-common'), strips: readStripTable() };
  }

  return {
    ...common,
    stripType: sel('lst-type'),
    wattPerMeter: num('lst-wpm'),
    trackResistance: num('lst-r'),
    length: num('lst-L'),
    feedScheme: sel('lst-scheme'),
    feedPoints: num('lst-points'),
    wireLength: num('lst-wire')
  };
}

/**
 * Приводит форму в согласованное состояние: показывает блок нужного режима
 * и поле числа точек только для схемы с несколькими точками.
 */
function syncStripForm() {
  const multi = sel('lst-mode') === 'multi-strip';
  const block = id => document.getElementById(id);
  if (block('lst-block-single')) block('lst-block-single').hidden = multi;
  if (block('lst-block-multi')) block('lst-block-multi').hidden = !multi;
  if (block('lst-field-points')) block('lst-field-points').hidden = sel('lst-scheme') !== 'multi';
}

/** Подставляет мощность и сопротивление дорожек при смене типа ленты. */
function applyStripType() {
  const preset = STRIP_TYPES.find(t => t.id === sel('lst-type'));
  if (!preset || preset.id === 'custom') return;
  const wpm = $('#lst-wpm');
  const r = $('#lst-r');
  if (wpm) wpm.value = preset.wattPerMeter;
  if (r) r.value = preset.trackResistance;
}

/** Навешивает обработчики формы. Вызывается один раз при старте. */
export function initStripForm() {
  const mode = $('#lst-mode');
  if (!mode) return;
  mode.addEventListener('change', syncStripForm);
  $('#lst-scheme')?.addEventListener('change', syncStripForm);
  $('#lst-type')?.addEventListener('change', applyStripType);
  syncStripForm();
}

/** Строка таблицы веток. */
function renderBranch(branch, isWorst) {
  const dash = '—';
  const section = branch.section === null ? dash : branch.section + ' ' + T('ledstrip.mm2');
  const points = branch.optimalFeedPoints === null ? dash : branch.optimalFeedPoints;
  return `<div class="check-row${isWorst ? ' limiting' : ''}">
    <span class="check-name">${branch.label}</span>
    <span class="check-req">${round(branch.current, 2)} ${T('ledstrip.unit_a')} · ${section}</span>
    <span class="check-verdict">${round(branch.dropPercent, 2)} % · ${round(branch.minVoltage, 2)} ${T('ledstrip.unit_v')} · ${T('ledstrip.pts')} ${points}</span>
  </div>`;
}

/** Расчёт по кнопке: читает форму, считает, рисует результат и эпюру. */
export function calcLedStrip() {
  const res = calcStripSystem(readForm());

  if (!res.ok) {
    toast(T(res.error));
    return;
  }

  const dash = '—';
  const worst = res.branches[res.worstBranch];
  const mainSection = res.commonWire ? res.commonWire.section : worst.section;

  $('#lst-result-val').textContent = mainSection === null ? dash : mainSection;
  $('#lst-Itotal').textContent = round(res.totalCurrent, 2) + ' ' + T('ledstrip.unit_a');
  $('#lst-Ptotal').textContent = round(res.totalPower, 1) + ' ' + T('ledstrip.unit_w');
  $('#lst-psu').textContent = res.psu.watts > 0
    ? res.psu.watts + ' ' + T('ledstrip.unit_w') + ' / ' + round(res.psu.current, 2) + ' ' + T('ledstrip.unit_a')
    : dash;
  $('#lst-dropV').textContent = round(res.dropTotal, 2) + ' ' + T('ledstrip.unit_v');
  $('#lst-dropPct').textContent = round(res.dropPercent, 2) + ' %';
  $('#lst-Umin').textContent = round(res.minVoltage, 2) + ' ' + T('ledstrip.unit_v');
  $('#lst-dropStrip').textContent = round(worst.dropStrip, 2) + ' ' + T('ledstrip.unit_v');
  $('#lst-dropWire').textContent = round(worst.dropWire, 2) + ' ' + T('ledstrip.unit_v');
  $('#lst-loss').textContent = round(res.branches.reduce((s, b) => s + b.powerLoss, 0), 1) + ' ' + T('ledstrip.unit_w');
  $('#lst-common-section').textContent = res.commonWire
    ? res.commonWire.section + ' ' + T('ledstrip.mm2')
    : T('ledstrip.no_common');
  $('#lst-points-opt').textContent = worst.optimalFeedPoints === null ? dash : worst.optimalFeedPoints;
  $('#lst-worst').textContent = worst.label;

  $('#lst-branches').innerHTML = res.branches
    .map((b, i) => renderBranch(b, i === res.worstBranch))
    .join('');

  $('#lst-warnings').innerHTML = res.warnings
    .map(key => `<div class="warn-item">${T(key)}</div>`)
    .join('');

  const series = res.profile.map((p, i) => ({
    label: p.label,
    color: themeColor(SERIES_COLORS[i % SERIES_COLORS.length]),
    points: p.points
  }));
  const limitVoltage = res.voltage - res.budgetVolts;

  $('#lst-chart').innerHTML = plotXY({
    series,
    title: T('ledstrip.chart_title'),
    xLabel: T('ledstrip.chart_x'),
    yLabel: T('ledstrip.chart_y'),
    xUnit: T('ledstrip.unit_m'),
    yUnit: T('ledstrip.unit_v'),
    refLines: [{ y: limitVoltage, label: T('ledstrip.chart_limit') }],
    height: 220
  });
  $('#lst-legend').innerHTML = series.length > 1 ? plotLegend(series) : '';
}
