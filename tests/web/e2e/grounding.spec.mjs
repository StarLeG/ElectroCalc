/* Калькулятор «Заземляющее устройство» — /grounding/.
 *
 * Эталон: сопротивление одиночного вертикального электрода
 *   R₁ = ρ / (2πL) · ln(4L / d),
 * число электродов n = ⌈R₁ / (Rтреб · η)⌉ при коэффициенте использования η = 0.65.
 */
import { test } from '@playwright/test';
import {
  openCalc, knownDefect, describeCases, describeInputValidation, describePlaceholder, expectFormulaPanel
} from './helpers.mjs';

const BUTTON = 'btn-g-calc';

test.describe('Заземляющее устройство', () => {
  describeCases({
    pageId: 'grounding', button: BUTTON,
    cases: [
      // R₁ = 100/(2π·3)·ln(600) = 33.94 Ом; 33.94/(4·0.65) = 13.05 → 14
      { name: 'суглинок 100 Ом·м, стержень 3 м Ø20 мм, 4 Ом', input: { 'g-rho': 100, 'g-L': 3, 'g-d': 0.02, 'g-Rreq': 4 }, expected: { '#g-result-val': 14 } },
      // R₁ = 300/(2π·2.5)·ln(625) = 122.95 Ом; 122.95/(10·0.65) = 18.9 → 19
      { name: 'супесь 300 Ом·м, 2.5 м Ø16 мм, 10 Ом', input: { 'g-rho': 300, 'g-L': 2.5, 'g-d': 0.016, 'g-Rreq': 10 }, expected: { '#g-result-val': 19 } },
      // R₁ = 50/(2π·5)·ln(666.7) = 10.35 Ом; 10.35/2.6 = 3.98 → 4
      { name: 'глина 50 Ом·м, 5 м Ø30 мм, 4 Ом', input: { 'g-rho': 50, 'g-L': 5, 'g-d': 0.03, 'g-Rreq': 4 }, expected: { '#g-result-val': 4 } },
      // 33.94/(30·0.65) = 1.74 → 2
      { name: 'мягкое требование 30 Ом — достаточно двух', input: { 'g-rho': 100, 'g-L': 3, 'g-d': 0.02, 'g-Rreq': 30 }, expected: { '#g-result-val': 2 } },
    ],
  });

  test('формула одиночного электрода и ссылка на ПУЭ', async ({ page }) => {
    knownDefect('в словаре нет ключа grounding.formula: вместо формулы на странице выводится сам ключ');
    await openCalc(page, 'grounding');
    await expectFormulaPanel(page, { formula: ['ln(4L/d)'], ref: ['ПУЭ'] });
  });

  describePlaceholder({
    pageId: 'grounding', button: BUTTON, result: '#g-result-val',
    defect: 'до расчёта показано 13 электродов, расчёт по тем же данным даёт 14 (33.94 / 2.6 = 13.05, округление вверх)',
  });

  describeInputValidation({
    pageId: 'grounding', button: BUTTON, result: '#g-result-val',
    required: ['g-rho', 'g-L', 'g-d', 'g-Rreq'],
    nonNegative: ['g-rho'],
    positive: ['g-L', 'g-d', 'g-Rreq'],
    comma: { field: 'g-L', text: '2,5', same: '2.5' },
    huge: ['g-rho'],
  });
});
