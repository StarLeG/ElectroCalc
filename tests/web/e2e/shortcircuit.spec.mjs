/* Калькулятор «Ток короткого замыкания» — /shortcircuit/.
 *
 * Эталон — трёхфазное металлическое КЗ: Iкз = U / (√3 · Z),
 * U — линейное напряжение, Z — полное сопротивление до точки КЗ.
 */
import { test } from '@playwright/test';
import {
  openCalc, describeCases, describeInputValidation, describePlaceholder, expectFormulaPanel
} from './helpers.mjs';

const BUTTON = 'btn-sc-calc';

test.describe('Ток короткого замыкания', () => {
  describeCases({
    pageId: 'shortcircuit', button: BUTTON,
    cases: [
      // 380 / (1.7321·0.1) = 2193.9 А, страница округляет до ампера
      { name: '380 В, Z = 0.1 Ом', input: { 'sc-U': 380, 'sc-Z': 0.1 }, expected: { '#sc-result-val': 2194, '#sc-Z-val': 0.1 } },
      // 400 / (1.7321·0.05) = 4618.8 А
      { name: '400 В, Z = 0.05 Ом', input: { 'sc-U': 400, 'sc-Z': 0.05 }, expected: { '#sc-result-val': 4619 } },
      // 690 / (1.7321·0.5) = 796.7 А
      { name: '690 В, Z = 0.5 Ом', input: { 'sc-U': 690, 'sc-Z': 0.5 }, expected: { '#sc-result-val': 797 } },
      // 380 / (1.7321·1.2) = 182.8 А — удалённая точка, ток мал
      { name: '380 В, Z = 1.2 Ом (конец длинной линии)', input: { 'sc-U': 380, 'sc-Z': 1.2 }, expected: { '#sc-result-val': 183 } },
    ],
  });

  test('формула трёхфазного КЗ и ссылка на ПУЭ', async ({ page }) => {
    await openCalc(page, 'shortcircuit');
    await expectFormulaPanel(page, { formula: ['√3', 'Z'], ref: ['ПУЭ'] });
  });

  describePlaceholder({ pageId: 'shortcircuit', button: BUTTON, result: '#sc-result-val' });

  describeInputValidation({
    pageId: 'shortcircuit', button: BUTTON, result: '#sc-result-val',
    required: ['sc-U', 'sc-Z'],
    nonNegative: ['sc-U'],
    positive: ['sc-Z'],
    comma: { field: 'sc-Z', text: '0,25', same: '0.25' },
    huge: ['sc-U'],
  });
});
