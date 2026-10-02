/* Калькулятор «Потери в цепи постоянного тока» — /dcvdrop/.
 *
 * Эталон: двухпроводная линия, R = 2·ρ·L/S; ΔU = I·R; P = I²·R;
 * ρ при 20 °C: медь 0.0175, алюминий 0.028 Ом·мм²/м.
 */
import { test } from '@playwright/test';
import { openCalc, describeCases, describeInputValidation, expectFormulaPanel } from './helpers.mjs';

const BUTTON = 'btn-dc-calc';

test.describe('Потери на постоянном токе', () => {
  describeCases({
    pageId: 'dcvdrop', button: BUTTON,
    cases: [
      // R = 2·0.0175·20/2.5 = 0.28 Ом; ΔU = 2.8 В = 11.67 %; P = 28 Вт; на нагрузке 21.2 В
      { name: '10 А, 20 м, 2.5 мм² Cu, 24 В', input: { 'dc-I': 10, 'dc-L': 20, 'dc-S': 2.5, 'dc-U': 24, 'dc-mat': 'Cu' },
        expected: { '#dc-R': 0.28, '#dc-dU': 2.8, '#dc-result-val': 11.67, '#dc-Ploss': 28, '#dc-Uend': 21.2 } },
      // R = 1.1667 Ом; ΔU = 5.83 В = 48.6 % от 12 В
      { name: '5 А, 50 м, 1.5 мм² Cu, 12 В — недопустимая просадка', input: { 'dc-I': 5, 'dc-L': 50, 'dc-S': 1.5, 'dc-U': 12, 'dc-mat': 'Cu' },
        expected: { '#dc-R': 1.167, '#dc-dU': 5.83, '#dc-result-val': 48.61, '#dc-Uend': 6.17 } },
      // R = 2·0.028·10/6 = 0.0933 Ом; ΔU = 2.8 В = 5.83 % от 48 В; P = 84 Вт
      { name: '30 А, 10 м, 6 мм² Al, 48 В', input: { 'dc-I': 30, 'dc-L': 10, 'dc-S': 6, 'dc-U': 48, 'dc-mat': 'Al' },
        expected: { '#dc-R': 0.093, '#dc-dU': 2.8, '#dc-result-val': 5.83, '#dc-Ploss': 84 } },
      // R = 4.667 Ом; ΔU = 9.33 В = 38.9 %
      { name: '2 А, 100 м, 0.75 мм² Cu, 24 В', input: { 'dc-I': 2, 'dc-L': 100, 'dc-S': 0.75, 'dc-U': 24, 'dc-mat': 'Cu' },
        expected: { '#dc-R': 4.667, '#dc-result-val': 38.89, '#dc-Ploss': 18.7 } },
    ],
  });

  test('формула двухпроводной линии', async ({ page }) => {
    await openCalc(page, 'dcvdrop');
    await expectFormulaPanel(page, { formula: ['R = 2ρL/S', 'ΔU = I×R'] });
  });

  describeInputValidation({
    pageId: 'dcvdrop', button: BUTTON, result: '#dc-result-val',
    required: ['dc-I', 'dc-L', 'dc-S', 'dc-U'],
    nonNegative: ['dc-I', 'dc-L'],
    positive: ['dc-S', 'dc-U'],
    comma: { field: 'dc-S', text: '2,5', same: '2.5' },
    huge: ['dc-L'],
    knownDefects: {
      'zero:dc-S': 'сечение 0 проходит validate(): R = 2ρL/0 и на экране «Infinity Ом»',
      'zero:dc-U': 'напряжение 0 проходит validate(): ΔU% = ΔU/0 и на экране «Infinity %»',
    },
  });
});
