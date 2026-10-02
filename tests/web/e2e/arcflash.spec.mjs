/* Калькулятор «Дуговая вспышка» — /arcflash/.
 *
 * Эталон — IEEE 1584-2002, эмпирическая модель для U < 1 кВ (уравнения 1, 4, 5, 7):
 *   lg Ia = K + 0.662·lg Ibf + 0.0966·V + 0.000526·G + 0.5588·V·lg Ibf − 0.00304·G·lg Ibf
 *           (K = −0.153 открыто, −0.097 в шкафу; Ibf в кА, V в кВ, G в мм);
 *   lg En = K1 + K2 + 1.081·lg Ia + 0.0011·G  (K1 = −0.792 / −0.555, K2 = −0.113 при глухом заземлении);
 *   E = 4.184·Cf·En·(t/0.2)·(610/D)^x Дж/см², Cf = 1.5, x = 1.473 (шкаф) или 2.0 (открыто);
 *   граница DB = (4.184·Cf·En·(t/0.2)·610^x / 5.0)^(1/x) мм.
 * Страница выводит энергию в кал/см² (E / 4.184).
 * Категории СИЗ по NFPA 70E: ≤1.2 — 0, ≤4 — 1, ≤8 — 2, ≤25 — 3, ≤40 — 4.
 */
import { test } from '@playwright/test';
import { openCalc, describeCases, describeInputValidation, expectFormulaPanel } from './helpers.mjs';

const BUTTON = 'btn-af-calc';

test.describe('Дуговая вспышка', () => {
  describeCases({
    pageId: 'arcflash', button: BUTTON,
    cases: [
      // Ia = 5.581 кА, E = 1.454 кал/см², DB = 697 мм → категория 1
      { name: '10 кА, 400 В, 0.1 с, шкаф, D = 610 мм',
        input: { 'af-Ibf': 10000, 'af-V': 400, 'af-t': 0.1, 'af-gap': 32, 'af-dist': 610, 'af-config': 'box', 'af-ground': 'ungrounded' },
        expected: { '#af-Ia': 5581, '#af-result-val': 1.5, '#af-boundary': 697, '#af-ppe': '1 (HRC 1)' } },
      // Ia = 11.22 кА, E = 7.34 кал/см², DB = 1560 мм → категория 2
      { name: '20 кА, 480 В, 0.2 с, глухое заземление, D = 455 мм',
        input: { 'af-Ibf': 20000, 'af-V': 480, 'af-t': 0.2, 'af-gap': 32, 'af-dist': 455, 'af-config': 'box', 'af-ground': 'grounded' },
        expected: { '#af-Ia': 11217, '#af-result-val': 7.3, '#af-boundary': 1560, '#af-ppe': '2 (HRC 2)' } },
      // Открытая установка: Ia = 2.915 кА, E = 2.05 кал/см², DB = 799 мм
      { name: '5 кА, 400 В, 0.5 с, открыто, зазор 25 мм',
        input: { 'af-Ibf': 5000, 'af-V': 400, 'af-t': 0.5, 'af-gap': 25, 'af-dist': 610, 'af-config': 'open', 'af-ground': 'ungrounded' },
        expected: { '#af-Ia': 2915, '#af-result-val': 2.1, '#af-boundary': 799 } },
      // 30 кА, 1 с: E = 37.07 кал/см² → категория 4
      { name: '30 кА, 1 с — категория 4',
        input: { 'af-Ibf': 30000, 'af-V': 400, 'af-t': 1, 'af-gap': 32, 'af-dist': 610, 'af-config': 'box', 'af-ground': 'ungrounded' },
        expected: { '#af-Ia': 13268, '#af-result-val': 37.1, '#af-ppe': '4 (HRC 4)' } },
    ],
  });

  test('модель IEEE 1584 и категории NFPA 70E названы на странице', async ({ page }) => {
    await openCalc(page, 'arcflash');
    await expectFormulaPanel(page, { formula: ['IEEE 1584'], ref: ['NFPA 70E', '1.2', '40'] });
  });

  describeInputValidation({
    pageId: 'arcflash', button: BUTTON, result: '#af-result-val',
    required: ['af-Ibf', 'af-V', 'af-t'],
    positive: ['af-Ibf', 'af-V', 'af-t'],
    comma: { field: 'af-t', text: '0,15', same: '0.15' },
    huge: ['af-Ibf'],
  });
});
