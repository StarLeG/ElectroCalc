/* Термопары — mvToC(), cToMv(), TC_COEFFS из web/js/industry.js.
 *
 * Эталон — таблицы NIST ITS-90 (NIST Monograph 175, ГОСТ Р 8.585-2001),
 * холодный спай 0 °C. Обратные полиномы NIST в своих поддиапазонах дают
 * погрешность: K ±0.05 °C, J ±0.05 °C, T ±0.04 °C, E ±0.02 °C.
 */
import { test, describe } from 'node:test';
import { mvToC, cToMv, TC_COEFFS } from '../../../web/js/industry.js';
import { assertClose, knownDefect } from './assert-helpers.mjs';

/** NIST ITS-90: температура, °C → термо-ЭДС, мВ. */
const NIST = {
  K: [[100, 4.096], [200, 8.138], [300, 12.209], [400, 16.397], [500, 20.644]],
  J: [[100, 5.269], [200, 10.779], [300, 16.327], [500, 27.393], [760, 42.919]],
  T: [[100, 4.279], [200, 9.288], [300, 14.862], [400, 20.872]],
  E: [[100, 6.319], [300, 21.036], [500, 37.005], [800, 61.017], [1000, 76.373]],
};

/**
 * Коэффициенты обратных полиномов T и E в коде не совпадают с NIST для
 * положительных температур. Эталонные наборы (NIST, 0…400 °C и 0…1000 °C):
 *   T: d1 = 25.928, d2 = −0.7602961, d3 = 0.04637791, d4 = −0.002165394, d5 = 6.048144e−5, d6 = −7.293422e−7;
 *   E: d1 = 17.057035, d2 = −0.23301759, d3 = 0.0065435585, d4 = −7.3562749e−5, d5 = −1.7896001e−6, …
 */
const WRONG = {
  T: 'TC_COEFFS.T — не обратный полином NIST 0…400 °C (d1, d2 взяты из поддиапазона −200…0 °C)',
  E: 'TC_COEFFS.E — не обратный полином NIST 0…1000 °C (поддиапазон −200…0 °C с искажёнными порядками)',
};

for (const [type, rows] of Object.entries(NIST)) {
  describe(`тип ${type}`, () => {
    const tc = TC_COEFFS[type];
    for (const [t, mv] of rows) {
      const toC = () => assertClose(mvToC(tc, mv), t, { abs: 0.1 }, `${mv} мВ`);
      const toMv = () => assertClose(cToMv(tc, t), mv, { abs: 0.005 }, `${t} °C`);
      // У типа E на верхней границе поиск корня упирается в mvMax и случайно
      // попадает в табличное значение, хотя полином неверен.
      const byAccident = type === 'E' && mv === tc.mvMax;
      if (byAccident) {
        test(`${t} °C → ${mv} мВ (совпадает только на границе mvMax)`, toMv);
      } else if (WRONG[type]) {
        test(`${mv} мВ → ${t} °C`, knownDefect(WRONG[type], toC));
        test(`${t} °C → ${mv} мВ`, knownDefect(WRONG[type], toMv));
      } else {
        test(`${mv} мВ → ${t} °C`, toC);
        test(`${t} °C → ${mv} мВ`, toMv);
      }
    }
    const roundTrip = () => {
      for (let t = tc.range[0] + 10; t <= tc.range[1]; t += 10) assertClose(mvToC(tc, cToMv(tc, t)), t, { abs: 1e-6 }, `${t} °C`);
    };
    if (type === 'E') {
      test('прямое и обратное преобразования согласованы', knownDefect(
        'неверный полином E немонотонен на 0…76.4 мВ, и поиск корня не находит, например, 530 °C (получается 521)', roundTrip));
    } else {
      test('прямое и обратное преобразования согласованы', roundTrip);
    }
    test('верхний предел по ЭДС совпадает с NIST для верхней температуры диапазона', () => {
      const top = rows.find(([t]) => t === tc.range[1]);
      if (top) assertClose(tc.mvMax, top[1], { abs: 0.001 });
    });
  });
}
