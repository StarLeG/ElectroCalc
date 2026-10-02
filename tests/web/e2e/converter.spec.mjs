/* Конвертер единиц — /converter/.
 *
 * Эталоны — определения единиц (СИ, ГОСТ 8.417) и справочные таблицы:
 *   AWG: d(n) = 0.127 · 92^((36−n)/39) мм (ASTM B258): AWG 13 — 2.624 мм², AWG 10 — 5.261, AWG 20 — 0.518;
 *   1 бар = 14.5038 psi = 0.98692 атм; °F = °C · 9/5 + 32; 1 дюйм = 25.4 мм;
 *   1 кВт = 1.341 л.с. (механическая); дБм = 10·lg(P / 1 мВт).
 * Результат конвертера — строка в поле #conv-result, сверяется подстрокой.
 */
import { test, expect } from '@playwright/test';
import {
  openCalc, fillFields, typeInto, calculate, expectRejected, knownDefect, expectNoGarbage
} from './helpers.mjs';

const BUTTON = 'btn-conv-calc';

const CASES = [
  { type: 'mm2_awg', value: 2.5, contains: ['AWG 13', '2.624'] },
  { type: 'mm2_awg', value: 5.26, contains: ['AWG 10', '5.261'] },
  { type: 'mm2_awg', value: 0.5, contains: ['AWG 20', '0.518'] },
  { type: 'a_ma', value: 0.02, contains: ['0.02 А = 20 мА'] },
  { type: 'v_kv', value: 10, contains: ['10 кВ = 10000 В'] },
  { type: 'ohm_Mohm', value: 1, contains: ['1 МОм = 1000000 Ом'] },
  { type: 'kva_kvar', value: 100, contains: ['85 кВт', '52.7 квар'] },
  { type: 'kw_hp', value: 1, contains: ['1 кВт = 1.34 л.с.'] },
  { type: 'w_dbm', value: 1, contains: ['1 Вт = 30 дБм'] },
  { type: 'db_times', value: 20, contains: ['20 дБ = ×10'] },
  { type: 'ma_pct', value: 12, contains: ['12 мА = 50 %'] },
  { type: 'bar_psi', value: 1, contains: ['1 бар = 14.5 psi'] },
  { type: 'bar_atm', value: 1, contains: ['1 бар = 0.9869 атм'] },
  { type: 'bar_mpa', value: 10, contains: ['10 бар = 1 МПа'] },
  { type: 'lmin_m3h', value: 100, contains: ['100 л/мин = 6 м³/ч'] },
  { type: 'c_f', value: 100, contains: ['100°C = 212°F'] },
  { type: 'c_f', value: -40, contains: ['-40°C = -40°F'] },
  { type: 'c_k', value: 0, contains: ['0°C = 273.15 K'] },
  { type: 'inch_mm', value: 1, contains: ['1 дюйм = 25.4 мм'] },
  { type: 'nm_kgsm', value: 9.8067, contains: ['= 1 кгс·м'] },
  { type: 'ft_m', value: 1, contains: ['1 фут = 0.3048 м'] },
  { type: 'f_nf', value: 0.000001, contains: ['= 1000 нФ'] },
];

test.describe('Конвертер единиц', () => {
  test.describe('достоверность пересчёта', () => {
    for (const c of CASES) {
      test(`${c.type}: ${c.value}`, async ({ page }) => {
        await openCalc(page, 'converter');
        await fillFields(page, { 'conv-type': c.type, 'conv-val': c.value });
        await calculate(page, BUTTON);
        const result = await page.locator('#conv-result').inputValue();
        for (const fragment of c.contains) expect(result).toContain(fragment);
        expect(result).not.toMatch(/NaN|Infinity/);
        await expect(page.locator('#conv-formula-text')).not.toBeEmpty();
      });
    }
  });

  test('показанная формула AWG совпадает с алгоритмом (ряд по диаметру)', async ({ page }) => {
    await openCalc(page, 'converter');
    await fillFields(page, { 'conv-type': 'mm2_awg', 'conv-val': 2.5 });
    await calculate(page, BUTTON);
    await expect(page.locator('#conv-formula-text')).toContainText('92^((36−n)/19.5)');
  });

  test.describe('корректность ввода', () => {
    test('пустое значение — расчёт не выполняется', async ({ page }) => {
      await openCalc(page, 'converter');
      await expectRejected(page, { button: BUTTON, result: '#conv-result' }, () => fillFields(page, { 'conv-val': '' }));
    });

    test('нулевое сечение для AWG — отказ, а не «AWG NaN»', async ({ page }) => {
      knownDefect('при S = 0 мм² конвертер выводит «AWG NaN (NaN мм²)»: awgFromArea() вернула NaN, а проверки нет');
      await openCalc(page, 'converter');
      await fillFields(page, { 'conv-type': 'mm2_awg', 'conv-val': 0 });
      await calculate(page, BUTTON);
      expect(await page.locator('#conv-result').inputValue()).not.toMatch(/NaN/);
    });

    test('отрицательная температура пересчитывается (знак допустим)', async ({ page }) => {
      await openCalc(page, 'converter');
      await fillFields(page, { 'conv-type': 'c_k', 'conv-val': -273.15 });
      await calculate(page, BUTTON);
      expect(await page.locator('#conv-result').inputValue()).toContain('= 0 K');
      await expectNoGarbage(page);
    });

    test('десятичная запятая равнозначна точке', async ({ page }) => {
      await openCalc(page, 'converter');
      await fillFields(page, { 'conv-type': 'inch_mm' });
      await typeInto(page, 'conv-val', '2,5');
      await calculate(page, BUTTON);
      expect(await page.locator('#conv-result').inputValue()).toContain('2.5 дюйм = 63.5 мм');
    });
  });
});
