/* Калькулятор «Потери в кабеле» — /cableloss/.
 *
 * Эталон: сопротивление жилы R = ρ·L/S; потери трёхфазной линии 3·I²·R,
 * однофазной — I²·R с R = 2ρL/S (прямой и обратный провод);
 * годовые потери при круглосуточной работе — P · 8760 ч.
 * Доля потерь — от полной мощности √3·U·I (одна фаза: U·I).
 */
import { test, expect } from '@playwright/test';
import { openCalc, knownDefect, describeCases, describeInputValidation } from './helpers.mjs';

const BUTTON = 'btn-cl-loss-calc';

test.describe('Потери в кабеле', () => {
  describeCases({
    pageId: 'cableloss', button: BUTTON,
    cases: [
      // R = 0.0175·50/4 = 0.2188 Ом; 3·625·0.2188 = 410.2 Вт; доля 410/16454 = 2.49 %
      { name: '3 фазы, 25 А, 50 м, 4 мм² Cu', input: { 'cl-I': 25, 'cl-L': 50, 'cl-S': 4, 'cl-U': 380, 'cl-mat': 'Cu', 'cl-phase': 3, 'cl-price': 5.5 },
        expected: { '#cl-R': 0.219, '#cl-Ploss': 410.2, '#cl-result-val': 2.49, '#cl-annual': 3593, '#cl-cost': 19761 } },
      // R = 2·0.0175·30/2.5 = 0.42 Ом; 256·0.42 = 107.5 Вт; 107.5/3520 = 3.05 %
      { name: '1 фаза, 16 А, 30 м, 2.5 мм² Cu', input: { 'cl-I': 16, 'cl-L': 30, 'cl-S': 2.5, 'cl-U': 220, 'cl-mat': 'Cu', 'cl-phase': 1, 'cl-price': 5.5 },
        expected: { '#cl-R': 0.42, '#cl-Ploss': 107.5, '#cl-result-val': 3.05, '#cl-annual': 942 } },
      // R = 0.028·100/35 = 0.08 Ом; 3·10000·0.08 = 2400 Вт; 2400/69282 = 3.46 %; 21024 кВт·ч · 0.2
      { name: '3 фазы, 100 А, 100 м, 35 мм² Al', input: { 'cl-I': 100, 'cl-L': 100, 'cl-S': 35, 'cl-U': 400, 'cl-mat': 'Al', 'cl-phase': 3, 'cl-price': 0.2 },
        expected: { '#cl-R': 0.08, '#cl-Ploss': 2400, '#cl-result-val': 3.46, '#cl-annual': 21024, '#cl-cost': 4205 } },
      // R = 2·0.0175·20/1.5 = 0.4667 Ом; 100·0.4667 = 46.7 Вт
      { name: '1 фаза, 10 А, 20 м, 1.5 мм², тариф 10', input: { 'cl-I': 10, 'cl-L': 20, 'cl-S': 1.5, 'cl-U': 230, 'cl-mat': 'Cu', 'cl-phase': 1, 'cl-price': 10 },
        expected: { '#cl-Ploss': 46.7, '#cl-result-val': 2.03, '#cl-cost': 4088 } },
    ],
  });

  test('формула потерь учитывает три фазы', async ({ page }) => {
    knownDefect('на странице записано «Pпот = I² × R», а для трёхфазной линии считается 3·I²·R');
    await openCalc(page, 'cableloss');
    await expect(page.locator('.page.active .formula').first()).toContainText(/3\s*[×·]\s*I²/);
  });

  describeInputValidation({
    pageId: 'cableloss', button: BUTTON, result: '#cl-result-val',
    required: ['cl-I', 'cl-L', 'cl-S', 'cl-U'],
    nonNegative: ['cl-I', 'cl-L'],
    positive: ['cl-S', 'cl-U'],
    comma: { field: 'cl-S', text: '2,5', same: '2.5' },
    huge: ['cl-L'],
    knownDefects: {
      'zero:cl-S': 'сечение 0 проходит validate(): R = ρL/0, на экране «Infinity Ом»',
      'zero:cl-U': 'напряжение 0 проходит validate(): доля потерь делится на ноль',
    },
  });
});
