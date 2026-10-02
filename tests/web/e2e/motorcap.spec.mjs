/* Калькулятор «Конденсатор для двигателя» — /motorcap/.
 *
 * Алгоритм страницы (показан в панели формулы):
 *   Cраб = P / (2πf·U²·cos φ·η) · 10⁶ мкФ (для «3ph» — ещё ×√3), Cпуск = 2.5·Cраб.
 * Справочное правило для трёхфазного двигателя в однофазной сети
 * (схема Штейнмеца, «треугольник»): Cраб = 4800 · I / U мкФ, где I — номинальный
 * ток двигателя, U — напряжение сети. Для 1.5 кВт, 220 В, cos 0.8, η 0.75:
 * I = 1500/(√3·220·0.6) = 6.56 А → Cраб ≈ 143 мкФ.
 */
import { test } from '@playwright/test';
import {
  openCalc, fillFields, calculate, readNumber, knownDefect, expectWithinPercent,
  describeCases, describeInputValidation, describePlaceholder, expectFormulaPanel
} from './helpers.mjs';

const BUTTON = 'btn-mc-calc';

test.describe('Конденсатор для двигателя', () => {
  describeCases({
    pageId: 'motorcap', button: BUTTON,
    cases: [
      // 1.5·10⁹ / (2π·50·48400·0.8·0.75) = 164.4 мкФ; пусковой 411.0; ток 1500/(220·0.6) = 11.4 А
      { name: 'однофазный 1.5 кВт, 220 В', input: { 'mc-P': 1.5, 'mc-U': 220, 'mc-f': 50, 'mc-cos': 0.8, 'mc-eta': 0.75, 'mc-type': '1ph' },
        expected: { '#mc-result-val': 164.4, '#mc-Cstart': 411.0, '#mc-I': 11.4, '#mc-Uc': 220 } },
      // 0.75 кВт, cos 0.85, η 0.7: 82.9 мкФ
      { name: 'однофазный 0.75 кВт', input: { 'mc-P': 0.75, 'mc-U': 220, 'mc-f': 50, 'mc-cos': 0.85, 'mc-eta': 0.7, 'mc-type': '1ph' },
        expected: { '#mc-result-val': 82.9, '#mc-Cstart': 207.3 } },
      // Частота 60 Гц уменьшает ёмкость пропорционально: 164.4 · 50/60 = 137.0
      { name: 'сеть 60 Гц', input: { 'mc-P': 1.5, 'mc-U': 220, 'mc-f': 60, 'mc-cos': 0.8, 'mc-eta': 0.75, 'mc-type': '1ph' },
        expected: { '#mc-result-val': 137.0 } },
    ],
  });

  test('трёхфазный двигатель в однофазной сети: сверка с правилом Cраб = 4800·I/U (±25 %)', async ({ page }) => {
    knownDefect('для «3ph» расчёт умножает однофазную формулу на √3 и даёт 284.8 мкФ — вдвое больше справочного 143 мкФ');
    await openCalc(page, 'motorcap');
    await fillFields(page, { 'mc-P': 1.5, 'mc-U': 220, 'mc-f': 50, 'mc-cos': 0.8, 'mc-eta': 0.75, 'mc-type': '3ph' });
    await calculate(page, BUTTON);
    expectWithinPercent(await readNumber(page, '#mc-result-val'), 143.1, 25, 'рабочая ёмкость');
  });

  test('формула рабочей и пусковой ёмкости', async ({ page }) => {
    await openCalc(page, 'motorcap');
    await expectFormulaPanel(page, { formula: ['2πf', 'U²', 'C_пуск'] });
  });

  describePlaceholder({
    pageId: 'motorcap', button: BUTTON, result: '#mc-result-val',
    defect: 'до расчёта показано 65.9 мкФ, расчёт по тем же данным даёт 164.4 мкФ',
  });

  describeInputValidation({
    pageId: 'motorcap', button: BUTTON, result: '#mc-result-val',
    required: ['mc-P', 'mc-U', 'mc-f', 'mc-cos', 'mc-eta'],
    nonNegative: ['mc-P'],
    positive: ['mc-U', 'mc-f', 'mc-cos', 'mc-eta'],
    comma: { field: 'mc-P', text: '0,55', same: '0.55' },
    huge: ['mc-P'],
  });
});
