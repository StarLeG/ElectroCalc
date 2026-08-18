/* EngiCalc — построение XY-графиков в виде SVG-строки
 *
 * Модуль не знает ни про симуляцию схем, ни про светодиодные ленты: принимает
 * массив серий точек и возвращает разметку. Цвета берутся из CSS-переменных,
 * поэтому светлая и тёмная темы работают без участия вызывающего кода.
 *
 * Классы оформления (.tr-plot, .tr-svg, .tr-grid, .tr-tick, .tr-line) описаны
 * в css/pages.css и к режиму переходного процесса не привязаны.
 */
'use strict';

/** Палитра серий — имена CSS-переменных из tokens.css. */
export const SERIES_COLORS = ['--accent', '--accent-2', '--result', '--warn', '--error'];

/**
 * Округление шага шкалы к 1, 2, 5 × 10ⁿ.
 * @param {number} range охватываемый диапазон
 * @param {boolean} round округлять к ближайшему (true) или вверх (false)
 * @returns {number} «круглый» шаг
 */
export function niceNum(range, round) {
  if (!(range > 0)) return 1;
  const exp = Math.floor(Math.log10(range));
  const f = range / 10 ** exp;
  const nf = round
    ? (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10)
    : (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10);
  return nf * 10 ** exp;
}

/**
 * Границы и шаг шкалы, охватывающие [lo, hi] круглыми значениями.
 * @param {number} lo нижняя граница данных
 * @param {number} hi верхняя граница данных
 * @param {number} ticks желаемое число делений
 * @returns {{lo:number, hi:number, step:number}}
 */
export function niceScale(lo, hi, ticks) {
  const step = niceNum(niceNum(hi - lo, false) / Math.max(1, ticks - 1), true);
  return { lo: Math.floor(lo / step) * step, hi: Math.ceil(hi / step) * step, step };
}

/**
 * Значение CSS-переменной темы.
 * @param {string} name имя переменной, например '--accent'
 * @returns {string} цвет; при недоступном DOM — нейтральный серый
 */
export function themeColor(name) {
  if (typeof getComputedStyle !== 'function' || typeof document === 'undefined') return '#888';
  const value = getComputedStyle(document.documentElement).getPropertyValue(name);
  return value.trim() || '#888';
}

/** Экранирование текста, попадающего в SVG. */
function esc(text) {
  return String(text).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
}

/** Подпись деления: убирает хвостовые нули, но не превращает 0.05 в 0. */
function tickLabel(value, digits) {
  const fixed = value.toFixed(digits);
  return fixed.replace(/\.?0+$/, '') || '0';
}

/**
 * Число знаков после запятой, достаточное, чтобы соседние деления различались.
 * @param {number} step шаг шкалы
 * @returns {number} количество знаков, 0…4
 */
function digitsFor(step) {
  if (!(step > 0)) return 0;
  return Math.min(4, Math.max(0, Math.ceil(-Math.log10(step)) + 1));
}

/**
 * XY-график в виде SVG-строки.
 *
 * @param {object} opts
 * @param {Array<{label:string, color?:string, points:Array<[number,number]>}>} opts.series кривые
 * @param {string} [opts.title] заголовок над графиком
 * @param {string} [opts.xLabel] подпись оси X
 * @param {string} [opts.yLabel] подпись оси Y
 * @param {string} [opts.xUnit] единица оси X, дописывается к делениям
 * @param {string} [opts.yUnit] единица оси Y
 * @param {Array<{y:number, label?:string}>} [opts.refLines] горизонтальные линии-ориентиры
 * @param {Array<{x:number, label?:string}>} [opts.markers] вертикальные отметки
 * @param {number} [opts.width=600] ширина viewBox
 * @param {number} [opts.height=200] высота viewBox
 * @param {number} [opts.yMinForce] нижняя граница оси Y, если её надо зафиксировать
 * @returns {string} разметка <figure> с <svg> внутри; пустая строка, если рисовать нечего
 */
export function plotXY(opts) {
  const {
    series = [], title = '', xLabel = '', yLabel = '',
    xUnit = '', yUnit = '', refLines = [], markers = [],
    width: W = 600, height: H = 200, yMinForce
  } = opts;

  const usable = series.filter(s => Array.isArray(s.points) && s.points.length > 1);
  if (!usable.length) return '';

  const L = 62, R = 14, TOP = 14, B = 34;

  let xLo = Infinity, xHi = -Infinity, yLo = Infinity, yHi = -Infinity;
  for (const s of usable) {
    for (const [x, y] of s.points) {
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      if (x < xLo) xLo = x;
      if (x > xHi) xHi = x;
      if (y < yLo) yLo = y;
      if (y > yHi) yHi = y;
    }
  }
  for (const line of refLines) {
    if (!Number.isFinite(line.y)) continue;
    if (line.y < yLo) yLo = line.y;
    if (line.y > yHi) yHi = line.y;
  }
  if (!Number.isFinite(xLo) || !Number.isFinite(yLo)) return '';

  if (Number.isFinite(yMinForce) && yMinForce < yLo) yLo = yMinForce;
  // Вырожденный диапазон растянуть обязательно, иначе деление на ноль в py().
  if (yHi - yLo < 1e-12) yHi = yLo + Math.max(Math.abs(yLo) * 0.05, 1e-6);
  if (xHi - xLo < 1e-12) xHi = xLo + 1;

  const sy = niceScale(yLo, yHi, 5);
  const sx = niceScale(xLo, xHi, 6);

  const px = x => L + (x - sx.lo) / (sx.hi - sx.lo) * (W - L - R);
  const py = y => TOP + (1 - (y - sy.lo) / (sy.hi - sy.lo)) * (H - TOP - B);

  const yDigits = digitsFor(sy.step);
  const xDigits = digitsFor(sx.step);

  let axes = '';
  const stepsY = Math.round((sy.hi - sy.lo) / sy.step);
  for (let i = 0; i <= stepsY; i++) {
    const v = sy.lo + sy.step * i;
    const y = py(v);
    axes += `<line class="tr-grid" x1="${L}" y1="${y.toFixed(1)}" x2="${W - R}" y2="${y.toFixed(1)}"/>`
      + `<text class="tr-tick" x="${L - 6}" y="${(y + 3).toFixed(1)}" text-anchor="end">${esc(tickLabel(v, yDigits))}</text>`;
  }
  const stepsX = Math.round((sx.hi - sx.lo) / sx.step);
  for (let i = 0; i <= stepsX; i++) {
    const v = sx.lo + sx.step * i;
    const x = px(v);
    axes += `<line class="tr-grid" x1="${x.toFixed(1)}" y1="${TOP}" x2="${x.toFixed(1)}" y2="${H - B}"/>`
      + `<text class="tr-tick" x="${x.toFixed(1)}" y="${H - B + 14}" text-anchor="middle">${esc(tickLabel(v, xDigits))}</text>`;
  }

  if (yUnit) axes += `<text class="tr-tick" x="${L - 6}" y="${TOP - 4}" text-anchor="end">${esc(yUnit)}</text>`;
  if (xUnit) axes += `<text class="tr-tick" x="${W - R}" y="${H - B + 14}" text-anchor="end">${esc(xUnit)}</text>`;
  if (xLabel) axes += `<text class="tr-tick" x="${(L + W - R) / 2}" y="${H - 4}" text-anchor="middle">${esc(xLabel)}</text>`;
  if (yLabel) axes += `<text class="tr-tick" x="12" y="${(TOP + H - B) / 2}" text-anchor="middle" transform="rotate(-90 12 ${((TOP + H - B) / 2).toFixed(1)})">${esc(yLabel)}</text>`;

  const refs = refLines.map(line => {
    if (!Number.isFinite(line.y)) return '';
    const y = py(line.y);
    const label = line.label
      ? `<text class="tr-tick" x="${W - R - 4}" y="${(y - 4).toFixed(1)}" text-anchor="end">${esc(line.label)}</text>`
      : '';
    return `<line class="tr-ref" x1="${L}" y1="${y.toFixed(1)}" x2="${W - R}" y2="${y.toFixed(1)}"/>${label}`;
  }).join('');

  const marks = markers.map(m => {
    if (!Number.isFinite(m.x)) return '';
    const x = px(m.x);
    const label = m.label
      ? `<text class="tr-tick" x="${x.toFixed(1)}" y="${TOP + 10}" text-anchor="middle">${esc(m.label)}</text>`
      : '';
    return `<line class="tr-marker" x1="${x.toFixed(1)}" y1="${TOP}" x2="${x.toFixed(1)}" y2="${H - B}"/>${label}`;
  }).join('');

  const lines = usable.map((s, i) => {
    const color = s.color || themeColor(SERIES_COLORS[i % SERIES_COLORS.length]);
    const d = s.points
      .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y))
      .map(([x, y], k) => `${k ? 'L' : 'M'}${px(x).toFixed(1)} ${py(y).toFixed(1)}`)
      .join(' ');
    return `<path class="tr-line" d="${d}" stroke="${esc(color)}"/>`;
  }).join('');

  const caption = title ? `<figcaption>${esc(title)}</figcaption>` : '';
  return `<figure class="tr-plot">${caption}`
    + `<svg viewBox="0 0 ${W} ${H}" class="tr-svg" preserveAspectRatio="xMidYMid meet">${axes}${refs}${marks}${lines}</svg>`
    + `</figure>`;
}

/**
 * Легенда к набору серий.
 * @param {Array<{label:string, color?:string}>} series серии в том же порядке, что и в plotXY
 * @returns {string} разметка легенды
 */
export function plotLegend(series) {
  return series.map((s, i) => {
    const color = s.color || themeColor(SERIES_COLORS[i % SERIES_COLORS.length]);
    return `<span class="tr-sig on"><span class="tr-dot" style="background:${esc(color)}"></span>${esc(s.label)}</span>`;
  }).join('');
}
