/* Калькулятор «Трёхфазная мощность» — /threephase/.
 *
 * Эталон: S = √3·U·I, P = S·cos φ, Q = S·sin φ (U — линейное напряжение).
 */
import { test } from '@playwright/test';
import { openCalc, fillFields, expectRejected, describeCases, describeInputValidation, expectFormulaPanel } from './helpers.mjs';

const BUTTON = 'btn-tp-calc';

test.describe('Трёхфазная мощность', () => {
  describeCases({
    pageId: 'threephase', button: BUTTON,
    cases: [
      // S = 6.582 кВА; P = 5.595 кВт; Q = 3.467 квар
      { name: '380 В, 10 А, cos 0.85', input: { 'tp-U': 380, 'tp-I': 10, 'tp-cos': 0.85 },
        expected: { '#tp-result-val': 5.595, '#tp-P': 5.595, '#tp-Q': 3.467, '#tp-S': 6.582, '#tp-pf': 0.85 } },
      // S = 69.28 кВА; P = 62.35; Q = 30.20
      { name: '400 В, 100 А, cos 0.9', input: { 'tp-U': 400, 'tp-I': 100, 'tp-cos': 0.9 },
        expected: { '#tp-P': 62.35, '#tp-Q': 30.2, '#tp-S': 69.28 } },
      // cos φ = 1: реактивной мощности нет
      { name: 'активная нагрузка: 220 В, 25 А, cos 1', input: { 'tp-U': 220, 'tp-I': 25, 'tp-cos': 1 },
        expected: { '#tp-P': 9.526, '#tp-Q': 0, '#tp-S': 9.526 } },
      // S = 59.76; P = 47.80; Q = 35.85
      { name: '690 В, 50 А, cos 0.8', input: { 'tp-U': 690, 'tp-I': 50, 'tp-cos': 0.8 },
        expected: { '#tp-P': 47.8, '#tp-Q': 35.85, '#tp-S': 59.76 } },
    ],
  });

  test('формулы P, S и Q', async ({ page }) => {
    await openCalc(page, 'threephase');
    await expectFormulaPanel(page, { formula: ['√3 × U × I × cos φ', 'Q = √(S² − P²)'] });
  });

  test('cos φ больше единицы отвергается', async ({ page }) => {
    await openCalc(page, 'threephase');
    await expectRejected(page, { button: BUTTON, result: '#tp-result-val', field: 'tp-cos' }, () => fillFields(page, { 'tp-cos': 1.2 }));
  });

  describeInputValidation({
    pageId: 'threephase', button: BUTTON, result: '#tp-result-val',
    required: ['tp-U', 'tp-I', 'tp-cos'],
    nonNegative: ['tp-U', 'tp-I'],
    positive: ['tp-cos'],
    comma: { field: 'tp-cos', text: '0,9', same: '0.9' },
    huge: ['tp-I'],
  });
});
