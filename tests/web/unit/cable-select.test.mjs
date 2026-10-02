/* Подбор сечения кабеля — selectCable() из web/js/cable-select.js.
 *
 * Эталоны посчитаны вручную по методике ПУЭ гл. 1.3 и ГОСТ Р 50571.5.54
 * (формулы — в комментарии к каждому сценарию), а не повторяют код функции.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { selectCable } from '../../../web/js/cable-select.js';
import { assertClose } from './assert-helpers.mjs';

/** Контрольный пример: трёхфазная линия на лотке, медь, ПВХ, три нагруженные жилы. */
const BASE = {
  netType: 'ac3', voltage: 380, loadMode: 'power', power: 15, cosPhi: 0.9, efficiency: 1,
  material: 'Cu', cores: 3, insulation: 'pvc', laying: 'tray',
  bundleCount: 1, ambientTemp: 25, length: 50, maxDropPercent: 3, parallelCount: 1,
};

describe('selectCable: контрольный пример 15 кВт / 380 В / 50 м', () => {
  const res = selectCable(BASE);
  // I = 15000 / (√3·380·0.9) = 25.32 А
  test('расчётный ток', () => assertClose(res.current, 25.32, { abs: 0.01 }));
  // Kлоток 0.95 · Kжилы 0.90 = 0.855
  test('суммарная поправка', () => assertClose(res.factors.total, 0.855, { abs: 1e-9 }));
  // 2.5 мм²: 27·0.855 = 23.1 А < 25.3 — не проходит; 4 мм²: 38·0.855 = 32.49 А
  test('сечение 4 мм² по нагреву', () => {
    assert.equal(res.section, 4);
    assertClose(res.allowedCurrent, 32.49, { abs: 0.01 });
    assert.equal(res.criteria.find(c => c.name === 'heating').required, 4);
  });
  // θ = 25 + 45·(25.32/32.49)² = 52.3 °C
  test('температура жилы под нагрузкой', () => assertClose(res.conductorTemp, 52.33, { abs: 0.05 }));
  // R = 4.53·(1 + 0.00393·32.33) = 5.106 Ом/км; ΔU = √3·25.32·50·(5.106·0.9 + 0.07·0.4359)/1000 = 10.14 В
  test('потеря напряжения 2.67 %', () => {
    assertClose(res.resistance, 5.106, { abs: 0.002 });
    assertClose(res.dropVolts, 10.14, { abs: 0.02 });
    assertClose(res.dropPercent, 2.668, { abs: 0.005 });
  });
  // Потери 3·I²·R·L = 3·641.1·5.106·0.05 = 491 Вт
  test('потери мощности в линии', () => assertClose(res.powerLoss, 491.0, { rel: 0.005 }));
  test('номинал автомата 32 А', () => assert.equal(res.breaker, 32));
  test('лимитирующий критерий — нагрев', () => assert.equal(res.limiting, 'heating'));
  test('предупреждений нет', () => assert.deepEqual(res.warnings, []));
});

describe('selectCable: влияние условий прокладки', () => {
  test('алюминий требует большего сечения, чем медь', () => {
    assert.ok(selectCable({ ...BASE, material: 'Al' }).section > selectCable(BASE).section);
  });
  // ПУЭ табл. 1.3.3: +45 °C → 0.75; 0.95·0.90·0.75 = 0.641
  test('жара +45 °C снижает поправку до 0.641', () => {
    assertClose(selectCable({ ...BASE, ambientTemp: 45 }).factors.total, 0.641, { abs: 0.001 });
  });
  // Грунт: Kпрокл 1.10, +15 °C → 1.00; 1.10·0.90 = 0.99
  test('прокладка в земле использует свою температурную таблицу', () => {
    const res = selectCable({ ...BASE, laying: 'ground', ambientTemp: 15 });
    assertClose(res.factors.total, 0.99, { abs: 1e-9 });
  });
  // Группа 3 кабеля — 0.85 (ПУЭ табл. 1.3.26)
  test('группа из трёх кабелей даёт поправку 0.85', () => {
    assertClose(selectCable({ ...BASE, bundleCount: 3 }).factors.group, 0.85, { abs: 1e-9 });
  });
  test('два параллельных кабеля не толще одного', () => {
    const one = selectCable({ ...BASE, maxDropPercent: 5 });
    const two = selectCable({ ...BASE, maxDropPercent: 5, parallelCount: 2 });
    assert.ok(two.section <= one.section);
    assert.ok(two.warnings.includes('cable.warn_parallel'));
  });
});

describe('selectCable: прочие критерии', () => {
  // Smin = 5000·√0.2/115 = 19.44 мм² → 25 мм²
  test('термическая стойкость к КЗ', () => {
    const res = selectCable({ ...BASE, scCurrent: 5000, scTime: 0.2 });
    assert.equal(res.section, 25);
    assert.equal(res.limiting, 'thermal');
  });
  test('сшитый полиэтилен (k = 143) выдерживает КЗ меньшим сечением, чем ПВХ (k = 115)', () => {
    const pvc = selectCable({ ...BASE, scCurrent: 5000, scTime: 0.2 });
    const xlpe = selectCable({ ...BASE, insulation: 'xlpe', scCurrent: 5000, scTime: 0.2 });
    // 5000·√0.2/143 = 15.6 мм² → 16 мм²
    assert.equal(xlpe.section, 16);
    assert.ok(xlpe.section < pvc.section);
  });
  // Пуск: 7·25.32 = 177 А; на 4 мм² падение 7·2.67 = 18.7 % > 15 % → нужно больше
  test('падение при пуске двигателя (15 %, ПУЭ 5.3.71) увеличивает сечение', () => {
    const res = selectCable({ ...BASE, startMultiple: 7 });
    assert.ok(res.section > 4);
    assert.ok(res.criteria.some(c => c.name === 'start'));
  });
  // Длинная линия 200 м при 3 %: по нагреву 4 мм², по падению больше
  test('длинная линия: лимитирует падение напряжения', () => {
    const res = selectCable({ ...BASE, length: 200 });
    assert.equal(res.limiting, 'drop');
    assert.ok(res.dropPercent <= 3);
  });
  // Однофазная: I = 3000/(220·0.9) = 15.15 А, множитель падения 2
  test('однофазная сеть', () => {
    const res = selectCable({ ...BASE, netType: 'ac1', voltage: 220, power: 3, length: 30, maxDropPercent: 5 });
    assertClose(res.current, 15.15, { abs: 0.01 });
  });
  // Постоянный ток: I = 2000/24 = 83.3 А, реактанс не участвует
  test('постоянный ток — без реактанса и cos φ', () => {
    const res = selectCable({ ...BASE, netType: 'dc', voltage: 24, power: 2, cosPhi: 0.5, length: 5, maxDropPercent: 5 });
    assertClose(res.current, 83.33, { abs: 0.01 });
    assert.equal(res.reactance, 0);
  });
  test('ток за пределами ряда — сечение не выбирается, есть предупреждение', () => {
    const res = selectCable({ ...BASE, loadMode: 'current', current: 900, maxDropPercent: 10 });
    assert.equal(res.section, null);
    assert.ok(res.warnings.includes('cable.warn_over_range'));
  });
  test('алюминий меньше 16 мм² — предупреждение ПУЭ 7.1.34', () => {
    const res = selectCable({ ...BASE, material: 'Al', power: 3, maxDropPercent: 10 });
    assert.ok(res.section < 16);
    assert.ok(res.warnings.includes('cable.warn_alu_min'));
  });
});

describe('selectCable: корректность ввода', () => {
  const cases = [
    ['нулевое напряжение', { voltage: 0 }, 'cable.err_voltage'],
    ['отрицательное напряжение', { voltage: -380 }, 'cable.err_voltage'],
    ['нулевая длина', { length: 0 }, 'cable.err_length'],
    ['отрицательная длина', { length: -10 }, 'cable.err_length'],
    ['cos φ > 1', { cosPhi: 1.5 }, 'cable.err_cos'],
    ['cos φ = 0', { cosPhi: 0 }, 'cable.err_cos'],
    ['КПД > 1', { efficiency: 1.2 }, 'cable.err_eta'],
    ['нулевая мощность', { power: 0 }, 'cable.err_power'],
    ['нулевой ток в режиме «по току»', { loadMode: 'current', current: 0 }, 'cable.err_current'],
    ['ноль параллельных кабелей', { parallelCount: 0 }, 'cable.err_parallel'],
    ['нулевое допустимое падение', { maxDropPercent: 0 }, 'cable.err_drop'],
    ['нечисловое напряжение', { voltage: 'abc' }, 'cable.err_voltage'],
  ];
  for (const [name, patch, error] of cases) {
    test(`${name} → ${error}`, () => {
      const res = selectCable({ ...BASE, ...patch });
      assert.equal(res.ok, false);
      assert.equal(res.error, error);
    });
  }
  test('строка с числом принимается как число', () => {
    assert.equal(selectCable({ ...BASE, power: '15', voltage: '380' }).section, 4);
  });
  test('пустая температура среды подменяется базовой +25 °C, а не отравляет расчёт NaN', () => {
    const res = selectCable({ ...BASE, ambientTemp: NaN });
    assert.equal(res.ok, true);
    assert.equal(res.factors.temp, 1);
  });
});
