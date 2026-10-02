/* Калькулятор «Защита»: автомат, УЗО, селективность — /protection/.
 *
 * Логика подробно проверена юнит-тестами (tests/web/unit/protection.test.mjs).
 * Эталоны:
 *   автомат — IB = P/(U·cos φ) (одна фаза), номинал In ≥ IB из ряда ГОСТ Р 50345,
 *     условие IB ≤ In ≤ Iz (ГОСТ Р 50571.4.43), отключение КЗ при Iкз ≥ 1.1·kmax·In,
 *     I2 = 1.45·In;
 *   УЗО — ПУЭ 7.1.83: утечка 0.4 мА/А · Iнагр + 0.01 мА/м · L, IΔn ≥ 3·IΔ;
 *     потолок 30 мА для групповых линий (ПУЭ 7.1.79), 10 мА для влажных помещений;
 *   селективность — IΔn(верх) ≥ 3·IΔn(низ) и исполнение S у вводного аппарата.
 */
import { test, expect } from '@playwright/test';
import { openCalc, expectRejected, fillFields, describeCases, expectFormulaPanel } from './helpers.mjs';

test.describe('Защита', () => {
  test.describe('автоматический выключатель', () => {
    describeCases({
      pageId: 'protection', subTab: 'prbreaker', button: 'btn-prb-calc',
      cases: [
        // 3500/(230·0.95) = 16.02 А → 20 А, C; I2 = 29 А
        { name: '3.5 кВт, 230 В, смешанная нагрузка', input: { 'prb-mode': 'power', 'prb-P': 3.5, 'prb-cos': 0.95, 'prb-phases': '1', 'prb-U': 230, 'prb-type': 'mixed', 'prb-curve': '' },
          expected: { '#prb-IB': 16.02, '#prb-result-val': 20, '#prb-curve-val': 'C', '#prb-I2': 29 } },
        // По току 10 А, активная нагрузка → B 10 А
        { name: 'ток 10 А, активная нагрузка — характеристика B', input: { 'prb-mode': 'current', 'prb-I': 10, 'prb-type': 'resistive', 'prb-curve': '' },
          expected: { '#prb-result-val': 10, '#prb-curve-val': 'B', '#prb-I2': 14.5 } },
        // 3 фазы: 11000/(√3·400·0.85) = 18.68 А → 20 А, D для двигателя
        { name: '3 фазы, 11 кВт, двигатель — D', input: { 'prb-mode': 'power', 'prb-P': 11, 'prb-cos': 0.85, 'prb-phases': '3', 'prb-U': 400, 'prb-type': 'motor', 'prb-curve': '' },
          expected: { '#prb-IB': 18.68, '#prb-result-val': 20, '#prb-curve-val': 'D' } },
        // Iкз 150 А < 1.1·10·20 = 220 А — защита не успеет; кабель 21 А ≥ 20 — проходит
        { name: 'слабый ток КЗ — предупреждение', input: { 'prb-mode': 'current', 'prb-I': 18, 'prb-type': 'mixed', 'prb-curve': 'C', 'prb-Iz': 21, 'prb-Ikz': 150 },
          expected: { '#prb-result-val': 20, '#prb-checks': '220' } },
      ],
    });
    test('номинал выше кабеля — предупреждение', async ({ page }) => {
      await openCalc(page, 'protection', 'prbreaker');
      await fillFields(page, { 'prb-mode': 'current', 'prb-I': 22, 'prb-Iz': 21 });
      await page.locator('#btn-prb-calc').click();
      await expect(page.locator('#prb-warnings .warn-item')).not.toHaveCount(0);
    });
    test('нулевая нагрузка — отказ', async ({ page }) => {
      await openCalc(page, 'protection', 'prbreaker');
      await expectRejected(page, { button: 'btn-prb-calc', result: '#prb-result-val' }, () => fillFields(page, { 'prb-mode': 'power', 'prb-P': 0 }));
    });
    test('формула и ссылки на ГОСТ', async ({ page }) => {
      await openCalc(page, 'protection', 'prbreaker');
      await expectFormulaPanel(page, { scope: '#sub-prbreaker', formula: ['IB ≤ In ≤ Iдоп'], ref: ['ГОСТ Р 50345', 'ГОСТ Р 50571.4.43'] });
    });
  });

  test.describe('УЗО', () => {
    describeCases({
      pageId: 'protection', subTab: 'prrcd', button: 'btn-prr-calc',
      cases: [
        // 0.4·16 + 0.01·50 = 6.9 мА; ×3 = 20.7 → 30 мА; тип A для электроники; IΔn 16 А → 16 А
        { name: 'розеточная группа 16 А, 50 м', input: { 'prr-I': 16, 'prr-L': 50, 'prr-purpose': 'group', 'prr-character': 'electronics', 'prr-breaker': 16 },
          expected: { '#prr-leak': 6.9, '#prr-required': 20.7, '#prr-result-val': 30, '#prr-type': 'A', '#prr-nominal': 16 } },
        // Ванная: потолок 10 мА, расчёт требует 20.7 — номинал 10, предупреждение о разделении
        { name: 'ванная — потолок 10 мА', input: { 'prr-I': 16, 'prr-L': 50, 'prr-purpose': 'wet', 'prr-character': 'resistive', 'prr-breaker': 16 },
          expected: { '#prr-result-val': 10, '#prr-limit': 10, '#prr-type': 'AC' } },
        // Ввод: 0.4·40 + 0.01·200 = 18 мА; ×3 = 54 → 100 мА
        { name: 'вводное противопожарное, 40 А, 200 м', input: { 'prr-I': 40, 'prr-L': 200, 'prr-purpose': 'main', 'prr-character': 'drive3ph', 'prr-breaker': 40 },
          expected: { '#prr-leak': 18, '#prr-required': 54, '#prr-result-val': 100, '#prr-type': 'B' } },
      ],
    });
    test('расчёт выше потолка — предупреждение о разделении линии', async ({ page }) => {
      await openCalc(page, 'protection', 'prrcd');
      await fillFields(page, { 'prr-I': 16, 'prr-L': 50, 'prr-purpose': 'wet' });
      await page.locator('#btn-prr-calc').click();
      await expect(page.locator('#prr-warnings .warn-item')).not.toHaveCount(0);
    });
    test('формула утечки по ПУЭ 7.1.83', async ({ page }) => {
      await openCalc(page, 'protection', 'prrcd');
      await expectFormulaPanel(page, { scope: '#sub-prrcd', formula: ['0,4 мА/А', '0,01 мА/м', '3 · IΔ'], ref: ['ПУЭ 7.1.83'] });
    });
  });

  test.describe('селективность', () => {
    describeCases({
      pageId: 'protection', subTab: 'prsel', button: 'btn-prs-calc',
      cases: [
        { name: '300 мА S над 30 мА — селективно', input: { 'prs-up': 300, 'prs-up-type': 'S', 'prs-down': 30 },
          expected: { '#prs-result-val': 'СЕЛЕКТИВНО', '#prs-ratio': 10 } },
        { name: '100 мА без задержки над 30 мА — нет', input: { 'prs-up': 100, 'prs-up-type': '', 'prs-down': 30 },
          expected: { '#prs-result-val': 'НЕ СЕЛЕКТИВНО', '#prs-ratio': 3.33 } },
        { name: '30 мА S над 30 мА — кратность 1', input: { 'prs-up': 30, 'prs-up-type': 'S', 'prs-down': 30 },
          expected: { '#prs-result-val': 'НЕ СЕЛЕКТИВНО', '#prs-ratio': 1 } },
      ],
    });
    test('нулевой номинал — отказ', async ({ page }) => {
      await openCalc(page, 'protection', 'prsel');
      await expectRejected(page, { button: 'btn-prs-calc', result: '#prs-ratio' }, () => fillFields(page, { 'prs-down': 0 }));
    });
  });
});
