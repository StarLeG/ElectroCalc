/* Калькулятор «ИБП и АКБ» — /ups/.
 *
 * Эталон: ёмкость батареи Ah = P · t / (U · η · DoD), t в часах, DoD = 0.8;
 * мощность резервного генератора S = P / 0.8 / η.
 * Пример: 5 кВт · 0.5 ч = 2.5 кВт·ч; 2500 / 12 В = 208.3 А·ч; / (0.9 · 0.8) = 289.4 А·ч.
 */
import { test } from '@playwright/test';
import {
  openCalc, describeCases, describeInputValidation, describePlaceholder, expectFormulaPanel
} from './helpers.mjs';

const BUTTON = 'btn-u-calc';

test.describe('ИБП', () => {
  describeCases({
    pageId: 'ups', button: BUTTON,
    cases: [
      { name: '5 кВт, 30 мин, 12 В, η 0.9', input: { 'u-P': 5, 'u-t': 30, 'u-U': 12, 'u-eta': 0.9 },
        expected: { '#u-result-val': 289, '#u-Ah': 289, '#u-gen': 6.94 } },
      // 1 кВт · 1 ч / (24 · 0.85 · 0.8) = 61.3 А·ч
      { name: '1 кВт, 60 мин, 24 В, η 0.85', input: { 'u-P': 1, 'u-t': 60, 'u-U': 24, 'u-eta': 0.85 },
        expected: { '#u-result-val': 61, '#u-gen': 1.47 } },
      // 10 кВт · 0.25 ч / (48 · 0.95 · 0.8) = 68.5 А·ч
      { name: '10 кВт, 15 мин, 48 В, η 0.95', input: { 'u-P': 10, 'u-t': 15, 'u-U': 48, 'u-eta': 0.95 },
        expected: { '#u-result-val': 69, '#u-gen': 13.16 } },
    ],
  });

  test('формула учитывает глубину разряда', async ({ page }) => {
    await openCalc(page, 'ups');
    await expectFormulaPanel(page, { formula: ['DoD', 'η'] });
  });

  describePlaceholder({
    pageId: 'ups', button: BUTTON, result: '#u-result-val',
    defect: 'до расчёта показано 1389 А·ч, расчёт по тем же данным (5 кВт, 30 мин, 12 В, η 0.9) даёт 289',
  });

  describeInputValidation({
    pageId: 'ups', button: BUTTON, result: '#u-result-val',
    required: ['u-P', 'u-t', 'u-U', 'u-eta'],
    nonNegative: ['u-P', 'u-t'],
    positive: ['u-U', 'u-eta'],
    comma: { field: 'u-eta', text: '0,85', same: '0.85' },
    huge: ['u-P'],
  });
});
