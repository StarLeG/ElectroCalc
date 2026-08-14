/* EngiCalc — Main application with i18n */
'use strict';

/* ===================== HELPERS ===================== */
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const num = id => parseFloat(document.getElementById(id)?.value);
const round = (v, d) => { const f = 10**d; return Math.round(v*f)/f; };

function toast(msg) {
  let t = $('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); toast(T('common.copied')); }
  catch { toast('Error'); }
}

/* ===================== I18N ===================== */
let lang = localStorage.getItem('lang') || 'ru';
let i18nData = {};

const I18N = {
  ru: {
    nav: {electrical:"ЭЛЕКТРИКА",power:"Мощность",cable:"Кабели",voltage:"Потери",shortcircuit:"КЗ",grounding:"Заземление",protection:"Защита",equipment:"ОБОРУДОВАНИЕ",compensation:"Компенсация",motor:"Двигатели",transformer:"Трансформатор",lighting:"Освещение",ups:"ИБП / АКБ",loadpanel:"Щит нагрузок",cable_networks:"КАБЕЛЬНЫЕ СЕТИ",derating:"Дерейтинг",diam2sec:"Диаметр→Сечение",converter:"Конвертер",electronics:"ЭЛЕКТРОНИКА",rccalc:"R/C соединение",capval:"Значения конд.",motorcap:"Конденсатор Дв.",led:"Светодиод",zener:"Стабилитрон",rlc:"Импеданс RLC",bridge:"Мост Уитстона",microchips:"МИКРОСХЕМЫ",ne555:"NE555",opamp:"Опер. усилитель","7seg":"7-сегмент",kipia_group:"КИПиА",kipia:"КИПиА",pneumatics:"Пневматика",hydraulics:"Гидравлика"},
    common: {input_data:"Исходные данные",result:"Результат",calculate:"Рассчитать",reset:"Сбросить",export_pdf:"Экспорт PDF",copy:"Копировать",formula_norm:"Формула и норматив",ready:"Готово",copied:"Скопировано",check_data:"Проверьте данные"},
    power: {p_power:"Мощность (кВт)",u_voltage:"Напряжение (В)",phase:"Фазность",phase1:"1 фаза",phase3:"3 фазы",cos_phi:"cos φ",efficiency:"КПД",current:"ТОК",total_power:"ПОЛНАЯ МОЩНОСТЬ",desc:"Расчётный ток нагрузки",ref:"ПУЭ п. 1.3.10"},
    cable: {current:"Расчётный ток (А)",material:"Материал",copper:"Медь (Cu)",aluminum:"Алюминий (Al)",length:"Длина линии (м)",voltage:"Напряжение (В)",section:"Рекомендуемое сечение",diameter:"ДИАМЕТР",by_heating:"ПО НАГРЕВУ",by_density:"ПО ПЛОТНОСТИ",by_losses:"ПО ПОТЕРЯМ",formula:"S = I / j_эк",ref:"ПУЭ табл. 1.3.4"},
    voltage: {current:"Ток (А)",length:"Длина линии (м)",r_resist:"R (Ом/км)",x_react:"X (Ом/км)",voltage:"U (В)",drop_pct:"ПАДЕНИЕ (%)",drop_v:"ПАДЕНИЕ (В)",desc:"ПАДЕНИЕ НАПРЯЖЕНИЯ",formula:"ΔU = √3·I·L·(R·cosφ + X·sinφ) / 1000",ref:"ПУЭ п. 1.3.10"},
    shortcircuit: {voltage:"Линейное напряжение (В)",impedance:"Полное сопротивление (Ом)",ikz:"ТОК КОРОТКОГО ЗАМЫКАНИЯ",z_val:"ПОЛНОЕ СОПРОТИВЛЕНИЕ",formula:"Iкз = U / (√3 × Z)",ref:"ПУЭ п. 1.4.1"},
    grounding: {rho:"ρ грунта (Ом·м)",length:"Длина электрода (м)",diameter:"Диаметр электрода (м)",r_required:"Требуемое R (Ом)",electrodes:"электродов",desc:"ЧИСЛО ЭЛЕКТРОДОВ",ref:"ПУЭ п. 1.7.16"},
    protection: {load_current:"Ток нагрузки (А)",breaker_char:"Характеристика автомата",leak_current:"Ток утечки (мА)",uzo_nominal:"НОМИНАЛ УЗО",formula:"Iавт ≥ Iнагр · kзап",ref:"ПУЭ п. 1.7.79"},
    compensation: {title:"Компенсация реактивной мощности",active_power:"Активная мощность (кВт)",cos_before:"cos φ до",cos_after:"cos φ после",step_size:"Размер ступени (квар)",compensation:"КОМПЕНСАЦИЯ",steps:"СТУПЕНЕЙ",before:"ДО (квар)",after:"ПОСЛЕ (квар)",savings:"ЭКОНОМИЯ",formula:"Qc = P·(tgφ₁ − tgφ₂)",ref:"ПУЭ п. 1.5.15"},
    motor: {title:"Электродвигатель",power:"Мощность (кВт)",voltage:"Напряжение (В)",cos_phi:"cos φ",efficiency:"КПД",start_mult:"Кратность пускового тока",nominal_current:"Номинальный ток",starting_current:"ПУСКОВОЙ ТОК",breaker:"АВТОМАТ",section:"СЕЧЕНИЕ",formula:"I = P / (√3 × U × cos φ × η)",ref:"ПУЭ п. 1.3.10"},
    transformer: {title:"Трансформатор",load:"Нагрузка (кВт)",hv_voltage:"Напряжение ВН (кВ)",lv_voltage:"Напряжение НН (кВ)",uk:"uк (%)",hv_current:"ТОК ВН",lv_current:"ТОК НН",sc_current:"ТОК КЗ",loading:"ЗАГРУЗКА",formula:"S = P / cos φ, I = S / (√3 × U)",ref:"ПУЭ"},
    lighting: {title:"Освещение",area:"Площадь помещения (м²)",illuminance:"Требуемая освещённость (лк)",luminous_flux:"Световой поток (лм)",utilization:"КИП (утилизация)",fixtures:"светильников",power:"МОЩНОСТЬ",specific:"УДЕЛЬНАЯ",formula:"N = (E·S·Kз) / (Φ·η)",ref:"СП 52.13330.2016"},
    ups: {title:"ИБП / АКБ / Генератор",load:"Нагрузка (кВт)",reserve_time:"Время резерва (мин)",battery_voltage:"Напряжение АКБ (В)",ups_efficiency:"КПД ИБП",capacity:"ЁМКОСТЬ",generator:"ГЕНЕРАТОР",formula:"Ah = (P·t) / (U·η·DoD)"},
    converter: {title:"Конвертер единиц",type:"Тип конвертации",value:"Значение",result:"Результат",convert:"Конвертировать"},
    derating: {title:"Кабельный дерейтинг",base_current:"Базовый ток кабеля (А)",ambient_temp:"Температура окружения (°C)",cable_count:"Число кабелей в пучке",install_method:"Способ прокладки",in_air:"На воздухе",in_ground:"В земле",desc:"ДОПУСТИМЫЙ ТОК",k_temp:"k_ТЕМПЕРАТУРА",k_group:"k_ГРУППА",total_k:"ИТОГО k",reduction:"СНИЖЕНИЕ"},
    loadpanel: {title:"Щит нагрузок",group:"Группа",power_kW:"P (кВт)",cos_phi:"cos φ",demand:"Kс",phase:"Фаза",add_row:"+ Группа",total_power:"ΣP_НОМ",calc_power:"P_РАСЧ",current_L1:"ТОК L1",current_L2:"ТОК L2",current_L3:"ТОК L3",imbalance:"ДИСБАЛАНС"},
    pneumatics: {title:"Пневматика",tab_flow:"Расход воздуха",tab_cylinder:"Пневмоцилиндр",tab_compressor:"Компрессор",flow_title:"Расход сжатого воздуха",devices_count:"Число потребителей",device_flow:"Расход 1 потребителя (л/мин)",duty_cycle:"Коэфф. использования (0–1)",leak_factor:"Коэфф. утечек",total_flow:"СУММАРНЫЙ РАСХОД",peak_flow:"ПИКОВЫЙ",with_leaks:"С УТЕЧКАМИ",cyl_title:"Пневмоцилиндр",bore_diameter:"Диаметр поршня (мм)",rod_diameter:"Диаметр штока (мм)",stroke:"Ход (мм)",working_pressure:"Рабочее давление (бар)",air_flow_cyl:"Расход воздуха (л/мин)",force_forward:"СИЛА (ВПЕРЁД)",force_backward:"СИЛА (НАЗАД)",speed:"СКОРОСТЬ",time:"ВРЕМЯ ХОДА",volume:"ОБЪЁМ",comp_title:"Подбор компрессора",required_flow:"Требуемый расход (л/мин)",required_pressure:"Требуемое давление (бар)",reserve_factor:"Коэфф. запаса",tank_time:"Время заполнения ресивера (с)",comp_flow:"РАСХОД КОМПРЕССОРА",comp_power:"МОЩНОСТЬ",tank_volume:"ОБЪЁМ РЕСИВЕРА"},
    hydraulics: {title:"Гидравлика",tab_cylinder:"Гидроцилиндр",tab_pump:"Гидронасос",tab_pipe:"Потери в трубе",cyl_title:"Гидроцилиндр",bore:"Диаметр поршня (мм)",rod:"Диаметр штока (мм)",stroke:"Ход (мм)",pressure:"Рабочее давление (бар)",flow:"Расход насоса (л/мин)",efficiency:"КПД",force_push:"СИЛА (ТОЛКАНИЕ)",force_pull:"СИЛА (ТЯГА)",speed:"СКОРОСТЬ",time:"ВРЕМЯ ХОДА",power:"МОЩНОСТЬ",pump_title:"Подбор гидронасоса",required_flow:"Требуемый расход (л/мин)",required_pressure:"Рабочее давление (бар)",pump_efficiency:"КПД насоса",motor_efficiency:"КПД двигателя",motor_power:"МОЩНОСТЬ ДВИГАТЕЛЯ",pump_type:"ТИП НАСОСА",displacement:"ОБЪЁМ НА ОБОРОТ",pipe_title:"Потери давления в трубе",pipe_length:"Длина трубы (м)",pipe_diameter:"Диаметр трубы (мм)",oil_flow:"Расход масла (л/мин)",oil_viscosity:"Вязкость масла (сСт)",pressure_loss:"ПОТЕРЯ ДАВЛЕНИЯ",velocity:"СКОРОСТЬ",flow_type:"РЕЖИМ",lambda:"λ"},
    kipia: {title:"КИПиА — Расчёты",tab_loop:"Токовая петля",tab_scaling:"Масштабирование",tab_rtd:"RTD",tab_pid:"ПИД",tab_accuracy:"Погрешности",loop_title:"Токовая петля 4–20 мА",supply_voltage:"Напряжение питания (В)",min_voltage:"Мин. напряжение прибора (В)",r_wires:"R проводов (Ом)",r_instrument:"R прибора (Ом)",r_barrier:"R барьера (Ом)",loop_valid:"✓ Петля валидна",loop_invalid:"✗ Петля невалидна",r_max:"МАКС. R",r_total:"R СУММАРНОЕ",v_drop:"ПАДЕНИЕ",status:"СТАТУС",scaling_title:"Масштабирование сигнала",signal:"Сигнал (мА)",sig_min:"Мин. сигнал (мА)",sig_max:"Макс. сигнал (мА)",process_units:"единиц процесса",formula_scaling:"PV = LRV + (S−Smin)/(Smax−Smin) × (URV−LRV)",ref_scaling:"IEC 61131-3",rtd_title:"RTD Pt100 / Pt500 / Pt1000",mode:"Режим",temp_to_res:"Температура → Сопротивление",res_to_temp:"Сопротивление → Температура",value:"Значение",sensor_type:"Тип датчика",formula_rtd:"R = R₀ × (1 + A·t + B·t²)",ref_rtd:"IEC 60751",pid_title:"Настройка ПИД",ku:"Критическое усиление Ku",tu:"Критический период Tu (с)",formula_pid:"Kp=0.6·Ku, Ti=0.5·Tu, Td=0.125·Tu",ref_pid:"Циглер-Никольс",accuracy_title:"Погрешности и разрядность",accuracy_class:"Класс точности (%)",range:"Диапазон",adc_bits:"Разрядность АЦП",abs_error:"АБС. ПОГРЕШНОСТЬ",lsb_adc:"LSB АЦП"},
    developer: {title:"О программе",name:"Разработчик",reg_authority:"Регистрирующий орган",address:"Адрес",registration:"Регистрация",trade_reg:"Торговый реестр",bank_details:"Реквизиты",contacts:"Контакты",license:"Лицензия: LGPL v3.0",repo:"Репозиторий",telegram:"Telegram"},
    donate: {title:"Поддержать проект",desc:"Если EngiCalc оказался полезен, вы можете поддержать его развитие.",erip:"В дереве ЕРИП выберите «E-POS — оплата товаров и услуг» и введите код:",card:"Оплата банковской картой по ссылке:",qr:"Считайте QR-код с помощью приложения мобильного банкинга"}
  },
  en: {
    nav: {electrical:"ELECTRICAL",power:"Power",cable:"Cables",voltage:"Voltage Drop",shortcircuit:"Short Circuit",grounding:"Grounding",protection:"Protection",equipment:"EQUIPMENT",compensation:"Compensation",motor:"Motors",transformer:"Transformer",lighting:"Lighting",ups:"UPS / Battery",loadpanel:"Load Panel",cable_networks:"CABLE NETWORKS",derating:"Derating",diam2sec:"Diameter→Section",converter:"Converter",electronics:"ELECTRONICS",rccalc:"R/C Connection",capval:"Capacitor Codes",motorcap:"Motor Capacitor",led:"LED",zener:"Zener Diode",rlc:"RLC Impedance",bridge:"Wheatstone Bridge",microchips:"IC CHIPS",ne555:"NE555",opamp:"Op-Amp","7seg":"7-Segment",kipia_group:"I&C",kipia:"I&C",pneumatics:"Pneumatics",hydraulics:"Hydraulics"},
    common: {input_data:"Input Data",result:"Result",calculate:"Calculate",reset:"Reset",export_pdf:"Export PDF",copy:"Copy",formula_norm:"Formula & Standard",ready:"Ready",copied:"Copied to clipboard",check_data:"Please check input data"},
    power: {p_power:"Power (kW)",u_voltage:"Voltage (V)",phase:"Phase",phase1:"Single phase",phase3:"Three phase",cos_phi:"cos φ",efficiency:"Efficiency",current:"CURRENT",total_power:"TOTAL POWER",desc:"Calculated load current",ref:"PUE cl. 1.3.10"},
    cable: {current:"Calculated current (A)",material:"Material",copper:"Copper (Cu)",aluminum:"Aluminum (Al)",length:"Line length (m)",voltage:"Voltage (V)",section:"Recommended section",diameter:"DIAMETER",by_heating:"BY HEATING",by_density:"BY DENSITY",by_losses:"BY LOSSES",formula:"S = I / j_ec",ref:"PUE table 1.3.4"},
    voltage: {current:"Current (A)",length:"Line length (m)",r_resist:"R (Ohm/km)",x_react:"X (Ohm/km)",voltage:"Voltage (V)",drop_pct:"DROP (%)",drop_v:"DROP (V)",desc:"VOLTAGE DROP",formula:"ΔU = √3·I·L·(R·cosφ + X·sinφ) / 1000",ref:"PUE cl. 1.3.10"},
    shortcircuit: {voltage:"Line voltage (V)",impedance:"Total impedance (Ohm)",ikz:"SHORT CIRCUIT CURRENT",z_val:"TOTAL IMPEDANCE",formula:"Ikz = U / (√3 × Z)",ref:"PUE cl. 1.4.1"},
    grounding: {rho:"Soil resistivity (Ohm·m)",length:"Electrode length (m)",diameter:"Electrode diameter (m)",r_required:"Required R (Ohm)",electrodes:"electrodes",desc:"NUMBER OF ELECTRODES",ref:"PUE cl. 1.7.16"},
    protection: {load_current:"Load current (A)",breaker_char:"Breaker characteristic",leak_current:"Leakage current (mA)",uzo_nominal:"RCD RATING",formula:"Ibreak ≥ Iload · k_safety",ref:"PUE cl. 1.7.79"},
    compensation: {title:"Reactive Power Compensation",active_power:"Active power (kW)",cos_before:"cos φ before",cos_after:"cos φ after",step_size:"Step size (kVAr)",compensation:"COMPENSATION",steps:"STEPS",before:"BEFORE (kVAr)",after:"AFTER (kVAr)",savings:"SAVINGS",formula:"Qc = P·(tgφ₁ − tgφ₂)",ref:"PUE cl. 1.5.15"},
    motor: {title:"Electric Motor",power:"Power (kW)",voltage:"Voltage (V)",cos_phi:"cos φ",efficiency:"Efficiency",start_mult:"Starting current multiplier",nominal_current:"Nominal current",starting_current:"STARTING CURRENT",breaker:"BREAKER",section:"SECTION",formula:"I = P / (√3 × U × cos φ × η)",ref:"PUE cl. 1.3.10"},
    transformer: {title:"Transformer",load:"Load (kW)",hv_voltage:"HV voltage (kV)",lv_voltage:"LV voltage (kV)",uk:"Uk (%)",hv_current:"HV CURRENT",lv_current:"LV CURRENT",sc_current:"SC CURRENT",loading:"LOADING",formula:"S = P / cos φ, I = S / (√3 × U)",ref:"PUE"},
    lighting: {title:"Lighting",area:"Room area (m²)",illuminance:"Required illuminance (lx)",luminous_flux:"Luminous flux (lm)",utilization:"Utilization factor",fixtures:"fixtures",power:"POWER",specific:"SPECIFIC",formula:"N = (E·S·Kz) / (Φ·η)",ref:"SP 52.13330.2016"},
    ups: {title:"UPS / Battery / Generator",load:"Load (kW)",reserve_time:"Reserve time (min)",battery_voltage:"Battery voltage (V)",ups_efficiency:"UPS efficiency",capacity:"CAPACITY",generator:"GENERATOR",formula:"Ah = (P·t) / (U·η·DoD)"},
    converter: {title:"Unit Converter",type:"Conversion type",value:"Value",result:"Result",convert:"Convert"},
    derating: {title:"Cable Derating",base_current:"Base cable current (A)",ambient_temp:"Ambient temperature (°C)",cable_count:"Number of cables in bundle",install_method:"Installation method",in_air:"In air",in_ground:"In ground",desc:"ALLOWABLE CURRENT",k_temp:"k_TEMPERATURE",k_group:"k_GROUP",total_k:"TOTAL k",reduction:"REDUCTION"},
    loadpanel: {title:"Load Panel",group:"Group",power_kW:"P (kW)",cos_phi:"cos φ",demand:"Kd",phase:"Phase",add_row:"+ Group",total_power:"ΣP_RATED",calc_power:"P_CALC",current_L1:"CURRENT L1",current_L2:"CURRENT L2",current_L3:"CURRENT L3",imbalance:"IMBALANCE"},
    pneumatics: {title:"Pneumatics",tab_flow:"Air Flow",tab_cylinder:"Pneumatic Cylinder",tab_compressor:"Compressor",flow_title:"Compressed Air Flow",devices_count:"Number of consumers",device_flow:"Flow per consumer (L/min)",duty_cycle:"Duty factor (0–1)",leak_factor:"Leak factor",total_flow:"TOTAL FLOW",peak_flow:"PEAK",with_leaks:"WITH LEAKS",cyl_title:"Pneumatic Cylinder",bore_diameter:"Bore diameter (mm)",rod_diameter:"Rod diameter (mm)",stroke:"Stroke (mm)",working_pressure:"Working pressure (bar)",air_flow_cyl:"Air flow (L/min)",force_forward:"FORCE (FORWARD)",force_backward:"FORCE (BACKWARD)",speed:"SPEED",time:"STROKE TIME",volume:"VOLUME",comp_title:"Compressor Selection",required_flow:"Required flow (L/min)",required_pressure:"Required pressure (bar)",reserve_factor:"Reserve factor",tank_time:"Tank fill time (s)",comp_flow:"COMPRESSOR FLOW",comp_power:"POWER",tank_volume:"TANK VOLUME"},
    hydraulics: {title:"Hydraulics",tab_cylinder:"Hydraulic Cylinder",tab_pump:"Hydraulic Pump",tab_pipe:"Pipe Pressure Drop",cyl_title:"Hydraulic Cylinder",bore:"Bore diameter (mm)",rod:"Rod diameter (mm)",stroke:"Stroke (mm)",pressure:"Working pressure (bar)",flow:"Pump flow (L/min)",efficiency:"Efficiency",force_push:"FORCE (PUSH)",force_pull:"FORCE (PULL)",speed:"SPEED",time:"STROKE TIME",power:"POWER",pump_title:"Hydraulic Pump Selection",required_flow:"Required flow (L/min)",required_pressure:"Working pressure (bar)",pump_efficiency:"Pump efficiency",motor_efficiency:"Motor efficiency",motor_power:"MOTOR POWER",pump_type:"PUMP TYPE",displacement:"DISPLACEMENT",pipe_title:"Pipe Pressure Drop",pipe_length:"Pipe length (m)",pipe_diameter:"Pipe diameter (mm)",oil_flow:"Oil flow (L/min)",oil_viscosity:"Oil viscosity (cSt)",pressure_loss:"PRESSURE LOSS",velocity:"VELOCITY",flow_type:"FLOW TYPE",lambda:"λ"},
    kipia: {title:"I&C — Calculations",tab_loop:"Current Loop",tab_scaling:"Scaling",tab_rtd:"RTD",tab_pid:"PID",tab_accuracy:"Accuracy",loop_title:"Current Loop 4–20 mA",supply_voltage:"Supply voltage (V)",min_voltage:"Min instrument voltage (V)",r_wires:"R wires (Ohm)",r_instrument:"R instrument (Ohm)",r_barrier:"R barrier (Ohm)",loop_valid:"✓ Loop valid",loop_invalid:"✗ Loop invalid",r_max:"MAX R",r_total:"R TOTAL",v_drop:"V DROP",status:"STATUS",scaling_title:"Signal Scaling",signal:"Signal (mA)",sig_min:"Min signal (mA)",sig_max:"Max signal (mA)",process_units:"process units",formula_scaling:"PV = LRV + (S−Smin)/(Smax−Smin) × (URV−LRV)",ref_scaling:"IEC 61131-3",rtd_title:"RTD Pt100 / Pt500 / Pt1000",mode:"Mode",temp_to_res:"Temperature → Resistance",res_to_temp:"Resistance → Temperature",value:"Value",sensor_type:"Sensor type",formula_rtd:"R = R₀ × (1 + A·t + B·t²)",ref_rtd:"IEC 60751",pid_title:"PID Tuning",ku:"Critical gain Ku",tu:"Critical period Tu (s)",formula_pid:"Kp=0.6·Ku, Ti=0.5·Tu, Td=0.125·Tu",ref_pid:"Ziegler-Nichols",accuracy_title:"Accuracy & Resolution",accuracy_class:"Accuracy class (%)",range:"Range",adc_bits:"ADC resolution (bits)",abs_error:"ABS. ERROR",lsb_adc:"ADC LSB"},
    developer: {title:"About",name:"Developer",reg_authority:"Registration authority",address:"Address",registration:"Registration",trade_reg:"Trade register",bank_details:"Bank details",contacts:"Contacts",license:"License: LGPL v3.0",repo:"Repository",telegram:"Telegram"},
    donate: {title:"Support the Project",desc:"If you find EngiCalc useful, consider supporting its development.",erip:"In the ERIP tree, select «E-POS — goods and services payment» and enter code:",card:"Pay by card via link:",qr:"Scan QR code with your mobile banking app"}
  }
};

/* ===================== HELP CONTENT ===================== */
const HELP_CONTENT = {
  power: {
    title: 'Мощность и ток нагрузки',
    body: `<p>Любое электрическое оборудование потребляет ток. Чем мощнее прибор — тем больше тока он берёт из сети. Значение тока важно знать, чтобы правильно выбрать провод и автомат-выключатель.</p>
<p><strong>Что нужно ввести:</strong></p>
<ul>
<li><strong>Мощность (кВт)</strong> — написана на шильдике прибора или в паспорте. Например, у обогревателя 2 кВт, у двигателя 7.5 кВт.</li>
<li><strong>Напряжение (В)</strong> — в обычной розетке 220 В, в трёхфазной сети 380 В.</li>
<li><strong>cos φ</strong> — коэффициент мощности. Для ламп накаливания равен 1, для двигателей обычно 0.7–0.9. Если не знаете — поставьте 0.85.</li>
<li><strong>КПД</strong> — эффективность прибора. Для двигателя 0.75–0.95, для нагревателя 1.0.</li>
</ul>
<p><strong>Что показывает результат:</strong> ток в амперах — именно по нему выбирают сечение провода и номинал автомата.</p>
<p><strong>Формула:</strong> для трёхфазной сети I = P / (√3 × U × cos φ × η), для однофазной I = P / (U × cos φ × η).</p>
<p><strong>Норматив:</strong> ПУЭ п. 1.3.10.</p>`
  },
  cable: {
    title: 'Кабели и провода (подбор сечения)',
    body: `<p>Электрический провод имеет определённую толщину — сечение. Чем больше ток нужно пропустить — тем толще должен быть провод. Тонкий провод при большой нагрузке будет греться и может стать причиной пожара.</p>
<p><strong>Что нужно ввести:</strong></p>
<ul>
<li><strong>Расчётный ток (А)</strong> — его можно узнать из калькулятора «Мощность».</li>
<li><strong>Материал:</strong> медь (Cu) или алюминий (Al). Медь лучше проводит ток, поэтому медный провод тоньше при том же токе.</li>
</ul>
<p><strong>Как это работает:</strong> существует понятие «допустимая плотность тока» — сколько ампер можно пропустить через 1 мм² провода. Для меди это примерно 10 А/мм², для алюминия — 6 А/мм².</p>
<p><strong>Формула:</strong> S = I / j, где S — сечение в мм², I — ток в амперах, j — плотность тока.</p>
<p><strong>Норматив:</strong> ПУЭ таблица 1.3.4.</p>`
  },
  voltage: {
    title: 'Потери напряжения в линии',
    body: `<p>Когда ток течёт по проводу, часть напряжения «теряется» из-за сопротивления провода. Чем длиннее линия и чем тоньше провод — тем больше потери. Если потери превышают 5%, оборудование может работать неправильно: лампы тускнеют, двигатели не запускаются.</p>
<p><strong>Что нужно ввести:</strong></p>
<ul>
<li><strong>Ток (А)</strong> — потребление нагрузки.</li>
<li><strong>Длина линии (м)</strong> — расстояние от щита до прибора (туда и обратно, если однофазная сеть).</li>
<li><strong>R (Ом/км)</strong> — активное сопротивление провода. Зависит от сечения и материала. Для медного провода 2.5 мм² — около 7.24 Ом/км.</li>
<li><strong>X (Ом/км)</strong> — индуктивное сопротивление. Для кабелей до 10 мм² обычно 0.06–0.1 Ом/км. Если не знаете — поставьте 0.08.</li>
</ul>
<p><strong>Формула:</strong> ΔU = √3 × I × L × (R × cos φ + X × sin φ) / 1000.</p>
<p><strong>Норматив:</strong> ПУЭ п. 1.3.10 — допустимые потери не более 5%.</p>`
  },
  shortcircuit: {
    title: 'Ток короткого замыкания (КЗ)',
    body: `<p>Короткое замыкание — это когда фаза напрямую соединяется с нулём или другой фазой. При КЗ ток возрастает в сотни раз за доли секунды. Автомат должен отключить цепь до того, как проводка расплавится.</p>
<p><strong>Зачем это считать:</strong> чтобы правильно выбрать автоматы и предохранители. У каждого аппарата защиты есть «отключающая способность» — максимальный ток КЗ, который он может разорвать.</p>
<p><strong>Что нужно ввести:</strong></p>
<ul>
<li><strong>Линейное напряжение (В)</strong> — обычно 380 В для трёхфазной сети.</li>
<li><strong>Полное сопротивление (Ом)</strong> — сопротивление участка цепи от трансформатора до точки КЗ. Если не знаете — для типовой квартирной линии можно взять 0.1 Ом.</li>
</ul>
<p><strong>Формула:</strong> Iкз = U / (√3 × Z).</p>
<p><strong>Норматив:</strong> ПУЭ п. 1.4.1.</p>`
  },
  grounding: {
    title: 'Заземление',
    body: `<p>Заземление защищает человека от поражения током. Если корпус прибора окажется под напряжением (например, пробила изоляция), ток уйдёт в землю по заземляющему проводу, а не через тело человека.</p>
<p><strong>Что нужно ввести:</strong></p>
<ul>
<li><strong>ρ грунта (Ом·м)</strong> — удельное сопротивление почвы. Глина — 20–60, суглинок — 40–100, песок — 100–400, каменистая почва — 500–1000. Чем выше ρ — тем больше штырей нужно.</li>
<li><strong>Длина электрода (м)</strong> — обычно 2.5–3 м.</li>
<li><strong>Диаметр электрода (м)</strong> — стандартный штырь 16–20 мм.</li>
<li><strong>Требуемое R (Ом)</strong> — для частного дома обычно 4 Ом, для квартиры в многоэтажке — до 30 Ом.</li>
</ul>
<p><strong>Как это работает:</strong> один штырь в земле имеет определённое сопротивление. Если его недостаточно — забивают несколько штырей и соединяют их вместе. У группы штырей есть коэффициент использования (около 0.65) — из-за взаимного влияния они работают хуже, чем по отдельности.</p>
<p><strong>Формула:</strong> R = ρ/(2πL) × ln(4L/d).</p>
<p><strong>Норматив:</strong> ПУЭ п. 1.7.16.</p>`
  },
  protection: {
    title: 'Автоматы и УЗО',
    body: `<p><strong>Автоматический выключатель (автомат)</strong> — устройство, которое отключает электричество при перегрузке или коротком замыкании. Если ток превысит номинал автомата — он отключится и защитит проводку.</p>
<p><strong>УЗО (устройство защитного отключения)</strong> — отключает цепь при утечке тока на землю. Если человек случайно коснётся оголённого провода, УЗО сработает за доли секунды и спасёт жизнь.</p>
<p><strong>Что нужно ввести:</strong></p>
<ul>
<li><strong>Ток нагрузки (А)</strong> — потребление оборудования.</li>
<li><strong>Характеристика автомата:</strong> B (для розеток), C (для смешанных нагрузок), D (для двигателей с большим пусковым током).</li>
<li><strong>Ток утечки (мА)</strong> — для ванной 10 мА, для розеточных групп 30 мА, для ввода в дом 100–300 мА.</li>
</ul>
<p><strong>Норматив:</strong> ПУЭ п. 1.7.79.</p>`
  },
  compensation: {
    title: 'Компенсация реактивной мощности',
    body: `<p>Мощность бывает активная (полезная работа) и реактивная (тратится на создание магнитных полей в двигателях и трансформаторах). Чем ниже cos φ — тем больше реактивная составляющая и тем больше потери.</p>
<p><strong>Зачем компенсировать:</strong> энергоснабжающие организации штрафуют за низкий cos φ (ниже 0.9). Установка конденсаторных батарей повышает cos φ и снижает счета за электричество.</p>
<p><strong>Что нужно ввести:</strong></p>
<ul>
<li><strong>Активная мощность (кВт)</strong> — полезная нагрузка.</li>
<li><strong>cos φ до компенсации</strong> — текущее значение (обычно 0.6–0.8 для двигателей).</li>
<li><strong>cos φ после компенсации</strong> — целевое значение (обычно 0.95).</li>
<li><strong>Размер ступени (квар)</strong> — минимальный блок конденсаторов.</li>
</ul>
<p><strong>Формула:</strong> Qc = P × (tg φ₁ − tg φ₂).</p>
<p><strong>Норматив:</strong> ПУЭ п. 1.5.15.</p>`
  },
  motor: {
    title: 'Электродвигатели',
    body: `<p>Электродвигатель — основной потребитель электроэнергии на производстве. При выборе двигателя важно правильно рассчитать ток, подобрать автомат и сечение кабеля.</p>
<p><strong>Особенности двигателей:</strong></p>
<ul>
<li><strong>Пусковой ток</strong> в 5–7 раз больше номинального. Двигатель мощностью 7.5 кВт при запуске потребляет 100–150 А в течение нескольких секунд.</li>
<li>Для двигателей используют автоматы с характеристикой D — они выдерживают кратковременные перегрузки.</li>
<li>Кабель для двигателя берут с запасом по сечению.</li>
</ul>
<p><strong>Формула:</strong> I = P / (√3 × U × cos φ × η).</p>
<p><strong>Норматив:</strong> ПУЭ п. 1.3.10.</p>`
  },
  transformer: {
    title: 'Трансформатор',
    body: `<p>Трансформатор понижает высокое напряжение (6–10 кВ) до низкого (380/220 В). Его мощность ограничена — если нагрузить слишком сильно, он перегреется.</p>
<p><strong>Что нужно ввести:</strong></p>
<ul>
<li><strong>Нагрузка (кВт)</strong> — суммарная мощность всех потребителей.</li>
<li><strong>cos φ</strong> — общий коэффициент мощности нагрузки.</li>
<li><strong>uк (%)</strong> — напряжение короткого замыкания трансформатора (обычно 4–6%, указано на шильдике).</li>
</ul>
<p><strong>Что показывает результат:</strong></p>
<ul>
<li><strong>Полная мощность (кВА)</strong> — должна быть больше или равна паспортной мощности трансформатора.</li>
<li><strong>Токи ВН/НН</strong> — токи на стороне высокого и низкого напряжения.</li>
<li><strong>Ток КЗ</strong> — максимальный ток при коротком замыкании на стороне НН.</li>
</ul>
<p><strong>Норматив:</strong> ПУЭ — расчёт трансформаторов.</p>`
  },
  lighting: {
    title: 'Освещение',
    body: `<p>Количество светильников зависит от площади помещения, требуемой освещённости и эффективности lamps. Нормы освещённости прописаны в строительных правилах.</p>
<p><strong>Что нужно ввести:</strong></p>
<ul>
<li><strong>Площадь (м²)</strong> — длина × ширина помещения.</li>
<li><strong>Освещённость (лк)</strong> — по нормам: рабочий стол 300–500 лк, коридор 50–100 лк, склад 100–200 лк.</li>
<li><strong>Световой поток (лм)</strong> — указан на упаковке лампы. LED-лампа 10 Вт даёт примерно 900–1000 лм.</li>
<li><strong>КИП</strong> — коэффициент использования (0.5–0.7 для помещений со светлыми стенами).</li>
</ul>
<p><strong>Формула:</strong> N = (E × S) / (Φ × η).</p>
<p><strong>Норматив:</strong> СП 52.13330.2016.</p>`
  },
  ups: {
    title: 'ИБП, аккумуляторы и генераторы',
    body: `<p><strong>ИБП (источник бесперебойного питания)</strong> — устройство, которое обеспечивает электричеством при отключении сети. Аккумуляторы внутри ИБП хранят энергию.</p>
<p><strong>Что нужно ввести:</strong></p>
<ul>
<li><strong>Нагрузка (кВт)</strong> — мощность оборудования, которое нужно запитать.</li>
<li><strong>Время резерва (мин)</strong> — сколько минут должен работать ИБП без сети.</li>
<li><strong>Напряжение АКБ (В)</strong> — обычно 12, 24 или 48 В.</li>
<li><strong>КПД ИБП</strong> — обычно 0.85–0.95.</li>
</ul>
<p><strong>Что считает:</strong> ёмкость аккумуляторов в ампер-часах и мощность генератора в кВА.</p>
<p><strong>Формула:</strong> Ah = (P × t) / (U × η × DoD), где DoD — допустимая глубина разряда (0.8 для свинцовых, 0.9 для Li-ion).</p>`
  },
  derating: {
    title: 'Дерейтинг кабелей',
    body: `<p>Допустимый ток кабеля зависит от условий прокладки. При температуре выше 30°C или при прокладке нескольких кабелей рядом — ток нужно снижать.</p>
<p><strong>Что нужно ввести:</strong></p>
<ul>
<li><strong>Базовый ток (А)</strong> — допустимый ток по таблице ПУЭ (при температуре 30°C, один кабель).</li>
<li><strong>Температура (°C)</strong> — температура окружающей среды.</li>
<li><strong>Число кабелей</strong> — сколько кабелей проложено рядом.</li>
</ul>
<p><strong>Как это работает:</strong> для каждого условия вводится коэффициент (меньше 1.0). Итоговый допустимый ток = базовый ток × коэффициенты.</p>
<p><strong>Норматив:</strong> ПУЭ таблицы 1.3.23–1.3.26.</p>`
  },
  loadpanel: {
    title: 'Щит нагрузок',
    body: `<p>Щит нагрузок — это таблица всех электрических потребителей объекта. Помогает понять общую нагрузку, выбрать вводной автомат и сечение вводного кабеля.</p>
<p><strong>Как пользоваться:</strong></p>
<ul>
<li>Добавляйте группы потребителей (розетки, освещение, кондиционеры и т.д.).</li>
<li>Указывайте мощность каждой группы, cos φ и коэффициент спроса (Kс).</li>
<li>Коэффициент спроса учитывает, что не все приборы работают одновременно. Для розеток 0.6–0.8, для освещения 0.8–0.9.</li>
<li>Распределите нагрузку по фазам (L1, L2, L3).</li>
</ul>
<p><strong>Что показывает результат:</strong> суммарную мощность, токи по каждой фазе и дисбаланс (перекос). Дисбаланс не должен превышать 15–20%.</p>`
  },
  converter: {
    title: 'Конвертер единиц',
    body: `<p>Быстрый перевод между единицами измерения, которые часто встречаются в электротехнике и электронике.</p>
<p><strong>Доступные конвертации:</strong></p>
<ul>
<li><strong>мм² ↔ AWG</strong> — американский калибр проводов. Чем больше номер AWG — тем тоньше провод. AWG 14 ≈ 2.08 мм², AWG 22 ≈ 0.33 мм².</li>
<li><strong>°C ↔ °F</strong> — градусы Цельсия и Фаренгейта.</li>
<li><strong>кВт ↔ л.с.</strong> — киловатты и лошадиные силы (1 л.с. = 0.746 кВт).</li>
<li><strong>кВА ↔ кВт ↔ квар</strong> — полная, активная и реактивная мощность.</li>
<li><strong>Вт ↔ дБм</strong> — мощность в ваттах и децибелах (используется в радиотехнике).</li>
</ul>`
  },
  rccalc: {
    title: 'Последовательное и параллельное соединение',
    body: `<p><strong>Резисторы (сопротивления):</strong></p>
<ul>
<li><strong>Последовательно:</strong> R = R₁ + R₂ + R₃. Сопротивления складываются. Ток через все резисторы одинаковый.</li>
<li><strong>Параллельно:</strong> 1/R = 1/R₁ + 1/R₂ + 1/R₃. Общее сопротивление всегда меньше самого маленького. Напряжение на всех одинаковое.</li>
</ul>
<p><strong>Конденсаторы (ёмкости):</strong> — наоборот!</p>
<ul>
<li><strong>Последовательно:</strong> 1/C = 1/C₁ + 1/C₂ + 1/C₃. Общая ёмкость меньше самого маленького.</li>
<li><strong>Параллельно:</strong> C = C₁ + C₂ + C₃. Ёмкости складываются.</li>
</ul>
<p><strong>Зачем это нужно:</strong> если нет резистора нужного номинала — можно соединить несколько последовательно или параллельно, чтобы получить нужное значение.</p>`
  },
  motorcap: {
    title: 'Конденсатор для двигателя',
    body: `<p>Однофазные двигатели и трёхфазные, включённые в сеть 220 В, нуждаются в конденсаторе. Конденсатор создаёт сдвиг фазы, необходимый для вращения ротора.</p>
<p><strong>Два типа конденсаторов:</strong></p>
<ul>
<li><strong>Рабочий</strong> — работает всё время, пока двигатель включён. Ёмкость рассчитывается по формуле.</li>
<li><strong>Пусковой</strong> — подключается только при запуске (в 2–3 раза больше рабочего). Нужен для двигателей с высокой нагрузкой при пуске.</li>
</ul>
<p><strong>Что нужно ввести:</strong> мощность двигателя, напряжение, частоту сети (50 Гц), cos φ и КПД (указаны на шильдике).</p>
<p><strong>Важно:</strong> конденсатор должен быть на напряжение не ниже 400 В (для сети 220 В). Используйте специальные моторные конденсаторы (CBB60, CBB65).</p>`
  },
  capval: {
    title: 'Значения конденсаторов',
    body: `<p>На корпусах маленьких конденсаторов указан не полный номинал, а код из трёх цифр. Это удобно для маркировки, но требует расшифровки.</p>
<p><strong>Как читать код:</strong></p>
<ul>
<li>Первые две цифры — значащее число.</li>
<li>Третья цифра — количество нулей (множитель 10ⁿ).</li>
<li>Результат — в пикофарадах (пФ).</li>
</ul>
<p><strong>Примеры:</strong></p>
<ul>
<li><strong>104</strong> = 10 × 10⁴ = 100000 пФ = 100 нФ = 0.1 мкФ</li>
<li><strong>222</strong> = 22 × 10² = 2200 пФ = 2.2 нФ</li>
<li><strong>470</strong> = 47 × 10⁰ = 47 пФ</li>
</ul>
<p><strong>Буквенные обозначения:</strong> p = пикофарады, n = нанофарады, u (или µ) = микрофарады. Пример: 4u7 = 4.7 мкФ, 10n = 10 нФ.</p>`
  },
  led: {
    title: 'Светодиод (расчёт резистора)',
    body: `<p>Светодиод нельзя подключать напрямую к источнику питания — он сгорит. Нужен токоограничительный резистор, который «съедает» лишнее напряжение.</p>
<p><strong>Что нужно ввести:</strong></p>
<ul>
<li><strong>Напряжение питания (В)</strong> — обычно 5, 12 или 24 В.</li>
<li><strong>Прямое напряжение светодиода (В)</strong> — падение напряжения на светодиоде. Красный 1.8–2.2 В, зелёный 2.8–3.5 В, белый 3.0–3.5 В.</li>
<li><strong>Ток (мА)</strong> — рабочий ток светодиода. Обычно 20 мА для стандартных, 10 мА для ярких.</li>
</ul>
<p><strong>Формула:</strong> R = (Vпит − Vсд) / I.</p>
<p><strong>Последовательное соединение:</strong> можно включить несколько светодиодов последовательно, если напряжения хватает. R = (Vпит − N × Vсд) / I.</p>
<p><strong>Параллельное соединение:</strong> каждый светодиод должен иметь свой резистор.</p>`
  },
  zener: {
    title: 'Стабилитрон',
    body: `<p>Стабилитрон —特殊ный диод, который стабилизирует напряжение. Если на него подать напряжение выше определённого значения (напряжение стабилизации), он «отдаст» лишний ток, и на выходе будет постоянное напряжение.</p>
<p><strong>Как это работает:</strong></p>
<ul>
<li>Входное напряжение (Vin) должно быть выше напряжения стабилизации (Vz).</li>
<li>Резистор ограничивает ток через стабилитрон.</li>
<li>Нагрузка подключается параллельно стабилитрону.</li>
</ul>
<p><strong>Что нужно ввести:</strong> входное напряжение, напряжение стабилизации, ток нагрузки и допустимую мощность стабилитрона.</p>
<p><strong>Проверка:</strong> фактическая мощность стабилитрона не должна превышать допустимую, иначе он перегреется.</p>
<p><strong>Формула:</strong> R = (Vin − Vz) / (Iz + Iн).</p>`
  },
  rlc: {
    title: 'Импеданс цепи RLC',
    body: `<p>Полное сопротивление (импеданс) цепи с резистором, катушкой индуктивности и конденсатором. В цепи переменного тока каждый компонент ведёт себя по-разному.</p>
<p><strong>Компоненты:</strong></p>
<ul>
<li><strong>Резистор (R)</strong> — сопротивление постоянное, не зависит от частоты.</li>
<li><strong>Катушка (L)</strong> — индуктивное сопротивление XL = 2πfL. Растёт с частотой.</li>
<li><strong>Конденсатор (C)</strong> — ёмкостное сопротивление XC = 1/(2πfC). Уменьшается с частотой.</li>
</ul>
<p><strong>Резонанс:</strong> на определённой частоте XL = XC, и цепь ведёт себя как чистый резистор. Эта частота называется резонансной: f = 1/(2π√(LC)).</p>
<p><strong>Добротность (Q)</strong> — показывает, насколько остро настроен резонанс. Чем выше Q — тем уже полоса пропускания.</p>
<p><strong>Формула:</strong> Z = √(R² + (XL − XC)²).</p>`
  },
  ne555: {
    title: 'Микросхема NE555 (таймер)',
    body: `<p>NE555 — одна из самых популярных микросхем в электронике. Используется для генерации импульсов, создания задержек, управления светодиодами и многого другого.</p>
<p><strong>Два основных режима:</strong></p>
<ul>
<li><strong>Астабильный (генератор)</strong> — выход постоянно переключается между 0 и 1. Используется для мигалок, зуммеров, генераторов тактовой частоты.</li>
<li><strong>Моностабильный (одновибратор)</strong> — при подаче триггерного импульса выход устанавливается в 1 на заданное время, затем возвращается в 0. Используется для задержек, дребезгоподавления.</li>
</ul>
<p><strong>Для астабильного режима:</strong> частота задаётся резисторами R1, R2 и конденсатором C. Скважность зависит от соотношения R1 и R2.</p>
<p><strong>Для моностабильного:</strong> время импульса t = 1.1 × R × C.</p>
<p><strong>Ограничение:</strong> R1 не менее 1 кОм (иначе ток разряда конденсатора будет слишком большим).</p>`
  },
  opamp: {
    title: 'Операционные усилители (ОУ)',
    body: `<p>Операционный усилитель — универсальный элемент аналоговой электроники. Усиливает разность напряжений между двумя входами.</p>
<p><strong>Основные схемы:</strong></p>
<ul>
<li><strong>Инвертирующий:</strong> вход на «минус» вход ОУ. Коэффициент усиления K = −Rf/R1. Выходное напряжение сдвинуто на 180° (инвертировано).</li>
<li><strong>Неинвертирующий:</strong> вход на «плюс» вход ОУ. K = 1 + Rf/R1. Без сдвига фазы.</li>
<li><strong>Сумматор:</strong> складывает несколько входных напряжений с весовыми коэффициентами.</li>
<li><strong>Дифференциальный:</strong> усиливает разность двух напряжений. Используется в измерительных схемах.</li>
</ul>
<p><strong>Свойства идеального ОУ:</strong> бесконечное усиление, бесконечное входное сопротивление, нулевое выходное сопротивление. Реальные ОУ приближаются к этому.</p>`
  },
  '7seg': {
    title: '7-сегментный индикатор',
    body: `<p>7-сегментный индикатор — это семь светодиодов (сегментов), расположенных в форме цифры 8. Включая определённые сегменты, можно отобразить цифры 0–9 и некоторые буквы.</p>
<p><strong>Сегменты:</strong> a (верхний), b (правый верхний), c (правый нижний), d (нижний), e (левый нижний), f (левый верхний), g (средний).</p>
<p><strong>Два типа:</strong></p>
<ul>
<li><strong>Общий анод (CA):</strong> общий провод подключается к +Vcc. Чтобы зажечь сегмент — подайте 0 (LOW) на его вывод.</li>
<li><strong>Общий катод (CC):</strong> общий провод подключается к GND. Чтобы зажечь сегмент — подайте 1 (HIGH).</li>
</ul>
<p><strong>Резистор:</strong> каждый сегмент нуждается в токоограничительном резисторе. Без него светодиоды сгорят.</p>
<p><strong>Декодер:</strong> микросхемы 7447 (для CA) и 7448 (для CC) автоматически преобразуют двоичный код (BCD) в сигналы для сегментов.</p>`
  },
  diam2sec: {
    title: 'Диаметр провода → Сечение',
    body: `<p>Площадь сечения провода — это площадь круга в разрезе. Зная диаметр, можно вычислить сечение по формуле S = π × d² / 4.</p>
<p><strong>Зачем это нужно:</strong></p>
<ul>
<li>На проводе может быть указана только толщина (диаметр), а в таблицах сечения указаны в мм².</li>
<li>При покупке кабеля важно не ошибиться с сечением — взять тоньше, чем нужно, опасно.</li>
</ul>
<p><strong>Стандартные сечения:</strong> 0.5, 0.75, 1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120 мм².</p>
<p><strong>Для многожильного провода:</strong> если провод состоит из N тонких жил, общее сечение = сечение одной жилы × N.</p>`
  },
  bridge: {
    title: 'Мост Уитстона',
    body: `<p>Мост Уитстона — измерительная схема для точного определения сопротивлений. Состоит из четырёх резисторов и источника питания.</p>
<p><strong>Как работает:</strong></p>
<ul>
<li>Если R1 × R4 = R2 × R3 — мост сбалансирован, напряжение на диагонали равно нулю.</li>
<li>Если соотношение нарушено — на диагонали появляется напряжение, пропорциональное отклонению.</li>
</ul>
<p><strong>Где применяется:</strong></p>
<ul>
<li><strong>Тензодатчики:</strong> измерение деформации конструкций (мост из четырёх тензорезисторов).</li>
<li><strong>Датчики температуры:</strong> Pt100 подключается в одно плечо моста.</li>
<li><strong>Весы:</strong> точное измерение массы через деформацию.</li>
</ul>
<p><strong>Формула:</strong> Vвых = V × (R3/(R3+R4) − R2/(R1+R2)).</p>`
  },
  kipia: {
    title: 'КИПиА (контроль, измерения, управление)',
    body: `<p>КИПиА — это область инженерии, связанная с измерением и управлением технологическими процессами: температурой, давлением, расходом, уровнем.</p>
<p><strong>Что можно посчитать:</strong></p>
<ul>
<li><strong>Токовая петля 4–20 мА:</strong> стандарт передачи сигналов от датчиков. Проверяет, хватает ли напряжения питания для работы всех приборов в цепи.</li>
<li><strong>Масштабирование:</strong> пересчёт сигнала (4–20 мА) в реальные единицы (0–100°C, 0–10 бар и т.д.).</li>
<li><strong>RTD (Pt100):</strong> платиновый датчик температуры. Сопротивление меняется с температурой по известной формуле.</li>
<li><strong>ПИД-регулятор:</strong> алгоритм автоматического поддержания заданного значения (температуры, давления, уровня).</li>
<li><strong>Погрешности:</strong> расчёт точности измерительной цепи.</li>
</ul>`
  },
  pneumatics: {
    title: 'Пневматика',
    body: `<p>Пневматика — использование сжатого воздуха для приведения в движение механизмов. Пневмоцилиндры, пневмоклапаны, пневмодвигатели — всё это работает от компрессора.</p>
<p><strong>Что можно посчитать:</strong></p>
<ul>
<li><strong>Расход воздуха:</strong> сколько литров в минуту нужно для всех потребителей с учётом коэффициента использования и утечек.</li>
<li><strong>Пневмоцилиндр:</strong> усилие на штоке, скорость хода, время полного хода, объём воздуха на один цикл.</li>
<li><strong>Компрессор:</strong> требуемая производительность и объём ресивера.</li>
</ul>
<p><strong>Полезно знать:</strong></p>
<ul>
<li>Утечки в пневмосистеме составляют 10–30% от общего потребления.</li>
<li>Типичное рабочее давление — 6 бар.</li>
<li>Ресивер компрессора должен быть достаточно большим, чтобы компрессор не работал безостановочно.</li>
</ul>`
  },
  hydraulics: {
    title: 'Гидравлика',
    body: `<p>Гидравлика — использование жидкости (обычно масла) для передачи усилия и движения. Гидроцилиндры, гидромоторы, гидронасосы — основа экскаваторов, прессов, станков.</p>
<p><strong>Что можно посчитать:</strong></p>
<ul>
<li><strong>Гидроцилиндр:</strong> усилие на штоке (толкание и тяга), скорость хода, время, мощность.</li>
<li><strong>Гидронасос:</strong> требуемый расход, давление, мощность двигателя.</li>
<li><strong>Потери в трубе:</strong> перепад давления на длине трубопровода зависит от расхода, диаметра и вязкости масла.</li>
</ul>
<p><strong>Полезно знать:</strong></p>
<ul>
<li>Режим течения (ламинарный или турбулентный) определяется числом Рейнольдса. При Re < 2300 — ламинарный (более предсказуемый).</li>
<li>Скорость масла в напорных линиях — 3–6 м/с, в сливных — 1.5–3 м/с.</li>
<li>Гидравлическое масло нагревается при работе — нужен радиатор охлаждения.</li>
</ul>`
  }
};

/* ===================== HELP PANEL ===================== */
function toggleHelp() {
  const panel = $('#help-panel');
  const overlay = $('#help-overlay');
  if (!panel) return;
  const isOpen = panel.classList.contains('open');
  if (isOpen) {
    panel.classList.remove('open');
    overlay?.classList.remove('show');
  } else {
    const page = $('.page.active')?.id?.replace('page-', '');
    const helpData = HELP_CONTENT[page];
    const content = $('#help-content');
    if (content && helpData) {
      content.innerHTML = '<h3>' + helpData.title + '</h3>' + helpData.body;
    } else if (content) {
      content.innerHTML = '<p style="color:var(--text-muted)">Выберите калькулятор, чтобы увидеть справку по нему.</p>';
    }
    panel.classList.add('open');
    overlay?.classList.add('show');
  }
}

/* ===================== PRINT / PDF ===================== */
function printPage() {
  window.print();
}

function loadLang(l) {
  i18nData = I18N[l] || I18N.ru;
  lang = l;
  localStorage.setItem('lang', l);
  applyI18n();
}

function T(key) {
  const parts = key.split('.');
  let val = i18nData;
  for (const p of parts) { val = val?.[p]; }
  return val || key;
}

function applyI18n() {
  $$('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const text = T(key);
    if (text) el.textContent = text;
  });
  const page = $('.page.active')?.id?.replace('page-', '');
  if (page) updateBreadcrumb(page);
  $('.btn-lang').textContent = lang === 'ru' ? 'RU / EN' : 'EN / RU';
}

function updateBreadcrumb(page) {
  const map = {
    power:'nav.power',cable:'nav.cable',voltage:'nav.voltage',shortcircuit:'nav.shortcircuit',
    grounding:'nav.grounding',protection:'nav.protection',compensation:'nav.compensation',
    motor:'nav.motor',transformer:'nav.transformer',lighting:'nav.lighting',ups:'nav.ups',
    derating:'nav.derating',loadpanel:'nav.loadpanel',converter:'nav.converter',
    kipia:'nav.kipia',pneumatics:'nav.pneumatics',hydraulics:'nav.hydraulics',
    rccalc:'R/C соединение',motorcap:'Конденсатор Дв.',capval:'Значения конд.',
    led:'Светодиод',zener:'Стабилитрон',rlc:'Импеданс RLC',ne555:'NE555',
    opamp:'Опер. усилитель','7seg':'7-сегмент',diam2sec:'Диаметр→Сечение',bridge:'Мост Уитстона',
    help:'Справка',developer:'developer.title',donate:'donate.title'
  };
  const group = {
    power:'nav.electrical',cable:'nav.electrical',voltage:'nav.electrical',
    shortcircuit:'nav.electrical',grounding:'nav.electrical',protection:'nav.electrical',
    motor:'ОБОРУДОВАНИЕ',transformer:'ОБОРУДОВАНИЕ',compensation:'ОБОРУДОВАНИЕ',
    lighting:'ОБОРУДОВАНИЕ',ups:'ОБОРУДОВАНИЕ',loadpanel:'ОБОРУДОВАНИЕ',
    derating:'КАБЕЛЬНЫЕ СЕТИ',diam2sec:'КАБЕЛЬНЫЕ СЕТИ',converter:'КАБЕЛЬНЫЕ СЕТИ',
    rccalc:'ЭЛЕКТРОНИКА',capval:'ЭЛЕКТРОНИКА',motorcap:'ЭЛЕКТРОНИКА',
    led:'ЭЛЕКТРОНИКА',zener:'ЭЛЕКТРОНИКА',rlc:'ЭЛЕКТРОНИКА',bridge:'ЭЛЕКТРОНИКА',
    ne555:'МИКРОСХЕМЫ',opamp:'МИКРОСХЕМЫ','7seg':'МИКРОСХЕМЫ',
    kipia:'nav.kipia_group',pneumatics:'nav.kipia_group',hydraulics:'nav.kipia_group',
    help:'СИСТЕМА',developer:'СИСТЕМА',donate:'СИСТЕМА'
  };
  const g = T(group[page] || '');
  const p = T(map[page] || '');
  $('#breadcrumb').textContent = g && p ? `${g} / ${p}` : p || '';
}

/* ===================== NAVIGATION ===================== */
function showPage(name) {
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

function showSubTab(name) {
  const parent = $('.page.active .sub-tabs')?.closest('.card');
  if (!parent) return;
  parent.querySelectorAll('.sub-page').forEach(p => { p.classList.remove('active'); p.style.display='none'; });
  parent.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
  const sub = parent.querySelector(`#sub-${name}`);
  if (sub) { sub.classList.add('active'); sub.style.display = 'flex'; }
  parent.querySelector(`.sub-tab[data-sub="${name}"]`)?.classList.add('active');
}

/* ===================== THEME ===================== */
function toggleTheme() {
  const light = document.documentElement.getAttribute('data-theme') === 'light';
  document.documentElement.setAttribute('data-theme', light ? '' : 'light');
  $('.btn-theme').textContent = light ? '☀' : '☾';
  localStorage.setItem('theme', light ? 'dark' : 'light');
}

/* ===================== ELECTRICAL CALCULATIONS ===================== */
function calcPower() {
  const P=num('p-power'),U=num('p-u'),phase=num('p-phase'),cos=num('p-cos'),eta=num('p-eta');
  if(!P||!U||!cos||!eta){toast(T('common.check_data'));return;}
  const I=phase===3?P*1000/(Math.sqrt(3)*U*cos*eta):P*1000/(U*cos*eta);
  const S=phase===3?Math.sqrt(3)*U*I/1000:U*I/1000;
  $('#power-result-val').textContent=round(I,2);
  $('#power-result-unit').textContent='Ампер';
  $('#power-result-desc').textContent=T('power.desc');
  $('#power-I').textContent=round(I,2)+' А';
  $('#power-S').textContent=round(S,2)+' кВА';
}

function calcCable() {
  const I=num('c-I'),mat=$('#c-mat').value;
  if(!I){toast(T('common.check_data'));return;}
  const j=mat==='Cu'?10:6,S=I/j,d=2*Math.sqrt(S/Math.PI);
  $('#cable-result-val').textContent=round(S,2);
  $('#cable-d').textContent=round(d,2)+' мм';
}

function calcVoltage() {
  const I=num('v-I'),L=num('v-L'),R=num('v-R'),X=num('v-X'),U=num('v-U'),cos=num('v-cos');
  if(!I||!L||!R||!U||!cos){toast(T('common.check_data'));return;}
  const sin=Math.sqrt(1-cos*cos),dU=Math.sqrt(3)*I*L*(R*cos+X*sin)/1000,pct=dU/U*100;
  $('#voltage-result-val').textContent=round(pct,2);
  $('#voltage-pct').textContent=round(pct,2)+' %';
  $('#voltage-V').textContent=round(dU,1)+' В';
}

function calcShortCircuit() {
  const U=num('sc-U'),Z=num('sc-Z');
  if(!U||!Z){toast(T('common.check_data'));return;}
  $('#sc-result-val').textContent=Math.round(U/(Math.sqrt(3)*Z));
  $('#sc-Z-val').textContent=Z.toFixed(3)+' Ом';
}

function calcGrounding() {
  const rho=num('g-rho'),L=num('g-L'),d=num('g-d'),Rreq=num('g-Rreq');
  if(!rho||!L||!d||!Rreq){toast(T('common.check_data'));return;}
  const R1=rho/(2*Math.PI*L)*Math.log(4*L/d);
  $('#g-result-val').textContent=Math.ceil(R1/(Rreq*0.65));
}

function calcProtection() {
  const leak=num('pr-leak');
  if(!leak){toast(T('common.check_data'));return;}
  const std=[10,30,100,300,500];
  $('#pr-result-val').textContent=std.find(v=>v>=leak*3)||std[std.length-1];
}

function calcCompensation() {
  const P=num('comp-P'),cos1=num('comp-cos1'),cos2=num('comp-cos2'),step=num('comp-step');
  if(!P||!cos1||!cos2||!step){toast(T('common.check_data'));return;}
  const tg1=Math.sqrt(1-cos1*cos1)/cos1,tg2=Math.sqrt(1-cos2*cos2)/cos2;
  const Qc=P*(tg1-tg2),Q1=P*tg1,Q2=P*tg2;
  $('#comp-result-val').textContent=round(Qc,1);
  $('#comp-steps').textContent=Math.ceil(Qc/step);
  $('#comp-Q1').textContent=round(Q1,1);
  $('#comp-Q2').textContent=round(Q2,1);
  $('#comp-save').textContent=round((1-Q2/Q1)*100,1)+' %';
}

function calcMotor() {
  const P=num('m-P'),U=num('m-U'),cos=num('m-cos'),eta=num('m-eta'),k=num('m-k');
  if(!P||!U||!cos||!eta){toast(T('common.check_data'));return;}
  const I=P*1000/(Math.sqrt(3)*U*cos*eta);
  $('#m-result-val').textContent=round(I,1)+' А';
  $('#m-Istart').textContent=Math.round(I*k)+' А';
  $('#m-breaker').textContent=Math.ceil(I*1.25/5)*5+' А';
  $('#m-section').textContent=round(I/6,1)+' мм²';
}

function calcTransformer() {
  const P=num('t-P'),cos=num('t-cos'),Uvn=num('t-Uvn'),unn=num('t-unn'),uk=num('t-uk');
  if(!P||!cos||!Uvn||!unn){toast(T('common.check_data'));return;}
  const S=P/cos;
  $('#t-result-val').textContent=round(S,0)+' кВА';
  $('#t-Ivn').textContent=round(S/(Math.sqrt(3)*Uvn),1)+' А';
  $('#t-Inn').textContent=round(S/(Math.sqrt(3)*unn),1)+' А';
  $('#t-Ikz').textContent=Math.round(S/(Math.sqrt(3)*unn)*100/uk)+' А';
  $('#t-load').textContent=round(P/S,2);
}

function calcLighting() {
  const S=num('l-S'),E=num('l-E'),phi=num('l-phi'),eta=num('l-eta');
  if(!S||!E||!phi||!eta){toast(T('common.check_data'));return;}
  const N=Math.ceil(E*S/(phi*eta));
  $('#l-result-val').textContent=N;
  $('#l-P').textContent=N*36+' Вт';
  $('#l-ud').textContent=round(N*36/S,1)+' Вт/м²';
}

function calcUPS() {
  const P=num('u-P'),t=num('u-t'),U=num('u-U'),eta=num('u-eta');
  if(!P||!t||!U||!eta){toast(T('common.check_data'));return;}
  const Ah=P*1000*t/(60*U*eta*0.8);
  $('#u-result-val').textContent=Math.round(Ah);
  $('#u-Ah').textContent=Math.round(Ah)+' А·ч';
  $('#u-gen').textContent=round(P/0.8/eta,2)+' кВА';
}

function calcConverter() {
  const type=$('#conv-type').value,val=num('conv-val');
  if(isNaN(val)){toast(T('common.check_data'));return;}
  let result='';
  switch(type){
    case'mm2_awg':{const awg=Math.round(-39*Math.log2(val/0.162)/10+36);result=`${round(0.162*Math.pow(2,(36-awg)*10/39),2)} мм² = AWG ${awg}`;break;}
    case'c_f':result=`${val}°C = ${round(val*9/5+32,1)}°F | ${val}°F = ${round((val-32)*5/9,1)}°C`;break;
    case'kw_hp':result=`${val} кВт = ${round(val*1.341,2)} л.с.`;break;
    case'kva_kvar':{const cos=0.85,kw=val*cos;result=`${val} кВА = ${round(kw,1)} кВт = ${round(Math.sqrt(val*val-kw*kw),1)} квар`;break;}
    case'w_dbm':result=`${val} Вт = ${round(10*Math.log10(val/0.001),1)} дБм`;break;
  }
  $('#conv-result').value=result;
}

/* ===================== KИПиА ===================== */
function calcCurrentLoop() {
  const V=num('cl-V'),Vmin=num('cl-Vmin'),Rw=num('cl-Rw'),Ri=num('cl-Ri'),Rb=num('cl-Rb');
  if([V,Vmin,Rw,Ri,Rb].some(isNaN)){toast(T('common.check_data'));return;}
  const Rmax=(V-Vmin)/0.02,Rsum=Rw+Ri+Rb,ok=Rsum<=Rmax;
  const el=$('#cl-result-val');
  el.textContent=ok?T('kipia.loop_valid'):T('kipia.loop_invalid');
  el.style.color=ok?'var(--result)':'var(--error)';
  $('#cl-Rmax').textContent=round(Rmax,0)+' Ом';
  $('#cl-Rsum').textContent=Rsum+' Ом';
  $('#cl-Vdrop').textContent=round(0.02*Rsum,2)+' В';
  $('#cl-status').innerHTML=ok?'<span class="check">OK</span>':'<span style="color:var(--error);font-weight:600">FAIL</span>';
}

function calcScaling() {
  const sig=num('sc-signal'),Smin=num('sc-Smin'),Smax=num('sc-Smax'),LRV=num('sc-LRV'),URV=num('sc-URV');
  if([sig,Smin,Smax,LRV,URV].some(isNaN)||Smax===Smin){toast(T('common.check_data'));return;}
  $('#sc-scale-val').textContent=round(LRV+(sig-Smin)/(Smax-Smin)*(URV-LRV),2);
  $('#sc-scale-pct').textContent=round((sig-Smin)/(Smax-Smin)*100,1)+' %';
}

function calcRTD() {
  const mode=$('#rtd-mode').value,val=num('rtd-val'),type=$('#rtd-type').value;
  const R0=type==='Pt1000'?1000:type==='Pt500'?500:100;
  const A=3.9083e-3,B=-5.775e-7;
  if(isNaN(val)){toast(T('common.check_data'));return;}
  if(mode==='t2r'){$('#rtd-result-val').textContent=round(val,2)+' °C';$('#rtd-result-unit').textContent='→ '+round(R0*(1+A*val+B*val*val),3)+' Ом';}
  else{const t=(-R0*A+Math.sqrt(R0*R0*A*A-4*R0*B*(R0-val)))/(2*R0*B);$('#rtd-result-val').textContent=round(val,3)+' Ом';$('#rtd-result-unit').textContent='→ '+round(t,2)+' °C';}
}

function calcPID() {
  const Ku=num('pid-Ku'),Tu=num('pid-Tu');
  if(!Ku||!Tu){toast(T('common.check_data'));return;}
  const Kp=0.6*Ku,Ti=0.5*Tu,Td=0.125*Tu;
  $('#pid-result-val').textContent='Kp = '+round(Kp,3);
  $('#pid-Ti').textContent=round(Ti,2)+' с';
  $('#pid-Td').textContent=round(Td,2)+' с';
  $('#pid-Ki').textContent=round(Kp/Ti,4);
  $('#pid-Kd').textContent=round(Kp*Td,4);
}

function calcAccuracy() {
  const cl=num('acc-cl'),range=num('acc-range'),bits=num('acc-bits');
  if(!cl||!range||!bits){toast(T('common.check_data'));return;}
  const abs=cl/100*range;
  $('#acc-result-val').textContent='±'+round(abs,3);
  $('#acc-abs').textContent=round(abs,3);
  $('#acc-lsb').textContent=round(range/Math.pow(2,bits),4);
}

/* ===================== DERATING ===================== */
function calcDerating() {
  const Ibase=num('dr-I'),T=num('dr-T'),N=num('dr-N');
  if(!Ibase||!T||!N){toast(T('common.check_data'));return;}
  const kt=T<=20?1.0:T<=25?0.97:T<=30?0.94:T<=35?0.91:T<=40?0.87:T<=45?0.83:T<=50?0.79:T<=55?0.75:0.71;
  const kg=N<=1?1.0:N<=2?0.95:N<=3?0.80:N<=4?0.72:N<=6?0.65:N<=9?0.57:0.50;
  const ktotal=kt*kg,Iallow=Ibase*ktotal,reduction=(1-ktotal)*100;
  $('#dr-result-val').textContent=round(Iallow,1);
  $('#dr-kt').textContent=round(kt,2);
  $('#dr-kg').textContent=round(kg,2);
  $('#dr-ktotal').textContent=round(ktotal,2);
  $('#dr-red').textContent=round(reduction,1)+' %';
}

/* ===================== LOAD PANEL ===================== */
function calcLoadPanel() {
  const rows=document.querySelectorAll('#load-table tbody tr');
  let Ptotal=0;
  const phaseP={1:0,2:0,3:0};
  rows.forEach(row=>{
    const P=parseFloat(row.querySelector('.tbl-p')?.value)||0;
    const ks=parseFloat(row.querySelector('.tbl-ks')?.value)||1;
    const phase=parseInt(row.querySelector('.tbl-phase')?.value)||1;
    const Prated=P*ks;
    Ptotal+=Prated;
    phaseP[phase]+=Prated;
  });
  const U=380,cosAvg=0.85;
  const IL1=phaseP[1]/(U/1000*cosAvg),IL2=phaseP[2]/(U/1000*cosAvg),IL3=phaseP[3]/(U/1000*cosAvg);
  const Imax=Math.max(IL1,IL2,IL3),Imin=Math.min(IL1,IL2,IL3);
  const imbalance=Imax>0?((Imax-Imin)/Imax*100):0;
  $('#lp-Ptotal').textContent=round(Ptotal,1)+' кВт';
  $('#lp-Pcalc').textContent=round(Ptotal*0.9,1)+' кВт';
  $('#lp-IL1').textContent=round(IL1,1)+' А';
  $('#lp-IL2').textContent=round(IL2,1)+' А';
  $('#lp-IL3').textContent=round(IL3,1)+' А';
  $('#lp-imb').textContent=round(imbalance,1)+' %';
}

function addLoadRow() {
  const tbody=document.querySelector('#load-table tbody');
  const tr=document.createElement('tr');
  tr.innerHTML='<td><input type="text" value="Новая группа" class="tbl-input"></td><td><input type="number" value="1.0" step="0.1" class="tbl-input tbl-p"></td><td><input type="number" value="0.85" step="0.01" class="tbl-input tbl-cos"></td><td><input type="number" value="0.8" step="0.1" class="tbl-input tbl-ks"></td><td><select class="tbl-input tbl-phase"><option value="1">L1</option><option value="2">L2</option><option value="3">L3</option></select></td>';
  tbody.appendChild(tr);
}

/* ===================== PNEUMATICS ===================== */
function calcPneumFlow() {
  const N=num('pf-N'),q=num('pf-q'),k=num('pf-k'),leak=num('pf-leak');
  if(!N||!q||!k){toast(T('common.check_data'));return;}
  const Qavg=N*q*k,Qpeak=N*q,Qleaks=Qavg*(1+leak);
  $('#pf-result-val').textContent=round(Qavg,0);
  $('#pf-peak').textContent=round(Qpeak,0)+' л/мин';
  $('#pf-leaks').textContent=round(Qleaks,0)+' л/мин';
}

function calcPneumCyl() {
  const D=num('pc-D'),d=num('pc-d'),L=num('pc-L'),P=num('pc-P'),Q=num('pc-Q');
  if(!D||!P){toast(T('common.check_data'));return;}
  const A=Math.PI*D*D/400,Arod=Math.PI*d*d/400;
  const Ffwd=P*A*10*0.95,Fback=P*(A-Arod)*10*0.95;
  const speed=Q*1000/(A*60)/100,time=L/1000/speed,volume=A*L/10000;
  $('#pc-result-val').textContent=round(Ffwd,0);
  $('#pc-Fback').textContent=round(Fback,0)+' Н';
  $('#pc-speed').textContent=round(speed,2)+' м/с';
  $('#pc-time').textContent=round(time,2)+' с';
  $('#pc-V').textContent=round(volume,2)+' л';
}

function calcPneumComp() {
  const Q=num('pcomp-Q'),P=num('pcomp-P'),k=num('pcomp-k'),t=num('pcomp-t');
  if(!Q||!P||!k){toast(T('common.check_data'));return;}
  const Qcomp=Q*k,power=Qcomp*P/(600*0.7),tank=Qcomp*t/(P+1);
  $('#pcomp-result-val').textContent=round(Qcomp,0);
  $('#pcomp-power').textContent=round(power,1)+' кВт';
  $('#pcomp-tank').textContent=round(tank,0)+' л';
}

/* ===================== HYDRAULICS ===================== */
function calcHydCyl() {
  const D=num('hc-D'),d=num('hc-d'),L=num('hc-L'),P=num('hc-P'),Q=num('hc-Q'),eta=num('hc-eta');
  if(!D||!P||!Q){toast(T('common.check_data'));return;}
  const Api=Math.PI*D*D/4,Arod=Math.PI*d*d/4; // mm²
  const Fpush=P*Api*eta/10000,Fpull=P*(Api-Arod)*eta/10000; // kN
  const speed=Q/(Api*60000/1e6),time=L/1000/speed,power=P*Q/600;
  $('#hc-result-val').textContent=round(Fpush,1);
  $('#hc-Fpull').textContent=round(Fpull,1)+' кН';
  $('#hc-speed').textContent=round(speed,2)+' м/с';
  $('#hc-time').textContent=round(time,2)+' с';
  $('#hc-power').textContent=round(power,1)+' кВт';
}

function calcHydPump() {
  const Q=num('hp-Q'),P=num('hp-P'),etaP=num('hp-eta'),etaM=num('hp-etaM');
  if(!Q||!P){toast(T('common.check_data'));return;}
  const N=P*Q/(600*etaP*etaM),V=Q*1000/1450;
  const type=P<=100?'Шестерёнчатый':P<=250?'Аксиально-поршневой':'Радиально-поршневой';
  $('#hp-result-val').textContent=round(N,1);
  $('#hp-type').textContent=type;
  $('#hp-V').textContent=round(V,1)+' см³';
}

function calcHydPipe() {
  const L=num('hpp-L'),D=num('hpp-D'),Q=num('hpp-Q'),nu=num('hpp-nu');
  if(!L||!D||!Q){toast(T('common.check_data'));return;}
  const A=Math.PI*(D/1000)*(D/1000)/4,v=Q/(A*60000),Re=v*(D/1000)/(nu*1e-6);
  const rho=870;
  let lambda,mode;
  if(Re<2300){lambda=64/Re;mode='Ламинарный';}
  else{lambda=0.3164/Math.pow(Re,0.25);mode='Турбулентный';}
  const dP=lambda*L*rho*v*v/(2*D/1000)/100000;
  $('#hpp-result-val').textContent=round(dP,1);
  $('#hpp-v').textContent=round(v,2)+' м/с';
  $('#hpp-Re').textContent=Math.round(Re);
  $('#hpp-mode').textContent=mode;
  $('#hpp-lam').textContent=round(lambda,3);
}

/* ===================== ELECTRONICS: RESISTOR/CAPACITOR ===================== */
function calcResSeries() {
  const R1=num('rs-R1'),R2=num('rs-R2'),R3=num('rs-R3')||0;
  if(!R1||!R2){toast(T('common.check_data'));return;}
  const R=R1+R2+(R3||0);
  $('#rs-result-val').textContent=round(R,1);
}

function calcResParallel() {
  const R1=num('rp-R1'),R2=num('rp-R2'),R3=num('rp-R3')||0;
  if(!R1||!R2){toast(T('common.check_data'));return;}
  let inv=1/R1+1/R2;
  if(R3>0) inv+=1/R3;
  const R=1/inv;
  $('#rp-result-val').textContent=round(R,1);
}

function calcCapSeries() {
  const C1=num('cs-C1'),C2=num('cs-C2'),C3=num('cs-C3')||0;
  if(!C1||!C2){toast(T('common.check_data'));return;}
  let inv=1/C1+1/C2;
  if(C3>0) inv+=1/C3;
  const C=1/inv;
  $('#cs-result-val').textContent=round(C,2);
}

function calcCapParallel() {
  const C1=num('cp-C1'),C2=num('cp-C2'),C3=num('cp-C3')||0;
  if(!C1||!C2){toast(T('common.check_data'));return;}
  const C=C1+C2+(C3||0);
  $('#cp-result-val').textContent=round(C,1);
}

/* ===================== MOTOR CAPACITOR ===================== */
function calcMotorCap() {
  const P=num('mc-P'),U=num('mc-U'),f=num('mc-f'),cos=num('mc-cos'),eta=num('mc-eta'),type=$('#mc-type').value;
  if(!P||!U||!f||!cos||!eta){toast(T('common.check_data'));return;}
  const Pw=P*1000;
  const I=Pw/(U*cos*eta);
  let Cwork;
  if(type==='1ph'){
    Cwork=1000000*Pw/(2*Math.PI*f*U*U*cos*eta);
  } else {
    Cwork=1000000*Pw/(2*Math.PI*f*U*U*cos*eta)*Math.sqrt(3);
  }
  const Cstart=Cwork*2.5;
  const Uc=type==='3ph'?U*Math.sqrt(3):U;
  $('#mc-result-val').textContent=round(Cwork,1);
  $('#mc-Cwork').textContent=round(Cwork,1)+' мкФ';
  $('#mc-Cstart').textContent=round(Cstart,1)+' мкФ';
  $('#mc-I').textContent=round(I,1)+' А';
  $('#mc-Uc').textContent=Math.round(Uc)+' В';
}

/* ===================== DIAMETER TO SECTION ===================== */
function calcDiam2Sec() {
  const d=num('ds-d'),n=num('ds-n')||1;
  if(!d){toast(T('common.check_data'));return;}
  const S=Math.PI*d*d/4;
  const Stotal=S*n;
  const circ=Math.PI*d;
  const std=[0.5,0.75,1,1.5,2.5,4,6,10,16,25,35,50,70,95,120,150,185,240];
  const nearest=std.reduce((a,b)=>Math.abs(b-Stotal)<Math.abs(a-Stotal)?b:a);
  $('#ds-result-val').textContent=round(Stotal,2);
  $('#ds-S').textContent=round(S,2)+' мм²';
  $('#ds-Circ').textContent=round(circ,2)+' мм';
  $('#ds-Stotal').textContent=round(Stotal,2)+' мм²';
  $('#ds-nearest').textContent=nearest+' мм²';
}

/* ===================== WHEATSTONE BRIDGE ===================== */
function calcBridge() {
  const R1=num('wb-R1'),R2=num('wb-R2'),R3=num('wb-R3'),R4=num('wb-R4'),V=num('wb-V');
  if(!R1||!R2||!R3||!R4||!V){toast(T('common.check_data'));return;}
  const Vout=V*(R3/(R3+R4)-R2/(R1+R2));
  const balanced=Math.abs(R1*R4-R2*R3)<1;
  $('#wb-result-val').textContent=round(Vout,3);
  $('#wb-Vout').textContent=round(Vout,3)+' В';
  $('#wb-status').innerHTML=balanced?'<span class="check">Сбалансирован</span>':'<span style="color:var(--warn);font-weight:600">Не сбалансирован</span>';
  $('#wb-prod1').textContent=Math.round(R1*R4);
  $('#wb-prod2').textContent=Math.round(R2*R3);
}

/* ===================== LED RESISTOR ===================== */
function calcLED() {
  const V=num('led-V'),Vf=num('led-Vf'),I=num('led-I'),N=num('led-N'),conn=$('#led-conn').value;
  if(!V||!Vf||!I){toast(T('common.check_data'));return;}
  const If=I/1000;
  let R,Ptotal,Itotal;
  if(conn==='series'){
    R=(V-N*Vf)/If;
    Ptotal=If*If*R*N;
    Itotal=I;
  } else {
    R=(V-Vf)/If;
    Ptotal=If*If*R*N;
    Itotal=I*N;
  }
  const std=[10,22,33,47,56,68,82,100,120,150,180,220,270,330,390,470,560,680,820,1000,1200,1500,2200,3300,4700,5600,6800,10000];
  const nearest=std.reduce((a,b)=>Math.abs(b-R)<Math.abs(a-R)?b:a);
  const P=If*If*R;
  $('#led-result-val').textContent=round(R,0);
  $('#led-R').textContent=round(R,0)+' Ом';
  $('#led-Rnearest').textContent=nearest+' Ом';
  $('#led-P').textContent=round(P*1000,0)+' мВт';
  $('#led-Itotal').textContent=Itotal+' мА';
}

/* ===================== RLC IMPEDANCE ===================== */
function calcRLC() {
  const R=num('rlc-R'),L=num('rlc-L'),C=num('rlc-C'),f=num('rlc-f'),type=$('#rlc-type').value;
  if(!R||!L||!C||!f){toast(T('common.check_data'));return;}
  const XL=2*Math.PI*f*L/1000;
  const XC=1/(2*Math.PI*f*C/1000000);
  const X=XL-XC;
  let Z;
  if(type==='series'){
    Z=Math.sqrt(R*R+X*X);
  } else {
    Z=1/Math.sqrt(1/(R*R)+Math.pow(1/XL-1/XC,2));
  }
  const phi=Math.atan2(X,R)*180/Math.PI;
  const fres=1/(2*Math.PI*Math.sqrt(L/1000*C/1000000));
  const Q=XL/R;
  $('#rlc-result-val').textContent=round(Z,1);
  $('#rlc-XL').textContent=round(XL,1)+' Ом';
  $('#rlc-XC').textContent=round(XC,1)+' Ом';
  $('#rlc-X').textContent=round(X,1)+' Ом';
  $('#rlc-phi').textContent=round(phi,1)+'°';
  $('#rlc-fres').textContent=Math.round(fres)+' Гц';
  $('#rlc-Q').textContent=round(Q,2);
}

/* ===================== CAPACITOR VALUE DECODER ===================== */
function calcCapCode() {
  const code=$('#cc-code').value.trim();
  if(!code){toast(T('common.check_data'));return;}
  let pF;
  if(/^\d+$/.test(code)&&code.length>=3){
    const ab=parseInt(code.substring(0,2));
    const d=parseInt(code.substring(2));
    pF=ab*Math.pow(10,d);
  } else if(/^\d+$/.test(code)&&code.length===2){
    pF=parseInt(code);
  } else {
    toast('Неверный код');return;
  }
  const nF=pF/1000;
  const uF=pF/1000000;
  $('#cc-result-val').textContent=round(nF,1);
  $('#cc-pF').textContent=Math.round(pF)+' пФ';
  $('#cc-nF').textContent=round(nF,1)+' нФ';
  $('#cc-uF').textContent=round(uF,4)+' мкФ';
  $('#cc-codeout').textContent=code;
  $('#cc-desc').textContent=round(uF,4)+' мкФ = '+Math.round(pF)+' пФ';
}

function calcCapUnit() {
  const val=num('cu-val'),unit=$('#cu-unit').value;
  if(isNaN(val)){toast(T('common.check_data'));return;}
  let uF;
  switch(unit){
    case'F':uF=val*1000000;break;
    case'uF':uF=val;break;
    case'nF':uF=val/1000;break;
    case'pF':uF=val/1000000;break;
  }
  const pF=uF*1000000,nF=uF*1000,F=uF/1000000;
  $('#cu-result-val').textContent=round(pF,0);
  $('#cu-F').textContent=F.toExponential(2)+' Ф';
  $('#cu-uF').textContent=round(uF,4)+' мкФ';
  $('#cu-nF').textContent=round(nF,1)+' нФ';
  $('#cu-pF').textContent=Math.round(pF)+' пФ';
}

/* ===================== ZENER DIODE ===================== */
function calcZener() {
  const Vin=num('zen-Vin'),Vz=num('zen-Vz'),IL=num('zen-IL'),Iz=num('zen-Iz'),Pzmax=num('zen-Pz');
  if(!Vin||!Vz||!IL||!Iz||!Pzmax){toast(T('common.check_data'));return;}
  const Itotal=(Iz+IL)/1000;
  const R=(Vin-Vz)/Itotal;
  const Pr=Itotal*Itotal*R;
  const Pzact=Vz*Iz/1000;
  const ok=Pzact<=Pzmax;
  const std=[10,22,33,47,56,68,82,100,120,150,180,220,270,330,390,470,560,680,820,1000,1200,1500,2200,3300,4700,5600,6800,10000];
  const nearest=std.reduce((a,b)=>Math.abs(b-R)<Math.abs(a-R)?b:a);
  $('#zen-result-val').textContent=round(R,0);
  $('#zen-R').textContent=round(R,0)+' Ом';
  $('#zen-Rnear').textContent=nearest+' Ом';
  $('#zen-Pr').textContent=round(Pr*1000,0)+' мВт';
  $('#zen-Pzact').textContent=round(Pzact*1000,0)+' мВт';
  $('#zen-check').innerHTML=ok?'<span class="check">✓ Норма</span>':'<span style="color:var(--error);font-weight:600">✗ Превышена мощность!</span>';
  $('#zen-IR').textContent=Math.round((Iz+IL))+' мА';
}

/* ===================== NE555 ASTABLE ===================== */
function calcAstable() {
  const R1=num('ast-R1'),R2=num('ast-R2'),C=num('ast-C')/1000000;
  if(!R1||!R2||!C){toast(T('common.check_data'));return;}
  const f=1.44/((R1+2*R2)*C);
  const T=1/f;
  const ton=0.693*(R1+R2)*C;
  const toff=0.693*R2*C;
  const duty=(R1+R2)/(R1+2*R2)*100;
  const ok=R1>=1000;
  $('#ast-result-val').textContent=Math.round(f);
  $('#ast-freq').textContent=Math.round(f)+' Гц';
  $('#ast-period').textContent=round(T*1000,2)+' мс';
  $('#ast-duty').textContent=round(duty,1)+' %';
  $('#ast-ton').textContent=round(ton*1000,2)+' мс';
  $('#ast-toff').textContent=round(toff*1000,2)+' мс';
  $('#ast-ok').innerHTML=ok?'<span class="check">✓ Норма</span>':'<span style="color:var(--error);font-weight:600">✗ R1 < 1кОм!</span>';
}

function calcMonostable() {
  const R=num('mono-R')*1000,C=num('mono-C')/1000000;
  if(!R||!C){toast(T('common.check_data'));return;}
  const t=1.1*R*C;
  $('#mono-result-val').textContent=round(t*1000,1);
}

/* ===================== OPERATIONAL AMPLIFIER ===================== */
function calcInvOpamp() {
  const R1=num('inv-R1'),Rf=num('inv-Rf'),Vin=num('inv-Vin');
  if(!R1||!Rf){toast(T('common.check_data'));return;}
  const K=-Rf/R1;
  const Vout=K*Vin;
  $('#inv-result-val').textContent=round(Vout,2);
  $('#inv-K').textContent=round(K,1);
  $('#inv-Vout').textContent=round(Vout,2)+' В';
}

function calcNonInvOpamp() {
  const R1=num('ninv-R1'),Rf=num('ninv-Rf'),Vin=num('ninv-Vin');
  if(!R1||!Rf){toast(T('common.check_data'));return;}
  const K=1+Rf/R1;
  const Vout=K*Vin;
  $('#ninv-result-val').textContent=round(Vout,2);
  $('#ninv-K').textContent=round(K,1);
  $('#ninv-Vout').textContent=round(Vout,2)+' В';
}

function calcSumOpamp() {
  const R1=num('sum-R1'),R2=num('sum-R2'),Rf=num('sum-Rf'),V1=num('sum-V1'),V2=num('sum-V2');
  if(!R1||!R2||!Rf){toast(T('common.check_data'));return;}
  const Vout=-(Rf/R1*V1+Rf/R2*V2);
  $('#sum-result-val').textContent=round(Vout,2);
}

function calcDiffOpamp() {
  const R1=num('diff-R1'),R2=num('diff-R2'),R3=num('diff-R3'),R4=num('diff-R4'),V1=num('diff-V1'),V2=num('diff-V2');
  if(!R1||!R2||!R3||!R4){toast(T('common.check_data'));return;}
  const Vout=(R2/R1)*(V1-V2);
  $('#diff-result-val').textContent=round(Vout,2);
}

/* ===================== 7-SEGMENT DISPLAY ===================== */
function calc7segRes() {
  const V=num('s7r-V'),Vf=num('s7r-Vf'),I=num('s7r-I')/1000,N=num('s7r-N'),type=$('#s7r-type').value;
  if(!V||!Vf||!I){toast(T('common.check_data'));return;}
  const R=(V-Vf)/I;
  const P=I*I*R*1000;
  const Itotal=I*N*1000;
  const Ptotal=P*N;
  const std=[10,22,33,47,56,68,82,100,120,150,180,220,270,330,390,470,560,680,820,1000];
  const nearest=std.reduce((a,b)=>Math.abs(b-R)<Math.abs(a-R)?b:a);
  $('#s7r-result-val').textContent=round(R,0);
  $('#s7r-R').textContent=round(R,0)+' Ом';
  $('#s7r-Rnear').textContent=nearest+' Ом';
  $('#s7r-P1').textContent=Math.round(P)+' мВт';
  $('#s7r-Itotal').textContent=Math.round(Itotal)+' мА';
  $('#s7r-Ptotal').textContent=Math.round(Ptotal)+' мВт';
  $('#s7r-typelbl').textContent=type==='ca'?'Общий анод':'Общий катод';
}

function calc7segDec() {
  const ch=$('#s7d-char').value.toUpperCase();
  const type=$('#s7d-type').value;
  const segMap={
    '0':{a:1,b:1,c:1,d:1,e:1,f:1,g:0},'1':{a:0,b:1,c:1,d:0,e:0,f:0,g:0},
    '2':{a:1,b:1,c:0,d:1,e:1,f:0,g:1},'3':{a:1,b:1,c:1,d:1,e:0,f:0,g:1},
    '4':{a:0,b:1,c:1,d:0,e:0,f:1,g:1},'5':{a:1,b:0,c:1,d:1,e:0,f:1,g:1},
    '6':{a:1,b:0,c:1,d:1,e:1,f:1,g:1},'7':{a:1,b:1,c:1,d:0,e:0,f:0,g:0},
    '8':{a:1,b:1,c:1,d:1,e:1,f:1,g:1},'9':{a:1,b:1,c:1,d:1,e:0,f:1,g:1},
    'A':{a:1,b:1,c:1,d:0,e:1,f:1,g:1},'B':{a:0,b:0,c:1,d:1,e:1,f:1,g:1},
    'C':{a:1,b:0,c:0,d:1,e:1,f:1,g:0},'D':{a:0,b:1,c:1,d:1,e:1,f:0,g:1},
    'E':{a:1,b:0,c:0,d:1,e:1,f:1,g:1},'F':{a:1,b:0,c:0,d:0,e:1,f:1,g:1}
  };
  const seg=segMap[ch];
  if(!seg){toast('Неверный символ');return;}
  const hexVal=Object.values(seg).reduce((acc,v,i)=>acc|(v<<(6-i)),0);
  const inv=type==='ca';
  $('#s7d-display').textContent=ch;
  $('#s7d-hex').textContent='HEX: 0x'+hexVal.toString(16).toUpperCase().padStart(2,'0');
  ['a','b','c','d','e','f','g'].forEach(s=>{
    const v=inv?(seg[s]?0:1):seg[s];
    const el=$('#s7d-'+s);
    el.textContent=v;
    el.style.color=v?'var(--result)':'var(--error)';
  });
}

/* ===================== BIND ALL ===================== */
function bindAll() {
  $$('.nav-item[data-page]').forEach(el=>el.addEventListener('click',()=>showPage(el.dataset.page)));
  $$('.sub-tab[data-sub]').forEach(el=>el.addEventListener('click',()=>showSubTab(el.dataset.sub)));
  $('.btn-theme')?.addEventListener('click',toggleTheme);
  $('.btn-lang')?.addEventListener('click',()=>loadLang(lang==='ru'?'en':'ru'));
  $('.nav-toggle')?.addEventListener('click',()=>{$('.sidebar')?.classList.toggle('open');$('.nav-overlay')?.classList.toggle('show');});
  $('.nav-overlay')?.addEventListener('click',()=>{$('.sidebar')?.classList.remove('open');$('.nav-overlay')?.classList.remove('show');});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('.sidebar')?.classList.remove('open');$('.nav-overlay')?.classList.remove('show');}});

  const binds=[
    ['btn-power-calc',calcPower],['btn-cable-calc',calcCable],['btn-voltage-calc',calcVoltage],
    ['btn-sc-calc',calcShortCircuit],['btn-g-calc',calcGrounding],['btn-pr-calc',calcProtection],
    ['btn-comp-calc',calcCompensation],['btn-m-calc',calcMotor],['btn-t-calc',calcTransformer],
    ['btn-l-calc',calcLighting],['btn-u-calc',calcUPS],['btn-conv-calc',calcConverter],
    ['btn-cl-calc',calcCurrentLoop],['btn-sc-scale-calc',calcScaling],['btn-rtd-calc',calcRTD],
    ['btn-pid-calc',calcPID],['btn-acc-calc',calcAccuracy],
    ['btn-dr-calc',calcDerating],['btn-lp-calc',calcLoadPanel],['btn-lp-add',addLoadRow],
    ['btn-pf-calc',calcPneumFlow],['btn-pc-calc',calcPneumCyl],['btn-pcomp-calc',calcPneumComp],
    ['btn-hc-calc',calcHydCyl],['btn-hp-calc',calcHydPump],['btn-hpp-calc',calcHydPipe],
    ['btn-rs-calc',calcResSeries],['btn-rp-calc',calcResParallel],
    ['btn-cs-calc',calcCapSeries],['btn-cp-calc',calcCapParallel],
    ['btn-mc-calc',calcMotorCap],['btn-ds-calc',calcDiam2Sec],
    ['btn-wb-calc',calcBridge],['btn-led-calc',calcLED],
    ['btn-rlc-calc',calcRLC],['btn-cc-calc',calcCapCode],['btn-cu-calc',calcCapUnit],
    ['btn-zen-calc',calcZener],['btn-ast-calc',calcAstable],['btn-mono-calc',calcMonostable],
    ['btn-inv-calc',calcInvOpamp],['btn-ninv-calc',calcNonInvOpamp],
    ['btn-sum-calc',calcSumOpamp],['btn-diff-calc',calcDiffOpamp],
    ['btn-s7r-calc',calc7segRes],['btn-s7d-calc',calc7segDec],
  ];
  binds.forEach(([id,fn])=>document.getElementById(id)?.addEventListener('click',fn));

  $$('[id$="-reset"]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const page=btn.closest('.page');
      page?.querySelectorAll('input[type="number"]').forEach(inp=>inp.value=inp.defaultValue);
      page?.querySelectorAll('select').forEach(sel=>sel.selectedIndex=0);
    });
  });

  $('#btn-power-pdf')?.addEventListener('click',()=>window.print());
  $('#btn-power-copy')?.addEventListener('click',()=>{
    copyText(`Ток: ${$('#power-result-val')?.textContent} ${$('#power-result-unit')?.textContent}`);
  });

  if(localStorage.getItem('theme')==='light'){
    document.documentElement.setAttribute('data-theme','light');
    $('.btn-theme').textContent='☾';
  }

  const hash=location.hash.slice(1);
  showPage((hash&&$(`#page-${hash}`))?hash:'power');
  showSubTab('currentloop');
}

document.addEventListener('DOMContentLoaded',()=>{
  loadLang(lang);
  bindAll();
});
