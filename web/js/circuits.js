/* EngiCalc — SVG-схемы примеров применения (ГОСТ ЕСКД, тип Э3).
 *
 * Правило файла: КООРДИНАТЫ ВЫВОДОВ НЕ ПИШУТСЯ РУКАМИ. Любая связь строится
 * от s.pin(ref, name) — тогда провод не может «промахнуться» мимо вывода УГО.
 * Все линии связи ортогональны (ГОСТ 2.702), точки соединения ставятся только
 * там, где сходятся три и более проводника.
 */

const { Schematic } = window.GostSchematic || {};

const THEME = {
  dark: { stroke: '#C8CED6', background: '#1E2128' },
  light: { stroke: '#1A2230', background: '#FFFFFF' }
};

function getTheme() {
  return document.documentElement.getAttribute('data-theme') === 'light' ? THEME.light : THEME.dark;
}

/* ===================== ХЕЛПЕРЫ РАЗВОДКИ ===================== */

/** Горизонтальная шина питания/земли. */
function bus(s, x1, x2, y) { s.wire([[x1, y], [x2, y]]); }

/** Вывод — вертикально до горизонтальной шины, с точкой соединения. */
function toBus(s, pin, y) {
  s.wire([pin, [pin[0], y]]);
  s.junction(pin[0], y);
}

/** Ортогональная связь двух выводов: сначала по X, затем по Y. */
function linkH(s, a, b) { s.wire([a, [b[0], a[1]], b]); }

/** Ортогональная связь двух выводов: сначала по Y, затем по X. */
function linkV(s, a, b) { s.wire([a, [a[0], b[1]], b]); }

/** Связь по явно заданным промежуточным точкам. */
function route(s, ...pts) { s.wire(pts); }

/* ===================== УГО NE555 ===================== */

/**
 * Прямоугольное УГО таймера (ГОСТ 2.743): выводы по функциональному назначению.
 * Возвращает функцию доступа к выводам: p('7') → [x, y].
 */
function ne555(s, ref, cx, cy) {
  s.box(ref, cx, cy, {
    w: 30, h: 40, label: 'NE555',
    top:    [{ name: '8', x: -8, label: '8' }, { name: '4', x: 8, label: '4' }],
    bottom: [{ name: '1', x: 0, label: '1' }],
    left:   [{ name: '7', y: -10, label: '7' }, { name: '6', y: 0, label: '6' }, { name: '2', y: 10, label: '2' }],
    right:  [{ name: '3', y: -10, label: '3' }, { name: '5', y: 10, label: '5' }],
  });
  return name => s.pin(ref, name);
}

/**
 * Типовой автоколебательный узел на NE555 (общий для генератора, метронома,
 * датчика темноты и сенсорного выключателя).
 *
 * Времязадающая цепочка стоит колонкой слева от корпуса: R1 — от «+» до вывода 7,
 * R2 — между выводом 7 и узлом порога, C1 — от узла порога на землю.
 * Возвращает доступ к выводам таймера, чтобы вызывающий добавил выходной каскад.
 */
function build555(s, cfg) {
  const { ref = 'DA1', cx, vcc, gnd, r1, r2, c1, ctrlCap, suffix = '' } = cfg;
  const p = ne555(s, ref, cx, 60);
  const col = cx - 50;                       // ось времязадающей колонки

  s.resistor('R1' + suffix, col, 35, { rotate: 90, value: r1.value, showRef: true });
  const rTop = { a: s.pin('R1' + suffix, 'a'), b: s.pin('R1' + suffix, 'b') };

  if (r2.variable) s.resistorVar('R2' + suffix, col, 65, { rotate: 90, value: r2.value });
  else s.resistor('R2' + suffix, col, 65, { rotate: 90, value: r2.value });
  const rBot = { a: s.pin('R2' + suffix, 'a'), b: s.pin('R2' + suffix, 'b') };
  // Движок переменного резистора замыкаем на вывод — иначе это незадействованный
  // вывод УГО, а по схеме нужен реостат.
  if (r2.variable) {
    const w = s.pin('R2' + suffix, 'w');
    route(s, w, [w[0], rBot.a[1]], rBot.a);
    s.junction(rBot.a[0], rBot.a[1]);
  }

  s.capacitor('C1' + suffix, col, 95, { rotate: 90, value: c1.value });
  const cap = { a: s.pin('C1' + suffix, 'a'), b: s.pin('C1' + suffix, 'b') };

  // Питание таймера
  toBus(s, rTop.a, vcc);
  toBus(s, p('8'), vcc);
  toBus(s, p('4'), vcc);
  toBus(s, p('1'), gnd);

  // Узел разряда: R1.b — R2.a — вывод 7
  s.wire([rTop.b, rBot.a]);
  const nodeA = [col, (rTop.b[1] + rBot.a[1]) / 2];
  s.wire([nodeA, p('7')]);
  s.junction(nodeA[0], nodeA[1]);

  // Узел порога: R2.b — C1.a — выводы 6 и 2
  s.wire([rBot.b, cap.a]);
  const nodeB = [col, cap.a[1] - 5];
  const lane = cx - 35;                      // вертикальная «дорожка» к выводам 6 и 2
  route(s, p('2'), [lane, p('2')[1]], [lane, nodeB[1]], nodeB);
  s.junction(nodeB[0], nodeB[1]);
  route(s, p('6'), [lane, p('6')[1]], [lane, p('2')[1]]);
  s.junction(lane, p('2')[1]);

  toBus(s, cap.b, gnd);

  // Конденсатор на выводе 5 (управление порогом) ставится не во всех схемах
  if (ctrlCap) {
    s.capacitor('C2' + suffix, cx + 40, 90, { rotate: 90, value: ctrlCap });
    route(s, p('5'), [cx + 40, p('5')[1]], s.pin('C2' + suffix, 'a'));
    toBus(s, s.pin('C2' + suffix, 'b'), gnd);
  }
  return p;
}

/** Выходной каскад «резистор + светодиод» от вывода 3 до земли. */
function ledOutput(s, p, x, gnd, rValue) {
  s.resistor('R3', x, 60, { rotate: 90, value: rValue });
  s.led('HL1', x, 90, { rotate: 90 });
  s.wire([p('3'), s.pin('R3', 'a')]);
  s.wire([s.pin('R3', 'b'), s.pin('HL1', 'a')]);
  toBus(s, s.pin('HL1', 'b'), gnd);
}

/* ===================== 555: ГЕНЕРАТОР ===================== */
function circuit555Astable() {
  const t = getTheme();
  const s = new Schematic({ width: 200, height: 134, pad: 12, background: t.background, stroke: t.stroke });
  const VCC = 20, GND = 110, X0 = 25, X1 = 178;

  bus(s, X0, X1, VCC); s.text(X0, VCC - 3, '+V', 'start');
  bus(s, X0, X1, GND); s.ground(X0, GND + 5, { lead: 5 });

  const p = build555(s, {
    cx: 100, vcc: VCC, gnd: GND,
    r1: { value: '1 к' }, r2: { value: '10 к' }, c1: { value: '100 н' },
    ctrlCap: '10 н',
  });
  ledOutput(s, p, 170, GND, '1 к');

  s.text(60, 128, 'f = 1,44 / ((R1 + 2·R2)·C1)', 'start');
  return s.toSVG();
}

/* ===================== 555: МЕТРОНОМ ===================== */
function circuit555Metronome() {
  const t = getTheme();
  const s = new Schematic({ width: 210, height: 134, pad: 12, background: t.background, stroke: t.stroke });
  const VCC = 20, GND = 110, X0 = 25, X1 = 185;

  bus(s, X0, X1, VCC); s.text(X0, VCC - 3, '+9 В', 'start');
  bus(s, X0, X1, GND); s.ground(X0, GND + 5, { lead: 5 });

  const p = build555(s, {
    cx: 95, vcc: VCC, gnd: GND,
    r1: { value: '1 к' }, r2: { value: '250 к', variable: true }, c1: { value: '22 мк' },
    ctrlCap: '10 н',
  });

  // Выход через разделительный конденсатор на излучатель
  s.capacitor('C3', 140, 50, { value: '22 мк' });
  s.speaker('BA1', 180, 60);
  s.wire([p('3'), s.pin('C3', 'a')]);
  linkH(s, s.pin('C3', 'b'), s.pin('BA1', 'a'));
  route(s, s.pin('BA1', 'b'), [165, s.pin('BA1', 'b')[1]], [165, GND]);
  s.junction(165, GND);

  s.text(55, 128, 'f = 1,44 / ((R1 + 2·R2)·C1)', 'start');
  return s.toSVG();
}

/* ===================== 555: ШИМ-РЕГУЛЯТОР ===================== */
function circuit555PWM() {
  const t = getTheme();
  const s = new Schematic({ width: 215, height: 150, pad: 12, background: t.background, stroke: t.stroke });
  const VCC = 20, GND = 125, X0 = 25, X1 = 195;

  bus(s, X0, X1, VCC); s.text(X0, VCC - 3, '+12 В', 'start');
  bus(s, X0, X1, GND); s.ground(X0, GND + 5, { lead: 5 });

  const p = ne555(s, 'DA1', 105, 60);

  // Заряд и разряд идут разными путями — этим и регулируется скважность.
  s.resistor('R1', 35, 32, { rotate: 90, value: '1 к' });
  s.diode('VD1', 35, 60, { rotate: 90 });                 // путь заряда: узел A → узел T
  s.resistorVar('VR1', 60, 60, { rotate: 90, value: '100 к' });
  const vrW = () => s.pin('VR1', 'w');
  s.diode('VD2', 60, 88, { rotate: 270 });                // путь разряда: узел T → узел A
  s.capacitor('C1', 90, 110, { rotate: 90, value: '10 н' });

  const nodeAy = 45, nodeTy = 100, lane = 75;

  toBus(s, s.pin('R1', 'a'), VCC);
  // Узел A: R1.b — анод VD1 — VR1 — вывод 7
  route(s, s.pin('R1', 'b'), [35, nodeAy], [105 - 20, nodeAy], p('7'));
  s.junction(35, nodeAy);
  s.wire([[35, nodeAy], s.pin('VD1', 'a')]);
  route(s, [60, nodeAy], s.pin('VR1', 'a'));
  s.junction(60, nodeAy);
  // Движок VR1 на верхний вывод — реостат
  route(s, vrW(), [vrW()[0], s.pin('VR1', 'a')[1]], s.pin('VR1', 'a'));
  s.junction(...s.pin('VR1', 'a'));

  // Узел T: катод VD1 — анод VD2 — выводы 6 и 2 — C1
  s.wire([s.pin('VR1', 'b'), s.pin('VD2', 'b')]);
  route(s, s.pin('VD1', 'b'), [35, nodeTy], [90, nodeTy], s.pin('C1', 'a'));
  route(s, s.pin('VD2', 'a'), [60, nodeTy]);
  s.junction(60, nodeTy);
  route(s, p('2'), [lane, p('2')[1]], [lane, nodeTy]);
  s.junction(lane, nodeTy);
  route(s, p('6'), [lane, p('6')[1]], [lane, p('2')[1]]);
  s.junction(lane, p('2')[1]);

  toBus(s, s.pin('C1', 'b'), GND);
  toBus(s, p('1'), GND);
  toBus(s, p('8'), VCC);
  toBus(s, p('4'), VCC);

  // Развязка вывода 5
  s.capacitor('C2', 145, 95, { rotate: 90, value: '10 н' });
  route(s, p('5'), [145, p('5')[1]], s.pin('C2', 'a'));
  toBus(s, s.pin('C2', 'b'), GND);

  // Выходной каскад: ключ на транзисторе и двигатель
  s.resistor('R2', 150, 50, { value: '1 к' });
  s.transistor('VT1', 185, 75, { type: 'npn' });
  s.machine('M1', 185, 40, { letter: 'M' });
  s.wire([p('3'), s.pin('R2', 'a')]);
  linkV(s, s.pin('R2', 'b'), s.pin('VT1', 'b'));
  // Коллектор смещён по X относительно оси двигателя — ведём с изломом 90°.
  route(s, s.pin('VT1', 'c'), [s.pin('VT1', 'c')[0], 58], [s.pin('M1', 'b')[0], 58], s.pin('M1', 'b'));
  toBus(s, s.pin('M1', 'a'), VCC);
  toBus(s, s.pin('VT1', 'e'), GND);

  s.text(60, 143, 'Скважность задаётся VR1: заряд через VD1, разряд через VD2', 'start');
  return s.toSVG();
}

/* ===================== 555: ДАТЧИК ТЕМНОТЫ ===================== */
function circuit555Dark() {
  const t = getTheme();
  const s = new Schematic({ width: 200, height: 134, pad: 12, background: t.background, stroke: t.stroke });
  const VCC = 20, GND = 110, X0 = 25, X1 = 178;

  bus(s, X0, X1, VCC); s.text(X0, VCC - 3, '+9 В', 'start');
  bus(s, X0, X1, GND); s.ground(X0, GND + 5, { lead: 5 });

  const p = build555(s, {
    cx: 100, vcc: VCC, gnd: GND,
    r1: { value: '10 к' }, r2: { value: 'RK1 (LDR)' }, c1: { value: '10 мк' },
    ctrlCap: '10 н',
  });
  ledOutput(s, p, 170, GND, '330');

  s.text(45, 128, 'Освещённость падает → сопротивление RK1 растёт → генерация', 'start');
  return s.toSVG();
}

/* ===================== 555: СЕНСОРНЫЙ ВЫКЛЮЧАТЕЛЬ ===================== */
function circuit555Touch() {
  const t = getTheme();
  const s = new Schematic({ width: 200, height: 134, pad: 12, background: t.background, stroke: t.stroke });
  const VCC = 20, GND = 110, X0 = 25, X1 = 178;

  bus(s, X0, X1, VCC); s.text(X0, VCC - 3, '+9 В', 'start');
  bus(s, X0, X1, GND); s.ground(X0, GND + 5, { lead: 5 });

  const p = build555(s, {
    cx: 100, vcc: VCC, gnd: GND,
    r1: { value: '10 М' }, r2: { value: '100 к' }, c1: { value: '100 н' },
    ctrlCap: '10 н',
  });
  ledOutput(s, p, 170, GND, '330');

  // Сенсорная пластина подключается к узлу порога (вывод 2)
  s.wire([[50, 80], [30, 80], [30, 70]]);
  s.junction(50, 80);
  s.wire([[26, 68], [34, 68]]);            // пластина
  s.text(30, 64, 'E1', 'middle');

  s.text(45, 128, 'Наводка с пластины E1 запускает таймер по выводу 2', 'start');
  return s.toSVG();
}

/* ===================== 555: СИРЕНА (ДВА ТАЙМЕРА) ===================== */
function circuit555Siren() {
  const t = getTheme();
  const s = new Schematic({ width: 330, height: 152, pad: 12, background: t.background, stroke: t.stroke });
  const VCC = 20, GND = 125, X0 = 25, X1 = 310;

  bus(s, X0, X1, VCC); s.text(X0, VCC - 3, '+9 В', 'start');
  bus(s, X0, X1, GND); s.ground(X0, GND + 5, { lead: 5 });

  // DA1 — медленный модулятор
  const p1 = build555(s, {
    ref: 'DA1', cx: 95, vcc: VCC, gnd: GND, suffix: '',
    r1: { value: '10 к' }, r2: { value: '100 к' }, c1: { value: '10 мк' },
    ctrlCap: '10 н',
  });

  // DA2 — тональный генератор, порог которого качает DA1
  const p2 = build555(s, {
    ref: 'DA2', cx: 245, vcc: VCC, gnd: GND, suffix: 'b',
    r1: { value: '1 к' }, r2: { value: '100 к' }, c1: { value: '10 н' },
  });

  // Модуляция: выход DA1 → R5 → вывод 5 DA2 (пересечения без точек — связи нет)
  s.resistor('R5', 140, 50, { value: '10 к' });
  s.wire([p1('3'), s.pin('R5', 'a')]);
  route(s, s.pin('R5', 'b'), [160, 50], [160, 112], [285, 112], [285, p2('5')[1]], p2('5'));

  // Выход DA2 через разделительный конденсатор на излучатель
  s.capacitor('C3', 285, 50, { value: '100 мк' });
  s.speaker('BA1', 315, 60);
  s.wire([p2('3'), s.pin('C3', 'a')]);
  linkH(s, s.pin('C3', 'b'), s.pin('BA1', 'a'));
  route(s, s.pin('BA1', 'b'), [303, s.pin('BA1', 'b')[1]], [303, GND]);
  s.junction(303, GND);

  s.text(45, 145, 'DA1 — модулятор ≈0,7 Гц; DA2 — тон, частота качается по выводу 5', 'start');
  return s.toSVG();
}

/* ===================== ОУ: ПОВТОРИТЕЛЬ ===================== */
function circuitOpampBuffer() {
  const t = getTheme();
  const s = new Schematic({ width: 125, height: 66, pad: 12, background: t.background, stroke: t.stroke });

  s.opamp('DA1', 60, 35);
  const inv = s.pin('DA1', 'in-'), non = s.pin('DA1', 'in+'), out = s.pin('DA1', 'out');

  // Вход — на неинвертирующий вывод, выход заведён на инвертирующий (K = 1).
  s.wire([[25, non[1]], non]);
  s.text(23, non[1] + 1, 'Vin', 'end');

  route(s, out, [88, out[1]], [88, 16], [36, 16], [36, inv[1]], inv);
  s.wire([[88, out[1]], [110, out[1]]]);
  s.junction(88, out[1]);
  s.text(112, out[1] + 1, 'Vout', 'start');

  s.text(60, 58, 'K = 1, Rвх → ∞, Rвых → 0', 'middle');
  return s.toSVG();
}

/* ===================== ОУ: ФИЛЬТР НЧ ===================== */
function circuitOpampLPF() {
  const t = getTheme();
  const s = new Schematic({ width: 165, height: 100, pad: 12, background: t.background, stroke: t.stroke });

  s.resistor('R1', 50, 50, { value: 'R' });
  s.capacitor('C1', 70, 65, { rotate: 90, value: 'C' });
  s.opamp('DA1', 100, 45);
  const inv = s.pin('DA1', 'in-'), non = s.pin('DA1', 'in+'), out = s.pin('DA1', 'out');

  s.wire([[25, 50], s.pin('R1', 'a')]);
  s.text(23, 51, 'Vin', 'end');

  // RC-звено, затем повторитель — отсюда fc = 1/(2π·R·C)
  s.wire([s.pin('R1', 'b'), non]);
  s.wire([[70, 50], s.pin('C1', 'a')]);
  s.junction(70, 50);
  s.ground(70, 84, { lead: 5 });
  s.wire([s.pin('C1', 'b'), [70, 79]]);

  route(s, out, [130, out[1]], [130, 24], [78, 24], [78, inv[1]], inv);
  s.wire([[130, out[1]], [150, out[1]]]);
  s.junction(130, out[1]);
  s.text(152, out[1] + 1, 'Vout', 'start');

  s.text(82, 94, 'fc = 1 / (2π·R·C)', 'middle');
  return s.toSVG();
}

/* ===================== ОУ: КОМПАРАТОР ===================== */
function circuitOpampComparator() {
  const t = getTheme();
  const s = new Schematic({ width: 165, height: 130, pad: 12, background: t.background, stroke: t.stroke });
  const VCC = 20, GND = 110, X0 = 25, X1 = 145;

  bus(s, X0, X1, VCC); s.text(X0, VCC - 3, '+9 В', 'start');
  bus(s, X0, X1, GND); s.ground(X0, GND + 5, { lead: 5 });

  // Опорное напряжение — с делителя R1/R2
  s.resistor('R1', 40, 35, { rotate: 90, value: '10 к' });
  s.resistor('R2', 40, 70, { rotate: 90, value: '10 к' });
  toBus(s, s.pin('R1', 'a'), VCC);
  s.wire([s.pin('R1', 'b'), s.pin('R2', 'a')]);
  toBus(s, s.pin('R2', 'b'), GND);

  s.opamp('DA1', 85, 55);
  const inv = s.pin('DA1', 'in-'), non = s.pin('DA1', 'in+'), out = s.pin('DA1', 'out');

  s.wire([[40, inv[1]], inv]);
  s.junction(40, inv[1]);
  s.text(52, inv[1] - 2, 'Vref', 'start');

  s.wire([[52, non[1]], non]);
  s.text(50, non[1] + 1, 'Vin', 'end');

  s.resistor('R3', 125, 70, { rotate: 90, value: '330' });
  s.led('HL1', 125, 95, { rotate: 90 });
  route(s, out, [125, out[1]], s.pin('R3', 'a'));
  s.wire([s.pin('R3', 'b'), s.pin('HL1', 'a')]);
  toBus(s, s.pin('HL1', 'b'), GND);

  s.text(80, 124, 'Vin > Vref → на выходе высокий уровень, HL1 светится', 'middle');
  return s.toSVG();
}

/* ===================== ЭКСПОРТ ===================== */
export const CIRCUITS = {
  '555-astable': { title: 'Астабильный режим (генератор)', desc: 'NE555 генерирует прямоугольные импульсы.', svg: circuit555Astable, components: ['NE555', 'R1=1К', 'R2=10К', 'C1=100н', 'R3=1К', 'HL1'] },
  '555-metronome': { title: 'Метроном', desc: 'Ритмичные щелчки в излучателе, темп задаётся VR1.', svg: circuit555Metronome, components: ['NE555', 'R1=1К', 'VR1=250К', 'C1=22мк', 'C2=22мк', 'BA1'] },
  '555-pwm': { title: 'ШИМ-регулятор мотора', desc: 'Заряд и разряд идут разными путями — VR1 задаёт скважность.', svg: circuit555PWM, components: ['NE555', 'VR1=100К', 'VD1, VD2', 'C1=10н', 'VT1', 'M1'] },
  '555-dark': { title: 'Датчик темноты', desc: 'Фоторезистор в времязадающей цепи запускает генерацию в темноте.', svg: circuit555Dark, components: ['NE555', 'RK1 (LDR)', 'R1=10К', 'C1=10мк', 'R3=330', 'HL1'] },
  '555-touch': { title: 'Сенсорный выключатель', desc: 'Наводка с пластины E1 запускает таймер по выводу 2.', svg: circuit555Touch, components: ['NE555', 'E1', 'R1=10М', 'R2=100К', 'C1=100н', 'R3=330', 'HL1'] },
  '555-siren': { title: 'Полицейская сирена', desc: 'DA1 качает порог DA2 через вывод 5.', svg: circuit555Siren, components: ['2× NE555', 'R1=10К', 'R2=100К', 'R5=10К', 'C1=10мк', 'C3=100мк', 'BA1'] },
  'opamp-buffer': { title: 'Повторитель напряжения', desc: 'K=1, Rвх→∞, Rвых→0.', svg: circuitOpampBuffer, components: ['ОУ'] },
  'opamp-lpf': { title: 'Активный фильтр НЧ', desc: 'RC-звено на входе повторителя, fc = 1/(2πRC).', svg: circuitOpampLPF, components: ['ОУ', 'R', 'C'] },
  'opamp-comparator': { title: 'Компаратор', desc: 'Vin > Vref → HL1 светится.', svg: circuitOpampComparator, components: ['ОУ', 'R1=10К', 'R2=10К', 'R3=330', 'HL1'] }
};

export function renderCircuit(id) {
  const c = CIRCUITS[id];
  if (!c) return '<p>Схема не найдена</p>';

  // Библиотека УГО грузится отдельным классическим скриптом. Если он не
  // доехал, s.svg() бросит TypeError прямо в обработчике клика — сообщаем
  // об этом так же, как это делает редактор схем.
  let svg;
  try {
    if (!Schematic) throw new Error('GostSchematic не загружен');
    svg = c.svg();
  } catch {
    svg = '<p class="editor-empty">Библиотека условных обозначений не загружена</p>';
  }

  return `
    <div style="margin-bottom:16px">
      <h3 style="color:var(--accent);margin-bottom:8px;font-size:18px">${c.title}</h3>
      <p style="color:var(--text-muted);font-size:13px;margin-bottom:16px">${c.desc}</p>
    </div>
    <div style="background:var(--bg-input);border-radius:var(--r-input);padding:24px;margin-bottom:16px;display:flex;justify-content:center;overflow-x:auto">
      ${svg}
    </div>
    <div class="formula-panel" style="margin:0">
      <div class="title">Компоненты</div>
      <div style="font-size:13px;color:var(--text);line-height:1.8">${c.components.join(' · ')}</div>
    </div>
  `;
}

/**
 * Перерисовать уже показанные схемы.
 *
 * Цвета УГО зашиты в разметку SVG в момент построения, поэтому смена темы
 * сама по себе их не меняет — схема оставалась с тёмным фоном на светлой теме.
 */
export function refreshCircuits() {
  document.querySelectorAll('[id^="circuit-display"]').forEach(host => {
    const id = host.dataset.circuit;
    if (id && CIRCUITS[id]) host.innerHTML = renderCircuit(id);
  });
}
