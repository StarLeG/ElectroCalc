/* Калькулятор «Таблица RTD» — /rtdtable/.
 *
 * Эталон — номинальная статическая характеристика по IEC 60751 / ГОСТ 6651
 * (α = 0.00385). Табличные значения для Pt100:
 *   −200 °C → 18.5201 Ом;  −100 °C → 60.2558;  0 → 100.0000;
 *    100 °C → 138.5055;     200 °C → 175.8560;  850 °C → 390.4811.
 * Pt500 и Pt1000 — те же значения, умноженные на 5 и 10.
 */
import { test } from '@playwright/test';
import { openCalc, fillFields, expectRejected, describeCases, expectFormulaPanel } from './helpers.mjs';

const BUTTON = 'btn-rt-calc';

test.describe('Таблица RTD', () => {
  describeCases({
    pageId: 'rtdtable', button: BUTTON,
    cases: [
      { name: 'Pt100, 100 °C → 138.506 Ом', input: { 'rt-type': 'Pt100', 'rt-mode': 't2r', 'rt-val': 100 }, expected: { '#rt-result-unit': 138.5055 } },
      { name: 'Pt100, 0 °C → 100 Ом', input: { 'rt-type': 'Pt100', 'rt-mode': 't2r', 'rt-val': 0 }, expected: { '#rt-result-unit': 100 } },
      { name: 'Pt100, −100 °C → 60.256 Ом (член C Каллендара — Ван Дюзена)', input: { 'rt-type': 'Pt100', 'rt-mode': 't2r', 'rt-val': -100 }, expected: { '#rt-result-unit': 60.2558 } },
      { name: 'Pt100, −200 °C → 18.520 Ом (нижний предел)', input: { 'rt-type': 'Pt100', 'rt-mode': 't2r', 'rt-val': -200 }, expected: { '#rt-result-unit': 18.5201 } },
      { name: 'Pt100, 850 °C → 390.481 Ом (верхний предел)', input: { 'rt-type': 'Pt100', 'rt-mode': 't2r', 'rt-val': 850 }, expected: { '#rt-result-unit': 390.4811 } },
      { name: 'Pt1000, 200 °C → 1758.560 Ом', input: { 'rt-type': 'Pt1000', 'rt-mode': 't2r', 'rt-val': 200 }, expected: { '#rt-result-unit': 1758.560 } },
      { name: 'Pt500, 100 °C → 692.528 Ом', input: { 'rt-type': 'Pt500', 'rt-mode': 't2r', 'rt-val': 100 }, expected: { '#rt-result-unit': 692.5275 } },
      { name: 'обратно: Pt100, 138.5055 Ом → 100 °C', input: { 'rt-type': 'Pt100', 'rt-mode': 'r2t', 'rt-val': 138.5055 }, expected: { '#rt-result-unit': 100 } },
      { name: 'обратно: Pt100, 60.2558 Ом → −100 °C', input: { 'rt-type': 'Pt100', 'rt-mode': 'r2t', 'rt-val': 60.2558 }, expected: { '#rt-result-unit': -100 } },
      { name: 'обратно: Pt1000, 1758.56 Ом → 200 °C', input: { 'rt-type': 'Pt1000', 'rt-mode': 'r2t', 'rt-val': 1758.56 }, expected: { '#rt-result-unit': 200 } },
    ],
  });

  test('формула и ссылка на IEC 60751', async ({ page }) => {
    await openCalc(page, 'rtdtable');
    await expectFormulaPanel(page, { formula: ['3.9083e-3', '-5.775e-7'], ref: ['IEC 60751'] });
  });

  test.describe('корректность ввода', () => {
    test('температура за пределами −200…850 °C — отказ', async ({ page }) => {
      await openCalc(page, 'rtdtable');
      await expectRejected(page, { button: BUTTON, result: '#rt-result-unit' },
        () => fillFields(page, { 'rt-mode': 't2r', 'rt-val': 900 }));
    });
    test('нулевое сопротивление — отказ', async ({ page }) => {
      await openCalc(page, 'rtdtable');
      await expectRejected(page, { button: BUTTON, result: '#rt-result-unit' },
        () => fillFields(page, { 'rt-mode': 'r2t', 'rt-val': 0 }));
    });
    test('пустое значение — отказ', async ({ page }) => {
      await openCalc(page, 'rtdtable');
      await expectRejected(page, { button: BUTTON, result: '#rt-result-unit' }, () => fillFields(page, { 'rt-val': '' }));
    });
  });
});
