/* Калькулятор «Двигатель» — /motor/.
 *
 * Эталон: номинальный ток I = P / (√3 · U · cos φ · η),
 * пусковой Iп = I · kп, автомат — ближайший номинал ряда не меньше 1.25 · I.
 */
import { test } from '@playwright/test';
import {
  openCalc, describeCases, describeInputValidation, describePlaceholder, expectFormulaPanel
} from './helpers.mjs';

const BUTTON = 'btn-m-calc';

test.describe('Ток двигателя', () => {
  describeCases({
    pageId: 'motor', button: BUTTON,
    cases: [
      // 7500/(1.7321·380·0.85·0.9) = 14.90 А; Iп = 104 А; 1.25·I = 18.6 → 20 А
      { name: '7.5 кВт, 380 В, cos 0.85, КПД 0.9, kп 7', input: { 'm-P': 7.5, 'm-U': 380, 'm-cos': 0.85, 'm-eta': 0.9, 'm-k': 7 },
        expected: { '#m-result-val': 14.9, '#m-Istart': 104, '#m-breaker': 20 } },
      // 15000/(1.7321·400·0.88·0.91) = 27.04 А; Iп = 176 А; 33.8 → 40 А
      { name: '15 кВт, 400 В, cos 0.88, КПД 0.91, kп 6.5', input: { 'm-P': 15, 'm-U': 400, 'm-cos': 0.88, 'm-eta': 0.91, 'm-k': 6.5 },
        expected: { '#m-result-val': 27.0, '#m-Istart': 176, '#m-breaker': 40 } },
      // 750/(1.7321·380·0.75·0.78) = 1.95 А; Iп = 10 А; 2.4 → 6 А (наименьший номинал ряда)
      { name: '0.75 кВт — наименьший автомат ряда', input: { 'm-P': 0.75, 'm-U': 380, 'm-cos': 0.75, 'm-eta': 0.78, 'm-k': 5 },
        expected: { '#m-result-val': 1.9, '#m-Istart': 10, '#m-breaker': 6 } },
      // 55000/(1.7321·400·0.9·0.94) = 93.84 А; Iп = 657 А; 117.3 → 125 А
      { name: '55 кВт, 400 В, cos 0.9, КПД 0.94', input: { 'm-P': 55, 'm-U': 400, 'm-cos': 0.9, 'm-eta': 0.94, 'm-k': 7 },
        expected: { '#m-result-val': 93.8, '#m-Istart': 657, '#m-breaker': 125 } },
    ],
  });

  test('формула номинального тока и ссылка на ПУЭ', async ({ page }) => {
    await openCalc(page, 'motor');
    await expectFormulaPanel(page, { formula: ['√3', 'cos φ', 'η'], ref: ['ПУЭ'] });
  });

  describePlaceholder({
    pageId: 'motor', button: BUTTON, result: '#m-result-val',
    defect: 'до расчёта показано 15.0 А, расчёт по тем же данным даёт 14.9 А',
  });

  describeInputValidation({
    pageId: 'motor', button: BUTTON, result: '#m-result-val',
    required: ['m-P', 'm-U', 'm-cos', 'm-eta', 'm-k'],
    nonNegative: ['m-P', 'm-k'],
    positive: ['m-U', 'm-cos', 'm-eta'],
    comma: { field: 'm-P', text: '5,5', same: '5.5' },
    huge: ['m-P'],
  });
});
