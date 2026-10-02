/* Калькулятор «R/C/L соединения, делитель, постоянные времени» — /rccalc/.
 *
 * Эталоны — законы Кирхгофа и элементарная теория цепей:
 *   последовательно R = ΣRi, параллельно 1/R = Σ1/Ri (для ёмкостей — наоборот);
 *   делитель Vout = Vin·R2'/(R1 + R2'), R2' = R2‖RL;
 *   τ = R·C (Ом·мкФ → мкс·10⁶), fср = 1/(2πτ); τ = L/R; f₀ = 1/(2π√(LC)).
 */
import { test, expect } from '@playwright/test';
import {
  openCalc, fillFields, calculate, expectResults, expectNoGarbage, knownDefect,
  describeCases, describeInputValidation, expectFormulaPanel
} from './helpers.mjs';

/**
 * Заполнить динамический список номиналов (R1, R2, …).
 * @param {import('@playwright/test').Page} page
 * @param {string} prefix префикс списка: rs, rp, cs, cp, ls, lp
 * @param {(number|string)[]} values номиналы
 */
async function fillList(page, prefix, values) {
  const items = page.locator(`#${prefix}-list .dynamic-val`);
  const add = page.locator(`button[onclick^="addDynItem('${prefix}'"]`);
  const remove = page.locator(`button[onclick^="removeDynItem('${prefix}'"]`);
  while ((await items.count()) < values.length) await add.click();
  while ((await items.count()) > Math.max(values.length, 2)) await remove.click();
  for (let i = 0; i < values.length; i++) await items.nth(i).fill(String(values[i]));
}

const LISTS = [
  { prefix: 'rs', sub: 'rser', button: 'btn-rs-calc', title: 'резисторы последовательно', cases: [
    { values: [1000, 2200], expected: 3200 }, { values: [1000, 2200, 4700], expected: 7900 }, { values: [0.5, 0.5], expected: 1 },
  ] },
  { prefix: 'rp', sub: 'rpar', button: 'btn-rp-calc', title: 'резисторы параллельно', cases: [
    { values: [1000, 2200], expected: 687.5 }, { values: [100, 100], expected: 50 },
    { values: [1000, 2200, 4700], expected: 599.77 }, { values: [10, 10, 10, 10], expected: 2.5 },
  ] },
  { prefix: 'cs', sub: 'cser', button: 'btn-cs-calc', title: 'конденсаторы последовательно', cases: [
    { values: [100, 220], expected: 68.75 }, { values: [10, 10], expected: 5 }, { values: [1, 1, 1], expected: 0.33 },
  ] },
  { prefix: 'cp', sub: 'cpar', button: 'btn-cp-calc', title: 'конденсаторы параллельно', cases: [
    { values: [100, 220], expected: 320 }, { values: [0.1, 0.22, 0.47], expected: 0.79 }, { values: [4.7, 4.7], expected: 9.4 },
  ] },
  { prefix: 'ls', sub: 'lser', button: 'btn-ls-calc', title: 'катушки последовательно', cases: [
    { values: [10, 22], expected: 32 }, { values: [1, 2, 3], expected: 6 },
  ] },
  { prefix: 'lp', sub: 'lpar', button: 'btn-lp-elec-calc', title: 'катушки параллельно', cases: [
    { values: [10, 22], expected: 6.875 }, { values: [1, 1, 1], expected: 0.333 },
  ] },
];

test.describe('R/C/L соединения', () => {
  for (const list of LISTS) {
    test.describe(list.title, () => {
      for (const c of list.cases) {
        test(`${c.values.join(' + ')} → ${c.expected}`, async ({ page }) => {
          await openCalc(page, 'rccalc', list.sub);
          await fillList(page, list.prefix, c.values);
          await calculate(page, list.button);
          await expectResults(page, { [`#${list.prefix}-result-val`]: c.expected });
          await expectNoGarbage(page);
        });
      }
    });
  }

  test.describe('корректность ввода списков', () => {
    test('один номинал — отказ «минимум 2»', async ({ page }) => {
      await openCalc(page, 'rccalc', 'rser');
      await fillList(page, 'rs', [1000, '']);
      await calculate(page, 'btn-rs-calc');
      await expect(page.locator('.toast.show')).toHaveCount(1);
    });

    test('нулевой резистор в параллели не отбрасывается молча', async ({ page }) => {
      // 0 Ом параллельно чему угодно — короткое замыкание, итог 0 Ом.
      knownDefect('getDynValues() отбрасывает значения ≤ 0 без сообщения: 1000 ‖ 0 ‖ 2200 считается как 1000 ‖ 2200 = 687.5 Ом');
      await openCalc(page, 'rccalc', 'rpar');
      await fillList(page, 'rp', [1000, 0, 2200]);
      await calculate(page, 'btn-rp-calc');
      const result = await page.locator('#rp-result-val').textContent();
      const warned = await page.locator('.toast.show').count();
      expect(result === '0' || warned > 0).toBe(true);
    });

    test('отрицательный номинал не отбрасывается молча', async ({ page }) => {
      knownDefect('отрицательный номинал молча выпадает из суммы: 1000 + (−500) + 2200 показывается как 3200 без предупреждения');
      await openCalc(page, 'rccalc', 'rser');
      await fillList(page, 'rs', [1000, -500, 2200]);
      await calculate(page, 'btn-rs-calc');
      await expect(page.locator('.toast.show')).toHaveCount(1);
    });
  });

  test.describe('делитель напряжения', () => {
    describeCases({
      pageId: 'rccalc', subTab: 'vdiv', button: 'btn-vd-calc',
      cases: [
        { name: '12 В, 10 к / 10 к без нагрузки', input: { 'vd-Vin': 12, 'vd-R1': 10000, 'vd-R2': 10000, 'vd-RL': 0 },
          expected: { '#vd-result-val': 6, '#vd-k': 0.5, '#vd-I': 0.6, '#vd-P': 3.6 } },
        // R2‖RL = 5 к → 12·5/15 = 4 В
        { name: 'нагрузка 10 к параллельно R2', input: { 'vd-Vin': 12, 'vd-R1': 10000, 'vd-R2': 10000, 'vd-RL': 10000 },
          expected: { '#vd-result-val': 4, '#vd-k': 0.333, '#vd-I': 0.8, '#vd-P': 3.2 } },
        { name: '5 В, 1 к / 2 к', input: { 'vd-Vin': 5, 'vd-R1': 1000, 'vd-R2': 2000, 'vd-RL': 0 },
          expected: { '#vd-result-val': 3.33, '#vd-I': 1.67 } },
        { name: '24 В, 4.7 к / 1 к', input: { 'vd-Vin': 24, 'vd-R1': 4700, 'vd-R2': 1000, 'vd-RL': 0 },
          expected: { '#vd-result-val': 4.21, '#vd-k': 0.175, '#vd-P': 17.73 } },
      ],
    });
    test('формула делителя и вариант с нагрузкой', async ({ page }) => {
      await openCalc(page, 'rccalc', 'vdiv');
      await expectFormulaPanel(page, { scope: '#sub-vdiv', formula: ['R2/(R1+R2)'], ref: ['R2‖RL'] });
    });
    describeInputValidation({
      pageId: 'rccalc', subTab: 'vdiv', button: 'btn-vd-calc', result: '#vd-result-val',
      required: ['vd-Vin', 'vd-R1', 'vd-R2'], positive: ['vd-R1', 'vd-R2'],
      comma: { field: 'vd-Vin', text: '3,3', same: '3.3' },
    });
  });

  test.describe('постоянная времени RC', () => {
    describeCases({
      pageId: 'rccalc', subTab: 'rc_tau', button: 'btn-rc-calc',
      cases: [
        // 10 кОм · 100 мкФ = 1 с; fср = 0.159 Гц
        { name: '10 кОм, 100 мкФ', input: { 'rc-R': 10000, 'rc-C': 100 }, expected: { '#rc-result-val': 1, '#rc-5tau': 5, '#rc-fc': 0.16 } },
        // 1 кОм · 1 мкФ = 1 мс; fср = 159.15 Гц
        { name: '1 кОм, 1 мкФ', input: { 'rc-R': 1000, 'rc-C': 1 }, expected: { '#rc-result-val': 0.001, '#rc-fc': 159.15 } },
        { name: '47 кОм, 10 мкФ', input: { 'rc-R': 47000, 'rc-C': 10 }, expected: { '#rc-result-val': 0.47, '#rc-5tau': 2.35, '#rc-fc': 0.34 } },
      ],
    });
    describeInputValidation({
      pageId: 'rccalc', subTab: 'rc_tau', button: 'btn-rc-calc', result: '#rc-result-val',
      required: ['rc-R', 'rc-C'], positive: ['rc-R', 'rc-C'],
    });
  });

  test.describe('постоянная времени RL', () => {
    describeCases({
      pageId: 'rccalc', subTab: 'rl_tau', button: 'btn-rl-tau-calc',
      cases: [
        { name: '100 Ом, 100 мГн → 1 мс', input: { 'rl-R': 100, 'rl-L': 100 }, expected: { '#rl-tau-result-val': 1, '#rl-5tau': 5 } },
        { name: '10 Ом, 50 мГн → 5 мс', input: { 'rl-R': 10, 'rl-L': 50 }, expected: { '#rl-tau-result-val': 5, '#rl-5tau': 25 } },
      ],
    });
    describeInputValidation({
      pageId: 'rccalc', subTab: 'rl_tau', button: 'btn-rl-tau-calc', result: '#rl-tau-result-val',
      required: ['rl-R', 'rl-L'], positive: ['rl-R', 'rl-L'],
    });
  });

  test.describe('резонанс LC', () => {
    describeCases({
      pageId: 'rccalc', subTab: 'lc_res', button: 'btn-lc-calc',
      cases: [
        // 1/(2π√(0.01·10⁻⁶)) = 1591.5 Гц; ω = 10000 рад/с; T = 0.628 мс
        { name: '10 мГн, 1 мкФ', input: { 'lc-L': 10, 'lc-C': 1 }, expected: { '#lc-result-val': 1592, '#lc-w': 10000, '#lc-T': 0.628 } },
        { name: '1 мГн, 0.1 мкФ', input: { 'lc-L': 1, 'lc-C': 0.1 }, expected: { '#lc-result-val': 15915, '#lc-w': 100000 } },
        { name: '100 мГн, 10 мкФ', input: { 'lc-L': 100, 'lc-C': 10 }, expected: { '#lc-result-val': 159, '#lc-T': 6.283 } },
      ],
    });
    describeInputValidation({
      pageId: 'rccalc', subTab: 'lc_res', button: 'btn-lc-calc', result: '#lc-result-val',
      required: ['lc-L', 'lc-C'], positive: ['lc-L', 'lc-C'],
      comma: { field: 'lc-C', text: '0,47', same: '0.47' },
    });
  });
});
