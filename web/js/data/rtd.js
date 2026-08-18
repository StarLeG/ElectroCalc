/* EngiCalc — термопреобразователи сопротивления (Pt100 / Pt500 / Pt1000)
 *
 * Уравнение Каллендара — Ван Дюзена, ГОСТ 6651 / IEC 60751, α = 0.00385.
 * Модуль общий для двух страниц: «КИПиА → RTD» и «КИПиА → Таблица RTD»,
 * которые раньше считали одно и то же двумя разными способами.
 */
'use strict';

/** Коэффициенты уравнения. C работает только ниже 0 °C. */
export const RTD_A = 3.9083e-3;
export const RTD_B = -5.775e-7;
export const RTD_C = -4.183e-12;

/** Рабочий диапазон платиновых термосопротивлений, °C. */
export const RTD_RANGE = [-200, 850];

/**
 * Номинальное сопротивление при 0 °C по названию типа.
 * @param {string} type 'Pt100' | 'Pt500' | 'Pt1000'
 * @returns {number} R0, Ом
 */
export function rtdR0(type) {
  return type === 'Pt1000' ? 1000 : type === 'Pt500' ? 500 : 100;
}

/**
 * Сопротивление при заданной температуре.
 *
 * Ниже нуля добавляется член C·(t−100)·t³: без него на −200 °C ошибка
 * доходит до нескольких градусов, а именно там термосопротивления и работают
 * чаще всего.
 *
 * @param {number} R0 номинал при 0 °C, Ом
 * @param {number} t температура, °C
 * @returns {number} сопротивление, Ом
 */
export function rtdResistance(R0, t) {
  const base = 1 + RTD_A * t + RTD_B * t * t;
  return t < 0
    ? R0 * (base + RTD_C * (t - 100) * t * t * t)
    : R0 * base;
}

/**
 * Температура по измеренному сопротивлению.
 *
 * Выше 0 °C уравнение квадратное и решается точно. Ниже — четвёртой степени,
 * поэтому корень уточняется делением отрезка пополам: функция строго
 * возрастает, значит сходимость гарантирована.
 *
 * @param {number} R0 номинал при 0 °C, Ом
 * @param {number} R измеренное сопротивление, Ом
 * @returns {number} температура, °C
 */
export function rtdTemperature(R0, R) {
  if (R >= R0) {
    return (-R0 * RTD_A + Math.sqrt(R0 * R0 * RTD_A * RTD_A - 4 * R0 * RTD_B * (R0 - R)))
      / (2 * R0 * RTD_B);
  }
  let lo = RTD_RANGE[0], hi = 0;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (rtdResistance(R0, mid) < R) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}
