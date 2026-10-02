/* Калькулятор «Солнечная электростанция» — /solar/.
 *
 * Алгоритм страницы: число панелей ⌈E·1000 / (Pпан · часы · КПД)⌉;
 * АКБ = E · дни автономии, в А·ч при 48 В; инвертор = ⌈E/8 · 1.25⌉ с шагом 0.1 кВт.
 */
import { test } from '@playwright/test';
import { openCalc, describeCases, describeInputValidation, expectFormulaPanel } from './helpers.mjs';

const BUTTON = 'btn-sp-calc';

test.describe('Солнечная электростанция', () => {
  describeCases({
    pageId: 'solar', button: BUTTON,
    cases: [
      // 10000/(400·5·0.85) = 5.88 → 6 панелей, 2400 Вт; АКБ 10 кВт·ч = 208 А·ч; инвертор 1.6 кВт
      { name: '10 кВт·ч/сут, 5 ч солнца, панели 400 Вт', input: { 'sp-demand': 10, 'sp-sun': 5, 'sp-panel': 400, 'sp-eff': 0.85, 'sp-auto': 1 },
        expected: { '#sp-result-val': 6, '#sp-totalW': 2400, '#sp-batteryKWh': 10, '#sp-batteryAh': 208, '#sp-inverter': 1.6 } },
      // 3000/(300·4·0.8) = 3.125 → 4 панели; 2 дня автономии → 6 кВт·ч, 125 А·ч
      { name: '3 кВт·ч/сут, 2 дня автономии', input: { 'sp-demand': 3, 'sp-sun': 4, 'sp-panel': 300, 'sp-eff': 0.8, 'sp-auto': 2 },
        expected: { '#sp-result-val': 4, '#sp-batteryKWh': 6, '#sp-batteryAh': 125, '#sp-inverter': 0.5 } },
      // 25000/(550·6·0.9) = 8.42 → 9 панелей, 4950 Вт; 37.5 кВт·ч, 781 А·ч; инвертор 4.0 кВт
      { name: '25 кВт·ч/сут, панели 550 Вт', input: { 'sp-demand': 25, 'sp-sun': 6, 'sp-panel': 550, 'sp-eff': 0.9, 'sp-auto': 1.5 },
        expected: { '#sp-result-val': 9, '#sp-totalW': 4950, '#sp-batteryAh': 781, '#sp-inverter': 4 } },
    ],
  });

  test('формула числа панелей', async ({ page }) => {
    await openCalc(page, 'solar');
    await expectFormulaPanel(page, { formula: ['Потребление', 'солн_часы', 'КПД'] });
  });

  describeInputValidation({
    pageId: 'solar', button: BUTTON, result: '#sp-result-val',
    required: ['sp-demand', 'sp-sun', 'sp-panel'],
    nonNegative: ['sp-demand'],
    positive: ['sp-sun', 'sp-panel'],
    comma: { field: 'sp-sun', text: '4,5', same: '4.5' },
    huge: ['sp-demand'],
    knownDefects: {
      'zero:sp-sun': '0 часов солнца проходит validate(): число панелей E/0 = Infinity',
      'zero:sp-panel': 'мощность панели 0 проходит validate(): число панелей E/0 = Infinity',
    },
  });
});
