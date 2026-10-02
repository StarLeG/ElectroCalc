/* Калькулятор «Термопара» — /tcouple/.
 *
 * Эталон — таблицы NIST ITS-90 (ГОСТ Р 8.585), холодный спай 0 °C:
 *   K: 100 °C → 4.096 мВ, 300 °C → 12.209, 500 °C → 20.644;
 *   J: 100 °C → 5.269,  500 °C → 27.393;
 *   T: 100 °C → 4.279,  300 °C → 14.862;
 *   E: 100 °C → 6.319,  500 °C → 37.005, 1000 °C → 76.373.
 * Обратные полиномы NIST дают погрешность до ±0.05 °C — она внутри допуска 0.1 %.
 */
import { test } from '@playwright/test';
import { openCalc, fillFields, expectRejected, describeCases, expectFormulaPanel } from './helpers.mjs';

const BUTTON = 'btn-tc-calc';

/**
 * Коэффициенты типов T и E в TC_COEFFS не совпадают с обратными полиномами
 * NIST для 0…400 °C и 0…1000 °C: у T стоят d1, d2 поддиапазона −200…0 °C,
 * у E — тот же поддиапазон с искажёнными порядками. K и J сверены и верны.
 */
const WRONG_COEFFS = {
  T: 'TC_COEFFS.T не совпадает с NIST ITS-90 (0…400 °C: d1 = 25.928, d2 = −0.7602961, d3 = 0.04637791, …)',
  E: 'TC_COEFFS.E не совпадает с NIST ITS-90 (0…1000 °C: d1 = 17.057035, d2 = −0.23301759, d3 = 0.0065435585, …)',
};
const c2mv = (type, t, mv, defect) => ({
  name: `тип ${type}: ${t} °C → ${mv} мВ`, input: { 'tc-type': type, 'tc-mode': 'c2mv', 'tc-val': t }, expected: { '#tc-result-unit': mv }, defect,
});
const mv2c = (type, mv, t, defect) => ({
  name: `тип ${type}: ${mv} мВ → ${t} °C`, input: { 'tc-type': type, 'tc-mode': 'mv2c', 'tc-val': mv }, expected: { '#tc-result-unit': t }, defect,
});

test.describe('Термопара', () => {
  describeCases({
    pageId: 'tcouple', button: BUTTON,
    cases: [
      c2mv('K', 100, 4.096), c2mv('K', 300, 12.209), c2mv('K', 500, 20.644),
      c2mv('J', 100, 5.269), c2mv('J', 500, 27.393),
      c2mv('T', 100, 4.279, WRONG_COEFFS.T), c2mv('T', 300, 14.862, WRONG_COEFFS.T),
      c2mv('E', 100, 6.319, WRONG_COEFFS.E), c2mv('E', 500, 37.005, WRONG_COEFFS.E),
      // 1000 °C у типа E совпадает лишь потому, что поиск корня упирается в mvMax = 76.373.
      c2mv('E', 1000, 76.373),
      mv2c('K', 4.096, 100), mv2c('K', 20.644, 500), mv2c('J', 27.393, 500),
      mv2c('T', 4.279, 100, WRONG_COEFFS.T), mv2c('E', 6.319, 100, WRONG_COEFFS.E),
    ],
  });

  test('ссылка на NIST ITS-90 и диапазоны применимости', async ({ page }) => {
    await openCalc(page, 'tcouple');
    await expectFormulaPanel(page, { formula: ['NIST ITS-90'], ref: ['K 0…500 °C', 'Холодный спай'] });
  });

  test.describe('корректность ввода', () => {
    test('тип K выше 500 °C — отказ с указанием диапазона', async ({ page }) => {
      await openCalc(page, 'tcouple');
      await expectRejected(page, { button: BUTTON, result: '#tc-result-unit' },
        () => fillFields(page, { 'tc-type': 'K', 'tc-mode': 'c2mv', 'tc-val': 600 }));
    });
    test('отрицательная термо-ЭДС вне таблицы — отказ', async ({ page }) => {
      await openCalc(page, 'tcouple');
      await expectRejected(page, { button: BUTTON, result: '#tc-result-unit' },
        () => fillFields(page, { 'tc-mode': 'mv2c', 'tc-val': -1 }));
    });
    test('термо-ЭДС выше предела типа T — отказ', async ({ page }) => {
      await openCalc(page, 'tcouple');
      await expectRejected(page, { button: BUTTON, result: '#tc-result-unit' },
        () => fillFields(page, { 'tc-type': 'T', 'tc-mode': 'mv2c', 'tc-val': 25 }));
    });
    test('пустое значение — отказ', async ({ page }) => {
      await openCalc(page, 'tcouple');
      await expectRejected(page, { button: BUTTON, result: '#tc-result-unit' }, () => fillFields(page, { 'tc-val': '' }));
    });
  });
});
