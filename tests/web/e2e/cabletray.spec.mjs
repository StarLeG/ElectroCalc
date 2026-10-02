/* Калькулятор «Кабельный лоток» — /cabletray/.
 *
 * Сумма сечений кабелей Σ π·d²/4 · n сравнивается с сечением лотка W·H.
 * Страница показывает заполнение ОТНОСИТЕЛЬНО полезной площади (W·H·k/100):
 * 100 % на экране означает, что лоток занят ровно на k %. Сценарии проверяют
 * именно это; отдельный тест фиксирует расхождение с формулой на странице,
 * где заполнение записано как Sкаб / Sлотка.
 */
import { test, expect } from '@playwright/test';
import { openCalc, fillFields, fillTable, calculate, expectResults, expectNoGarbage, knownDefect, readNumber, expectClose } from './helpers.mjs';

const BUTTON = 'btn-ct-calc';
const TABLE = { table: '#ct-table', add: 'btn-ct-add', remove: 'btn-ct-remove' };
const cable = (d, q) => ({ '.ct-d': d, '.ct-q': q });

const CASES = [
  {
    // 300×60 = 18000 мм², полезная 7200; 5·π·10²/4 = 392.7 мм² → 5.45 % полезной
    name: 'лоток 300×60, пять кабелей Ø10',
    tray: { 'ct-trayW': 300, 'ct-trayH': 60, 'ct-fill': 40 }, cables: [cable(10, 5)],
    expected: { '#ct-trayArea': 18000, '#ct-usableArea': 7200, '#ct-cableArea': 393, '#ct-result-val': 5.5, '#ct-status': 'Помещается' },
  },
  {
    // 200×50 = 10000, полезная 4000; 4·π·400/4 + 6·π·144/4 = 1935.2 → 48.4 %
    name: 'лоток 200×50, два типа кабелей',
    tray: { 'ct-trayW': 200, 'ct-trayH': 50, 'ct-fill': 40 }, cables: [cable(20, 4), cable(12, 6)],
    expected: { '#ct-cableArea': 1935, '#ct-result-val': 48.4 },
  },
  {
    // 100×50 = 5000, полезная 1500 (30 %); 6·π·625/4 = 2945 → 196 % — не помещается
    name: 'лоток 100×50 с лимитом 30 % переполнен',
    tray: { 'ct-trayW': 100, 'ct-trayH': 50, 'ct-fill': 30 }, cables: [cable(25, 6)],
    expected: { '#ct-usableArea': 1500, '#ct-result-val': 196.4, '#ct-status': 'Не помещается' },
  },
];

test.describe('Кабельный лоток', () => {
  test.describe('достоверность расчёта', () => {
    for (const c of CASES) {
      test(c.name, async ({ page }) => {
        await openCalc(page, 'cabletray');
        await fillFields(page, c.tray);
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

  test('заполнение на экране совпадает с формулой Sкаб / Sлотка', async ({ page }) => {
    knownDefect('формула на странице — Sкаб / Sлотка × 100 % ≤ 40 %, а показывается Sкаб / (Sлотка · 0.4): 5.45 % вместо 2.18 %');
    await openCalc(page, 'cabletray');
    await fillFields(page, { 'ct-trayW': 300, 'ct-trayH': 60, 'ct-fill': 40 });
    await fillTable(page, { ...TABLE, rows: [cable(10, 5)] });
    await calculate(page, BUTTON);
    await expectResults(page, { '#ct-result-val': 2.18 });
  });

  test.describe('корректность ввода', () => {
    test('нулевая ширина лотка — отказ', async ({ page }) => {
      knownDefect('ширина 0 проходит validate(): заполнение выводится как 0 % и статус «Помещается»');
      await openCalc(page, 'cabletray');
      await fillFields(page, { 'ct-trayW': 0 });
      await calculate(page, BUTTON);
      await expect(page.locator('#ct-status')).not.toContainText('Помещается');
    });

    test('количество 0 — кабель не учитывается', async ({ page }) => {
      knownDefect('количество 0 читается как «parseInt(...) || 1» и кабель всё равно учитывается');
      await openCalc(page, 'cabletray');
      await fillFields(page, { 'ct-trayW': 300, 'ct-trayH': 60, 'ct-fill': 40 });
      await fillTable(page, { ...TABLE, rows: [cable(10, 5), cable(50, 0)] });
      await calculate(page, BUTTON);
      await expectResults(page, { '#ct-cableArea': 393 });
    });

    test('пустой диаметр не даёт NaN', async ({ page }) => {
      await openCalc(page, 'cabletray');
      await fillTable(page, { ...TABLE, rows: [cable('', 3)] });
      await calculate(page, BUTTON);
      await expectNoGarbage(page);
    });
  });
});
