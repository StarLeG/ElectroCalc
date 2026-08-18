/* EngiCalc — Core: helpers, i18n, navigation, theme */
'use strict';

/* ===================== HELPERS ===================== */
export const $ = s => document.querySelector(s);
export const $$ = s => document.querySelectorAll(s);
export const num = id => parseFloat(document.getElementById(id)?.value);
export const round = (v, d) => { const f = 10**d; return Math.round(v*f)/f; };

export function toast(msg) {
  let t = $('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}

export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); toast(T('common.copied')); }
  catch { toast('Error'); }
}

/**
 * Экранирование текста, который попадает в innerHTML.
 * Названия групп и лент пользователь вводит сам, и без экранирования они
 * подставляются в разметку как есть.
 * @param {*} value исходное значение
 * @returns {string} безопасная для вставки строка
 */
export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));
}

export function validate(...ids) {
  for (const id of ids) {
    const el = document.getElementById(id);
    const v = parseFloat(el?.value);
    if (isNaN(v) || v < 0) {
      el?.classList.add('err');
      toast(T('common.check_data'));
      return false;
    }
    el?.classList.remove('err');
  }
  return true;
}

/**
 * Проверка величин, которые обязаны быть строго больше нуля.
 * validate() пропускает 0, а он в знаменателе даёт Infinity, и это Infinity
 * попадает прямо в разметку результата.
 * @param {...string} ids идентификаторы полей
 * @returns {boolean} true — все значения положительны
 */
export function validatePositive(...ids) {
  for (const id of ids) {
    const el = document.getElementById(id);
    const v = parseFloat(el?.value);
    if (!(v > 0)) {
      el?.classList.add('err');
      toast(T('common.check_data'));
      return false;
    }
    el?.classList.remove('err');
  }
  return true;
}

export function validateRange(id, min, max) {
  const el = document.getElementById(id);
  const v = parseFloat(el?.value);
  if (isNaN(v) || v < min || v > max) {
    el?.classList.add('err');
    toast(T('common.check_data'));
    return false;
  }
  el?.classList.remove('err');
  return true;
}

/* ===================== I18N ===================== */
export let lang = localStorage.getItem('lang') || 'ru';
export let i18nData = {};

export const I18N = {
  ru: {
    nav: {electrical:"ЭЛЕКТРИКА",power:"Мощность",cable:"Кабели",voltage:"Потери",shortcircuit:"КЗ",grounding:"Заземление",protection:"Защита",equipment:"ОБОРУДОВАНИЕ",compensation:"Компенсация",motor:"Двигатели",transformer:"Трансформатор",lighting:"Освещение",lighting_group:"ОСВЕЩЕНИЕ",ledstrip:"Светодиодные ленты",ups:"ИБП / АКБ",loadpanel:"Щит нагрузок",cable_networks:"КАБЕЛЬНЫЕ СЕТИ",derating:"Дерейтинг",diam2sec:"Диаметр→Сечение",converter:"Конвертер",cabinet:"МОНТАЖ ШКАФОВ",wirecab:"Провод и НШВИ",electronics:"ЭЛЕКТРОНИКА",rccalc:"R/C соединение",capval:"Значения конд.",motorcap:"Конденсатор Дв.",led:"Светодиод",zener:"Стабилитрон",rlc:"Импеданс RLC",bridge:"Мост Уитстона",microchips:"МИКРОСХЕМЫ",ne555:"NE555",opamp:"Опер. усилитель","7seg":"7-сегмент",kipia_group:"КИПиА",kipia:"КИПиА",pneumatics:"Пневматика",hydraulics:"Гидравлика"},
    crumb: {
      group: {electrical:"ЭЛЕКТРИКА",equipment:"ОБОРУДОВАНИЕ",lighting:"ОСВЕЩЕНИЕ",cablenet:"КАБЕЛЬНЫЕ СЕТИ",cabinet:"МОНТАЖ ШКАФОВ",energy:"ЭНЕРГЕТИКА",electronics:"ЭЛЕКТРОНИКА",chips:"МИКРОСХЕМЫ",kipia:"КИПиА",safety:"БЕЗОПАСНОСТЬ",system:"СИСТЕМА"},
      page: {power:"Мощность",cable:"Кабели",voltage:"Потери",shortcircuit:"КЗ",grounding:"Заземление",protection:"Защита",groundcircuit:"Заземл. контур",kzcable:"КЗ-кабель",motor:"Двигатели",motorstart:"Пуск двигателя",transformer:"Трансформатор",compensation:"Компенсация",lighting:"Освещение",emergency:"Аварийное освещ.",ledstrip:"Светодиодные ленты",ups:"ИБП / АКБ",loadpanel:"Щит нагрузок",derating:"Дерейтинг",diam2sec:"Диаметр→Сечение",cableloss:"Потери в кабеле",busbar:"Шины",cabletray:"Кабель-лоток",conduitfill:"Заполнение труб",converter:"Конвертер",wirecab:"Провод и НШВИ",demandfactor:"Коэфф. спроса",fuse:"Предохранитель",dcvdrop:"DC потери",threephase:"Три фазы",energyaudit:"Энергоаудит",solar:"Солнечная энергия",rccalc:"R/C соединение",capval:"Значения конд.",motorcap:"Конденсатор Дв.",led:"Светодиод",zener:"Стабилитрон",rlc:"Импеданс RLC",bridge:"Мост Уитстона",ne555:"NE555",opamp:"Опер. усилитель","7seg":"7-сегмент",kipia:"КИПиА",pneumatics:"Пневматика",pneumline:"Пневмо-трасса",hydraulics:"Гидравлика",rtdtable:"Таблица RTD",tcouple:"Термопара",cablelength:"Длина каб. 4-20",neutral:"Ток нейтрали",arcflash:"Дуговая вспышка",thd:"THD гармоники",help:"Справка",developer:"О программе",donate:"Поддержать"}
    },
    common: {input_data:"Исходные данные",result:"Результат",calculate:"Рассчитать",reset:"Сбросить",export_pdf:"Экспорт PDF",copy:"Копировать",formula_norm:"Формула и норматив",ready:"Готово",copied:"Скопировано",check_data:"Проверьте данные"},
    power: {p_power:"Мощность (кВт)",u_voltage:"Напряжение (В)",phase:"Фазность",phase1:"1 фаза",phase3:"3 фазы",cos_phi:"cos φ",efficiency:"КПД",current:"ТОК",total_power:"ПОЛНАЯ МОЩНОСТЬ",desc:"Расчётный ток нагрузки",ref:"ПУЭ п. 1.3.10"},
    cable: {
      net:"Тип сети", net_3ph:"Трёхфазная 380 В", net_1ph:"Однофазная 220 В", net_dc:"Постоянный ток",
      voltage:"Напряжение (В)", length:"Длина линии (м)",
      load_mode:"Нагрузка задана", mode_power:"Мощностью", mode_current:"Током",
      power:"Мощность (кВт)", current:"Ток нагрузки (А)", cos_phi:"cos φ", efficiency:"КПД",
      max_drop:"Допустимое ΔU (%)",
      group_cable:"Кабель и прокладка",
      material:"Материал", copper:"Медь (Cu)", aluminum:"Алюминий (Al)",
      cores:"Нагруженных жил", cores_1:"1 жила", cores_2:"2 жилы", cores_3:"3 жилы", cores_4:"4 жилы", cores_5:"5 жил",
      insulation:"Изоляция", ins_pvc:"ПВХ (70 °C)", ins_rubber:"Резина (65 °C)", ins_paper:"Бумажная (80 °C)", ins_xlpe:"Сшитый ПЭ (90 °C)",
      laying:"Способ прокладки", lay_air:"Открыто в воздухе", lay_tray:"В лотке", lay_duct:"В кабель-канале",
      lay_pipe:"В трубе", lay_wall:"Скрыто в стене", lay_ground:"В земле",
      bundle:"Кабелей в пучке", ambient:"Температура среды (°C)", parallel:"Кабелей на фазу",
      group_check:"Проверка по КЗ и пуску",
      ikz:"Ток КЗ (А)", sc_time:"Время отключения (с)", start_mult:"Кратность пуска", breaker_char:"Характеристика",
      section:"Рекомендуемое сечение", limiting:"ЛИМИТИРУЮЩИЙ КРИТЕРИЙ",
      calc_current:"РАСЧЁТНЫЙ ТОК", allowed_current:"ДОПУСТИМЫЙ ТОК", reserve:"ЗАПАС",
      drop_v:"ПАДЕНИЕ (В)", drop_pct:"ПАДЕНИЕ (%)", power_loss:"ПОТЕРИ МОЩНОСТИ",
      resistance:"СОПРОТИВЛЕНИЕ R", reactance:"РЕАКТАНС X", cond_temp:"ТЕМПЕРАТУРА ЖИЛЫ",
      diameter:"ДИАМЕТР ЖИЛЫ", breaker:"АВТОМАТ", k_total:"СУММАРНАЯ ПОПРАВКА",
      crit_heating:"Нагрев", crit_drop:"Падение напряжения", crit_thermal:"Термостойкость к КЗ", crit_start:"Падение при пуске",
      pass:"проходит", fail:"не проходит", mm2:"мм²",
      unit_mm:"мм", unit_a:"А", unit_v:"В", unit_w:"Вт", unit_ohmkm:"Ом/км",
      err_voltage:"Укажите напряжение сети", err_length:"Укажите длину линии",
      err_drop:"Укажите допустимое падение напряжения", err_cos:"cos φ должен быть в пределах 0.1…1",
      err_eta:"КПД должен быть в пределах 0…1", err_current:"Укажите ток нагрузки",
      err_power:"Укажите мощность нагрузки", err_parallel:"Число кабелей на фазу — не меньше 1",
      warn_over_range:"Ни одно сечение ряда не проходит по всем критериям. Нужна параллельная прокладка нескольких кабелей или разделение нагрузки.",
      warn_no_breaker:"Расчётный ток выходит за верх ряда автоматов до 250 А.",
      warn_breaker_over:"Номинал автомата больше допустимого тока кабеля — кабель не защищён от перегрузки. Увеличьте сечение либо снизьте номинал.",
      warn_alu_min:"ПУЭ 7.1.34: алюминиевые жилы в жилых и общественных зданиях допускаются от 16 мм².",
      warn_min_section:"Сечение меньше 2.5 мм² — для розеточных групп ПУЭ 7.1.45 требует не менее 2.5 мм² по меди.",
      warn_overheat:"Расчётная температура жилы выше предельной для выбранной изоляции.",
      warn_parallel:"Параллельные кабели должны быть одной марки, длины и сечения, иначе ток распределится неравномерно.",
      warn_max_section:"Выбрано предельное сечение ряда 240 мм². Рассмотрите параллельную прокладку — она обычно дешевле и удобнее в монтаже.",
      formula:"S = max(S_нагрев, S_ΔU, S_КЗ)",
      ref:"ПУЭ табл. 1.3.4, п. 1.3.10; ГОСТ Р 50571.5.54",
      method_note:"Метод: базовая таблица допустимых токов с поправками на изоляцию, способ прокладки, число жил, температуру среды и группу кабелей."
    },
    ledstrip: {
      mode:"Схема монтажа", mode_single:"Одна лента", mode_multi:"Несколько лент от одной точки",
      voltage:"Напряжение ленты (В)", max_drop:"Допустимое ΔU (%)",
      strip_type:"Тип ленты",
      type_standard:"Стандартная 10 мм (SMD 5050)", type_narrow:"Узкая 8 мм (SMD 3528)",
      type_wide:"Широкая 12 мм (SMD 2835)", type_power:"Мощная 15 мм (COB / 5630)", type_custom:"Задать вручную",
      watt_per_meter:"Мощность (Вт/м)", length:"Длина ленты (м)",
      scheme:"Схема питания", scheme_one:"С одного конца", scheme_both:"С двух концов",
      scheme_multi:"Несколько точек", scheme_ring:"Кольцевое",
      feed_points:"Точек питания", wire_length:"Провод от БП до ленты (м)",
      common_wire:"Общий провод от БП до точки распределения (м)",
      th_label:"Лента", th_len:"Длина, м", th_wpm:"Вт/м", th_r:"r, Ом/м", th_branch:"Ответвление, м", th_scheme:"Питание",
      add_strip:"+ Лента", remove_strip:"− Убрать", strip:"Лента",
      group_wire:"Лента и провод", track_resistance:"Сопротивление дорожек (Ом/м)",
      material:"Материал жилы", copper:"Медь (Cu)", aluminum:"Алюминий (Al)",
      parallel:"Параллельных проводов", ambient:"Температура среды (°C)",
      laying:"Способ прокладки", lay_air:"Открыто в воздухе", lay_tray:"В лотке",
      lay_duct:"В кабель-канале", lay_pipe:"В трубе", lay_wall:"Скрыто в стене",
      group_psu:"Блок питания", psu_reserve:"Запас мощности", psu_have:"Имеющийся БП (Вт)",
      section:"Рекомендуемое сечение провода", worst:"ХУДШАЯ ВЕТКА",
      total_current:"СУММАРНЫЙ ТОК", total_power:"СУММАРНАЯ МОЩНОСТЬ", psu:"БЛОК ПИТАНИЯ",
      drop_v:"ПРОСАДКА (В)", drop_pct:"ПРОСАДКА (%)",
      drop_wire:"ИЗ НИХ НА ПРОВОДЕ", drop_strip:"ИЗ НИХ НА ЛЕНТЕ",
      min_voltage:"НА ДАЛЬНЕМ СВЕТОДИОДЕ", power_loss:"ПОТЕРИ В ПРОВОДАХ",
      common_section:"ОБЩИЙ ПРОВОД", opt_points:"ОПТИМУМ ТОЧЕК ПИТАНИЯ",
      no_common:"не требуется", pts:"точек", mm2:"мм²",
      unit_a:"А", unit_v:"В", unit_w:"Вт", unit_m:"м",
      chart_title:"Напряжение вдоль ленты", chart_x:"Расстояние от точки питания, м",
      chart_y:"Напряжение, В", chart_limit:"граница допуска",
      err_voltage:"Укажите напряжение питания ленты", err_drop:"Укажите допустимое падение напряжения",
      err_parallel:"Число параллельных проводов — не меньше 1", err_no_strips:"Добавьте хотя бы одну ленту",
      err_length:"Укажите длину ленты", err_power:"Укажите мощность ленты в Вт/м",
      err_track:"Сопротивление дорожек не может быть отрицательным",
      err_points:"Точек питания должно быть не меньше двух",
      warn_no_solution:"Ни одно сечение из ряда не позволяет уложиться в допуск. Нужно добавить точки питания, укоротить отрезки или перейти на более высокое напряжение.",
      warn_strip_dominates:"Просадку создаёт сама лента, а не провод. Утолщать провод бесполезно: сопротивление дорожек от сечения питающего кабеля не зависит. Добавьте точки питания либо возьмите ленту на большее напряжение.",
      warn_over_hard_limit:"Просадка превышает 10 %. Яркость на дальнем конце будет заметно ниже, а у лент с драйверами возможно мерцание.",
      warn_max_run:"Длина отрезка превышает практический предел для этого напряжения при питании с одного конца: 5 м для 12 В и 10 м для 24 В.",
      warn_prefer_24v:"На 12 В при такой длине просадка растёт быстро. Переход на 24 В при той же мощности вчетверо снижает потери: ток вдвое меньше, а падение пропорционально току.",
      warn_psu_small:"Указанный блок питания не покрывает нагрузку с запасом. Возьмите номинал выше.",
      warn_psu_range:"Требуемая мощность выходит за ряд блоков питания до 600 Вт. Разделите нагрузку на несколько БП.",
      warn_parallel:"Параллельные провода должны быть одной длины и сечения, иначе ток распределится неравномерно.",
      warn_feed_points_hopeless:"Даже двадцать точек питания не спасают: слишком велико сопротивление дорожек при такой длине. Разбейте ленту на независимые отрезки.",
      formula:"ΔU_ленты = r · i · L² / k,  k = 2 (один конец), 8 (два конца), 8(N−1)² (N точек)",
      ref:"ПУЭ табл. 1.3.4 — допустимый ток провода; просадка на дорожках — интеграл распределённой нагрузки",
      method_note:"Сопротивление дорожек по умолчанию — типовое для указанной ширины ленты. Для ответственного монтажа измерьте его омметром на отрезке 1 м."
    },
    voltage: {current:"Ток (А)",length:"Длина линии (м)",r_resist:"R (Ом/км)",x_react:"X (Ом/км)",voltage:"U (В)",drop_pct:"ПАДЕНИЕ (%)",drop_v:"ПАДЕНИЕ (В)",desc:"ПАДЕНИЕ НАПРЯЖЕНИЯ",formula:"ΔU = √3·I·L·(R·cosφ + X·sinφ) / 1000",ref:"ПУЭ п. 1.3.10"},
    shortcircuit: {voltage:"Линейное напряжение (В)",impedance:"Полное сопротивление (Ом)",ikz:"ТОК КОРОТКОГО ЗАМЫКАНИЯ",z_val:"ПОЛНОЕ СОПРОТИВЛЕНИЕ",formula:"Iкз = U / (√3 × Z)",ref:"ПУЭ п. 1.4.1"},
    grounding: {rho:"ρ грунта (Ом·м)",length:"Длина электрода (м)",diameter:"Диаметр электрода (м)",r_required:"Требуемое R (Ом)",electrodes:"электродов",desc:"ЧИСЛО ЭЛЕКТРОДОВ",ref:"ПУЭ п. 1.7.16"},
    protection: {load_current:"Ток нагрузки (А)",breaker_char:"Характеристика автомата",leak_current:"Ток утечки (мА)",uzo_nominal:"НОМИНАЛ УЗО",formula:"Iавт ≥ Iнагр · kзап",ref:"ПУЭ п. 1.7.79"},
    compensation: {title:"Компенсация реактивной мощности",active_power:"Активная мощность (кВт)",cos_before:"cos φ до",cos_after:"cos φ после",step_size:"Размер ступени (квар)",compensation:"КОМПЕНСАЦИЯ",steps:"СТУПЕНЕЙ",before:"ДО (квар)",after:"ПОСЛЕ (квар)",savings:"ЭКОНОМИЯ",formula:"Qc = P·(tgφ₁ − tgφ₂)",ref:"ПУЭ п. 1.5.15"},
    motor: {title:"Электродвигатель",power:"Мощность (кВт)",voltage:"Напряжение (В)",cos_phi:"cos φ",efficiency:"КПД",start_mult:"Кратность пускового тока",nominal_current:"Номинальный ток",starting_current:"ПУСКОВОЙ ТОК",breaker:"АВТОМАТ",section:"СЕЧЕНИЕ",formula:"I = P / (√3 × U × cos φ × η)",ref:"ПУЭ п. 1.3.10"},
    transformer: {title:"Трансформатор",load:"Нагрузка (кВт)",hv_voltage:"Напряжение ВН (кВ)",lv_voltage:"Напряжение НН (кВ)",uk:"uк (%)",hv_current:"ТОК ВН",lv_current:"ТОК НН",sc_current:"ТОК КЗ",loading:"ЗАГРУЗКА",formula:"S = P / cos φ, I = S / (√3 × U)",ref:"ПУЭ"},
    lighting: {title:"Освещение",area:"Площадь помещения (м²)",illuminance:"Требуемая освещённость (лк)",luminous_flux:"Световой поток (лм)",fixture_power:"Мощность светильника (Вт)",utilization:"КИП (утилизация)",fixtures:"светильников",power:"МОЩНОСТЬ",specific:"УДЕЛЬНАЯ",formula:"N = (E·S·Kз) / (Φ·η)",ref:"СП 52.13330.2016"},
    ups: {title:"ИБП / АКБ / Генератор",load:"Нагрузка (кВт)",reserve_time:"Время резерва (мин)",battery_voltage:"Напряжение АКБ (В)",ups_efficiency:"КПД ИБП",capacity:"ЁМКОСТЬ",generator:"ГЕНЕРАТОР",formula:"Ah = (P·t) / (U·η·DoD)"},
    converter: {title:"Конвертер единиц",type:"Тип конвертации",value:"Значение",result:"Результат",convert:"Конвертировать"},
    derating: {title:"Кабельный дерейтинг",base_current:"Базовый ток кабеля (А)",ambient_temp:"Температура окружения (°C)",cable_count:"Число кабелей в пучке",install_method:"Способ прокладки",in_air:"На воздухе",in_ground:"В земле",desc:"ДОПУСТИМЫЙ ТОК",k_temp:"k_ТЕМПЕРАТУРА",k_group:"k_ГРУППА",total_k:"ИТОГО k",reduction:"СНИЖЕНИЕ"},
    loadpanel: {title:"Щит нагрузок",group:"Группа",power_kW:"P (кВт)",cos_phi:"cos φ",demand:"Kс",phase:"Фаза",voltage:"Линейное напряжение (В)",add_row:"+ Группа",total_power:"ΣP_НОМ",calc_power:"P_РАСЧ",current_L1:"ТОК L1",current_L2:"ТОК L2",current_L3:"ТОК L3",imbalance:"ДИСБАЛАНС"},
    pneumatics: {title:"Пневматика",tab_flow:"Расход воздуха",tab_cylinder:"Пневмоцилиндр",tab_compressor:"Компрессор",flow_title:"Расход сжатого воздуха",devices_count:"Число потребителей",device_flow:"Расход 1 потребителя (л/мин)",duty_cycle:"Коэфф. использования (0–1)",leak_factor:"Коэфф. утечек",total_flow:"СУММАРНЫЙ РАСХОД",peak_flow:"ПИКОВЫЙ",with_leaks:"С УТЕЧКАМИ",cyl_title:"Пневмоцилиндр",bore_diameter:"Диаметр поршня (мм)",rod_diameter:"Диаметр штока (мм)",stroke:"Ход (мм)",working_pressure:"Рабочее давление (бар)",air_flow_cyl:"Расход воздуха (л/мин)",force_forward:"СИЛА (ВПЕРЁД)",force_backward:"СИЛА (НАЗАД)",speed:"СКОРОСТЬ",time:"ВРЕМЯ ХОДА",volume:"ОБЪЁМ",comp_title:"Подбор компрессора",required_flow:"Требуемый расход (л/мин)",required_pressure:"Требуемое давление (бар)",reserve_factor:"Коэфф. запаса",tank_time:"Время заполнения ресивера (с)",comp_flow:"РАСХОД КОМПРЕССОРА",comp_power:"МОЩНОСТЬ",tank_volume:"ОБЪЁМ РЕСИВЕРА"},
    hydraulics: {title:"Гидравлика",tab_cylinder:"Гидроцилиндр",tab_pump:"Гидронасос",tab_pipe:"Потери в трубе",cyl_title:"Гидроцилиндр",bore:"Диаметр поршня (мм)",rod:"Диаметр штока (мм)",stroke:"Ход (мм)",pressure:"Рабочее давление (бар)",flow:"Расход насоса (л/мин)",efficiency:"КПД",force_push:"СИЛА (ТОЛКАНИЕ)",force_pull:"СИЛА (ТЯГА)",speed:"СКОРОСТЬ",time:"ВРЕМЯ ХОДА",power:"МОЩНОСТЬ",pump_title:"Подбор гидронасоса",required_flow:"Требуемый расход (л/мин)",required_pressure:"Рабочее давление (бар)",pump_efficiency:"КПД насоса",motor_efficiency:"КПД двигателя",motor_power:"МОЩНОСТЬ ДВИГАТЕЛЯ",pump_type:"ТИП НАСОСА",displacement:"ОБЪЁМ НА ОБОРОТ",pipe_title:"Потери давления в трубе",pipe_length:"Длина трубы (м)",pipe_diameter:"Диаметр трубы (мм)",oil_flow:"Расход масла (л/мин)",oil_viscosity:"Вязкость масла (сСт)",pressure_loss:"ПОТЕРЯ ДАВЛЕНИЯ",velocity:"СКОРОСТЬ",flow_type:"РЕЖИМ",lambda:"λ"},
    kipia: {title:"КИПиА — Расчёты",tab_loop:"Токовая петля",tab_scaling:"Масштабирование",tab_rtd:"RTD",tab_pid:"ПИД",tab_accuracy:"Погрешности",loop_title:"Токовая петля 4–20 мА",supply_voltage:"Напряжение питания (В)",min_voltage:"Мин. напряжение прибора (В)",r_wires:"R проводов (Ом)",r_instrument:"R прибора (Ом)",r_barrier:"R барьера (Ом)",loop_valid:"✓ Петля валидна",loop_invalid:"✗ Петля невалидна",r_max:"МАКС. R",r_total:"R СУММАРНОЕ",v_drop:"ПАДЕНИЕ",status:"СТАТУС",scaling_title:"Масштабирование сигнала",signal:"Сигнал (мА)",sig_min:"Мин. сигнал (мА)",sig_max:"Макс. сигнал (мА)",process_units:"единиц процесса",formula_scaling:"PV = LRV + (S−Smin)/(Smax−Smin) × (URV−LRV)",ref_scaling:"IEC 61131-3",rtd_title:"RTD Pt100 / Pt500 / Pt1000",mode:"Режим",temp_to_res:"Температура → Сопротивление",res_to_temp:"Сопротивление → Температура",value:"Значение",sensor_type:"Тип датчика",formula_rtd:"R = R₀ × (1 + A·t + B·t²)",ref_rtd:"IEC 60751",pid_title:"Настройка ПИД",ku:"Критическое усиление Ku",tu:"Критический период Tu (с)",formula_pid:"Kp=0.6·Ku, Ti=0.5·Tu, Td=0.125·Tu",ref_pid:"Циглер-Никольс",accuracy_title:"Погрешности и разрядность",accuracy_class:"Класс точности (%)",range:"Диапазон",adc_bits:"Разрядность АЦП",abs_error:"АБС. ПОГРЕШНОСТЬ",lsb_adc:"LSB АЦП"},
    wirecab: {title:"Расчёт провода и НШВИ для электрического шкафа",quick:"Быстрый (оценочный)",advanced:"Расширенный (по группам)",input:"Исходные данные",height:"Высота шкафа (мм)",width:"Ширина шкафа (мм)",wire_count:"Количество проводов",reserve:"Запас (%)",ends:"Концов с НШВИ",wire_type:"Тип провода",multi:"Многожильный (ПуГВ/ПВ-3)",single:"Одножильный",avg_length:"средняя длина провода",total_length:"ОБЩИЙ МЕТРАЖ",nshvi_single:"НШВИ ОДИНАРНЫЕ",nshvi_double:"НШВИ ДВОЙНЫЕ",marking:"МАРКИРОВКА",ref:"Ориентировочный расчёт для электромонтажа шкафов",download_csv:"Скачать CSV",group_name:"Группа",count:"Кол-во",section:"Сечение",length:"Длина (м)",type:"Тип",ends_short:"Концы",nshvi2_count:"НШВИ-2",ring_count:"Кольцевые",add_group:"+ Группа",remove_group:"- Убрать",summary_by_section:"Сводка по сечениям",nshvi_size:"Размер НШВИ",ring:"КОЛЬЦЕВЫЕ"},
    developer: {title:"О программе",name:"Разработчик",reg_authority:"Регистрирующий орган",address:"Адрес",registration:"Регистрация",trade_reg:"Торговый реестр",bank_details:"Реквизиты",contacts:"Контакты",license:"Лицензия: LGPL v3.0",repo:"Репозиторий",telegram:"Telegram"},
    donate: {title:"Поддержать проект",desc:"Если EngiCalc оказался полезен, вы можете поддержать его развитие.",erip:"В дереве ЕРИП выберите «E-POS — оплата товаров и услуг» и введите код:",card:"Оплата банковской картой по ссылке:",qr:"Считайте QR-код с помощью приложения мобильного банкинга"},
    editor: {
      title:"Редактор электрических схем",nav:"Редактор схем",group:"РЕДАКТОР",
      components:"Компоненты",properties:"Свойства",sim_results:"Результаты эмуляции",
      load:"Загрузить",wire:"Провод",undo:"Отменить",redo:"Повторить",clear:"Очистить",
      run:"▶ Эмуляция",stop:"■ Правка",json:"JSON",import:"Импорт",svg:"SVG",png:"PNG",
      select_element:"Выберите элемент на схеме",value:"Номинал",state:"Состояние",
      rotate:"Повернуть на 90°",delete:"Удалить",
      hint:"R — поворот · Del — удалить · W — провод · Ctrl+Z — отмена",
      node_voltages:"Напряжения узлов",branches:"Токи и мощности",warnings:"Замечания",
      sw_closed:"замкнут",sw_open:"разомкнут",
      p_beta:"β — коэффициент передачи тока",
      p_vbe:"Uбэ отпирания",p_vsat:"Uкэ насыщения",
      reg_active:"активный режим",reg_sat:"насыщение",reg_cutoff:"отсечка",
      base_current:"Ток базы",
      p_gain:"K — коэффициент усиления",p_vcc:"Питание +",p_vee:"Питание −",
      reg_linear:"линейный режим",reg_sat_hi:"упор в «+» питания",reg_sat_lo:"упор в «−» питания",
      diff_input:"Разность на входах",
      preset_opamp_inv:"Инвертирующий усилитель",preset_opamp_ninv:"Неинвертирующий усилитель",
      preset_opamp_follow:"Повторитель напряжения",preset_opamp_comp:"Компаратор",
      c_optocoupler:"Оптопара",c_scr:"Тиристор",c_triac:"Симистор",c_diac:"Динистор (диак)",
      p_ctr:"CTR — коэффициент передачи тока",p_vf_led:"Отпирание светодиода",
      led_current:"Ток светодиода",preset_opto:"Оптопара: развязка",
      transient:"Процесс",transient_results:"Переходный процесс",
      tr_time:"Время, с",tr_step:"Шаг, с",tr_run:"Рассчитать",
      tr_voltages:"Напряжения",tr_currents:"Токи",
      tr_pick:"Выберите сигналы для графика",
      err_no_reactive:"В схеме нет конденсаторов и катушек — переходному процессу неоткуда взяться",
      c_relay:"Катушка реле",c_contactor:"Катушка контактора",
      c_contactNO:"Контакт замыкающий",c_contactNC:"Контакт размыкающий",
      p_vt:"Падение в открытом состоянии",p_igt:"Ток отпирания",
      p_vbo:"Напряжение включения",p_forced_on:"Открыт принудительно",
      p_upick:"Напряжение срабатывания",p_coil:"Катушка",
      coil_auto:"— автоматически —",yes:"да",no:"нет",
      reg_thy_on:"открыт",reg_thy_off:"закрыт",
      reg_coil_on:"сработала",reg_coil_off:"обесточена",
      reg_ct_closed:"замкнут",reg_ct_open:"разомкнут",
      gate_current:"Ток управления",
      preset_relay:"Реле с самоблокировкой",preset_scr:"Тиристорный ключ",
      warn_latched:"Тиристорные приборы в статике не запираются — для этого нужен анализ во времени",
      c_resistor:"Резистор",c_capacitor:"Конденсатор",c_inductor:"Катушка",
      c_vsource:"Источник U",c_isource:"Источник I",c_diode:"Диод",c_led:"Светодиод",
      c_zener:"Стабилитрон",c_switch:"Ключ",c_lamp:"Лампа",c_ground:"Земля",
      c_npn:"Транзистор NPN",c_pnp:"Транзистор PNP",c_opamp:"ОУ",c_wire:"Провод",
      preset_placeholder:"— Готовая схема —",
      preset_divider:"Делитель напряжения",preset_led:"Светодиод с резистором",
      preset_serpar:"Последовательно-параллельное",preset_rc:"RC-звено",
      preset_bridge:"Мост Уитстона",preset_zener:"Стабилизатор на стабилитроне",
      preset_isource:"Источник тока",preset_switch:"Ключ и лампа",
      preset_bjtsw:"Транзисторный ключ",preset_bjtamp:"Каскад с общим эмиттером",
      err_no_ground:"Нет заземления: добавьте элемент «Земля» — он задаёт нулевой потенциал",
      err_singular:"Схему не удалось решить: проверьте короткие замыкания и оборванные связи",
      err_empty:"Схема пуста — добавьте элементы",
      err_internal:"Внутренняя ошибка расчёта",
      err_import:"Не удалось прочитать файл схемы",
      err_png:"Не удалось построить PNG",
      err_no_library:"Библиотека УГО не загружена",
      warn_power:"{ref}: рассеиваемая мощность {p}",
      warn_no_convergence:"Расчёт не сошёлся — результат приблизительный",
      warn_unmodeled:"Часть элементов не имеет модели и в расчёте не участвует",
      iss_no_ground:"В схеме нет заземления",
      iss_floating_pin:"{ref}.{pin} никуда не подключён",
      iss_shorted_source:"{ref}: выводы источника замкнуты между собой"
    }
  },
  en: {
    nav: {electrical:"ELECTRICAL",power:"Power",cable:"Cables",voltage:"Voltage Drop",shortcircuit:"Short Circuit",grounding:"Grounding",protection:"Protection",equipment:"EQUIPMENT",compensation:"Compensation",motor:"Motors",transformer:"Transformer",lighting:"Lighting",lighting_group:"LIGHTING",ledstrip:"LED strips",ups:"UPS / Battery",loadpanel:"Load Panel",cable_networks:"CABLE NETWORKS",derating:"Derating",diam2sec:"Diameter→Section",converter:"Converter",cabinet:"CABINET WIRING",wirecab:"Wire & Ferrules",electronics:"ELECTRONICS",rccalc:"R/C Connection",capval:"Capacitor Codes",motorcap:"Motor Capacitor",led:"LED",zener:"Zener Diode",rlc:"RLC Impedance",bridge:"Wheatstone Bridge",microchips:"IC CHIPS",ne555:"NE555",opamp:"Op-Amp","7seg":"7-Segment",kipia_group:"I&C",kipia:"I&C",pneumatics:"Pneumatics",hydraulics:"Hydraulics"},
    crumb: {
      group: {electrical:"ELECTRICAL",equipment:"EQUIPMENT",lighting:"LIGHTING",cablenet:"CABLE NETWORKS",cabinet:"CABINET WIRING",energy:"POWER ENGINEERING",electronics:"ELECTRONICS",chips:"IC CHIPS",kipia:"I&C",safety:"SAFETY",system:"SYSTEM"},
      page: {power:"Power",cable:"Cables",voltage:"Voltage Drop",shortcircuit:"Short Circuit",grounding:"Grounding",protection:"Protection",groundcircuit:"Ground Loop",kzcable:"SC Cable Check",motor:"Motors",motorstart:"Motor Starting",transformer:"Transformer",compensation:"Compensation",lighting:"Lighting",emergency:"Emergency Lighting",ledstrip:"LED strips",ups:"UPS / Battery",loadpanel:"Load Panel",derating:"Derating",diam2sec:"Diameter→Section",cableloss:"Cable Losses",busbar:"Busbars",cabletray:"Cable Tray",conduitfill:"Conduit Fill",converter:"Converter",wirecab:"Wire & Ferrules",demandfactor:"Demand Factor",fuse:"Fuse",dcvdrop:"DC Voltage Drop",threephase:"Three-Phase",energyaudit:"Energy Audit",solar:"Solar Power",rccalc:"R/C Connection",capval:"Capacitor Codes",motorcap:"Motor Capacitor",led:"LED",zener:"Zener Diode",rlc:"RLC Impedance",bridge:"Wheatstone Bridge",ne555:"NE555",opamp:"Op-Amp","7seg":"7-Segment",kipia:"I&C",pneumatics:"Pneumatics",pneumline:"Pneumatic Line",hydraulics:"Hydraulics",rtdtable:"RTD Table",tcouple:"Thermocouple",cablelength:"4-20 mA Cable",neutral:"Neutral Current",arcflash:"Arc Flash",thd:"THD Harmonics",help:"Help",developer:"About",donate:"Support"}
    },
    common: {input_data:"Input Data",result:"Result",calculate:"Calculate",reset:"Reset",export_pdf:"Export PDF",copy:"Copy",formula_norm:"Formula & Standard",ready:"Ready",copied:"Copied to clipboard",check_data:"Please check input data"},
    power: {p_power:"Power (kW)",u_voltage:"Voltage (V)",phase:"Phase",phase1:"Single phase",phase3:"Three phase",cos_phi:"cos φ",efficiency:"Efficiency",current:"CURRENT",total_power:"TOTAL POWER",desc:"Calculated load current",ref:"PUE cl. 1.3.10"},
    cable: {
      net:"Network type", net_3ph:"Three-phase 380 V", net_1ph:"Single-phase 220 V", net_dc:"Direct current",
      voltage:"Voltage (V)", length:"Line length (m)",
      load_mode:"Load defined by", mode_power:"Power", mode_current:"Current",
      power:"Power (kW)", current:"Load current (A)", cos_phi:"cos φ", efficiency:"Efficiency",
      max_drop:"Permissible ΔU (%)",
      group_cable:"Cable and installation",
      material:"Material", copper:"Copper (Cu)", aluminum:"Aluminum (Al)",
      cores:"Loaded cores", cores_1:"1 core", cores_2:"2 cores", cores_3:"3 cores", cores_4:"4 cores", cores_5:"5 cores",
      insulation:"Insulation", ins_pvc:"PVC (70 °C)", ins_rubber:"Rubber (65 °C)", ins_paper:"Impregnated paper (80 °C)", ins_xlpe:"XLPE (90 °C)",
      laying:"Installation method", lay_air:"Open in air", lay_tray:"In tray", lay_duct:"In trunking",
      lay_pipe:"In conduit", lay_wall:"Concealed in wall", lay_ground:"Buried in ground",
      bundle:"Cables in bundle", ambient:"Ambient temperature (°C)", parallel:"Cables per phase",
      group_check:"Short-circuit and starting checks",
      ikz:"Fault current (A)", sc_time:"Clearing time (s)", start_mult:"Starting current multiple", breaker_char:"Characteristic",
      section:"Recommended section", limiting:"LIMITING CRITERION",
      calc_current:"DESIGN CURRENT", allowed_current:"PERMISSIBLE CURRENT", reserve:"MARGIN",
      drop_v:"DROP (V)", drop_pct:"DROP (%)", power_loss:"POWER LOSS",
      resistance:"RESISTANCE R", reactance:"REACTANCE X", cond_temp:"CONDUCTOR TEMPERATURE",
      diameter:"CONDUCTOR DIAMETER", breaker:"BREAKER", k_total:"TOTAL DERATING",
      crit_heating:"Heating", crit_drop:"Voltage drop", crit_thermal:"Short-circuit withstand", crit_start:"Drop at motor start",
      pass:"passes", fail:"fails", mm2:"mm²",
      unit_mm:"mm", unit_a:"A", unit_v:"V", unit_w:"W", unit_ohmkm:"Ohm/km",
      err_voltage:"Enter the system voltage", err_length:"Enter the line length",
      err_drop:"Enter the permissible voltage drop", err_cos:"cos φ must be between 0.1 and 1",
      err_eta:"Efficiency must be between 0 and 1", err_current:"Enter the load current",
      err_power:"Enter the load power", err_parallel:"Cables per phase must be at least 1",
      warn_over_range:"No section in the series passes every criterion. Run several cables in parallel or split the load.",
      warn_no_breaker:"Design current exceeds the 250 A breaker series.",
      warn_breaker_over:"Breaker rating exceeds the cable permissible current — the cable is unprotected against overload. Increase the section or lower the rating.",
      warn_alu_min:"PUE 7.1.34: aluminium conductors in residential and public buildings are allowed from 16 mm2 upwards.",
      warn_min_section:"Section below 2.5 mm2 — PUE 7.1.45 requires at least 2.5 mm2 copper for socket circuits.",
      warn_overheat:"Calculated conductor temperature exceeds the limit for the selected insulation.",
      warn_parallel:"Parallel cables must share the same type, length and section, otherwise the current will not split evenly.",
      warn_max_section:"The largest section in the series (240 mm2) was selected. Consider parallel cables — usually cheaper and easier to install.",
      formula:"S = max(S_heating, S_dU, S_fault)",
      ref:"PUE table 1.3.4, cl. 1.3.10; GOST R 50571.5.54",
      method_note:"Method: base ampacity table with corrections for insulation, installation method, number of loaded cores, ambient temperature and grouping."
    },
    ledstrip: {
      mode:"Installation layout", mode_single:"Single strip", mode_multi:"Several strips from one point",
      voltage:"Strip voltage (V)", max_drop:"Permissible ΔU (%)",
      strip_type:"Strip type",
      type_standard:"Standard 10 mm (SMD 5050)", type_narrow:"Narrow 8 mm (SMD 3528)",
      type_wide:"Wide 12 mm (SMD 2835)", type_power:"High-power 15 mm (COB/5630)", type_custom:"Custom",
      watt_per_meter:"Power (W/m)", length:"Strip length (m)",
      scheme:"Feed scheme", scheme_one:"From one end", scheme_both:"From both ends",
      scheme_multi:"Several feed points", scheme_ring:"Ring feed",
      feed_points:"Feed points", wire_length:"Wire from PSU to strip (m)",
      common_wire:"Common wire from PSU to the split point (m)",
      th_label:"Strip", th_len:"Length, m", th_wpm:"W/m", th_r:"r, Ohm/m", th_branch:"Branch, m", th_scheme:"Feed",
      add_strip:"+ Strip", remove_strip:"− Remove", strip:"Strip",
      group_wire:"Strip and wire", track_resistance:"Track resistance (Ohm/m)",
      material:"Conductor material", copper:"Copper (Cu)", aluminum:"Aluminum (Al)",
      parallel:"Parallel wires", ambient:"Ambient temperature (°C)",
      laying:"Installation method", lay_air:"Open in air", lay_tray:"In tray",
      lay_duct:"In trunking", lay_pipe:"In conduit", lay_wall:"Concealed in wall",
      group_psu:"Power supply", psu_reserve:"Power reserve", psu_have:"Existing PSU (W)",
      section:"Recommended wire section", worst:"WORST BRANCH",
      total_current:"TOTAL CURRENT", total_power:"TOTAL POWER", psu:"POWER SUPPLY",
      drop_v:"DROP (V)", drop_pct:"DROP (%)",
      drop_wire:"OF THAT IN WIRE", drop_strip:"OF THAT IN STRIP",
      min_voltage:"AT THE FARTHEST LED", power_loss:"LOSS IN WIRES",
      common_section:"COMMON WIRE", opt_points:"OPTIMAL FEED POINTS",
      no_common:"not needed", pts:"points", mm2:"mm2",
      unit_a:"A", unit_v:"V", unit_w:"W", unit_m:"m",
      chart_title:"Voltage along the strip", chart_x:"Distance from the feed point, m",
      chart_y:"Voltage, V", chart_limit:"tolerance limit",
      err_voltage:"Enter the strip supply voltage", err_drop:"Enter the permissible voltage drop",
      err_parallel:"Parallel wires must be at least 1", err_no_strips:"Add at least one strip",
      err_length:"Enter the strip length", err_power:"Enter the strip power in W/m",
      err_track:"Track resistance cannot be negative",
      err_points:"There must be at least two feed points",
      warn_no_solution:"No section in the series keeps the drop within tolerance. Add feed points, shorten the runs, or move to a higher supply voltage.",
      warn_strip_dominates:"The drop comes from the strip itself, not the wire. Thickening the wire will not help: track resistance does not depend on the supply cable section. Add feed points or use a higher-voltage strip.",
      warn_over_hard_limit:"Drop exceeds 10 %. The far end will be visibly dimmer, and strips with drivers may flicker.",
      warn_max_run:"The run exceeds the practical limit for this voltage when fed from one end: 5 m at 12 V and 10 m at 24 V.",
      warn_prefer_24v:"At 12 V the drop grows quickly over this length. Moving to 24 V at the same power cuts losses fourfold: the current halves and the drop is proportional to it.",
      warn_psu_small:"The specified power supply does not cover the load with reserve. Choose a higher rating.",
      warn_psu_range:"Required power exceeds the 600 W supply series. Split the load across several units.",
      warn_parallel:"Parallel wires must share the same length and section, otherwise the current will not split evenly.",
      warn_feed_points_hopeless:"Even twenty feed points are not enough: track resistance is too high for this length. Split the strip into independent runs.",
      formula:"dU_strip = r · i · L² / k,  k = 2 (one end), 8 (both ends), 8(N−1)² (N points)",
      ref:"PUE table 1.3.4 for wire ampacity; the strip drop is the integral of a distributed load",
      method_note:"The default track resistance is typical for the stated strip width. For critical installations measure it with an ohmmeter over a 1 m piece."
    },
    voltage: {current:"Current (A)",length:"Line length (m)",r_resist:"R (Ohm/km)",x_react:"X (Ohm/km)",voltage:"Voltage (V)",drop_pct:"DROP (%)",drop_v:"DROP (V)",desc:"VOLTAGE DROP",formula:"ΔU = √3·I·L·(R·cosφ + X·sinφ) / 1000",ref:"PUE cl. 1.3.10"},
    shortcircuit: {voltage:"Line voltage (V)",impedance:"Total impedance (Ohm)",ikz:"SHORT CIRCUIT CURRENT",z_val:"TOTAL IMPEDANCE",formula:"Ikz = U / (√3 × Z)",ref:"PUE cl. 1.4.1"},
    grounding: {rho:"Soil resistivity (Ohm·m)",length:"Electrode length (m)",diameter:"Electrode diameter (m)",r_required:"Required R (Ohm)",electrodes:"electrodes",desc:"NUMBER OF ELECTRODES",ref:"PUE cl. 1.7.16"},
    protection: {load_current:"Load current (A)",breaker_char:"Breaker characteristic",leak_current:"Leakage current (mA)",uzo_nominal:"RCD RATING",formula:"Ibreak ≥ Iload · k_safety",ref:"PUE cl. 1.7.79"},
    compensation: {title:"Reactive Power Compensation",active_power:"Active power (kW)",cos_before:"cos φ before",cos_after:"cos φ after",step_size:"Step size (kVAr)",compensation:"COMPENSATION",steps:"STEPS",before:"BEFORE (kVAr)",after:"AFTER (kVAr)",savings:"SAVINGS",formula:"Qc = P·(tgφ₁ − tgφ₂)",ref:"PUE cl. 1.5.15"},
    motor: {title:"Electric Motor",power:"Power (kW)",voltage:"Voltage (V)",cos_phi:"cos φ",efficiency:"Efficiency",start_mult:"Starting current multiplier",nominal_current:"Nominal current",starting_current:"STARTING CURRENT",breaker:"BREAKER",section:"SECTION",formula:"I = P / (√3 × U × cos φ × η)",ref:"PUE cl. 1.3.10"},
    transformer: {title:"Transformer",load:"Load (kW)",hv_voltage:"HV voltage (kV)",lv_voltage:"LV voltage (kV)",uk:"Uk (%)",hv_current:"HV CURRENT",lv_current:"LV CURRENT",sc_current:"SC CURRENT",loading:"LOADING",formula:"S = P / cos φ, I = S / (√3 × U)",ref:"PUE"},
    lighting: {title:"Lighting",area:"Room area (m²)",illuminance:"Required illuminance (lx)",luminous_flux:"Luminous flux (lm)",fixture_power:"Fixture power (W)",utilization:"Utilization factor",fixtures:"fixtures",power:"POWER",specific:"SPECIFIC",formula:"N = (E·S·Kz) / (Φ·η)",ref:"SP 52.13330.2016"},
    ups: {title:"UPS / Battery / Generator",load:"Load (kW)",reserve_time:"Reserve time (min)",battery_voltage:"Battery voltage (V)",ups_efficiency:"UPS efficiency",capacity:"CAPACITY",generator:"GENERATOR",formula:"Ah = (P·t) / (U·η·DoD)"},
    converter: {title:"Unit Converter",type:"Conversion type",value:"Value",result:"Result",convert:"Convert"},
    derating: {title:"Cable Derating",base_current:"Base cable current (A)",ambient_temp:"Ambient temperature (°C)",cable_count:"Number of cables in bundle",install_method:"Installation method",in_air:"In air",in_ground:"In ground",desc:"ALLOWABLE CURRENT",k_temp:"k_TEMPERATURE",k_group:"k_GROUP",total_k:"TOTAL k",reduction:"REDUCTION"},
    loadpanel: {title:"Load Panel",group:"Group",power_kW:"P (kW)",cos_phi:"cos φ",demand:"Kd",phase:"Phase",voltage:"Line voltage (V)",add_row:"+ Group",total_power:"ΣP_RATED",calc_power:"P_CALC",current_L1:"CURRENT L1",current_L2:"CURRENT L2",current_L3:"CURRENT L3",imbalance:"IMBALANCE"},
    pneumatics: {title:"Pneumatics",tab_flow:"Air Flow",tab_cylinder:"Pneumatic Cylinder",tab_compressor:"Compressor",flow_title:"Compressed Air Flow",devices_count:"Number of consumers",device_flow:"Flow per consumer (L/min)",duty_cycle:"Duty factor (0–1)",leak_factor:"Leak factor",total_flow:"TOTAL FLOW",peak_flow:"PEAK",with_leaks:"WITH LEAKS",cyl_title:"Pneumatic Cylinder",bore_diameter:"Bore diameter (mm)",rod_diameter:"Rod diameter (mm)",stroke:"Stroke (mm)",working_pressure:"Working pressure (bar)",air_flow_cyl:"Air flow (L/min)",force_forward:"FORCE (FORWARD)",force_backward:"FORCE (BACKWARD)",speed:"SPEED",time:"STROKE TIME",volume:"VOLUME",comp_title:"Compressor Selection",required_flow:"Required flow (L/min)",required_pressure:"Required pressure (bar)",reserve_factor:"Reserve factor",tank_time:"Tank fill time (s)",comp_flow:"COMPRESSOR FLOW",comp_power:"POWER",tank_volume:"TANK VOLUME"},
    hydraulics: {title:"Hydraulics",tab_cylinder:"Hydraulic Cylinder",tab_pump:"Hydraulic Pump",tab_pipe:"Pipe Pressure Drop",cyl_title:"Hydraulic Cylinder",bore:"Bore diameter (mm)",rod:"Rod diameter (mm)",stroke:"Stroke (mm)",pressure:"Working pressure (bar)",flow:"Pump flow (L/min)",efficiency:"Efficiency",force_push:"FORCE (PUSH)",force_pull:"FORCE (PULL)",speed:"SPEED",time:"STROKE TIME",power:"POWER",pump_title:"Hydraulic Pump Selection",required_flow:"Required flow (L/min)",required_pressure:"Working pressure (bar)",pump_efficiency:"Pump efficiency",motor_efficiency:"Motor efficiency",motor_power:"MOTOR POWER",pump_type:"PUMP TYPE",displacement:"DISPLACEMENT",pipe_title:"Pipe Pressure Drop",pipe_length:"Pipe length (m)",pipe_diameter:"Pipe diameter (mm)",oil_flow:"Oil flow (L/min)",oil_viscosity:"Oil viscosity (cSt)",pressure_loss:"PRESSURE LOSS",velocity:"VELOCITY",flow_type:"FLOW TYPE",lambda:"λ"},
    kipia: {title:"I&C — Calculations",tab_loop:"Current Loop",tab_scaling:"Scaling",tab_rtd:"RTD",tab_pid:"PID",tab_accuracy:"Accuracy",loop_title:"Current Loop 4–20 mA",supply_voltage:"Supply voltage (V)",min_voltage:"Min instrument voltage (V)",r_wires:"R wires (Ohm)",r_instrument:"R instrument (Ohm)",r_barrier:"R barrier (Ohm)",loop_valid:"✓ Loop valid",loop_invalid:"✗ Loop invalid",r_max:"MAX R",r_total:"R TOTAL",v_drop:"V DROP",status:"STATUS",scaling_title:"Signal Scaling",signal:"Signal (mA)",sig_min:"Min signal (mA)",sig_max:"Max signal (mA)",process_units:"process units",formula_scaling:"PV = LRV + (S−Smin)/(Smax−Smin) × (URV−LRV)",ref_scaling:"IEC 61131-3",rtd_title:"RTD Pt100 / Pt500 / Pt1000",mode:"Mode",temp_to_res:"Temperature → Resistance",res_to_temp:"Resistance → Temperature",value:"Value",sensor_type:"Sensor type",formula_rtd:"R = R₀ × (1 + A·t + B·t²)",ref_rtd:"IEC 60751",pid_title:"PID Tuning",ku:"Critical gain Ku",tu:"Critical period Tu (s)",formula_pid:"Kp=0.6·Ku, Ti=0.5·Tu, Td=0.125·Tu",ref_pid:"Ziegler-Nichols",accuracy_title:"Accuracy & Resolution",accuracy_class:"Accuracy class (%)",range:"Range",adc_bits:"ADC resolution (bits)",abs_error:"ABS. ERROR",lsb_adc:"ADC LSB"},
    wirecab: {title:"Wire & Ferrule Calculator for Electrical Cabinets",quick:"Quick (estimate)",advanced:"Advanced (by groups)",input:"Input Data",height:"Cabinet height (mm)",width:"Cabinet width (mm)",wire_count:"Number of wires",reserve:"Reserve (%)",ends:"Ferrule ends",wire_type:"Wire type",multi:"Stranded (PuGV/PV-3)",single:"Solid",avg_length:"average wire length",total_length:"TOTAL LENGTH",nshvi_single:"FERRULES SINGLE",nshvi_double:"FERRULES DOUBLE",marking:"MARKING",ref:"Estimate for cabinet wiring",download_csv:"Download CSV",group_name:"Group",count:"Count",section:"Section",length:"Length (m)",type:"Type",ends_short:"Ends",nshvi2_count:"Ferrules-2",ring_count:"Ring lugs",add_group:"+ Group",remove_group:"- Remove",summary_by_section:"Summary by sections",nshvi_size:"Ferrule size",ring:"RING LUGS"},
    developer: {title:"About",name:"Developer",reg_authority:"Registration authority",address:"Address",registration:"Registration",trade_reg:"Trade register",bank_details:"Bank details",contacts:"Contacts",license:"License: LGPL v3.0",repo:"Repository",telegram:"Telegram"},
    donate: {title:"Support the Project",desc:"If you find EngiCalc useful, consider supporting its development.",erip:"In the ERIP tree, select «E-POS — goods and services payment» and enter code:",card:"Pay by card via link:",qr:"Scan QR code with your mobile banking app"},
    editor: {
      title:"Schematic Editor",nav:"Schematic Editor",group:"EDITOR",
      components:"Components",properties:"Properties",sim_results:"Simulation results",
      load:"Load",wire:"Wire",undo:"Undo",redo:"Redo",clear:"Clear",
      run:"▶ Simulate",stop:"■ Edit",json:"JSON",import:"Import",svg:"SVG",png:"PNG",
      select_element:"Select an element on the schematic",value:"Value",state:"State",
      rotate:"Rotate 90°",delete:"Delete",
      hint:"R — rotate · Del — delete · W — wire · Ctrl+Z — undo",
      node_voltages:"Node voltages",branches:"Currents and power",warnings:"Notices",
      sw_closed:"closed",sw_open:"open",
      p_beta:"β — current gain",
      p_vbe:"Base-emitter turn-on",p_vsat:"Saturation Vce",
      reg_active:"active region",reg_sat:"saturation",reg_cutoff:"cutoff",
      base_current:"Base current",
      p_gain:"K — open-loop gain",p_vcc:"Supply +",p_vee:"Supply −",
      reg_linear:"linear region",reg_sat_hi:"clamped to + rail",reg_sat_lo:"clamped to − rail",
      diff_input:"Differential input",
      preset_opamp_inv:"Inverting amplifier",preset_opamp_ninv:"Non-inverting amplifier",
      preset_opamp_follow:"Voltage follower",preset_opamp_comp:"Comparator",
      c_optocoupler:"Optocoupler",c_scr:"Thyristor (SCR)",c_triac:"Triac",c_diac:"Diac",
      p_ctr:"CTR — current transfer ratio",p_vf_led:"LED turn-on voltage",
      led_current:"LED current",preset_opto:"Optocoupler isolation",
      transient:"Transient",transient_results:"Transient response",
      tr_time:"Time, s",tr_step:"Step, s",tr_run:"Run",
      tr_voltages:"Voltages",tr_currents:"Currents",
      tr_pick:"Select signals to plot",
      err_no_reactive:"No capacitors or inductors in the schematic — nothing to make a transient",
      c_relay:"Relay coil",c_contactor:"Contactor coil",
      c_contactNO:"Make contact (NO)",c_contactNC:"Break contact (NC)",
      p_vt:"On-state voltage drop",p_igt:"Gate trigger current",
      p_vbo:"Breakover voltage",p_forced_on:"Forced on",
      p_upick:"Pickup voltage",p_coil:"Coil",
      coil_auto:"— automatic —",yes:"yes",no:"no",
      reg_thy_on:"conducting",reg_thy_off:"blocking",
      reg_coil_on:"energised",reg_coil_off:"de-energised",
      reg_ct_closed:"closed",reg_ct_open:"open",
      gate_current:"Gate current",
      preset_relay:"Relay with self-latching",preset_scr:"Thyristor switch",
      warn_latched:"Thyristor devices do not turn off in a static solve — that needs transient analysis",
      c_resistor:"Resistor",c_capacitor:"Capacitor",c_inductor:"Inductor",
      c_vsource:"Voltage source",c_isource:"Current source",c_diode:"Diode",c_led:"LED",
      c_zener:"Zener diode",c_switch:"Switch",c_lamp:"Lamp",c_ground:"Ground",
      c_npn:"NPN transistor",c_pnp:"PNP transistor",c_opamp:"Op-amp",c_wire:"Wire",
      preset_placeholder:"— Sample circuit —",
      preset_divider:"Voltage divider",preset_led:"LED with resistor",
      preset_serpar:"Series-parallel network",preset_rc:"RC section",
      preset_bridge:"Wheatstone bridge",preset_zener:"Zener regulator",
      preset_isource:"Current source",preset_switch:"Switch and lamp",
      preset_bjtsw:"Transistor switch",preset_bjtamp:"Common-emitter stage",
      err_no_ground:"No ground: add a Ground element — it defines the zero potential",
      err_singular:"Cannot solve the circuit: check for shorts and broken connections",
      err_empty:"The schematic is empty — add some elements",
      err_internal:"Internal solver error",
      err_import:"Could not read the schematic file",
      err_png:"Could not build the PNG",
      err_no_library:"Symbol library is not loaded",
      warn_power:"{ref}: dissipating {p}",
      warn_no_convergence:"Solution did not converge — results are approximate",
      warn_unmodeled:"Some elements have no model and are excluded from the analysis",
      iss_no_ground:"The schematic has no ground",
      iss_floating_pin:"{ref}.{pin} is not connected",
      iss_shorted_source:"{ref}: source terminals are shorted together"
    }
  }
};

export function loadLang(l) {
  i18nData = I18N[l] || I18N.ru;
  lang = l;
  localStorage.setItem('lang', l);
  applyI18n();
}

export function T(key) {
  const parts = key.split('.');
  let val = i18nData;
  for (const p of parts) { val = val?.[p]; }
  return val || key;
}

export function applyI18n() {
  $$('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const text = T(key);
    if (text) el.textContent = text;
  });
  const page = $('.page.active')?.id?.replace('page-', '');
  if (page) updateBreadcrumb(page);
  const langBtn = $('.btn-lang');
  if (langBtn) langBtn.textContent = lang === 'ru' ? 'RU / EN' : 'EN / RU';
}

/* ===================== BREADCRUMB ===================== */

/**
 * К какой группе меню относится страница.
 *
 * Здесь лежит только СТРУКТУРА — сами названия берутся из словаря crumb.
 * Раньше в этих картах хранились готовые русские строки, они уходили в T()
 * как ключи, не находились и возвращались как есть: в английском режиме
 * навигация оставалась русской.
 */
const CRUMB_GROUP = {
  power:'electrical', cable:'electrical', voltage:'electrical',
  shortcircuit:'electrical', grounding:'electrical', protection:'electrical',
  groundcircuit:'electrical', kzcable:'electrical',
  motor:'equipment', motorstart:'equipment', transformer:'equipment',
  compensation:'equipment', ups:'equipment', loadpanel:'equipment',
  lighting:'lighting', emergency:'lighting', ledstrip:'lighting',
  derating:'cablenet', diam2sec:'cablenet', cableloss:'cablenet',
  busbar:'cablenet', cabletray:'cablenet', conduitfill:'cablenet', converter:'cablenet',
  wirecab:'cabinet', demandfactor:'cabinet', fuse:'cabinet', dcvdrop:'cabinet',
  threephase:'energy', energyaudit:'energy', solar:'energy',
  rccalc:'electronics', capval:'electronics', motorcap:'electronics',
  led:'electronics', zener:'electronics', rlc:'electronics', bridge:'electronics',
  ne555:'chips', opamp:'chips', '7seg':'chips',
  kipia:'kipia', pneumatics:'kipia', pneumline:'kipia', hydraulics:'kipia',
  rtdtable:'kipia', tcouple:'kipia', cablelength:'kipia',
  neutral:'safety', arcflash:'safety', thd:'safety',
  help:'system', developer:'system', donate:'system'
};

/**
 * Обновляет строку навигации над страницей.
 * @param {string} page идентификатор страницы без префикса page-
 */
export function updateBreadcrumb(page) {
  const crumb = $('#breadcrumb');
  if (!crumb) return;

  // Редактор схем держит свои подписи в собственной секции словаря.
  const groupKey = page === 'editor' ? 'editor.group' : 'crumb.group.' + CRUMB_GROUP[page];
  const pageKey = page === 'editor' ? 'editor.nav' : 'crumb.page.' + page;

  // T() возвращает сам ключ, если перевода нет, — такую подстановку не показываем.
  const resolve = key => {
    const value = T(key);
    return value === key ? '' : value;
  };

  const hasGroup = Boolean(CRUMB_GROUP[page]) || page === 'editor';
  const g = hasGroup ? resolve(groupKey) : '';
  const p = resolve(pageKey);
  crumb.textContent = g && p ? `${g} / ${p}` : p || '';
}

/* ===================== NAVIGATION ===================== */
export function showPage(name) {
  $$('.page').forEach(p => p.classList.remove('active'));
  $$('.nav-item').forEach(i => i.classList.remove('active'));
  const page = $(`#page-${name}`);
  const nav = $(`.nav-item[data-page="${name}"]`);
  if (page) page.classList.add('active');
  if (nav) nav.classList.add('active');
  updateBreadcrumb(name);
  $('.sidebar')?.classList.remove('open');
  $('.nav-overlay')?.classList.remove('show');
  history.replaceState(null, '', '#' + name);
}

export function showSubTab(name) {
  const parent = $('.page.active .sub-tabs')?.closest('.card');
  if (!parent) return;
  parent.querySelectorAll('.sub-page').forEach(p => { p.classList.remove('active'); p.style.display='none'; });
  parent.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
  const sub = parent.querySelector(`#sub-${name}`);
  if (sub) { sub.classList.add('active'); sub.style.display = 'flex'; }
  parent.querySelector(`.sub-tab[data-sub="${name}"]`)?.classList.add('active');
}

/* ===================== THEME ===================== */
export function toggleTheme() {
  const light = document.documentElement.getAttribute('data-theme') === 'light';
  document.documentElement.setAttribute('data-theme', light ? '' : 'light');
  localStorage.setItem('theme', light ? 'dark' : 'light');
}

/* ===================== PRINT ===================== */
export function printPage() {
  window.print();
}
