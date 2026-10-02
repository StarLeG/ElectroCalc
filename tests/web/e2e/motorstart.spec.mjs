/* Калькулятор «Пуск двигателя» — /motorstart/.
 *
 * Эталон:
 *   Iном = P / (√3·U·cos φ·η);  Iпуск = Iном · m, где m = k (прямой пуск),
 *   k/3 (звезда-треугольник), 0.45·k (плавный пуск);
 *   двигатель в момент пуска — сопротивление Zдв = U / (√3·Iпуск);
 *   провал напряжения ΔU% = Zсети / (Zсети + Zдв) · 100.
 * Требование к аппарату защиты (ГОСТ Р 50571.4.43, ПУЭ 3.1.10): IB ≤ In ≤ Iz —
 * номинал не меньше рабочего тока и не больше допустимого тока кабеля.
 */
import { test, expect } from '@playwright/test';
import {
  openCalc, fillFields, calculate, readNumber, knownDefect,
  describeCases, describeInputValidation, expectFormulaPanel
} from './helpers.mjs';

const BUTTON = 'btn-ms-calc';
const BASE = { 'ms-P': 15, 'ms-U': 380, 'ms-k': 7, 'ms-cos': 0.85, 'ms-eta': 0.9, 'ms-Zgrid': 0.1 };

/** Допустимый ток медного провода из таблицы кабеля сайта (ПУЭ табл. 1.3.4), А. */
const CABLE_IZ = { 10: 70, 16: 95, 25: 130, 35: 160, 95: 310 };

test.describe('Пуск двигателя', () => {
  describeCases({
    pageId: 'motorstart', button: BUTTON,
    cases: [
      // Iном = 29.79 А; Iпуск = 208.5 А; Zдв = 1.052 Ом; ΔU = 0.1/1.152 = 8.68 %
      { name: '15 кВт, прямой пуск, Zсети 0.1 Ом', input: { ...BASE, 'ms-method': 'DOL' },
        expected: { '#ms-Inom': 29.8, '#ms-Istart': 209, '#ms-result-val': 8.7, '#ms-status': 'Допустимо' } },
      // Звезда-треугольник: Iпуск = 69.5 А, ΔU = 3.07 %
      { name: '15 кВт, звезда-треугольник', input: { ...BASE, 'ms-method': 'star' },
        expected: { '#ms-Istart': 70, '#ms-result-val': 3.1 } },
      // Плавный пуск: Iпуск = 0.45·7·29.79 = 93.8 А, ΔU = 4.10 %
      { name: '15 кВт, плавный пуск', input: { ...BASE, 'ms-method': 'soft' },
        expected: { '#ms-Istart': 94, '#ms-result-val': 4.1 } },
      // 55 кВт, 400 В: Iном = 97.0 А, Iпуск = 679 А, ΔU = 12.82 % — ещё в пределах 15 %
      { name: '55 кВт, 400 В, Zсети 0.05 Ом', input: { 'ms-P': 55, 'ms-U': 400, 'ms-k': 7, 'ms-cos': 0.88, 'ms-eta': 0.93, 'ms-Zgrid': 0.05, 'ms-method': 'DOL' },
        expected: { '#ms-Inom': 97.0, '#ms-Istart': 679, '#ms-result-val': 12.8 } },
      // 4 кВт на слабой сети 0.3 Ом: Iпуск = 52.3 А, ΔU = 6.68 %
      { name: '4 кВт на слабой сети', input: { 'ms-P': 4, 'ms-U': 380, 'ms-k': 6, 'ms-cos': 0.82, 'ms-eta': 0.85, 'ms-Zgrid': 0.3, 'ms-method': 'DOL' },
        expected: { '#ms-Inom': 8.7, '#ms-Istart': 52, '#ms-result-val': 6.7 } },
    ],
  });

  test.describe('аппарат защиты', () => {
    test('номинал автомата подобран (не «0 А») и не меньше номинального тока', async ({ page }) => {
      knownDefect('автомат подбирается по 1.2·Iпуск: для 15 кВт прямого пуска это 250.2 А — выше ряда, и на экране «0 А»');
      await openCalc(page, 'motorstart');
      await fillFields(page, { ...BASE, 'ms-method': 'DOL' });
      await calculate(page, BUTTON);
      const breaker = await readNumber(page, '#ms-breaker');
      expect(breaker.value).toBeGreaterThanOrEqual(29.8);
    });

    test('номинал автомата не превышает допустимый ток рекомендованного кабеля', async ({ page }) => {
      knownDefect('при звезде-треугольнике предлагается автомат 100 А на кабель 10 мм² (Iдоп 70 А): кабель не защищён от перегрузки');
      await openCalc(page, 'motorstart');
      await fillFields(page, { ...BASE, 'ms-method': 'star' });
      await calculate(page, BUTTON);
      const breaker = (await readNumber(page, '#ms-breaker')).value;
      const cable = (await readNumber(page, '#ms-cable')).value;
      expect(breaker).toBeLessThanOrEqual(CABLE_IZ[cable] ?? Infinity);
    });
  });

  test('провал больше 15 % отмечен как недопустимый', async ({ page }) => {
    // 55 кВт на сети 0.1 Ом: ΔU = 0.1/(0.1 + 0.340) = 22.7 %
    await openCalc(page, 'motorstart');
    await fillFields(page, { 'ms-P': 55, 'ms-U': 400, 'ms-k': 7, 'ms-cos': 0.88, 'ms-eta': 0.93, 'ms-Zgrid': 0.1, 'ms-method': 'DOL' });
    await calculate(page, BUTTON);
    await expect(page.locator('#ms-status')).toContainText('Большой провал');
  });

  test('формула провала и порог 15 %', async ({ page }) => {
    await openCalc(page, 'motorstart');
    await expectFormulaPanel(page, { formula: ['Zсеть / (Zсеть + Zдв)'], ref: ['15%'] });
  });

  describeInputValidation({
    pageId: 'motorstart', button: BUTTON, result: '#ms-result-val',
    required: ['ms-P', 'ms-U', 'ms-k', 'ms-Zgrid'],
    nonNegative: ['ms-Zgrid'],
    positive: ['ms-P', 'ms-U', 'ms-k'],
    comma: { field: 'ms-Zgrid', text: '0,15', same: '0.15' },
    huge: ['ms-P'],
    knownDefects: {
      'zero:ms-P': 'мощность 0 проходит validate(): Iпуск = 0, Zдв = U/0, провал NaN %',
      'zero:ms-U': 'напряжение 0 проходит validate(): Iном = P/0, на экране Infinity/NaN',
      'zero:ms-k': 'кратность 0 проходит validate(): Iпуск = 0, Zдв = U/0, провал NaN %',
    },
  });
});
