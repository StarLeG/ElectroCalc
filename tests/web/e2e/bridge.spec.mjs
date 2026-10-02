/* Калькулятор «Мост Уитстона» — /bridge/.
 *
 * Эталон: Vвых = V · (R3/(R3 + R4) − R2/(R1 + R2)).
 * Vвых = 0 ⇔ R3·(R1 + R2) = R2·(R3 + R4) ⇔ R1·R3 = R2·R4 — условие баланса.
 */
import { test, expect } from '@playwright/test';
import {
  openCalc, fillFields, expectRejected, knownDefect, describeCases, describeInputValidation, describePlaceholder, expectFormulaPanel
} from './helpers.mjs';

const BUTTON = 'btn-wb-calc';
const arms = (R1, R2, R3, R4, V) => ({ 'wb-R1': R1, 'wb-R2': R2, 'wb-R3': R3, 'wb-R4': R4, 'wb-V': V });

test.describe('Мост Уитстона', () => {
  describeCases({
    pageId: 'bridge', button: BUTTON,
    cases: [
      { name: 'равные плечи — баланс', input: arms(1000, 1000, 1000, 1000, 5),
        expected: { '#wb-result-val': 0, '#wb-status': 'Сбалансирован' } },
      // 5·(1100/2100 − 0.5) = 0.119 В
      { name: 'R3 = 1.1 кОм — разбаланс 0.119 В', input: arms(1000, 1000, 1100, 1000, 5),
        expected: { '#wb-result-val': 0.119, '#wb-status': 'Не сбалансирован' } },
      // Четвертьмост с Pt100 при 100 °C (138.5 Ом): 10·(138.5/238.5 − 0.5) = 0.807 В
      { name: 'четвертьмост с Pt100 при 100 °C', input: arms(100, 100, 138.5, 100, 10),
        expected: { '#wb-result-val': 0.807 } },
      // R1·R3 = R2·R4 = 2·10⁶ — баланс при неравных плечах
      { name: 'баланс при неравных плечах R1·R3 = R2·R4', input: arms(1000, 2000, 2000, 1000, 5),
        expected: { '#wb-result-val': 0, '#wb-status': 'Сбалансирован', '#wb-prod1': 2000000, '#wb-prod2': 2000000 } },
      // Тензомост 350 Ом, разбаланс 1 Ом: −7.13 мВ
      { name: 'тензомост 350 Ом, R4 = 351 Ом', input: arms(350, 350, 350, 351, 10),
        expected: { '#wb-result-val': -0.007 } },
    ],
  });

  test('формула выходного напряжения', async ({ page }) => {
    await openCalc(page, 'bridge');
    await expectFormulaPanel(page, { formula: ['R3/(R3+R4) - R2/(R1+R2)'] });
  });

  test('условие баланса в подсказке совпадает с формулой', async ({ page }) => {
    knownDefect('в подсказке «сбалансирован когда R1×R4 = R2×R3», а по формуле на той же странице (и в коде) — R1·R3 = R2·R4');
    await openCalc(page, 'bridge');
    await expect(page.locator('.page.active .formula-panel .ref').first()).toContainText(/R1\s*[×·]\s*R3\s*=\s*R2\s*[×·]\s*R4/);
  });

  describePlaceholder({ pageId: 'bridge', button: BUTTON, result: '#wb-result-val' });

  describeInputValidation({
    pageId: 'bridge', button: BUTTON, result: '#wb-result-val',
    required: ['wb-R1', 'wb-R2', 'wb-R3', 'wb-R4', 'wb-V'],
    nonNegative: ['wb-R1', 'wb-R2', 'wb-R3', 'wb-R4'],
    comma: { field: 'wb-R3', text: '138,5', same: '138.5' },
    huge: ['wb-V'],
  });

  test('все плечи нулевые — отказ (0/0)', async ({ page }) => {
    knownDefect('R1 = R2 = 0 проходит validate(): R2/(R1+R2) = 0/0 = NaN на экране');
    await openCalc(page, 'bridge');
    await expectRejected(page, { button: BUTTON, result: '#wb-result-val' }, () => fillFields(page, { 'wb-R1': 0, 'wb-R2': 0 }));
  });
});
