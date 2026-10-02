/* Калькулятор «Светодиод» — /led/.
 *
 * Эталон (закон Ома):
 *   последовательная цепочка из N штук: R = (V − N·Vf) / I;
 *   параллельно — свой резистор на каждый: R = (V − Vf) / I, общий ток N·I;
 *   мощность резистора P = I²·R.
 */
import { test } from '@playwright/test';
import {
  openCalc, fillFields, expectRejected, describeCases, describeInputValidation, describePlaceholder, expectFormulaPanel
} from './helpers.mjs';

const BUTTON = 'btn-led-calc';
const led = (V, Vf, I, N, conn) => ({ 'led-V': V, 'led-Vf': Vf, 'led-I': I, 'led-N': N, 'led-conn': conn });

test.describe('Светодиод', () => {
  describeCases({
    pageId: 'led', button: BUTTON,
    cases: [
      // (12 − 2)/0.02 = 500 Ом; P = 200 мВт; ближайший из ряда 470
      { name: '12 В, 2 В, 20 мА, один светодиод', input: led(12, 2, 20, 1, 'series'),
        expected: { '#led-result-val': 500, '#led-P': 200, '#led-Rnearest': 470, '#led-Itotal': 20 } },
      // (5 − 2)/0.02 = 150 Ом; 60 мВт
      { name: '5 В, красный светодиод', input: led(5, 2, 20, 1, 'series'),
        expected: { '#led-result-val': 150, '#led-P': 60, '#led-Rnearest': 150 } },
      // (12 − 3·3.2)/0.02 = 120 Ом — три белых последовательно
      { name: 'три белых последовательно от 12 В', input: led(12, 3.2, 20, 3, 'series'),
        expected: { '#led-result-val': 120, '#led-P': 48, '#led-Rnearest': 120 } },
      // Параллельно: по 1000 Ом на каждый, общий ток 4·10 = 40 мА
      { name: 'четыре параллельно, 10 мА каждый', input: led(12, 2, 10, 4, 'parallel'),
        expected: { '#led-result-val': 1000, '#led-Itotal': 40, '#led-P': 100 } },
    ],
  });

  test('питание меньше суммы падений — отказ', async ({ page }) => {
    await openCalc(page, 'led');
    await expectRejected(page, { button: BUTTON, result: '#led-result-val' }, () => fillFields(page, led(5, 2, 20, 3, 'series')));
  });

  test('формула последовательной цепочки', async ({ page }) => {
    await openCalc(page, 'led');
    await expectFormulaPanel(page, { formula: ['(V - N×Vf) / I'], ref: ['Параллельно'] });
  });

  describePlaceholder({ pageId: 'led', button: BUTTON, result: '#led-result-val' });

  describeInputValidation({
    pageId: 'led', button: BUTTON, result: '#led-result-val',
    required: ['led-V', 'led-Vf', 'led-I'],
    nonNegative: ['led-V', 'led-Vf'],
    positive: ['led-I'],
    comma: { field: 'led-Vf', text: '3,2', same: '3.2' },
  });
});
