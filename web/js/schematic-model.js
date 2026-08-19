/**
 * schematic-model.js — модель данных принципиальной схемы (Э3).
 *
 * Схема хранится как чистые JSON-сериализуемые данные: список компонентов
 * (позиционное обозначение, тип, центр в мм, поворот, номинал в СИ) и список
 * проводов (ломаная по точкам + необязательные привязки к выводам).
 *
 * Геометрия выводов ОБЯЗАНА совпадать с библиотекой отрисовки gost-schematic.js —
 * иначе провода не приходят в концы УГО. Смещения ниже сверены с реальными
 * регистрациями _reg() библиотеки (см. PIN_OFFSETS).
 */
'use strict';

/* ===================== ЕДИНИЦЫ И ЛОКАЛЬ ===================== */

/** Единицы измерения по ключу, в двух локалях. */
export const UNITS = {
  ohm:   { ru: 'Ом', en: 'Ω' },
  farad: { ru: 'Ф',  en: 'F' },
  henry: { ru: 'Гн', en: 'H' },
  volt:  { ru: 'В',  en: 'V' },
  amp:   { ru: 'А',  en: 'A' },
  watt:  { ru: 'Вт', en: 'W' },
  sec:   { ru: 'с',  en: 's' },
  none:  { ru: '',   en: '' },
};

/** Приставки СИ по локали (порядок — от больших к меньшим). */
const SI_PREFIXES = {
  ru: [['T','Т'],['G','Г'],['M','М'],['k','к'],['',''],['m','м'],['u','мк'],['n','н'],['p','п']],
  en: [['T','T'],['G','G'],['M','M'],['k','k'],['',''],['m','m'],['u','µ'],['n','n'],['p','p']],
};
const SI_SCALES = [1e12, 1e9, 1e6, 1e3, 1, 1e-3, 1e-6, 1e-9, 1e-12];

let locale = 'ru';
/** Задать локаль форматирования (вызывается при смене языка приложения). */
export function setLocale(l) { locale = (l === 'en') ? 'en' : 'ru'; }

/** Символ единицы измерения по ключу в текущей локали. */
export function unitSymbol(key) {
  const u = UNITS[key];
  return u ? u[locale] : (key || '');
}

/**
 * Форматирование величины с приставкой СИ.
 * @param {number} value значение в основных единицах СИ
 * @param {string} unitKey ключ из UNITS ('ohm', 'volt', ...)
 * @returns {string} например «4.7 кОм», «13.0 мА»
 */
export function formatSI(value, unitKey) {
  const unit = unitSymbol(unitKey);
  if (!isFinite(value)) return '— ' + unit;
  const abs = Math.abs(value);
  // Ниже пикопорога величину считаем нулевой — это шум решателя, а не сигнал.
  if (abs < 1e-15) return '0 ' + unit;
  const sign = value < 0 ? '−' : '';
  const prefixes = SI_PREFIXES[locale];
  for (let i = 0; i < SI_SCALES.length; i++) {
    const scale = SI_SCALES[i];
    if (abs >= scale) {
      const scaled = abs / scale;
      // 3–4 значащие цифры: результатам эмуляции нужна точность,
      // а хвостовые нули потом всё равно срезаются.
      const digits = scaled >= 100 ? 1 : scaled >= 10 ? 2 : 3;
      return sign + trimZeros(scaled.toFixed(digits)) + ' ' + prefixes[i][1] + unit;
    }
  }
  return sign + abs.toExponential(2) + ' ' + unit;
}

function trimZeros(s) {
  return s.indexOf('.') < 0 ? s : s.replace(/\.?0+$/, '');
}

/* ===================== ОПИСАНИЕ ТИПОВ КОМПОНЕНТОВ ===================== */

/**
 * pins       — имена выводов в порядке [положительный/первый, второй, ...]
 * unitKey    — единица измерения номинала
 * simulated  — участвует ли элемент в расчёте рабочей точки
 */
export const COMPONENT_TYPES = {
  resistor:  { pins: ['a','b'],           defaultValue: 1000, unitKey: 'ohm',   category: 'passive', simulated: true },
  capacitor: { pins: ['a','b'],           defaultValue: 1e-6, unitKey: 'farad', category: 'passive', simulated: true },
  inductor:  { pins: ['a','b'],           defaultValue: 1e-3, unitKey: 'henry', category: 'passive', simulated: true },
  vsource:   { pins: ['p','n'],           defaultValue: 9,    unitKey: 'volt',  category: 'source',  simulated: true },
  isource:   { pins: ['p','n'],           defaultValue: 0.01, unitKey: 'amp',   category: 'source',  simulated: true },
  diode:     { pins: ['a','k'],           defaultValue: 0.7,  unitKey: 'volt',  category: 'semi',    simulated: true },
  led:       { pins: ['a','k'],           defaultValue: 2.0,  unitKey: 'volt',  category: 'semi',    simulated: true },
  zener:     { pins: ['a','k'],           defaultValue: 5.1,  unitKey: 'volt',  category: 'semi',    simulated: true },
  switch:    { pins: ['a','b'],           defaultValue: 1,    unitKey: 'none',  category: 'passive', simulated: true },
  lamp:      { pins: ['a','b'],           defaultValue: 100,  unitKey: 'ohm',   category: 'passive', simulated: true },
  ground:    { pins: ['g'],               defaultValue: 0,    unitKey: 'none',  category: 'ref',     simulated: true },
  npn: {
    pins: ['b','c','e'], defaultValue: 100, unitKey: 'none', category: 'semi', simulated: true,
    valueLabelKey: 'editor.p_beta',
    params: [
      { key: 'vbe',  unitKey: 'volt', labelKey: 'editor.p_vbe',  def: 0.7 },
      { key: 'vsat', unitKey: 'volt', labelKey: 'editor.p_vsat', def: 0.2 },
    ],
  },
  pnp: {
    pins: ['b','c','e'], defaultValue: 100, unitKey: 'none', category: 'semi', simulated: true,
    valueLabelKey: 'editor.p_beta',
    params: [
      { key: 'vbe',  unitKey: 'volt', labelKey: 'editor.p_vbe',  def: 0.7 },
      { key: 'vsat', unitKey: 'volt', labelKey: 'editor.p_vsat', def: 0.2 },
    ],
  },
  opamp: {
    pins: ['inv','non','out'], defaultValue: 1e5, unitKey: 'none', category: 'active', simulated: true,
    valueLabelKey: 'editor.p_gain',
    // Шины питания — свойства, а не выводы: так работает и однополярное питание.
    params: [
      { key: 'vcc', unitKey: 'volt', labelKey: 'editor.p_vcc', def: 15 },
      { key: 'vee', unitKey: 'volt', labelKey: 'editor.p_vee', def: -15 },
    ],
  },
  ic:        { pins: [],                  defaultValue: 0,    unitKey: 'none',  category: 'active',  simulated: false },

  /* ---- оптоэлектроника ----
     Вход и выход гальванически развязаны: это просто две несвязанные пары
     узлов, ток выхода задаётся током светодиода через коэффициент передачи. */
  optocoupler: {
    pins: ['a','k','c','e'], defaultValue: 0.5, unitKey: 'none', category: 'semi', simulated: true,
    valueLabelKey: 'editor.p_ctr',
    params: [
      { key: 'vf',   unitKey: 'volt', labelKey: 'editor.p_vf_led', def: 1.2 },
      { key: 'vsat', unitKey: 'volt', labelKey: 'editor.p_vsat',   def: 0.2 },
    ],
  },

  /* ---- тиристорное семейство ----
     В статике эти приборы описываются состоянием «открыт/закрыт»: отпирание
     считается по току управления и напряжению включения, а вот запирание —
     событие во времени, для него нужен анализ переходного процесса. */
  scr: {
    pins: ['a','k','g'], defaultValue: 1.0, unitKey: 'volt', category: 'semi', simulated: true,
    valueLabelKey: 'editor.p_vt',
    params: [
      { key: 'igt', unitKey: 'amp',  labelKey: 'editor.p_igt', def: 0.005 },
      { key: 'on',  kind: 'bool',    labelKey: 'editor.p_forced_on', def: 0 },
    ],
  },
  triac: {
    pins: ['a1','a2','g'], defaultValue: 1.2, unitKey: 'volt', category: 'semi', simulated: true,
    valueLabelKey: 'editor.p_vt',
    params: [
      { key: 'igt', unitKey: 'amp',  labelKey: 'editor.p_igt', def: 0.005 },
      { key: 'vbo', unitKey: 'volt', labelKey: 'editor.p_vbo', def: 400 },
      { key: 'on',  kind: 'bool',    labelKey: 'editor.p_forced_on', def: 0 },
    ],
  },
  diac: {
    pins: ['a1','a2'], defaultValue: 32, unitKey: 'volt', category: 'semi', simulated: true,
    valueLabelKey: 'editor.p_vbo',
    params: [
      { key: 'vt', unitKey: 'volt', labelKey: 'editor.p_vt', def: 1.5 },
    ],
  },

  /* ---- электромеханика ----
     Катушка в статике — обычный резистор; состояние контактов считается
     по напряжению на «своей» катушке (props.coil). */
  relay: {
    pins: ['a','b'], defaultValue: 200, unitKey: 'ohm', category: 'coil', simulated: true,
    params: [{ key: 'upick', unitKey: 'volt', labelKey: 'editor.p_upick', def: 9 }],
  },
  contactor: {
    pins: ['a','b'], defaultValue: 150, unitKey: 'ohm', category: 'coil', simulated: true,
    params: [{ key: 'upick', unitKey: 'volt', labelKey: 'editor.p_upick', def: 180 }],
  },
  contactNO: {
    pins: ['a','b'], defaultValue: 0, unitKey: 'none', category: 'contact', simulated: true,
    params: [{ key: 'coil', kind: 'ref', refTypes: ['relay','contactor'], labelKey: 'editor.p_coil' }],
  },
  contactNC: {
    pins: ['a','b'], defaultValue: 0, unitKey: 'none', category: 'contact', simulated: true,
    params: [{ key: 'coil', kind: 'ref', refTypes: ['relay','contactor'], labelKey: 'editor.p_coil' }],
  },
};

/**
 * Смещения выводов относительно центра УГО (мм, до поворота).
 * Значения сверены с _reg() в gost-schematic.js при шаге выводов pitch=20.
 * Отклонение здесь = провод, не доходящий до конца вывода на схеме.
 */
export const PIN_OFFSETS = {
  resistor:  { a: [-10, 0], b: [10, 0] },
  capacitor: { a: [-10, 0], b: [10, 0] },
  inductor:  { a: [-10, 0], b: [10, 0] },
  lamp:      { a: [-10, 0], b: [10, 0] },
  switch:    { a: [-10, 0], b: [10, 0] },
  diode:     { a: [-10, 0], k: [10, 0] },   // a — анод, k — катод (вывод 'b' библиотеки)
  led:       { a: [-10, 0], k: [10, 0] },
  zener:     { a: [-10, 0], k: [10, 0] },
  // Батарея рисуется горизонтально: '+' слева (вывод 'a'), '−' справа ('b').
  vsource:   { p: [-10, 0], n: [10, 0] },
  isource:   { p: [-10, 0], n: [10, 0] },
  // Заземление: библиотека рисует стойку вверх; отрисовываем с lead:5, чтобы вывод лёг на сетку.
  ground:    { g: [0, -5] },
  npn:       { b: [-10, 0], c: [5, -10], e: [5, 10] },
  pnp:       { b: [-10, 0], c: [5, -10], e: [5, 10] },
  // ОУ = box 20×20 с выводом lead=5 → ±15 по X, ±5 по Y.
  opamp:     { inv: [-15, -5], non: [-15, 5], out: [15, 0] },
  ic:        {},
  optocoupler: { a: [-20, -5], k: [-20, 5], c: [20, -5], e: [20, 5] },
  scr:       { a: [-10, 0], k: [10, 0], g: [5, 10] },
  triac:     { a1: [-10, 0], a2: [10, 0], g: [5, 10] },
  diac:      { a1: [-10, 0], a2: [10, 0] },
  relay:     { a: [-10, 0], b: [10, 0] },
  contactor: { a: [-10, 0], b: [10, 0] },
  contactNO: { a: [-10, 0], b: [10, 0] },
  contactNC: { a: [-10, 0], b: [10, 0] },
};

/** Длина вывода заземления, мм — согласована с PIN_OFFSETS.ground. */
export const GROUND_LEAD = 5;

/** Префиксы позиционных обозначений по ГОСТ 2.710. */
const REF_PREFIXES = {
  resistor: 'R', capacitor: 'C', inductor: 'L', lamp: 'HL',
  vsource: 'GB', isource: 'I',
  diode: 'VD', led: 'HL', zener: 'VD',
  ground: 'GND', switch: 'S',
  npn: 'VT', pnp: 'VT', opamp: 'DA', ic: 'DD',
  scr: 'VS', triac: 'VS', diac: 'VD', optocoupler: 'VU',
  relay: 'K', contactor: 'KM', contactNO: 'K', contactNC: 'K',
};

/* ===================== ГЕОМЕТРИЯ ВЫВОДОВ ===================== */

/**
 * Абсолютные координаты всех выводов компонента с учётом поворота.
 * @returns {Object<string, [number, number]>} имя вывода → [x, y] в мм
 */
export function getComponentPins(comp, def) {
  const offsets = PIN_OFFSETS[comp.type] || {};
  const deg = ((comp.rotate || 0) % 360 + 360) % 360;
  const rad = deg * Math.PI / 180;
  const cos = Math.cos(rad), sin = Math.sin(rad);
  const pins = {};
  for (const [name, [ox, oy]] of Object.entries(offsets)) {
    pins[name] = [
      snapCoord(comp.x + ox * cos - oy * sin),
      snapCoord(comp.y + ox * sin + oy * cos),
    ];
  }
  return pins;
}

/** Округление координаты до 0.01 мм — устраняет дрожание float у поворотов. */
export function snapCoord(v) { return Math.round(v * 100) / 100; }

/** Ключ узла по координате. Совпадение точное (в пределах 0.01 мм). */
export function coordKey(x, y) { return snapCoord(x) + ',' + snapCoord(y); }

/** Лежит ли точка на отрезке (с допуском 0.01 мм). */
export function pointOnSegment(p, a, b) {
  const eps = 0.01;
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]) <= eps;
  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2;
  if (t < -eps || t > 1 + eps) return false;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy)) <= eps;
}

/**
 * Точки электрического соединения (ГОСТ 2.721-74): узлы, где сходятся три и
 * более проводника. Живёт в модели, а не в отрисовке, потому что это свойство
 * связей, а не картинки — и потому что иначе его нечем проверить тестом.
 *
 * @param {SchematicModel} model
 * @returns {Array<[number, number]>} координаты точек в мм
 */
export function junctionPoints(model) {
  const same = (p, q) => Math.abs(p[0] - q[0]) < 0.01 && Math.abs(p[1] - q[1]) < 0.01;
  const count = new Map();
  const ends = [];
  const bump = (x, y) => {
    const k = coordKey(x, y);
    count.set(k, (count.get(k) || 0) + 1);
  };

  for (const w of model.wires) {
    const first = w.points[0], last = w.points[w.points.length - 1];
    bump(first[0], first[1]); bump(last[0], last[1]);
    ends.push({ p: first, w }, { p: last, w });
  }
  for (const comp of model.components) {
    const def = COMPONENT_TYPES[comp.type];
    if (!def) continue;
    for (const c of Object.values(getComponentPins(comp, def))) {
      bump(c[0], c[1]);
      ends.push({ p: c, w: null });
    }
  }

  const dots = new Set();
  for (const [k, n] of count) if (n >= 3) dots.add(k);

  // Конец проводника, упирающийся в чужую линию, — тоже узел. Отбрасываем
  // только совпадение с КОНЦАМИ этой линии (они уже посчитаны выше): попадание
  // в её промежуточный излом — полноценное T-образное соединение, и точку там
  // ставить обязательно, иначе связь читается как простое пересечение.
  for (const e of ends) {
    for (const w of model.wires) {
      if (w === e.w) continue;
      const wFirst = w.points[0], wLast = w.points[w.points.length - 1];
      if (same(e.p, wFirst) || same(e.p, wLast)) continue;
      for (let i = 1; i < w.points.length; i++) {
        if (pointOnSegment(e.p, w.points[i - 1], w.points[i])) {
          dots.add(coordKey(e.p[0], e.p[1]));
          break;
        }
      }
    }
  }

  return [...dots].map(k => k.split(',').map(Number));
}

/* ===================== МОДЕЛЬ СХЕМЫ ===================== */

export class SchematicModel {
  constructor() {
    this.version = 1;
    this.grid = 5;               // шаг сетки, мм
    this.components = [];
    this.wires = [];
    this._seq = {};              // префикс → следующий номер
  }

  /** Следующее свободное позиционное обозначение для типа (R1, R2, C1, …). */
  nextId(type) {
    const prefix = REF_PREFIXES[type] || (type[0] || 'X').toUpperCase();
    let n = this._seq[prefix] || 1;
    let id;
    do { id = prefix + n++; } while (this.components.some(c => c.id === id));
    this._seq[prefix] = n;
    return id;
  }

  /** Добавить компонент. Координаты центра привязываются к сетке. */
  addComponent(type, x, y, opts = {}) {
    const def = COMPONENT_TYPES[type];
    if (!def) throw new Error('Неизвестный тип компонента: ' + type);
    const comp = {
      id: opts.id || this.nextId(type),
      type,
      x: this.snapGrid(x),
      y: this.snapGrid(y),
      rotate: ((opts.rotate || 0) % 360 + 360) % 360,
      value: opts.value ?? def.defaultValue,
      props: opts.props || {},
    };
    this.components.push(comp);
    return comp;
  }

  /** Привязка координаты к шагу сетки. */
  snapGrid(v) { return Math.round(v / this.grid) * this.grid; }

  getComponent(id) { return this.components.find(c => c.id === id) || null; }

  /**
   * Переключить коммутационный аппарат с ручным управлением.
   * Контакты реле сюда намеренно не входят: их положение задаёт катушка,
   * и переключение рукой разошлось бы с расчётом цепи управления.
   *
   * @param {string} id позиционное обозначение
   * @returns {boolean} было ли переключение
   */
  toggleSwitch(id) {
    const comp = this.getComponent(id);
    if (!comp || comp.type !== 'switch') return false;
    comp.value = Number(comp.value) !== 0 ? 0 : 1;
    return true;
  }

  /** Удалить компонент и все провода, привязанные к нему по ссылке. */
  removeComponent(id) {
    this.components = this.components.filter(c => c.id !== id);
    this.wires = this.wires.filter(w => w.a?.ref !== id && w.b?.ref !== id);
  }

  moveComponent(id, x, y) {
    const comp = this.getComponent(id);
    if (!comp) return;
    comp.x = this.snapGrid(x);
    comp.y = this.snapGrid(y);
  }

  /** Поворот на 90° по часовой стрелке. */
  rotateComponent(id, step = 90) {
    const comp = this.getComponent(id);
    if (comp) comp.rotate = ((comp.rotate + step) % 360 + 360) % 360;
  }

  updateValue(id, value) {
    const comp = this.getComponent(id);
    if (comp) comp.value = value;
  }

  /**
   * Добавить провод по точкам. Идентификатор уникален в пределах схемы —
   * нумерация по длине массива давала коллизии после удаления.
   */
  addWire(points, a = null, b = null) {
    let n = this._seq.w || 1;
    let id;
    do { id = 'w' + n++; } while (this.wires.some(w => w.id === id));
    this._seq.w = n;
    // Схлопываем подряд идущие одинаковые точки: нулевой сегмент ничего не
    // соединяет, но мешает проверкам ортогональности и засоряет SVG.
    const pts = [];
    for (const p of points) {
      const q = [snapCoord(p[0]), snapCoord(p[1])];
      const last = pts[pts.length - 1];
      if (!last || last[0] !== q[0] || last[1] !== q[1]) pts.push(q);
    }
    const wire = { id, points: pts, a, b };
    this.wires.push(wire);
    return wire;
  }

  removeWire(id) { this.wires = this.wires.filter(w => w.id !== id); }

  /**
   * Построение списка цепей (netlist) объединением совпадающих точек.
   *
   * Объединяются: все точки одного провода (это один проводник) и любые
   * выводы/точки с совпадающими координатами. Опорным узлом (GND) становится
   * объединение ВСЕХ элементов «земля» — их может быть несколько.
   *
   * @returns {{nodeOf:Function, nodeNames:Object, gndNode:(number|null),
   *            pinNode:Object, wireNode:Object, nodeCoords:Object}}
   */
  buildNetlist() {
    const index = new Map();      // coordKey → индекс
    const coords = [];            // индекс → [x, y]
    const idxOf = (x, y) => {
      const key = coordKey(x, y);
      if (!index.has(key)) { index.set(key, coords.length); coords.push([snapCoord(x), snapCoord(y)]); }
      return index.get(key);
    };

    // 1. Регистрируем все выводы компонентов и все точки проводов.
    const pinIdx = {};            // 'REF.pin' → индекс
    for (const comp of this.components) {
      const def = COMPONENT_TYPES[comp.type];
      if (!def) continue;
      const pins = getComponentPins(comp, def);
      for (const [name, c] of Object.entries(pins)) {
        pinIdx[comp.id + '.' + name] = idxOf(c[0], c[1]);
      }
    }
    for (const wire of this.wires) {
      for (const p of wire.points) idxOf(p[0], p[1]);
    }

    // 2. Union-Find по всем зарегистрированным точкам.
    const parent = Array.from({ length: coords.length }, (_, i) => i);
    const rank = new Uint8Array(coords.length);
    const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
    const union = (a, b) => {
      a = find(a); b = find(b);
      if (a === b) return;
      if (rank[a] < rank[b]) { const t = a; a = b; b = t; }
      parent[b] = a;
      if (rank[a] === rank[b]) rank[a]++;
    };

    // 3. Все точки одного провода — один проводник.
    const wireIdx = {};
    for (const wire of this.wires) {
      const ids = wire.points.map(p => index.get(coordKey(p[0], p[1])));
      for (let i = 1; i < ids.length; i++) union(ids[0], ids[i]);
      wireIdx[wire.id] = ids;
      // Явные привязки к выводам (если заданы) — тоже соединение.
      for (const end of [wire.a, wire.b]) {
        if (!end) continue;
        const pi = pinIdx[end.ref + '.' + end.pin];
        if (pi !== undefined) union(ids[0], pi);
      }
    }

    // 3б. Тройники: точка, попавшая на СЕРЕДИНУ чужого провода, соединяется с ним.
    // Без этого отвод, брошенный на шину питания, оставался бы висеть в воздухе.
    // Простое пересечение двух проводов так не соединяется: у него в точке
    // пересечения нет вершины — а это и есть правило ЕСКД «крест без точки».
    for (const wire of this.wires) {
      const wid = index.get(coordKey(wire.points[0][0], wire.points[0][1]));
      for (let i = 1; i < wire.points.length; i++) {
        const a = wire.points[i - 1], b = wire.points[i];
        for (let k = 0; k < coords.length; k++) {
          if (pointOnSegment(coords[k], a, b)) union(wid, k);
        }
      }
    }

    // 4. Все «земли» — один опорный узел.
    let gndRoot = null;
    for (const comp of this.components) {
      if (comp.type !== 'ground') continue;
      const gi = pinIdx[comp.id + '.g'];
      if (gi === undefined) continue;
      if (gndRoot === null) gndRoot = gi; else union(gndRoot, gi);
    }

    // 5. Осмысленные имена узлов: GND и N1, N2, … в порядке появления.
    const nodeNames = {};         // корень → имя
    const nodeCoords = {};        // имя → [[x,y], ...]
    let counter = 1;
    const gndKey = gndRoot === null ? null : find(gndRoot);
    for (let i = 0; i < coords.length; i++) {
      const root = find(i);
      if (!(root in nodeNames)) {
        nodeNames[root] = (gndKey !== null && root === gndKey) ? 'GND' : ('N' + counter++);
        nodeCoords[nodeNames[root]] = [];
      }
      nodeCoords[nodeNames[root]].push(coords[i]);
    }

    const pinNode = {};
    for (const [k, i] of Object.entries(pinIdx)) pinNode[k] = nodeNames[find(i)];
    const wireNode = {};
    for (const [id, ids] of Object.entries(wireIdx)) wireNode[id] = ids.length ? nodeNames[find(ids[0])] : null;

    return {
      /** Имя узла в точке (x, y) или null. */
      nodeOf: (x, y) => {
        const i = index.get(coordKey(x, y));
        return i === undefined ? null : nodeNames[find(i)];
      },
      nodeNames, nodeCoords, pinNode, wireNode,
      gndNode: gndKey === null ? null : 'GND',
    };
  }

  /** Компактный JSON без служебных полей. */
  toJSON() {
    return JSON.stringify({
      version: this.version,
      grid: this.grid,
      components: this.components,
      wires: this.wires,
    }, null, 2);
  }

  /** Разбор JSON с проверкой структуры и восстановлением счётчиков. */
  static fromJSON(json) {
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    if (!data || typeof data !== 'object') throw new Error('Неверный формат схемы');
    const model = new SchematicModel();
    model.version = data.version || 1;
    model.grid = data.grid || 5;

    for (const c of (Array.isArray(data.components) ? data.components : [])) {
      if (!c || !c.id || !COMPONENT_TYPES[c.type]) continue;
      model.components.push({
        id: String(c.id),
        type: c.type,
        x: Number(c.x) || 0,
        y: Number(c.y) || 0,
        rotate: ((Number(c.rotate) || 0) % 360 + 360) % 360,
        value: Number.isFinite(Number(c.value)) ? Number(c.value) : COMPONENT_TYPES[c.type].defaultValue,
        props: (c.props && typeof c.props === 'object') ? c.props : {},
      });
    }
    for (const w of (Array.isArray(data.wires) ? data.wires : [])) {
      if (!w || !Array.isArray(w.points) || w.points.length < 2) continue;
      model.wires.push({
        id: String(w.id || ''),
        points: w.points.map(p => [snapCoord(Number(p[0]) || 0), snapCoord(Number(p[1]) || 0)]),
        a: w.a || null,
        b: w.b || null,
      });
    }
    // Уникализируем пустые/повторяющиеся id проводов.
    const seen = new Set();
    let wn = 1;
    for (const w of model.wires) {
      while (!w.id || seen.has(w.id)) w.id = 'w' + wn++;
      seen.add(w.id);
    }
    // Восстанавливаем счётчики, чтобы новые элементы не конфликтовали.
    for (const c of model.components) {
      const m = c.id.match(/^([A-Za-z]+)(\d+)$/);
      if (m) model._seq[m[1]] = Math.max(model._seq[m[1]] || 1, Number(m[2]) + 1);
    }
    model._seq.w = Math.max(wn, model.wires.length + 1);
    return model;
  }

  /**
   * Проверка схемы. Возвращает список проблем с ключами i18n, а не готовым текстом,
   * чтобы сообщения переводились вместе с интерфейсом.
   * @returns {Array<{level:string, key:string, ref?:string, pin?:string}>}
   */
  validate() {
    const issues = [];
    if (!this.components.length) return issues;

    if (!this.components.some(c => c.type === 'ground')) {
      issues.push({ level: 'error', key: 'editor.iss_no_ground' });
    }

    // Висящий вывод = вывод, чей узел не содержит ни одной другой точки.
    const net = this.buildNetlist();
    const nodeUse = {};
    for (const name of Object.values(net.pinNode)) nodeUse[name] = (nodeUse[name] || 0) + 1;
    for (const wire of this.wires) {
      const n = net.wireNode[wire.id];
      if (n) nodeUse[n] = (nodeUse[n] || 0) + 1;
    }

    for (const comp of this.components) {
      if (comp.type === 'ground') continue;
      const def = COMPONENT_TYPES[comp.type];
      if (!def) continue;
      for (const pin of def.pins) {
        const node = net.pinNode[comp.id + '.' + pin];
        if (!node || (nodeUse[node] || 0) < 2) {
          issues.push({ level: 'warn', key: 'editor.iss_floating_pin', ref: comp.id, pin });
        }
      }
    }

    // Короткое замыкание источника: оба вывода в одном узле.
    for (const comp of this.components) {
      if (comp.type !== 'vsource') continue;
      const a = net.pinNode[comp.id + '.p'], b = net.pinNode[comp.id + '.n'];
      if (a && a === b) issues.push({ level: 'error', key: 'editor.iss_shorted_source', ref: comp.id });
    }

    return issues;
  }
}
