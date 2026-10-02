/* Калькулятор «Освещение» — /lighting/.
 *
 * Метод коэффициента использования (СП 52.13330):
 *   N = E · S · Kз / (Φ · η), округление вверх.
 * На странице нет поля Kз, поэтому сценарии ниже считают с Kз = 1 —
 * так считает сам калькулятор. Отдельный тест фиксирует, что формула на
 * странице с этим расходится.
 */
import { test, expect } from '@playwright/test';
import {
  openCalc, knownDefect, describeCases, describeInputValidation, describePlaceholder, expectFormulaPanel
} from './helpers.mjs';

const BUTTON = 'btn-l-calc';

test.describe('Освещение', () => {
  describeCases({
    pageId: 'lighting', button: BUTTON,
    cases: [
      // 300·50/(3000·0.6) = 8.33 → 9 светильников, 9·36 = 324 Вт, 6.48 Вт/м²
      { name: 'офис 50 м², 300 лк, 3000 лм, η 0.6', input: { 'l-S': 50, 'l-E': 300, 'l-phi': 3000, 'l-W': 36, 'l-eta': 0.6 },
        expected: { '#l-result-val': 9, '#l-P': 324, '#l-ud': 6.5 } },
      // 500·20/(4000·0.5) = 5 ровно → 5 (без лишнего светильника)
      { name: 'ровное деление: 20 м², 500 лк, 4000 лм, η 0.5', input: { 'l-S': 20, 'l-E': 500, 'l-phi': 4000, 'l-W': 40, 'l-eta': 0.5 },
        expected: { '#l-result-val': 5, '#l-P': 200, '#l-ud': 10 } },
      // 200·100/(2500·0.55) = 14.55 → 15, 450 Вт, 4.5 Вт/м²
      { name: 'склад 100 м², 200 лк, 2500 лм, η 0.55', input: { 'l-S': 100, 'l-E': 200, 'l-phi': 2500, 'l-W': 30, 'l-eta': 0.55 },
        expected: { '#l-result-val': 15, '#l-P': 450, '#l-ud': 4.5 } },
    ],
  });

  test('ссылка на свод правил по освещению', async ({ page }) => {
    await openCalc(page, 'lighting');
    await expectFormulaPanel(page, { ref: ['СП 52.13330'] });
  });

  test('формула на странице совпадает с алгоритмом расчёта', async ({ page }) => {
    knownDefect('в формуле показан коэффициент запаса Kз, но поля для него нет и в расчёте он не участвует (N = E·S/(Φ·η))');
    await openCalc(page, 'lighting');
    const formula = await page.locator('.page.active .formula').first().textContent();
    const hasKzField = await page.locator('#l-kz').count();
    expect(!formula.includes('Kз') || hasKzField > 0).toBe(true);
  });

  describePlaceholder({ pageId: 'lighting', button: BUTTON, result: '#l-result-val' });

  describeInputValidation({
    pageId: 'lighting', button: BUTTON, result: '#l-result-val',
    required: ['l-S', 'l-E', 'l-phi', 'l-W', 'l-eta'],
    nonNegative: ['l-E', 'l-W'],
    positive: ['l-S', 'l-phi', 'l-eta'],
    comma: { field: 'l-eta', text: '0,55', same: '0.55' },
    huge: ['l-S'],
    knownDefects: {
      'zero:l-S': 'площадь 0 м² проходит validate(): число светильников 0, удельная мощность 0/0 = NaN Вт/м²',
    },
  });
});
