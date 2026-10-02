/* Калькулятор «Компенсация реактивной мощности» — /compensation/.
 *
 * Эталон: Qc = P · (tg φ₁ − tg φ₂), tg φ = √(1 − cos²φ) / cos φ;
 * число ступеней — ⌈Qc / Qступ⌉; снижение реактивной мощности (1 − Q₂/Q₁)·100 %.
 */
import { test } from '@playwright/test';
import {
  openCalc, fillFields, expectRejected, knownDefect,
  describeCases, describeInputValidation, describePlaceholder, expectFormulaPanel
} from './helpers.mjs';

const BUTTON = 'btn-comp-calc';

test.describe('Компенсация реактивной мощности', () => {
  describeCases({
    pageId: 'compensation', button: BUTTON,
    cases: [
      {
        // tg φ₁ = 1.3333, tg φ₂ = 0.3287 → Qc = 100.46 квар, 11 ступеней по 10
        name: '100 кВт, cos 0.6 → 0.95, ступень 10 квар',
        input: { 'comp-P': 100, 'comp-cos1': 0.6, 'comp-cos2': 0.95, 'comp-step': 10 },
        expected: { '#comp-result-val': 100.46, '#comp-steps': 11, '#comp-Q1': 133.33, '#comp-Q2': 32.87, '#comp-save': 75.35 },
      },
      {
        // tg φ₁ = 1.0202, tg φ₂ = 0.3287 → Qc = 172.88 квар, 7 ступеней по 25
        name: '250 кВт, cos 0.7 → 0.95, ступень 25 квар',
        input: { 'comp-P': 250, 'comp-cos1': 0.7, 'comp-cos2': 0.95, 'comp-step': 25 },
        expected: { '#comp-result-val': 172.88, '#comp-steps': 7, '#comp-Q1': 255.05, '#comp-save': 67.78 },
      },
      {
        // Полная компенсация до cos φ = 1: Q₂ = 0, снижение 100 %
        name: 'полная компенсация до cos 1',
        input: { 'comp-P': 50, 'comp-cos1': 0.8, 'comp-cos2': 1, 'comp-step': 5 },
        expected: { '#comp-result-val': 37.5, '#comp-steps': 8, '#comp-Q2': 0, '#comp-save': 100 },
      },
      {
        // tg φ₁ = 0.8819, tg φ₂ = 0.4260 → Qc = 182.37 квар, 4 ступени по 50
        name: '400 кВт, cos 0.75 → 0.92, ступень 50 квар',
        input: { 'comp-P': 400, 'comp-cos1': 0.75, 'comp-cos2': 0.92, 'comp-step': 50 },
        expected: { '#comp-result-val': 182.37, '#comp-steps': 4, '#comp-Q2': 170.40 },
      },
    ],
  });

  test('формула через тангенсы и ссылка на ПУЭ', async ({ page }) => {
    await openCalc(page, 'compensation');
    await expectFormulaPanel(page, { formula: ['tgφ₁', 'tgφ₂'], ref: ['ПУЭ'] });
  });

  describePlaceholder({
    pageId: 'compensation', button: BUTTON, result: '#comp-result-val',
    defect: 'до расчёта показано 80.0 квар, а расчёт по тем же данным (100 кВт, 0.6 → 0.95) даёт 100.5',
  });

  test('целевой cos φ ниже исходного не даёт отрицательной мощности установки', async ({ page }) => {
    // Компенсировать «назад» нельзя: при cos φ₂ < cos φ₁ формула даёт Qc < 0.
    knownDefect('cos φ₂ < cos φ₁ принимается без предупреждения: показывается отрицательная мощность установки и отрицательное число ступеней');
    await openCalc(page, 'compensation');
    await expectRejected(page, { button: BUTTON, result: '#comp-result-val', field: 'comp-cos2' },
      () => fillFields(page, { 'comp-cos1': 0.9, 'comp-cos2': 0.8 }));
  });

  describeInputValidation({
    pageId: 'compensation', button: BUTTON, result: '#comp-result-val',
    required: ['comp-P', 'comp-cos1', 'comp-cos2', 'comp-step'],
    positive: ['comp-P', 'comp-step', 'comp-cos1', 'comp-cos2'],
    comma: { field: 'comp-cos1', text: '0,7', same: '0.7' },
    huge: ['comp-P'],
  });
});
