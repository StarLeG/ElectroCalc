/* Калькулятор «Импеданс RLC» — /rlc/.
 *
 * Эталон: XL = 2πfL, XC = 1/(2πfC);
 *   последовательно Z = √(R² + (XL − XC)²), φ = arctg((XL − XC)/R);
 *   параллельно    Y = √(1/R² + (1/XC − 1/XL)²), Z = 1/Y;
 *   резонанс f₀ = 1/(2π√(LC)).
 * Добротность контура определяется на резонансной частоте:
 *   последовательный Q = (1/R)·√(L/C), параллельный Q = R·√(C/L).
 * Для R = 100 Ом, L = 10 мГн, C = 1 мкФ: √(L/C) = 100 Ом, Q = 1 в обоих случаях.
 */
import { test } from '@playwright/test';
import {
  openCalc, fillFields, calculate, expectResults, knownDefect,
  describeCases, describeInputValidation, describePlaceholder, expectFormulaPanel
} from './helpers.mjs';

const BUTTON = 'btn-rlc-calc';
const rlc = (R, L, C, f, type) => ({ 'rlc-R': R, 'rlc-L': L, 'rlc-C': C, 'rlc-f': f, 'rlc-type': type });

test.describe('Импеданс RLC', () => {
  describeCases({
    pageId: 'rlc', button: BUTTON,
    cases: [
      // XL = 62.83, XC = 159.15, X = −96.32; Z = 138.85 Ом; φ = −43.9°; f₀ = 1592 Гц
      { name: 'последовательный: 100 Ом, 10 мГн, 1 мкФ, 1 кГц', input: rlc(100, 10, 1, 1000, 'series'),
        expected: { '#rlc-XL': 62.8, '#rlc-XC': 159.2, '#rlc-X': -96.3, '#rlc-result-val': 138.8, '#rlc-phi': -43.9, '#rlc-fres': 1592 } },
      // На резонансе XL = XC, Z = R, φ = 0
      { name: 'последовательный на резонансе 1591.55 Гц', input: rlc(100, 10, 1, 1591.55, 'series'),
        expected: { '#rlc-result-val': 100, '#rlc-phi': 0 } },
      // Параллельный: B = 1/XC − 1/XL = −0.009632 См; Z = 72.0 Ом; φ = +43.9°
      { name: 'параллельный: 100 Ом, 10 мГн, 1 мкФ, 1 кГц', input: rlc(100, 10, 1, 1000, 'parallel'),
        expected: { '#rlc-result-val': 72.0, '#rlc-phi': 43.9 } },
      // 50 Гц: XL = 31.42, XC = 318.31; Z = 291.2 Ом; φ = −80.1°; f₀ = 159 Гц
      { name: 'последовательный на 50 Гц: 50 Ом, 100 мГн, 10 мкФ', input: rlc(50, 100, 10, 50, 'series'),
        expected: { '#rlc-XL': 31.4, '#rlc-XC': 318.3, '#rlc-result-val': 291.2, '#rlc-phi': -80.1, '#rlc-fres': 159 } },
    ],
  });

  test.describe('добротность — на резонансной частоте', () => {
    for (const type of ['series', 'parallel']) {
      test(type === 'series' ? 'последовательный контур: Q = √(L/C)/R = 1' : 'параллельный контур: Q = R·√(C/L) = 1', async ({ page }) => {
        knownDefect('добротность считается на рабочей частоте (XL/R = 0.63 и R/XL = 1.59), а не на резонансной, где Q = 1');
        await openCalc(page, 'rlc');
        await fillFields(page, rlc(100, 10, 1, 1000, type));
        await calculate(page, BUTTON);
        await expectResults(page, { '#rlc-Q': 1 });
      });
    }
  });

  test('формулы импеданса и резонанса', async ({ page }) => {
    await openCalc(page, 'rlc');
    await expectFormulaPanel(page, { formula: ['√(R² + (XL-XC)²)', 'XL=2πfL'], ref: ['f_рез'] });
  });

  describePlaceholder({
    pageId: 'rlc', button: BUTTON, result: '#rlc-result-val',
    defect: 'до расчёта показано 100.0 Ом, расчёт по тем же данным даёт 138.8 Ом',
  });

  describeInputValidation({
    pageId: 'rlc', button: BUTTON, result: '#rlc-result-val',
    required: ['rlc-R', 'rlc-L', 'rlc-C', 'rlc-f'],
    positive: ['rlc-R', 'rlc-L', 'rlc-C', 'rlc-f'],
    comma: { field: 'rlc-C', text: '0,47', same: '0.47' },
  });
});
