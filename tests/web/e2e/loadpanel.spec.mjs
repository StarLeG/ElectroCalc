/* Калькулятор «Щит нагрузок» — /loadpanel/.
 *
 * Эталон: группа включена между фазой и нулём, ток считается по фазному
 * напряжению Uф = Uл/√3; для фазы с несколькими группами — средневзвешенный
 * cos φ = ΣP / Σ(P/cos φ). Pрасч = Σ Kсi · Pномi (метод коэффициента спроса),
 * небаланс = (Imax − Imin) / Imax.
 */
import { test } from '@playwright/test';
import { openCalc, fillFields, fillTable, calculate, expectResults, expectNoGarbage, knownDefect, expectFormulaPanel } from './helpers.mjs';

const BUTTON = 'btn-lp-calc';
const TABLE = { table: '#load-table', add: 'btn-lp-add', remove: 'btn-lp-remove' };
const group = (P, cos, ks, phase) => ({ '.tbl-p': P, '.tbl-cos': cos, '.tbl-ks': ks, '.tbl-phase': phase });

const DEFAULT_ROWS = [group(2, 0.85, 0.8, 1), group(1.5, 1, 0.9, 2), group(3, 0.8, 1, 3)];

/** Те же группы с Kс = 0.5: ΣPном = 6.5 кВт, ΣKс·P = 3.25 кВт — разница не тонет в округлении. */
const HALF_DEMAND_ROWS = [group(2, 0.85, 0.5, 1), group(1.5, 1, 0.5, 2), group(3, 0.8, 0.5, 3)];

const CASES = [
  {
    // L1: 1.6 кВт / (0.2194·0.85) = 8.58 А; L2: 1.35/0.2194 = 6.15 А; L3: 3.0/(0.2194·0.8) = 17.09 А
    name: 'исходные группы: розетки, освещение, кондиционер',
    rows: DEFAULT_ROWS,
    expected: { '#lp-IL1': 8.58, '#lp-IL2': 6.15, '#lp-IL3': 17.09, '#lp-imb': 64.0 },
  },
  {
    // Три одинаковые группы по 3 кВт — симметрия, 3/0.2194 = 13.67 А в каждой фазе
    name: 'симметричная нагрузка 3 × 3 кВт',
    rows: [group(3, 1, 1, 1), group(3, 1, 1, 2), group(3, 1, 1, 3)],
    expected: { '#lp-IL1': 13.67, '#lp-IL2': 13.67, '#lp-IL3': 13.67, '#lp-imb': 0 },
  },
  {
    // Две группы на L1: 2 кВт cos 0.8 и 2 кВт cos 1 → cos = 4/(2.5 + 2) = 0.889; I = 4/(0.2194·0.889) = 20.51 А
    name: 'две группы на одной фазе — средневзвешенный cos φ',
    rows: [group(2, 0.8, 1, 1), group(2, 1, 1, 1), group(1, 1, 1, 2), group(1, 1, 1, 3)],
    expected: { '#lp-IL1': 20.51, '#lp-IL2': 4.56, '#lp-imb': 77.8 },
  },
];

test.describe('Щит нагрузок', () => {
  test.describe('достоверность расчёта', () => {
    for (const c of CASES) {
      test(c.name, async ({ page }) => {
        await openCalc(page, 'loadpanel');
        await fillFields(page, { 'lp-U': 380 });
        await fillTable(page, { ...TABLE, rows: c.rows });
        await calculate(page, BUTTON);
        await expectResults(page, c.expected);
        await expectNoGarbage(page);
      });
    }
  });

  test('ΣPном — сумма номинальных мощностей без коэффициентов спроса', async ({ page }) => {
    knownDefect('под подписью «ΣP_НОМ» выводится уже ΣKс·P (3.3 кВт), а не сумма номиналов 6.5 кВт');
    await openCalc(page, 'loadpanel');
    await fillTable(page, { ...TABLE, rows: HALF_DEMAND_ROWS });
    await calculate(page, BUTTON);
    await expectResults(page, { '#lp-Ptotal': 6.5 });
  });

  test('Pрасч = Σ Kсi · Pi без дополнительного множителя', async ({ page }) => {
    knownDefect('Pрасч = ΣKс·P · 0.9: коэффициент 0.9 зашит в код и применяется поверх Kс групп (2.9 кВт вместо 3.25)');
    await openCalc(page, 'loadpanel');
    await fillTable(page, { ...TABLE, rows: HALF_DEMAND_ROWS });
    await calculate(page, BUTTON);
    await expectResults(page, { '#lp-Pcalc': 3.25 });
  });

  test('формула расчётной мощности', async ({ page }) => {
    await openCalc(page, 'loadpanel');
    await expectFormulaPanel(page, { formula: ['Kс × ΣP_ном'], ref: ['ПУЭ'] });
  });

  test('пустые ячейки не дают NaN', async ({ page }) => {
    knownDefect('группа с P = 0 даёт в средневзвешенном cos φ 0/0: ток фазы выводится как «NaN А»');
    await openCalc(page, 'loadpanel');
    await fillTable(page, { ...TABLE, rows: [group('', '', '', 1), group(1, 1, 1, 2), group(1, 1, 1, 3)] });
    await calculate(page, BUTTON);
    await expectNoGarbage(page);
  });

  test('пустая фаза не даёт деления на ноль', async ({ page }) => {
    await openCalc(page, 'loadpanel');
    await fillTable(page, { ...TABLE, rows: [group(2, 0.9, 1, 1)] });
    await calculate(page, BUTTON);
    await expectResults(page, { '#lp-IL2': 0, '#lp-IL3': 0, '#lp-imb': 100 });
    await expectNoGarbage(page);
  });
});
