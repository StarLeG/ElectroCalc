/* Термосопротивления — web/js/data/rtd.js.
 *
 * Эталон — номинальная статическая характеристика по IEC 60751:2008 / ГОСТ 6651-2009
 * (α = 0.00385), табличные значения Pt100 с точностью 0.0001 Ом.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { rtdR0, rtdResistance, rtdTemperature, RTD_RANGE } from '../../../web/js/data/rtd.js';
import { assertClose } from './assert-helpers.mjs';

/** IEC 60751, таблица Pt100: температура, °C → сопротивление, Ом. */
const IEC_60751_PT100 = [
  [-200, 18.5201], [-150, 39.7232], [-100, 60.2558], [-50, 80.3063], [-20, 92.1599],
  [0, 100.0000], [25, 109.7347], [50, 119.3971], [100, 138.5055], [150, 157.3251],
  [200, 175.8560], [300, 212.0515], [400, 247.0920], [500, 280.9775], [600, 313.7086],
  [700, 345.2848], [800, 375.7064], [850, 390.4811],
];

describe('rtdR0', () => {
  test('Pt100 / Pt500 / Pt1000', () => {
    assert.equal(rtdR0('Pt100'), 100);
    assert.equal(rtdR0('Pt500'), 500);
    assert.equal(rtdR0('Pt1000'), 1000);
  });
  test('неизвестный тип трактуется как Pt100', () => assert.equal(rtdR0('Ni100'), 100));
});

describe('rtdResistance против таблицы IEC 60751', () => {
  for (const [t, R] of IEC_60751_PT100) {
    test(`Pt100 при ${t} °C = ${R} Ом`, () => assertClose(rtdResistance(100, t), R, { abs: 0.0005 }));
  }
  test('Pt1000 в 10 раз больше Pt100', () => {
    for (const [t, R] of IEC_60751_PT100) assertClose(rtdResistance(1000, t), R * 10, { abs: 0.005 });
  });
});

describe('rtdTemperature — обратное преобразование', () => {
  for (const [t, R] of IEC_60751_PT100) {
    test(`Pt100 ${R} Ом → ${t} °C`, () => assertClose(rtdTemperature(100, R), t, { abs: 0.002 }));
  }
  test('прямое и обратное согласованы во всём диапазоне с шагом 1 °C', () => {
    for (let t = RTD_RANGE[0]; t <= RTD_RANGE[1]; t += 1) {
      assertClose(rtdTemperature(100, rtdResistance(100, t)), t, { abs: 1e-6 }, `${t} °C`);
    }
  });
  test('характеристика строго возрастает', () => {
    for (let t = RTD_RANGE[0]; t < RTD_RANGE[1]; t += 5) assert.ok(rtdResistance(100, t + 5) > rtdResistance(100, t));
  });
});
