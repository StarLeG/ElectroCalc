/* Калькулятор «Значения конденсаторов» — /capval/.
 *
 * Эталон — маркировка по IEC 60062 / EIA-198: две значащие цифры и множитель
 * 10ⁿ пФ, где третья цифра 0…6 — показатель степени, 8 — ×0.01, 9 — ×0.1.
 *   104 → 100 000 пФ = 100 нФ = 0.1 мкФ;  222 → 2.2 нФ;  475 → 4.7 мкФ;  109 → 1.0 пФ.
 * Перевод единиц: 1 мкФ = 10³ нФ = 10⁶ пФ = 10⁻⁶ Ф.
 */
import { test, expect } from '@playwright/test';
import {
  openCalc, fillFields, calculate, expectRejected, knownDefect, describeCases, expectFormulaPanel
} from './helpers.mjs';

test.describe('Значения конденсаторов', () => {
  test.describe('код маркировки', () => {
    describeCases({
      pageId: 'capval', subTab: 'capcode', button: 'btn-cc-calc',
      cases: [
        { name: '104 → 100 нФ', input: { 'cc-code': '104' }, expected: { '#cc-pF': 100000, '#cc-nF': 100, '#cc-uF': 0.1 } },
        { name: '222 → 2.2 нФ', input: { 'cc-code': '222' }, expected: { '#cc-pF': 2200, '#cc-nF': 2.2 } },
        { name: '475 → 4.7 мкФ', input: { 'cc-code': '475' }, expected: { '#cc-pF': 4700000, '#cc-uF': 4.7 } },
        { name: '100 → 10 пФ', input: { 'cc-code': '100' }, expected: { '#cc-pF': 10 } },
        { name: 'двузначный код 47 → 47 пФ', input: { 'cc-code': '47' }, expected: { '#cc-pF': 47 } },
        { name: '109 → 1.0 пФ (множитель ×0.1 по EIA)', input: { 'cc-code': '109' }, expected: { '#cc-pF': 1 },
          defect: 'третья цифра 9 трактуется как 10⁹, а не ×0.1: «109» показывается как 10 000 000 000 пФ (10 мФ) вместо 1 пФ' },
        { name: '228 → 0.22 пФ (множитель ×0.01 по EIA)', input: { 'cc-code': '228' }, expected: { '#cc-pF': 0.22 },
          defect: 'третья цифра 8 трактуется как 10⁸, а не ×0.01' },
      ],
    });

    test('формула кода и ссылка на IEC', async ({ page }) => {
      await openCalc(page, 'capval', 'capcode');
      await expectFormulaPanel(page, { scope: '#sub-capcode', formula: ['10ᴰ'], ref: ['IEC'] });
    });

    for (const bad of ['', '1041', 'abc', '1.5']) {
      test(`недопустимый код «${bad}» — отказ`, async ({ page }) => {
        await openCalc(page, 'capval', 'capcode');
        await expectRejected(page, { button: 'btn-cc-calc', result: '#cc-pF' }, () => fillFields(page, { 'cc-code': bad }));
      });
    }
  });

  test.describe('перевод единиц', () => {
    describeCases({
      pageId: 'capval', subTab: 'capunit', button: 'btn-cu-calc',
      cases: [
        { name: '0.1 мкФ', input: { 'cu-val': 0.1, 'cu-unit': 'uF' }, expected: { '#cu-pF': 100000, '#cu-nF': 100, '#cu-F': 1e-7 } },
        { name: '470 нФ', input: { 'cu-val': 470, 'cu-unit': 'nF' }, expected: { '#cu-uF': 0.47, '#cu-pF': 470000 } },
        { name: '1 Ф', input: { 'cu-val': 1, 'cu-unit': 'F' }, expected: { '#cu-uF': 1000000 } },
        { name: '22 пФ', input: { 'cu-val': 22, 'cu-unit': 'pF' }, expected: { '#cu-pF': 22, '#cu-F': 2.2e-11 } },
      ],
    });

    test('пустое значение — отказ', async ({ page }) => {
      await openCalc(page, 'capval', 'capunit');
      await expectRejected(page, { button: 'btn-cu-calc', result: '#cu-pF' }, () => fillFields(page, { 'cu-val': '' }));
    });

    test('отрицательная ёмкость — отказ', async ({ page }) => {
      knownDefect('отрицательная ёмкость принимается: проверяется только isNaN');
      await openCalc(page, 'capval', 'capunit');
      await expectRejected(page, { button: 'btn-cu-calc', result: '#cu-pF' }, () => fillFields(page, { 'cu-val': -1 }));
    });

    test('показанная ёмкость в фарадах записана в экспоненциальной форме', async ({ page }) => {
      await openCalc(page, 'capval', 'capunit');
      await fillFields(page, { 'cu-val': 0.1, 'cu-unit': 'uF' });
      await calculate(page, 'btn-cu-calc');
      await expect(page.locator('#cu-F')).toHaveText('1.00e-7 Ф');
    });
  });
});
