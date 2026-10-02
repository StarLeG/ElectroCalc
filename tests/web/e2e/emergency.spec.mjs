/* Калькулятор «Аварийное освещение» — /emergency/.
 *
 * Алгоритм страницы: Eмин = max(10 % рабочей освещённости, 1 лк);
 * световой поток Eмин·S; мощность Ф / (лм/Вт); ёмкость АКБ 12 В:
 * Wh = P·t/60, Ah = Wh / 12, затем ближайший типоразмер из ряда 20…500 А·ч.
 */
import { test, expect } from '@playwright/test';
import {
  openCalc, fillFields, calculate, knownDefect, describeCases, describeInputValidation, expectFormulaPanel
} from './helpers.mjs';

const BUTTON = 'btn-el-calc';

test.describe('Аварийное освещение', () => {
  describeCases({
    pageId: 'emergency', button: BUTTON,
    cases: [
      // 30 лк · 200 м² = 6000 лм; 60 Вт; 60 Вт·ч; 5 А·ч → 20 А·ч
      { name: '200 м², 300 лк, 60 мин, 100 лм/Вт', input: { 'el-area': 200, 'el-lux': 300, 'el-duration': 60, 'el-lpw': 100 },
        expected: { '#el-minLux': 30, '#el-totalLumen': 6000, '#el-totalW': 60, '#el-batteryWh': 60, '#el-batteryAh': 5, '#el-result-val': 20 } },
      // 10 % от 5 лк = 0.5 лк < 1 → берётся 1 лк; 500 лм, 4.2 Вт, 12.5 Вт·ч
      { name: 'нижний предел 1 лк', input: { 'el-area': 500, 'el-lux': 5, 'el-duration': 180, 'el-lpw': 120 },
        expected: { '#el-minLux': 1, '#el-totalLumen': 500, '#el-batteryWh': 12.5, '#el-result-val': 20 } },
      // 50 лк · 1000 = 50000 лм; 625 Вт; 625 Вт·ч; 52.1 А·ч → 65 А·ч
      { name: '1000 м², 500 лк, 60 мин, 80 лм/Вт', input: { 'el-area': 1000, 'el-lux': 500, 'el-duration': 60, 'el-lpw': 80 },
        expected: { '#el-totalW': 625, '#el-batteryAh': 52.1, '#el-result-val': 65 } },
    ],
  });

  test('ёмкость за пределами ряда — предупреждение, а не верхний типоразмер', async ({ page }) => {
    knownDefect('требуется 625 А·ч, а показывается 500 А·ч (верх ряда) без предупреждения о нехватке');
    await openCalc(page, 'emergency');
    await fillFields(page, { 'el-area': 5000, 'el-lux': 500, 'el-duration': 180, 'el-lpw': 100 });
    await calculate(page, BUTTON);
    await expect(page.locator('#el-result-val')).not.toHaveText('500');
  });

  test('формула и ссылка на СП 52.13330', async ({ page }) => {
    await openCalc(page, 'emergency');
    await expectFormulaPanel(page, { formula: ['10%', '1 лк'], ref: ['СП 52.13330'] });
  });

  describeInputValidation({
    pageId: 'emergency', button: BUTTON, result: '#el-result-val',
    required: ['el-area', 'el-lux', 'el-duration'],
    nonNegative: ['el-area', 'el-lux', 'el-duration'],
    comma: { field: 'el-area', text: '120,5', same: '120.5' },
    huge: ['el-area'],
  });
});
