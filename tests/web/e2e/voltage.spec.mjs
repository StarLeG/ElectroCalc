/* Калькулятор «Потери напряжения в линии» — /voltage/.
 *
 * Эталон — трёхфазная линия с сосредоточенной нагрузкой:
 *   ΔU = √3 · I · L · (R·cos φ + X·sin φ) / 1000,  R и X в Ом/км, L в м;
 *   ΔU% = ΔU / U · 100.
 * Погонные R и X для медных жил — из таблицы кабеля (7.24 Ом/км для 2.5 мм² и т.д.).
 */
import { test } from '@playwright/test';
import {
  openCalc, fillFields, expectRejected,
  describeCases, describeInputValidation, describePlaceholder, expectFormulaPanel
} from './helpers.mjs';

const BUTTON = 'btn-voltage-calc';

test.describe('Потери напряжения', () => {
  describeCases({
    pageId: 'voltage', button: BUTTON,
    cases: [
      {
        // sin φ = 0.5268; 1.7321·10·100·(7.24·0.85 + 0.08·0.5268)/1000 = 10.732 В → 2.824 %
        name: '2.5 мм² Cu, 10 А, 100 м, 380 В, cos 0.85',
        input: { 'v-I': 10, 'v-L': 100, 'v-R': 7.24, 'v-X': 0.08, 'v-U': 380, 'v-cos': 0.85 },
        expected: { '#voltage-result-val': 2.824, '#voltage-pct': 2.824, '#voltage-V': 10.73 },
      },
      {
        // sin φ = 0.4359; 1.7321·50·200·(1.81·0.9 + 0.07·0.4359)/1000 = 28.744 В → 7.186 %
        name: '10 мм² Cu, 50 А, 200 м, 400 В, cos 0.9',
        input: { 'v-I': 50, 'v-L': 200, 'v-R': 1.81, 'v-X': 0.07, 'v-U': 400, 'v-cos': 0.9 },
        expected: { '#voltage-result-val': 7.186, '#voltage-V': 28.74 },
      },
      {
        // cos φ = 1: реактанс не участвует. 1.7321·100·50·0.36/1000 = 3.118 В → 0.820 %
        name: '50 мм² Cu, активная нагрузка 100 А, 50 м',
        input: { 'v-I': 100, 'v-L': 50, 'v-R': 0.36, 'v-X': 0.06, 'v-U': 380, 'v-cos': 1 },
        expected: { '#voltage-result-val': 0.820, '#voltage-V': 3.12 },
      },
      {
        // 1.7321·5·500·(12.07·0.8 + 0.08·0.6)/1000 = 42.020 В → 11.058 %
        name: 'длинная линия 1.5 мм², 5 А, 500 м — заведомо больше 5 %',
        input: { 'v-I': 5, 'v-L': 500, 'v-R': 12.07, 'v-X': 0.08, 'v-U': 380, 'v-cos': 0.8 },
        expected: { '#voltage-result-val': 11.058, '#voltage-V': 42.0 },
      },
      {
        // Нулевая длина — потерь нет.
        name: 'нулевая длина линии — потерь нет',
        input: { 'v-L': 0 },
        expected: { '#voltage-result-val': 0, '#voltage-V': 0 },
      },
    ],
  });

  test('формула учитывает и активное, и индуктивное сопротивление', async ({ page }) => {
    await openCalc(page, 'voltage');
    await expectFormulaPanel(page, { formula: ['√3', 'R·cosφ', 'X·sinφ'], ref: ['ПУЭ'] });
  });

  describePlaceholder({ pageId: 'voltage', button: BUTTON, result: '#voltage-result-val' });

  describeInputValidation({
    pageId: 'voltage', button: BUTTON, result: '#voltage-result-val',
    required: ['v-I', 'v-L', 'v-R', 'v-X', 'v-U', 'v-cos'],
    nonNegative: ['v-I', 'v-L', 'v-R', 'v-X'],
    positive: ['v-U', 'v-cos'],
    comma: { field: 'v-R', text: '7,24', same: '7.24' },
    huge: ['v-I'],
  });

  test('cos φ больше единицы отвергается', async ({ page }) => {
    await openCalc(page, 'voltage');
    await expectRejected(page, { button: BUTTON, result: '#voltage-result-val', field: 'v-cos' },
      () => fillFields(page, { 'v-cos': 1.5 }));
  });
});
