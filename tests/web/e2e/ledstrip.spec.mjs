/* Калькулятор «Светодиодные ленты» — /ledstrip/.
 *
 * Логика проверена юнит-тестами calcStripSystem() (tests/web/unit/led-strip.test.mjs).
 * Эталон: ток на метр i = (Вт/м)/U; просадка на дорожках ΔU = r·i·L²/k,
 * k = 2 (один конец), 8 (два конца), 8(N−1)² (N точек); провод — 2·I·l·ρ/S.
 *
 * Пример: 24 В, 14.4 Вт/м, 3 м, r = 0.2 Ом/м, питание с одного конца, провод 5 м.
 *   i = 0.6 А/м, I = 1.8 А, ΔUленты = 0.2·0.6·9/2 = 0.54 В;
 *   бюджет 5 % = 1.2 В → на провод 0.66 В → S ≥ 2·1.8·5·0.0175/0.66 = 0.48 мм² → 0.5 мм²;
 *   ΔUпровода = 0.63 В; итого 1.17 В = 4.88 %; БП 43.2·1.25 = 54 Вт → 60 Вт.
 */
import { test, expect } from '@playwright/test';
import { openCalc, fillFields, calculate, describeCases, expectFormulaPanel } from './helpers.mjs';

const BUTTON = 'btn-lst-calc';
const BASE = {
  'lst-mode': 'single', 'lst-U': 24, 'lst-drop': 5, 'lst-type': 'custom', 'lst-wpm': 14.4, 'lst-L': 3,
  'lst-scheme': 'one', 'lst-wire': 5, 'lst-r': 0.2, 'lst-mat': 'Cu', 'lst-par': 1, 'lst-temp': 25,
  'lst-lay': 'air', 'lst-reserve': 1.25, 'lst-psu-have': 0,
};

test.describe('Светодиодные ленты', () => {
  describeCases({
    pageId: 'ledstrip', button: BUTTON,
    cases: [
      { name: '24 В, 3 м, один конец, провод 5 м', input: BASE,
        expected: { '#lst-result-val': 0.5, '#lst-Itotal': 1.8, '#lst-Ptotal': 43.2, '#lst-dropStrip': 0.54,
          '#lst-dropWire': 0.63, '#lst-dropPct': 4.88, '#lst-psu': 60 } },
      // Два конца: ΔUленты = 0.2·0.6·25/8 = 0.375 В; ток провода 1.5 А
      { name: '5 м, питание с двух концов', input: { ...BASE, 'lst-L': 5, 'lst-scheme': 'both', 'lst-wire': 3 },
        expected: { '#lst-Itotal': 3, '#lst-dropStrip': 0.38, '#lst-Ptotal': 72 } },
      // 12 В, 5 м, r = 0.2: i = 1.2 А/м, ΔU = 0.2·1.2·25/2 = 3 В = 25 % — лента сама съедает бюджет
      { name: '12 В, 5 м — просадка на ленте больше допуска', input: { ...BASE, 'lst-U': 12, 'lst-L': 5 },
        expected: { '#lst-dropStrip': 3 } },
    ],
  });

  test('при просадке на ленте больше допуска выдано предупреждение', async ({ page }) => {
    await openCalc(page, 'ledstrip');
    await fillFields(page, { ...BASE, 'lst-U': 12, 'lst-L': 5 });
    await calculate(page, BUTTON);
    await expect(page.locator('#lst-warnings .warn-item')).not.toHaveCount(0);
    await expect(page.locator('#lst-chart svg')).toHaveCount(1);
  });

  test('формула просадки с коэффициентами схем питания', async ({ page }) => {
    await openCalc(page, 'ledstrip');
    await expectFormulaPanel(page, { formula: ['r · i · L² / k', '8(N−1)²'], ref: ['ПУЭ табл. 1.3.4'] });
  });

  test('нулевая длина ленты — отказ', async ({ page }) => {
    await openCalc(page, 'ledstrip');
    await fillFields(page, { ...BASE, 'lst-L': 0 });
    await calculate(page, BUTTON);
    await expect(page.locator('.toast.show')).toHaveCount(1);
  });

  test('название ленты с разметкой выводится как текст', async ({ page }) => {
    await openCalc(page, 'ledstrip');
    await fillFields(page, { 'lst-mode': 'multi-strip' });
    await page.locator('#lst-table tbody tr').first().locator('.lst-label').fill('<img src=x onerror=alert(1)>');
    await calculate(page, BUTTON);
    await expect(page.locator('#lst-branches')).toContainText('<img');
    await expect(page.locator('#lst-branches img')).toHaveCount(0);
  });
});
