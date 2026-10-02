/* Калькулятор «Заземляющий контур» — /groundcircuit/.
 *
 * Эталон (справочник по проектированию электроснабжения, ПУЭ п. 1.7.16):
 *   вертикальный электрод  Rв = ρ/(2πLв) · ln(4Lв/d);
 *   горизонтальная полоса  Rг = ρ/(2πLг) · ln(2Lг²/(b·h));
 *   контур                 R = 1 / (n·ηв/Rв + ηг/Rг).
 * Коэффициенты использования ηв/ηг на странице объявлены ориентировочными;
 * здесь они взяты из той же ступенчатой таблицы (n ≤ 4: 0.65/0.45, n ≤ 10: 0.6/0.34,
 * n ≤ 6: 0.65/0.40, n ≤ 20: 0.55/0.27), поэтому сценарии проверяют формулы, а не саму таблицу.
 */
import { test } from '@playwright/test';
import { openCalc, describeCases, describeInputValidation, expectFormulaPanel } from './helpers.mjs';

const BUTTON = 'btn-gc-calc';

test.describe('Заземляющий контур', () => {
  describeCases({
    pageId: 'groundcircuit', button: BUTTON,
    cases: [
      // Rв = 35.12, Rг = 14.12, R = 1/(4·0.65/35.12 + 0.45/14.12) = 9.44 Ом > 4
      { name: '4 электрода по 3 м, полоса 10 м, ρ = 100',
        input: { 'gc-rho': 100, 'gc-Lv': 3, 'gc-dv': 16, 'gc-Lh': 10, 'gc-bh': 40, 'gc-hh': 0.7, 'gc-n': 4, 'gc-Rreq': 4 },
        expected: { '#gc-Rv': 35.12, '#gc-Rh': 14.12, '#gc-result-val': 9.44, '#gc-status': 'Нужно больше' } },
      // Rв = 79.13, Rг = 13.63, R = 9.92 Ом
      { name: '10 электродов по 2.5 м, полоса 25 м, ρ = 200',
        input: { 'gc-rho': 200, 'gc-Lv': 2.5, 'gc-dv': 20, 'gc-Lh': 25, 'gc-bh': 40, 'gc-hh': 0.7, 'gc-n': 10, 'gc-Rreq': 4 },
        expected: { '#gc-Rv': 79.13, '#gc-Rh': 13.63, '#gc-result-val': 9.92 } },
      // Rв = 11.35, Rг = 3.94, R = 2.25 Ом ≤ 10 — достаточно
      { name: '6 электродов по 5 м, полоса 20 м, ρ = 50 — норма выполнена',
        input: { 'gc-rho': 50, 'gc-Lv': 5, 'gc-dv': 16, 'gc-Lh': 20, 'gc-bh': 50, 'gc-hh': 0.8, 'gc-n': 6, 'gc-Rreq': 10 },
        expected: { '#gc-Rv': 11.35, '#gc-Rh': 3.94, '#gc-result-val': 2.25, '#gc-status': 'Достаточно' } },
      // Rв = 103.49, Rг = 14.30, R = 7.99 Ом
      { name: '20 электродов, ρ = 300, мелкое заложение 0.5 м',
        input: { 'gc-rho': 300, 'gc-Lv': 3, 'gc-dv': 18, 'gc-Lh': 40, 'gc-bh': 40, 'gc-hh': 0.5, 'gc-n': 20, 'gc-Rreq': 4 },
        expected: { '#gc-Rv': 103.49, '#gc-Rh': 14.3, '#gc-result-val': 7.99 } },
    ],
  });

  test('формулы электрода, полосы и контура показаны полностью', async ({ page }) => {
    await openCalc(page, 'groundcircuit');
    await expectFormulaPanel(page, { formula: ['ln(4Lв/d)', 'ln(2Lг²/(b·h))', 'n·ηв/Rв'], ref: ['ПУЭ'] });
  });

  describeInputValidation({
    pageId: 'groundcircuit', button: BUTTON, result: '#gc-result-val',
    required: ['gc-rho', 'gc-Lv', 'gc-dv', 'gc-Lh', 'gc-n', 'gc-Rreq'],
    nonNegative: ['gc-rho', 'gc-Rreq'],
    positive: ['gc-Lv', 'gc-dv', 'gc-Lh', 'gc-n'],
    comma: { field: 'gc-hh', text: '0,8', same: '0.8' },
    huge: ['gc-rho'],
  });
});
