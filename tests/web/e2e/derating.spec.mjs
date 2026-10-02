/* Калькулятор «Дерейтинг» — /derating/.
 *
 * Эталон: Iдоп = Iбаз · kt · kg · kпрокл.
 *   kt — ПУЭ табл. 1.3.3 (жила +70 °C, среда +25 °C — воздух, +15 °C — земля),
 *        в узлах совпадает с √((70 − t)/(70 − tнорм)): 40 °C в воздухе → 0.82, 45 °C → 0.75;
 *   kg — ПУЭ табл. 1.3.26: 2 кабеля — 0.90, 3 — 0.85, 6 — 0.75;
 *   kпрокл — 1.10 для прокладки в земле.
 * Между узлами таблицы — линейная интерполяция.
 */
import { test } from '@playwright/test';
import { openCalc, describeCases, describeInputValidation, describePlaceholder, expectFormulaPanel } from './helpers.mjs';

const BUTTON = 'btn-dr-calc';

test.describe('Дерейтинг', () => {
  describeCases({
    pageId: 'derating', button: BUTTON,
    cases: [
      // 50 · 0.82 · 0.85 = 34.85 А
      { name: '50 А, +40 °C, 3 кабеля, воздух', input: { 'dr-I': 50, 'dr-T': 40, 'dr-N': 3, 'dr-method': 'air' },
        expected: { '#dr-kt': 0.82, '#dr-kg': 0.85, '#dr-ktotal': 0.70, '#dr-result-val': 34.85, '#dr-red': 30.3 } },
      { name: 'нормальные условия — без поправок', input: { 'dr-I': 100, 'dr-T': 25, 'dr-N': 1, 'dr-method': 'air' },
        expected: { '#dr-ktotal': 1, '#dr-result-val': 100, '#dr-red': 0 } },
      // Земля: kt(30 °C) = 0.85, kg(2) = 0.90, kпрокл = 1.10 → 84.15 А
      { name: '100 А, грунт +30 °C, 2 кабеля', input: { 'dr-I': 100, 'dr-T': 30, 'dr-N': 2, 'dr-method': 'ground' },
        expected: { '#dr-kt': 0.85, '#dr-kg': 0.9, '#dr-result-val': 84.15 } },
      // 50 · 0.75 · 0.75 = 28.13 А
      { name: '50 А, +45 °C, 6 кабелей', input: { 'dr-I': 50, 'dr-T': 45, 'dr-N': 6, 'dr-method': 'air' },
        expected: { '#dr-kt': 0.75, '#dr-kg': 0.75, '#dr-result-val': 28.13 } },
      // Интерполяция: 32.5 °C между 0.94 и 0.88 → 0.91
      { name: 'интерполяция kt при +32.5 °C', input: { 'dr-I': 80, 'dr-T': 32.5, 'dr-N': 1, 'dr-method': 'air' },
        expected: { '#dr-kt': 0.91, '#dr-result-val': 72.8 } },
    ],
  });

  test('ссылка на таблицы ПУЭ', async ({ page }) => {
    await openCalc(page, 'derating');
    await expectFormulaPanel(page, { formula: ['k_t', 'k_g'], ref: ['ПУЭ'] });
  });

  describePlaceholder({
    pageId: 'derating', button: BUTTON, result: '#dr-result-val',
    defect: 'до расчёта показано 36.0 А, расчёт по тем же данным даёт 34.9 А (50 · 0.82 · 0.85)',
  });

  describeInputValidation({
    pageId: 'derating', button: BUTTON, result: '#dr-result-val',
    required: ['dr-I', 'dr-T', 'dr-N'],
    nonNegative: ['dr-I', 'dr-N'],
    comma: { field: 'dr-T', text: '32,5', same: '32.5' },
    huge: ['dr-I'],
  });
});
