/* Калькулятор «Провод и НШВИ» — /wirecab/.
 *
 * Быстрый режим (формулы показаны на странице):
 *   Lср = (H + W) / 2000 + 0.4 м;  Lобщ = N · Lср · (1 + запас/100);
 *   НШВИ = ⌈N · концов · (1 + запас/100)⌉;  маркировка = ⌈2N · (1 + запас/100)⌉.
 * Округление вверх идёт в штуках, поэтому эталоны считаются в целых числах:
 * 100 проводов с запасом 10 % — это ровно 220 бирок, не 221.
 */
import { test, expect } from '@playwright/test';
import {
  openCalc, fillFields, fillTable, calculate, describeCases, describeInputValidation, expectResults, expectNoGarbage
} from './helpers.mjs';

const BUTTON = 'btn-wc-calc';

/** Переключатель режима оформлен подписью, сама радиокнопка скрыта — жмём подпись. */
async function switchToAdvanced(page) {
  await page.locator('label.wc-radio', { has: page.locator('input[value="advanced"]') }).click();
}

test.describe('Провод и НШВИ', () => {
  describeCases({
    pageId: 'wirecab', button: BUTTON,
    cases: [
      // Lср = 1.8 м; 120·1.8·1.1 = 237.6 м; НШВИ 120·2·1.1 = 264; бирок 264
      { name: 'шкаф 2000×800, 120 проводов, запас 10 %, два конца',
        input: { 'wc-H': 2000, 'wc-W': 800, 'wc-N': 120, 'wc-reserve': 10, 'wc-ends': 2, 'wc-type': 'multi' },
        expected: { '#wc-Lavg': 1.8, '#wc-Ltotal': 237.6, '#wc-nshvi': 264, '#wc-marking': 264 } },
      // Lср = 1.6 м; 40·1.6·1.15 = 73.6 м; НШВИ 40·1·1.15 = 46; бирок 92
      { name: 'шкаф 1800×600, 40 проводов, запас 15 %, один конец',
        input: { 'wc-H': 1800, 'wc-W': 600, 'wc-N': 40, 'wc-reserve': 15, 'wc-ends': 1, 'wc-type': 'multi' },
        expected: { '#wc-Lavg': 1.6, '#wc-Ltotal': 73.6, '#wc-nshvi': 46, '#wc-marking': 92 } },
      // Однопроволочная жила наконечников не требует
      { name: 'однопроволочный провод — НШВИ не нужны',
        input: { 'wc-N': 50, 'wc-type': 'single' },
        expected: { '#wc-nshvi': 0, '#wc-nshvi2': 0 } },
      // 100·2·1.1 = 220 ровно. В двоичной арифметике 200·1.1 = 220.00000000000003,
      // и Math.ceil добавляет лишнюю штуку.
      { name: '100 проводов, запас 10 % — ровно 220 НШВИ и бирок',
        input: { 'wc-H': 2000, 'wc-W': 800, 'wc-N': 100, 'wc-reserve': 10, 'wc-ends': 2, 'wc-type': 'multi' },
        expected: { '#wc-nshvi': 220, '#wc-marking': 220 },
        defect: 'Math.ceil(100·2·(1 + 10/100)) = 221: погрешность плавающей точки даёт лишнюю штуку; то же при 50 проводах (111 вместо 110)' },
      // Двойные НШВИ: 12 сдвоенных подключений · 1.1 = 13.2 → 14
      { name: 'двойные НШВИ считаются по числу сдвоенных подключений',
        input: { 'wc-N': 120, 'wc-reserve': 10, 'wc-type': 'multi', 'wc-nshvi2-count': 12 },
        expected: { '#wc-nshvi2': 14 } },
    ],
  });

  test('расширенный режим: сумма по группам и сводка по сечениям', async ({ page }) => {
    await openCalc(page, 'wirecab');
    await switchToAdvanced(page);
    // Две группы: 10 проводов 1.0 мм² по 1.5 м и 20 проводов 2.5 мм² по 2 м, запас 10 %.
    // Длина: 10·1.5·1.1 + 20·2·1.1 = 16.5 + 44 = 60.5 м
    // НШВИ: ⌈10·2·1.1⌉ + ⌈20·2·1.1⌉ = 22 + 44 = 66
    const rows = page.locator('#wc-groups-table tbody tr');
    if ((await rows.count()) === 0) await page.locator('#btn-wc-add').click();
    await fillTable(page, {
      table: '#wc-groups-table', add: 'btn-wc-add', remove: 'btn-wc-remove',
      rows: [
        { '.wc-g-count': 10, '.wc-g-section': '1.0', '.wc-g-length': 1.5, '.wc-g-type': 'multi', '.wc-g-ends': '2' },
        { '.wc-g-count': 20, '.wc-g-section': '2.5', '.wc-g-length': 2, '.wc-g-type': 'multi', '.wc-g-ends': '2' },
      ],
    });
    await fillFields(page, { 'wc-adv-reserve': 10 });
    await calculate(page, 'btn-wc-adv-calc');
    await expectResults(page, { '#wc-adv-Ltotal': 60.5, '#wc-adv-nshvi': 66 });
    await expect(page.locator('#wc-summary-table tbody tr')).toHaveCount(2);
    await expect(page.locator('#wc-summary-table tbody')).toContainText('НШВИ 1.0-8');
    await expect(page.locator('#wc-summary-table tbody')).toContainText('НШВИ 2.5-10');
    await expectNoGarbage(page);
  });

  test('название группы с разметкой выводится как текст', async ({ page }) => {
    await openCalc(page, 'wirecab');
    await switchToAdvanced(page);
    if ((await page.locator('#wc-groups-table tbody tr').count()) === 0) await page.locator('#btn-wc-add').click();
    await page.locator('#wc-groups-table tbody tr').first().locator('.wc-g-name').fill('<img src=x onerror=alert(1)>');
    await calculate(page, 'btn-wc-adv-calc');
    await expect(page.locator('#wc-summary-table img')).toHaveCount(0);
  });

  describeInputValidation({
    pageId: 'wirecab', button: BUTTON, result: '#wc-Ltotal',
    required: ['wc-H', 'wc-W', 'wc-N'],
    nonNegative: ['wc-H', 'wc-W', 'wc-N', 'wc-reserve'],
    comma: { field: 'wc-reserve', text: '12,5', same: '12.5' },
    huge: ['wc-N'],
    knownDefects: {
      'negative:wc-reserve': 'запас −5 % принимается без проверки: длина и число НШВИ уменьшаются',
    },
  });
});
