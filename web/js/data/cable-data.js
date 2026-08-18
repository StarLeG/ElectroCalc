/* EngiCalc — справочные данные по кабелям и аппаратам защиты
 *
 * Единственный источник правды для величин, которые раньше дублировались
 * тернарниками в electrical.js, electrical2.js, electrical3.js,
 * cable-networks.js, industry.js и equipment.js — и успели там разойтись.
 *
 * ВНИМАНИЕ. Поправочные коэффициенты (K_*) реконструированы по таблицам ПУЭ
 * и подлежат сверке с бумажным нормативом. Они собраны здесь именно затем,
 * чтобы сверка была механической: одно место — одна правка.
 */
'use strict';

/** Стандартный ряд сечений, мм² (ГОСТ 22483 / ПУЭ). */
export const STD_SECTIONS = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240];

/**
 * Базовая таблица кабеля.
 *
 * Базис: медь и алюминий, изоляция ПВХ, открытая прокладка в воздухе,
 * температура среды +25 °C, одна-две нагруженные жилы.
 * Отклонения от базиса учитываются коэффициентами K_* ниже.
 *
 * S — сечение, мм²;      d — расчётный диаметр жилы, мм;
 * ICu / IAl — допустимый длительный ток, А;
 * RCu / RAl — активное сопротивление при 20 °C, Ом/км;
 * X — индуктивное сопротивление, Ом/км;
 * mCu / mAl — масса жил, кг/км.
 *
 * Источник: ПУЭ табл. 1.3.4; перенесено из src/models/cabledatamodel.cpp.
 */
export const CABLE_TABLE = [
  { S: 1.5,   d: 1.38,  ICu: 19,  IAl: 15,  RCu: 12.07, RAl: 20.47, X: 0.08, mCu: 13,   mAl: 7 },
  { S: 2.5,   d: 1.78,  ICu: 27,  IAl: 21,  RCu: 7.24,  RAl: 12.28, X: 0.08, mCu: 22,   mAl: 12 },
  { S: 4.0,   d: 2.26,  ICu: 38,  IAl: 29,  RCu: 4.53,  RAl: 7.68,  X: 0.07, mCu: 35,   mAl: 19 },
  { S: 6.0,   d: 2.76,  ICu: 46,  IAl: 38,  RCu: 3.02,  RAl: 5.12,  X: 0.07, mCu: 52,   mAl: 28 },
  { S: 10,    d: 3.57,  ICu: 70,  IAl: 55,  RCu: 1.81,  RAl: 3.07,  X: 0.07, mCu: 87,   mAl: 47 },
  { S: 16,    d: 4.51,  ICu: 95,  IAl: 75,  RCu: 1.13,  RAl: 1.92,  X: 0.06, mCu: 139,  mAl: 75 },
  { S: 25,    d: 5.64,  ICu: 130, IAl: 100, RCu: 0.72,  RAl: 1.23,  X: 0.06, mCu: 217,  mAl: 117 },
  { S: 35,    d: 6.68,  ICu: 160, IAl: 125, RCu: 0.52,  RAl: 0.88,  X: 0.06, mCu: 304,  mAl: 164 },
  { S: 50,    d: 7.98,  ICu: 200, IAl: 160, RCu: 0.36,  RAl: 0.62,  X: 0.06, mCu: 435,  mAl: 235 },
  { S: 70,    d: 9.44,  ICu: 255, IAl: 200, RCu: 0.26,  RAl: 0.44,  X: 0.06, mCu: 609,  mAl: 329 },
  { S: 95,    d: 11.00, ICu: 310, IAl: 245, RCu: 0.19,  RAl: 0.32,  X: 0.06, mCu: 830,  mAl: 448 },
  { S: 120,   d: 12.36, ICu: 360, IAl: 280, RCu: 0.15,  RAl: 0.26,  X: 0.06, mCu: 1042, mAl: 563 },
  { S: 150,   d: 13.82, ICu: 410, IAl: 320, RCu: 0.12,  RAl: 0.21,  X: 0.06, mCu: 1303, mAl: 704 },
  { S: 185,   d: 15.35, ICu: 470, IAl: 370, RCu: 0.10,  RAl: 0.17,  X: 0.06, mCu: 1606, mAl: 867 },
  { S: 240,   d: 17.48, ICu: 555, IAl: 430, RCu: 0.08,  RAl: 0.13,  X: 0.06, mCu: 2083, mAl: 1124 }
];

/** Мелкие сечения вне силового ряда ПУЭ — контрольные и слаботочные жилы, мм². */
export const SMALL_SECTIONS = [0.5, 0.75, 1.0];

/** Полный ряд сечений, включая контрольные жилы, мм². */
export const ALL_SECTIONS = [...SMALL_SECTIONS, ...STD_SECTIONS];

/** Удельное сопротивление при 20 °C, Ом·мм²/м. */
export const RESISTIVITY = { Cu: 0.0175, Al: 0.028, Steel: 0.13 };

/** Температурный коэффициент сопротивления, 1/°C. */
export const TEMP_COEF = { Cu: 0.00393, Al: 0.00403 };

/** Предельно допустимая температура жилы по типу изоляции, °C. */
export const MAX_TEMP = { pvc: 70, rubber: 65, paper: 80, xlpe: 90 };

/**
 * Коэффициент термической стойкости при КЗ (Smin = Iкз·√t / k), А·с^0.5/мм².
 * ГОСТ Р 50571.5.54 / IEC 60364-5-54, табл. A.54.
 *
 * Прежний код (electrical2.js) использовал 143/95 для любой изоляции —
 * это значения для сшитого полиэтилена; для ПВХ они завышают стойкость почти
 * на четверть, то есть занижают требуемое сечение.
 */
export const K_THERMAL = {
  Cu: { pvc: 115, rubber: 141, paper: 100, xlpe: 143 },
  Al: { pvc: 76,  rubber: 93,  paper: 65,  xlpe: 94 }
};

/** Поправка на тип изоляции относительно ПВХ (базис таблицы). */
export const K_INSULATION = { pvc: 1.00, rubber: 0.96, paper: 1.10, xlpe: 1.25 };

/** Поправка на способ прокладки относительно открытой прокладки в воздухе. */
export const K_LAYING = {
  air: 1.00,     // открыто в воздухе
  tray: 0.95,    // в лотке, на кабельных конструкциях
  duct: 0.88,    // в кабель-канале
  pipe: 0.85,    // в трубе
  wall: 0.80,    // скрыто в стене
  ground: 1.10   // в земле: грунт отводит тепло лучше воздуха
};

/** Прокладка в земле — для неё действует своя температурная таблица. */
export const GROUND_LAYINGS = ['ground'];

/** Поправка на число нагруженных жил в кабеле. */
export const K_CORES = { 1: 1.00, 2: 1.00, 3: 0.90, 4: 0.85, 5: 0.80 };

/**
 * Поправка на температуру окружающего воздуха, базис +25 °C.
 * ПУЭ табл. 1.3.3 для нормируемой температуры жилы +70 °C.
 * Ключ — температура, °C; промежуточные значения интерполируются.
 */
export const K_TEMP_AIR = {
  20: 1.05, 25: 1.00, 30: 0.94, 35: 0.88,
  40: 0.82, 45: 0.75, 50: 0.67, 55: 0.57
};

/** Поправка на температуру грунта, базис +15 °C. */
export const K_TEMP_GROUND = {
  10: 1.04, 15: 1.00, 20: 0.95, 25: 0.90,
  30: 0.85, 35: 0.79, 40: 0.72
};

/** Нормируемая температура среды по типу прокладки, °C. */
export const BASE_AMBIENT = { air: 25, ground: 15 };

/**
 * Поправка на число совместно проложенных кабелей (взаимный нагрев).
 * ПУЭ табл. 1.3.26. Ключ — число кабелей в пучке или ряду.
 */
export const K_GROUP = {
  1: 1.00, 2: 0.90, 3: 0.85, 4: 0.80, 5: 0.78,
  6: 0.75, 7: 0.72, 9: 0.72, 10: 0.70, 12: 0.70, 20: 0.65
};

/** Стандартный ряд номиналов автоматических выключателей, А. */
export const BREAKER_RATINGS = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250];

/** Стандартный ряд номиналов УЗО по току утечки, мА. */
export const RCD_RATINGS = [10, 30, 100, 300, 500];

/**
 * Запас по току для автомата в зависимости от характеристики.
 * Применяется при пусковых нагрузках; для чисто активной нагрузки — 1.0.
 */
export const BREAKER_K = { B: 1.13, C: 1.45, D: 1.45 };

/**
 * Минимальные сечения медных жил по ПУЭ 7.1.34 и 7.1.45, мм².
 * Алюминий в жилых и общественных зданиях допускается от 16 мм² (ПУЭ 7.1.34).
 */
export const MIN_SECTION_PUE = { lighting: 1.5, socket: 2.5, input: 4.0, aluminiumIndoor: 16 };

/** Ряд стандартных диаметров труб для скрытой прокладки, мм. */
export const PIPE_DIAMETERS = [16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 150, 200];

/**
 * Строка таблицы по сечению.
 * @param {number} section сечение, мм²
 * @returns {object|undefined} строка CABLE_TABLE либо undefined, если такого сечения нет в ряду
 */
export function lookupSection(section) {
  return CABLE_TABLE.find(row => Math.abs(row.S - section) < 0.01);
}

/**
 * Допустимый длительный ток по таблице, без поправок.
 * @param {number} section сечение, мм²
 * @param {string} material 'Cu' или 'Al'
 * @returns {number} ток, А; 0 — если сечения нет в таблице
 */
export function baseCurrent(section, material) {
  const row = lookupSection(section);
  if (!row) return 0;
  return material === 'Al' ? row.IAl : row.ICu;
}

/**
 * Активное сопротивление жилы при заданной температуре.
 * @param {number} section сечение, мм²
 * @param {string} material 'Cu' или 'Al'
 * @param {number} temp температура жилы, °C
 * @returns {number} сопротивление, Ом/км
 */
export function resistanceAt(section, material, temp) {
  const rho = RESISTIVITY[material] ?? RESISTIVITY.Cu;
  const alpha = TEMP_COEF[material] ?? TEMP_COEF.Cu;
  return rho * 1000 / section * (1 + alpha * (temp - 20));
}

/**
 * Значение из таблицы коэффициентов с линейной интерполяцией между узлами.
 * За границами таблицы возвращается крайнее значение — экстраполяция
 * нормативных коэффициентов дала бы физически бессмысленные числа.
 * @param {object} table таблица вида {ключ: коэффициент}
 * @param {number} value искомый аргумент
 * @returns {number} коэффициент
 */
export function interpolateK(table, value) {
  const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
  if (value <= keys[0]) return table[keys[0]];
  if (value >= keys[keys.length - 1]) return table[keys[keys.length - 1]];

  for (let i = 0; i < keys.length - 1; i++) {
    const lo = keys[i], hi = keys[i + 1];
    if (value >= lo && value <= hi) {
      if (hi === lo) return table[lo];
      const t = (value - lo) / (hi - lo);
      return table[lo] + t * (table[hi] - table[lo]);
    }
  }
  return table[keys[keys.length - 1]];
}

/**
 * Ближайший больший номинал из стандартного ряда.
 * @param {number[]} series ряд номиналов по возрастанию
 * @param {number} value искомое значение
 * @returns {number|null} номинал либо null, если значение выходит за верх ряда
 */
export function nextStandard(series, value) {
  return series.find(v => v >= value) ?? null;
}
