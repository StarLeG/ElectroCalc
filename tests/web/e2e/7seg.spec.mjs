/* Калькулятор «7-сегментный индикатор» — /7seg/.
 *
 * Резистор сегмента: R = (V − Vf) / I, мощность I²·R, общий ток N·I.
 * Декодер: таблица сегментов 7447/7448 (abcdefg, a — старший бит).
 *   «8» — все сегменты: 0b1111111 = 0x7F; «1» — b, c: 0b0110000 = 0x30;
 *   «0» — без g: 0x7E;  «A» — без d: 0x77.
 * У общего анода сегмент горит при низком уровне — код инвертируется (0x7F → 0x00).
 */
import { test, expect } from '@playwright/test';
import { openCalc, fillFields, calculate, expectRejected, describeCases, describeInputValidation } from './helpers.mjs';

test.describe('7-сегментный индикатор', () => {
  test.describe('резистор сегмента', () => {
    describeCases({
      pageId: '7seg', subTab: 'seg7res', button: 'btn-s7r-calc',
      cases: [
        // (5 − 2)/0.01 = 300 Ом; 30 мВт; 7·10 = 70 мА; 210 мВт
        { name: '5 В, Vf 2 В, 10 мА', input: { 's7r-V': 5, 's7r-Vf': 2, 's7r-I': 10, 's7r-N': 7, 's7r-type': 'cc' },
          expected: { '#s7r-result-val': 300, '#s7r-P1': 30, '#s7r-Itotal': 70, '#s7r-Ptotal': 210, '#s7r-typelbl': 'Общий катод' } },
        // (12 − 2)/0.02 = 500 Ом; 200 мВт
        { name: '12 В, 20 мА', input: { 's7r-V': 12, 's7r-Vf': 2, 's7r-I': 20, 's7r-N': 7, 's7r-type': 'ca' },
          expected: { '#s7r-result-val': 500, '#s7r-P1': 200, '#s7r-Itotal': 140, '#s7r-typelbl': 'Общий анод' } },
        // 3.3 В, 1.8 В, 5 мА, с точкой (8 сегментов): 300 Ом, 40 мА
        { name: '3.3 В, 5 мА, 8 сегментов с точкой', input: { 's7r-V': 3.3, 's7r-Vf': 1.8, 's7r-I': 5, 's7r-N': 8 },
          expected: { '#s7r-result-val': 300, '#s7r-Itotal': 40, '#s7r-Ptotal': 60 } },
      ],
    });
    test('питание ниже Vf — отказ', async ({ page }) => {
      await openCalc(page, '7seg', 'seg7res');
      await expectRejected(page, { button: 'btn-s7r-calc', result: '#s7r-result-val' }, () => fillFields(page, { 's7r-V': 1.5 }));
    });
    describeInputValidation({
      pageId: '7seg', subTab: 'seg7res', button: 'btn-s7r-calc', result: '#s7r-result-val',
      required: ['s7r-V', 's7r-Vf', 's7r-I'], positive: ['s7r-I'],
      comma: { field: 's7r-Vf', text: '1,8', same: '1.8' },
      knownDefects: {
        'zero:s7r-I': 'ток 0 проходит validate(): R = (V − Vf)/0 = Infinity Ом',
      },
    });
  });

  test.describe('декодер', () => {
    const CODES = [
      { ch: '8', type: 'cc', hex: '0x7F' }, { ch: '1', type: 'cc', hex: '0x30' },
      { ch: '0', type: 'cc', hex: '0x7E' }, { ch: 'A', type: 'cc', hex: '0x77' },
      { ch: 'f', type: 'cc', hex: '0x47' }, // строчная буква приводится к заглавной
      { ch: '8', type: 'ca', hex: '0x00' }, { ch: '1', type: 'ca', hex: '0x4F' },
    ];
    for (const c of CODES) {
      test(`«${c.ch}», ${c.type === 'ca' ? 'общий анод' : 'общий катод'} → ${c.hex}`, async ({ page }) => {
        await openCalc(page, '7seg', 'seg7dec');
        await fillFields(page, { 's7d-char': c.ch, 's7d-type': c.type });
        await calculate(page, 'btn-s7d-calc');
        await expect(page.locator('#s7d-hex')).toContainText(`HEX: ${c.hex}`);
      });
    }
    test('сегменты на экране согласованы с HEX у общего анода', async ({ page }) => {
      await openCalc(page, '7seg', 'seg7dec');
      await fillFields(page, { 's7d-char': '1', 's7d-type': 'ca' });
      await calculate(page, 'btn-s7d-calc');
      // «1» зажигает b и c; у общего анода это нули
      await expect(page.locator('#s7d-b')).toHaveText('0');
      await expect(page.locator('#s7d-a')).toHaveText('1');
    });
    test('недопустимый символ — отказ', async ({ page }) => {
      await openCalc(page, '7seg', 'seg7dec');
      await expectRejected(page, { button: 'btn-s7d-calc', result: '#s7d-hex' }, () => fillFields(page, { 's7d-char': 'Z' }));
    });
  });
});
