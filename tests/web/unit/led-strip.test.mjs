/* Светодиодные ленты — calcStripSystem() из web/js/led-strip.js
 * и коэффициенты схем питания из web/js/data/led-strip-data.js.
 *
 * Лента — равномерно распределённая нагрузка: ток спадает вдоль ленты линейно,
 * и падение на дорожках ΔU = r·i·L²/k, где k = 2 при питании с одного конца,
 * 8 — с двух, 8·(N−1)² — при N равномерных точках. Провод: 2·I·l·ρ/S.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calcStripSystem } from '../../../web/js/led-strip.js';
import { stripDropDivisor, feedCurrentShare } from '../../../web/js/data/led-strip-data.js';
import { assertClose } from './assert-helpers.mjs';

const BASE = {
  mode: 'single', voltage: 24, wattPerMeter: 14.4, trackResistance: 0.2,
  length: 3, feedScheme: 'one', wireLength: 5, maxDropPercent: 5,
  material: 'Cu', parallelWires: 1, ambientTemp: 25, laying: 'air', psuReserve: 1.25,
};

describe('коэффициенты схем питания', () => {
  test('один конец — L²/2', () => assert.equal(stripDropDivisor('one'), 2));
  test('два конца — L²/8, вчетверо меньше', () => assert.equal(stripDropDivisor('both'), 8));
  test('три точки — два пролёта: 8·2² = 32', () => assert.equal(stripDropDivisor('multi', 3), 32));
  test('доля тока провода: один конец — весь ток, два — половина, N точек — 1/(N−1)', () => {
    assert.equal(feedCurrentShare('one'), 1);
    assert.equal(feedCurrentShare('both'), 0.5);
    assert.equal(feedCurrentShare('multi', 5), 0.25);
  });
});

describe('calcStripSystem: одна лента', () => {
  const res = calcStripSystem(BASE);
  const b = res.branches[0];
  test('ток: 14.4 Вт/м / 24 В = 0.6 А/м, на 3 м — 1.8 А', () => {
    assertClose(b.currentPerMeter, 0.6, { abs: 1e-12 });
    assertClose(res.totalCurrent, 1.8, { abs: 1e-12 });
  });
  // 0.2·0.6·3²/2 = 0.54 В
  test('просадка на дорожках 0.54 В', () => assertClose(b.dropStrip, 0.54, { abs: 1e-12 }));
  // Бюджет 1.2 В, на провод 0.66 В: S ≥ 2·1.8·5·0.0175/0.66 = 0.477 → 0.5 мм², ΔU = 0.63 В
  test('провод 0.5 мм² и его падение 0.63 В', () => {
    assert.equal(b.section, 0.5);
    assertClose(b.dropWire, 0.63, { abs: 1e-9 });
  });
  test('итог 1.17 В = 4.875 % — в пределах 5 %', () => {
    assertClose(res.dropTotal, 1.17, { abs: 1e-9 });
    assertClose(res.dropPercent, 4.875, { abs: 1e-9 });
    assert.ok(!res.warnings.includes('ledstrip.warn_no_solution'));
  });
  // 43.2 Вт · 1.25 = 54 Вт → 60 Вт
  test('блок питания 60 Вт с запасом 1.25', () => {
    assertClose(res.psu.required, 54, { abs: 1e-9 });
    assert.equal(res.psu.watts, 60);
  });
  test('эпюра начинается с напряжения после провода и монотонно падает', () => {
    const pts = res.profile[0].points;
    assertClose(pts[0][1], 24 - 0.63, { abs: 1e-9 });
    for (let i = 1; i < pts.length; i++) assert.ok(pts[i][1] <= pts[i - 1][1] + 1e-12);
    assertClose(pts.at(-1)[1], 24 - 1.17, { abs: 1e-9 });
  });
});

describe('calcStripSystem: схемы питания', () => {
  test('питание с двух концов уменьшает просадку вчетверо', () => {
    const one = calcStripSystem({ ...BASE, length: 5 });
    const both = calcStripSystem({ ...BASE, length: 5, feedScheme: 'both' });
    assertClose(both.branches[0].dropStrip, one.branches[0].dropStrip / 4, { abs: 1e-12 });
    assertClose(both.branches[0].feedCurrent, 1.5, { abs: 1e-12 });
  });
  test('просадка на дорожках растёт квадратично по длине', () => {
    const l3 = calcStripSystem({ ...BASE, length: 3 }).branches[0].dropStrip;
    const l6 = calcStripSystem({ ...BASE, length: 6 }).branches[0].dropStrip;
    assertClose(l6 / l3, 4, { abs: 1e-9 });
  });
  // 12 В, 5 м: i = 1.2 А/м, ΔU = 0.2·1.2·25/2 = 3 В при бюджете 0.6 В
  test('лента сама съедает бюджет — предупреждение и оптимум точек питания', () => {
    const res = calcStripSystem({ ...BASE, voltage: 12, length: 5 });
    assertClose(res.branches[0].dropStrip, 3, { abs: 1e-12 });
    assert.ok(res.warnings.includes('ledstrip.warn_strip_dominates'));
    assert.ok(res.branches[0].optimalFeedPoints === null || res.branches[0].optimalFeedPoints > 1);
  });
  test('12 В длиннее 5 м — совет перейти на 24 В', () => {
    assert.ok(calcStripSystem({ ...BASE, voltage: 12, length: 6 }).warnings.includes('ledstrip.warn_prefer_24v'));
  });
});

describe('calcStripSystem: несколько лент', () => {
  const res = calcStripSystem({
    mode: 'multi-strip', voltage: 24, maxDropPercent: 5, material: 'Cu', parallelWires: 1,
    commonWireLength: 3, psuReserve: 1.25,
    strips: [
      { label: 'Кухня', length: 2, wattPerMeter: 14.4, trackResistance: 0.2, branchLength: 1, feedScheme: 'one' },
      { label: 'Коридор', length: 4, wattPerMeter: 9.6, trackResistance: 0.2, branchLength: 6, feedScheme: 'one' },
    ],
  });
  test('общий ток — сумма лент: 1.2 + 1.6 = 2.8 А', () => assertClose(res.totalCurrent, 2.8, { abs: 1e-12 }));
  test('общий провод подобран и укладывается в допуск', () => {
    assert.ok(res.commonWire && res.commonWire.section > 0);
    assert.ok(res.dropPercent <= 5);
  });
  test('худшая ветка — с наибольшей суммарной просадкой', () => {
    const max = Math.max(...res.branches.map(b => b.dropTotal));
    assert.equal(res.branches[res.worstBranch].dropTotal, max);
  });
});

describe('calcStripSystem: корректность ввода', () => {
  const cases = [
    ['нулевое напряжение', { voltage: 0 }, 'ledstrip.err_voltage'],
    ['нулевая длина', { length: 0 }, 'ledstrip.err_length'],
    ['отрицательная длина', { length: -3 }, 'ledstrip.err_length'],
    ['нулевая мощность на метр', { wattPerMeter: 0 }, 'ledstrip.err_power'],
    ['отрицательное сопротивление дорожек', { trackResistance: -0.1 }, 'ledstrip.err_track'],
    ['нулевой допуск', { maxDropPercent: 0 }, 'ledstrip.err_drop'],
    ['одна «точка» в схеме из нескольких точек', { feedScheme: 'multi', feedPoints: 1 }, 'ledstrip.err_points'],
  ];
  for (const [name, patch, error] of cases) {
    test(`${name} → ${error}`, () => assert.equal(calcStripSystem({ ...BASE, ...patch }).error, error));
  }
  test('мульти-режим без лент — отказ', () => {
    assert.equal(calcStripSystem({ mode: 'multi-strip', strips: [] }).error, 'ledstrip.err_no_strips');
  });
});
