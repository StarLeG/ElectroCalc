/* Справочные таблицы кабелей (web/js/data/cable-data.js) против нормативов.
 *
 * Здесь сверяются данные, на которых стоят все кабельные калькуляторы:
 * ошибка в одной строке таблицы незаметно портит десяток страниц.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  CABLE_TABLE, STD_SECTIONS, K_TEMP_AIR, K_TEMP_GROUND, K_GROUP, K_THERMAL,
  RESISTIVITY, BREAKER_RATINGS, interpolateK, nextStandard
} from '../../../web/js/data/cable-data.js';
import { assertClose, knownDefect } from './assert-helpers.mjs';

describe('ряд сечений и номиналов', () => {
  test('ряд сечений совпадает с ГОСТ 22483 (IEC 60228) от 1.5 до 240 мм²', () => {
    assert.deepEqual(STD_SECTIONS, [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240]);
  });
  test('таблица кабеля покрывает весь ряд сечений по порядку', () => {
    assert.deepEqual(CABLE_TABLE.map(r => r.S), STD_SECTIONS);
  });
  test('ряд номиналов автоматов — ряд R10 по ГОСТ Р 50345', () => {
    assert.deepEqual(BREAKER_RATINGS, [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250]);
  });
});

describe('сопротивление жил при 20 °C против ГОСТ 22483 (±7.5 %)', () => {
  // Максимальное сопротивление медной жилы класса 1/2, Ом/км (ГОСТ 22483-2012, табл. 1, 2).
  const GOST_22483_CU = { 1.5: 12.1, 2.5: 7.41, 4: 4.61, 6: 3.08, 10: 1.83, 16: 1.15, 25: 0.727, 35: 0.524,
    50: 0.387, 70: 0.268, 95: 0.193, 120: 0.153, 150: 0.124, 185: 0.0991, 240: 0.0754 };
  for (const row of CABLE_TABLE) {
    test(`медь ${row.S} мм²: ${row.RCu} Ом/км против ${GOST_22483_CU[row.S]}`, () => {
      assertClose(row.RCu, GOST_22483_CU[row.S], { rel: 0.075 }, `R ${row.S} мм²`);
    });
  }
  // Алюминиевая жила класса 1/2 (ГОСТ 22483-2012); 1.5 мм² для алюминия не нормируется.
  const GOST_22483_AL = { 2.5: 12.1, 4: 7.41, 6: 5.11, 10: 3.08, 16: 1.91, 25: 1.20, 35: 0.868,
    50: 0.641, 70: 0.443, 95: 0.320, 120: 0.253, 150: 0.206, 185: 0.164, 240: 0.125 };
  for (const row of CABLE_TABLE.filter(r => GOST_22483_AL[r.S])) {
    test(`алюминий ${row.S} мм²: ${row.RAl} Ом/км против ${GOST_22483_AL[row.S]}`, () => {
      assertClose(row.RAl, GOST_22483_AL[row.S], { rel: 0.075 }, `R ${row.S} мм²`);
    });
  }
});

describe('допустимые токи против ПУЭ табл. 1.3.4', () => {
  // ПУЭ, 7-е изд., табл. 1.3.4: медные провода с резиновой и ПВХ изоляцией, проложенные открыто.
  const PUE_1_3_4_OPEN = { 1.5: 23, 2.5: 30, 4: 41, 6: 50, 10: 80, 16: 100, 25: 140, 35: 170,
    50: 215, 70: 270, 95: 330, 120: 385, 150: 440, 185: 510, 240: 605 };
  test('базис таблицы — «открытая прокладка в воздухе» по ПУЭ табл. 1.3.4', knownDefect(
    'комментарий к CABLE_TABLE обещает ПУЭ табл. 1.3.4 для открытой прокладки, но токи ниже на 8–17 % ' +
    '(2.5 мм²: 27 вместо 30 А, 10 мм²: 70 вместо 80 А) и не совпадают ни с одной колонкой этой таблицы',
    () => { for (const row of CABLE_TABLE) assert.equal(row.ICu, PUE_1_3_4_OPEN[row.S], `${row.S} мм²`); }));
  test('табличные токи не завышены относительно ПУЭ (запас в безопасную сторону)', () => {
    for (const row of CABLE_TABLE) assert.ok(row.ICu <= PUE_1_3_4_OPEN[row.S], `${row.S} мм²: ${row.ICu} > ${PUE_1_3_4_OPEN[row.S]}`);
  });
  test('ток растёт вместе с сечением', () => {
    for (let i = 1; i < CABLE_TABLE.length; i++) assert.ok(CABLE_TABLE[i].ICu > CABLE_TABLE[i - 1].ICu);
  });
});

describe('поправочные коэффициенты', () => {
  // ПУЭ табл. 1.3.3 построена по формуле √((θж − θ)/(θж − θн)): жила +70 °C, воздух +25 °C, земля +15 °C.
  for (const [t, k] of Object.entries(K_TEMP_AIR)) {
    test(`воздух ${t} °C: ${k} ≈ √((70 − t)/45)`, () => assertClose(k, Math.sqrt((70 - t) / 45), { abs: 0.01 }));
  }
  for (const [t, k] of Object.entries(K_TEMP_GROUND)) {
    test(`земля ${t} °C: ${k} ≈ √((70 − t)/55)`, () => assertClose(k, Math.sqrt((70 - t) / 55), { abs: 0.02 }));
  }
  test('коэффициенты группы по ПУЭ табл. 1.3.26 (расстояние 100 мм)', () => {
    const PUE_1_3_26 = { 1: 1.0, 2: 0.9, 3: 0.85, 4: 0.8, 5: 0.78, 6: 0.75 };
    for (const [n, k] of Object.entries(PUE_1_3_26)) assert.equal(K_GROUP[n], k, `${n} кабелей`);
  });
  test('k термической стойкости — IEC 60364-4-43 табл. 43A', () => {
    assert.equal(K_THERMAL.Cu.pvc, 115);
    assert.equal(K_THERMAL.Cu.xlpe, 143);
    assert.equal(K_THERMAL.Al.pvc, 76);
    assert.equal(K_THERMAL.Al.xlpe, 94);
  });
  test('удельное сопротивление меди и алюминия при 20 °C (±2 % к IEC 60028: 0.01724 и 0.02826)', () => {
    assertClose(RESISTIVITY.Cu, 0.01724, { rel: 0.02 });
    assertClose(RESISTIVITY.Al, 0.02826, { rel: 0.02 });
  });
});

describe('interpolateK()', () => {
  const table = { 10: 1.0, 20: 0.8, 40: 0.4 };
  test('в узле возвращает табличное значение', () => assert.equal(interpolateK(table, 20), 0.8));
  test('между узлами — линейно', () => assertClose(interpolateK(table, 30), 0.6, { abs: 1e-12 }));
  test('ниже таблицы — крайнее значение, без экстраполяции', () => assert.equal(interpolateK(table, -100), 1.0));
  test('выше таблицы — крайнее значение', () => assert.equal(interpolateK(table, 100), 0.4));
});

describe('nextStandard()', () => {
  test('точно на номинале — сам номинал', () => assert.equal(nextStandard(BREAKER_RATINGS, 16), 16));
  test('между номиналами — следующий', () => assert.equal(nextStandard(BREAKER_RATINGS, 16.02), 20));
  test('выше ряда — null, а не последний номинал', () => assert.equal(nextStandard(BREAKER_RATINGS, 251), null));
});
