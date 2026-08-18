/* EngiCalc — Help content and panel (RU + EN) */
'use strict';
import { $, lang } from './core.js';

const HELP_RU = {
  power: {
    title: 'Мощность и ток нагрузки',
    body: `<p>Любое электрическое оборудование потребляет ток. Чем мощнее прибор, тем больше тока он берёт из сети. Значение тока важно знать, чтобы правильно выбрать провод и автомат-выключатель.</p>
<p><strong>Что нужно ввести:</strong></p>
<ul>
<li><strong>Мощность (кВт)</strong> — написана на шильдике прибора или в паспорте.</li>
<li><strong>Напряжение (В)</strong> — в обычной розетке 220 В, в трёхфазной сети 380 В.</li>
<li><strong>cos phi</strong> — коэффициент мощности. Для ламп накаливания равен 1, для двигателей обычно 0.7-0.9. Если не знаете, поставьте 0.85.</li>
<li><strong>КПД</strong> — эффективность прибора. Для двигателя 0.75-0.95, для нагревателя 1.0.</li>
</ul>
<p><strong>Что показывает результат:</strong> ток в амперах. Именно по нему выбирают сечение провода и номинал автомата.</p>
<p><strong>Формула:</strong> для трёхфазной сети I = P / (1.732 x U x cos phi x eta), для однофазной I = P / (U x cos phi x eta).</p>
<p><strong>Норматив:</strong> ПУЭ п. 1.3.10.</p>`
  },
  cable: {
    title: 'Подбор сечения кабеля',
    body: `<p>Сечение кабеля нельзя подобрать одной формулой. Кабель должен одновременно выдержать нагрев рабочим током, уложиться в допустимое падение напряжения и пережить короткое замыкание до срабатывания защиты. Каждое условие даёт своё требуемое сечение, а выбирают из них наибольшее.</p>

<p><strong>Что нужно ввести обязательно:</strong></p>
<ul>
<li><strong>Тип сети</strong> — трёхфазная, однофазная или постоянный ток. От этого зависит формула тока и множитель в падении напряжения: √3 для трёх фаз и 2 для остальных, потому что там ток идёт по двум проводникам.</li>
<li><strong>Нагрузка</strong> — либо мощность в кВт, либо ток в амперах. Если известна мощность, ток считается сам.</li>
<li><strong>cos φ</strong> — для ламп накаливания и нагревателей близок к 1, для двигателей 0,8–0,9. Чем он ниже, тем больший ток нужен для той же мощности.</li>
<li><strong>Длина линии</strong> — от щита до потребителя, по факту прокладки, а не по прямой.</li>
<li><strong>Допустимое падение ΔU</strong> — обычно 3 % для освещения и 5 % для силовых цепей.</li>
</ul>

<p><strong>Блок «Кабель и прокладка».</strong> Табличный допустимый ток относится к базовым условиям: ПВХ-изоляция, открытая прокладка в воздухе, +25 °C, одна-две нагруженные жилы. Всё, что отличается, учитывается поправками, которые перемножаются:</p>
<ul>
<li><strong>Изоляция</strong> — сшитый полиэтилен держит +90 °C против +70 °C у ПВХ, поэтому тот же кабель пропускает примерно на четверть больший ток.</li>
<li><strong>Способ прокладки</strong> — в трубе и в стене тепло отводится хуже, чем в воздухе; в земле, наоборот, лучше.</li>
<li><strong>Число нагруженных жил</strong> — три жилы в общей оболочке греют друг друга сильнее, чем две.</li>
<li><strong>Кабелей в пучке</strong> — соседние кабели мешают друг другу остывать. Десяток кабелей в одном лотке снижает допустимый ток почти на треть.</li>
<li><strong>Температура среды</strong> — в котельной или на солнце кабель везёт заметно меньше, чем при +25 °C.</li>
<li><strong>Кабелей на фазу</strong> — параллельная прокладка делит ток между кабелями. Они обязаны быть одной марки, длины и сечения, иначе ток распределится неравномерно.</li>
</ul>

<p><strong>Блок «Проверка по КЗ и пуску».</strong> Заполняйте, если знаете ток короткого замыкания и время срабатывания защиты. Кабель должен выдержать этот ток, не расплавив изоляцию: Smin = Iкз·√t / k, где k зависит от материала жилы и изоляции (медь с ПВХ — 115, со сшитым полиэтиленом — 143). Кратность пускового тока нужна для двигателей: при пуске ток вырастает в 5–7 раз, и просадка напряжения не должна превышать 15 %.</p>

<p><strong>Что в результате.</strong> Главное число — рекомендуемое стандартное сечение. Под ним таблица проверок: сколько требует каждый критерий и какой из них оказался лимитирующим. Дальше расчётный и допустимый токи, запас, падение напряжения в вольтах и процентах, потери мощности, сопротивление линии, температура жилы под нагрузкой и номинал автомата.</p>

<p><strong>Про автомат.</strong> Он должен быть больше рабочего тока, но не больше допустимого тока кабеля — иначе кабель сгорит раньше, чем автомат отключится. Если такое сочетание не набирается, появляется предупреждение.</p>

<p><strong>Метод расчёта.</strong> Используется базовая таблица допустимых токов с поправочными коэффициентами, а не отдельные таблицы ПУЭ под каждое сочетание условий. Для проектной документации результат следует сверять с таблицами ПУЭ 1.3.4–1.3.11 напрямую.</p>

<p><strong>Норматив:</strong> ПУЭ табл. 1.3.4 и 1.3.22–1.3.26, п. 1.3.10 (падение напряжения), п. 7.1.34 и 7.1.45 (минимальные сечения), ГОСТ Р 50571.5.54 (термическая стойкость).</p>`
  },
  ledstrip: {
    title: 'Светодиодные ленты: провод, точки питания, блок питания',
    body: `<p>У светодиодной ленты нагрузка распределена по всей длине: светодиоды разбирают ток по пути, и до дальнего конца доходит всё меньше. Из-за этого падение напряжения на дорожках самой ленты растёт <strong>квадратично по длине</strong>, а не пропорционально:</p>

<p><strong>ΔU = r · i · L² / 2</strong> — при питании с одного конца, где r — сопротивление пары дорожек (Ом/м), i — ток на метр (А/м), L — длина.</p>

<p>Практический вывод, ради которого калькулятор и нужен: питание с двух концов снижает просадку <strong>вчетверо</strong>, а не вдвое. Середина ленты становится точкой нулевого тока, и каждая половина ведёт себя как отрезок вдвое короче. Поэтому на длинных трассах вторая точка питания даёт больше, чем любое утолщение провода — сопротивление дорожек от сечения питающего кабеля не зависит вообще.</p>

<p><strong>Два режима расчёта.</strong> «Одна лента» — трасса заданной длины с выбранной схемой питания. «Несколько лент от одной точки» — типовой монтаж, когда от блока питания идёт один провод до точки распределения, а оттуда ответвления к лентам разной длины. Во втором режиме худшую ветку ищет калькулятор: короткая лента на длинном ответвлении легко проигрывает длинной ленте на коротком, и на глаз это не угадывается.</p>

<p><strong>Что нужно ввести:</strong></p>
<ul>
<li><strong>Напряжение ленты</strong> — 12, 24, 36 или 48 В. При той же мощности переход с 12 на 24 В вдвое снижает ток и вчетверо просадку.</li>
<li><strong>Мощность Вт/м</strong> — из паспорта ленты. Ток на метр считается сам: i = P / U.</li>
<li><strong>Длина</strong> — одного непрерывного отрезка, а не суммарная по объекту.</li>
<li><strong>Схема питания</strong> — с одного конца, с двух, несколько равномерных точек или кольцевое.</li>
<li><strong>Допустимое ΔU</strong> — для лент обычно 5 %, максимум 8–10 %. Чем меньше, тем равномернее яркость.</li>
</ul>

<p><strong>Сопротивление дорожек.</strong> Главный параметр и одновременно самый неудобный: производители его почти никогда не публикуют. Поле заполняется типовым значением по ширине ленты — от 1.2 Ом/м для узкой 8 мм до 0.25 Ом/м для мощной 15 мм. Это ориентир, разброс у реальных лент большой. Для ответственного монтажа померьте омметром отрезок 1 м при отключённом питании и введите своё значение.</p>

<p>Обратите внимание: указывается сопротивление <strong>пары</strong> дорожек, плюсовой и минусовой вместе. Ток идёт туда и обратно, и значение для одной дорожки занизило бы просадку вдвое.</p>

<p><strong>Что в результате.</strong> Рекомендуемое сечение провода, таблица по веткам с током, сечением, просадкой и напряжением на дальнем конце. Отдельно показано, сколько вольт потеряно на проводе и сколько на самой ленте — по этой паре сразу видно, куда вкладываться. Плюс оптимальное число точек питания, мощность блока питания с запасом и эпюра напряжения вдоль трассы.</p>

<p><strong>Про блок питания.</strong> Мощность берётся с запасом 20–30 %: работающий на пределе импульсный БП греется и быстро деградирует. Номинал подбирается из стандартного ряда до 600 Вт; если нужно больше — нагрузку делят на несколько блоков.</p>

<p><strong>Практическое правило:</strong> без дополнительного питания не стоит вести больше 5 м при 12 В и 10 м при 24 В. Точный ответ даёт расчёт, но этот ориентир полезно держать в голове.</p>

<p><strong>Для бани и сауны:</strong> термостойкая лента в силиконе требует и термостойкого провода — РКГМ, ПВКВ. На сечение это не влияет, но допустимый ток при высокой температуре среды снижается, и калькулятор это учитывает через поле «Температура среды».</p>

<p><strong>Норматив:</strong> ПУЭ табл. 1.3.4 для допустимого тока провода. Просадка на дорожках нормативом не описана — это интеграл распределённой нагрузки.</p>`
  },
  voltage: {
    title: 'Потери напряжения в линии',
    body: `<p>Когда ток течёт по проводу, часть напряжения «теряется» из-за сопротивления провода. Чем длиннее линия и чем тоньше провод, тем больше потери. Если потери превышают 5%, оборудование может работать неправильно: лампы тускнеют, двигатели не запускаются.</p>
<p><strong>Что нужно ввести:</strong></p>
<ul>
<li><strong>Ток (А)</strong> — потребление нагрузки.</li>
<li><strong>Длина линии (м)</strong> — расстояние от щита до прибора.</li>
<li><strong>R (Ом/км)</strong> — активное сопротивление провода. Для медного провода 2.5 мм2 — около 7.24 Ом/км.</li>
<li><strong>X (Ом/км)</strong> — индуктивное сопротивление. Для кабелей до 10 мм2 обычно 0.06-0.1 Ом/км.</li>
</ul>
<p><strong>Формула:</strong> dU = 1.732 x I x L x (R x cos phi + X x sin phi) / 1000.</p>
<p><strong>Норматив:</strong> ПУЭ п. 1.3.10 — допустимые потери не более 5%.</p>`
  },
  shortcircuit: {
    title: 'Ток короткого замыкания',
    body: `<p>Короткое замыкание — это когда фаза напрямую соединяется с нулём или другой фазой. При КЗ ток возрастает в сотни раз за доли секунды. Автомат должен отключить цепь до того, как проводка расплавится.</p>
<p><strong>Зачем это считать:</strong> чтобы правильно выбрать автоматы и предохранители. У каждого аппарата защиты есть «отключающая способность» — максимальный ток КЗ, который он может разорвать.</p>
<p><strong>Что нужно ввести:</strong></p>
<ul>
<li><strong>Линейное напряжение (В)</strong> — обычно 380 В для трёхфазной сети.</li>
<li><strong>Полное сопротивление (Ом)</strong> — сопротивление участка цепи от трансформатора до точки КЗ.</li>
</ul>
<p><strong>Формула:</strong> Iкз = U / (1.732 x Z).</p>
<p><strong>Норматив:</strong> ПУЭ п. 1.4.1.</p>`
  },
  grounding: {
    title: 'Заземление',
    body: `<p>Заземление защищает человека от поражения током. Если корпус прибора окажется под напряжением, ток уйдёт в землю по заземляющему проводу, а не через тело человека.</p>
<p><strong>Что нужно ввести:</strong></p>
<ul>
<li><strong>rho грунта (Ом-м)</strong> — удельное сопротивление почвы. Глина 20-60, суглинок 40-100, песок 100-400.</li>
<li><strong>Длина электрода (м)</strong> — обычно 2.5-3 м.</li>
<li><strong>Диаметр электрода (м)</strong> — стандартный штырь 16-20 мм.</li>
<li><strong>Требуемое R (Ом)</strong> — для частного дома обычно 4 Ом.</li>
</ul>
<p><strong>Формула:</strong> R = rho/(2 x pi x L) x ln(4L/d).</p>
<p><strong>Норматив:</strong> ПУЭ п. 1.7.16.</p>`
  },
  protection: {
    title: 'Автоматы и УЗО',
    body: `<p><strong>Автоматический выключатель</strong> — отключает электричество при перегрузке или коротком замыкании.</p>
<p><strong>УЗО</strong> — отключает цепь при утечке тока на землю. Если человек коснётся оголённого провода, УЗО сработает за доли секунды.</p>
<p><strong>Что нужно ввести:</strong></p>
<ul>
<li><strong>Ток нагрузки (А)</strong> — потребление оборудования.</li>
<li><strong>Характеристика:</strong> B (розетки), C (смешанные), D (двигатели).</li>
<li><strong>Ток утечки (мА)</strong> — ванная 10 мА, розетки 30 мА, ввод 100-300 мА.</li>
</ul>
<p><strong>Норматив:</strong> ПУЭ п. 1.7.79.</p>`
  },
  compensation: {
    title: 'Компенсация реактивной мощности',
    body: `<p>Мощность бывает активная (полезная работа) и реактивная (тратится на магнитные поля в двигателях). Чем ниже cos phi, тем больше потери.</p>
<p><strong>Зачем компенсировать:</strong> энергоснабжающие организации штрафуют за низкий cos phi (ниже 0.9). Конденсаторные батареи повышают cos phi и снижают счета.</p>
<p><strong>Формула:</strong> Qc = P x (tg phi1 - tg phi2).</p>
<p><strong>Норматив:</strong> ПУЭ п. 1.5.15.</p>`
  },
  motor: {
    title: 'Электродвигатели',
    body: `<p>Электродвигатель — основной потребитель электроэнергии на производстве.</p>
<p><strong>Особенности:</strong> пусковой ток в 5-7 раз больше номинального. Для двигателей используют автоматы с характеристикой D.</p>
<p><strong>Формула:</strong> I = P / (1.732 x U x cos phi x eta).</p>
<p><strong>Норматив:</strong> ПУЭ п. 1.3.10.</p>`
  },
  transformer: {
    title: 'Трансформатор',
    body: `<p>Трансформатор понижает высокое напряжение (6-10 кВ) до низкого (380/220 В).</p>
<p><strong>Что считает:</strong> полную мощность (кВА), токи ВН/НН, ток КЗ на стороне НН.</p>
<p><strong>Формула:</strong> S = P / cos phi, I = S / (1.732 x U).</p>`
  },
  lighting: {
    title: 'Освещение',
    body: `<p>Количество светильников зависит от площади, освещённости и эффективности ламп.</p>
<p><strong>Нормы освещённости:</strong> рабочий стол 300-500 лк, коридор 50-100 лк, склад 100-200 лк.</p>
<p><strong>Формула:</strong> N = (E x S) / (Phi x eta).</p>
<p><strong>Норматив:</strong> СП 52.13330.2016.</p>`
  },
  ups: {
    title: 'ИБП, аккумуляторы и генераторы',
    body: `<p><strong>ИБП</strong> — источник бесперебойного питания. Обеспечивает электричеством при отключении сети.</p>
<p><strong>Что считает:</strong> ёмкость аккумуляторов (А-ч) и мощность генератора (кВА).</p>
<p><strong>Формула:</strong> Ah = (P x t) / (U x eta x DoD), где DoD — глубина разряда (0.8 для свинцовых).</p>`
  },
  derating: {
    title: 'Дерейтинг кабелей',
    body: `<p>Допустимый ток кабеля зависит от условий прокладки. При температуре выше 30 градусов или при прокладке нескольких кабелей рядом — ток нужно снижать.</p>
<p><strong>Как это работает:</strong> для каждого условия вводится коэффициент (меньше 1.0). Итоговый ток = базовый ток x коэффициенты.</p>
<p><strong>Норматив:</strong> ПУЭ таблицы 1.3.23-1.3.26.</p>`
  },
  loadpanel: {
    title: 'Щит нагрузок',
    body: `<p>Щит нагрузок — таблица всех электрических потребителей объекта. Помогает выбрать вводной автомат и сечение вводного кабеля.</p>
<p><strong>Коэффициент спроса:</strong> учитывает, что не все приборы работают одновременно. Для розеток 0.6-0.8, для освещения 0.8-0.9.</p>
<p><strong>Дисбаланс</strong> по фазам не должен превышать 15-20%.</p>`
  },
  converter: {
    title: 'Конвертер единиц',
    body: `<p>Быстрый перевод между единицами измерения для электриков, электронщиков и инженеров КИПиА.</p>
<p><strong>Категории:</strong> электрика (А, В, Ом, Вт, кВА), электроника (Гц, Ф, Гн, дБм), КИПиА (мА-%, бар, л/мин), общие (дюйм, фут, Нм).</p>`
  },
  rccalc: {
    title: 'Расчёт элементов цепи',
    body: `<p>Калькулятор для расчёта соединений резисторов, конденсаторов и катушек. Можно задать любое количество элементов (от 2 и больше).</p>
<p><strong>Резисторы:</strong> последовательно R = R1 + R2 + ..., параллельно 1/R = 1/R1 + 1/R2 + ...</p>
<p><strong>Конденсаторы</strong> (наоборот): последовательно 1/C = 1/C1 + ..., параллельно C = C1 + C2 + ...</p>
<p><strong>Катушки:</strong> как резисторы (без взаимной индукции).</p>
<p><strong>Делитель напряжения:</strong> Vout = Vin x R2/(R1+R2).</p>
<p><strong>RC/RL постоянная времени:</strong> tau = RxC или tau = L/R. За 5 tau цепь reaches 99%.</p>
<p><strong>LC резонанс:</strong> f = 1/(2 x pi x sqrt(LC)).</p>`
  },
  motorcap: {
    title: 'Конденсатор для двигателя',
    body: `<p>Однофазные двигатели и трёхфазные на 220 В нуждаются в конденсаторе для создания сдвига фазы.</p>
<p><strong>Рабочий конденсатор</strong> работает всё время. <strong>Пусковой</strong> — только при запуске (в 2-3 раза больше).</p>
<p><strong>Важно:</strong> конденсатор должен быть на напряжение не ниже 400 В.</p>`
  },
  capval: {
    title: 'Значения конденсаторов',
    body: `<p>На корпусах конденсаторов указан код из трёх цифр: первые две — значащее число, третья — множитель 10 в пикофарадах.</p>
<p><strong>Примеры:</strong> 104 = 100 нФ, 222 = 2.2 нФ, 470 = 47 пФ.</p>
<p><strong>Буквы:</strong> p = пФ, n = нФ, u = мкФ.</p>`
  },
  led: {
    title: 'Светодиод (расчёт резистора)',
    body: `<p>Светодиод нельзя подключать напрямую — нужен токоограничительный резистор.</p>
<p><strong>Прямое напряжение:</strong> красный 1.8-2.2 В, зелёный 2.8-3.5 В, белый 3.0-3.5 В.</p>
<p><strong>Формула:</strong> R = (Vпитание - Vсд) / I.</p>`
  },
  zener: {
    title: 'Стабилитрон',
    body: `<p>Стабилитрон стабилизирует напряжение. Резистор ограничивает ток через него.</p>
<p><strong>Проверка:</strong> фактическая мощность стабилитрона не должна превышать допустимую.</p>
<p><strong>Формула:</strong> R = (Vin - Vz) / (Iz + IL).</p>`
  },
  rlc: {
    title: 'Импеданс цепи RLC',
    body: `<p>Полное сопротивление цепи с резистором, катушкой и конденсатором.</p>
<p><strong>Резонанс:</strong> на частоте f = 1/(2 x pi x sqrt(LC)) импеданс минимален.</p>
<p><strong>Формула:</strong> Z = sqrt(R2 + (XL - XC)2).</p>`
  },
  ne555: {
    title: 'Микросхема NE555 (таймер)',
    body: `<p>NE555 — популярная микросхема для генерации импульсов и задержек.</p>
<p><strong>Астабильный (генератор):</strong> f = 1.44/((R1+2R2) x C).</p>
<p><strong>Моностабильный (одновибратор):</strong> t = 1.1 x R x C.</p>
<p><strong>Ограничение:</strong> R1 не менее 1 кОм.</p>`
  },
  opamp: {
    title: 'Операционные усилители',
    body: `<p>ОУ — универсальный элемент аналоговой электроники.</p>
<p><strong>Инвертирующий:</strong> K = -Rf/R1, сдвиг фазы 180 градусов.</p>
<p><strong>Неинвертирующий:</strong> K = 1 + Rf/R1, без сдвига.</p>
<p><strong>Сумматор:</strong> складывает несколько входов с весовыми коэффициентами.</p>
<p><strong>Дифференциальный:</strong> усиливает разность двух напряжений.</p>`
  },
  '7seg': {
    title: '7-сегментный индикатор',
    body: `<p>Семь светодиодов в форме цифры 8. Два типа: общий анод (CA) и общий катод (CC).</p>
<p><strong>Каждый сегмент</strong> нуждается в токоограничительном резисторе.</p>
<p><strong>Декодеры:</strong> 7447 (для CA) и 7448 (для CC) преобразуют BCD в сигналы для сегментов.</p>`
  },
  diam2sec: {
    title: 'Диаметр провода — Сечение',
    body: `<p>Зная диаметр провода, можно вычислить сечение: S = pi x d2 / 4.</p>
<p><strong>Стандартные сечения:</strong> 0.5, 0.75, 1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50 мм2.</p>
<p><strong>Многожильный провод:</strong> общее сечение = сечение одной жилы x количество жил.</p>`
  },
  bridge: {
    title: 'Мост Уитстона',
    body: `<p>Измерительная схема для точного определения сопротивлений.</p>
<p><strong>Баланс:</strong> R1 x R4 = R2 x R3 — напряжение на диагонали равно нулю.</p>
<p><strong>Применение:</strong> тензодатчики, датчики температуры (Pt100), весы.</p>
<p><strong>Формула:</strong> Vвых = V x (R3/(R3+R4) - R2/(R1+R2)).</p>`
  },
  kipia: {
    title: 'КИПиА (контроль, измерения, управление)',
    body: `<p>Область инженерии, связанная с измерением и управлением процессами: температурой, давлением, расходом, уровнем.</p>
<p><strong>Что можно посчитать:</strong> токовую петлю 4-20 мА, масштабирование сигнала, RTD (Pt100), ПИД-регулятор, погрешности.</p>`
  },
  pneumatics: {
    title: 'Пневматика',
    body: `<p>Использование сжатого воздуха для приведения механизмов в движение.</p>
<p><strong>Что считает:</strong> расход воздуха, усилие пневмоцилиндрии, подбор компрессора.</p>
<p><strong>Полезно:</strong> утечки 10-30%, типичное давление 6 бар.</p>`
  },
  hydraulics: {
    title: 'Гидравлика',
    body: `<p>Использование жидкости (масла) для передачи усилия. Основа экскаваторов, прессов, станков.</p>
<p><strong>Что считает:</strong> усилие гидроцилиндра, мощность насоса, потери в трубе.</p>`
  },
  wirecab: {
    title: 'Расчёт провода и НШВИ для электрического шкафа',
    body: `<p>Этот калькулятор помогает прикинуть, сколько провода и наконечников НШВИ понадобится для монтажа электрического шкафа.</p>
<p><strong>Быстрый режим</strong> — для оценки. Укажите габариты шкафа и количество проводов, калькулятор посчитает общие цифры.</p>
<p><strong>Расширенный режим</strong> — для детальной калькуляции. Можно добавлять группы проводов с разным сечением, типом и количеством концов.</p>
<p><strong>Что такое НШВИ?</strong> Наконечник штыревой втулочный изолированный. Обжимается на конец многожильного провода перед вставкой в клемму.</p>
<p><strong>Скачать CSV</strong> — выгрузка результатов для заказа материалов.</p>`
  },
  groundcircuit: {
    title: 'Заземляющий контур',
    body: `<p>Расчёт сопротивления заземляющего контура из вертикальных электродов и горизонтальной полосы.</p>
<p><strong>Что нужно ввести:</strong></p>
<ul>
<li><strong>Удельное сопротивление грунта (Ом-м)</strong> — глина 20-60, суглинок 40-100, песок 100-400.</li>
<li><strong>Длина и диаметр электрода</strong> — стандартный штырь 2.5-3 м, диаметр 16-20 мм.</li>
<li><strong>Количество электродов</strong> — чем больше, тем ниже сопротивление.</li>
<li><strong>Горизонтальная полоса</strong> — соединяет электроды между собой.</li>
</ul>
<p><strong>Коэффициент использования</strong> — учитывает взаимное влияние электродов. Для 3-6 штук около 0.65.</p>
<p><strong>Норматив:</strong> ПУЭ п. 1.7.16.</p>`
  },
  kzcable: {
    title: 'Проверка кабеля по току КЗ',
    body: `<p>Проверяет, выдержит ли кабель ток короткого замыкания без повреждения изоляции.</p>
<p><strong>Что нужно ввести:</strong></p>
<ul>
<li><strong>Ток КЗ (А)</strong> — максимальный ток при коротком замыкании.</li>
<li><strong>Время отключения (с)</strong> — время срабатывания защиты.</li>
<li><strong>Сечение кабеля (мм2)</strong> — фактическое сечение.</li>
</ul>
<p><strong>Формула:</strong> Smin = Ikz x sqrt(t) / k, где k(медь)=143, k(алюм)=95.</p>
<p><strong>Норматив:</strong> ПУЭ — термическая стойкость кабелей.</p>`
  },
  busbar: {
    title: 'Расчёт шин',
    body: `<p>Расчёт допустимого тока для медных или алюминиевых шин.</p>
<p><strong>Что нужно ввести:</strong></p>
<ul>
<li><strong>Расчётный ток (А)</strong> — ток нагрузки.</li>
<li><strong>Размеры шины</strong> — ширина и толщина в мм.</li>
<li><strong>Количество шин</strong> — для больших токов используют 2-4 шины в комплекте.</li>
<li><strong>Температура окружения</strong> — выше 35 градусов снижает допустимый ток.</li>
</ul>
<p><strong>Плотность тока:</strong> медь до 2.5 А/мм2, алюминий до 1.6 А/мм2.</p>`
  },
  demandfactor: {
    title: 'Коэффициент спроса',
    body: `<p>Расчёт расчётной мощности с учётом коэффициента спроса.</p>
<p><strong>Коэффициент спроса (Kс)</strong> — учитывает, что не все приборы работают одновременно.</p>
<p><strong>Типичные значения:</strong></p>
<ul>
<li>Освещение: 0.8-0.9</li>
<li>Розетки: 0.6-0.8</li>
<li>Двигатели: 0.7-0.9</li>
<li>Нагреватели: 0.8-1.0</li>
</ul>
<p><strong>Формула:</strong> Pрасч = сумма(Kсi x Pномi).</p>`
  },
  fuse: {
    title: 'Подбор предохранителя',
    body: `<p>Подбор номинала предохранителя по току нагрузки.</p>
<p><strong>Типы:</strong></p>
<ul>
<li><strong>gG</strong> — общего назначения (до 50 кА)</li>
<li><strong>aM</strong> — двигательный (до 80 кА, для пусковых токов)</li>
<li><strong>gR</strong> — полупроводниковый (до 100 кА)</li>
</ul>
<p><strong>Формула:</strong> Iпред = Iнагр x k. Без пусковых токов k=1.5, с пусковыми k=2.5.</p>`
  },
  cablelength: {
    title: 'Длина кабеля 4-20 мА',
    body: `<p>Расчёт максимальной длины кабеля для токовой петли 4-20 мА.</p>
<p><strong>Принцип:</strong> напряжение питания должно быть достаточно для работы прибора на максимальном токе (20 мА).</p>
<p><strong>Формула:</strong> Rmax = (Vпит - Vмин) / 0.02, L = Rкаб x S / (2 x rho).</p>
<p><strong>Норматив:</strong> стандарт токовой петли 4-20 мА.</p>`
  },
  rtdtable: {
    title: 'Таблица RTD (Pt100/Pt500/Pt1000)',
    body: `<p>Пересчёт температуры в сопротивление и обратно для платиновых датчиков.</p>
<p><strong>Датчики:</strong> Pt100 (R0=100 Ом), Pt500, Pt1000.</p>
<p><strong>Формула:</strong> R = R0 x (1 + A x t + B x t2), A=3.9083e-3, B=-5.775e-7.</p>
<p><strong>Норматив:</strong> IEC 60751.</p>`
  },
  tcouple: {
    title: 'Термопара',
    body: `<p>Пересчёт милливольт в температуру и обратно для термопар.</p>
<p><strong>Типы:</strong></p>
<ul>
<li><strong>K</strong> (хромель-алюмель): 0-1372 градусов</li>
<li><strong>J</strong> (железо-константан): 0-760 градусов</li>
<li><strong>T</strong> (медь-константан): 0-400 градусов</li>
<li><strong>E</strong> (хромель-константан): 0-1000 градусов</li>
</ul>
<p><strong>Формула:</strong> полиномиальная аппроксимация NIST.</p>`
  },
  pneumline: {
    title: 'Пневмо-трасса (падение давления)',
    body: `<p>Расчёт падения давления в пневматической линии.</p>
<p><strong>Что нужно ввести:</strong></p>
<ul>
<li><strong>Расход (л/мин)</strong> — потребление сжатого воздуха.</li>
<li><strong>Диаметр трубы (мм)</strong> — внутренний диаметр.</li>
<li><strong>Длина трассы (м)</strong> — общая длина с фитингами.</li>
<li><strong>Рабочее давление (бар)</strong> — обычно 6 бар.</li>
</ul>
<p><strong>Формула:</strong> dP = lambda x L/D x rho x v2 / 2.</p>`
  },
  energyaudit: {
    title: 'Энергоаудит',
    body: `<p>Расчёт потребления электроэнергии и стоимости.</p>
<p><strong>Как пользоваться:</strong></p>
<ul>
<li>Добавьте оборудование с мощностью и количеством часов работы.</li>
<li>Укажите тариф за кВт-ч.</li>
</ul>
<p><strong>Что считает:</strong> потребление в сутки, месяц и год, стоимость в рублях.</p>`
  },
  cabletray: {
    title: 'Заполнение кабель-лотка',
    body: `<p>Проверка, помещаются ли кабели в лоток.</p>
<p><strong>Что нужно ввести:</strong></p>
<ul>
<li><strong>Размеры лотка</strong> — ширина и высота в мм.</li>
<li><strong>Коэффициент заполнения</strong> — рекомендуется 40% (ПУЭ).</li>
<li><strong>Список кабелей</strong> — наружный диаметр и количество.</li>
</ul>
<p><strong>Формула:</strong> Sкаб / Sлотка x 100%.</p>`
  },
  threephase: {
    title: 'Трёхфазные цепи: мощность',
    body: `<p>Расчёт активной (P), реактивной (Q) и полной (S) мощности в трёхфазной цепи.</p>
<p><strong>Что нужно ввести:</strong> линейное напряжение, ток и cos phi.</p>
<p><strong>Формулы:</strong> P = 1.732 x U x I x cos phi, S = 1.732 x U x I, Q = sqrt(S2 - P2).</p>
<p><strong>Связь:</strong> S2 = P2 + Q2 (треугольник мощностей).</p>`
  },
  dcvdrop: {
    title: 'Потери напряжения в DC цепи',
    body: `<p>Расчёт падения напряжения в цепи постоянного тока. В DC ток течёт туда и обратно по двум проводам, поэтому сопротивление считается для двойной длины.</p>
<p><strong>Формула:</strong> R = 2 x rho x L / S, dU = I x R.</p>
<p><strong>Допустимые потери:</strong> обычно не более 3% для DC цепей.</p>`
  },
  conduitfill: {
    title: 'Заполнение кабельной трубы (гофры)',
    body: `<p>Проверка, помещаются ли кабели в трубу заданного диаметра.</p>
<p><strong>Лимит заполнения:</strong> по ПУЭ не более 40% сечения трубы.</p>
<p><strong>Калькулятор</strong> также подбирает минимальный диаметр трубы для заданных кабелей.</p>
<p><strong>Стандартные диаметры:</strong> 16, 20, 25, 32, 40, 50, 63 мм.</p>`
  },
  motorstart: {
    title: 'Пуск двигателя: провал напряжения',
    body: `<p>При пуске двигателя ток возрастает в 5-7 раз, что вызывает провал напряжения в сети. Слишком большой провал мешает другому оборудованию.</p>
<p><strong>Способы пуска:</strong></p>
<ul>
<li><strong>DOL (прямой)</strong> — полный пусковой ток на клеммы.</li>
<li><strong>Звезда-треугольник</strong> — пусковой ток в 3 раза меньше.</li>
<li><strong>Плавный пуск</strong> — пусковой ток снижается до 45% от DOL.</li>
</ul>
<p><strong>Норматив:</strong> ПУЭ — провал не более 15% при пуске.</p>`
  },
  neutral: {
    title: 'Ток нейтрали (трёхфазная цепь)',
    body: `<p>При неравномерной нагрузке по фазам в нейтральном проводе течёт ток. Если нагрузка одинаковая по фазам — ток нейтрали равен нулю.</p>
<p><strong>Формула:</strong> Iн = sqrt(I12 + I22 + I32 - I1xI2 - I2xI3 - I1xI3).</p>
<p><strong>Проблема:</strong> в современных зданиях (светодиоды, компьютеры) 3-я гармоника (150 Гц) складывается в нейтрали, ток может превысить фазный!</p>`
  },
  cableloss: {
    title: 'Потери мощности в кабеле',
    body: `<p>Любой кабель消耗ует часть энергии на нагрев. Чем длиннее и тоньше кабель — тем больше потери.</p>
<p><strong>Формула:</strong> Pпот = I2 x R, где R = rho x L / S.</p>
<p><strong>Годовые потери:</strong> Pпот x 8760 часов / 1000 = кВт-ч/год.</p>
<p><strong>Стоимость:</strong> кВт-ч/год x тариф.</p>`
  },
  emergency: {
    title: 'Аварийное освещение',
    body: `<p>Расчёт ёмкости аккумуляторов для аварийного освещения при отключении электричества.</p>
<p><strong>Норма:</strong> минимальная освещённость не менее 10% от рабочей, но не менее 1 лк.</p>
<p><strong>Время работы:</strong> обычно 1 час (эвакуация).</p>
<p><strong>Норматив:</strong> СП 52.13330 — аварийное освещение.</p>`
  },
  solar: {
    title: 'Солнечная электростанция',
    body: `<p>Подбор количества солнечных панелей, аккумуляторов и инвертора.</p>
<p><strong>Что учитывает:</strong></p>
<ul>
<li>Суточное потребление (кВт-ч).</li>
<li>Солнечные часы (зависит от региона).</li>
<li>КПД системы (инвертор, потери в кабелях).</li>
<li>Автономность (дни без солнца).</li>
</ul>
<p><strong>Формула:</strong> Панели = Потребление / (Вт_панели x солн_часы x КПД).</p>`
  },
  arcflash: {
    title: 'Дуговая вспышка (Arc Flash)',
    body: `<p>Расчёт энергии дуговой вспышки при коротком замыкании в электрооборудовании. Определяет категорию средств защиты (СИЗ).</p>
<p><strong>Категории СИЗ (NFPA 70E):</strong></p>
<ul>
<li><strong>HRC 1:</strong> до 4 кал/см2 — огнестойкая одежда.</li>
<li><strong>HRC 2:</strong> до 8 кал/см2 — каска, лицевой щиток.</li>
<li><strong>HRC 3:</strong> до 25 кал/см2 — полный комплект СИЗ.</li>
<li><strong>HRC 4:</strong> до 40 кал/см2 — максимальная защита.</li>
<li><strong>> 40 кал/см2:</strong> запрещено работать под напряжением.</li>
</ul>
<p><strong>Норматив:</strong> IEEE 1584, NFPA 70E.</p>`
  },
  thd: {
    title: 'THD — коэффициент гармонических искажений',
    body: `<p>THD показывает, насколько форма тока или напряжения отличается от идеальной синусоиды. Высокий THD вызывает нагрев оборудования и ложные срабатывания защит.</p>
<p><strong>Допустимые значения:</strong></p>
<ul>
<li><strong>Напряжение:</strong> THD до 5% (IEEE 519).</li>
<li><strong>Ток:</strong> зависит от мощности источника.</li>
</ul>
<p><strong>Проблемные гармоники:</strong> 3-я (150 Гц) — складывается в нейтрали, 5-я и 7-я — основные искажения от преобразователей.</p>
<p><strong>Формула:</strong> THD = sqrt(H22 + H32 + ...) / H1 x 100%.</p>`
  }
};

const HELP_EN = {
  power: { title: 'Power and Load Current', body: `<p>Formula: I = P / (1.732 x U x cos phi x eta)</p><p>Standard: PUE cl. 1.3.10.</p>` },
  cable: {
    title: 'Cable Sizing',
    body: `<p>A cable section cannot be found with a single formula. The cable must survive heating by the operating current, stay within the permissible voltage drop, and withstand a short circuit until the protection trips. Each condition yields its own required section, and the largest one wins.</p>

<p><strong>Required inputs:</strong> network type (three-phase, single-phase or DC), load given either as power or as current, cos φ, line length as actually routed, and the permissible voltage drop — typically 3 % for lighting and 5 % for power circuits.</p>

<p><strong>Cable and installation.</strong> The tabulated ampacity applies to base conditions: PVC insulation, open installation in air, +25 °C, one or two loaded cores. Anything else is handled by correction factors that multiply together — insulation type, installation method, number of loaded cores, cables in the bundle, ambient temperature and cables per phase.</p>

<p><strong>Short-circuit and starting checks.</strong> Fill these in when the fault current and the protection clearing time are known: Smin = Ifault·√t / k, where k depends on conductor material and insulation (copper with PVC 115, with XLPE 143). The starting multiple matters for motors — inrush current runs 5 to 7 times rated, and the resulting dip must stay under 15 %.</p>

<p><strong>Results.</strong> The recommended standard section, a table showing what each criterion requires and which one is limiting, then design and permissible currents, margin, voltage drop in volts and percent, power loss, line impedance, conductor temperature under load, and the breaker rating.</p>

<p><strong>Method.</strong> A base ampacity table with correction factors is used rather than separate tables for every combination of conditions. For design documentation, verify results against PUE tables 1.3.4–1.3.11 directly.</p>

<p><strong>Standards:</strong> PUE tables 1.3.4 and 1.3.22–1.3.26, cl. 1.3.10, cl. 7.1.34 and 7.1.45; GOST R 50571.5.54.</p>`
  },
  ledstrip: {
    title: 'LED Strips',
    body: `<p>An LED strip is a distributed load: the LEDs draw current along the way, so less and less reaches the far end. Because of that the drop on the strip's own tracks grows <strong>with the square of the length</strong>:</p>

<p><strong>ΔU = r · i · L² / 2</strong> when fed from one end, where r is the resistance of the track pair (Ohm/m), i the current per metre (A/m), L the length.</p>

<p>Hence the point of this calculator: feeding from both ends cuts the drop <strong>fourfold</strong>, not twofold — the midpoint becomes a zero-current node and each half behaves as a run of half the length. On long runs a second feed point beats any wire upgrade, because track resistance does not depend on the supply cable section at all.</p>

<p><strong>Two modes.</strong> A single strip with a chosen feed scheme, or several strips fed from one split point — the usual case, where one wire runs from the power supply to a junction and branches out to strips of different lengths. In the second mode the calculator finds the worst branch: a short strip on a long branch easily loses to a long strip on a short one.</p>

<p><strong>Track resistance</strong> is the key parameter and the awkward one — manufacturers rarely publish it. The field is prefilled with a typical value for the strip width, from 1.2 Ohm/m for a narrow 8 mm strip down to 0.25 Ohm/m for a high-power 15 mm one. Real strips vary widely, so for critical work measure a 1 m piece with an ohmmeter. Note that the value is for the <strong>pair</strong> of tracks, plus and minus together.</p>

<p><strong>Results:</strong> recommended wire section, a per-branch table with current, section, drop and far-end voltage, the split between wire loss and strip loss, the optimal number of feed points, the power supply rating with reserve, and a voltage profile along the run.</p>

<p><strong>Rule of thumb:</strong> do not run more than 5 m at 12 V or 10 m at 24 V without additional feed points.</p>

<p><strong>Standards:</strong> PUE table 1.3.4 for wire ampacity. The strip drop is not covered by any standard — it is the integral of a distributed load.</p>`
  },
  voltage: { title: 'Voltage Drop', body: `<p>Formula: dU = 1.732 x I x L x (R x cos phi + X x sin phi) / 1000</p><p>Max 5% drop.</p>` },
  shortcircuit: { title: 'Short Circuit Current', body: `<p>Formula: Ikz = U / (1.732 x Z)</p><p>Standard: PUE cl. 1.4.1.</p>` },
  grounding: { title: 'Grounding', body: `<p>Formula: R = rho/(2 x pi x L) x ln(4L/d)</p><p>Standard: PUE cl. 1.7.16.</p>` },
  protection: { title: 'Circuit Breakers and RCD', body: `<p>Standard: PUE cl. 1.7.79.</p>` },
  compensation: { title: 'Reactive Power Compensation', body: `<p>Formula: Qc = P x (tg phi1 - tg phi2)</p>` },
  motor: { title: 'Electric Motors', body: `<p>Starting current is 5-7x rated. Use D-characteristic breakers.</p>` },
  transformer: { title: 'Transformer', body: `<p>Formula: S = P / cos phi, I = S / (1.732 x U)</p>` },
  lighting: { title: 'Lighting', body: `<p>Formula: N = (E x S) / (Phi x eta)</p><p>Standard: SP 52.13330.2016.</p>` },
  ups: { title: 'UPS and Batteries', body: `<p>Formula: Ah = (P x t) / (U x eta x DoD)</p>` },
  derating: { title: 'Cable Derating', body: `<p>Standard: PUE tables 1.3.23-1.3.26.</p>` },
  loadpanel: { title: 'Load Panel', body: `<p>Table of all electrical consumers. Demand factor 0.6-0.9.</p>` },
  converter: { title: 'Unit Converter', body: `<p>Quick conversion for electricians and engineers.</p>` },
  rccalc: { title: 'Circuit Elements', body: `<p>Resistors, capacitors, inductors in series/parallel. Voltage divider, RC/RL/LC circuits.</p>` },
  motorcap: { title: 'Motor Capacitor', body: `<p>Working and starting capacitors for single-phase motors.</p>` },
  capval: { title: 'Capacitor Values', body: `<p>3-digit code: first two = significant number, third = multiplier in pF.</p>` },
  led: { title: 'LED', body: `<p>Formula: R = (Vsupply - Vled) / I</p>` },
  zener: { title: 'Zener Diode', body: `<p>Formula: R = (Vin - Vz) / (Iz + IL)</p>` },
  rlc: { title: 'RLC Impedance', body: `<p>Formula: Z = sqrt(R2 + (XL - XC)2)</p>` },
  ne555: { title: 'NE555 Timer', body: `<p>Astable: f = 1.44/((R1+2R2) x C). Monostable: t = 1.1 x R x C.</p>` },
  opamp: { title: 'Op-Amp', body: `<p>Inverting: K = -Rf/R1. Non-inverting: K = 1 + Rf/R1.</p>` },
  '7seg': { title: '7-Segment Display', body: `<p>Seven LEDs in figure-8 pattern. CA and CC types.</p>` },
  diam2sec: { title: 'Diameter to Section', body: `<p>Formula: S = pi x d2 / 4</p>` },
  bridge: { title: 'Wheatstone Bridge', body: `<p>Formula: Vout = V x (R3/(R3+R4) - R2/(R1+R2))</p>` },
  kipia: { title: 'I&C (Instrumentation & Control)', body: `<p>Current loop, scaling, RTD, PID, accuracy.</p>` },
  pneumatics: { title: 'Pneumatics', body: `<p>Compressed air flow, cylinder force, compressor selection.</p>` },
  hydraulics: { title: 'Hydraulics', body: `<p>Hydraulic cylinder, pump, pipe pressure drop.</p>` },
  wirecab: {
    title: 'Wire & Ferrule Calculator for Electrical Cabinets',
    body: `<p>Estimate wire length and ferrule (НШВИ) count for cabinet wiring.</p>
<p><strong>Quick mode</strong> — enter cabinet dimensions and wire count for totals.</p>
<p><strong>Advanced mode</strong> — add wire groups with different sections and types.</p>
<p><strong>CSV export</strong> — download results for ordering materials.</p>`
  },
  groundcircuit: {
    title: 'Ground Circuit',
    body: `<p>Calculate ground circuit resistance from vertical electrodes and horizontal strip.</p>
<p><strong>Soil resistivity:</strong> clay 20-60, loam 40-100, sand 100-400 Ohm-m.</p>
<p><strong>Formula:</strong> Rvert = rho/(2*pi*L)*ln(4L/d).</p>
<p><strong>Standard:</strong> PUE cl. 1.7.16.</p>`
  },
  kzcable: {
    title: 'Cable Short Circuit Check',
    body: `<p>Check if cable withstands short circuit current thermally.</p>
<p><strong>Formula:</strong> Smin = Ikz * sqrt(t) / k, k(Cu)=143, k(Al)=95.</p>`
  },
  busbar: {
    title: 'Busbar Calculation',
    body: `<p>Calculate allowable current for copper or aluminum busbars.</p>
<p><strong>Current density:</strong> copper up to 2.5 A/mm2, aluminum up to 1.6 A/mm2.</p>`
  },
  demandfactor: {
    title: 'Demand Factor',
    body: `<p>Calculate load with demand factors. Typical: lighting 0.8-0.9, sockets 0.6-0.8, motors 0.7-0.9.</p>`
  },
  fuse: {
    title: 'Fuse Selection',
    body: `<p>Select fuse rating by load current. Formula: Ifuse = Iload * k (k=1.5 no startup, k=2.5 with startup).</p>`
  },
  cablelength: {
    title: '4-20 mA Cable Length',
    body: `<p>Calculate max cable length for 4-20 mA current loop. Formula: Rmax = (Vsupply - Vmin) / 0.02.</p>`
  },
  rtdtable: {
    title: 'RTD Table (Pt100/Pt500/Pt1000)',
    body: `<p>Convert temperature to resistance and back for platinum sensors. Formula: R = R0 * (1 + A*t + B*t2).</p>`
  },
  tcouple: {
    title: 'Thermocouple',
    body: `<p>Convert mV to temperature and back. Types: K, J, T, E. Polynomial NIST approximation.</p>`
  },
  pneumline: {
    title: 'Pneumatic Line Pressure Drop',
    body: `<p>Calculate pressure drop in pneumatic line. Formula: dP = lambda * L/D * rho * v2 / 2.</p>`
  },
  energyaudit: {
    title: 'Energy Audit',
    body: `<p>Calculate electricity consumption and cost. Add equipment with power and hours of operation.</p>`
  },
  cabletray: {
    title: 'Cable Tray Fill',
    body: `<p>Check if cables fit in tray. Recommended fill factor: 40%. Formula: Scable / Stray * 100%.</p>`
  },
  threephase: { title: 'Three-Phase Power', body: `<p>Calculate P, Q, S in three-phase circuits. P = 1.732 * U * I * cos phi.</p>` },
  dcvdrop: { title: 'DC Voltage Drop', body: `<p>DC circuit voltage drop. R = 2*rho*L/S, dU = I*R. Max 3% recommended.</p>` },
  conduitfill: { title: 'Conduit Fill', body: `<p>Check if cables fit in conduit. Max 40% fill per PUE.</p>` },
  motorstart: { title: 'Motor Starting', body: `<p>Voltage dip during motor start. Max 15% dip allowed. DOL, star-delta, soft start methods.</p>` },
  neutral: { title: 'Neutral Current', body: `<p>Calculate neutral current in unbalanced three-phase system. Formula: In = sqrt(I1²+I2²+I3²-I1·I2-I2·I3-I1·I3).</p>` },
  cableloss: { title: 'Cable Power Loss', body: `<p>Calculate power loss in cables. Ploss = I² × R. Annual cost calculation.</p>` },
  emergency: { title: 'Emergency Lighting', body: `<p>Calculate battery capacity for emergency lighting. Min 10% of normal, at least 1 lux.</p>` },
  solar: { title: 'Solar Panel Calculator', body: `<p>Size solar panels, batteries, and inverter for daily consumption.</p>` },
  arcflash: { title: 'Arc Flash', body: `<p>Calculate arc flash energy and PPE category per IEEE 1584 / NFPA 70E.</p>` },
  thd: { title: 'THD Harmonic Distortion', body: `<p>Calculate Total Harmonic Distortion. IEEE 519: THD ≤ 5% for voltage.</p>` }
};

const HELP_CONTENT = { ru: HELP_RU, en: HELP_EN };

export function toggleHelp() {
  const panel = $('#help-panel');
  const overlay = $('#help-overlay');
  if (!panel) return;
  const isOpen = panel.classList.contains('open');
  if (isOpen) {
    panel.classList.remove('open');
    overlay?.classList.remove('show');
  } else {
    const page = $('.page.active')?.id?.replace('page-', '');
    const helpData = HELP_CONTENT[lang]?.[page] || HELP_CONTENT.ru[page];
    const content = $('#help-content');
    if (content && helpData) {
      content.innerHTML = '<h3>' + helpData.title + '</h3>' + helpData.body;
    } else if (content) {
      const msg = lang === 'en' ? 'Select a calculator to see help.' : 'Выберите калькулятор, чтобы увидеть справку.';
      content.innerHTML = '<p style="color:var(--text-muted)">' + msg + '</p>';
    }
    panel.classList.add('open');
    overlay?.classList.add('show');
  }
}
