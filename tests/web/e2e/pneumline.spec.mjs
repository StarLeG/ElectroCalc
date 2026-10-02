/* Калькулятор «Пневмотрасса» — /pneumline/.
 *
 * Эталон — формула Дарси — Вейсбаха: ΔP = λ · L/D · ρv²/2;
 *   v = Q / (πD²/4), Re = v·D/ν, ν(воздух) = 1.5·10⁻⁵ м²/с;
 *   λ = 64/Re (ламинарный, Re < 2300) или 0.3164/Re^0.25 (Блазиус);
 *   ρ = 1.2 · (P + 1) кг/м³ — плотность воздуха при избыточном давлении P.
 */
import { test } from '@playwright/test';
import { openCalc, describeCases, describeInputValidation, expectFormulaPanel } from './helpers.mjs';

const BUTTON = 'btn-pl-calc';

test.describe('Пневмотрасса', () => {
  describeCases({
    pageId: 'pneumline', button: BUTTON,
    cases: [
      // v = 10.61 м/с, Re = 14147, λ = 0.0290, ρ = 8.4 → ΔP = 0.2058 бар
      { name: '200 л/мин, Ø20 мм, 30 м, 6 бар', input: { 'pl-Q': 200, 'pl-D': 20, 'pl-L': 30, 'pl-P': 6 },
        expected: { '#pl-v': 10.6, '#pl-Re': 14147, '#pl-result-val': 0.206 } },
      // v = 16.58 м/с, Re = 8842 → ΔP = 0.4708 бар
      { name: '50 л/мин, Ø8 мм, 10 м, 6 бар', input: { 'pl-Q': 50, 'pl-D': 8, 'pl-L': 10, 'pl-P': 6 },
        expected: { '#pl-v': 16.6, '#pl-Re': 8842, '#pl-result-val': 0.471 } },
      // v = 33.95 м/с, Re = 56588 → ΔP = 4.54 бар — трасса заведомо мала
      { name: '1000 л/мин, Ø25 мм, 100 м, 7 бар', input: { 'pl-Q': 1000, 'pl-D': 25, 'pl-L': 100, 'pl-P': 7 },
        expected: { '#pl-v': 34.0, '#pl-Re': 56588, '#pl-result-val': 4.541 } },
      // Re = 1415 < 2300 — ламинарный режим, λ = 64/Re
      { name: 'ламинарный режим: 10 л/мин, Ø10 мм', input: { 'pl-Q': 10, 'pl-D': 10, 'pl-L': 5, 'pl-P': 4 },
        expected: { '#pl-Re': 1415, '#pl-result-val': 0.003 } },
    ],
  });

  test('формула Дарси — Вейсбаха', async ({ page }) => {
    await openCalc(page, 'pneumline');
    await expectFormulaPanel(page, { formula: ['λ', 'L/D', 'ρv²/2'] });
  });

  describeInputValidation({
    pageId: 'pneumline', button: BUTTON, result: '#pl-result-val',
    required: ['pl-Q', 'pl-D', 'pl-L', 'pl-P'],
    nonNegative: ['pl-L', 'pl-P'],
    positive: ['pl-Q', 'pl-D'],
    comma: { field: 'pl-P', text: '6,5', same: '6.5' },
    huge: ['pl-Q'],
    knownDefects: {
      'zero:pl-Q': 'расход 0 проходит validate(): Re = 0, λ = 64/0, на экране NaN',
      'zero:pl-D': 'диаметр 0 проходит validate(): скорость Q/0, на экране Infinity/NaN',
    },
  });
});
