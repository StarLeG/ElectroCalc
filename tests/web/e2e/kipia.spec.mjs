/* Калькулятор «КИПиА» — /kipia/: токовая петля, масштабирование, RTD, ПИД, точность.
 *
 * Эталоны:
 *   токовая петля 4–20 мА: Rmax = (Uпит − Uмин) / 0.02, ΣR = Rлинии + Rвх + Rбарьера;
 *   масштабирование (IEC 61131-3): PV = LRV + (S − Smin)/(Smax − Smin) · (URV − LRV);
 *   RTD — IEC 60751 (Pt100: 100 °C → 138.5055 Ом, −100 °C → 60.2558 Ом);
 *   ПИД по Циглеру — Никольсу: Kp = 0.6·Ku, Ti = 0.5·Tu, Td = 0.125·Tu;
 *   приведённая погрешность Δ = γ·диапазон/100, разрешение АЦП = диапазон / 2ⁿ.
 */
import { test } from '@playwright/test';
import {
  openCalc, fillFields, expectRejected, knownDefect,
  describeCases, describeInputValidation, expectFormulaPanel
} from './helpers.mjs';

test.describe('КИПиА', () => {
  test.describe('токовая петля', () => {
    describeCases({
      pageId: 'kipia', subTab: 'currentloop', button: 'btn-cl-calc',
      cases: [
        { name: '24 В, датчику 10 В, линия 20 + вход 250 Ом', input: { 'cl-V': 24, 'cl-Vmin': 10, 'cl-Rw': 20, 'cl-Ri': 250, 'cl-Rb': 0 },
          expected: { '#cl-Rmax': 700, '#cl-Rsum': 270, '#cl-Vdrop': 5.4, '#cl-status': 'OK' } },
        // 600 Ом допустимо, 800 Ом в петле — не работает
        { name: 'с барьером искрозащиты 250 Ом — перегрузка', input: { 'cl-V': 24, 'cl-Vmin': 12, 'cl-Rw': 50, 'cl-Ri': 500, 'cl-Rb': 250 },
          expected: { '#cl-Rmax': 600, '#cl-Rsum': 800, '#cl-status': 'FAIL' } },
        { name: '12 В, датчику 8 В', input: { 'cl-V': 12, 'cl-Vmin': 8, 'cl-Rw': 10, 'cl-Ri': 100, 'cl-Rb': 0 },
          expected: { '#cl-Rmax': 200, '#cl-Rsum': 110, '#cl-Vdrop': 2.2, '#cl-status': 'OK' } },
      ],
    });
    test('питание ниже минимума датчика — отказ', async ({ page }) => {
      knownDefect('Uпит < Uмин принимается: Rmax получается отрицательным (−200 Ом), выдаётся FAIL без объяснения');
      await openCalc(page, 'kipia', 'currentloop');
      await expectRejected(page, { button: 'btn-cl-calc', result: '#cl-Rmax' }, () => fillFields(page, { 'cl-V': 6, 'cl-Vmin': 10 }));
    });
    describeInputValidation({
      pageId: 'kipia', subTab: 'currentloop', button: 'btn-cl-calc', result: '#cl-Rmax',
      required: ['cl-V', 'cl-Vmin', 'cl-Rw', 'cl-Ri'], nonNegative: ['cl-V', 'cl-Vmin', 'cl-Rw', 'cl-Ri'],
      comma: { field: 'cl-Rw', text: '20,5', same: '20.5' },
    });
  });

  test.describe('масштабирование сигнала', () => {
    describeCases({
      pageId: 'kipia', subTab: 'scaling', button: 'btn-sc-scale-calc',
      cases: [
        { name: '12 мА в шкале 0…100 → 50', input: { 'sc-signal': 12, 'sc-Smin': 4, 'sc-Smax': 20, 'sc-LRV': 0, 'sc-URV': 100 },
          expected: { '#sc-scale-val': 50, '#sc-scale-pct': 50 } },
        { name: '4 мА — нижний предел шкалы', input: { 'sc-signal': 4, 'sc-Smin': 4, 'sc-Smax': 20, 'sc-LRV': 0, 'sc-URV': 16 },
          expected: { '#sc-scale-val': 0, '#sc-scale-pct': 0 } },
        { name: '20 мА — верхний предел шкалы 0…16 бар', input: { 'sc-signal': 20, 'sc-Smin': 4, 'sc-Smax': 20, 'sc-LRV': 0, 'sc-URV': 16 },
          expected: { '#sc-scale-val': 16, '#sc-scale-pct': 100 } },
        { name: '0–10 В: 2.5 В → 25 % шкалы 0…200', input: { 'sc-signal': 2.5, 'sc-Smin': 0, 'sc-Smax': 10, 'sc-LRV': 0, 'sc-URV': 200 },
          expected: { '#sc-scale-val': 50, '#sc-scale-pct': 25 } },
        // Шкала −50…+150 °C — обычная для датчиков температуры: 8 мА → 0 °C
        { name: 'шкала с отрицательным началом −50…150 °C', input: { 'sc-signal': 8, 'sc-Smin': 4, 'sc-Smax': 20, 'sc-LRV': -50, 'sc-URV': 150 },
          expected: { '#sc-scale-val': 0, '#sc-scale-pct': 25 },
          defect: 'validate() отвергает отрицательное LRV, и шкалу −50…150 °C задать нельзя' },
      ],
    });
    test('равные Smin и Smax — отказ', async ({ page }) => {
      await openCalc(page, 'kipia', 'scaling');
      await expectRejected(page, { button: 'btn-sc-scale-calc', result: '#sc-scale-val' }, () => fillFields(page, { 'sc-Smin': 4, 'sc-Smax': 4 }));
    });
    test('формула и ссылка на IEC 61131-3', async ({ page }) => {
      await openCalc(page, 'kipia', 'scaling');
      await expectFormulaPanel(page, { scope: '#sub-scaling', formula: ['LRV + (S−Smin)/(Smax−Smin)'], ref: ['IEC 61131-3'] });
    });
  });

  test.describe('термосопротивление', () => {
    describeCases({
      pageId: 'kipia', subTab: 'rtd', button: 'btn-rtd-calc',
      cases: [
        { name: 'Pt100, 100 °C → 138.506 Ом', input: { 'rtd-mode': 't2r', 'rtd-type': 'Pt100', 'rtd-val': 100 }, expected: { '#rtd-result-unit': 138.5055 } },
        { name: 'Pt100, −100 °C → 60.256 Ом', input: { 'rtd-mode': 't2r', 'rtd-type': 'Pt100', 'rtd-val': -100 }, expected: { '#rtd-result-unit': 60.2558 } },
        { name: 'Pt1000, 0 °C → 1000 Ом', input: { 'rtd-mode': 't2r', 'rtd-type': 'Pt1000', 'rtd-val': 0 }, expected: { '#rtd-result-unit': 1000 } },
        { name: 'Pt100, 175.856 Ом → 200 °C', input: { 'rtd-mode': 'r2t', 'rtd-type': 'Pt100', 'rtd-val': 175.856 }, expected: { '#rtd-result-unit': 200 } },
        { name: 'Pt500, 92.6005 Ом → −200 °C', input: { 'rtd-mode': 'r2t', 'rtd-type': 'Pt500', 'rtd-val': 92.6005 }, expected: { '#rtd-result-unit': -200 } },
      ],
    });
    test('температура вне −200…850 °C — отказ', async ({ page }) => {
      await openCalc(page, 'kipia', 'rtd');
      await expectRejected(page, { button: 'btn-rtd-calc', result: '#rtd-result-unit' }, () => fillFields(page, { 'rtd-mode': 't2r', 'rtd-val': -250 }));
    });
    test('ссылка на IEC 60751', async ({ page }) => {
      await openCalc(page, 'kipia', 'rtd');
      await expectFormulaPanel(page, { scope: '#sub-rtd', ref: ['IEC 60751'] });
    });
  });

  test.describe('ПИД по Циглеру — Никольсу', () => {
    describeCases({
      pageId: 'kipia', subTab: 'pid', button: 'btn-pid-calc',
      cases: [
        { name: 'Ku = 2, Tu = 10 с', input: { 'pid-Ku': 2, 'pid-Tu': 10 },
          expected: { '#pid-result-val': 1.2, '#pid-Ti': 5, '#pid-Td': 1.25, '#pid-Ki': 0.24, '#pid-Kd': 1.5 } },
        { name: 'Ku = 5, Tu = 4 с', input: { 'pid-Ku': 5, 'pid-Tu': 4 },
          expected: { '#pid-result-val': 3, '#pid-Ti': 2, '#pid-Td': 0.5, '#pid-Ki': 1.5, '#pid-Kd': 1.5 } },
        { name: 'Ku = 1.5, Tu = 30 с', input: { 'pid-Ku': 1.5, 'pid-Tu': 30 },
          expected: { '#pid-result-val': 0.9, '#pid-Ti': 15, '#pid-Td': 3.75, '#pid-Ki': 0.06, '#pid-Kd': 3.375 } },
      ],
    });
    test('формула настройки', async ({ page }) => {
      await openCalc(page, 'kipia', 'pid');
      await expectFormulaPanel(page, { scope: '#sub-pid', formula: ['Kp=0.6·Ku', 'Ti=0.5·Tu', 'Td=0.125·Tu'], ref: ['Циглер'] });
    });
    describeInputValidation({
      pageId: 'kipia', subTab: 'pid', button: 'btn-pid-calc', result: '#pid-result-val',
      required: ['pid-Ku', 'pid-Tu'], positive: ['pid-Tu'],
      knownDefects: { 'zero:pid-Tu': 'Tu = 0 проходит validate(): Ki = Kp/0 = Infinity' },
    });
  });

  test.describe('точность измерения', () => {
    describeCases({
      pageId: 'kipia', subTab: 'accuracy', button: 'btn-acc-calc',
      cases: [
        { name: 'класс 0.5, диапазон 100, 12 бит', input: { 'acc-cl': 0.5, 'acc-range': 100, 'acc-bits': 12 }, expected: { '#acc-abs': 0.5, '#acc-lsb': 0.0244 } },
        { name: 'класс 1.0, диапазон 600, 10 бит', input: { 'acc-cl': 1, 'acc-range': 600, 'acc-bits': 10 }, expected: { '#acc-abs': 6, '#acc-lsb': 0.5859 } },
        { name: 'класс 0.25, диапазон 16, 16 бит', input: { 'acc-cl': 0.25, 'acc-range': 16, 'acc-bits': 16 }, expected: { '#acc-abs': 0.04, '#acc-lsb': 0.0002 } },
      ],
    });
    describeInputValidation({
      pageId: 'kipia', subTab: 'accuracy', button: 'btn-acc-calc', result: '#acc-abs',
      required: ['acc-cl', 'acc-range', 'acc-bits'], nonNegative: ['acc-cl', 'acc-range', 'acc-bits'],
      comma: { field: 'acc-cl', text: '0,25', same: '0.25' },
    });
  });
});
