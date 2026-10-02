/* Калькулятор «Энергоаудит» — /energyaudit/.
 *
 * Эталон: суточное потребление Σ P·h·n / 1000 кВт·ч; за месяц ×30, за год ×365;
 * стоимость в месяц = месячное потребление · тариф.
 */
import { test } from '@playwright/test';
import { openCalc, fillFields, fillTable, calculate, expectResults, expectNoGarbage, knownDefect } from './helpers.mjs';

const BUTTON = 'btn-ea-calc';
const TABLE = { table: '#ea-table', add: 'btn-ea-add', remove: 'btn-ea-remove' };
const row = (p, h, q) => ({ '.ea-p': p, '.ea-h': h, '.ea-q': q });

const CASES = [
  {
    // 10 ламп по 10 Вт 8 ч = 0.8 кВт·ч; компьютер 300 Вт 8 ч = 2.4 → 3.2 кВт·ч/сут
    name: 'исходный набор: 10 LED-ламп и компьютер, тариф 5.5',
    rows: [row(10, 8, 10), row(300, 8, 1)], price: 5.5,
    expected: { '#ea-Ptotal': 0.4, '#ea-daily': 3.2, '#ea-monthly': 96, '#ea-yearly': 1168, '#ea-cost': 528 },
  },
  {
    // Чайник 2 кВт 1 ч + два холодильника по 100 Вт круглые сутки = 6.8 кВт·ч/сут
    name: 'чайник и два холодильника',
    rows: [row(2000, 1, 1), row(100, 24, 2)], price: 5.5,
    expected: { '#ea-Ptotal': 2.2, '#ea-daily': 6.8, '#ea-monthly': 204, '#ea-yearly': 2482, '#ea-cost': 1122 },
  },
  {
    // 4 лампы по 60 Вт 5 ч = 1.2 кВт·ч/сут, тариф 7 → 36·7 = 252
    name: 'одна группа, другой тариф',
    rows: [row(60, 5, 4)], price: 7,
    expected: { '#ea-daily': 1.2, '#ea-monthly': 36, '#ea-cost': 252 },
  },
  {
    // Количество 0 — оборудование не установлено и не потребляет
    name: 'количество 0 — потребления нет',
    rows: [row(60, 5, 4), row(1000, 10, 0)], price: 5.5,
    expected: { '#ea-daily': 1.2 },
    defect: 'количество 0 читается как «parseInt(...) || 1»: отсутствующее оборудование считается за одну штуку (+10 кВт·ч/сут)',
  },
];

test.describe('Энергоаудит', () => {
  test.describe('достоверность расчёта', () => {
    for (const c of CASES) {
      test(c.name, async ({ page }) => {
        if (c.defect) knownDefect(c.defect);
        await openCalc(page, 'energyaudit');
        await fillTable(page, { ...TABLE, rows: c.rows });
        await fillFields(page, { 'ea-price': c.price });
        await calculate(page, BUTTON);
        await expectResults(page, c.expected);
        await expectNoGarbage(page);
      });
    }
  });

  test.describe('корректность ввода', () => {
    test('отрицательная мощность не уменьшает потребление', async ({ page }) => {
      knownDefect('отрицательная мощность принимается и вычитается из итога');
      await openCalc(page, 'energyaudit');
      await fillTable(page, { ...TABLE, rows: [row(100, 10, 1), row(-50, 10, 1)] });
      await calculate(page, BUTTON);
      await expectResults(page, { '#ea-daily': 1 });
    });

    test('более 24 часов в сутки — отказ', async ({ page }) => {
      knownDefect('время работы 30 ч/сут принимается без проверки');
      await openCalc(page, 'energyaudit');
      await fillTable(page, { ...TABLE, rows: [row(100, 30, 1)] });
      await calculate(page, BUTTON);
      await expectResults(page, { '#ea-daily': 2.4 });
    });

    test('пустые ячейки не дают NaN', async ({ page }) => {
      await openCalc(page, 'energyaudit');
      await fillTable(page, { ...TABLE, rows: [row('', '', ''), row(100, 2, 1)] });
      await fillFields(page, { 'ea-price': '' });
      await calculate(page, BUTTON);
      await expectNoGarbage(page);
    });
  });
});
