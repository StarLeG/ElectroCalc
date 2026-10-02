/* Калькулятор «Шины» — /busbar/.
 *
 * Алгоритм страницы: допустимый ток по плотности (медь 2.5 А/мм², алюминий 1.6 А/мм²)
 * с температурной поправкой; погонное сопротивление R = ρ/S.
 * Сценарии ниже проверяют этот алгоритм. Отдельно сверяется результат с
 * ПУЭ табл. 1.3.31 (допустимый длительный ток окрашенных шин прямоугольного
 * сечения, одна полоса на фазу, +25 °C).
 */
import { test } from '@playwright/test';
import {
  openCalc, fillFields, calculate, readNumber, knownDefect, expectWithinPercent,
  describeCases, describeInputValidation, expectFormulaPanel
} from './helpers.mjs';

const BUTTON = 'btn-bb-calc';

test.describe('Шины', () => {
  describeCases({
    pageId: 'busbar', button: BUTTON,
    cases: [
      // S = 360 мм², 360·2.5 = 900 А; R = 0.0175/360·1000 = 0.0486 мОм/м; ΔU = 1000·0.0486/1000 = 0.0486 В/м
      { name: 'медь 60×6, 1000 А, +35 °C — перегрузка', input: { 'bb-I': 1000, 'bb-w': 60, 'bb-h': 6, 'bb-n': 1, 'bb-mat': 'Cu', 'bb-Tenv': 35 },
        expected: { '#bb-S': 360, '#bb-result-val': 900, '#bb-kt': 1, '#bb-Rm': 0.0486, '#bb-dU': 0.049, '#bb-status': 'Перегрузка' } },
      // S = 160 мм², 160·1.6·0.94 = 240.6 А; R = 0.175 мОм/м
      { name: 'алюминий 40×4, 500 А, +40 °C', input: { 'bb-I': 500, 'bb-w': 40, 'bb-h': 4, 'bb-n': 1, 'bb-mat': 'Al', 'bb-Tenv': 40 },
        expected: { '#bb-S': 160, '#bb-result-val': 241, '#bb-kt': 0.94, '#bb-Rm': 0.175 } },
      // S = 1000 мм², 1000·2.5·0.88 = 2200 А ≥ 2000 — допустимо
      { name: 'медь 100×10, 2000 А, +45 °C — допустимо', input: { 'bb-I': 2000, 'bb-w': 100, 'bb-h': 10, 'bb-n': 1, 'bb-mat': 'Cu', 'bb-Tenv': 45 },
        expected: { '#bb-result-val': 2200, '#bb-kt': 0.88, '#bb-status': 'Допустимо' } },
      // Две полосы 60×8: S = 960 мм², 960·2.5·0.75 = 1800 А
      { name: 'медь 2×(60×8), +55 °C', input: { 'bb-I': 1500, 'bb-w': 60, 'bb-h': 8, 'bb-n': 2, 'bb-mat': 'Cu', 'bb-Tenv': 55 },
        expected: { '#bb-S': 960, '#bb-result-val': 1800, '#bb-kt': 0.75 } },
    ],
  });

  test.describe('сверка с ПУЭ табл. 1.3.31 (±10 %)', () => {
    // Токи одной полосы на фазу при +25 °C, ПУЭ 7-е изд., табл. 1.3.31.
    // Расчёт по постоянной плотности тока даёт 2.5·S (медь) и 1.6·S (алюминий):
    // тонкие шины он занижает, и сильнее всего — алюминиевые.
    const DENSITY_DEFECT = 'допустимый ток считается по постоянной плотности, а не по ПУЭ табл. 1.3.31';
    const PUE_1_3_31 = [
      { mat: 'Cu', w: 60, h: 6, I: 1125, defect: `${DENSITY_DEFECT}: 900 А вместо 1125 (−20 %)` },
      { mat: 'Cu', w: 100, h: 10, I: 2310 },
      { mat: 'Al', w: 60, h: 6, I: 870, defect: `${DENSITY_DEFECT}: 576 А вместо 870 (−34 %)` },
      { mat: 'Al', w: 100, h: 10, I: 1820, defect: `${DENSITY_DEFECT}: 1600 А вместо 1820 (−12 %)` },
    ];
    for (const row of PUE_1_3_31) {
      test(`${row.mat} ${row.w}×${row.h}: ${row.I} А`, async ({ page }) => {
        if (row.defect) knownDefect(row.defect);
        await openCalc(page, 'busbar');
        await fillFields(page, { 'bb-w': row.w, 'bb-h': row.h, 'bb-n': 1, 'bb-mat': row.mat, 'bb-Tenv': 25 });
        await calculate(page, BUTTON);
        expectWithinPercent(await readNumber(page, '#bb-result-val'), row.I, 10, 'допустимый ток');
      });
    }
  });

  test('на странице указана расчётная плотность тока', async ({ page }) => {
    await openCalc(page, 'busbar');
    await expectFormulaPanel(page, { formula: ['2.5 А/мм²', '1.6 А/мм²'] });
  });

  describeInputValidation({
    pageId: 'busbar', button: BUTTON, result: '#bb-result-val',
    required: ['bb-I', 'bb-w', 'bb-h', 'bb-Tenv'],
    nonNegative: ['bb-I'],
    positive: ['bb-w', 'bb-h'],
    comma: { field: 'bb-h', text: '6,5', same: '6.5' },
    huge: ['bb-I'],
    knownDefects: {
      'zero:bb-w': 'ширина 0 проходит validate(): погонное сопротивление ρ/0 выводится как «Infinity мОм/м»',
      'zero:bb-h': 'толщина 0 проходит validate(): погонное сопротивление ρ/0 выводится как «Infinity мОм/м»',
    },
  });
});
