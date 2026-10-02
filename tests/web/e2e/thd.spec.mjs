/* Калькулятор «THD гармоники» — /thd/.
 *
 * Эталон (IEC 61000-4-7, IEEE 519): THD = √(Σ Hn²) / H1 · 100 %, n ≥ 2;
 * действующее значение с гармониками Irms = I1 · √(1 + THD²).
 * Пределы IEEE 519-2014 для напряжения: до 1 кВ — 8 %, 1…69 кВ — 5 %;
 * ГОСТ 32144-2013 для сети 0.38 кВ — 8 %.
 */
import { test, expect } from '@playwright/test';
import { openCalc, fillTable, fillFields, calculate, expectResults, expectNoGarbage, knownDefect, expectFormulaPanel } from './helpers.mjs';

const BUTTON = 'btn-thd-calc';
const TABLE = { table: '#thd-table', add: 'btn-thd-add', remove: 'btn-thd-remove' };
const h = (order, amp) => ({ '.thd-order': order, '.thd-amp': amp });

const CASES = [
  // √(400 + 100 + 25) = 22.91 %; Irms = 100·√1.0525 = 102.6
  { name: '3-я 20 %, 5-я 10 %, 7-я 5 %', rows: [h(3, 20), h(5, 10), h(7, 5)], expected: { '#thd-result-val': 22.91, '#thd-rms': 102.6, '#thd-status': 'Высокий' } },
  // √(9 + 4) = 3.61 % — в норме
  { name: 'малые гармоники 3 % и 2 %', rows: [h(5, 3), h(7, 2)], expected: { '#thd-result-val': 3.61, '#thd-rms': 100.1, '#thd-status': 'Допустимо' } },
  // √(16 + 9 + 4 + 1) = 5.48 %
  { name: 'четыре гармоники', rows: [h(3, 4), h(5, 3), h(7, 2), h(11, 1)], expected: { '#thd-result-val': 5.48 } },
  // Строка с порядком 1 — это основная гармоника, в THD не входит
  { name: 'строка первого порядка не учитывается', rows: [h(1, 50), h(3, 30)], expected: { '#thd-result-val': 30, '#thd-rms': 104.4 } },
];

test.describe('THD гармоники', () => {
  test.describe('достоверность расчёта', () => {
    for (const c of CASES) {
      test(c.name, async ({ page }) => {
        await openCalc(page, 'thd');
        await fillFields(page, { 'thd-fund': 100 });
        await fillTable(page, { ...TABLE, rows: c.rows });
        await calculate(page, BUTTON);
        for (const [sel, exp] of Object.entries(c.expected)) {
          if (typeof exp === 'number') await expectResults(page, { [sel]: exp });
          else await expect(page.locator(sel)).toContainText(exp);
        }
        await expectNoGarbage(page);
      });
    }
  });

  test('формула THD', async ({ page }) => {
    await openCalc(page, 'thd');
    await expectFormulaPanel(page, { formula: ['√(H2² + H3²', '/ H1'], ref: ['IEEE 519'] });
  });

  test('предел THD напряжения соответствует IEEE 519-2014 для сетей до 1 кВ', async ({ page }) => {
    knownDefect('на странице «IEEE 519: THD ≤ 5 % для напряжения», но 5 % — предел для 1…69 кВ; для сетей до 1 кВ IEEE 519-2014 и ГОСТ 32144 дают 8 %');
    await openCalc(page, 'thd');
    await expectFormulaPanel(page, { ref: ['8'] });
  });

  test('пустая амплитуда не даёт NaN', async ({ page }) => {
    await openCalc(page, 'thd');
    await fillTable(page, { ...TABLE, rows: [h(3, ''), h(5, 5)] });
    await calculate(page, BUTTON);
    await expectNoGarbage(page);
  });

  test('нулевая основная гармоника — отказ', async ({ page }) => {
    // Поле пустой основной гармоники заменяется на 100, но явный ноль — деление на ноль.
    knownDefect('H1 = 0 читается как «num(...) || 100» и тихо заменяется на 100 %, вместо сообщения об ошибке');
    await openCalc(page, 'thd');
    await fillFields(page, { 'thd-fund': 0 });
    await calculate(page, BUTTON);
    await expect(page.locator('.toast.show')).toHaveCount(1);
  });
});
