/* Подбор соединительной гильзы — calcSleeve(), sleeveWireLayout(), sleeveCutScale()
 * из web/js/sleeve.js и ряд гильз из web/js/data/sleeve-data.js.
 *
 * Эталон заполнения: Σ(S / kгибкости) / (π·dвн²/4) · 100 %, пороги 60 / 90 / 100 %.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calcSleeve, sleeveWireLayout, sleeveCutScale } from '../../../web/js/sleeve.js';
import { SLEEVES, SLEEVE_FAMILIES, FLEX_FILL } from '../../../web/js/data/sleeve-data.js';
import { assertClose, knownDefect } from './assert-helpers.mjs';

const channel = d => Math.PI * d * d / 4;

describe('calcSleeve: подбор и заполнение', () => {
  // ΣS = 5 мм² → ГМЛ-6 (4…6), канал π·3.6²/4 = 10.18 мм², 49.1 % — свободно,
  // добивка 0.6·10.18 − 5 = 1.11 мм²
  test('2 × 2.5 мм² монолит → ГМЛ-6, свободно, нужна добивка', () => {
    const res = calcSleeve({ conductors: [{ S: 2.5, qty: 2 }], material: 'cu', flexClass: 1 });
    assert.equal(res.sleeve.id, 'ГМЛ-6');
    assertClose(res.fillPct, 5 / channel(3.6) * 100, { abs: 1e-9 });
    assert.equal(res.status, 'loose');
    assertClose(res.filler, 0.6 * channel(3.6) - 5, { abs: 1e-9 });
    assert.ok(res.warnings.includes('sleeve.warn_filler'));
  });
  // 16/0.7 = 22.86 мм² в канале π·5.5²/4 = 23.76 мм² → 96.2 % — плотно
  test('1 × 16 мм² класс 5 → ГМЛ-16, плотно', () => {
    const res = calcSleeve({ conductors: [{ S: 16, qty: 1 }], material: 'cu', flexClass: 5 });
    assert.equal(res.sleeve.id, 'ГМЛ-16');
    assertClose(res.fillPct, 96.2, { abs: 0.05 });
    assert.equal(res.status, 'tight');
  });
  // 20/0.65 = 30.77 в 38.48 → 80.0 % — норма
  test('2 × 10 мм² класс 6 → ГМЛ-25, норма', () => {
    const res = calcSleeve({ conductors: [{ S: 10, qty: 2 }], material: 'cu', flexClass: 6 });
    assert.equal(res.sleeve.id, 'ГМЛ-25');
    assertClose(res.fillPct, 80.0, { abs: 0.05 });
    assert.equal(res.status, 'ok');
  });
  test('значение на границе диапазонов попадает в меньшую гильзу', () => {
    assert.equal(calcSleeve({ conductors: [{ S: 2.5, qty: 1 }], flexClass: 1 }).sleeve.id, 'ГМЛ-2.5');
  });
  test('разные сечения в одной гильзе складываются', () => {
    const res = calcSleeve({ conductors: [{ S: 6, qty: 1 }, { S: 2.5, qty: 2 }], flexClass: 1 });
    assert.equal(res.sumS, 11);
    assert.equal(res.sleeve.id, 'ГМЛ-16');
  });
  test('медь с алюминием — только биметаллическая ГАМ', () => {
    assert.equal(calcSleeve({ conductors: [{ S: 16, qty: 1 }], material: 'cu-al' }).sleeve.family, 'ГАМ');
  });
  test('алюминий ниже ряда ГАО — наименьшая гильза и предупреждение', () => {
    const res = calcSleeve({ conductors: [{ S: 2.5, qty: 2 }], material: 'al' });
    assert.equal(res.sleeve.id, 'ГАО-16');
    assert.ok(res.warnings.includes('sleeve.warn_below_range'));
  });
  test('семейство с перегородкой выбирается явно', () => {
    assert.equal(calcSleeve({ conductors: [{ S: 4, qty: 1 }], family: 'ГМЛ-П' }).sleeve.id, 'ГМЛ-П-4');
  });
});

describe('calcSleeve: корректность ввода', () => {
  test('сумма выше ряда — отказ', () => {
    assert.equal(calcSleeve({ conductors: [{ S: 150, qty: 2 }] }).messageKey, 'sleeve.err_over_range');
  });
  test('пустой набор жил — отказ', () => {
    assert.equal(calcSleeve({ conductors: [] }).messageKey, 'sleeve.err_empty');
  });
  test('отрицательное сечение — отказ', () => {
    assert.equal(calcSleeve({ conductors: [{ S: -2.5, qty: 2 }] }).messageKey, 'sleeve.err_section');
  });
  test('отрицательное количество — отказ', () => {
    assert.equal(calcSleeve({ conductors: [{ S: 2.5, qty: -1 }] }).messageKey, 'sleeve.err_section');
  });
  test('неизвестное семейство — отказ', () => {
    assert.equal(calcSleeve({ conductors: [{ S: 2.5, qty: 1 }], family: 'XYZ' }).messageKey, 'sleeve.err_no_family');
  });
});

describe('ряд гильз: целостность данных', () => {
  for (const family of Object.keys(SLEEVE_FAMILIES)) {
    const range = SLEEVES.filter(s => s.family === family);
    test(`${family}: диапазоны смежные, без дыр и перекрытий`, () => {
      for (let i = 1; i < range.length; i++) assert.equal(range[i].sMin, range[i - 1].sMax, range[i].id);
    });
    test(`${family}: материал гильзы совпадает с материалом семейства`, () => {
      for (const s of range) assert.equal(s.material, SLEEVE_FAMILIES[family].material, s.id);
    });
  }
  test('внутренний диаметр меньше наружного, канал вмещает номинальное сечение', () => {
    for (const s of SLEEVES) {
      assert.ok(s.dIn < s.dOut, s.id);
      assert.ok(channel(s.dIn) >= s.sMax, `${s.id}: канал ${channel(s.dIn).toFixed(2)} < ${s.sMax}`);
    }
  });
  test('доля металла в жиле убывает с ростом класса гибкости', () => {
    const classes = Object.keys(FLEX_FILL).map(Number).sort((a, b) => a - b);
    for (let i = 1; i < classes.length; i++) assert.ok(FLEX_FILL[classes[i]] < FLEX_FILL[classes[i - 1]]);
  });
});

describe('раскладка жил в разрезе', () => {
  test('одна жила — в центре, диаметр по площади', () => {
    const [w] = sleeveWireLayout([{ S: 2.5, qty: 1 }], 1);
    assert.equal(w.x, 0);
    assertClose(w.d, 2 * Math.sqrt(2.5 / Math.PI), { abs: 1e-12 });
  });
  test('семь одинаковых жил: одна в центре, шесть вокруг — плотнейшая укладка', knownDefect(
    'вместимость кольца floor(π / asin(0.5)) = floor(5.999999999999999) = 5: шестая жила уходит во второе кольцо',
    () => {
      const wires = sleeveWireLayout([{ S: 1, qty: 7 }], 1);
      assert.equal(wires.length, 7);
      const d = wires[0].d;
      for (const w of wires.slice(1)) assertClose(Math.hypot(w.x, w.y), d, { abs: 1e-9 });
    }));
  test('все жилы попадают в раскладку', () => {
    assert.equal(sleeveWireLayout([{ S: 1, qty: 7 }, { S: 2.5, qty: 3 }], 1).length, 10);
  });
  test('нулевые и пустые строки пропускаются', () => {
    assert.deepEqual(sleeveWireLayout([{ S: 0, qty: 3 }, { S: NaN, qty: 1 }]), []);
  });
  test('масштаб не больше 1 и при переполнении не ужимает', () => {
    const wires = sleeveWireLayout([{ S: 10, qty: 3 }], 1);
    assert.ok(sleeveCutScale(wires, 1, 'ok') < 1);
    assert.equal(sleeveCutScale(wires, 1, 'over'), 1);
    assert.equal(sleeveCutScale(wires, 100, 'ok'), 1);
  });
});
