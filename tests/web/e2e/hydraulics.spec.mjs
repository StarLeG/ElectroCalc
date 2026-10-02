/* Калькулятор «Гидравлика» — /hydraulics/: цилиндр, насос, трубопровод.
 *
 * Эталоны:
 *   цилиндр: F = p·A·η (1 бар = 0.1 Н/мм²), v = Q/A, гидравлическая мощность N = p·Q/600 кВт
 *            (p в барах, Q в л/мин);
 *   насос: приводная мощность N = p·Q/(600·ηн·ηдв), рабочий объём V = Q/n при n = 1450 об/мин;
 *   трубопровод: Дарси — Вейсбах ΔP = λ·L/D·ρv²/2, ρ = 870 кг/м³,
 *            λ = 64/Re (ламинарный) или 0.3164/Re^0.25.
 */
import { test } from '@playwright/test';
import { openCalc, describeCases, describeInputValidation, describePlaceholder, expectFormulaPanel } from './helpers.mjs';

test.describe('Гидравлика', () => {
  test.describe('цилиндр', () => {
    describeCases({
      pageId: 'hydraulics', subTab: 'hcyl', button: 'btn-hc-calc',
      cases: [
        // A = 5026.5 мм²; F = 160·5026.5·0.95/10⁴ = 76.40 кН; v = 0.0995 м/с; N = 8 кВт
        { name: 'Ø80/40, 160 бар, 30 л/мин', input: { 'hc-D': 80, 'hc-d': 40, 'hc-L': 500, 'hc-P': 160, 'hc-Q': 30, 'hc-eta': 0.95 },
          expected: { '#hc-result-val': 76.4, '#hc-Fpull': 57.3, '#hc-speed': 0.1, '#hc-time': 5.03, '#hc-power': 8 } },
        { name: 'Ø50/28, 100 бар, 10 л/мин', input: { 'hc-D': 50, 'hc-d': 28, 'hc-L': 300, 'hc-P': 100, 'hc-Q': 10, 'hc-eta': 0.9 },
          expected: { '#hc-result-val': 17.7, '#hc-Fpull': 12.1, '#hc-power': 1.7 } },
        { name: 'Ø125/70, 200 бар, 100 л/мин', input: { 'hc-D': 125, 'hc-d': 70, 'hc-L': 1000, 'hc-P': 200, 'hc-Q': 100, 'hc-eta': 0.95 },
          expected: { '#hc-result-val': 233.2, '#hc-Fpull': 160.0, '#hc-time': 7.36, '#hc-power': 33.3 } },
      ],
    });
    describePlaceholder({ pageId: 'hydraulics', subTab: 'hcyl', button: 'btn-hc-calc', result: '#hc-result-val' });
    describeInputValidation({
      pageId: 'hydraulics', subTab: 'hcyl', button: 'btn-hc-calc', result: '#hc-result-val',
      required: ['hc-D', 'hc-P', 'hc-Q'], nonNegative: ['hc-P', 'hc-Q'], positive: ['hc-D'],
      knownDefects: { 'zero:hc-D': 'диаметр 0 проходит validate(): скорость Q/0 = Infinity м/с' },
    });
  });

  test.describe('насос', () => {
    describeCases({
      pageId: 'hydraulics', subTab: 'hpump', button: 'btn-hp-calc',
      cases: [
        // 160·30/(600·0.9·0.92) = 9.66 кВт; V = 30000/1450 = 20.7 см³
        { name: '30 л/мин, 160 бар', input: { 'hp-Q': 30, 'hp-P': 160, 'hp-eta': 0.9, 'hp-etaM': 0.92 },
          expected: { '#hp-result-val': 9.7, '#hp-V': 20.7, '#hp-type': 'Аксиально-поршневой' } },
        { name: '10 л/мин, 100 бар — шестерёнчатый', input: { 'hp-Q': 10, 'hp-P': 100, 'hp-eta': 0.85, 'hp-etaM': 0.9 },
          expected: { '#hp-result-val': 2.2, '#hp-V': 6.9, '#hp-type': 'Шестерёнчатый' } },
        { name: '100 л/мин, 250 бар', input: { 'hp-Q': 100, 'hp-P': 250, 'hp-eta': 0.9, 'hp-etaM': 0.95 },
          expected: { '#hp-result-val': 48.7, '#hp-V': 69.0 } },
      ],
    });
    describePlaceholder({ pageId: 'hydraulics', subTab: 'hpump', button: 'btn-hp-calc', result: '#hp-result-val' });
    test('формула мощности насоса', async ({ page }) => {
      await openCalc(page, 'hydraulics', 'hpump');
      await expectFormulaPanel(page, { scope: '#sub-hpump', formula: ['P × Q / (600'] });
    });
  });

  test.describe('трубопровод', () => {
    describeCases({
      pageId: 'hydraulics', subTab: 'hpipe', button: 'btn-hpp-calc',
      cases: [
        // v = 1.658 м/с, Re = 577 — ламинарный, λ = 0.111, ΔP = 0.83 бар
        { name: '10 м, Ø16, 20 л/мин, ν = 46 сСт', input: { 'hpp-L': 10, 'hpp-D': 16, 'hpp-Q': 20, 'hpp-nu': 46 },
          expected: { '#hpp-v': 1.66, '#hpp-Re': 577, '#hpp-mode': 'Ламинарный', '#hpp-lam': 0.111, '#hpp-result-val': 0.829 } },
        { name: '5 м, Ø10, 30 л/мин, ν = 32 сСт', input: { 'hpp-L': 5, 'hpp-D': 10, 'hpp-Q': 30, 'hpp-nu': 32 },
          expected: { '#hpp-v': 6.37, '#hpp-Re': 1989, '#hpp-result-val': 2.836 } },
        { name: '20 м, Ø25, 100 л/мин', input: { 'hpp-L': 20, 'hpp-D': 25, 'hpp-Q': 100, 'hpp-nu': 46 },
          expected: { '#hpp-v': 3.4, '#hpp-Re': 1845, '#hpp-result-val': 1.391 } },
      ],
    });
    describePlaceholder({
      pageId: 'hydraulics', subTab: 'hpipe', button: 'btn-hpp-calc', result: '#hpp-result-val',
      defect: 'до расчёта показано 2.8 бар, расчёт по тем же данным (10 м, Ø16, 20 л/мин, 46 сСт) даёт 0.8 бар',
    });
    test('формула Дарси — Вейсбаха и число Рейнольдса', async ({ page }) => {
      await openCalc(page, 'hydraulics', 'hpipe');
      await expectFormulaPanel(page, { scope: '#sub-hpipe', formula: ['λ × L × ρ × v²', 'Re = v×D/ν'] });
    });
    describeInputValidation({
      pageId: 'hydraulics', subTab: 'hpipe', button: 'btn-hpp-calc', result: '#hpp-result-val',
      required: ['hpp-L', 'hpp-D', 'hpp-Q'], nonNegative: ['hpp-L'], positive: ['hpp-D', 'hpp-Q'],
      knownDefects: {
        'zero:hpp-D': 'диаметр 0 проходит validate(): скорость Q/0, на экране Infinity/NaN',
        'zero:hpp-Q': 'расход 0 проходит validate(): Re = 0, λ = 64/0, ΔP = NaN',
      },
    });
  });
});
