/**
 * schematic-presets.js — встроенные схемы-заготовки.
 *
 * Все координаты кратны шагу сетки 5 мм, все связи ортогональны (изломы 90°),
 * выводы элементов рассчитываются через getComponentPins — поэтому провода
 * гарантированно приходят точно в концы УГО.
 *
 * Ориентация двухполюсников: rotate:0 — горизонтально (вывод «a»/«p» слева),
 * rotate:90 — вертикально (первый вывод сверху).
 */
'use strict';
import { SchematicModel, COMPONENT_TYPES, getComponentPins } from './schematic-model.js';

/** Добавить компонент и сразу получить абсолютные координаты его выводов. */
function put(model, type, x, y, opts = {}) {
  const comp = model.addComponent(type, x, y, opts);
  return getComponentPins(comp, COMPONENT_TYPES[type]);
}

/* ===================== БАЗОВЫЕ ЦЕПИ ===================== */

/** Делитель напряжения: 12 В на двух резисторах по 10 кОм → 6 В в средней точке. */
function makeVoltageDivider() {
  const m = new SchematicModel();
  const gb = put(m, 'vsource', 30, 60, { id: 'GB1', value: 12, rotate: 90 });
  const r1 = put(m, 'resistor', 70, 40, { id: 'R1', value: 10000, rotate: 90 });
  const r2 = put(m, 'resistor', 70, 80, { id: 'R2', value: 10000, rotate: 90 });
  const gnd = put(m, 'ground', 30, 95, { id: 'GND1' });

  m.addWire([gb.p, [30, 30], r1.a]);
  m.addWire([r1.b, r2.a]);
  m.addWire([r2.b, [70, 90], gnd.g]);
  m.addWire([gb.n, gnd.g]);
  return m;
}

/** Светодиод с токоограничивающим резистором: 5 В, 220 Ом, Vf = 2 В. */
function makeLEDCircuit() {
  const m = new SchematicModel();
  const gb = put(m, 'vsource', 30, 60, { id: 'GB1', value: 5, rotate: 90 });
  const r1 = put(m, 'resistor', 70, 35, { id: 'R1', value: 220, rotate: 90 });
  const hl = put(m, 'led', 70, 70, { id: 'HL1', value: 2.0, rotate: 90 });
  const gnd = put(m, 'ground', 30, 95, { id: 'GND1' });

  m.addWire([gb.p, [30, 25], r1.a]);
  m.addWire([r1.b, hl.a]);
  m.addWire([hl.k, [70, 90], gnd.g]);
  m.addWire([gb.n, gnd.g]);
  return m;
}

/** RC-звено: в статике конденсатор — разрыв, ток равен нулю, весь потенциал на C. */
function makeRCFilter() {
  const m = new SchematicModel();
  const gb = put(m, 'vsource', 30, 55, { id: 'GB1', value: 10, rotate: 90 });
  const r1 = put(m, 'resistor', 60, 30, { id: 'R1', value: 1000 });
  const c1 = put(m, 'capacitor', 90, 50, { id: 'C1', value: 100e-6, rotate: 90 });
  const gnd = put(m, 'ground', 60, 95, { id: 'GND1' });

  m.addWire([gb.p, [30, 30], r1.a]);
  m.addWire([r1.b, [90, 30], c1.a]);
  m.addWire([c1.b, [90, 90], gnd.g]);
  m.addWire([gb.n, [30, 90], gnd.g]);
  return m;
}

/** Мост Уитстона в равновесии: обе средние точки под 2.5 В. */
function makeWheatstoneBridge() {
  const m = new SchematicModel();
  const gb = put(m, 'vsource', 30, 60, { id: 'GB1', value: 5, rotate: 90 });
  const r1 = put(m, 'resistor', 65, 40, { id: 'R1', value: 1000, rotate: 90 });
  const r2 = put(m, 'resistor', 125, 40, { id: 'R2', value: 1000, rotate: 90 });
  const r3 = put(m, 'resistor', 65, 80, { id: 'R3', value: 1000, rotate: 90 });
  const r4 = put(m, 'resistor', 125, 80, { id: 'R4', value: 1000, rotate: 90 });
  const gnd = put(m, 'ground', 95, 110, { id: 'GND1' });

  m.addWire([gb.p, [30, 20], [65, 20], r1.a]);
  m.addWire([[65, 20], [125, 20], r2.a]);
  m.addWire([r1.b, r3.a]);
  m.addWire([r2.b, r4.a]);
  m.addWire([r3.b, [65, 100], [95, 100], gnd.g]);
  m.addWire([r4.b, [125, 100], [95, 100]]);
  m.addWire([gb.n, [30, 100], [65, 100]]);
  return m;
}

/** Параметрический стабилизатор на стабилитроне: 12 В → 5.1 В на нагрузке. */
function makeZenerRegulator() {
  const m = new SchematicModel();
  const gb = put(m, 'vsource', 30, 60, { id: 'GB1', value: 12, rotate: 90 });
  const r1 = put(m, 'resistor', 65, 25, { id: 'R1', value: 470 });
  const vd = put(m, 'zener', 95, 60, { id: 'VD1', value: 5.1, rotate: 270 });
  const rl = put(m, 'resistor', 155, 60, { id: 'R2', value: 1000, rotate: 90 });
  const gnd = put(m, 'ground', 85, 105, { id: 'GND1' });

  m.addWire([gb.p, [30, 25], r1.a]);
  m.addWire([r1.b, [95, 25], vd.k]);
  m.addWire([[95, 25], [155, 25], rl.a]);
  m.addWire([vd.a, [95, 95], [85, 95], gnd.g]);
  m.addWire([rl.b, [155, 95], [95, 95]]);
  m.addWire([gb.n, [30, 95], [85, 95]]);
  return m;
}

/** Источник тока 10 мА на нагрузке 1 кОм — проверка независимости от нагрузки. */
function makeCurrentSource() {
  const m = new SchematicModel();
  const i1 = put(m, 'isource', 40, 55, { id: 'I1', value: 0.01, rotate: 270 });
  const r1 = put(m, 'resistor', 90, 55, { id: 'R1', value: 1000, rotate: 90 });
  const gnd = put(m, 'ground', 65, 95, { id: 'GND1' });

  // Внутри источника ток идёт p→n, значит в нагрузку он выходит с вывода «n».
  m.addWire([i1.n, [40, 25], [90, 25], r1.a]);
  m.addWire([r1.b, [90, 85], [65, 85], gnd.g]);
  m.addWire([i1.p, [40, 85], [65, 85]]);
  return m;
}

/** Ключ и лампа: демонстрация замкнутого/разомкнутого состояния. */
function makeSwitchLamp() {
  const m = new SchematicModel();
  const gb = put(m, 'vsource', 30, 60, { id: 'GB1', value: 12, rotate: 90 });
  const s1 = put(m, 'switch', 70, 25, { id: 'S1', value: 1 });
  const hl = put(m, 'lamp', 110, 60, { id: 'HL1', value: 100, rotate: 90 });
  const gnd = put(m, 'ground', 70, 105, { id: 'GND1' });

  m.addWire([gb.p, [30, 25], s1.a]);
  m.addWire([s1.b, [110, 25], hl.a]);
  m.addWire([hl.b, [110, 95], [70, 95], gnd.g]);
  m.addWire([gb.n, [30, 95], [70, 95]]);
  return m;
}

/** Смешанное соединение: R1 последовательно с параллельной парой R2‖R3. */
function makeSeriesParallel() {
  const m = new SchematicModel();
  const gb = put(m, 'vsource', 30, 65, { id: 'GB1', value: 9, rotate: 90 });
  const r1 = put(m, 'resistor', 70, 25, { id: 'R1', value: 100 });
  const r2 = put(m, 'resistor', 100, 60, { id: 'R2', value: 200, rotate: 90 });
  const r3 = put(m, 'resistor', 155, 60, { id: 'R3', value: 200, rotate: 90 });
  const gnd = put(m, 'ground', 70, 105, { id: 'GND1' });

  m.addWire([gb.p, [30, 25], r1.a]);
  m.addWire([r1.b, [100, 25], r2.a]);
  m.addWire([[100, 25], [155, 25], r3.a]);
  m.addWire([r2.b, [100, 95], [70, 95], gnd.g]);
  m.addWire([r3.b, [155, 95], [100, 95]]);
  m.addWire([gb.n, [30, 95], [70, 95]]);
  return m;
}

/**
 * Транзисторный ключ с общим эмиттером: базовый ток загоняет VT1 в насыщение,
 * коллекторная нагрузка — светодиод с токоограничивающим резистором.
 */
function makeTransistorSwitch() { return commonEmitter(10000); }

/**
 * Усилительный каскад с общим эмиттером в активном режиме:
 * большой базовый резистор задаёт малый Iб, транзистор не насыщается.
 */
function makeCommonEmitter() { return commonEmitter(200000); }

/**
 * Общая компоновка каскада с общим эмиттером. Величина базового резистора
 * решает всё: 10 кОм загоняют транзистор в насыщение, 200 кОм оставляют
 * в активном режиме.
 */
function commonEmitter(rBase) {
  const m = new SchematicModel();
  const gb  = put(m, 'vsource', 30, 70, { id: 'GB1', value: 12, rotate: 90 });
  const rb  = put(m, 'resistor', 70, 70, { id: 'R1', value: rBase });
  const rc  = put(m, 'resistor', 115, 40, { id: 'R2', value: 1000, rotate: 90 });
  const vt  = put(m, 'npn', 110, 70, { id: 'VT1', value: 100 });
  const gnd = put(m, 'ground', 70, 105, { id: 'GND1' });

  // Шина питания: от «+» источника вверх, затем к базовой и коллекторной цепям
  m.addWire([gb.p, [30, 20], [60, 20], rb.a]);
  m.addWire([[60, 20], [115, 20], rc.a]);
  m.addWire([rb.b, vt.b]);
  m.addWire([rc.b, vt.c]);
  // Эмиттер и «−» источника на землю
  m.addWire([vt.e, [115, 100], gnd.g]);
  m.addWire([gb.n, [30, 100], gnd.g]);
  return m;
}

/* ===================== ОПЕРАЦИОННЫЙ УСИЛИТЕЛЬ ===================== */
// Выводы ОУ: inv (−15, −5), non (−15, +5), out (+15, 0) от центра УГО.
// Шины питания задаются свойствами vcc/vee, на схеме их рисовать не нужно.

/** Инвертирующий усилитель: Uвых = −Uвх·Rос/R1 = −10·Uвх. */
function makeOpampInverting() {
  const m = new SchematicModel();
  const gb  = put(m, 'vsource', 30, 70, { id: 'GB1', value: 1, rotate: 90 });
  const r1  = put(m, 'resistor', 55, 55, { id: 'R1', value: 10000 });
  const rf  = put(m, 'resistor', 100, 25, { id: 'R2', value: 100000 });
  const da  = put(m, 'opamp', 100, 60, { id: 'DA1' });
  const gnd = put(m, 'ground', 55, 95, { id: 'GND1' });

  m.addWire([[20, 90], [90, 90]]);                 // шина нулевого потенциала
  m.addWire([gnd.g, [55, 90]]);
  m.addWire([gb.p, [30, 55], r1.a]);
  m.addWire([r1.b, da.inv]);
  m.addWire([gb.n, [30, 90]]);
  m.addWire([da.inv, [85, 25], rf.a]);             // цепь обратной связи
  m.addWire([rf.b, [115, 25], da.out]);
  m.addWire([da.non, [90, 65], [90, 90]]);         // неинвертирующий вход на землю
  return m;
}

/** Неинвертирующий усилитель: Uвых = Uвх·(1 + Rос/R1) = 11·Uвх. */
function makeOpampNonInverting() {
  const m = new SchematicModel();
  const gb  = put(m, 'vsource', 30, 75, { id: 'GB1', value: 1, rotate: 90 });
  const r1  = put(m, 'resistor', 55, 25, { id: 'R1', value: 10000 });
  const rf  = put(m, 'resistor', 100, 25, { id: 'R2', value: 100000 });
  const da  = put(m, 'opamp', 100, 60, { id: 'DA1' });
  const gnd = put(m, 'ground', 55, 95, { id: 'GND1' });

  m.addWire([[20, 90], [90, 90]]);
  m.addWire([gnd.g, [55, 90]]);
  m.addWire([gb.p, da.non]);                       // вход прямо на неинвертирующий
  m.addWire([gb.n, [30, 90]]);
  m.addWire([da.inv, [85, 25], rf.a]);
  m.addWire([[85, 25], r1.b]);
  m.addWire([r1.a, [20, 25], [20, 90]]);           // R1 на землю мимо входной цепи
  m.addWire([rf.b, [115, 25], da.out]);
  return m;
}

/** Повторитель напряжения: выход заведён на инвертирующий вход, K = 1. */
function makeOpampFollower() {
  const m = new SchematicModel();
  const gb  = put(m, 'vsource', 30, 75, { id: 'GB1', value: 1, rotate: 90 });
  const da  = put(m, 'opamp', 100, 60, { id: 'DA1' });
  const gnd = put(m, 'ground', 55, 95, { id: 'GND1' });

  m.addWire([[20, 90], [130, 90]]);
  m.addWire([gnd.g, [55, 90]]);
  m.addWire([gb.p, da.non]);
  m.addWire([gb.n, [30, 90]]);
  m.addWire([da.out, [125, 60], [125, 30], [80, 30], [80, 55], da.inv]);
  return m;
}

/* ===================== ЭЛЕКТРОМЕХАНИКА И ТИРИСТОРЫ ===================== */

/**
 * Реле: кнопка подаёт питание на катушку, замыкающий контакт K1.1 шунтирует
 * кнопку — классическая схема с самоблокировкой. Контакт K1.2 включает лампу.
 */
function makeRelayLatch() {
  const m = new SchematicModel();
  const gb  = put(m, 'vsource', 30, 70, { id: 'GB1', value: 24, rotate: 90 });
  const s1  = put(m, 'switch', 70, 40, { id: 'S1', value: 1, rotate: 90 });
  const k1  = put(m, 'relay', 70, 80, { id: 'K1', value: 400, rotate: 90 });
  const k2  = put(m, 'contactNO', 120, 40, { id: 'K2', rotate: 90, props: { coil: 'K1' } });
  const h1  = put(m, 'lamp', 120, 80, { id: 'HL1', value: 240, rotate: 90 });
  const k3  = put(m, 'contactNC', 160, 40, { id: 'K3', rotate: 90, props: { coil: 'K1' } });
  const h2  = put(m, 'lamp', 160, 80, { id: 'HL2', value: 240, rotate: 90 });
  put(m, 'ground', 95, 115, { id: 'GND1' });        // вывод ложится на нулевую шину

  m.addWire([[30, 20], [165, 20]]);                 // шина питания
  m.addWire([[20, 110], [170, 110]]);               // шина нулевого потенциала
  m.addWire([gb.p, [30, 20]]);
  m.addWire([gb.n, [30, 110]]);

  // Цепь управления: кнопка последовательно с катушкой
  m.addWire([[70, 20], s1.a]);
  m.addWire([s1.b, k1.a]);
  m.addWire([k1.b, [70, 110]]);

  // Замыкающий контакт включает HL1, размыкающий K3 — наоборот, гасит HL2
  m.addWire([[120, 20], k2.a]);
  m.addWire([k2.b, h1.a]);
  m.addWire([h1.b, [120, 110]]);
  m.addWire([[160, 20], k3.a]);
  m.addWire([k3.b, h2.a]);
  m.addWire([h2.b, [160, 110]]);
  return m;
}

/** Тиристорный ключ: ток через управляющий электрод отпирает VS1, лампа горит. */
function makeThyristorSwitch() {
  const m = new SchematicModel();
  const gb  = put(m, 'vsource', 30, 70, { id: 'GB1', value: 24, rotate: 90 });
  const hl  = put(m, 'lamp', 100, 25, { id: 'HL1', value: 240 });
  const vs  = put(m, 'scr', 130, 60, { id: 'VS1', value: 1.0, rotate: 90 });
  const rg  = put(m, 'resistor', 85, 65, { id: 'R1', value: 1000 });
  put(m, 'ground', 80, 110, { id: 'GND1' });

  m.addWire([[20, 105], [145, 105]]);               // шина нулевого потенциала
  m.addWire([gb.p, [30, 25], hl.a]);                // силовая цепь
  m.addWire([hl.b, [130, 25], vs.a]);
  m.addWire([vs.k, [130, 105]]);
  m.addWire([gb.n, [30, 105]]);
  // Цепь управления ответвляется от «+» и через R1 идёт на управляющий электрод
  m.addWire([[30, 45], [75, 45], rg.a]);
  m.addWire([rg.b, vs.g]);
  return m;
}

/**
 * Оптопара: вход 5 В через R1 питает светодиод, выходной фототранзистор
 * управляет цепью 12 В. Между сторонами нет ни одного проводника — связь
 * только оптическая, через коэффициент передачи тока.
 */
function makeOptocoupler() {
  const m = new SchematicModel();
  const g1 = put(m, 'vsource', 30, 70, { id: 'GB1', value: 5, rotate: 90 });
  const r1 = put(m, 'resistor', 60, 25, { id: 'R1', value: 1000 });
  const vu = put(m, 'optocoupler', 110, 60, { id: 'VU1', value: 0.5 });
  // rotate 180 — чтобы вывод «a» смотрел в сторону питания и ток читался
  // положительным: он течёт от источника к коллектору
  const r2 = put(m, 'resistor', 155, 25, { id: 'R2', value: 2000, rotate: 180 });
  const g2 = put(m, 'vsource', 185, 70, { id: 'GB2', value: 12, rotate: 90 });
  put(m, 'ground', 110, 110, { id: 'GND1' });

  m.addWire([[20, 105], [195, 105]]);              // общая шина нулевого потенциала
  // входная сторона
  m.addWire([g1.p, [30, 25], r1.a]);
  m.addWire([r1.b, [70, 55], vu.a]);
  m.addWire([vu.k, [90, 105]]);
  m.addWire([g1.n, [30, 105]]);
  // выходная сторона
  m.addWire([g2.p, [185, 25], r2.a]);
  m.addWire([r2.b, [145, 55], vu.c]);
  m.addWire([vu.e, [130, 105]]);
  m.addWire([g2.n, [185, 105]]);
  return m;
}

/* ===================== РЕЕСТР ===================== */

export const PRESETS = [
  { id: 'voltage-divider', nameKey: 'editor.preset_divider',  create: makeVoltageDivider },
  { id: 'led-circuit',     nameKey: 'editor.preset_led',      create: makeLEDCircuit },
  { id: 'series-parallel', nameKey: 'editor.preset_serpar',   create: makeSeriesParallel },
  { id: 'rc-filter',       nameKey: 'editor.preset_rc',       create: makeRCFilter },
  { id: 'wheatstone',      nameKey: 'editor.preset_bridge',   create: makeWheatstoneBridge },
  { id: 'zener-reg',       nameKey: 'editor.preset_zener',    create: makeZenerRegulator },
  { id: 'current-source',  nameKey: 'editor.preset_isource',  create: makeCurrentSource },
  { id: 'switch-lamp',     nameKey: 'editor.preset_switch',   create: makeSwitchLamp },
  { id: 'bjt-switch',      nameKey: 'editor.preset_bjtsw',    create: makeTransistorSwitch },
  { id: 'bjt-amp',         nameKey: 'editor.preset_bjtamp',   create: makeCommonEmitter },
  { id: 'opamp-inv',       nameKey: 'editor.preset_opamp_inv',    create: makeOpampInverting },
  { id: 'opamp-ninv',      nameKey: 'editor.preset_opamp_ninv',   create: makeOpampNonInverting },
  { id: 'opamp-follower',  nameKey: 'editor.preset_opamp_follow', create: makeOpampFollower },
  { id: 'relay-latch',     nameKey: 'editor.preset_relay',        create: makeRelayLatch },
  { id: 'scr-switch',      nameKey: 'editor.preset_scr',          create: makeThyristorSwitch },
  { id: 'optocoupler',     nameKey: 'editor.preset_opto',         create: makeOptocoupler },
];

/** Создать модель по идентификатору пресета. */
export function loadPreset(id) {
  const preset = PRESETS.find(p => p.id === id);
  return preset ? preset.create() : null;
}
