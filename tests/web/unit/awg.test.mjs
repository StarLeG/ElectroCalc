/* Калибры AWG — awgArea(), awgFromArea() из web/js/cable-networks.js.
 *
 * Эталон — ASTM B258: d(n) = 0.005 · 92^((36 − n)/39) дюйма.
 * Площади по стандартной таблице, мм²: AWG 0 — 53.5, 4 — 21.2, 8 — 8.37, 10 — 5.26,
 * 12 — 3.31, 14 — 2.08, 16 — 1.31, 18 — 0.823, 20 — 0.518, 22 — 0.326, 24 — 0.205.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { awgArea, awgFromArea } from '../../../web/js/cable-networks.js';
import { assertClose } from './assert-helpers.mjs';

const ASTM_B258 = { 0: 53.5, 4: 21.2, 8: 8.37, 10: 5.26, 12: 3.31, 14: 2.08, 16: 1.31, 18: 0.823, 20: 0.518, 22: 0.326, 24: 0.205 };

describe('awgArea против таблицы ASTM B258', () => {
  for (const [n, S] of Object.entries(ASTM_B258)) {
    test(`AWG ${n} = ${S} мм²`, () => assertClose(awgArea(Number(n)), S, { rel: 0.005 }));
  }
  test('AWG 36 — диаметр ровно 0.005″ (0.127 мм)', () => {
    assertClose(awgArea(36), Math.PI * 0.127 ** 2 / 4, { rel: 1e-4 });
  });
  test('каждые 6 калибров диаметр удваивается — площадь ×4', () => {
    assertClose(awgArea(10) / awgArea(16), 92 ** (12 / 39), { rel: 1e-9 });
    assertClose(awgArea(10) / awgArea(16), 4, { rel: 0.02 });
  });
});

describe('awgFromArea', () => {
  test('метрические сечения → ближайший AWG', () => {
    assert.equal(awgFromArea(0.5), 20);
    assert.equal(awgFromArea(1.5), 15);
    assert.equal(awgFromArea(2.5), 13);
    assert.equal(awgFromArea(4), 11);
    assert.equal(awgFromArea(6), 9);
    assert.equal(awgFromArea(10), 7);
  });
  test('обратное к awgArea для всех калибров 0…40', () => {
    for (let n = 0; n <= 40; n++) assert.equal(awgFromArea(awgArea(n)), n);
  });
  test('ноль и отрицательные — NaN, а не число', () => {
    assert.ok(Number.isNaN(awgFromArea(0)));
    assert.ok(Number.isNaN(awgFromArea(-1)));
  });
});
