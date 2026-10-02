/* Калькулятор «Диаметр → сечение» — /diam2sec/.
 *
 * Эталон: S = π·d²/4, для многопроволочной жилы — S·n; ближайшее стандартное
 * сечение из ряда ГОСТ 22483 (0.5, 0.75, 1, 1.5, 2.5, 4, 6, 10, …).
 */
import { test } from '@playwright/test';
import { openCalc, describeCases, describeInputValidation, describePlaceholder, expectFormulaPanel } from './helpers.mjs';

const BUTTON = 'btn-ds-calc';

test.describe('Диаметр → сечение', () => {
  describeCases({
    pageId: 'diam2sec', button: BUTTON,
    cases: [
      { name: 'Ø1.78 мм → 2.49 мм² (≈ 2.5)', input: { 'ds-d': 1.78, 'ds-n': 1 }, expected: { '#ds-result-val': 2.49, '#ds-Circ': 5.59, '#ds-nearest': 2.5 } },
      { name: 'Ø1.13 мм → 1.00 мм²', input: { 'ds-d': 1.13, 'ds-n': 1 }, expected: { '#ds-result-val': 1.0, '#ds-nearest': 1 } },
      { name: 'Ø2.26 мм → 4.01 мм²', input: { 'ds-d': 2.26, 'ds-n': 1 }, expected: { '#ds-result-val': 4.01, '#ds-nearest': 4 } },
      // 19 проволок Ø0.3: 19 · 0.0707 = 1.343 мм² → ближайшее 1.5
      { name: 'многопроволочная 19×Ø0.3 мм', input: { 'ds-d': 0.3, 'ds-n': 19 }, expected: { '#ds-S': 0.07, '#ds-result-val': 1.34, '#ds-nearest': 1.5 } },
      // 7 проволок Ø0.2: 0.22 мм² → ближайшее 0.5
      { name: 'многопроволочная 7×Ø0.2 мм', input: { 'ds-d': 0.2, 'ds-n': 7 }, expected: { '#ds-result-val': 0.22, '#ds-nearest': 0.5 } },
    ],
  });

  test('формула площади круга', async ({ page }) => {
    await openCalc(page, 'diam2sec');
    await expectFormulaPanel(page, { formula: ['π × d² / 4'] });
  });

  describePlaceholder({ pageId: 'diam2sec', button: BUTTON, result: '#ds-result-val' });

  describeInputValidation({
    pageId: 'diam2sec', button: BUTTON, result: '#ds-result-val',
    required: ['ds-d'],
    positive: ['ds-d'],
    comma: { field: 'ds-d', text: '1,38', same: '1.38' },
    huge: ['ds-d'],
    knownDefects: {
      'zero:ds-d': 'диаметр 0 принимается: сечение 0 мм² и «ближайшее стандартное» 0.5 мм² без предупреждения',
    },
  });
});
