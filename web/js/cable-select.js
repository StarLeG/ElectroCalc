/* EngiCalc — подбор сечения кабеля по ПУЭ
 *
 * Сечение не вычисляется формулой, а подбирается: перебирается стандартный ряд
 * и каждое сечение проверяется по нагреву, падению напряжения, термической
 * стойкости к КЗ и падению при пуске двигателя. Побеждает наименьшее сечение,
 * прошедшее все активные критерии, — то есть фактически наибольшее из требуемых
 * по каждому критерию в отдельности.
 *
 * selectCable() — чистая функция без обращений к DOM, её вызывают тесты.
 * calcCable()   — обвязка: читает поля страницы, вызывает selectCable, рисует.
 */
'use strict';

import { $, num, round, toast, T } from './core.js';
import {
  STD_SECTIONS, CABLE_TABLE, TEMP_COEF, MAX_TEMP, K_THERMAL,
  K_INSULATION, K_LAYING, K_CORES, K_TEMP_AIR, K_TEMP_GROUND,
  GROUND_LAYINGS, BASE_AMBIENT, K_GROUP, BREAKER_RATINGS, BREAKER_K,
  MIN_SECTION_PUE, lookupSection, interpolateK, nextStandard
} from './data/cable-data.js';

const SQRT3 = Math.sqrt(3);

/** Порог падения напряжения при пуске двигателя, % (ПУЭ п. 5.3.71). */
const START_DROP_LIMIT = 15;

/** Приоритет критериев: при равном требуемом сечении лимитирующим считается первый. */
const CRITERIA_ORDER = ['heating', 'drop', 'thermal', 'start'];

/**
 * Множитель в формуле падения напряжения: для трёхфазной линии √3,
 * для однофазной и постоянного тока — 2 (ток идёт по двум проводникам).
 * @param {string} netType 'dc' | 'ac1' | 'ac3'
 * @returns {number}
 */
function dropFactor(netType) {
  return netType === 'ac3' ? SQRT3 : 2;
}

/**
 * Расчётный ток нагрузки.
 * @param {object} inp нормализованные входные данные
 * @returns {number} ток, А
 */
function loadCurrent(inp) {
  if (inp.loadMode === 'current') return inp.current;

  const watts = inp.power * 1000;
  if (inp.netType === 'dc') return watts / (inp.voltage * inp.efficiency);
  if (inp.netType === 'ac1') return watts / (inp.voltage * inp.cosPhi * inp.efficiency);
  return watts / (SQRT3 * inp.voltage * inp.cosPhi * inp.efficiency);
}

/**
 * Суммарный поправочный коэффициент к табличному допустимому току.
 * @param {object} inp нормализованные входные данные
 * @returns {{total:number, insulation:number, laying:number, cores:number, temp:number, group:number}}
 */
function correctionFactors(inp) {
  const inGround = GROUND_LAYINGS.includes(inp.laying);
  const insulation = K_INSULATION[inp.insulation] ?? 1;
  const laying = K_LAYING[inp.laying] ?? 1;
  const cores = K_CORES[inp.cores] ?? 1;
  const temp = interpolateK(inGround ? K_TEMP_GROUND : K_TEMP_AIR, inp.ambientTemp);
  const group = interpolateK(K_GROUP, inp.bundleCount);

  return {
    insulation, laying, cores, temp, group,
    total: insulation * laying * cores * temp * group
  };
}

/**
 * Температура жилы при рабочем токе.
 * Оценка по квадрату загрузки: нагрев пропорционален I², а допустимый ток
 * по определению соответствует предельной температуре изоляции.
 * @param {object} inp нормализованные входные данные
 * @param {number} current рабочий ток, А
 * @param {number} allowed допустимый ток с поправками, А
 * @returns {number} температура жилы, °C
 */
function conductorTemp(inp, current, allowed) {
  const limit = MAX_TEMP[inp.insulation] ?? 70;
  const inGround = GROUND_LAYINGS.includes(inp.laying);
  const baseAmbient = inGround ? BASE_AMBIENT.ground : BASE_AMBIENT.air;
  if (allowed <= 0) return limit;
  return inp.ambientTemp + (limit - baseAmbient) * (current / allowed) ** 2;
}

/**
 * Полный набор показателей для одного сечения из ряда.
 * @param {object} inp нормализованные входные данные
 * @param {object} row строка CABLE_TABLE
 * @param {number} current расчётный ток, А
 * @param {number} kTotal суммарный поправочный коэффициент
 * @returns {object} показатели сечения и вердикты по каждому критерию
 */
function evaluateSection(inp, row, current, kTotal) {
  const n = inp.parallelCount;
  const alpha = TEMP_COEF[inp.material] ?? TEMP_COEF.Cu;
  const baseI = inp.material === 'Al' ? row.IAl : row.ICu;
  const r20 = inp.material === 'Al' ? row.RAl : row.RCu;

  const allowed = baseI * kTotal * n;
  const temp = conductorTemp(inp, current, allowed);
  const resistance = r20 * (1 + alpha * (temp - 20));       // Ом/км при рабочей температуре
  const reactance = inp.netType === 'dc' ? 0 : row.X;       // на постоянном токе реактанс не работает

  const cos = inp.netType === 'dc' ? 1 : inp.cosPhi;
  const sin = Math.sqrt(Math.max(0, 1 - cos * cos));
  const factor = dropFactor(inp.netType);
  const specific = resistance * cos + reactance * sin;      // Ом/км, приведённое к cos φ

  const dropVolts = factor * (current / n) * inp.length * specific / 1000;
  const dropPercent = dropVolts / inp.voltage * 100;

  // Потери: n кабелей, в каждом ток current/n; для трёхфазной линии три жилы.
  const phases = inp.netType === 'ac3' ? 3 : 2;
  const ohms = resistance * inp.length / 1000;
  const powerLoss = phases * n * (current / n) ** 2 * ohms;

  const checks = {
    heating: allowed >= current,
    drop: dropPercent <= inp.maxDropPercent
  };

  if (inp.scCurrent > 0 && inp.scTime > 0) {
    const k = K_THERMAL[inp.material]?.[inp.insulation] ?? K_THERMAL.Cu.pvc;
    const minSection = (inp.scCurrent / n) * Math.sqrt(inp.scTime) / k;
    checks.thermal = row.S >= minSection;
  }

  if (inp.startMultiple > 0) {
    const startDrop = factor * (current * inp.startMultiple / n) * inp.length * specific / 1000;
    checks.start = startDrop / inp.voltage * 100 <= START_DROP_LIMIT;
  }

  return {
    section: row.S, diameter: row.d, allowed, resistance, reactance,
    dropVolts, dropPercent, powerLoss, temp, checks
  };
}

/**
 * Проверка входных данных.
 * @param {object} inp нормализованные входные данные
 * @returns {string|null} ключ сообщения об ошибке либо null
 */
function validateInput(inp) {
  if (!(inp.voltage > 0)) return 'cable.err_voltage';
  if (!(inp.length > 0)) return 'cable.err_length';
  if (!(inp.maxDropPercent > 0)) return 'cable.err_drop';
  if (inp.netType !== 'dc' && !(inp.cosPhi > 0.1 && inp.cosPhi <= 1)) return 'cable.err_cos';
  if (!(inp.efficiency > 0 && inp.efficiency <= 1)) return 'cable.err_eta';
  if (inp.loadMode === 'current' && !(inp.current > 0)) return 'cable.err_current';
  if (inp.loadMode === 'power' && !(inp.power > 0)) return 'cable.err_power';
  if (!(inp.parallelCount >= 1)) return 'cable.err_parallel';
  return null;
}

/**
 * Предупреждения о нестандартных и опасных ситуациях.
 * @param {object} inp нормализованные входные данные
 * @param {object|null} best выбранное сечение (результат evaluateSection)
 * @param {number} breaker номинал автомата, А (0 — не подобран)
 * @returns {string[]} ключи сообщений для T()
 */
function collectWarnings(inp, best, breaker) {
  const warnings = [];

  if (!best) {
    warnings.push('cable.warn_over_range');
    return warnings;
  }

  if (breaker === 0) warnings.push('cable.warn_no_breaker');
  else if (breaker > best.allowed) warnings.push('cable.warn_breaker_over');

  if (inp.material === 'Al' && best.section < MIN_SECTION_PUE.aluminiumIndoor) {
    warnings.push('cable.warn_alu_min');
  }
  if (inp.material === 'Cu' && best.section < MIN_SECTION_PUE.socket) {
    warnings.push('cable.warn_min_section');
  }
  if (best.temp > (MAX_TEMP[inp.insulation] ?? 70)) {
    warnings.push('cable.warn_overheat');
  }
  if (inp.parallelCount > 1) warnings.push('cable.warn_parallel');
  if (best.section === STD_SECTIONS[STD_SECTIONS.length - 1]) {
    warnings.push('cable.warn_max_section');
  }

  return warnings;
}

/**
 * Число с подстановкой значения по умолчанию.
 * Пустое поле формы даёт NaN, а не undefined, поэтому `??` тут не спасает:
 * NaN, попавший в интерполяцию коэффициентов, отравил бы весь расчёт.
 * @param {*} value исходное значение
 * @param {number} fallback значение по умолчанию
 * @returns {number}
 */
function numOr(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Подбор сечения кабеля.
 * @param {object} raw входные данные, см. поля ниже
 * @returns {object} {ok, error?, current, section, limiting, criteria, ...показатели}
 */
export function selectCable(raw) {
  const inp = {
    netType: raw.netType ?? 'ac3',
    voltage: numOr(raw.voltage, 0),
    loadMode: raw.loadMode ?? 'power',
    power: numOr(raw.power, 0),
    current: numOr(raw.current, 0),
    cosPhi: numOr(raw.cosPhi, 0.9),
    efficiency: numOr(raw.efficiency, 1),
    material: raw.material === 'Al' ? 'Al' : 'Cu',
    cores: numOr(raw.cores, 3),
    insulation: raw.insulation ?? 'pvc',
    laying: raw.laying ?? 'air',
    bundleCount: numOr(raw.bundleCount, 1),
    ambientTemp: numOr(raw.ambientTemp, 25),
    length: numOr(raw.length, 0),
    maxDropPercent: numOr(raw.maxDropPercent, 5),
    parallelCount: numOr(raw.parallelCount, 1),
    scCurrent: numOr(raw.scCurrent, 0),
    scTime: numOr(raw.scTime, 0),
    startMultiple: numOr(raw.startMultiple, 0),
    breakerChar: raw.breakerChar ?? 'C'
  };

  const error = validateInput(inp);
  if (error) return { ok: false, error };

  const current = loadCurrent(inp);
  if (!(current > 0) || !Number.isFinite(current)) return { ok: false, error: 'cable.err_current' };

  const factors = correctionFactors(inp);
  const evaluated = CABLE_TABLE.map(row => evaluateSection(inp, row, current, factors.total));

  // Минимальное сечение, удовлетворяющее каждому критерию по отдельности.
  const activeCriteria = Object.keys(evaluated[0].checks);
  const required = {};
  for (const name of activeCriteria) {
    const hit = evaluated.find(e => e.checks[name]);
    required[name] = hit ? hit.section : null;
  }

  const best = evaluated.find(e => activeCriteria.every(name => e.checks[name])) ?? null;

  // Лимитирующий — первый по приоритету критерий, требующий итогового сечения.
  let limiting = null;
  if (best) {
    limiting = CRITERIA_ORDER.find(
      name => activeCriteria.includes(name) && required[name] === best.section
    ) ?? null;
  }

  let breaker = 0;
  if (best) {
    const reserve = inp.startMultiple > 0 ? (BREAKER_K[inp.breakerChar] ?? 1) : 1;
    breaker = nextStandard(BREAKER_RATINGS, current * reserve) ?? 0;
  }

  return {
    ok: true,
    current,
    factors,
    criteria: activeCriteria.map(name => ({
      name,
      required: required[name],
      passed: best ? best.checks[name] : false
    })),
    limiting,
    section: best ? best.section : null,
    diameter: best ? best.diameter : null,
    allowedCurrent: best ? best.allowed : null,
    reserve: best ? (best.allowed / current - 1) * 100 : null,
    dropVolts: best ? best.dropVolts : null,
    dropPercent: best ? best.dropPercent : null,
    powerLoss: best ? best.powerLoss : null,
    resistance: best ? best.resistance : null,
    reactance: best ? best.reactance : null,
    conductorTemp: best ? best.temp : null,
    breaker,
    warnings: collectWarnings(inp, best, breaker)
  };
}

/* ─────────────────────────── обвязка страницы ─────────────────────────── */

/** Значение выпадающего списка по id. */
const sel = id => document.getElementById(id)?.value;

/**
 * Строка таблицы проверок.
 * @param {object} check элемент result.criteria
 * @param {boolean} isLimiting выделить как лимитирующий
 * @returns {string} HTML
 */
function renderCheck(check, isLimiting) {
  const label = T('cable.crit_' + check.name);
  const required = check.required === null
    ? '—'
    : check.required + ' ' + T('cable.mm2');
  const verdict = check.passed
    ? `<span class="check">✓ ${T('cable.pass')}</span>`
    : `<span class="fail">✗ ${T('cable.fail')}</span>`;

  return `<div class="check-row${isLimiting ? ' limiting' : ''}">
    <span class="check-name">${label}</span>
    <span class="check-req">${required}</span>
    <span class="check-verdict">${verdict}</span>
  </div>`;
}

/** Собирает входные данные со страницы. */
function readForm() {
  return {
    netType: sel('c-net'),
    voltage: num('c-U'),
    loadMode: sel('c-mode'),
    power: num('c-P'),
    current: num('c-I'),
    cosPhi: num('c-cos'),
    efficiency: num('c-eta'),
    material: sel('c-mat'),
    cores: num('c-cores'),
    insulation: sel('c-ins'),
    laying: sel('c-lay'),
    bundleCount: num('c-bundle'),
    ambientTemp: num('c-temp'),
    length: num('c-L'),
    maxDropPercent: num('c-drop'),
    parallelCount: num('c-par'),
    scCurrent: num('c-ikz'),
    scTime: num('c-t'),
    startMultiple: num('c-kstart'),
    breakerChar: sel('c-char')
  };
}

/**
 * Приводит форму в согласованное состояние: показывает поле мощности либо тока
 * и прячет cos φ на постоянном токе, где он не имеет смысла.
 */
function syncCableForm() {
  const byCurrent = sel('c-mode') === 'current';
  const isDC = sel('c-net') === 'dc';

  const fieldP = $('#c-field-P');
  const fieldI = $('#c-field-I');
  const fieldCos = $('#c-field-cos');
  if (fieldP) fieldP.hidden = byCurrent;
  if (fieldI) fieldI.hidden = !byCurrent;
  if (fieldCos) fieldCos.hidden = isDC;
}

/** Подстановка типового напряжения при смене типа сети. */
function applyNetDefaults() {
  const defaults = { ac3: 380, ac1: 220, dc: 24 };
  const field = $('#c-U');
  const value = defaults[sel('c-net')];
  if (field && value) field.value = value;
}

/** Навешивает обработчики формы кабеля. Вызывается один раз при старте. */
export function initCableForm() {
  const mode = $('#c-mode');
  const net = $('#c-net');
  if (!mode || !net) return;

  mode.addEventListener('change', syncCableForm);
  net.addEventListener('change', () => { applyNetDefaults(); syncCableForm(); });
  syncCableForm();
}

/** Расчёт по кнопке: читает форму, считает, рисует результат. */
export function calcCable() {
  const res = selectCable(readForm());

  if (!res.ok) {
    toast(T(res.error));
    return;
  }

  const dash = '—';
  const has = res.section !== null;

  $('#cable-result-val').textContent = has ? res.section : dash;
  $('#cable-d').textContent = has ? round(res.diameter, 2) + ' ' + T('cable.unit_mm') : dash;
  $('#cable-I').textContent = round(res.current, 2) + ' ' + T('cable.unit_a');
  $('#cable-Iallow').textContent = has ? round(res.allowedCurrent, 1) + ' ' + T('cable.unit_a') : dash;
  $('#cable-reserve').textContent = has ? round(res.reserve, 0) + ' %' : dash;
  $('#cable-dropV').textContent = has ? round(res.dropVolts, 2) + ' ' + T('cable.unit_v') : dash;
  $('#cable-dropPct').textContent = has ? round(res.dropPercent, 2) + ' %' : dash;
  $('#cable-loss').textContent = has ? round(res.powerLoss, 1) + ' ' + T('cable.unit_w') : dash;
  $('#cable-R').textContent = has ? round(res.resistance, 3) + ' ' + T('cable.unit_ohmkm') : dash;
  $('#cable-X').textContent = has ? round(res.reactance, 3) + ' ' + T('cable.unit_ohmkm') : dash;
  $('#cable-temp').textContent = has ? round(res.conductorTemp, 1) + ' °C' : dash;
  $('#cable-breaker').textContent = res.breaker > 0 ? res.breaker + ' ' + T('cable.unit_a') : dash;
  $('#cable-k').textContent = round(res.factors.total, 3);

  $('#cable-limiting').textContent = res.limiting ? T('cable.crit_' + res.limiting) : dash;

  $('#cable-checks').innerHTML = res.criteria
    .map(c => renderCheck(c, c.name === res.limiting))
    .join('');

  $('#cable-warnings').innerHTML = res.warnings
    .map(key => `<div class="warn-item">${T(key)}</div>`)
    .join('');
}
