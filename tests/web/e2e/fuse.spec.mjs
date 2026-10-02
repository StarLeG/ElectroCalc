/* Калькулятор «Предохранитель» — /fuse/.
 *
 * Алгоритм страницы: Iпред = Iнагр · k, k = 1.5 без пусковых токов и 2.5 с ними;
 * номинал — ближайший больший из ряда ГОСТ IEC 60269 (…, 16, 20, 25, 32, 40, …, 250, 315 А).
 */
import { test, expect } from '@playwright/test';
import {
  openCalc, fillFields, calculate, knownDefect, expectRejected,
  describeCases, describeInputValidation, expectFormulaPanel
} from './helpers.mjs';

const BUTTON = 'btn-fu-calc';

test.describe('Предохранитель', () => {
  describeCases({
    pageId: 'fuse', button: BUTTON,
    cases: [
      // 10·1.5 = 15 → 16 А
      { name: '10 А без пуска', input: { 'fu-Iload': 10, 'fu-U': 230, 'fu-type': 'gG', 'fu-startup': 'no' },
        expected: { '#fu-Ifuse': 15, '#fu-result-val': 16 } },
      // 10·2.5 = 25 → 25 А (точно на номинале)
      { name: '10 А с пуском — ровно номинал 25 А', input: { 'fu-Iload': 10, 'fu-U': 400, 'fu-type': 'aM', 'fu-startup': 'yes' },
        expected: { '#fu-Ifuse': 25, '#fu-result-val': 25 } },
      // 3·1.5 = 4.5 → 6 А
      { name: '3 А без пуска', input: { 'fu-Iload': 3, 'fu-U': 24, 'fu-startup': 'no' },
        expected: { '#fu-Ifuse': 4.5, '#fu-result-val': 6 } },
      // 100·2.5 = 250 → 250 А
      { name: '100 А с пуском', input: { 'fu-Iload': 100, 'fu-U': 400, 'fu-startup': 'yes' },
        expected: { '#fu-Ifuse': 250, '#fu-result-val': 250 } },
      // 0.2·1.5 = 0.3 → 0.5 А — начало ряда
      { name: 'слаботочная цепь 0.2 А', input: { 'fu-Iload': 0.2, 'fu-U': 24, 'fu-startup': 'no' },
        expected: { '#fu-Ifuse': 0.3, '#fu-result-val': 0.5 } },
    ],
  });

  test('ток выше ряда — предупреждение, а не молчаливый максимальный номинал', async ({ page }) => {
    knownDefect('при Iпред = 500 А калькулятор показывает 315 А — верх ряда — без предупреждения, что номинал недостаточен');
    await openCalc(page, 'fuse');
    await fillFields(page, { 'fu-Iload': 200, 'fu-startup': 'yes' });
    await calculate(page, BUTTON);
    await expect(page.locator('#fu-result-val')).not.toHaveText('315 А');
  });

  test('формула с коэффициентами 1.5 и 2.5', async ({ page }) => {
    await openCalc(page, 'fuse');
    await expectFormulaPanel(page, { formula: ['k=1.5', 'k=2.5'] });
  });

  test('нулевой ток нагрузки — отказ', async ({ page }) => {
    knownDefect('Iнагр = 0 проходит validate(): подбирается предохранитель 0.5 А на нулевую нагрузку');
    await openCalc(page, 'fuse');
    await expectRejected(page, { button: BUTTON, result: '#fu-result-val', field: 'fu-Iload' },
      () => fillFields(page, { 'fu-Iload': 0 }));
  });

  describeInputValidation({
    pageId: 'fuse', button: BUTTON, result: '#fu-result-val',
    required: ['fu-Iload', 'fu-U'],
    nonNegative: ['fu-Iload', 'fu-U'],
    comma: { field: 'fu-Iload', text: '7,5', same: '7.5' },
    huge: ['fu-Iload'],
  });
});
