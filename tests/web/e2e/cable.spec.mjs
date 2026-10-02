/* Калькулятор «Подбор сечения кабеля» — /cable/.
 *
 * Логика подбора подробно проверена юнит-тестами selectCable()
 * (tests/web/unit/cable-select.test.mjs). Здесь — что страница читает поля,
 * показывает тот же результат и правильно отказывает.
 *
 * Контрольный пример (ручной расчёт):
 *   15 кВт, 380 В, cos φ 0.9 → I = 15000/(√3·380·0.9) = 25.32 А;
 *   лоток 0.95 × три жилы 0.90 = 0.855; 2.5 мм²: 27·0.855 = 23.1 А < 25.32 — мало,
 *   4 мм²: 38·0.855 = 32.49 А — проходит; температура жилы 25 + 45·(25.32/32.49)² = 52.3 °C;
 *   R = 4.53·(1 + 0.00393·32.3) = 5.106 Ом/км;
 *   ΔU = √3·25.32·50·(5.106·0.9 + 0.07·0.436)/1000 = 10.14 В = 2.67 %; автомат 32 А.
 */
import { test, expect } from '@playwright/test';
import {
  openCalc, fillFields, expectRejected, describeCases, describeInputValidation, expectFormulaPanel
} from './helpers.mjs';

const BUTTON = 'btn-cable-calc';
const BASE = {
  'c-net': 'ac3', 'c-U': 380, 'c-mode': 'power', 'c-P': 15, 'c-cos': 0.9, 'c-eta': 1,
  'c-mat': 'Cu', 'c-cores': '3', 'c-ins': 'pvc', 'c-lay': 'tray', 'c-bundle': 1, 'c-temp': 25,
  'c-L': 50, 'c-drop': 3, 'c-par': 1, 'c-ikz': 0, 'c-t': 0, 'c-kstart': 0,
};

test.describe('Подбор сечения кабеля', () => {
  describeCases({
    pageId: 'cable', button: BUTTON,
    cases: [
      { name: 'контрольный пример: 15 кВт, 380 В, 50 м, лоток', input: BASE,
        expected: { '#cable-result-val': 4, '#cable-I': 25.32, '#cable-Iallow': 32.5, '#cable-dropPct': 2.67,
          '#cable-temp': 52.3, '#cable-breaker': 32, '#cable-k': 0.855 } },
      // Термическая стойкость: 5000·√0.2/115 = 19.4 мм² → 25 мм²
      { name: 'КЗ 5 кА за 0.2 с требует 25 мм²', input: { ...BASE, 'c-ikz': 5000, 'c-t': 0.2 },
        expected: { '#cable-result-val': 25, '#cable-limiting': 'Термостойкость к КЗ' } },
      // Однофазная: 3000/220/0.9 = 15.15 А
      { name: 'однофазная линия 3 кВт, 220 В', input: { ...BASE, 'c-net': 'ac1', 'c-U': 220, 'c-P': 3, 'c-L': 30, 'c-drop': 5 },
        expected: { '#cable-I': 15.15 } },
      // По току: 100 А, одна жила в воздухе — поправок нет; 16 мм² держит 95 А (мало), 25 мм² — 130 А
      { name: 'задан ток 100 А, одна жила, воздух', input: { ...BASE, 'c-mode': 'current', 'c-I': 100, 'c-cores': '1', 'c-lay': 'air', 'c-drop': 5, 'c-L': 20 },
        expected: { '#cable-I': 100, '#cable-result-val': 25, '#cable-breaker': 100 } },
    ],
  });

  test('ток за пределами ряда — прочерк и предупреждение', async ({ page }) => {
    await openCalc(page, 'cable');
    await fillFields(page, { ...BASE, 'c-mode': 'current', 'c-I': 900, 'c-drop': 10 });
    await page.locator(`#${BUTTON}`).click();
    await expect(page.locator('#cable-result-val')).toHaveText('—');
    await expect(page.locator('#cable-warnings .warn-item')).not.toHaveCount(0);
  });

  test('формула и ссылки на ПУЭ и ГОСТ', async ({ page }) => {
    await openCalc(page, 'cable');
    await expectFormulaPanel(page, { formula: ['S_нагрев', 'S_ΔU', 'S_КЗ'], ref: ['ПУЭ', 'ГОСТ Р 50571.5.54'] });
  });

  test('cos φ больше единицы отвергается', async ({ page }) => {
    await openCalc(page, 'cable');
    await expectRejected(page, { button: BUTTON, result: '#cable-result-val' }, () => fillFields(page, { 'c-cos': 1.3 }));
  });

  describeInputValidation({
    pageId: 'cable', button: BUTTON, result: '#cable-result-val',
    required: ['c-U', 'c-L', 'c-P', 'c-drop'],
    positive: ['c-U', 'c-L', 'c-P', 'c-drop'],
    comma: { field: 'c-P', text: '7,5', same: '7.5' },
    huge: ['c-L'],
    knownDefects: {
      'empty:c-drop': 'пустое поле допустимого падения молча заменяется на 5 % (numOr), пользователь об этом не узнаёт',
      'letters:c-drop': 'нечисловое значение допустимого падения молча заменяется на 5 % (numOr)',
    },
  });
});
