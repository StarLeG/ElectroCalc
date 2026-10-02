/* Калькулятор «Проверка кабеля на термическую стойкость к КЗ» — /kzcable/.
 *
 * Эталон — адиабатический нагрев (ГОСТ Р 50571.5.54 / IEC 60364-5-54, IEC 60949):
 *   Smin = Iкз · √t / k,
 * k для изоляции из сшитого полиэтилена: медь 143, алюминий 94 А·√с/мм².
 */
import { test } from '@playwright/test';
import {
  openCalc, knownDefect, describeCases, describeInputValidation, expectFormulaPanel
} from './helpers.mjs';

const BUTTON = 'btn-kz-calc';

test.describe('Термическая стойкость кабеля к КЗ', () => {
  describeCases({
    pageId: 'kzcable', button: BUTTON,
    cases: [
      // 5000·√0.1/143 = 11.06 мм² > 6 — не выдержит
      { name: 'медь, 5 кА, 0.1 с, 6 мм² — не выдержит', input: { 'kz-Ikz': 5000, 'kz-t': 0.1, 'kz-S': 6, 'kz-mat': 'Cu' },
        expected: { '#kz-result-val': 11.06, '#kz-status': 'недостаточно' } },
      // 10000·√0.2/94 = 47.58 мм² ≤ 50 — выдержит
      { name: 'алюминий, 10 кА, 0.2 с, 50 мм² — выдержит', input: { 'kz-Ikz': 10000, 'kz-t': 0.2, 'kz-S': 50, 'kz-mat': 'Al' },
        expected: { '#kz-result-val': 47.58, '#kz-status': 'выдержит' } },
      // 3000·1/143 = 20.98 мм² — секундный ток
      { name: 'медь, 3 кА, 1 с', input: { 'kz-Ikz': 3000, 'kz-t': 1, 'kz-S': 16, 'kz-mat': 'Cu' },
        expected: { '#kz-result-val': 20.98 } },
      // 1000·0.2/143 = 1.40 мм² ≤ 1.5
      { name: 'медь, 1 кА, 40 мс, 1.5 мм²', input: { 'kz-Ikz': 1000, 'kz-t': 0.04, 'kz-S': 1.5, 'kz-mat': 'Cu' },
        expected: { '#kz-result-val': 1.4, '#kz-status': 'выдержит' } },
    ],
  });

  test('формула адиабатического нагрева', async ({ page }) => {
    await openCalc(page, 'kzcable');
    await expectFormulaPanel(page, { formula: ['√t', '/ k'] });
  });

  test('коэффициенты k в ссылке совпадают с теми, что использует расчёт', async ({ page }) => {
    knownDefect('в ссылке «k(алюм)=95 — ПУЭ», а расчёт берёт 94 (IEC 60364-5-54 для XLPE); источник этих k — не ПУЭ');
    await openCalc(page, 'kzcable');
    await expectFormulaPanel(page, { ref: ['143', '94'] });
  });

  describeInputValidation({
    pageId: 'kzcable', button: BUTTON, result: '#kz-result-val',
    required: ['kz-Ikz', 'kz-t', 'kz-S'],
    nonNegative: ['kz-Ikz', 'kz-t', 'kz-S'],
    comma: { field: 'kz-t', text: '0,2', same: '0.2' },
    huge: ['kz-Ikz'],
  });
});
