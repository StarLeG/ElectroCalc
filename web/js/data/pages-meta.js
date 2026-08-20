/* EngiCalc — единый список разделов
 *
 * Источник правды для генератора страниц, витрины на главной и карты сайта.
 * Раздел, которого здесь нет, не получит ни собственного адреса, ни строки
 * в sitemap.xml — генератор останавливается с ошибкой, а не выпускает
 * страницу без описания.
 *
 * id       — совпадает с id="page-<id>" в разметке и со старым якорем;
 *            он же становится адресом: /cable/, /power/;
 * group    — группа меню, из неё строится витрина;
 * title    — заголовок страницы; в <title> к нему добавляется « — EngiCalc»;
 * desc     — описание для <meta name="description">, 120–160 символов:
 *            короче не даёт поиску материала, длиннее обрезается в выдаче;
 * priority — вес в карте сайта;
 * related  — что человек открывает следующим: связи по ходу работы,
 *            а не по тематической близости. Из них строится блок
 *            «Смотрите также» под калькулятором.
 *
 * Названия групп и короткие подписи меню живут в словарях core.js: дублировать
 * их здесь значило бы держать два источника одного текста.
 */
'use strict';

export const PAGES = [
  // ===== ЭЛЕКТРИКА =====
  {
    id: 'power', group: 'electrical', priority: 0.9,
    related: ['cable', 'voltage', 'threephase', 'motor'],
    titleRu: 'Расчёт тока по мощности: 1 и 3 фазы',
    titleEn: 'Load current from power: single and three phase',
    descRu: 'Онлайн-расчёт тока нагрузки по мощности для сети 220 и 380 В с учётом cos φ и КПД. Формула и пункт ПУЭ показаны рядом с результатом.',
    descEn: 'Load current from power for 230 V and 400 V systems, with power factor and efficiency. Formula and standard shown next to the result.',
  },
  {
    id: 'cable', group: 'electrical', priority: 1.0,
    related: ['voltage', 'derating', 'kzcable', 'protection'],
    titleRu: 'Подбор сечения кабеля по току, потере напряжения и КЗ',
    titleEn: 'Cable sizing by current, voltage drop and short circuit',
    descRu: 'Расчёт сечения кабеля сразу по трём критериям: нагрев, потеря напряжения, термостойкость к КЗ. Поправки на прокладку, температуру и число жил.',
    descEn: 'Cable cross-section by three criteria at once: heating, voltage drop and short-circuit withstand, with derating for installation and temperature.',
  },
  {
    id: 'voltage', group: 'electrical', priority: 0.9,
    related: ['cable', 'cableloss', 'power', 'dcvdrop'],
    titleRu: 'Потери напряжения в кабельной линии',
    titleEn: 'Voltage drop in a cable line',
    descRu: 'Расчёт падения напряжения по длине линии, сечению и току с учётом cos φ. Проверка допустимых 3 % для освещения и 5 % для силовых цепей.',
    descEn: 'Voltage drop from line length, cross-section and current with power factor. Checks the 3 % and 5 % limits for lighting and power circuits.',
  },
  {
    id: 'shortcircuit', group: 'electrical', priority: 0.8,
    related: ['kzcable', 'protection', 'arcflash', 'grounding'],
    titleRu: 'Ток короткого замыкания в сети 0,4 кВ',
    titleEn: 'Short-circuit current in a 400 V system',
    descRu: 'Расчёт тока однофазного и трёхфазного КЗ по сопротивлению петли фаза-ноль. Нужен, чтобы проверить, отключится ли защита вовремя.',
    descEn: 'Single-phase and three-phase short-circuit current from loop impedance — the number that tells whether protection trips in time.',
  },
  {
    id: 'grounding', group: 'electrical', priority: 0.8,
    related: ['groundcircuit', 'protection', 'shortcircuit'],
    titleRu: 'Расчёт заземляющего устройства из вертикальных электродов',
    titleEn: 'Earthing system of vertical electrodes',
    descRu: 'Сопротивление заземлителя по удельному сопротивлению грунта, длине и числу электродов. Нормы 4, 10 и 30 Ом с пояснением, откуда они.',
    descEn: 'Earthing resistance from soil resistivity, electrode length and count, against the 4, 10 and 30 ohm limits.',
  },
  {
    id: 'protection', group: 'electrical', priority: 0.8,
    related: ['shortcircuit', 'cable', 'fuse', 'kzcable'],
    titleRu: 'Выбор автоматического выключателя по расчётному току',
    titleEn: 'Circuit breaker selection by design current',
    descRu: 'Подбор номинала и характеристики автомата под нагрузку и кабель. Проверка условия защиты кабеля от перегрузки: номинал не выше допустимого тока.',
    descEn: 'Breaker rating and curve for the load and the cable, including the overload protection condition.',
  },
  {
    id: 'groundcircuit', group: 'electrical', priority: 0.7,
    related: ['grounding', 'protection', 'shortcircuit'],
    titleRu: 'Заземляющий контур: расчёт сопротивления растеканию',
    titleEn: 'Earthing loop resistance',
    descRu: 'Контур из вертикальных электродов, соединённых горизонтальной полосой: сопротивление растеканию с учётом взаимного экранирования электродов.',
    descEn: 'Vertical electrodes joined by a horizontal strip: spreading resistance with the mutual screening factor.',
  },
  {
    id: 'kzcable', group: 'electrical', priority: 0.7,
    related: ['shortcircuit', 'cable', 'protection'],
    titleRu: 'Проверка кабеля на термическую стойкость к току КЗ',
    titleEn: 'Cable thermal withstand check',
    descRu: 'Минимальное сечение кабеля по току короткого замыкания и времени отключения защиты. Показывает, выдержит ли жила до срабатывания автомата.',
    descEn: 'Minimum cross-section from short-circuit current and clearing time — whether the conductor survives until the breaker opens.',
  },

  // ===== ОБОРУДОВАНИЕ =====
  {
    id: 'motor', group: 'equipment', priority: 0.8,
    related: ['motorstart', 'motorcap', 'compensation', 'protection'],
    titleRu: 'Расчёт асинхронного двигателя: ток, момент, скольжение',
    titleEn: 'Induction motor: current, torque, slip',
    descRu: 'Номинальный и пусковой ток двигателя, момент на валу, скольжение и КПД по паспортным данным. Подбор пускателя и теплового реле.',
    descEn: 'Rated and starting current, shaft torque, slip and efficiency from nameplate data, plus starter and overload relay selection.',
  },
  {
    id: 'motorstart', group: 'equipment', priority: 0.7,
    related: ['motor', 'transformer', 'cable', 'compensation'],
    titleRu: 'Пуск двигателя: провал напряжения в сети',
    titleEn: 'Motor starting: voltage dip',
    descRu: 'Насколько просядет напряжение при пуске двигателя и хватит ли момента. Сравнение прямого пуска, звезды-треугольника и плавного пуска.',
    descEn: 'Voltage dip at motor start and whether torque suffices: direct-on-line, star-delta and soft start compared.',
  },
  {
    id: 'transformer', group: 'equipment', priority: 0.8,
    related: ['compensation', 'shortcircuit', 'loadpanel', 'motorstart'],
    titleRu: 'Расчёт силового трансформатора: токи и потери',
    titleEn: 'Power transformer: currents and losses',
    descRu: 'Токи обмоток, потери холостого хода и короткого замыкания, загрузка и КПД трансформатора по паспортной мощности и напряжениям.',
    descEn: 'Winding currents, no-load and short-circuit losses, loading and efficiency from rated power and voltages.',
  },
  {
    id: 'compensation', group: 'equipment', priority: 0.8,
    related: ['transformer', 'motor', 'threephase', 'energyaudit'],
    titleRu: 'Компенсация реактивной мощности: расчёт конденсаторов',
    titleEn: 'Reactive power compensation',
    descRu: 'Мощность конденсаторной установки для перехода от текущего cos φ к целевому. Показывает разгрузку трансформатора и снижение тока в линии.',
    descEn: 'Capacitor bank power to move from the present power factor to the target one, with the resulting current reduction.',
  },
  {
    id: 'ups', group: 'equipment', priority: 0.7,
    related: ['loadpanel', 'solar', 'dcvdrop', 'energyaudit'],
    titleRu: 'Расчёт ИБП и ёмкости аккумуляторов по времени работы',
    titleEn: 'UPS and battery sizing by backup time',
    descRu: 'Мощность ИБП под нагрузку и ёмкость батареи на заданное время автономии с учётом КПД инвертора и глубины разряда аккумуляторов.',
    descEn: 'UPS rating for the load and battery capacity for the required backup time, allowing for inverter efficiency and depth of discharge.',
  },
  {
    id: 'loadpanel', group: 'equipment', priority: 0.7,
    related: ['demandfactor', 'cable', 'protection', 'transformer'],
    titleRu: 'Расчёт распределительного щита: нагрузки и вводной автомат',
    titleEn: 'Distribution board: loads and main breaker',
    descRu: 'Суммарная мощность и расчётный ток щита по списку потребителей с коэффициентами использования. Подбор вводного автомата и сечения питающей линии.',
    descEn: 'Total power and design current of a board from its load list, with demand factors, plus main breaker and feeder sizing.',
  },

  // ===== ОСВЕЩЕНИЕ =====
  {
    id: 'lighting', group: 'lighting', priority: 0.8,
    related: ['emergency', 'ledstrip', 'energyaudit'],
    titleRu: 'Расчёт освещённости помещения и числа светильников',
    titleEn: 'Room illuminance and luminaire count',
    descRu: 'Число светильников для нужной освещённости по методу коэффициента использования: площадь, высота, отражение поверхностей, запас на загрязнение.',
    descEn: 'Luminaire count for the required illuminance by the utilisation factor method: area, height, surface reflectance and maintenance factor.',
  },
  {
    id: 'emergency', group: 'lighting', priority: 0.7,
    related: ['lighting', 'ups', 'ledstrip'],
    titleRu: 'Аварийное освещение: расчёт светильников и времени работы',
    titleEn: 'Emergency lighting: luminaires and duration',
    descRu: 'Число светильников аварийного освещения и требуемая ёмкость аккумуляторов на нормируемое время работы для путей эвакуации.',
    descEn: 'Emergency luminaire count and battery capacity for the required operating time along escape routes.',
  },
  {
    id: 'ledstrip', group: 'lighting', priority: 0.8,
    related: ['led', 'dcvdrop', 'lighting', 'wirecab'],
    titleRu: 'Расчёт светодиодной ленты: провод и точки питания',
    titleEn: 'LED strip: wire, feed points, power supply',
    descRu: 'Сечение питающего провода, число точек питания и мощность блока для светодиодной ленты. Учитывает просадку на дорожках самой ленты.',
    descEn: 'Feed wire cross-section, number of injection points and PSU rating for an LED strip, including the drop along the strip itself.',
  },

  // ===== КАБЕЛЬНЫЕ СЕТИ =====
  {
    id: 'derating', group: 'cablenet', priority: 0.8,
    related: ['cable', 'cableloss', 'conduitfill', 'cabletray'],
    titleRu: 'Поправочные коэффициенты для кабеля: дерейтинг',
    titleEn: 'Cable derating factors',
    descRu: 'Снижение допустимого тока кабеля из-за температуры среды, способа прокладки, числа жил и группы кабелей рядом. Суммарный коэффициент к таблице ПУЭ.',
    descEn: 'Ampacity reduction from ambient temperature, installation method, core count and grouping — the combined factor for the base table.',
  },
  {
    id: 'diam2sec', group: 'cablenet', priority: 0.7,
    related: ['cable', 'converter', 'wirecab'],
    titleRu: 'Диаметр жилы в сечение и обратно',
    titleEn: 'Conductor diameter to cross-section',
    descRu: 'Перевод диаметра жилы в сечение и сечения в диаметр, включая многопроволочные жилы. Подбор ближайшего стандартного сечения ряда.',
    descEn: 'Diameter to cross-section and back, including stranded conductors, with the nearest standard size.',
  },
  {
    id: 'cableloss', group: 'cablenet', priority: 0.8,
    related: ['cable', 'voltage', 'derating', 'energyaudit'],
    titleRu: 'Потери мощности в кабеле и нагрев жилы',
    titleEn: 'Cable power losses and conductor heating',
    descRu: 'Активные потери в кабеле, стоимость этих потерь за год и температура жилы под нагрузкой. Помогает сравнить сечения по деньгам, а не только по нормам.',
    descEn: 'Ohmic losses, their yearly cost and conductor temperature under load — comparing cross-sections by money, not only by code.',
  },
  {
    id: 'busbar', group: 'cablenet', priority: 0.7,
    related: ['cable', 'shortcircuit', 'loadpanel'],
    titleRu: 'Расчёт медных и алюминиевых шин по току',
    titleEn: 'Copper and aluminium busbar sizing',
    descRu: 'Сечение сборной шины по длительному току, проверка на нагрев и электродинамическую стойкость при КЗ. Медь и алюминий, одна и несколько полос.',
    descEn: 'Busbar cross-section by continuous current, with heating and short-circuit withstand checks for copper and aluminium.',
  },
  {
    id: 'cabletray', group: 'cablenet', priority: 0.7,
    related: ['conduitfill', 'derating', 'cable'],
    titleRu: 'Заполнение кабельного лотка',
    titleEn: 'Cable tray fill',
    descRu: 'Помещаются ли кабели в лоток выбранной ширины и какой лоток нужен под набор кабелей. Учитывает однослойную укладку и запас на прокладку.',
    descEn: 'Whether the cables fit the chosen tray and which tray size the bundle needs, allowing for single-layer laying and spare capacity.',
  },
  {
    id: 'conduitfill', group: 'cablenet', priority: 0.8,
    related: ['cabletray', 'sleeve', 'derating'],
    titleRu: 'Заполнение трубы и гофры кабелями',
    titleEn: 'Conduit fill',
    descRu: 'Проверка, войдут ли кабели в трубу или гофру: заполнение считается по площади сечения с лимитом 40 % по ПУЭ, подбирается минимальный диаметр.',
    descEn: 'Whether cables fit a conduit: fill by cross-sectional area against the 40 % limit, plus the minimum required diameter.',
  },
  {
    id: 'sleeve', group: 'cablenet', priority: 0.8,
    related: ['wirecab', 'conduitfill', 'cable'],
    titleRu: 'Подбор соединительной гильзы и её заполнение',
    titleEn: 'Crimp sleeve selection and fill',
    descRu: 'Типоразмер гильзы под скрутку нескольких жил, заполнение канала и добивка проволокой. Медь, алюминий и биметалл для соединения меди с алюминием.',
    descEn: 'Sleeve size for several conductors, channel fill and filler wire, for copper, aluminium and bimetallic joints.',
  },
  {
    id: 'converter', group: 'cablenet', priority: 0.6,
    related: ['diam2sec', 'power', 'threephase'],
    titleRu: 'Конвертер электрических величин',
    titleEn: 'Electrical unit converter',
    descRu: 'Перевод между единицами: мощность и ток, кВт и кВА, AWG и мм², дБм и ватты. Всё, что нужно пересчитать по ходу расчёта, в одном месте.',
    descEn: 'Conversions between power and current, kW and kVA, AWG and mm², dBm and watts — in one place.',
  },

  // ===== МОНТАЖ ШКАФОВ =====
  {
    id: 'wirecab', group: 'cabinet', priority: 0.8,
    related: ['sleeve', 'diam2sec', 'loadpanel', 'cable'],
    titleRu: 'Провод и наконечники НШВИ для сборки шкафа',
    titleEn: 'Panel wiring and ferrules',
    descRu: 'Сечение монтажного провода по току и подбор наконечников НШВИ под жилу, включая двойные. Считает метраж и количество наконечников на шкаф.',
    descEn: 'Panel wire cross-section by current and matching bootlace ferrules, including twin ones, with quantities for the whole cabinet.',
  },
  {
    id: 'demandfactor', group: 'cabinet', priority: 0.7,
    related: ['loadpanel', 'energyaudit', 'power'],
    titleRu: 'Коэффициент спроса и расчётная мощность',
    titleEn: 'Demand factor and design load',
    descRu: 'Расчётная мощность группы потребителей с коэффициентами использования и одновременности. Показывает, насколько установленная мощность отличается от расчётной.',
    descEn: 'Design load of a group with utilisation and simultaneity factors, showing how far installed power differs from design power.',
  },
  {
    id: 'fuse', group: 'cabinet', priority: 0.7,
    related: ['protection', 'kzcable', 'cable'],
    titleRu: 'Выбор плавкого предохранителя',
    titleEn: 'Fuse selection',
    descRu: 'Номинал плавкой вставки по току нагрузки и типу цепи, проверка селективности с вышестоящим аппаратом и защиты кабеля от перегрузки.',
    descEn: 'Fuse rating by load current and circuit type, with selectivity and cable overload protection checks.',
  },
  {
    id: 'dcvdrop', group: 'cabinet', priority: 0.7,
    related: ['voltage', 'ledstrip', 'solar', 'ups'],
    titleRu: 'Потери напряжения в цепи постоянного тока',
    titleEn: 'DC circuit voltage drop',
    descRu: 'Падение напряжения в цепи 12, 24 или 48 В: ток идёт туда и обратно, поэтому считается двойная длина провода. Подбор сечения под допуск.',
    descEn: 'Voltage drop in 12, 24 or 48 V circuits — current flows both ways, so the loop length counts — plus cross-section selection.',
  },

  // ===== ЭНЕРГЕТИКА =====
  {
    id: 'threephase', group: 'energy', priority: 0.7,
    related: ['power', 'neutral', 'compensation', 'thd'],
    titleRu: 'Трёхфазная сеть: мощность, ток, коэффициенты',
    titleEn: 'Three-phase system: power and current',
    descRu: 'Активная, реактивная и полная мощность трёхфазной сети, линейные и фазные величины, соединение звездой и треугольником.',
    descEn: 'Active, reactive and apparent power in a three-phase system, line and phase values, star and delta connections.',
  },
  {
    id: 'energyaudit', group: 'energy', priority: 0.7,
    related: ['demandfactor', 'cableloss', 'solar', 'compensation'],
    titleRu: 'Энергоаудит: расчёт потребления и стоимости',
    titleEn: 'Energy audit: consumption and cost',
    descRu: 'Потребление электроэнергии по списку оборудования с режимами работы и стоимость за месяц и год. Показывает, что именно съедает счёт.',
    descEn: 'Electricity consumption from an equipment list with duty cycles, and the monthly and yearly cost.',
  },
  {
    id: 'solar', group: 'energy', priority: 0.7,
    related: ['ups', 'dcvdrop', 'energyaudit'],
    titleRu: 'Расчёт солнечной электростанции',
    titleEn: 'Solar plant: panels, inverter, batteries',
    descRu: 'Число панелей под суточное потребление, мощность инвертора и ёмкость аккумуляторов с учётом инсоляции и потерь в системе.',
    descEn: 'Panel count for the daily demand, inverter rating and battery capacity, allowing for insolation and system losses.',
  },

  // ===== БЕЗОПАСНОСТЬ =====
  {
    id: 'neutral', group: 'safety', priority: 0.7,
    related: ['threephase', 'thd', 'cable'],
    titleRu: 'Ток в нейтрали при несимметричной нагрузке',
    titleEn: 'Neutral current with unbalanced load',
    descRu: 'Ток нулевого рабочего проводника при разной нагрузке фаз и при нелинейных потребителях, когда третья гармоника складывается в нейтрали.',
    descEn: 'Neutral conductor current with unbalanced phases and with non-linear loads, where third harmonics add up in the neutral.',
  },
  {
    id: 'arcflash', group: 'safety', priority: 0.7,
    related: ['shortcircuit', 'protection', 'kzcable'],
    titleRu: 'Расчёт энергии дуговой вспышки и границы безопасности',
    titleEn: 'Arc flash energy and boundary',
    descRu: 'Падающая энергия дуги, категория средств защиты и граница безопасного расстояния по току КЗ и времени отключения защиты.',
    descEn: 'Incident energy, PPE category and safe approach boundary from fault current and clearing time.',
  },
  {
    id: 'thd', group: 'safety', priority: 0.7,
    related: ['neutral', 'threephase', 'compensation'],
    titleRu: 'Коэффициент гармоник THD',
    titleEn: 'Total harmonic distortion',
    descRu: 'Коэффициент искажения синусоиды по амплитудам гармоник и допустимые пределы. Высокий THD греет нейтраль и трансформатор.',
    descEn: 'Distortion factor from harmonic amplitudes against the permitted limits — high THD heats the neutral and the transformer.',
  },

  // ===== КИПиА =====
  {
    id: 'kipia', group: 'kipia', priority: 0.8,
    related: ['cablelength', 'rtdtable', 'tcouple', 'pneumatics'],
    titleRu: 'Токовая петля 4–20 мА: расчёт и масштабирование',
    titleEn: '4-20 mA current loop calculations',
    descRu: 'Перевод тока в физическую величину и обратно, масштабирование шкалы, проверка нагрузки петли и настройка ПИД-регулятора.',
    descEn: 'Current to process value and back, span scaling, loop load check and PID tuning.',
  },
  {
    id: 'cablelength', group: 'kipia', priority: 0.7,
    related: ['kipia', 'rtdtable', 'cable'],
    titleRu: 'Максимальная длина кабеля для петли 4–20 мА',
    titleEn: 'Maximum cable length for a 4-20 mA loop',
    descRu: 'Допустимая длина кабеля по сопротивлению петли: напряжение питания, сопротивление приёмника и падение на жилах при токе 20 мА.',
    descEn: 'Permissible cable length from loop resistance: supply voltage, receiver impedance and conductor drop at 20 mA.',
  },
  {
    id: 'rtdtable', group: 'kipia', priority: 0.7,
    related: ['tcouple', 'kipia', 'cablelength'],
    titleRu: 'Таблица сопротивлений Pt100 и Pt1000',
    titleEn: 'Pt100 and Pt1000 resistance table',
    descRu: 'Сопротивление термосопротивления при заданной температуре и обратный перевод по ГОСТ 6651: Pt100, Pt500, Pt1000, медные и никелевые датчики.',
    descEn: 'RTD resistance at a given temperature and the reverse conversion for Pt100, Pt500, Pt1000, copper and nickel sensors.',
  },
  {
    id: 'tcouple', group: 'kipia', priority: 0.7,
    related: ['rtdtable', 'kipia', 'cablelength'],
    titleRu: 'Термопары: перевод милливольт в градусы',
    titleEn: 'Thermocouples: millivolts to degrees',
    descRu: 'Перевод термо-ЭДС в температуру и обратно для типов K, J, T, E, N, S, R, B с учётом температуры холодного спая.',
    descEn: 'Thermo-EMF to temperature and back for types K, J, T, E, N, S, R and B, with cold junction compensation.',
  },
  {
    id: 'pneumatics', group: 'kipia', priority: 0.7,
    related: ['pneumline', 'hydraulics', 'kipia'],
    titleRu: 'Пневматика: расход, цилиндры, компрессор',
    titleEn: 'Pneumatics: flow, cylinders, compressor',
    descRu: 'Усилие и расход пневмоцилиндра, подбор компрессора и ресивера по потреблению воздуха. Нормальный литр и рабочее давление в одном расчёте.',
    descEn: 'Cylinder force and air consumption, compressor and receiver sizing, in normal litres at working pressure.',
  },
  {
    id: 'pneumline', group: 'kipia', priority: 0.7,
    related: ['pneumatics', 'hydraulics'],
    titleRu: 'Пневматическая трасса: потери давления в трубопроводе',
    titleEn: 'Compressed air line pressure loss',
    descRu: 'Падение давления в трубопроводе сжатого воздуха по длине, диаметру и расходу с учётом местных сопротивлений. Подбор диаметра трубы.',
    descEn: 'Pressure loss in a compressed air pipe from length, diameter and flow, including fittings, plus pipe sizing.',
  },
  {
    id: 'hydraulics', group: 'kipia', priority: 0.7,
    related: ['pneumatics', 'pneumline', 'motor'],
    titleRu: 'Гидравлика: цилиндры, насосы, трубопровод',
    titleEn: 'Hydraulics: cylinders, pumps, piping',
    descRu: 'Усилие и скорость гидроцилиндра, подача и мощность насоса, скорость потока в трубопроводе. Расчёты по давлению и рабочему объёму.',
    descEn: 'Cylinder force and speed, pump flow and power, and fluid velocity in the piping.',
  },

  // ===== ЭЛЕКТРОНИКА =====
  {
    id: 'rccalc', group: 'electronics', priority: 0.7,
    related: ['rlc', 'capval', 'led', 'bridge'],
    titleRu: 'Соединение резисторов и конденсаторов',
    titleEn: 'Resistors and capacitors in series and parallel',
    descRu: 'Сопротивление и ёмкость при последовательном и параллельном соединении, делитель напряжения, постоянные времени RC и RL, резонанс LC.',
    descEn: 'Series and parallel resistance and capacitance, voltage divider, RC and RL time constants, LC resonance.',
  },
  {
    id: 'capval', group: 'electronics', priority: 0.7,
    related: ['rccalc', 'motorcap', 'rlc'],
    titleRu: 'Маркировка конденсаторов: расшифровка кода',
    titleEn: 'Capacitor code markings',
    descRu: 'Расшифровка трёхзначного кода и буквенной маркировки конденсаторов, перевод пФ, нФ и мкФ, допуски и рабочее напряжение.',
    descEn: 'Three-digit and letter capacitor codes, pF, nF and µF conversion, tolerance and voltage rating.',
  },
  {
    id: 'motorcap', group: 'electronics', priority: 0.7,
    related: ['motor', 'capval', 'compensation'],
    titleRu: 'Конденсатор для однофазного включения двигателя',
    titleEn: 'Capacitor for single-phase motor operation',
    descRu: 'Ёмкость рабочего и пускового конденсатора для трёхфазного двигателя в однофазной сети: схемы звезда и треугольник, потеря мощности.',
    descEn: 'Run and start capacitor values for a three-phase motor on single-phase supply, for star and delta, with the power penalty.',
  },
  {
    id: 'led', group: 'electronics', priority: 0.7,
    related: ['zener', 'rccalc', 'ledstrip'],
    titleRu: 'Расчёт гасящего резистора для светодиода',
    titleEn: 'LED series resistor',
    descRu: 'Сопротивление и мощность резистора под светодиод по напряжению питания, прямому падению и току. Последовательное и параллельное включение.',
    descEn: 'Resistor value and power rating for an LED from supply voltage, forward drop and current, in series and parallel arrangements.',
  },
  {
    id: 'zener', group: 'electronics', priority: 0.7,
    related: ['led', 'rccalc', 'ne555'],
    titleRu: 'Расчёт стабилитрона и балластного резистора',
    titleEn: 'Zener diode and ballast resistor',
    descRu: 'Балластный резистор для стабилитрона, ток стабилизации и рассеиваемая мощность при изменении нагрузки и напряжения питания.',
    descEn: 'Ballast resistor, regulation current and dissipated power for a Zener across load and supply variation.',
  },
  {
    id: 'rlc', group: 'electronics', priority: 0.7,
    related: ['rccalc', 'capval', 'thd'],
    titleRu: 'Импеданс RLC-цепи и резонансная частота',
    titleEn: 'RLC impedance and resonance',
    descRu: 'Полное сопротивление RLC-цепи на заданной частоте, угол сдвига фаз, резонансная частота и добротность контура.',
    descEn: 'RLC impedance at a given frequency, phase angle, resonant frequency and Q factor.',
  },
  {
    id: 'bridge', group: 'electronics', priority: 0.6,
    related: ['rccalc', 'rtdtable', 'opamp'],
    titleRu: 'Мост Уитстона: расчёт разбаланса',
    titleEn: 'Wheatstone bridge unbalance',
    descRu: 'Напряжение разбаланса моста по сопротивлениям плеч и условие равновесия. Основа измерений тензодатчиками и термосопротивлениями.',
    descEn: 'Bridge output voltage from arm resistances and the balance condition — the basis of strain gauge and RTD measurement.',
  },

  // ===== МИКРОСХЕМЫ =====
  {
    id: 'ne555', group: 'chips', priority: 0.7,
    related: ['opamp', 'rccalc', '7seg'],
    titleRu: 'Расчёт NE555: частота и длительность импульса',
    titleEn: 'NE555 timer calculations',
    descRu: 'Автоколебательный и ждущий режим таймера 555: частота, скважность и длительность импульса по номиналам резисторов и конденсатора.',
    descEn: 'Astable and monostable 555 modes: frequency, duty cycle and pulse width from resistor and capacitor values.',
  },
  {
    id: 'opamp', group: 'chips', priority: 0.7,
    related: ['ne555', 'bridge', 'rccalc'],
    titleRu: 'Расчёт операционного усилителя',
    titleEn: 'Op-amp circuit calculations',
    descRu: 'Коэффициент усиления инвертирующей и неинвертирующей схемы, сумматор и дифференциальный усилитель, подбор резисторов обратной связи.',
    descEn: 'Gain of inverting and non-inverting stages, summing and differential amplifiers, and feedback resistor selection.',
  },
  {
    id: '7seg', group: 'chips', priority: 0.6,
    related: ['led', 'ne555', 'opamp'],
    titleRu: 'Семисегментный индикатор: резисторы и дешифровка',
    titleEn: 'Seven-segment display resistors',
    descRu: 'Гасящие резисторы для семисегментного индикатора с общим анодом и катодом, ток сегментов и коды символов для дешифратора.',
    descEn: 'Series resistors for common-anode and common-cathode seven-segment displays, segment current and character codes.',
  },

  // ===== РЕДАКТОР =====
  {
    id: 'editor', group: 'editor', priority: 0.9,
    related: ['rccalc', 'led', 'ne555'],
    titleRu: 'Редактор электрических схем с эмуляцией по ГОСТ',
    titleEn: 'Schematic editor with simulation',
    descRu: 'Сборка принципиальной схемы из УГО по ЕСКД и расчёт режима: токи, напряжения, свечение ламп и светодиодов, переходный процесс на графике.',
    descEn: 'Draw a schematic from standard symbols and solve it: currents, voltages, lamp and LED glow, and transient plots.',
  },

  // ===== СИСТЕМНЫЕ =====
  {
    id: 'help', group: 'system', priority: 0.5,
    related: ['developer', 'editor'],
    titleRu: 'Справка по калькуляторам',
    titleEn: 'Help and reference',
    descRu: 'Как устроены расчёты EngiCalc: методики, применяемые нормативы и оговорки, которые стоит знать до того, как подставлять числа в проект.',
    descEn: 'How the EngiCalc calculations work: methods, standards used and the caveats worth knowing before trusting a number.',
  },
  {
    id: 'developer', group: 'system', priority: 0.4,
    related: ['help', 'donate'],
    titleRu: 'О программе EngiCalc',
    titleEn: 'About EngiCalc',
    descRu: 'Кто делает EngiCalc, для кого он собран и на каких нормативах основаны расчёты. Контакты для замечаний по методикам и данным.',
    descEn: 'Who makes EngiCalc, who it is for, and which standards the calculations follow, with contacts for corrections.',
  },
  {
    id: 'donate', group: 'system', priority: 0.3,
    related: ['developer', 'help'],
    titleRu: 'Поддержать проект',
    titleEn: 'Support the project',
    descRu: 'EngiCalc бесплатен и работает без рекламы. Здесь способы поддержать разработку: ЕРИП, банковская карта и QR-код.',
    descEn: 'EngiCalc is free and ad-free. Ways to support its development are collected here.',
  },
];

/** Раздел по идентификатору. */
export const PAGE_BY_ID = Object.fromEntries(PAGES.map(p => [p.id, p]));

/** Порядок групп на витрине: тот же, что в меню. */
export const GROUP_ORDER = [
  'electrical', 'equipment', 'lighting', 'cablenet',
  'cabinet', 'energy', 'safety', 'kipia',
  'electronics', 'chips', 'editor', 'system',
];
