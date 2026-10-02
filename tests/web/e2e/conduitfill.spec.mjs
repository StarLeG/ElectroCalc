/* Калькулятор «Заполнение трубы» — /conduitfill/.
 *
 * Эталон: заполнение = Σ π·d²/4 · n / (π·D²/4) · 100 %;
 * минимальный диаметр трубы под лимит k: D ≥ 2·√(Sкаб / (π·k/100)),
 * рекомендуемый — ближайший из ряда 16, 20, 25, 32, 40, 50, 63, 80, 100 мм.
 */
import { test, expect } from '@playwright/test';
import { openCalc, fillFields, fillTable, calculate, expectResults, expectNoGarbage, knownDefect, readNumber, expectClose, expectFormulaPanel } from './helpers.mjs';

const BUTTON = 'btn-cf-calc';
const TABLE = { table: '#cf-table', add: 'btn-cf-add', remove: 'btn-cf-remove' };
const cable = (d, q) => ({ '.cf-d': d, '.cf-q': q });

const CASES = [
  // 3·π·100/4 = 235.6 мм² в трубе 804.2 мм² → 29.3 %; Dmin = 27.4 → 32 мм
  { name: 'труба 32 мм, три кабеля Ø10', pipe: { 'cf-D': 32, 'cf-limit': 40 }, cables: [cable(10, 3)],
    expected: { '#cf-conduitArea': 804, '#cf-cableArea': 236, '#cf-result-val': 29.3, '#cf-recommended': 32, '#cf-status': 'Помещается' } },
  // 4·π·36/4 = 113.1 в 314.2 → 36.0 %; Dmin = 19 → 20
  { name: 'труба 20 мм, четыре кабеля Ø6', pipe: { 'cf-D': 20, 'cf-limit': 40 }, cables: [cable(6, 4)],
    expected: { '#cf-result-val': 36.0, '#cf-recommended': 20 } },
  // 3·π·64/4 + 2·π·25/4 = 190.1 в 490.9 → 38.7 % > 35 %; Dmin = 27 → 32
  { name: 'лимит 35 % превышен в трубе 25 мм', pipe: { 'cf-D': 25, 'cf-limit': 35 }, cables: [cable(8, 3), cable(5, 2)],
    expected: { '#cf-result-val': 38.7, '#cf-recommended': 32, '#cf-status': 'Превышено' } },
  // 4·π·400/4 = 1256.6 в 1963.5 → 64 %; Dmin = 64 → 80
  { name: 'четыре кабеля Ø20 в трубе 50 мм', pipe: { 'cf-D': 50, 'cf-limit': 40 }, cables: [cable(20, 4)],
    expected: { '#cf-result-val': 64.0, '#cf-recommended': 80 } },
];

test.describe('Заполнение трубы', () => {
  test.describe('достоверность расчёта', () => {
    for (const c of CASES) {
      test(c.name, async ({ page }) => {
        await openCalc(page, 'conduitfill');
        await fillFields(page, c.pipe);
        await fillTable(page, { ...TABLE, rows: c.cables });
        await calculate(page, BUTTON);
        for (const [sel, exp] of Object.entries(c.expected)) {
          if (typeof exp === 'number') expectClose(await readNumber(page, sel), exp, sel);
          else await expect(page.locator(sel)).toContainText(exp);
        }
        await expectNoGarbage(page);
      });
    }
  });

  test('формула заполнения и лимит 40 %', async ({ page }) => {
    await openCalc(page, 'conduitfill');
    await expectFormulaPanel(page, { formula: ['Sкаб / Sтрубы', '40%'] });
  });

  test.describe('корректность ввода', () => {
    test('кабели не помещаются даже в трубу 100 мм — это сказано явно', async ({ page }) => {
      knownDefect('при требуемом диаметре больше 100 мм рекомендуется «100 мм» без оговорки, что и она мала');
      await openCalc(page, 'conduitfill');
      await fillFields(page, { 'cf-D': 50, 'cf-limit': 40 });
      await fillTable(page, { ...TABLE, rows: [cable(40, 6)] });
      await calculate(page, BUTTON);
      await expect(page.locator('#cf-recommended')).not.toHaveText('100 мм');
    });

    test('нулевой диаметр трубы — отказ', async ({ page }) => {
      knownDefect('диаметр 0 проходит validate(): заполнение 0 % и статус «Помещается»');
      await openCalc(page, 'conduitfill');
      await fillFields(page, { 'cf-D': 0 });
      await calculate(page, BUTTON);
      await expect(page.locator('#cf-status')).not.toContainText('Помещается');
    });

    test('количество 0 — кабель не учитывается', async ({ page }) => {
      knownDefect('количество 0 читается как «parseInt(...) || 1» и кабель всё равно учитывается');
      await openCalc(page, 'conduitfill');
      await fillFields(page, { 'cf-D': 32, 'cf-limit': 40 });
      await fillTable(page, { ...TABLE, rows: [cable(10, 3), cable(20, 0)] });
      await calculate(page, BUTTON);
      await expectResults(page, { '#cf-cableArea': 236 });
    });

    test('пустые ячейки не дают NaN', async ({ page }) => {
      await openCalc(page, 'conduitfill');
      await fillTable(page, { ...TABLE, rows: [cable('', '')] });
      await fillFields(page, { 'cf-limit': '' });
      await calculate(page, BUTTON);
      await expectNoGarbage(page);
    });
  });
});
