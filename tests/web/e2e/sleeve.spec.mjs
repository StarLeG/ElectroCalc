/* Калькулятор «Соединительная гильза» — /sleeve/.
 *
 * Логика подбора проверена юнит-тестами calcSleeve() (tests/web/unit/sleeve.test.mjs).
 * Эталон заполнения: Σ(S / kгибкости) / (π·dвн²/4) · 100 %.
 *   2 × 2.5 мм² (класс 1) → ΣS = 5 мм² → ГМЛ-6, dвн 3.6 мм, канал 10.18 мм², 49.1 % — свободно;
 *   1 × 16 мм² (класс 5, k = 0.7) → ГМЛ-16, dвн 5.5 мм: 22.86 / 23.76 = 96.2 % — плотно.
 */
import { test, expect } from '@playwright/test';
import { openCalc, fillFields, fillTable, calculate, expectResults, expectNoGarbage, expectFormulaPanel } from './helpers.mjs';

const BUTTON = 'btn-slv-calc';
const TABLE = { table: '#slv-table', add: 'btn-slv-add', remove: 'btn-slv-remove' };
const wire = (S, qty) => ({ '.slv-s': String(S), '.slv-q': qty });

const CASES = [
  { name: '2 × 2.5 мм² медь, монолит', form: { 'slv-material': 'cu', 'slv-flex': '1' }, rows: [wire(2.5, 2)],
    expected: { '#slv-result-val': 'ГМЛ-6', '#slv-sum': 5, '#slv-fill': 49.1, '#slv-status': 'Свободно', '#slv-filler': 1.11 } },
  { name: '1 × 16 мм² гибкая класс 5 — плотно', form: { 'slv-material': 'cu', 'slv-flex': '5' }, rows: [wire(16, 1)],
    expected: { '#slv-result-val': 'ГМЛ-16', '#slv-fill': 96.2, '#slv-status': 'Плотно' } },
  // 2 × 10 класс 6: ΣS = 20 → ГМЛ-25 (dвн 7.0, 38.48 мм²); 20/0.65 = 30.77 → 80.0 %
  { name: '2 × 10 мм² класс 6 — норма', form: { 'slv-material': 'cu', 'slv-flex': '6' }, rows: [wire(10, 2)],
    expected: { '#slv-result-val': 'ГМЛ-25', '#slv-fill': 80.0, '#slv-status': 'Норма' } },
  // Медь с алюминием — только биметаллическая гильза ГАМ
  { name: 'медь + алюминий — биметалл ГАМ', form: { 'slv-material': 'cu-al', 'slv-flex': '1' }, rows: [wire(16, 1)],
    expected: { '#slv-result-val': 'ГАМ-16' } },
];

test.describe('Соединительная гильза', () => {
  test.describe('достоверность расчёта', () => {
    for (const c of CASES) {
      test(c.name, async ({ page }) => {
        await openCalc(page, 'sleeve');
        await fillFields(page, c.form);
        await fillTable(page, { ...TABLE, rows: c.rows });
        await calculate(page, BUTTON);
        for (const [sel, exp] of Object.entries(c.expected)) {
          if (typeof exp === 'number') await expectResults(page, { [sel]: exp });
          else await expect(page.locator(sel)).toContainText(exp);
        }
        await expect(page.locator('#slv-section svg')).toHaveCount(1);
        await expectNoGarbage(page);
      });
    }
  });

  test('суммарное сечение выше ряда — отказ', async ({ page }) => {
    await openCalc(page, 'sleeve');
    await fillTable(page, { ...TABLE, rows: [wire(150, 2)] });
    await calculate(page, BUTTON);
    await expect(page.locator('.toast.show')).toHaveCount(1);
  });

  test('формула заполнения и ссылки на ГОСТ', async ({ page }) => {
    await openCalc(page, 'sleeve');
    await expectFormulaPanel(page, { formula: ['k_гибкости', 'd_вн²'], ref: ['ГОСТ 23469.3', 'ГОСТ 9581', 'ГОСТ 22483'] });
  });
});
