/* Калькулятор «Пневматика» — /pneumatics/: расход, цилиндр, компрессор.
 *
 * Эталоны:
 *   расход: Qср = N·q·k, с утечками Qср·(1 + kут) — именно это записано в формуле страницы;
 *   цилиндр: F = p·A·η (1 бар = 10 Н/см², η = 0.95), обратный ход по кольцевой площади,
 *            скорость v = Q/A;
 *   компрессор: удельная мощность винтового компрессора на 7 бар по данным CAGI —
 *            5.5…7.5 кВт на 1 м³/мин производительности.
 */
import { test } from '@playwright/test';
import {
  openCalc, fillFields, calculate, readNumber, knownDefect, expectWithinPercent,
  describeCases, describeInputValidation, describePlaceholder, expectFormulaPanel
} from './helpers.mjs';

test.describe('Пневматика', () => {
  test.describe('расход воздуха', () => {
    describeCases({
      pageId: 'pneumatics', subTab: 'pflow', button: 'btn-pf-calc',
      cases: [
        { name: '5 потребителей по 100 л/мин, k 0.6, утечки 20 %', input: { 'pf-N': 5, 'pf-q': 100, 'pf-k': 0.6, 'pf-leak': 0.2 },
          expected: { '#pf-peak': 500, '#pf-leaks': 360 } },
        { name: '10 по 50 л/мин, k 0.8, без утечек', input: { 'pf-N': 10, 'pf-q': 50, 'pf-k': 0.8, 'pf-leak': 0 },
          expected: { '#pf-result-val': 400, '#pf-peak': 500, '#pf-leaks': 400 } },
      ],
    });
    test('главный результат совпадает с формулой страницы (с учётом утечек)', async ({ page }) => {
      knownDefect('формула «Q = Σ(q × k) × (1 + k_утечек)» = 360 л/мин, а крупно выводится Qср без утечек — 300 л/мин');
      await openCalc(page, 'pneumatics', 'pflow');
      await fillFields(page, { 'pf-N': 5, 'pf-q': 100, 'pf-k': 0.6, 'pf-leak': 0.2 });
      await calculate(page, 'btn-pf-calc');
      expectWithinPercent(await readNumber(page, '#pf-result-val'), 360, 0.5, 'расход');
    });
    describeInputValidation({
      pageId: 'pneumatics', subTab: 'pflow', button: 'btn-pf-calc', result: '#pf-peak',
      required: ['pf-N', 'pf-q', 'pf-k'], nonNegative: ['pf-N', 'pf-q', 'pf-k'],
      comma: { field: 'pf-k', text: '0,6', same: '0.6' },
    });
  });

  test.describe('цилиндр', () => {
    describeCases({
      pageId: 'pneumatics', subTab: 'pcyl', button: 'btn-pc-calc',
      cases: [
        // A = 19.635 см²; F = 6·19.635·10·0.95 = 1119 Н; обратный ход 940 Н; v = 1.70 м/с
        { name: 'Ø50/20, 6 бар, ход 200 мм, 200 л/мин', input: { 'pc-D': 50, 'pc-d': 20, 'pc-L': 200, 'pc-P': 6, 'pc-Q': 200 },
          expected: { '#pc-result-val': 1119, '#pc-Fback': 940, '#pc-speed': 1.7, '#pc-time': 0.12, '#pc-V': 0.39 } },
        { name: 'Ø32/12, 6 бар', input: { 'pc-D': 32, 'pc-d': 12, 'pc-L': 100, 'pc-P': 6, 'pc-Q': 50 },
          expected: { '#pc-result-val': 458, '#pc-Fback': 394, '#pc-speed': 1.04 } },
        { name: 'Ø100/25, 8 бар', input: { 'pc-D': 100, 'pc-d': 25, 'pc-L': 500, 'pc-P': 8, 'pc-Q': 1000 },
          expected: { '#pc-result-val': 5969, '#pc-Fback': 5596, '#pc-V': 3.93 } },
      ],
    });
    describePlaceholder({
      pageId: 'pneumatics', subTab: 'pcyl', button: 'btn-pc-calc', result: '#pc-result-val',
      defect: 'до расчёта показано 1178 Н (без КПД), расчёт по тем же данным с η = 0.95 даёт 1119 Н',
    });
    test('формула усилия с КПД', async ({ page }) => {
      await openCalc(page, 'pneumatics', 'pcyl');
      await expectFormulaPanel(page, { scope: '#sub-pcyl', formula: ['F = P × A × η'] });
    });
    describeInputValidation({
      pageId: 'pneumatics', subTab: 'pcyl', button: 'btn-pc-calc', result: '#pc-result-val',
      required: ['pc-D', 'pc-P'], nonNegative: ['pc-P'], positive: ['pc-D'],
      knownDefects: { 'zero:pc-D': 'диаметр 0 проходит validate(): скорость Q/0 = Infinity' },
    });
  });

  test.describe('компрессор', () => {
    describeCases({
      pageId: 'pneumatics', subTab: 'pcomp', button: 'btn-pcomp-calc',
      cases: [
        // 500 · 1.3 = 650 л/мин; ресивер 650·60/(7+1) = 4875 л
        { name: 'потребление 500 л/мин, запас 1.3, 7 бар', input: { 'pcomp-Q': 500, 'pcomp-P': 7, 'pcomp-k': 1.3, 'pcomp-t': 60 },
          expected: { '#pcomp-result-val': 650, '#pcomp-tank': 4875 } },
        { name: 'потребление 1000 л/мин, запас 1.2', input: { 'pcomp-Q': 1000, 'pcomp-P': 8, 'pcomp-k': 1.2, 'pcomp-t': 0 },
          expected: { '#pcomp-result-val': 1200, '#pcomp-tank': 0 } },
      ],
    });
    test('мощность компрессора соответствует удельной мощности 5.5…7.5 кВт/(м³/мин) при 7 бар', async ({ page }) => {
      // 0.65 м³/мин · 6.5 кВт/(м³/мин) ≈ 4.2 кВт; допуск ±20 % покрывает весь диапазон CAGI
      knownDefect('мощность считается как Q·P/(600·0.7) — гидравлическая формула; для 650 л/мин при 7 бар выходит 10.8 кВт, в 2.5 раза больше реальной');
      await openCalc(page, 'pneumatics', 'pcomp');
      await fillFields(page, { 'pcomp-Q': 500, 'pcomp-P': 7, 'pcomp-k': 1.3, 'pcomp-t': 60 });
      await calculate(page, 'btn-pcomp-calc');
      expectWithinPercent(await readNumber(page, '#pcomp-power'), 4.2, 20, 'мощность компрессора');
    });
    describeInputValidation({
      pageId: 'pneumatics', subTab: 'pcomp', button: 'btn-pcomp-calc', result: '#pcomp-result-val',
      required: ['pcomp-Q', 'pcomp-P', 'pcomp-k'], nonNegative: ['pcomp-Q', 'pcomp-P', 'pcomp-k'],
    });
  });
});
