/*
 * gost-schematic.js — генерация принципиальных электрических схем (Э3) в SVG
 * по УГО ГОСТ ЕСКД. Без зависимостей. Работает в Node и в браузере.
 *
 * Система координат: 1 единица SVG = 1 мм. Шаг сетки по умолчанию 5 мм.
 * Ось Y направлена вниз (как принято в SVG). Ширина линий = ГОСТ b (по умолч. 0.4 мм).
 *
 * Модель сборки:
 *   const s = new Schematic({ width: 200, height: 120 });
 *   s.resistor('R1', 40, 30, { value: '10к' });          // центр УГО в (40,30)
 *   s.capacitor('C1', 80, 30, { value: '100н', rotate: 90 });
 *   s.wire([ s.pin('R1','b'), s.pin('C1','a') ]);          // соединить выводы
 *   s.junction(80, 30);
 *   const svg = s.toSVG();
 *
 * Каждый компонент регистрирует именованные выводы (pins) в АБСОЛЮТНЫХ координатах,
 * поэтому провода можно тянуть по именам: s.pin('R1','a') -> [x, y].
 * Двухвыводные элементы: 'a' (слева при rotate 0) и 'b' (справа). Поворот — кратно 90°.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.GostSchematic = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---- геометрия ------------------------------------------------------------
  function rad(d) { return (d * Math.PI) / 180; }
  // локальные координаты -> мировые (поворот вокруг центра компонента, затем сдвиг)
  function place(px, py, cx, cy, deg) {
    const c = Math.cos(rad(deg)), s = Math.sin(rad(deg));
    return [cx + px * c - py * s, cy + px * s + py * c];
  }
  function fmt(n) { return Math.abs(n) < 1e-9 ? 0 : +n.toFixed(3); }
  function esc(t) {
    return String(t).replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
  }

  class Schematic {
    constructor(opts = {}) {
      this.o = Object.assign({
        width: 210, height: 148,        // рабочее поле, мм
        grid: 5,                        // шаг координатной сетки, мм
        b: 0.4,                         // толщина линии b (ГОСТ 2.303), мм
        fontSize: 3.5,                  // высота шрифта (ГОСТ 2.304), мм
        fontFamily: "'GOST type A', 'GOST type B', 'PT Mono', monospace",
        showGrid: false,                // подложка-сетка (для отладки)
        pad: 6,                         // поля вокруг рабочего поля
        background: '#ffffff',
        stroke: '#000000'
      }, opts);
      this.parts = [];   // svg-фрагменты УГО
      this.wires = [];   // svg-фрагменты проводов
      this.labels = [];  // svg-фрагменты подписей
      this.dots = [];    // точки соединения
      this.pins = {};    // 'REF.pin' -> [x,y]
    }

    // --- низкоуровневые примитивы -------------------------------------------
    _reg(ref, name, x, y) { this.pins[ref + '.' + name] = [fmt(x), fmt(y)]; }
    pin(ref, name) {
      const p = this.pins[ref + '.' + name];
      if (!p) throw new Error('нет вывода ' + ref + '.' + name);
      return p.slice();
    }
    get w() { return this.o.b; }

    // добавить произвольный <g> УГО из локальных путей d[] (в мм, центр в 0,0)
    _add(svg) { this.parts.push(svg); return this; }

    // обёртка компонента: рисуем в локальных координатах, поворачиваем и сдвигаем
    _wrap(cx, cy, deg, inner) {
      return `<g transform="translate(${fmt(cx)},${fmt(cy)}) rotate(${deg})" ` +
             `fill="none" stroke="${this.o.stroke}" stroke-width="${this.w}" ` +
             `stroke-linecap="round" stroke-linejoin="round">${inner}</g>`;
    }

    // подпись позиционного обозначения и номинала. Текст всегда горизонтальный.
    // Для горизонтальной ориентации (0/180): обозначение сверху, номинал снизу.
    // Для вертикальной (90/270): оба справа, столбиком, чтобы не наезжать на УГО.
    _labels(ref, cx, cy, deg, opts, above, below) {
      const fs = this.o.fontSize;
      const vertical = (((deg % 360) + 360) % 360) % 180 !== 0;
      if (vertical) {
        const off = Math.max(Math.abs(above), Math.abs(below)) + 1.5;
        if (opts.showRef !== false && ref)
          this.labels.push(this._text(cx + off, cy - 1, ref, 'start'));
        if (opts.value)
          this.labels.push(this._text(cx + off, cy + fs, opts.value, 'start'));
      } else {
        if (opts.showRef !== false && ref)
          this.labels.push(this._text(cx, cy + above - 0.8, ref, 'middle'));
        if (opts.value)
          this.labels.push(this._text(cx, cy + below + fs, opts.value, 'middle'));
      }
    }
    _text(x, y, t, anchor = 'start') {
      return `<text x="${fmt(x)}" y="${fmt(y)}" font-family="${this.o.fontFamily}" ` +
             `font-size="${this.o.fontSize}" fill="${this.o.stroke}" ` +
             `text-anchor="${anchor}">${esc(t)}</text>`;
    }
    /** свободная надпись */
    text(x, y, t, anchor = 'start') { this.labels.push(this._text(x, y, t, anchor)); return this; }

    // ======================================================================
    //  РЕЗИСТОРЫ, КОНДЕНСАТОРЫ  (ГОСТ 2.728-74)
    // ======================================================================
    /** Резистор постоянный: прямоугольник 10×4 мм, выводы по оси. pitch 20. */
    resistor(ref, cx, cy, opts = {}) {
      const deg = opts.rotate || 0, L = opts.pitch || 20, bw = 10, bh = 4;
      const inner =
        `<path d="M ${-L/2} 0 H ${-bw/2} M ${bw/2} 0 H ${L/2}"/>` +
        `<rect x="${-bw/2}" y="${-bh/2}" width="${bw}" height="${bh}"/>`;
      this._add(this._wrap(cx, cy, deg, inner));
      this._reg(ref, 'a', ...place(-L/2, 0, cx, cy, deg));
      this._reg(ref, 'b', ...place(L/2, 0, cx, cy, deg));
      this._labels(ref, cx, cy, deg, opts, -bh/2 - 1.5, bh/2);
      return this;
    }
    /** Резистор переменный (потенциометр): резистор + стрелка регулирования. */
    resistorVar(ref, cx, cy, opts = {}) {
      const deg = opts.rotate || 0, L = opts.pitch || 20, bw = 10, bh = 4;
      const inner =
        `<path d="M ${-L/2} 0 H ${-bw/2} M ${bw/2} 0 H ${L/2}"/>` +
        `<rect x="${-bw/2}" y="${-bh/2}" width="${bw}" height="${bh}"/>` +
        `<path d="M 0 6 V ${bh/2 + 0.5}"/>` +               // шток
        `<path d="M -2 ${bh/2 + 2.5} L 0 ${bh/2 + 0.3} L 2 ${bh/2 + 2.5}"/>`; // стрелка
      this._add(this._wrap(cx, cy, deg, inner));
      this._reg(ref, 'a', ...place(-L/2, 0, cx, cy, deg));
      this._reg(ref, 'b', ...place(L/2, 0, cx, cy, deg));
      this._reg(ref, 'w', ...place(0, 6, cx, cy, deg));      // движок
      this._labels(ref, cx, cy, deg, opts, -bh/2 - 1.5, bh/2 + 4);
      return this;
    }
    /** Конденсатор постоянной ёмкости: две пластины, зазор 2 мм, высота 8 мм. */
    capacitor(ref, cx, cy, opts = {}) {
      const deg = opts.rotate || 0, L = opts.pitch || 20, g = 1, ph = 8;
      const inner =
        `<path d="M ${-L/2} 0 H ${-g}"/>` +
        `<path d="M ${-g} ${-ph/2} V ${ph/2}"/>` +
        `<path d="M ${g} ${-ph/2} V ${ph/2}"/>` +
        `<path d="M ${g} 0 H ${L/2}"/>`;
      this._add(this._wrap(cx, cy, deg, inner));
      this._reg(ref, 'a', ...place(-L/2, 0, cx, cy, deg));
      this._reg(ref, 'b', ...place(L/2, 0, cx, cy, deg));
      this._labels(ref, cx, cy, deg, opts, -ph/2 - 1, ph/2);
      return this;
    }
    /** Конденсатор электролитический (полярный): одна пластина дугой, знак «+». */
    capacitorPol(ref, cx, cy, opts = {}) {
      const deg = opts.rotate || 0, L = opts.pitch || 20, g = 1.2, ph = 8;
      const inner =
        `<path d="M ${-L/2} 0 H ${-g}"/>` +
        `<path d="M ${-g} ${-ph/2} V ${ph/2}"/>` +                     // «+» пластина (прямая)
        `<path d="M ${g} ${-ph/2} A 6 6 0 0 1 ${g} ${ph/2}"/>` +      // «−» пластина (дуга)
        `<path d="M ${g + 2} 0 H ${L/2}"/>` +
        `<path d="M ${-g - 3} ${-ph/2 + 1.5} h 2 M ${-g - 2} ${-ph/2 + 0.5} v 2"/>`; // «+»
      this._add(this._wrap(cx, cy, deg, inner));
      this._reg(ref, 'a', ...place(-L/2, 0, cx, cy, deg));     // «+»
      this._reg(ref, 'b', ...place(L/2, 0, cx, cy, deg));      // «−»
      this._labels(ref, cx, cy, deg, opts, -ph/2 - 1, ph/2);
      return this;
    }

    // ======================================================================
    //  КАТУШКИ, ДРОССЕЛИ, ТРАНСФОРМАТОРЫ  (ГОСТ 2.723-68)
    // ======================================================================
    /** Катушка индуктивности: 4 полуокружности (дуги) диаметром 4 мм.
     *  Шаг выводов по умолчанию 20 мм — как у резистора, чтобы выводы ложились
     *  на сетку 5 мм (прежний расчёт span+6 давал ±11 мм, мимо узлов). */
    inductor(ref, cx, cy, opts = {}) {
      const deg = opts.rotate || 0, n = opts.humps || 4, r = 2;
      const span = n * 2 * r;
      const lead = ((opts.pitch || 20) - span) / 2;
      let d = `M ${-span/2 - lead} 0 H ${-span/2}`, x = -span/2;
      for (let i = 0; i < n; i++) { d += ` A ${r} ${r} 0 0 1 ${x + 2*r} 0`; x += 2*r; }
      d += ` H ${span/2 + lead}`;
      const inner = `<path d="${d}"/>`;
      this._add(this._wrap(cx, cy, deg, inner));
      this._reg(ref, 'a', ...place(-span/2 - lead, 0, cx, cy, deg));
      this._reg(ref, 'b', ...place(span/2 + lead, 0, cx, cy, deg));
      this._labels(ref, cx, cy, deg, opts, -r - 1, 1.5);
      return this;
    }

    // ======================================================================
    //  ПОЛУПРОВОДНИКОВЫЕ ПРИБОРЫ  (ГОСТ 2.730-73)
    // ======================================================================
    /** Диод: равнобедренный треугольник (сторона ~7) + катодная черта. a=анод, b=катод. */
    diode(ref, cx, cy, opts = {}) {
      const deg = opts.rotate || 0, L = opts.pitch || 20, t = 3.5, bar = 4;
      const inner =
        `<path d="M ${-L/2} 0 H ${-t}"/>` +
        `<path d="M ${-t} ${-t} L ${t} 0 L ${-t} ${t} Z" fill="${this.o.stroke}"/>` +
        `<path d="M ${t} ${-bar/2} V ${bar/2}"/>` +
        `<path d="M ${t} 0 H ${L/2}"/>`;
      this._add(this._wrap(cx, cy, deg, inner));
      this._reg(ref, 'a', ...place(-L/2, 0, cx, cy, deg));
      this._reg(ref, 'b', ...place(L/2, 0, cx, cy, deg));
      this._labels(ref, cx, cy, deg, opts, -bar/2 - 1, bar/2 + 0.5);
      return this;
    }
    /** Светодиод: диод + две стрелки излучения. */
    led(ref, cx, cy, opts = {}) {
      const deg = opts.rotate || 0, L = opts.pitch || 20, t = 3.5, bar = 4;
      const arrow = (ox) =>
        `<path d="M ${ox} ${-6} L ${ox + 3} ${-9}"/>` +
        `<path d="M ${ox + 3} ${-9} l -2 0.4 M ${ox + 3} ${-9} l -0.4 2"/>`;
      const inner =
        `<path d="M ${-L/2} 0 H ${-t}"/>` +
        `<path d="M ${-t} ${-t} L ${t} 0 L ${-t} ${t} Z" fill="${this.o.stroke}"/>` +
        `<path d="M ${t} ${-bar/2} V ${bar/2}"/>` +
        `<path d="M ${t} 0 H ${L/2}"/>` + arrow(-1.5) + arrow(1.5);
      this._add(this._wrap(cx, cy, deg, inner));
      this._reg(ref, 'a', ...place(-L/2, 0, cx, cy, deg));
      this._reg(ref, 'b', ...place(L/2, 0, cx, cy, deg));
      this._labels(ref, cx, cy, deg, opts, -9 - 1, bar/2 + 0.5);
      return this;
    }
    /** Стабилитрон: диод с изломом катодной черты. */
    zener(ref, cx, cy, opts = {}) {
      const deg = opts.rotate || 0, L = opts.pitch || 20, t = 3.5, bar = 4;
      const inner =
        `<path d="M ${-L/2} 0 H ${-t}"/>` +
        `<path d="M ${-t} ${-t} L ${t} 0 L ${-t} ${t} Z" fill="${this.o.stroke}"/>` +
        `<path d="M ${t - 1.5} ${-bar/2 - 1.5} l 1.5 1.5 V ${bar/2} l 1.5 1.5"/>` +
        `<path d="M ${t} 0 H ${L/2}"/>`;
      this._add(this._wrap(cx, cy, deg, inner));
      this._reg(ref, 'a', ...place(-L/2, 0, cx, cy, deg));
      this._reg(ref, 'b', ...place(L/2, 0, cx, cy, deg));
      this._labels(ref, cx, cy, deg, opts, -bar/2 - 2.5, bar/2 + 0.5);
      return this;
    }
    /** Оптопара транзисторная (ГОСТ 2.730): светодиод и фототранзистор в общем
     *  корпусе, между ними — стрелки оптической связи.
     *  Выводы: a, k (светодиод, слева), c, e (фототранзистор, справа). */
    optocoupler(ref, cx, cy, opts = {}) {
      const deg = opts.rotate || 0, W = 30, H = 20, lead = 5;
      const arrow = (y) =>
        `<path d="M -3 ${y} H 2"/>` +
        `<path d="M 2 ${y} l -1.3 -0.9 M 2 ${y} l -1.3 0.9"/>`;
      const inner =
        `<rect x="${-W/2}" y="${-H/2}" width="${W}" height="${H}"/>` +
        // светодиод: анод сверху, катод снизу
        `<path d="M ${-W/2 - lead} -5 H -9 V -3"/>` +
        `<path d="M -12 -3 L -6 -3 L -9 3 Z" fill="${this.o.stroke}"/>` +
        `<path d="M -12 3 H -6"/>` +
        `<path d="M -9 3 V 5 H ${-W/2 - lead}"/>` +
        // фототранзистор: черта базы, коллектор сверху, эмиттер снизу
        `<path d="M 6 -4 V 4"/>` +
        `<path d="M 6 -2 L 10 -5 H ${W/2 + lead}"/>` +
        `<path d="M 6 2 L 10 5 H ${W/2 + lead}"/>` +
        `<path d="M 9.2 4.4 L 7.2 3.9 L 8.1 2.6 Z" fill="${this.o.stroke}"/>` +
        arrow(-2) + arrow(2);
      this._add(this._wrap(cx, cy, deg, inner));
      this._reg(ref, 'a', ...place(-W/2 - lead, -5, cx, cy, deg));
      this._reg(ref, 'k', ...place(-W/2 - lead, 5, cx, cy, deg));
      this._reg(ref, 'c', ...place(W/2 + lead, -5, cx, cy, deg));
      this._reg(ref, 'e', ...place(W/2 + lead, 5, cx, cy, deg));
      this._labels(ref, cx, cy, deg, opts, -H/2 - 1, H/2);
      return this;
    }

    /** Тиристор триодный (ГОСТ 2.730-73): диод с управляющим электродом.
     *  Выводы: a (анод), k (катод), g (управляющий, снизу справа). */
    thyristor(ref, cx, cy, opts = {}) {
      const deg = opts.rotate || 0, L = opts.pitch || 20, t = 3.5, bar = 4;
      const inner =
        `<path d="M ${-L/2} 0 H ${-t}"/>` +
        `<path d="M ${-t} ${-t} L ${t} 0 L ${-t} ${t} Z" fill="${this.o.stroke}"/>` +
        `<path d="M ${t} ${-bar/2} V ${bar/2}"/>` +
        `<path d="M ${t} 0 H ${L/2}"/>` +
        `<path d="M ${t} 2 L 5 3.5 V 10"/>`;          // управляющий электрод от катода
      this._add(this._wrap(cx, cy, deg, inner));
      this._reg(ref, 'a', ...place(-L/2, 0, cx, cy, deg));
      this._reg(ref, 'k', ...place(L/2, 0, cx, cy, deg));
      this._reg(ref, 'g', ...place(5, 10, cx, cy, deg));
      // номинал уводим ниже вывода управляющего электрода, иначе налезает на него
      this._labels(ref, cx, cy, deg, opts, -bar/2 - 1, 11);
      return this;
    }
    /** Динистор симметричный (диак): два встречных треугольника — «бабочка».
     *  Двунаправленный, выводы a1 и a2 равноправны. */
    diac(ref, cx, cy, opts = {}) {
      const deg = opts.rotate || 0, L = opts.pitch || 20, t = 3.5, w = 4;
      const inner =
        `<path d="M ${-L/2} 0 H ${-w}"/>` +
        `<path d="M ${-w} ${-t} L ${-w} ${t} L 0 0 Z" fill="${this.o.stroke}"/>` +
        `<path d="M ${w} ${-t} L ${w} ${t} L 0 0 Z" fill="${this.o.stroke}"/>` +
        `<path d="M ${w} 0 H ${L/2}"/>`;
      this._add(this._wrap(cx, cy, deg, inner));
      this._reg(ref, 'a1', ...place(-L/2, 0, cx, cy, deg));
      this._reg(ref, 'a2', ...place(L/2, 0, cx, cy, deg));
      this._labels(ref, cx, cy, deg, opts, -t - 1, t + 0.5);
      return this;
    }
    /** Симистор (триак): «бабочка» динистора с управляющим электродом. */
    triac(ref, cx, cy, opts = {}) {
      const deg = opts.rotate || 0, L = opts.pitch || 20, t = 3.5, w = 4;
      const inner =
        `<path d="M ${-L/2} 0 H ${-w}"/>` +
        `<path d="M ${-w} ${-t} L ${-w} ${t} L 0 0 Z" fill="${this.o.stroke}"/>` +
        `<path d="M ${w} ${-t} L ${w} ${t} L 0 0 Z" fill="${this.o.stroke}"/>` +
        `<path d="M ${w} 0 H ${L/2}"/>` +
        `<path d="M ${w} 2 H 5 V 10"/>`;               // управляющий электрод
      this._add(this._wrap(cx, cy, deg, inner));
      this._reg(ref, 'a1', ...place(-L/2, 0, cx, cy, deg));
      this._reg(ref, 'a2', ...place(L/2, 0, cx, cy, deg));
      this._reg(ref, 'g', ...place(5, 10, cx, cy, deg));
      this._labels(ref, cx, cy, deg, opts, -t - 1, 11);
      return this;
    }

    /** Транзистор биполярный в окружности d=11. type: 'npn' | 'pnp'.
     *  Выводы: b (база, слева), c (коллектор, верх), e (эмиттер, низ).
     *  Коллектор и эмиттер отходят от базы строго под 45° и приходят ровно
     *  в узлы сетки 5 мм — как выводы резистора, чтобы провода не «промахивались». */
    transistor(ref, cx, cy, opts = {}) {
      const deg = opts.rotate || 0, R = 5.5, npn = (opts.type || 'npn') === 'npn';
      const bx = -2.5, bh = 4;      // черта базы: x = -2.5, полувысота 4
      const px = 5, py = 10;        // выводы коллектора и эмиттера — узлы сетки
      const bl = -10;               // вывод базы — тоже узел сетки
      // Стрелка на эмиттере: у n-p-n направлена от базы, у p-n-p — к базе.
      const eArrow = npn
        ? `<path d="M 2.9 7.9 L 0.35 6.63 L 1.63 5.35 Z" fill="${this.o.stroke}" stroke="none"/>`
        : `<path d="M 0.35 5.35 L 1.63 7.9 L 2.9 6.63 Z" fill="${this.o.stroke}" stroke="none"/>`;
      const inner =
        `<circle cx="0" cy="0" r="${R}"/>` +
        `<path d="M ${bl} 0 H ${bx}"/>` +                     // вывод базы
        `<path d="M ${bx} ${-bh} V ${bh}"/>` +                // черта базы
        `<path d="M ${bx} -2.5 L ${px} ${-py}"/>` +           // коллектор, 45°
        `<path d="M ${bx} 2.5 L ${px} ${py}"/>` +             // эмиттер, 45°
        eArrow;
      this._add(this._wrap(cx, cy, deg, inner));
      this._reg(ref, 'b', ...place(bl, 0, cx, cy, deg));
      this._reg(ref, 'c', ...place(px, -py, cx, cy, deg));
      this._reg(ref, 'e', ...place(px, py, cx, cy, deg));
      this._labels(ref, cx, cy, deg, opts, -py - 1, py + 1);
      return this;
    }

    // ======================================================================
    //  КОММУТАЦИОННЫЕ УСТРОЙСТВА  (ГОСТ 2.755-87 / 2.725-68)
    // ======================================================================
    /** Замыкающий контакт (нормально разомкнутый). */
    switchNO(ref, cx, cy, opts = {}) {
      const deg = opts.rotate || 0, L = opts.pitch || 20;
      const inner =
        `<path d="M ${-L/2} 0 H ${-3}"/>` +
        `<circle cx="-3" cy="0" r="0.4" fill="${this.o.stroke}"/>` +
        `<path d="M -3 0 L 3 -4"/>` +                 // подвижный контакт под углом
        `<circle cx="3" cy="0" r="0.4" fill="${this.o.stroke}"/>` +
        `<path d="M 3 0 H ${L/2}"/>`;
      this._add(this._wrap(cx, cy, deg, inner));
      this._reg(ref, 'a', ...place(-L/2, 0, cx, cy, deg));
      this._reg(ref, 'b', ...place(L/2, 0, cx, cy, deg));
      this._labels(ref, cx, cy, deg, opts, -5, 2);
      return this;
    }
    /** Размыкающий контакт (нормально замкнутый). */
    switchNC(ref, cx, cy, opts = {}) {
      const deg = opts.rotate || 0, L = opts.pitch || 20;
      const inner =
        `<path d="M ${-L/2} 0 H ${-3}"/>` +
        `<circle cx="-3" cy="0" r="0.4" fill="${this.o.stroke}"/>` +
        `<path d="M -3 0 L 3 0"/>` +
        `<path d="M 3 0 v -1 l 0 2 M 2 -4 L 3 -1"/>` +   // упор + отвод
        `<circle cx="3" cy="0" r="0.4" fill="${this.o.stroke}"/>` +
        `<path d="M 3 0 H ${L/2}"/>`;
      this._add(this._wrap(cx, cy, deg, inner));
      this._reg(ref, 'a', ...place(-L/2, 0, cx, cy, deg));
      this._reg(ref, 'b', ...place(L/2, 0, cx, cy, deg));
      this._labels(ref, cx, cy, deg, opts, -5, 2);
      return this;
    }
    /** Кнопка с замыкающим контактом (SB). */
    button(ref, cx, cy, opts = {}) {
      const deg = opts.rotate || 0, L = opts.pitch || 20;
      const inner =
        `<path d="M ${-L/2} 0 H ${-3}"/>` +
        `<circle cx="-3" cy="0" r="0.4" fill="${this.o.stroke}"/>` +
        `<path d="M -3 -0.3 L 3 -0.3"/>` +
        `<circle cx="3" cy="0" r="0.4" fill="${this.o.stroke}"/>` +
        `<path d="M 3 0 H ${L/2}"/>` +
        `<path d="M 0 -0.3 V -3 H 2"/>`;                 // толкатель
      this._add(this._wrap(cx, cy, deg, inner));
      this._reg(ref, 'a', ...place(-L/2, 0, cx, cy, deg));
      this._reg(ref, 'b', ...place(L/2, 0, cx, cy, deg));
      this._labels(ref, cx, cy, deg, opts, -4, 2);
      return this;
    }

    // ======================================================================
    //  ВОСПРИНИМАЮЩАЯ ЧАСТЬ (обмотка реле)  (ГОСТ 2.756-76)
    // ======================================================================
    /** Обмотка реле: прямоугольник 12×5. Выводы по торцам. */
    relayCoil(ref, cx, cy, opts = {}) {
      const deg = opts.rotate || 0, L = opts.pitch || 20, bw = 12, bh = 5;
      const inner =
        `<path d="M ${-L/2} 0 H ${-bw/2} M ${bw/2} 0 H ${L/2}"/>` +
        `<rect x="${-bw/2}" y="${-bh/2}" width="${bw}" height="${bh}"/>`;
      this._add(this._wrap(cx, cy, deg, inner));
      this._reg(ref, 'a', ...place(-L/2, 0, cx, cy, deg));
      this._reg(ref, 'b', ...place(L/2, 0, cx, cy, deg));
      this._labels(ref, cx, cy, deg, opts, -bh/2 - 1, bh/2);
      return this;
    }

    // ======================================================================
    //  ПРЕДОХРАНИТЕЛЬ, ЛАМПА, ИСТОЧНИК  (ГОСТ 2.727 / 2.732 / 2.742)
    // ======================================================================
    /** Плавкий предохранитель (FU): прямоугольник 10×4 с продольной линией. */
    fuse(ref, cx, cy, opts = {}) {
      const deg = opts.rotate || 0, L = opts.pitch || 20, bw = 10, bh = 4;
      const inner =
        `<path d="M ${-L/2} 0 H ${-bw/2} M ${bw/2} 0 H ${L/2}"/>` +
        `<rect x="${-bw/2}" y="${-bh/2}" width="${bw}" height="${bh}"/>` +
        `<path d="M ${-bw/2} 0 H ${bw/2}"/>`;
      this._add(this._wrap(cx, cy, deg, inner));
      this._reg(ref, 'a', ...place(-L/2, 0, cx, cy, deg));
      this._reg(ref, 'b', ...place(L/2, 0, cx, cy, deg));
      this._labels(ref, cx, cy, deg, opts, -bh/2 - 1, bh/2);
      return this;
    }
    /** Лампа сигнальная (HL): окружность d=8 с крестом. */
    lamp(ref, cx, cy, opts = {}) {
      const deg = opts.rotate || 0, L = opts.pitch || 20, R = 4;
      const k = R * Math.SQRT1_2;
      const inner =
        `<path d="M ${-L/2} 0 H ${-R}"/>` +
        `<circle cx="0" cy="0" r="${R}"/>` +
        `<path d="M ${-k} ${-k} L ${k} ${k} M ${-k} ${k} L ${k} ${-k}"/>` +
        `<path d="M ${R} 0 H ${L/2}"/>`;
      this._add(this._wrap(cx, cy, deg, inner));
      this._reg(ref, 'a', ...place(-L/2, 0, cx, cy, deg));
      this._reg(ref, 'b', ...place(L/2, 0, cx, cy, deg));
      this._labels(ref, cx, cy, deg, opts, -R - 1, R + 0.5);
      return this;
    }
    /** Гальванический элемент / батарея (GB): длинная (+) и короткая (−) черты. */
    battery(ref, cx, cy, opts = {}) {
      const deg = opts.rotate || 0, L = opts.pitch || 20, cells = opts.cells || 1;
      let d = `M ${-L/2} 0 H ${-2}`;
      let x = -2;
      for (let i = 0; i < cells; i++) {
        d += ` M ${x} -4 V 4`;            // длинная (+)
        d += ` M ${x + 2} -2 V 2`;        // короткая (−)
        x += 4;
      }
      d += ` M ${x} 0 H ${L/2}`;
      const inner = `<path d="${d}"/>`;
      this._add(this._wrap(cx, cy, deg, inner));
      this._reg(ref, 'a', ...place(-L/2, 0, cx, cy, deg));   // +
      this._reg(ref, 'b', ...place(L/2, 0, cx, cy, deg));    // −
      this._labels(ref, cx, cy, deg, opts, -5, 4.5);
      return this;
    }

    /** Источник тока (ГОСТ 2.721-74): окружность d=10 со стрелкой направления.
     *  Стрелка указывает направление тока ВНУТРИ источника: от 'a' к 'b'. */
    currentSource(ref, cx, cy, opts = {}) {
      const deg = opts.rotate || 0, L = opts.pitch || 20, R = 5;
      const inner =
        `<path d="M ${-L/2} 0 H ${-R}"/>` +
        `<circle cx="0" cy="0" r="${R}"/>` +
        `<path d="M -2.8 0 H 2.8"/>` +
        `<path d="M 2.8 0 l -1.8 -1.2 M 2.8 0 l -1.8 1.2"/>` +
        `<path d="M ${R} 0 H ${L/2}"/>`;
      this._add(this._wrap(cx, cy, deg, inner));
      this._reg(ref, 'a', ...place(-L/2, 0, cx, cy, deg));
      this._reg(ref, 'b', ...place(L/2, 0, cx, cy, deg));
      this._labels(ref, cx, cy, deg, opts, -R - 1, R + 0.5);
      return this;
    }

    /** Излучатель звука / громкоговоритель (ГОСТ 2.741-68). Выводы слева. */
    speaker(ref, cx, cy, opts = {}) {
      const deg = opts.rotate || 0;
      const inner =
        `<rect x="-3" y="-5" width="6" height="10"/>` +
        `<path d="M 3 -5 L 8 -9 V 9 L 3 5 Z"/>` +
        `<path d="M -3 -3 H -8 M -3 3 H -8"/>`;
      this._add(this._wrap(cx, cy, deg, inner));
      this._reg(ref, 'a', ...place(-8, -3, cx, cy, deg));
      this._reg(ref, 'b', ...place(-8, 3, cx, cy, deg));
      this._labels(ref, cx, cy, deg, opts, -10, 10);
      return this;
    }

    // ======================================================================
    //  МАШИНЫ ЭЛЕКТРИЧЕСКИЕ  (ГОСТ 2.722-68)
    // ======================================================================
    /** Двигатель/генератор: окружность d=12 с буквой (M — двигатель, G — генератор). */
    machine(ref, cx, cy, opts = {}) {
      const deg = opts.rotate || 0, R = 6, letter = opts.letter || 'M';
      const inner =
        `<circle cx="0" cy="0" r="${R}"/>` +
        `<text x="0" y="${this.o.fontSize/2 - 0.5}" text-anchor="middle" ` +
        `font-family="${this.o.fontFamily}" font-size="${this.o.fontSize}" ` +
        `stroke="none" fill="${this.o.stroke}">${esc(letter)}</text>` +
        `<path d="M 0 ${-R} V ${-R - 3}"/>` +
        `<path d="M 0 ${R} V ${R + 3}"/>`;
      this._add(this._wrap(cx, cy, deg, inner));
      this._reg(ref, 'a', ...place(0, -R - 3, cx, cy, deg));
      this._reg(ref, 'b', ...place(0, R + 3, cx, cy, deg));
      this._labels(ref, cx, cy, deg, opts, -R - 6.5, 0);
      return this;
    }

    // ======================================================================
    //  ОБОЗНАЧЕНИЯ ОБЩЕГО ПРИМЕНЕНИЯ  (ГОСТ 2.721-74)
    // ======================================================================
    /** Заземление. Вывод сверху. opts.lead — длина вывода (по умолч. 6 мм). */
    ground(x, y, opts = {}) {
      const deg = opts.rotate || 0, lead = opts.lead != null ? opts.lead : 6;
      const inner =
        `<path d="M 0 ${-lead} V 0"/>` +
        `<path d="M -4 0 H 4 M -2.6 2 H 2.6 M -1.2 4 H 1.2"/>`;
      this._add(this._wrap(x, y, deg, inner));
      if (opts.ref) this._reg(opts.ref, 'g', ...place(0, -lead, x, y, deg));
      return this;
    }
    /** Корпус (соединение с корпусом). Вывод сверху. */
    chassis(x, y, opts = {}) {
      const deg = opts.rotate || 0;
      const inner =
        `<path d="M 0 -6 V -2 M -4 -2 H 4"/>` +
        `<path d="M -4 -2 l -2 3 M -1.3 -2 l -2 3 M 1.3 -2 l -2 3 M 4 -2 l -2 3"/>`;
      this._add(this._wrap(x, y, deg, inner));
      return this;
    }
    /** Точка электрического соединения (жирная точка). */
    junction(x, y, opts = {}) {
      const r = opts.r || Math.max(0.8, this.o.b * 2);
      this.dots.push(`<circle cx="${fmt(x)}" cy="${fmt(y)}" r="${fmt(r)}" fill="${this.o.stroke}" stroke="none"/>`);
      return this;
    }

    // ======================================================================
    //  АНАЛОГОВАЯ ТЕХНИКА  (ГОСТ 2.759-82) и ЦИФРОВАЯ (ГОСТ 2.743-91)
    // ======================================================================
    /** Прямоугольное УГО (общая форма ГОСТ 2.743/2.759): основное поле + выводы.
     *  opts: { w, h, label, topLabel, left:[{name,y,inv,label}], right:[...],
     *          top:[{name,x,label}], bottom:[...] }
     *  Координаты выводов задаются от центра прямоугольника (мм). */
    box(ref, cx, cy, opts = {}) {
      const W = opts.w || 20, H = opts.h || 24, lead = 5;
      const g = [`<rect x="${-W/2}" y="${-H/2}" width="${W}" height="${H}"/>`];
      if (opts.label) g.push(
        `<text x="0" y="${-H/2 + this.o.fontSize + 1}" text-anchor="middle" stroke="none" ` +
        `fill="${this.o.stroke}" font-family="${this.o.fontFamily}" ` +
        `font-size="${this.o.fontSize + 0.5}">${esc(opts.label)}</text>`);
      const drawSide = (arr, side) => (arr || []).forEach(p => {
        let x0, y0, dx = 0, dy = 0;
        if (side === 'left')  { x0 = -W/2; y0 = p.y || 0; dx = -1; }
        if (side === 'right') { x0 =  W/2; y0 = p.y || 0; dx =  1; }
        if (side === 'top')   { x0 = p.x || 0; y0 = -H/2; dy = -1; }
        if (side === 'bottom'){ x0 = p.x || 0; y0 =  H/2; dy =  1; }
        const inv = p.inv ? 1.4 : 0;
        if (p.inv) g.push(`<circle cx="${x0 + dx*0.7}" cy="${y0 + dy*0.7}" r="0.7"/>`);
        g.push(`<path d="M ${x0 + dx*inv} ${y0 + dy*inv} L ${x0 + dx*lead} ${y0 + dy*lead}"/>`);
        if (p.label) {
          const tx = side === 'left' ? -W/2 + 1.2 : side === 'right' ? W/2 - 1.2 : x0;
          const ta = side === 'left' ? 'start' : side === 'right' ? 'end' : 'middle';
          g.push(`<text x="${tx}" y="${y0 + this.o.fontSize/2 - 0.5}" text-anchor="${ta}" stroke="none" ` +
                 `fill="${this.o.stroke}" font-family="${this.o.fontFamily}" font-size="${this.o.fontSize - 0.5}">${esc(p.label)}</text>`);
        }
        this._reg(ref, p.name, ...place(x0 + dx*lead, y0 + dy*lead, cx, cy, opts.rotate || 0));
      });
      drawSide(opts.left, 'left'); drawSide(opts.right, 'right');
      drawSide(opts.top, 'top');  drawSide(opts.bottom, 'bottom');
      this._add(this._wrap(cx, cy, opts.rotate || 0, g.join('')));
      // позиционное обозначение — над УГО
      if (opts.showRef !== false && ref) {
        const [lx, ly] = place(0, -H/2, cx, cy, opts.rotate || 0);
        this.labels.push(this._text(lx, ly - 1, ref, 'middle'));
      }
      return this;
    }
    /** Операционный усилитель (ГОСТ 2.759): прямоугольник с меткой ▷ и полем. */
    opamp(ref, cx, cy, opts = {}) {
      return this.box(ref, cx, cy, Object.assign({
        w: 20, h: 20, label: '\u25B7',
        left: [{ name: 'in-', y: -5, label: '\u2212' }, { name: 'in+', y: 5, label: '+' }],
        right: [{ name: 'out', y: 0 }]
      }, opts));
    }
    /** Логический элемент (ГОСТ 2.743): прямоугольник с меткой функции ('&','1', и т.п.). */
    gate(ref, cx, cy, opts = {}) {
      return this.box(ref, cx, cy, Object.assign({ w: 16, h: 20, label: '&' }, opts));
    }

    // ======================================================================
    //  ТРАНСФОРМАТОР  (ГОСТ 2.723-68)
    // ======================================================================
    /** Двухобмоточный трансформатор с магнитопроводом. Вертикальная компоновка.
     *  Выводы: p1,p2 (первичная), s1,s2 (вторичная). */
    transformer(ref, cx, cy, opts = {}) {
      const deg = opts.rotate || 0, n = 4, r = 2, span = n * 2 * r;
      const coil = (sign) => {
        let d = `M 0 ${-span/2}`, y = -span/2;
        for (let i = 0; i < n; i++) { d += ` A ${r} ${r} 0 0 ${sign > 0 ? 0 : 1} 0 ${y + 2*r}`; y += 2*r; }
        return d;
      };
      const gap = 3;
      const inner =
        `<g transform="translate(${-gap} 0)"><path d="${coil(1)}"/>` +
        `<path d="M 0 ${-span/2} V ${-span/2 - 3} M 0 ${span/2} V ${span/2 + 3}"/></g>` +
        `<path d="M 0 ${-span/2 - 3} V ${span/2 + 3}"/>` +             // магнитопровод
        `<g transform="translate(${gap} 0)"><path d="${coil(-1)}"/>` +
        `<path d="M 0 ${-span/2} V ${-span/2 - 3} M 0 ${span/2} V ${span/2 + 3}"/></g>`;
      this._add(this._wrap(cx, cy, deg, inner));
      this._reg(ref, 'p1', ...place(-gap, -span/2 - 3, cx, cy, deg));
      this._reg(ref, 'p2', ...place(-gap, span/2 + 3, cx, cy, deg));
      this._reg(ref, 's1', ...place(gap, -span/2 - 3, cx, cy, deg));
      this._reg(ref, 's2', ...place(gap, span/2 + 3, cx, cy, deg));
      if (opts.showRef !== false && ref) {
        const [lx, ly] = place(-gap - 4, 0, cx, cy, deg);
        this.labels.push(this._text(lx, ly, ref, 'end'));
      }
      return this;
    }

    // ======================================================================
    //  ПРОВОДА  (ГОСТ 2.721-74 / 2.709-89)
    // ======================================================================
    /** Провод по точкам [[x,y],...]. Точки — абсолютные координаты (или .pin()). */
    wire(points, opts = {}) {
      const w = opts.bus ? this.o.b * 2 : this.o.b;
      const d = points.map((p, i) => (i ? 'L' : 'M') + ' ' + fmt(p[0]) + ' ' + fmt(p[1])).join(' ');
      this.wires.push(`<path d="${d}" fill="none" stroke="${this.o.stroke}" ` +
        `stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`);
      return this;
    }
    /** Ортогональное соединение двух точек: сначала по X, затем по Y (или наоборот). */
    connect(a, b, opts = {}) {
      const first = opts.first || 'h';   // 'h' | 'v'
      const mid = first === 'h' ? [b[0], a[1]] : [a[0], b[1]];
      this.wire([a, mid, b], opts);
      return this;
    }

    // ======================================================================
    //  ОФОРМЛЕНИЕ ЧЕРТЕЖА  (ГОСТ 2.104-2006)
    // ======================================================================
    /** Рамка поля чертежа: слева поле 20 мм (для подшивки), остальные 5 мм. */
    frame() {
      const W = this.o.width, H = this.o.height, thin = 0.4;
      this._frame =
        `<rect x="0" y="0" width="${W}" height="${H}" fill="none" stroke="${this.o.stroke}" stroke-width="${thin}"/>` +
        `<rect x="20" y="5" width="${W - 25}" height="${H - 10}" fill="none" stroke="${this.o.stroke}" stroke-width="${this.o.b + 0.3}"/>`;
      return this;
    }
    /** Основная надпись (упрощённая форма 1) в правом нижнем углу поля чертежа.
     *  opts: { name, designation, org, developer, checker, sheet, sheets, scale, mass, lit } */
    titleBlock(opts = {}) {
      const W = this.o.width, H = this.o.height;
      const bw = 185, bh = 40;                         // упрощённый блок
      const x0 = W - 5 - bw, y0 = H - 5 - bh;          // привязка к внутренней рамке
      const L = (x1, y1, x2, y2) => `<line x1="${fmt(x1)}" y1="${fmt(y1)}" x2="${fmt(x2)}" y2="${fmt(y2)}" stroke="${this.o.stroke}" stroke-width="0.4"/>`;
      const T = (x, y, t, sz = 3, anc = 'start') => `<text x="${fmt(x)}" y="${fmt(y)}" font-family="${this.o.fontFamily}" font-size="${sz}" fill="${this.o.stroke}" stroke="none" text-anchor="${anc}">${esc(t || '')}</text>`;
      let g = `<rect x="${x0}" y="${y0}" width="${bw}" height="${bh}" fill="none" stroke="${this.o.stroke}" stroke-width="${this.o.b + 0.3}"/>`;
      const xr = x0 + 65;                              // граница левой (исполнители) и правой граф
      // --- левая графа (исполнители): 65 мм, строки по 5 мм ---
      const rows = ['Разраб.', 'Пров.', '', 'Н.контр.', 'Утв.'];
      for (let i = 1; i < 8; i++) g += L(x0, y0 + i * 5, xr, y0 + i * 5);
      g += L(x0 + 7, y0, x0 + 7, y0 + bh) + L(x0 + 23, y0, x0 + 23, y0 + bh) +
           L(x0 + 40, y0, x0 + 40, y0 + bh) + L(xr, y0, xr, y0 + bh);
      rows.forEach((r, i) => { if (r) g += T(x0 + 0.6, y0 + i * 5 + 3.6, r, 2.4); });
      if (opts.developer) g += T(x0 + 24, y0 + 3.6, opts.developer, 2.8);
      if (opts.checker) g += T(x0 + 24, y0 + 8.6, opts.checker, 2.8);
      // --- правая графа (120 мм): обозначение / наименование / нижний блок ---
      g += L(xr, y0 + 12, x0 + bw, y0 + 12) + L(xr, y0 + 24, x0 + bw, y0 + 24);
      g += T(xr + 60, y0 + 8.5, opts.designation || '', 5, 'middle');
      g += T(xr + 60, y0 + 19.5, opts.name || 'Схема электрическая принципиальная', 3.6, 'middle');
      // нижний блок 24..40: столбцы Лит | Масса | Масштаб | (Лист/Листов + организация)
      g += L(xr + 30, y0 + 24, xr + 30, y0 + bh) + L(xr + 55, y0 + 24, xr + 55, y0 + bh) +
           L(xr + 80, y0 + 24, xr + 80, y0 + bh);
      g += L(xr, y0 + 30, xr + 80, y0 + 30) + L(xr + 80, y0 + 32, x0 + bw, y0 + 32);
      g += T(xr + 2, y0 + 28.5, 'Лит.', 2.3) + T(xr + 32, y0 + 28.5, 'Масса', 2.3) + T(xr + 57, y0 + 28.5, 'Масштаб', 2.3);
      g += T(xr + 15, y0 + 37, opts.lit || '', 3, 'middle') + T(xr + 42, y0 + 37, opts.mass || '', 3, 'middle') + T(xr + 67, y0 + 37, opts.scale || '', 3, 'middle');
      g += T(xr + 82, y0 + 29, 'Лист', 2.3) + T(xr + 100, y0 + 29, 'Листов', 2.3);
      g += T(xr + 95, y0 + 29, String(opts.sheet || ''), 3) + T(xr + 115, y0 + 29, String(opts.sheets || ''), 3);
      g += T(xr + 100, y0 + 37, opts.org || '', 3, 'middle');
      this._title = g;
      return this;
    }

    // ======================================================================
    //  ВЫВОД SVG
    // ======================================================================
    toSVG() {
      const p = this.o.pad, W = this.o.width + 2*p, H = this.o.height + 2*p;
      let grid = '';
      if (this.o.showGrid) {
        grid = `<defs><pattern id="g" width="${this.o.grid}" height="${this.o.grid}" ` +
          `patternUnits="userSpaceOnUse"><path d="M ${this.o.grid} 0 H 0 V ${this.o.grid}" ` +
          `fill="none" stroke="#e3e8ef" stroke-width="0.15"/></pattern></defs>` +
          `<rect x="0" y="0" width="${this.o.width}" height="${this.o.height}" fill="url(#g)"/>`;
      }
      const bg = this.o.background
        ? `<rect x="${-p}" y="${-p}" width="${W}" height="${H}" fill="${this.o.background}"/>` : '';
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-p} ${-p} ${W} ${H}" ` +
        `width="100%" font-family="${this.o.fontFamily}">` +
        bg + grid +
        (this._frame || '') +
        this.wires.join('') +
        this.parts.join('') +
        this.dots.join('') +
        this.labels.join('') +
        (this._title || '') +
        `</svg>`;
    }
  }

  return { Schematic };
});
