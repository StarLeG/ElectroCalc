/* Калькулятор «Операционный усилитель» — /opamp/.
 *
 * Эталон — идеальный ОУ:
 *   инвертирующий       K = −Rf/R1;
 *   неинвертирующий     K = 1 + Rf/R1;
 *   сумматор            Vout = −(Rf/R1·V1 + Rf/R2·V2);
 *   дифференциальный    Vout = V1·R4/(R3 + R4)·(R1 + R2)/R1 − V2·R2/R1
 *                       (при R3/R4 = R1/R2 сводится к (R2/R1)·(V1 − V2)).
 */
import { test } from '@playwright/test';
import { openCalc, describeCases, describeInputValidation, describePlaceholder, expectFormulaPanel } from './helpers.mjs';

test.describe('Операционный усилитель', () => {
  test.describe('инвертирующий', () => {
    describeCases({
      pageId: 'opamp', subTab: 'invop', button: 'btn-inv-calc',
      cases: [
        { name: 'Rf/R1 = 10, Vin 0.5 В → −5 В', input: { 'inv-R1': 10, 'inv-Rf': 100, 'inv-Vin': 0.5 }, expected: { '#inv-K': -10, '#inv-result-val': -5 } },
        { name: 'Rf = R1 — повторитель с инверсией', input: { 'inv-R1': 47, 'inv-Rf': 47, 'inv-Vin': 2 }, expected: { '#inv-K': -1, '#inv-result-val': -2 } },
        { name: 'отрицательный вход даёт положительный выход', input: { 'inv-R1': 1, 'inv-Rf': 22, 'inv-Vin': -0.1 }, expected: { '#inv-result-val': 2.2 } },
      ],
    });
    describePlaceholder({ pageId: 'opamp', subTab: 'invop', button: 'btn-inv-calc', result: '#inv-result-val' });
    describeInputValidation({
      pageId: 'opamp', subTab: 'invop', button: 'btn-inv-calc', result: '#inv-result-val',
      required: ['inv-R1', 'inv-Rf'], positive: ['inv-R1'], nonNegative: ['inv-Rf'],
      knownDefects: { 'zero:inv-R1': 'R1 = 0 проходит validate(): K = −Rf/0 = −Infinity' },
    });
  });

  test.describe('неинвертирующий', () => {
    describeCases({
      pageId: 'opamp', subTab: 'noninvop', button: 'btn-ninv-calc',
      cases: [
        { name: 'K = 11, Vin 0.5 → 5.5 В', input: { 'ninv-R1': 10, 'ninv-Rf': 100, 'ninv-Vin': 0.5 }, expected: { '#ninv-K': 11, '#ninv-result-val': 5.5 } },
        { name: 'Rf = 0 — повторитель, K = 1', input: { 'ninv-R1': 10, 'ninv-Rf': 0, 'ninv-Vin': 1.23 }, expected: { '#ninv-K': 1, '#ninv-result-val': 1.23 } },
        { name: 'K = 2', input: { 'ninv-R1': 4.7, 'ninv-Rf': 4.7, 'ninv-Vin': -1.5 }, expected: { '#ninv-result-val': -3 } },
      ],
    });
    describeInputValidation({
      pageId: 'opamp', subTab: 'noninvop', button: 'btn-ninv-calc', result: '#ninv-result-val',
      required: ['ninv-R1', 'ninv-Rf'], positive: ['ninv-R1'],
      knownDefects: { 'zero:ninv-R1': 'R1 = 0 проходит validate(): K = 1 + Rf/0 = Infinity' },
    });
  });

  test.describe('сумматор', () => {
    describeCases({
      pageId: 'opamp', subTab: 'sumop', button: 'btn-sum-calc',
      cases: [
        { name: 'равные резисторы: −(1 + 2) = −3 В', input: { 'sum-R1': 10, 'sum-R2': 10, 'sum-Rf': 10, 'sum-V1': 1, 'sum-V2': 2 }, expected: { '#sum-result-val': -3 } },
        // −(100/10·0.1 + 100/20·0.2) = −(1 + 1) = −2 В
        { name: 'взвешенная сумма', input: { 'sum-R1': 10, 'sum-R2': 20, 'sum-Rf': 100, 'sum-V1': 0.1, 'sum-V2': 0.2 }, expected: { '#sum-result-val': -2 } },
        { name: 'входы разных знаков', input: { 'sum-R1': 10, 'sum-R2': 10, 'sum-Rf': 10, 'sum-V1': 1.5, 'sum-V2': -0.5 }, expected: { '#sum-result-val': -1 } },
      ],
    });
    describeInputValidation({
      pageId: 'opamp', subTab: 'sumop', button: 'btn-sum-calc', result: '#sum-result-val',
      required: ['sum-R1', 'sum-R2', 'sum-Rf'], positive: ['sum-R1', 'sum-R2'],
      knownDefects: {
        'zero:sum-R1': 'R1 = 0 проходит validate(): Rf/0 даёт Infinity на выходе',
        'zero:sum-R2': 'R2 = 0 проходит validate(): Rf/0 даёт Infinity на выходе',
      },
    });
  });

  test.describe('дифференциальный', () => {
    describeCases({
      pageId: 'opamp', subTab: 'diffop', button: 'btn-diff-calc',
      cases: [
        // Все по 10 к: Vout = V1 − V2 = 1 В
        { name: 'равные резисторы: V1 − V2', input: { 'diff-R1': 10, 'diff-R2': 10, 'diff-R3': 10, 'diff-R4': 10, 'diff-V1': 2, 'diff-V2': 1 }, expected: { '#diff-result-val': 1 } },
        // R2/R1 = R4/R3 = 10: Vout = 10·(V1 − V2) = 10·0.3 = 3 В
        { name: 'согласованные плечи, усиление 10', input: { 'diff-R1': 1, 'diff-R2': 10, 'diff-R3': 1, 'diff-R4': 10, 'diff-V1': 0.5, 'diff-V2': 0.2 }, expected: { '#diff-result-val': 3 } },
        // Несогласованные: 2·30/40·(10+20)/10 − 1·20/10 = 4.5 − 2 = 2.5 В
        { name: 'несогласованные плечи R2 = 20 к, R4 = 30 к', input: { 'diff-R1': 10, 'diff-R2': 20, 'diff-R3': 10, 'diff-R4': 30, 'diff-V1': 2, 'diff-V2': 1 }, expected: { '#diff-result-val': 2.5 } },
        // R3 = 30, R4 = 10: 2·10/40·20/10 − 1·10/10 = 1 − 1 = 0 В
        { name: 'несогласованный делитель R3/R4', input: { 'diff-R1': 10, 'diff-R2': 10, 'diff-R3': 30, 'diff-R4': 10, 'diff-V1': 2, 'diff-V2': 1 }, expected: { '#diff-result-val': 0 } },
      ],
    });
    test('полная формула дифференциального каскада', async ({ page }) => {
      await openCalc(page, 'opamp', 'diffop');
      await expectFormulaPanel(page, { scope: '#sub-diffop', formula: ['R4/(R3+R4)', '(R1+R2)/R1'], ref: ['R3/R4 = R1/R2'] });
    });
    describePlaceholder({
      pageId: 'opamp', subTab: 'diffop', button: 'btn-diff-calc', result: '#diff-result-val',
      defect: 'до расчёта показано 10.00 В, расчёт по тем же данным (все по 10 к, 2 В и 1 В) даёт 1.00 В',
    });
    describeInputValidation({
      pageId: 'opamp', subTab: 'diffop', button: 'btn-diff-calc', result: '#diff-result-val',
      required: ['diff-R1', 'diff-R2', 'diff-R3', 'diff-R4'], positive: ['diff-R1'],
    });
  });
});
