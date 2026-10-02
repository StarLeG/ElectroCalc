/* Калькулятор «Коэффициент спроса» — /demandfactor/.
 *
 * Эталон (метод коэффициента спроса, СП 256.1325800 / РМ-2696):
 *   Pрасч = Σ Kсi · Pномi;  Kс общий = Pрасч / ΣPном.
 */
import { test } from '@playwright/test';
import { openCalc, fillTable, calculate, expectResults, expectNoGarbage, knownDefect, expectFormulaPanel } from './helpers.mjs';

const BUTTON = 'btn-df-calc';
const TABLE = { table: '#df-table', add: 'btn-df-add', remove: 'btn-df-remove' };

const CASES = [
  {
    // 5·0.8 + 3·0.6 = 5.8 кВт; Kс = 5.8/8 = 0.725
    name: 'исходные группы: освещение 5 кВт·0.8, розетки 3 кВт·0.6',
    rows: [{ '.df-p': 5, '.df-ks': 0.8 }, { '.df-p': 3, '.df-ks': 0.6 }],
    expected: { '#df-Ptotal': 8, '#df-result-val': 5.8, '#df-koverall': 0.725 },
  },
  {
    // 10·0.7 + 20·0.5 + 5·1 = 22 кВт из 35; Kс = 0.629
    name: 'три группы с разными Kс',
    rows: [{ '.df-p': 10, '.df-ks': 0.7 }, { '.df-p': 20, '.df-ks': 0.5 }, { '.df-p': 5, '.df-ks': 1 }],
    expected: { '#df-Ptotal': 35, '#df-result-val': 22, '#df-koverall': 0.629 },
  },
  {
    // Одна группа: Kс общий равен Kс группы
    name: 'одна группа 12 кВт с Kс 0.65',
    rows: [{ '.df-p': 12, '.df-ks': 0.65 }],
    expected: { '#df-Ptotal': 12, '#df-result-val': 7.8, '#df-koverall': 0.65 },
  },
  {
    // Kс = 0 — группа в резерве и в расчётную нагрузку не входит: 4·0.5 = 2 кВт
    name: 'резервная группа с Kс = 0 не добавляет нагрузки',
    rows: [{ '.df-p': 4, '.df-ks': 0.5 }, { '.df-p': 6, '.df-ks': 0 }],
    expected: { '#df-Ptotal': 10, '#df-result-val': 2, '#df-koverall': 0.2 },
    defect: 'Kс = 0 читается как «parseFloat(...) || 1»: резервная группа попадает в расчёт с Kс = 1 (8 кВт вместо 2)',
  },
];

test.describe('Коэффициент спроса', () => {
  test.describe('достоверность расчёта', () => {
    for (const c of CASES) {
      test(c.name, async ({ page }) => {
        if (c.defect) knownDefect(c.defect);
        await openCalc(page, 'demandfactor');
        await fillTable(page, { ...TABLE, rows: c.rows });
        await calculate(page, BUTTON);
        await expectResults(page, c.expected);
        await expectNoGarbage(page);
      });
    }
  });

  test('формула расчётной мощности', async ({ page }) => {
    await openCalc(page, 'demandfactor');
    await expectFormulaPanel(page, { formula: ['Kсi', 'Pномi'] });
  });

  test.describe('корректность ввода', () => {
    test('Kс больше единицы — отказ', async ({ page }) => {
      knownDefect('Kс = 1.5 принимается без проверки: расчётная мощность получается больше установленной');
      await openCalc(page, 'demandfactor');
      await fillTable(page, { ...TABLE, rows: [{ '.df-p': 10, '.df-ks': 1.5 }] });
      await calculate(page, BUTTON);
      await expectResults(page, { '#df-result-val': 10 });
    });

    test('отрицательная мощность группы не уменьшает итог', async ({ page }) => {
      knownDefect('отрицательная мощность группы принимается и вычитается из итога');
      await openCalc(page, 'demandfactor');
      await fillTable(page, { ...TABLE, rows: [{ '.df-p': 10, '.df-ks': 1 }, { '.df-p': -5, '.df-ks': 1 }] });
      await calculate(page, BUTTON);
      await expectResults(page, { '#df-Ptotal': 10 });
    });

    test('пустые ячейки не дают NaN', async ({ page }) => {
      await openCalc(page, 'demandfactor');
      await fillTable(page, { ...TABLE, rows: [{ '.df-p': '', '.df-ks': '' }, { '.df-p': 3, '.df-ks': 0.6 }] });
      await calculate(page, BUTTON);
      await expectNoGarbage(page);
    });
  });
});
