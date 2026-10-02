/* Калькулятор «Ток нейтрали» — /neutral/.
 *
 * Эталон — векторная сумма фазных токов (фазы сдвинуты на 120°, ток каждой
 * фазы отстаёт от напряжения на φ). Для одинаковых cos φ:
 *   Iн = √(I1² + I2² + I3² − I1·I2 − I2·I3 − I1·I3).
 * Небаланс = (Imax − Imin) / Imax · 100 %.
 */
import { test } from '@playwright/test';
import { openCalc, describeCases, describeInputValidation, expectFormulaPanel } from './helpers.mjs';

const BUTTON = 'btn-nc-calc';
const loads = (a, b, c, c1 = 1, c2 = 1, c3 = 1) => ({
  'nc-IL1': a, 'nc-IL2': b, 'nc-IL3': c, 'nc-cos1': c1, 'nc-cos2': c2, 'nc-cos3': c3,
});

test.describe('Ток нейтрали', () => {
  describeCases({
    pageId: 'neutral', button: BUTTON,
    cases: [
      // √(400 + 225 + 100 − 300 − 150 − 200) = √75 = 8.66 А; 43.3 % от 20 А; небаланс 50 %
      { name: '20 / 15 / 10 А, активная нагрузка', input: loads(20, 15, 10),
        expected: { '#nc-result-val': 8.7, '#nc-InPct': 43.3, '#nc-imbalance': 50, '#nc-status': 'Высокий' } },
      // Симметрия — ток нейтрали равен нулю
      { name: 'симметричная нагрузка 10 / 10 / 10 А', input: loads(10, 10, 10),
        expected: { '#nc-result-val': 0, '#nc-imbalance': 0, '#nc-status': 'Допустимо' } },
      // Нагружена одна фаза — весь её ток идёт по нейтрали
      { name: 'нагружена одна фаза', input: loads(10, 0, 0),
        expected: { '#nc-result-val': 10, '#nc-InPct': 100 } },
      // При одинаковом cos φ сдвиг у всех фаз общий, модуль суммы тот же: √300 = 17.32 А
      { name: '30 / 20 / 10 А, все cos 0.8', input: loads(30, 20, 10, 0.8, 0.8, 0.8),
        expected: { '#nc-result-val': 17.3, '#nc-InPct': 57.7 } },
      // Равные токи, но во второй фазе cos 0.5: вектор повёрнут на 60°, |Iн| = 20 А
      { name: 'равные токи, разный характер нагрузки', input: loads(20, 20, 20, 1, 0.5, 1),
        expected: { '#nc-result-val': 20, '#nc-imbalance': 0 } },
    ],
  });

  test('формула и замечание о симметричной нагрузке', async ({ page }) => {
    await openCalc(page, 'neutral');
    await expectFormulaPanel(page, { formula: ['I1·I2', 'I2·I3', 'I1·I3'], ref: ['Iн = 0'] });
  });

  describeInputValidation({
    pageId: 'neutral', button: BUTTON, result: '#nc-result-val',
    required: ['nc-IL1', 'nc-IL2', 'nc-IL3'],
    nonNegative: ['nc-IL1', 'nc-IL2', 'nc-IL3'],
    comma: { field: 'nc-IL1', text: '12,5', same: '12.5' },
    huge: ['nc-IL1'],
  });
});
