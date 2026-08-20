/* EngiCalc — справочные данные по соединительным гильзам
 *
 * ВНИМАНИЕ. Каталожных данных по гильзам в проекте нет. Диапазоны сечений,
 * внутренние и наружные диаметры, длины и обозначения матриц восстановлены по
 * типовому ряду и ПОДЛЕЖАТ СВЕРКЕ с каталогом производителя (КВТ, IEK, DKC —
 * у каждого свои допуски). Номера стандартов в поле std сверяются так же.
 *
 * Всё собрано в одном файле именно затем, чтобы сверка была механической:
 * одна строка на типоразмер, код при этом не меняется. Тесты консистентности
 * в tests.html не дадут сверке внести дыры и пересечения в ряд.
 */
'use strict';

/**
 * Семейства гильз.
 * material — материал гильзы: cu (медь), al (алюминий), bi (медь-алюминий).
 */
export const SLEEVE_FAMILIES = {
  'ГМЛ': {
    material: 'cu', std: 'ГОСТ 23469.3',
    noteRu: 'Медная луженая, для опрессовки медных жил',
    noteEn: 'Tinned copper sleeve for copper conductors'
  },
  'ГМЛ-П': {
    material: 'cu', std: 'ГОСТ 23469.3',
    noteRu: 'Медная луженая с перегородкой: жилы заводятся с двух сторон встык и опрессовываются раздельно',
    noteEn: 'Tinned copper sleeve with a partition: conductors are inserted from both ends and crimped separately'
  },
  'ГАО': {
    material: 'al', std: 'ГОСТ 9581',
    noteRu: 'Алюминиевая, для опрессовки алюминиевых жил',
    noteEn: 'Aluminium sleeve for aluminium conductors'
  },
  'ГАМ': {
    material: 'bi', std: 'ТУ производителя',
    noteRu: 'Медно-алюминиевая (биметалл): единственный допустимый способ соединить медь с алюминием опрессовкой',
    noteEn: 'Bimetallic copper-to-aluminium sleeve: the only crimped joint allowed between copper and aluminium'
  }
};

/**
 * Ряд гильз.
 * sMin / sMax — диапазон СУММАРНОГО сечения скручиваемых жил, мм²;
 * dIn / dOut  — внутренний и наружный диаметр, мм;
 * len         — длина гильзы, мм;
 * die         — обозначение матрицы опрессовки;
 * std         — стандарт или ТУ.
 *
 * Диапазоны смежные: sMin следующей записи равен sMax предыдущей. Подбор берёт
 * первую подходящую по возрастанию, поэтому значение точно на границе попадает
 * в меньшую гильзу — плотнее и дешевле, при том что оно ещё в её диапазоне.
 */
export const SLEEVES = [
  { id: 'ГМЛ-1.5', family: 'ГМЛ', material: 'cu', sMin: 0.5, sMax: 1.5,  dIn: 1.8,  dOut: 4.0,  len: 15, die: 'А-1,5', std: 'ГОСТ 23469.3' },
  { id: 'ГМЛ-2.5', family: 'ГМЛ', material: 'cu', sMin: 1.5, sMax: 2.5,  dIn: 2.6,  dOut: 5.0,  len: 20, die: 'А-2,5', std: 'ГОСТ 23469.3' },
  { id: 'ГМЛ-4',   family: 'ГМЛ', material: 'cu', sMin: 2.5, sMax: 4,    dIn: 3.0,  dOut: 5.5,  len: 20, die: 'А-4',   std: 'ГОСТ 23469.3' },
  { id: 'ГМЛ-6',   family: 'ГМЛ', material: 'cu', sMin: 4,   sMax: 6,    dIn: 3.6,  dOut: 6.0,  len: 20, die: 'А-6',   std: 'ГОСТ 23469.3' },
  { id: 'ГМЛ-10',  family: 'ГМЛ', material: 'cu', sMin: 6,   sMax: 10,   dIn: 4.5,  dOut: 7.0,  len: 25, die: 'А-10',  std: 'ГОСТ 23469.3' },
  { id: 'ГМЛ-16',  family: 'ГМЛ', material: 'cu', sMin: 10,  sMax: 16,   dIn: 5.5,  dOut: 8.5,  len: 28, die: 'А-16',  std: 'ГОСТ 23469.3' },
  { id: 'ГМЛ-25',  family: 'ГМЛ', material: 'cu', sMin: 16,  sMax: 25,   dIn: 7.0,  dOut: 10.5, len: 32, die: 'А-25',  std: 'ГОСТ 23469.3' },
  { id: 'ГМЛ-35',  family: 'ГМЛ', material: 'cu', sMin: 25,  sMax: 35,   dIn: 8.2,  dOut: 12.0, len: 36, die: 'А-35',  std: 'ГОСТ 23469.3' },
  { id: 'ГМЛ-50',  family: 'ГМЛ', material: 'cu', sMin: 35,  sMax: 50,   dIn: 9.6,  dOut: 14.0, len: 40, die: 'А-50',  std: 'ГОСТ 23469.3' },
  { id: 'ГМЛ-70',  family: 'ГМЛ', material: 'cu', sMin: 50,  sMax: 70,   dIn: 11.4, dOut: 16.5, len: 45, die: 'А-70',  std: 'ГОСТ 23469.3' },
  { id: 'ГМЛ-95',  family: 'ГМЛ', material: 'cu', sMin: 70,  sMax: 95,   dIn: 13.4, dOut: 19.0, len: 50, die: 'А-95',  std: 'ГОСТ 23469.3' },
  { id: 'ГМЛ-120', family: 'ГМЛ', material: 'cu', sMin: 95,  sMax: 120,  dIn: 15.0, dOut: 21.5, len: 55, die: 'А-120', std: 'ГОСТ 23469.3' },
  { id: 'ГМЛ-150', family: 'ГМЛ', material: 'cu', sMin: 120, sMax: 150,  dIn: 16.8, dOut: 24.0, len: 60, die: 'А-150', std: 'ГОСТ 23469.3' },
  { id: 'ГМЛ-185', family: 'ГМЛ', material: 'cu', sMin: 150, sMax: 185,  dIn: 18.6, dOut: 26.5, len: 65, die: 'А-185', std: 'ГОСТ 23469.3' },
  { id: 'ГМЛ-240', family: 'ГМЛ', material: 'cu', sMin: 185, sMax: 240,  dIn: 21.2, dOut: 30.0, len: 70, die: 'А-240', std: 'ГОСТ 23469.3' },

  { id: 'ГМЛ-П-2.5', family: 'ГМЛ-П', material: 'cu', sMin: 1.5, sMax: 2.5, dIn: 2.6,  dOut: 5.0,  len: 32,  die: 'А-2,5', std: 'ГОСТ 23469.3' },
  { id: 'ГМЛ-П-4',   family: 'ГМЛ-П', material: 'cu', sMin: 2.5, sMax: 4,   dIn: 3.0,  dOut: 5.5,  len: 32,  die: 'А-4',   std: 'ГОСТ 23469.3' },
  { id: 'ГМЛ-П-6',   family: 'ГМЛ-П', material: 'cu', sMin: 4,   sMax: 6,   dIn: 3.6,  dOut: 6.0,  len: 32,  die: 'А-6',   std: 'ГОСТ 23469.3' },
  { id: 'ГМЛ-П-10',  family: 'ГМЛ-П', material: 'cu', sMin: 6,   sMax: 10,  dIn: 4.5,  dOut: 7.0,  len: 40,  die: 'А-10',  std: 'ГОСТ 23469.3' },
  { id: 'ГМЛ-П-16',  family: 'ГМЛ-П', material: 'cu', sMin: 10,  sMax: 16,  dIn: 5.5,  dOut: 8.5,  len: 45,  die: 'А-16',  std: 'ГОСТ 23469.3' },
  { id: 'ГМЛ-П-25',  family: 'ГМЛ-П', material: 'cu', sMin: 16,  sMax: 25,  dIn: 7.0,  dOut: 10.5, len: 50,  die: 'А-25',  std: 'ГОСТ 23469.3' },
  { id: 'ГМЛ-П-35',  family: 'ГМЛ-П', material: 'cu', sMin: 25,  sMax: 35,  dIn: 8.2,  dOut: 12.0, len: 58,  die: 'А-35',  std: 'ГОСТ 23469.3' },
  { id: 'ГМЛ-П-50',  family: 'ГМЛ-П', material: 'cu', sMin: 35,  sMax: 50,  dIn: 9.6,  dOut: 14.0, len: 64,  die: 'А-50',  std: 'ГОСТ 23469.3' },
  { id: 'ГМЛ-П-70',  family: 'ГМЛ-П', material: 'cu', sMin: 50,  sMax: 70,  dIn: 11.4, dOut: 16.5, len: 72,  die: 'А-70',  std: 'ГОСТ 23469.3' },
  { id: 'ГМЛ-П-95',  family: 'ГМЛ-П', material: 'cu', sMin: 70,  sMax: 95,  dIn: 13.4, dOut: 19.0, len: 80,  die: 'А-95',  std: 'ГОСТ 23469.3' },
  { id: 'ГМЛ-П-120', family: 'ГМЛ-П', material: 'cu', sMin: 95,  sMax: 120, dIn: 15.0, dOut: 21.5, len: 88,  die: 'А-120', std: 'ГОСТ 23469.3' },
  { id: 'ГМЛ-П-150', family: 'ГМЛ-П', material: 'cu', sMin: 120, sMax: 150, dIn: 16.8, dOut: 24.0, len: 96,  die: 'А-150', std: 'ГОСТ 23469.3' },
  { id: 'ГМЛ-П-185', family: 'ГМЛ-П', material: 'cu', sMin: 150, sMax: 185, dIn: 18.6, dOut: 26.5, len: 104, die: 'А-185', std: 'ГОСТ 23469.3' },
  { id: 'ГМЛ-П-240', family: 'ГМЛ-П', material: 'cu', sMin: 185, sMax: 240, dIn: 21.2, dOut: 30.0, len: 112, die: 'А-240', std: 'ГОСТ 23469.3' },

  { id: 'ГАО-16',  family: 'ГАО', material: 'al', sMin: 10,  sMax: 16,  dIn: 5.6,  dOut: 9.5,  len: 30, die: 'А-16',  std: 'ГОСТ 9581' },
  { id: 'ГАО-25',  family: 'ГАО', material: 'al', sMin: 16,  sMax: 25,  dIn: 7.1,  dOut: 11.5, len: 34, die: 'А-25',  std: 'ГОСТ 9581' },
  { id: 'ГАО-35',  family: 'ГАО', material: 'al', sMin: 25,  sMax: 35,  dIn: 8.4,  dOut: 13.0, len: 38, die: 'А-35',  std: 'ГОСТ 9581' },
  { id: 'ГАО-50',  family: 'ГАО', material: 'al', sMin: 35,  sMax: 50,  dIn: 9.8,  dOut: 15.0, len: 42, die: 'А-50',  std: 'ГОСТ 9581' },
  { id: 'ГАО-70',  family: 'ГАО', material: 'al', sMin: 50,  sMax: 70,  dIn: 11.6, dOut: 17.5, len: 48, die: 'А-70',  std: 'ГОСТ 9581' },
  { id: 'ГАО-95',  family: 'ГАО', material: 'al', sMin: 70,  sMax: 95,  dIn: 13.6, dOut: 20.0, len: 54, die: 'А-95',  std: 'ГОСТ 9581' },
  { id: 'ГАО-120', family: 'ГАО', material: 'al', sMin: 95,  sMax: 120, dIn: 15.2, dOut: 22.5, len: 58, die: 'А-120', std: 'ГОСТ 9581' },
  { id: 'ГАО-150', family: 'ГАО', material: 'al', sMin: 120, sMax: 150, dIn: 17.0, dOut: 25.0, len: 64, die: 'А-150', std: 'ГОСТ 9581' },
  { id: 'ГАО-185', family: 'ГАО', material: 'al', sMin: 150, sMax: 185, dIn: 18.8, dOut: 27.5, len: 70, die: 'А-185', std: 'ГОСТ 9581' },
  { id: 'ГАО-240', family: 'ГАО', material: 'al', sMin: 185, sMax: 240, dIn: 21.4, dOut: 31.0, len: 76, die: 'А-240', std: 'ГОСТ 9581' },

  { id: 'ГАМ-16',  family: 'ГАМ', material: 'bi', sMin: 10,  sMax: 16,  dIn: 5.6,  dOut: 9.5,  len: 50,  die: 'А-16',  std: 'ТУ производителя' },
  { id: 'ГАМ-25',  family: 'ГАМ', material: 'bi', sMin: 16,  sMax: 25,  dIn: 7.1,  dOut: 11.5, len: 56,  die: 'А-25',  std: 'ТУ производителя' },
  { id: 'ГАМ-35',  family: 'ГАМ', material: 'bi', sMin: 25,  sMax: 35,  dIn: 8.4,  dOut: 13.0, len: 62,  die: 'А-35',  std: 'ТУ производителя' },
  { id: 'ГАМ-50',  family: 'ГАМ', material: 'bi', sMin: 35,  sMax: 50,  dIn: 9.8,  dOut: 15.0, len: 68,  die: 'А-50',  std: 'ТУ производителя' },
  { id: 'ГАМ-70',  family: 'ГАМ', material: 'bi', sMin: 50,  sMax: 70,  dIn: 11.6, dOut: 17.5, len: 76,  die: 'А-70',  std: 'ТУ производителя' },
  { id: 'ГАМ-95',  family: 'ГАМ', material: 'bi', sMin: 70,  sMax: 95,  dIn: 13.6, dOut: 20.0, len: 84,  die: 'А-95',  std: 'ТУ производителя' },
  { id: 'ГАМ-120', family: 'ГАМ', material: 'bi', sMin: 95,  sMax: 120, dIn: 15.2, dOut: 22.5, len: 92,  die: 'А-120', std: 'ТУ производителя' },
  { id: 'ГАМ-150', family: 'ГАМ', material: 'bi', sMin: 120, sMax: 150, dIn: 17.0, dOut: 25.0, len: 100, die: 'А-150', std: 'ТУ производителя' },
  { id: 'ГАМ-185', family: 'ГАМ', material: 'bi', sMin: 150, sMax: 185, dIn: 18.8, dOut: 27.5, len: 108, die: 'А-185', std: 'ТУ производителя' },
  { id: 'ГАМ-240', family: 'ГАМ', material: 'bi', sMin: 185, sMax: 240, dIn: 21.4, dOut: 31.0, len: 116, die: 'А-240', std: 'ТУ производителя' }
];

/**
 * Доля габарита жилы, занятая металлом, по классу гибкости (ГОСТ 22483).
 *
 * Монолитная жила (класс 1) — сплошной круг, её габарит равен сечению.
 * Многопроволочная того же сечения толще: между проволоками остаются пустоты,
 * и чем тоньше проволока, тем их больше. Величины приблизительные и входят
 * в тот же периметр сверки, что и ряд выше.
 */
export const FLEX_FILL = { 1: 1.0, 2: 0.77, 5: 0.70, 6: 0.65 };

/**
 * Пороги заполнения канала гильзы, %.
 *
 * loose — ниже него гильза великовата: жилы болтаются, при опрессовке гильза
 *         сминается, а плотного контакта не получается. Лечится добивкой
 *         проволокой того же металла.
 * tight — выше него гильза на верхней границе применимости: собрать соединение
 *         можно, но проверить по каталогу производителя стоит.
 * over  — 100 %: жилы занимают больше площади канала, чем в нём есть. Не
 *         «плотно», а физически не помещаются — нужен следующий типоразмер.
 *
 * Верхняя граница ряда рассчитана на одну жилу номинального сечения, и для
 * гибкой жилы класса 5 заполнение там доходит до 95 %. Поэтому «плотно»
 * начинается с 90 %, а «не влезет» — только за 100 %.
 */
export const FILL_LIMITS = { loose: 60, tight: 90, over: 100 };
