/* Разбор показанного числа — parseDisplayed() из tests/web/e2e/helpers.mjs.
 *
 * Браузерные тесты сверяют с эталоном то, что напечатано на странице, а допуск
 * выводят из числа знаков после запятой. Ошибка здесь незаметно ослабила бы
 * или ужесточила сотни проверок, поэтому разбор проверяется отдельно.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parseDisplayed } from '../e2e/helpers.mjs';

describe('parseDisplayed', () => {
  const cases = [
    ['4.27', 4.27, 2],
    ['4.27 А', 4.27, 2],
    ['Kp = 1.200', 1.2, 3],
    ['±0.500', 0.5, 3],
    ['−43.9°', -43.9, 1],
    ['-5', -5, 0],
    ['2,5 мм²', 2.5, 1],
    ['1.00e-7 Ф', 1e-7, 9],
    ['°C → 138.506 Ом', 138.506, 3],
    ['16038 А', 16038, 0],
  ];
  for (const [text, value, decimals] of cases) {
    test(`«${text}» → ${value}, знаков ${decimals}`, () => {
      const got = parseDisplayed(text);
      assert.ok(Math.abs(got.value - value) < 1e-15, `значение ${got.value}`);
      assert.equal(got.decimals, decimals);
    });
  }
  test('текст без числа — NaN', () => assert.ok(Number.isNaN(parseDisplayed('—').value)));
});
