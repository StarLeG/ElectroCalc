/* Калькулятор «Трансформатор» — /transformer/.
 *
 * Эталон: S = P / cos φ; номинальные токи I = S / (√3 · U);
 * установившийся ток КЗ на выводах НН Iкз = Iн.нн · 100 / uк%.
 */
import { test } from '@playwright/test';
import {
  openCalc, describeCases, describeInputValidation, describePlaceholder, expectFormulaPanel
} from './helpers.mjs';

const BUTTON = 'btn-t-calc';

test.describe('Трансформатор', () => {
  describeCases({
    pageId: 'transformer', button: BUTTON,
    cases: [
      // S = 555.6 кВА; Iвн = 32.08 А; Iнн = 801.9 А; Iкз = 801.9·100/5 = 16038 А
      { name: '500 кВт, cos 0.9, 10/0.4 кВ, uк 5 %', input: { 't-P': 500, 't-cos': 0.9, 't-Uvn': 10, 't-unn': 0.4, 't-uk': 5 },
        expected: { '#t-result-val': 556, '#t-Ivn': 32.1, '#t-Inn': 801.9, '#t-Ikz': 16038, '#t-load': 0.9 } },
      // S = 1176.5 кВА; Iвн = 113.2 А; Iнн = 1698.1 А; Iкз = 30874 А
      { name: '1000 кВт, cos 0.85, 6/0.4 кВ, uк 5.5 %', input: { 't-P': 1000, 't-cos': 0.85, 't-Uvn': 6, 't-unn': 0.4, 't-uk': 5.5 },
        expected: { '#t-result-val': 1176, '#t-Ivn': 113.2, '#t-Inn': 1698.1, '#t-Ikz': 30874 } },
      // S = 263.2 кВА; Iвн = 15.19 А; Iнн = 379.8 А; Iкз = 8441 А
      { name: '250 кВт, cos 0.95, 10/0.4 кВ, uк 4.5 %', input: { 't-P': 250, 't-cos': 0.95, 't-Uvn': 10, 't-unn': 0.4, 't-uk': 4.5 },
        expected: { '#t-result-val': 263, '#t-Ivn': 15.2, '#t-Inn': 379.8, '#t-Ikz': 8441 } },
    ],
  });

  test('формула полной мощности и тока', async ({ page }) => {
    await openCalc(page, 'transformer');
    await expectFormulaPanel(page, { formula: ['cos φ', '√3'] });
  });

  describePlaceholder({ pageId: 'transformer', button: BUTTON, result: '#t-result-val' });

  describeInputValidation({
    pageId: 'transformer', button: BUTTON, result: '#t-result-val',
    required: ['t-P', 't-cos', 't-Uvn', 't-unn', 't-uk'],
    nonNegative: ['t-P'],
    positive: ['t-cos', 't-Uvn', 't-unn', 't-uk'],
    comma: { field: 't-unn', text: '0,4', same: '0.4' },
    huge: ['t-P'],
  });
});
