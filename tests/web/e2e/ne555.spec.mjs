/* Калькулятор «NE555» — /ne555/.
 *
 * Эталон — справочные формулы из datasheet NE555 (Texas Instruments, SLFS022):
 *   астабильный: f = 1.44 / ((R1 + 2R2)·C), tH = 0.693·(R1 + R2)·C, tL = 0.693·R2·C,
 *                скважность D = (R1 + R2)/(R1 + 2R2);
 *   одновибратор: t = 1.1·R·C.
 */
import { test } from '@playwright/test';
import {
  openCalc, describeCases, describeInputValidation, describePlaceholder, expectFormulaPanel
} from './helpers.mjs';

test.describe('NE555', () => {
  test.describe('астабильный режим', () => {
    describeCases({
      pageId: 'ne555', subTab: 'astable', button: 'btn-ast-calc',
      cases: [
        // R1 = 1 к, R2 = 10 к, C = 0.1 мкФ: f = 1.44/(21000·10⁻⁷) = 685.7 Гц, D = 52.4 %
        { name: '1 к / 10 к / 0.1 мкФ', input: { 'ast-R1': 1000, 'ast-R2': 10000, 'ast-C': 0.1 },
          expected: { '#ast-result-val': 686, '#ast-duty': 52.4, '#ast-ton': 0.76, '#ast-toff': 0.69, '#ast-ok': 'Норма' } },
        // 10 к / 10 к / 1 мкФ: f = 48 Гц, T = 20.83 мс, D = 66.7 %
        { name: '10 к / 10 к / 1 мкФ', input: { 'ast-R1': 10000, 'ast-R2': 10000, 'ast-C': 1 },
          expected: { '#ast-result-val': 48, '#ast-period': 20.83, '#ast-duty': 66.7, '#ast-ton': 13.86, '#ast-toff': 6.93 } },
        // 4.7 к / 47 к / 10 нФ: f = 1459 Гц
        { name: '4.7 к / 47 к / 10 нФ', input: { 'ast-R1': 4700, 'ast-R2': 47000, 'ast-C': 0.01 },
          expected: { '#ast-result-val': 1459, '#ast-duty': 52.4 } },
        // R1 < 1 кОм — предупреждение о токе разряда
        { name: 'R1 = 470 Ом — предупреждение', input: { 'ast-R1': 470, 'ast-R2': 10000, 'ast-C': 0.1 },
          expected: { '#ast-ok': 'R1 < 1кОм' } },
      ],
    });
    test('формула частоты и скважности', async ({ page }) => {
      await openCalc(page, 'ne555', 'astable');
      await expectFormulaPanel(page, { scope: '#sub-astable', formula: ['1.44/((R1+2R2)·C)', '(R1+R2)/(R1+2R2)'] });
    });
    describePlaceholder({
      pageId: 'ne555', subTab: 'astable', button: 'btn-ast-calc', result: '#ast-result-val',
      defect: 'до расчёта показано 727 Гц, расчёт по тем же данным (1 к, 10 к, 0.1 мкФ) даёт 686 Гц',
    });
    describeInputValidation({
      pageId: 'ne555', subTab: 'astable', button: 'btn-ast-calc', result: '#ast-result-val',
      required: ['ast-R1', 'ast-R2', 'ast-C'],
      nonNegative: ['ast-R1'],
      positive: ['ast-R2', 'ast-C'],
      comma: { field: 'ast-C', text: '0,22', same: '0.22' },
      knownDefects: {
        'zero:ast-R2': 'при R1 = 1 к и R2 = 0 расчёт идёт дальше: 555 без R2 не генерирует, предупреждения нет',
        'zero:ast-C': 'ёмкость 0 проходит validate(): f = 1.44/0 = Infinity Гц',
      },
    });
  });

  test.describe('одновибратор', () => {
    describeCases({
      pageId: 'ne555', subTab: 'mono555', button: 'btn-mono-calc',
      cases: [
        { name: '10 кОм, 1 мкФ → 11 мс', input: { 'mono-R': 10, 'mono-C': 1 }, expected: { '#mono-result-val': 11 } },
        { name: '100 кОм, 10 мкФ → 1.1 с', input: { 'mono-R': 100, 'mono-C': 10 }, expected: { '#mono-result-val': 1100 } },
        { name: '1 кОм, 0.1 мкФ → 0.11 мс', input: { 'mono-R': 1, 'mono-C': 0.1 }, expected: { '#mono-result-val': 0.11 } },
      ],
    });
    describePlaceholder({ pageId: 'ne555', subTab: 'mono555', button: 'btn-mono-calc', result: '#mono-result-val' });
    describeInputValidation({
      pageId: 'ne555', subTab: 'mono555', button: 'btn-mono-calc', result: '#mono-result-val',
      required: ['mono-R', 'mono-C'], nonNegative: ['mono-R', 'mono-C'],
    });
  });
});
