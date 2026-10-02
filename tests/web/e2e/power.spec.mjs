/* Калькулятор «Ток по мощности» — /power/.
 *
 * Эталон (ПУЭ п. 1.3.10, общая электротехника):
 *   три фазы  I = P / (√3 · U · cos φ · η)
 *   одна фаза I = P / (U · cos φ · η)
 *   полная потребляемая мощность S = P / (cos φ · η)
 * Значения ниже посчитаны вручную по этим формулам, а не взяты из кода сайта.
 */
import { test } from '@playwright/test';
import {
  openCalc, fillFields, expectRejected, knownDefect,
  describeCases, describeInputValidation, describePlaceholder, expectFormulaPanel
} from './helpers.mjs';

const BUTTON = 'btn-power-calc';

test.describe('Ток по мощности', () => {
  describeCases({
    pageId: 'power', button: BUTTON,
    cases: [
      {
        // 2200 / (1.7321·380·0.85·0.92) = 4.274 А; S = 2.2/(0.85·0.92) = 2.813 кВА
        name: 'двигатель 2.2 кВт, 380 В, 3 фазы, cos 0.85, КПД 0.92',
        input: { 'p-power': 2.2, 'p-u': 380, 'p-phase': 3, 'p-cos': 0.85, 'p-eta': 0.92 },
        expected: { '#power-result-val': 4.274, '#power-I': 4.274, '#power-S': 2.813 },
      },
      {
        // 15000 / (1.7321·400·0.9) = 24.056 А; S = 16.667 кВА
        name: 'нагрузка 15 кВт, 400 В, 3 фазы, cos 0.9, КПД 1',
        input: { 'p-power': 15, 'p-u': 400, 'p-phase': 3, 'p-cos': 0.9, 'p-eta': 1 },
        expected: { '#power-result-val': 24.056, '#power-S': 16.667 },
      },
      {
        // Хрестоматийное: 1 кВт активной нагрузки на 220 В — 4.545 А
        name: 'активная нагрузка 1 кВт, 220 В, 1 фаза',
        input: { 'p-power': 1, 'p-u': 220, 'p-phase': 1, 'p-cos': 1, 'p-eta': 1 },
        expected: { '#power-result-val': 4.545, '#power-S': 1.0 },
      },
      {
        // 7500 / (1.7321·380·0.85·0.9) = 14.896 А
        name: 'двигатель 7.5 кВт, 380 В, cos 0.85, КПД 0.9',
        input: { 'p-power': 7.5, 'p-u': 380, 'p-phase': 3, 'p-cos': 0.85, 'p-eta': 0.9 },
        expected: { '#power-result-val': 14.896, '#power-S': 9.804 },
      },
      {
        // Граничный cos φ = 0.5: 100 / (230·0.5·0.8) = 1.087 А
        name: 'малая нагрузка 0.1 кВт, 230 В, cos 0.5, КПД 0.8',
        input: { 'p-power': 0.1, 'p-u': 230, 'p-phase': 1, 'p-cos': 0.5, 'p-eta': 0.8 },
        expected: { '#power-result-val': 1.087, '#power-S': 0.25 },
      },
    ],
  });

  test('формула и норматив соответствуют расчёту трёхфазного тока', async ({ page }) => {
    await openCalc(page, 'power');
    await expectFormulaPanel(page, { formula: ['√3', 'cos φ', 'η'], ref: ['ПУЭ'] });
  });

  describePlaceholder({
    pageId: 'power', button: BUTTON, result: '#power-S',
    defect: 'до расчёта показано 2.59 кВА (это P/cos φ без КПД), а расчёт по тем же данным даёт 2.81 кВА',
  });

  describeInputValidation({
    pageId: 'power', button: BUTTON, result: '#power-result-val',
    required: ['p-power', 'p-u', 'p-cos', 'p-eta'],
    nonNegative: ['p-power'],
    positive: ['p-u', 'p-eta', 'p-cos'],
    comma: { field: 'p-power', text: '2,5', same: '2.5' },
    huge: ['p-power'],
  });

  test('cos φ больше единицы отвергается', async ({ page }) => {
    await openCalc(page, 'power');
    await expectRejected(page, { button: BUTTON, result: '#power-result-val', field: 'p-cos' },
      () => fillFields(page, { 'p-cos': 1.2 }));
  });

  test('КПД больше единицы отвергается', async ({ page }) => {
    knownDefect('КПД проверяется только на положительность (validatePositive), η = 1.5 принимается и занижает ток');
    await openCalc(page, 'power');
    await expectRejected(page, { button: BUTTON, result: '#power-result-val', field: 'p-eta' },
      () => fillFields(page, { 'p-eta': 1.5 }));
  });
});
