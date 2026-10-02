/* Калькулятор «Стабилитрон» — /zener/.
 *
 * Эталон параметрического стабилизатора:
 *   R = (Vin − Vz) / (Iz + IL);  P_R = (Iz + IL)²·R;  P_z = Vz·Iz.
 * Правило проектирования: стабилитрон обязан пережить отключение нагрузки,
 * когда через него идёт весь ток Iz + IL, то есть проверять надо Vz·(Iz + IL).
 */
import { test, expect } from '@playwright/test';
import {
  openCalc, fillFields, calculate, expectRejected, knownDefect,
  describeCases, describeInputValidation, describePlaceholder, expectFormulaPanel
} from './helpers.mjs';

const BUTTON = 'btn-zen-calc';
const zener = (Vin, Vz, IL, Iz, Pz) => ({ 'zen-Vin': Vin, 'zen-Vz': Vz, 'zen-IL': IL, 'zen-Iz': Iz, 'zen-Pz': Pz });

test.describe('Стабилитрон', () => {
  describeCases({
    pageId: 'zener', button: BUTTON,
    cases: [
      // R = 18.9/0.030 = 630 Ом; P_R = 0.0009·630 = 567 мВт; P_z = 51 мВт; ближайший E12 — 680
      { name: '24 → 5.1 В, нагрузка 20 мА, Iz 10 мА', input: zener(24, 5.1, 20, 10, 0.5),
        expected: { '#zen-result-val': 630, '#zen-Pr': 567, '#zen-Pzact': 51, '#zen-Rnear': 680, '#zen-IR': 30, '#zen-check': 'Норма' } },
      // R = 3.8/0.015 = 253.3 Ом; P_R = 0.000225·253.3 = 57 мВт; P_z = 8.2·5 = 41 мВт; ближайший 270
      { name: '12 → 8.2 В, нагрузка 10 мА, Iz 5 мА', input: zener(12, 8.2, 10, 5, 0.5),
        expected: { '#zen-result-val': 253.3, '#zen-Pr': 57, '#zen-Pzact': 41, '#zen-Rnear': 270 } },
      // P_z = 12·50 = 600 мВт > 500 мВт — превышение
      { name: 'превышена мощность стабилитрона', input: zener(24, 12, 10, 50, 0.5),
        expected: { '#zen-result-val': 200, '#zen-Pzact': 600, '#zen-check': 'Превышена' } },
    ],
  });

  test('мощность стабилитрона проверяется для режима без нагрузки', async ({ page }) => {
    // Vz·(Iz+IL) = 5.1·(10+90) мА = 510 мВт > 500 мВт: без нагрузки стабилитрон сгорит.
    knownDefect('проверяется только Vz·Iz = 51 мВт; при отключении нагрузки через стабилитрон идёт Iz+IL и мощность 510 мВт превышает 500');
    await openCalc(page, 'zener');
    await fillFields(page, zener(24, 5.1, 90, 10, 0.5));
    await calculate(page, BUTTON);
    await expect(page.locator('#zen-check')).toContainText('Превышена');
  });

  test('Vin ≤ Vz — отказ', async ({ page }) => {
    await openCalc(page, 'zener');
    await expectRejected(page, { button: BUTTON, result: '#zen-result-val' }, () => fillFields(page, { 'zen-Vin': 5, 'zen-Vz': 5.1 }));
  });

  test('формулы R, P_R, P_z', async ({ page }) => {
    await openCalc(page, 'zener');
    await expectFormulaPanel(page, { formula: ['(Vin - Vz) / (Iz + IL)', 'P_z = Vz×Iz'] });
  });

  describePlaceholder({ pageId: 'zener', button: BUTTON, result: '#zen-result-val' });

  describeInputValidation({
    pageId: 'zener', button: BUTTON, result: '#zen-result-val',
    required: ['zen-Vin', 'zen-Vz', 'zen-IL', 'zen-Iz', 'zen-Pz'],
    nonNegative: ['zen-IL'],
    positive: ['zen-Iz', 'zen-Pz'],
    comma: { field: 'zen-Vz', text: '5,6', same: '5.6' },
  });
});
