/* Калькулятор «Длина кабеля токовой петли 4–20 мА» — /cablelength/.
 *
 * Эталон: при 20 мА на петле допустимо Rmax = (Uпит − Uмин) / 0.02 Ом;
 * на кабель остаётся Rкаб = Rmax − Rнагр; петля двухпроводная, поэтому
 * L = Rкаб · S / (2 · ρ), ρ(Cu) = 0.0175 Ом·мм²/м.
 */
import { test } from '@playwright/test';
import { openCalc, describeCases, describeInputValidation, expectFormulaPanel } from './helpers.mjs';

const BUTTON = 'btn-cl2-calc';

test.describe('Длина кабеля 4–20 мА', () => {
  describeCases({
    pageId: 'cablelength', button: BUTTON,
    cases: [
      // Rmax = 700 Ом; Rкаб = 450 Ом; L = 450·1.5/0.035 = 19286 м
      { name: '24 В, датчику 10 В, нагрузка 250 Ом, 1.5 мм²',
        input: { 'cl2-Vsupply': 24, 'cl2-Vmin': 10, 'cl2-Rload': 250, 'cl2-Rwire': 10, 'cl2-S': 1.5 },
        expected: { '#cl2-Rmax': 700, '#cl2-Rtotal': 260, '#cl2-Rcable': 450, '#cl2-result-val': 19286, '#cl2-status': 'работоспособна' } },
      // Rmax = 600; Rкаб = 350; L = 350·0.5/0.035 = 5000 м
      { name: '24 В, датчику 12 В, 0.5 мм²',
        input: { 'cl2-Vsupply': 24, 'cl2-Vmin': 12, 'cl2-Rload': 250, 'cl2-Rwire': 10, 'cl2-S': 0.5 },
        expected: { '#cl2-Rmax': 600, '#cl2-result-val': 5000 } },
      // Rmax = 700; Rкаб = 200; L = 200·1/0.035 = 5714 м
      { name: 'нагрузка 500 Ом (HART-модем + вход), 1 мм²',
        input: { 'cl2-Vsupply': 24, 'cl2-Vmin': 10, 'cl2-Rload': 500, 'cl2-Rwire': 0, 'cl2-S': 1 },
        expected: { '#cl2-Rcable': 200, '#cl2-result-val': 5714 } },
      // Rmax = 75 Ом < 250 — петля не работает при любой длине
      { name: '12 В не хватает на 250 Ом нагрузки',
        input: { 'cl2-Vsupply': 12, 'cl2-Vmin': 10.5, 'cl2-Rload': 250, 'cl2-Rwire': 0, 'cl2-S': 1.5 },
        expected: { '#cl2-Rmax': 75, '#cl2-result-val': 0, '#cl2-status': 'слишком велико' } },
    ],
  });

  test('формула учитывает двухпроводную петлю', async ({ page }) => {
    await openCalc(page, 'cablelength');
    await expectFormulaPanel(page, { formula: ['/ 0.02', '2 × ρ'] });
  });

  describeInputValidation({
    pageId: 'cablelength', button: BUTTON, result: '#cl2-result-val',
    required: ['cl2-Vsupply', 'cl2-Vmin', 'cl2-Rload', 'cl2-Rwire'],
    nonNegative: ['cl2-Vsupply', 'cl2-Vmin', 'cl2-Rload', 'cl2-Rwire'],
    comma: { field: 'cl2-S', text: '0,75', same: '0.75' },
    huge: ['cl2-Vsupply'],
  });
});
