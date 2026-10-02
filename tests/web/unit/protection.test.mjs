/* Подбор аппаратов защиты — calcBreaker(), calcRCD(), checkSelectivity()
 * из web/js/protection.js.
 *
 * Нормативы: ГОСТ Р 50345 (IEC 60898-1) — зоны мгновенного расцепления
 * B 3–5·In, C 5–10·In, D 10–20·In, I2 = 1.45·In; ГОСТ Р 50571.4.43 — IB ≤ In ≤ Iz;
 * ПУЭ 7.1.83 — утечка 0.4 мА/А + 10 мкА/м, не более 1/3 IΔn; ПУЭ 7.1.79 — 30 мА.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calcBreaker, calcRCD, checkSelectivity } from '../../../web/js/protection.js';
import { assertClose } from './assert-helpers.mjs';

const check = (res, name) => res.checks.find(c => c.name === name);

describe('calcBreaker: подбор номинала', () => {
  // IB = 3500 / (230·0.95) = 16.02 А — больше 16, значит 20 А
  test('3.5 кВт, 230 В, cos 0.95 → 20 А, характеристика C', () => {
    const res = calcBreaker({ power: 3.5, voltage: 230, cosPhi: 0.95, loadType: 'mixed' });
    assertClose(res.IB, 16.018, { abs: 0.001 });
    assert.equal(res.rating, 20);
    assert.equal(res.curve, 'C');
    assertClose(res.overloadTrip, 29, { abs: 1e-9 });
  });
  // IB = 11000 / (√3·400·0.85) = 18.68 А
  test('трёхфазный двигатель 11 кВт → 20 А, характеристика D', () => {
    const res = calcBreaker({ power: 11, voltage: 400, phases: 3, cosPhi: 0.85, loadType: 'motor' });
    assertClose(res.IB, 18.68, { abs: 0.01 });
    assert.equal(res.rating, 20);
    assert.equal(res.curve, 'D');
  });
  test('ровно 16 А — номинал 16 А, без запаса сверху', () => {
    assert.equal(calcBreaker({ loadMode: 'current', current: 16 }).rating, 16);
  });
  test('активная нагрузка — характеристика B', () => {
    assert.equal(calcBreaker({ loadMode: 'current', current: 10, loadType: 'resistive' }).curve, 'B');
  });
  test('явно выбранная характеристика важнее рекомендованной', () => {
    const res = calcBreaker({ loadMode: 'current', current: 10, loadType: 'resistive', curve: 'D' });
    assert.equal(res.curve, 'D');
    assert.equal(res.recommendedCurve, 'B');
  });
});

describe('calcBreaker: проверки', () => {
  test('номинал не выше допустимого тока кабеля: 20 А на 21 А — проходит', () => {
    assert.equal(check(calcBreaker({ loadMode: 'current', current: 18, cableCurrent: 21 }), 'cable').passed, true);
  });
  test('номинал выше кабеля: 25 А на 21 А — предупреждение', () => {
    const res = calcBreaker({ loadMode: 'current', current: 22, cableCurrent: 21 });
    assert.equal(check(res, 'cable').passed, false);
    assert.ok(res.warnings.includes('protection.warn_cable_over'));
  });
  // C20: верхняя граница 10·20 = 200 А, с запасом 1.1 → 220 А
  test('КЗ 150 А не гарантирует мгновенное отключение C20 (нужно ≥ 220 А)', () => {
    const res = calcBreaker({ loadMode: 'current', current: 18, curve: 'C', scCurrent: 150 });
    assertClose(check(res, 'sc').limit, 220, { abs: 1e-9 });
    assert.equal(check(res, 'sc').passed, false);
  });
  test('КЗ 250 А отключает C20', () => {
    assert.equal(check(calcBreaker({ loadMode: 'current', current: 18, curve: 'C', scCurrent: 250 }), 'sc').passed, true);
  });
  // B10: нижняя граница зоны 3·10 = 30 А, пуск 5·10 = 50 А попадает в зону расцепления
  test('пуск 5·IB на B10 может выбить автомат', () => {
    const res = calcBreaker({ loadMode: 'current', current: 10, curve: 'B', startMultiple: 5 });
    assert.equal(res.rating, 10);
    assert.equal(check(res, 'start').passed, false);
    assert.ok(res.warnings.includes('protection.warn_start_trip'));
  });
  test('отключающая способность 4500 А при Iкз 6 кА — недостаточна', () => {
    const res = calcBreaker({ loadMode: 'current', current: 10, scCurrent: 6000, breakingCapacity: 4500 });
    assert.equal(check(res, 'capacity').passed, false);
  });
  test('пустые необязательные поля — проверки не выполняются', () => {
    const res = calcBreaker({ loadMode: 'current', current: 10 });
    assert.deepEqual(res.checks.map(c => c.name), ['load']);
  });
});

describe('calcBreaker: корректность ввода', () => {
  test('нулевая мощность', () => assert.equal(calcBreaker({ power: 0 }).messageKey, 'protection.err_load'));
  test('отрицательный ток', () => assert.equal(calcBreaker({ loadMode: 'current', current: -5 }).messageKey, 'protection.err_load'));
  test('cos φ > 1', () => assert.equal(calcBreaker({ power: 1, cosPhi: 1.2 }).messageKey, 'protection.err_cos'));
  test('нулевое напряжение', () => assert.equal(calcBreaker({ power: 1, voltage: 0 }).messageKey, 'protection.err_voltage'));
  test('ток выше ряда номиналов', () => assert.equal(calcBreaker({ loadMode: 'current', current: 300 }).messageKey, 'protection.err_over_range'));
});

describe('calcRCD: ПУЭ 7.1.83', () => {
  // 0.4·16 + 0.01·50 = 6.9 мА; 3·6.9 = 20.7 мА → 30 мА
  test('группа 16 А, 50 м → 30 мА', () => {
    const res = calcRCD({ current: 16, length: 50, purpose: 'group' });
    assertClose(res.leakage, 6.9, { abs: 1e-9 });
    assertClose(res.required, 20.7, { abs: 1e-9 });
    assert.equal(res.rating, 30);
    // запас: 6.9 / (30/3) = 69 % — меньше порога ложных срабатываний 80 %
    assertClose(res.margin, 0.69, { abs: 1e-9 });
    assert.ok(!res.warnings.includes('protection.warn_nuisance'));
  });
  // Ванная: потолок 10 мА, расчёт 20.7 — делить линию
  test('влажное помещение: номинал не поднимается выше 10 мА', () => {
    const res = calcRCD({ current: 16, length: 50, purpose: 'wet' });
    assert.equal(res.rating, 10);
    assert.ok(res.warnings.includes('protection.warn_split_line'));
  });
  // Предельная длина для 30 мА при 16 А: (30/3 − 6.4)/0.01 = 360 м
  test('предельная длина линии', () => {
    assertClose(calcRCD({ current: 16, length: 50, purpose: 'group' }).maxLength, 360, { abs: 1e-9 });
  });
  test('нагрузка съедает весь запас: 25 А при 30 мА (10 мА > 10 мА)', () => {
    const res = calcRCD({ current: 25, length: 10, purpose: 'group' });
    assert.equal(res.maxLength, 0);
  });
  test('малая утечка — не ниже 10 мА', () => {
    assert.equal(calcRCD({ current: 1, length: 1, purpose: 'group' }).rating, 10);
  });
  test('тип УЗО по характеру нагрузки', () => {
    assert.equal(calcRCD({ current: 10, length: 10, loadCharacter: 'resistive' }).type, 'AC');
    assert.equal(calcRCD({ current: 10, length: 10, loadCharacter: 'electronics' }).type, 'A');
    assert.equal(calcRCD({ current: 10, length: 10, loadCharacter: 'drive1ph' }).type, 'F');
    assert.equal(calcRCD({ current: 10, length: 10, loadCharacter: 'drive3ph' }).type, 'B');
  });
  test('номинальный ток УЗО не меньше автомата', () => {
    assert.equal(calcRCD({ current: 10, length: 10, breakerRating: 20 }).nominalCurrent, 25);
    assert.equal(calcRCD({ current: 10, length: 10, breakerRating: 160 }).nominalCurrent, null);
  });
  test('нулевой ток — отказ', () => assert.equal(calcRCD({ current: 0, length: 10 }).messageKey, 'protection.err_load'));
  test('отрицательная длина — отказ', () => assert.equal(calcRCD({ current: 10, length: -1 }).messageKey, 'protection.err_length'));
});

describe('checkSelectivity', () => {
  test('300 мА S над 30 мА — селективно', () => {
    const res = checkSelectivity({ upstreamRating: 300, upstreamType: 'S', downstreamRating: 30 });
    assert.equal(res.selective, true);
    assert.equal(res.ratio, 10);
  });
  test('100 мА S над 30 мА — кратность 3.33 достаточна', () => {
    assert.equal(checkSelectivity({ upstreamRating: 100, upstreamType: 's', downstreamRating: 30 }).selective, true);
  });
  test('без выдержки времени селективности нет даже при кратности 10', () => {
    const res = checkSelectivity({ upstreamRating: 300, upstreamType: '', downstreamRating: 30 });
    assert.equal(res.selective, false);
    assert.ok(res.warnings.includes('protection.warn_no_delay'));
  });
  test('кратность меньше 3 — нет селективности', () => {
    const res = checkSelectivity({ upstreamRating: 60, upstreamType: 'G', downstreamRating: 30 });
    assert.equal(res.selective, false);
    assert.ok(res.warnings.includes('protection.warn_ratio'));
  });
  test('нулевой номинал — отказ', () => {
    assert.equal(checkSelectivity({ upstreamRating: 0, downstreamRating: 30 }).messageKey, 'protection.err_rating');
  });
});
