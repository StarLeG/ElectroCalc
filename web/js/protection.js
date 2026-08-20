/* EngiCalc — подбор аппарата защиты: автомат, УЗО, селективность
 *
 * Автомат и УЗО решают разные задачи. Автомат бережёт провод: он отключается,
 * когда ток греет кабель сверх допустимого или когда произошло короткое
 * замыкание. УЗО бережёт человека: оно ловит ток, ушедший мимо обратного
 * провода — через изоляцию, через воду, через человека. Поэтому одно не
 * заменяет другое, и подбираются они по разным величинам.
 *
 * calcBreaker(), calcRCD() и checkSelectivity() — чистые функции без DOM,
 * их зовут тесты. Ниже них — обвязка страницы.
 */
'use strict';

import { $, num, round, toast, T } from './core.js';
import { BREAKER_RATINGS, nextStandard } from './data/cable-data.js';
import {
  INSTANT_TRIP, CURVE_BY_LOAD, SC_MARGIN, OVERLOAD_TRIP, RCD_RATINGS,
  RCD_NOMINAL_CURRENTS, RCD_MIN_RATING, NUISANCE_THRESHOLD, LEAKAGE,
  LEAKAGE_MARGIN, RCD_LIMITS, RCD_TYPE_BY_LOAD, SELECTIVITY_RATIO,
  DELAYED_RCD_TYPES
} from './data/protection-data.js';

/**
 * Число с подстановкой значения по умолчанию.
 * Пустое поле формы даёт NaN, а не undefined, поэтому `??` тут не спасает.
 * @param {*} value исходное значение
 * @param {number} fallback значение по умолчанию
 * @returns {number}
 */
function numOr(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/* ═══════════════════════ АВТОМАТИЧЕСКИЙ ВЫКЛЮЧАТЕЛЬ ═══════════════════════ */

/**
 * Подобрать автоматический выключатель под нагрузку и проверить его связи.
 *
 * Номинал берётся ближайшим большим из стандартного ряда — это ровно половина
 * дела. Вторая половина в проверках: тот же номинал обязан не превышать
 * допустимый ток кабеля, пропустить пуск и отключиться при коротком замыкании
 * в конце линии. Каждая проверка выполняется только при заполненных данных:
 * незаполненное поле означает «неизвестно», а не «ноль».
 *
 * @param {object} input см. поля ниже
 * @returns {{ok:boolean, messageKey?:string, IB?:number, rating?:number,
 *   curve?:string, recommendedCurve?:string, overloadTrip?:number,
 *   startCurrent?:number, checks?:object[], warnings?:string[]}}
 */
export function calcBreaker(input = {}) {
  const inp = {
    loadMode: input.loadMode === 'current' ? 'current' : 'power',
    power: numOr(input.power, 0),               // кВт
    current: numOr(input.current, 0),           // А
    voltage: numOr(input.voltage, 230),         // В
    phases: numOr(input.phases, 1) === 3 ? 3 : 1,
    cosPhi: numOr(input.cosPhi, 0.95),
    loadType: input.loadType || 'mixed',
    curve: input.curve || '',
    startMultiple: numOr(input.startMultiple, 0),
    cableCurrent: numOr(input.cableCurrent, 0), // Iдоп, А
    scCurrent: numOr(input.scCurrent, 0),       // Iкз в конце линии, А
    breakingCapacity: numOr(input.breakingCapacity, 0), // Icn, А
  };

  let IB;
  if (inp.loadMode === 'current') {
    if (!(inp.current > 0)) return { ok: false, messageKey: 'protection.err_load' };
    IB = inp.current;
  } else {
    if (!(inp.power > 0)) return { ok: false, messageKey: 'protection.err_load' };
    if (!(inp.voltage > 0)) return { ok: false, messageKey: 'protection.err_voltage' };
    if (!(inp.cosPhi > 0) || inp.cosPhi > 1) return { ok: false, messageKey: 'protection.err_cos' };
    IB = inp.phases === 3
      ? inp.power * 1000 / (Math.sqrt(3) * inp.voltage * inp.cosPhi)
      : inp.power * 1000 / (inp.voltage * inp.cosPhi);
  }

  const rating = nextStandard(BREAKER_RATINGS, IB);
  if (!rating) return { ok: false, messageKey: 'protection.err_over_range' };

  const recommendedCurve = CURVE_BY_LOAD[inp.loadType] || 'C';
  const curve = INSTANT_TRIP[inp.curve] ? inp.curve : recommendedCurve;
  const [lowMultiple, highMultiple] = INSTANT_TRIP[curve];

  const checks = [];
  const warnings = [];

  // Нагрузка проходит через аппарат, не поднимая его.
  checks.push({ name: 'load', value: IB, limit: rating, passed: IB <= rating });

  // Защита кабеля от перегрузки: ГОСТ Р 50571.4.43 требует IB ≤ In ≤ Iz.
  if (inp.cableCurrent > 0) {
    const passed = rating <= inp.cableCurrent;
    checks.push({ name: 'cable', value: rating, limit: inp.cableCurrent, passed });
    if (!passed) warnings.push('protection.warn_cable_over');
  }

  // Пуск: бросок тока не должен доставать до зоны мгновенного расцепления,
  // иначе автомат вправе отключаться на каждом пуске.
  const startCurrent = inp.startMultiple > 0 ? inp.startMultiple * IB : 0;
  if (startCurrent > 0) {
    const limit = lowMultiple * rating;
    const passed = startCurrent < limit;
    checks.push({ name: 'start', value: startCurrent, limit, passed });
    if (!passed) warnings.push('protection.warn_start_trip');
  }

  // Отключение при КЗ: ток обязан превысить ВЕРХНЮЮ границу зоны — только
  // выше неё срабатывание гарантировано стандартом.
  if (inp.scCurrent > 0) {
    const limit = SC_MARGIN * highMultiple * rating;
    const passed = inp.scCurrent >= limit;
    checks.push({ name: 'sc', value: inp.scCurrent, limit, passed });
    if (!passed) warnings.push('protection.warn_sc_slow');
  }

  // Отключающая способность: аппарат должен пережить собственное отключение.
  if (inp.breakingCapacity > 0 && inp.scCurrent > 0) {
    const passed = inp.breakingCapacity >= inp.scCurrent;
    checks.push({ name: 'capacity', value: inp.breakingCapacity, limit: inp.scCurrent, passed });
    if (!passed) warnings.push('protection.warn_capacity');
  }

  return {
    ok: true,
    IB,
    rating,
    curve,
    recommendedCurve,
    overloadTrip: OVERLOAD_TRIP * rating,
    startCurrent,
    checks,
    warnings,
  };
}

/* ═══════════════════════════════ УЗО ═══════════════════════════════ */

/**
 * Подобрать УЗО или дифференциальную часть дифавтомата.
 *
 * Считается не то, что аппарат «должен отключать», а то, что течёт мимо
 * обратного провода в нормальном режиме. ПУЭ 7.1.83 при отсутствии данных об
 * электроприёмниках даёт оценку: 0,4 мА на каждый ампер нагрузки плюс 10 мкА
 * на каждый метр фазного проводника. Эта утечка не должна превышать трети
 * номинала — иначе аппарат будет отключаться сам по себе.
 *
 * Второе ограничение приходит с другой стороны: УЗО крупнее 30 мА человека
 * уже не защищает. Когда расчёт требует больше потолка, номинал не поднимают —
 * линию делят на группы, и расчёт обязан сказать об этом прямо.
 *
 * @param {object} input см. поля ниже
 * @returns {{ok:boolean, messageKey?:string, leakage?:number, required?:number,
 *   limit?:number, rating?:number, type?:string, nominalCurrent?:number|null,
 *   maxLength?:number, margin?:number, warnings?:string[]}}
 */
export function calcRCD(input = {}) {
  const current = numOr(input.current, 0);
  const length = numOr(input.length, 0);
  const purpose = RCD_LIMITS[input.purpose] ? input.purpose : 'group';
  const loadCharacter = RCD_TYPE_BY_LOAD[input.loadCharacter] ? input.loadCharacter : 'electronics';
  const breakerRating = numOr(input.breakerRating, 0);

  if (!(current > 0)) return { ok: false, messageKey: 'protection.err_load' };
  if (!(length >= 0)) return { ok: false, messageKey: 'protection.err_length' };

  const leakage = LEAKAGE.perAmp * current + LEAKAGE.perMetre * length;
  const required = LEAKAGE_MARGIN * leakage;
  const limit = RCD_LIMITS[purpose];

  const warnings = [];

  // Номинал ищется в ряду, но не ниже практического минимума и не выше
  // потолка, заданного назначением линии.
  const fromSeries = nextStandard(RCD_RATINGS, Math.max(required, RCD_MIN_RATING));
  const rating = Math.min(fromSeries ?? limit, limit);

  if (required > limit) {
    warnings.push('protection.warn_split_line');
  }

  // Предельная длина обращает условие ПУЭ в равенство. Отрицательный ответ
  // означает, что запас съеден одним током нагрузки и укорачивать нечего.
  const maxLength = Math.max(0, (limit / LEAKAGE_MARGIN - LEAKAGE.perAmp * current) / LEAKAGE.perMetre);
  if (required > limit && maxLength === 0) warnings.push('protection.warn_split_load');

  const margin = leakage / (rating / LEAKAGE_MARGIN);
  if (margin >= NUISANCE_THRESHOLD) warnings.push('protection.warn_nuisance');

  const type = RCD_TYPE_BY_LOAD[loadCharacter];
  if (type === 'AC') warnings.push('protection.warn_type_ac');

  let nominalCurrent = null;
  if (breakerRating > 0) {
    nominalCurrent = nextStandard(RCD_NOMINAL_CURRENTS, breakerRating);
    if (nominalCurrent === null) warnings.push('protection.warn_rcd_current_over');
  }

  return { ok: true, leakage, required, limit, rating, type, nominalCurrent, maxLength, margin, warnings };
}

/* ═══════════════════════════ СЕЛЕКТИВНОСТЬ ═══════════════════════════ */

/**
 * Проверить селективность пары УЗО «ввод — группа».
 *
 * Утечка в группе течёт и через вводное УЗО тоже — оно видит ровно тот же ток.
 * Поэтому одного запаса по номиналу мало: без выдержки времени вводной аппарат
 * успевает отключиться первым, и вместо одной группы обесточивается весь дом.
 * Нужны оба условия сразу — кратность номиналов и исполнение S или G сверху.
 *
 * @param {object} input см. поля ниже
 * @returns {{ok:boolean, messageKey?:string, selective?:boolean, ratio?:number,
 *   requiredRatio?:number, warnings?:string[]}}
 */
export function checkSelectivity(input = {}) {
  const upstreamRating = numOr(input.upstreamRating, 0);
  const downstreamRating = numOr(input.downstreamRating, 0);
  const upstreamType = String(input.upstreamType || '').toUpperCase();

  if (!(upstreamRating > 0) || !(downstreamRating > 0)) {
    return { ok: false, messageKey: 'protection.err_rating' };
  }

  const ratio = upstreamRating / downstreamRating;
  const delayed = DELAYED_RCD_TYPES.includes(upstreamType);

  const warnings = [];
  if (ratio < SELECTIVITY_RATIO) warnings.push('protection.warn_ratio');
  if (!delayed) warnings.push('protection.warn_no_delay');

  return {
    ok: true,
    selective: ratio >= SELECTIVITY_RATIO && delayed,
    ratio,
    requiredRatio: SELECTIVITY_RATIO,
    warnings,
  };
}
