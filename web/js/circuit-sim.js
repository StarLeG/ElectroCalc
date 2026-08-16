/**
 * circuit-sim.js — расчёт рабочей точки цепи постоянного тока
 * методом модифицированного узлового анализа (MNA).
 *
 * Поддерживаются: R, C, L (в статике), источники E и J, диод, светодиод,
 * стабилитрон, ключ, заземление.
 *
 * Знаки. Принята пассивная система знаков: ток ветви i положителен, когда течёт
 * ВНУТРИ элемента от первого вывода к второму (a→b, p→n, анод→катод), а
 * U = V(первый) − V(второй). Тогда P = U·i > 0 — элемент потребляет,
 * P < 0 — отдаёт (нормальное состояние источника питания).
 */
'use strict';
import { COMPONENT_TYPES, getComponentPins } from './schematic-model.js';

/* ===================== ПАРАМЕТРЫ МОДЕЛЕЙ ===================== */
const GMIN     = 1e-12;   // фоновая проводимость: не даёт узлам «повиснуть»
const G_OPEN   = 1e-12;   // разомкнутый ключ / закрытый p-n переход
const R_ON     = 10;      // дифференциальное сопротивление открытого перехода, Ом
const VBE_ON   = 0.7;     // напряжение отпирания перехода база-эмиттер, В
const VGT_ON   = 0.7;     // напряжение отпирания управляющего перехода тиристора, В
const VCE_SAT  = 0.2;     // напряжение насыщения коллектор-эмиттер, В
const BETA_R   = 1;       // инверсный коэффициент передачи тока (модель Эберса — Молла)
const MAX_ITER = 100;     // предел итераций для нелинейных элементов
const TOL      = 1e-9;    // сходимость по изменению узловых напряжений, В
const P_WARN   = 0.25;    // порог предупреждения о рассеиваемой мощности, Вт

/**
 * Расчёт рабочей точки схемы.
 * @param {import('./schematic-model.js').SchematicModel} model
 * @returns {{ok:boolean, error?:string, messageKey?:string,
 *            nodeVoltages?:Object, branches?:Object, pinCurrents?:Object,
 *            wireCurrents?:Object, warnings?:Array}}
 */
export function solveDC(model) {
  try {
    return solveInternal(model);
  } catch (err) {
    return { ok: false, error: 'exception', messageKey: 'editor.err_internal', detail: err.message };
  }
}

/**
 * Сборка и решение системы.
 * @param {object|null} ctx Контекст шага по времени:
 *   null — статический расчёт (конденсатор разрыв, катушка перемычка);
 *   { h, capV, indI } — шаг неявным методом Эйлера с шагом h;
 *   { ic: true, capV, indI } — начальные условия: конденсаторы держатся
 *   источниками напряжения, катушки — источниками тока.
 */
function solveInternal(model, ctx = null) {
  const net = model.buildNetlist();
  const warnings = [];

  if (net.gndNode === null) {
    return { ok: false, error: 'no-ground', messageKey: 'editor.err_no_ground' };
  }

  const active = model.components.filter(c => COMPONENT_TYPES[c.type]?.simulated);
  if (!active.length) {
    return { ok: false, error: 'empty', messageKey: 'editor.err_empty' };
  }
  if (model.components.some(c => COMPONENT_TYPES[c.type] && !COMPONENT_TYPES[c.type].simulated)) {
    warnings.push({ level: 'warn', key: 'editor.warn_unmodeled' });
  }

  /* ---------- нумерация узлов (GND исключён, он опорный) ---------- */
  const nodeOfPin = {};                       // 'REF.pin' → имя узла
  for (const comp of active) {
    const def = COMPONENT_TYPES[comp.type];
    const pins = getComponentPins(comp, def);
    for (const name of Object.keys(pins)) {
      nodeOfPin[comp.id + '.' + name] = net.pinNode[comp.id + '.' + name] || null;
    }
  }

  const nodeIndex = new Map();                // имя узла → индекс в матрице
  const nodeNames = [];
  for (const name of Object.values(nodeOfPin)) {
    if (!name || name === 'GND' || nodeIndex.has(name)) continue;
    nodeIndex.set(name, nodeNames.length);
    nodeNames.push(name);
  }
  const n = nodeNames.length;

  /** Индекс узла вывода: −1 означает GND (опорный, вне матрицы). */
  const idx = (comp, pin) => {
    const name = nodeOfPin[comp.id + '.' + pin];
    if (!name || name === 'GND') return -1;
    return nodeIndex.get(name) ?? -1;
  };

  /* ---------- дополнительные неизвестные (токи ветвей) ---------- */
  // Идеальные ветви с нулевым сопротивлением нельзя вносить проводимостью 1e6 —
  // это разрушает обусловленность матрицы. Вводим ток ветви как неизвестное.
  const vBranches = [];   // { comp, e (В), req (Ом, для катушки во времени), pins:[p,n] }
  for (const comp of active) {
    if (comp.type === 'vsource') {
      vBranches.push({ comp, e: numOr(comp.value, 9), pins: ['p', 'n'] });
    } else if (comp.type === 'inductor' && !ctx?.ic) {
      if (ctx) {
        // Схема замещения по Эйлеру назад: v = (L/h)·i − (L/h)·i(t−h)
        const req = indReq(comp, ctx.h);
        vBranches.push({ comp, e: -req * (ctx.indI.get(comp.id) || 0), req, pins: ['a', 'b'] });
      } else {
        vBranches.push({ comp, e: 0, pins: ['a', 'b'] });             // в статике — перемычка
      }
    } else if (comp.type === 'capacitor' && ctx?.ic) {
      // Начальные условия: заряд задан, значит конденсатор держит напряжение
      vBranches.push({ comp, e: ctx.capV.get(comp.id) || 0, pins: ['a', 'b'] });
    } else if (comp.type === 'switch' && isClosed(comp)) {
      vBranches.push({ comp, e: 0, pins: ['a', 'b'] });               // замкнутый ключ — перемычка
    }
  }
  // Выход операционного усилителя — идеальный источник напряжения относительно
  // общего провода, поэтому ему тоже нужно своё неизвестное «ток ветви».
  const opBranches = active.filter(c => c.type === 'opamp');

  // Контакты реле: ветвь выделяется КАЖДОМУ контакту, даже разомкнутому.
  // Состояние меняется между итерациями, а размер матрицы обязан быть постоянным.
  const contactBranches = active.filter(c => c.type === 'contactNO' || c.type === 'contactNC');

  const m = vBranches.length;
  const opOffset = n + m;
  const ctOffset = opOffset + opBranches.length;
  const size = ctOffset + contactBranches.length;

  if (size === 0) {
    return { ok: false, error: 'empty', messageKey: 'editor.err_empty' };
  }

  const NONLINEAR = ['diode', 'led', 'zener', 'npn', 'pnp', 'opamp', 'optocoupler',
                     'scr', 'triac', 'diac', 'contactNO', 'contactNC'];
  const nonlinear = active.filter(c => NONLINEAR.includes(c.type));

  // Тиристорные приборы защёлкиваются: сработав на какой-то итерации, они
  // остаются открытыми до конца расчёта. Без этого напряжение после отпирания
  // падает ниже порога, прибор «выключается», и итерация зацикливается.
  const latched = new Set();
  // Был ли открыт переход управляющего электрода на ПРЕДЫДУЩЕЙ итерации.
  // Пока он закрыт, на нём стоит напряжение разомкнутой цепи, и вычислять
  // по нему ток управления нельзя — иначе тиристор отпирается сам собой.
  let gatePrev = new Set();
  let gateNext = new Set();
  // Катушка по умолчанию — первая в схеме, чтобы простые схемы работали без настройки.
  const defaultCoil = active.find(c => c.type === 'relay' || c.type === 'contactor') || null;
  const coilOf = (comp) => {
    const ref = comp.props?.coil;
    const found = ref ? active.find(c => c.id === ref) : null;
    return found || defaultCoil;
  };
  /** Напряжение на катушке по текущему приближению. */
  const coilVoltage = (coil, xs) => {
    if (!coil) return 0;
    const a = idx(coil, 'a'), b = idx(coil, 'b');
    return (a >= 0 ? xs[a] : 0) - (b >= 0 ? xs[b] : 0);
  };
  /** Сработала ли катушка (напряжение достигло порога срабатывания). */
  const coilPicked = (coil, xs) => {
    if (!coil) return false;
    const upick = Math.abs(numOr(coil.props?.upick, coil.type === 'contactor' ? 180 : 9));
    return Math.abs(coilVoltage(coil, xs)) >= upick;
  };

  const G = Array.from({ length: size }, () => new Float64Array(size));
  const rhs = new Float64Array(size);
  let x = new Float64Array(size);
  let prevX = new Float64Array(size);
  let converged = !nonlinear.length;
  let lastStates = '';
  let alpha = 1;                               // коэффициент демпфирования

  for (let iter = 0; iter < MAX_ITER; iter++) {
    for (let i = 0; i < size; i++) { G[i].fill(0); rhs[i] = 0; }

    // Фоновая проводимость на землю — страховка от вырожденной матрицы.
    for (let i = 0; i < n; i++) G[i][i] += GMIN;

    const states = [];
    gateNext = new Set();

    for (const comp of active) {
      const def = COMPONENT_TYPES[comp.type];
      const a = idx(comp, def.pins[0]);
      const b = def.pins.length > 1 ? idx(comp, def.pins[1]) : -1;

      switch (comp.type) {
        case 'resistor':
        case 'lamp': {
          const R = Math.abs(numOr(comp.value, 1000)) || 1e-6;
          stampG(G, a, b, 1 / R);
          break;
        }
        case 'capacitor': {
          if (!ctx) { stampG(G, a, b, G_OPEN); break; }   // в статике — разрыв
          if (ctx.ic) break;                              // держится ветвью напряжения
          // Схема замещения по Эйлеру назад: i = (C/h)·(v − v(t−h))
          const geq = capGeq(comp, ctx.h);
          stampDiode(G, rhs, a, b, geq, ctx.capV.get(comp.id) || 0);
          break;
        }
        case 'inductor': {
          // Ветвью катушка описана везде, кроме режима начальных условий:
          // там ток задан, поэтому она ведёт себя источником тока.
          if (!ctx?.ic) break;
          const i0 = ctx.indI.get(comp.id) || 0;
          if (a >= 0) rhs[a] -= i0;
          if (b >= 0) rhs[b] += i0;
          stampG(G, a, b, G_OPEN);
          break;
        }
        case 'isource': {
          const J = numOr(comp.value, 0);       // ток течёт внутри источника p→n
          if (a >= 0) rhs[a] -= J;
          if (b >= 0) rhs[b] += J;
          break;
        }
        case 'switch':
          if (!isClosed(comp)) stampG(G, a, b, G_OPEN);
          break;                                // замкнутый — обработан как ветвь
        case 'diode': case 'led': case 'zener': {
          const va = a >= 0 ? x[a] : 0;
          const vk = b >= 0 ? x[b] : 0;
          const u = va - vk;
          const vf = Math.abs(numOr(comp.value, comp.type === 'led' ? 2 : 0.7));
          const vz = comp.type === 'zener' ? Math.abs(numOr(comp.props?.vz ?? comp.value, 5.1)) : Infinity;

          let g, ieq, state;
          if (u > vf) {
            // Открыт: эквивалент Vf последовательно с R_ON.
            // i = g·u − g·Vf  ⇒  в правую часть уходит +g·Vf со стороны анода.
            g = 1 / R_ON; ieq = g * vf; state = 'F';
          } else if (comp.type === 'zener' && -u > vz) {
            // Пробой: проводит в обратном направлении при |u| > Vz.
            g = 1 / R_ON; ieq = -g * vz; state = 'Z';
          } else {
            g = G_OPEN; ieq = 0; state = 'O';
          }
          states.push(state);
          stampG(G, a, b, g);
          if (a >= 0) rhs[a] += ieq;
          if (b >= 0) rhs[b] -= ieq;
          break;
        }
        case 'relay': case 'contactor': {
          // Катушка в статике — обычный резистор.
          const R = Math.abs(numOr(comp.value, 200)) || 1e-6;
          stampG(G, a, b, 1 / R);
          break;
        }
        case 'optocoupler': {
          const t = optoParams(comp);
          const na = idx(comp, 'a'), nk = idx(comp, 'k');
          const nc = idx(comp, 'c'), ne = idx(comp, 'e');
          const vled = (na >= 0 ? x[na] : 0) - (nk >= 0 ? x[nk] : 0);
          const vce  = (nc >= 0 ? x[nc] : 0) - (ne >= 0 ? x[ne] : 0);
          const ledOn = vled > t.vf;
          states.push(ledOn ? (vce < t.vsat ? 'S' : 'A') : 'C');

          // Входная сторона — обычный светодиод
          const g = 1 / R_ON;
          if (ledOn) stampDiode(G, rhs, na, nk, g, t.vf);
          else stampG(G, na, nk, G_OPEN);

          // Выход: источник тока Ik = CTR·Iсд, управляемый напряжением на светодиоде
          stampG(G, nc, ne, G_OPEN);
          if (ledOn) {
            const gm = t.ctr * g;
            stampCCCS(G, rhs, nc, ne, na, nk, gm, gm * t.vf);
          }
          // Ограничитель насыщения: не даёт Uкэ упасть ниже Uкэ.нас.
          // Это тот же диод, что в модели транзистора шунтирует избыток тока,
          // только здесь он включён «эмиттер → коллектор» с порогом −Uкэ.нас.
          if (vce < t.vsat) stampDiode(G, rhs, ne, nc, g, -t.vsat);
          break;
        }
        case 'scr': case 'triac': case 'diac': {
          const t = thyristorParams(comp);
          const na = idx(comp, t.pins[0]), nk = idx(comp, t.pins[1]);
          const va = na >= 0 ? x[na] : 0, vk = nk >= 0 ? x[nk] : 0;
          const u = va - vk;

          if (thyristorTriggered(comp, t, u, x, idx, gatePrev.has(comp.id))) latched.add(comp.id);
          const on = latched.has(comp.id);
          states.push(on ? 'T' : 't');

          // Открытый прибор — падение Vt по направлению тока; закрытый не проводит.
          const conducts = on && (t.bidir ? Math.abs(u) > t.vt : u > t.vt);
          if (conducts) {
            const sgn = t.bidir && u < 0 ? -1 : 1;
            stampDiode(G, rhs, na, nk, 1 / R_ON, sgn * t.vt);
          } else {
            stampG(G, na, nk, G_OPEN);
          }

          // Переход управляющий электрод — катод: обычный диод
          if (t.hasGate) {
            const ng = idx(comp, 'g');
            const vg = ng >= 0 ? x[ng] : 0;
            if (vg - vk > VGT_ON) {
              stampDiode(G, rhs, ng, nk, 1 / R_ON, VGT_ON);
              gateNext.add(comp.id);
            } else {
              stampG(G, ng, nk, G_OPEN);
            }
          }
          break;
        }
        case 'npn': case 'pnp': {
          const t = bjtParams(comp);
          const p = bjtNodes(comp, idx);
          const vb = p.nb >= 0 ? x[p.nb] : 0;
          const vc = p.nc >= 0 ? x[p.nc] : 0;
          const ve = p.ne >= 0 ? x[p.ne] : 0;
          // Для p-n-p все напряжения зеркальны — дальше работаем с приведёнными.
          const vbe = t.s * (vb - ve);
          const vbc = t.s * (vb - vc);
          const beOn = vbe > t.vf, bcOn = vbc > t.vfc;
          states.push(!beOn ? 'C' : (bcOn ? 'S' : 'A'));

          const g = 1 / R_ON;
          // Оба перехода — обычные кусочно-линейные диоды.
          if (beOn) stampDiode(G, rhs, p.bePos, p.beNeg, g, t.vf);
          else stampG(G, p.nb, p.ne, G_OPEN);
          if (bcOn) stampDiode(G, rhs, p.bcPos, p.bcNeg, g, t.vfc);
          else stampG(G, p.nb, p.nc, G_OPEN);

          // Ik = βF·Iбэ − (1 + βR)·Iбк. Первое слагаемое — усиление, второе
          // само придавливает Uкэ при заходе в насыщение, поэтому области
          // перетекают одна в другую непрерывно и итерация сходится.
          if (beOn) {
            stampCCCS(G, rhs, p.ccOut, p.ccIn, p.bePos, p.beNeg, t.beta * g, t.beta * g * t.vf);
          }
          if (bcOn) {
            // Источник несёт βR·Iбк: ещё Iбк приходит в коллектор через сам
            // диод база-коллектор, вместе это и даёт Ik = βF·Iбэ − (1+βR)·Iбк.
            const gr = BETA_R * g;
            stampCCCS(G, rhs, p.ccIn, p.ccOut, p.bcPos, p.bcNeg, gr, gr * t.vfc);
          }
          break;
        }
      }
    }

    // Ветви с заданным напряжением: Va − Vb = E, неизвестное — ток ветви a→b.
    vBranches.forEach((br, j) => {
      const k = n + j;
      const a = idx(br.comp, br.pins[0]);
      const b = idx(br.comp, br.pins[1]);
      if (a >= 0) { G[a][k] += 1; G[k][a] += 1; }
      if (b >= 0) { G[b][k] -= 1; G[k][b] -= 1; }
      // Для катушки во времени ветвь не идеальная: Va − Vb − Req·i = −Req·i(t−h)
      if (br.req) G[k][k] -= br.req;
      rhs[k] = br.e;
    });

    // Контакты реле: замкнутый — идеальная перемычка, разомкнутый — «ток = 0».
    contactBranches.forEach((comp, j) => {
      const k = ctOffset + j;
      const a = idx(comp, 'a'), b = idx(comp, 'b');
      const picked = coilPicked(coilOf(comp), x);
      const closed = comp.type === 'contactNO' ? picked : !picked;
      states.push(closed ? 'K' : 'k');

      if (closed) {
        if (a >= 0) { G[a][k] += 1; G[k][a] += 1; }
        if (b >= 0) { G[b][k] -= 1; G[k][b] -= 1; }
        rhs[k] = 0;
      } else {
        G[k][k] = 1;                      // уравнение i = 0: ветвь отключена
        rhs[k] = 0;
        stampG(G, a, b, G_OPEN);
      }
    });

    // Операционный усилитель: выход относительно общего провода.
    opBranches.forEach((comp, j) => {
      const k = opOffset + j;
      const o = idx(comp, 'out'), np = idx(comp, 'non'), ni = idx(comp, 'inv');
      const t = opampParams(comp);
      const vd = (np >= 0 ? x[np] : 0) - (ni >= 0 ? x[ni] : 0);
      const state = opampState(vd, t);
      states.push(state);

      if (o >= 0) G[o][k] += 1;                 // ток ветви вытекает из выхода
      if (o >= 0) G[k][o] += 1;

      if (state === 'lin') {
        // Uвых = A·(Uнеинв − Uинв)
        if (np >= 0) G[k][np] -= t.gain;
        if (ni >= 0) G[k][ni] += t.gain;
        rhs[k] = 0;
      } else {
        // Насыщение: выход прижат к шине питания
        rhs[k] = state === 'hi' ? t.vcc : t.vee;
      }
    });

    const sol = gaussSolve(G, rhs, size);
    if (!sol) {
      return { ok: false, error: 'singular', messageKey: 'editor.err_singular' };
    }
    gatePrev = gateNext;

    if (!nonlinear.length) { x = sol; converged = true; break; }

    // Состояния переходов (открыт / пробой / закрыт) на этой итерации.
    const stateKey = states.join('');
    const stateStable = (iter > 0 && stateKey === lastStates);
    // Если состояния продолжают перещёлкиваться — цепь «звенит» между решениями.
    // Гасим шаг, чтобы вывести итерацию из цикла; обратно alpha не поднимаем.
    if (iter > 2 && !stateStable) alpha = Math.max(0.3, alpha * 0.7);
    lastStates = stateKey;

    prevX = x;
    const next = new Float64Array(size);
    let maxDelta = 0;
    for (let i = 0; i < size; i++) {
      next[i] = prevX[i] + alpha * (sol[i] - prevX[i]);
      if (i < n) maxDelta = Math.max(maxDelta, Math.abs(next[i] - prevX[i]));
    }
    x = next;

    // Решение принято, только когда устоялись и состояния, и напряжения.
    if (stateStable && maxDelta < TOL) { converged = true; break; }
  }

  if (!converged) warnings.push({ level: 'warn', key: 'editor.warn_no_convergence' });

  /* ---------- узловые напряжения ---------- */
  const nodeVoltages = { GND: 0 };
  for (let i = 0; i < n; i++) nodeVoltages[nodeNames[i]] = clean(x[i]);

  /* ---------- токи ветвей, мощности, токи выводов ---------- */
  const branchIndex = new Map();
  vBranches.forEach((br, j) => branchIndex.set(br.comp.id, n + j));

  const branches = {};
  const pinCurrents = {};                      // 'REF.pin' → ток, ВТЕКАЮЩИЙ в элемент

  for (const comp of active) {
    if (comp.type === 'ground') continue;

    // Операционный усилитель: выход — источник, входы тока не потребляют.
    if (comp.type === 'opamp') {
      const t = opampParams(comp);
      const o = idx(comp, 'out'), np = idx(comp, 'non'), ni = idx(comp, 'inv');
      const vout = o >= 0 ? x[o] : 0;
      const vd = (np >= 0 ? x[np] : 0) - (ni >= 0 ? x[ni] : 0);
      const k = opOffset + opBranches.indexOf(comp);
      // Неизвестное — ток из выхода в общий провод; в нагрузку ОУ отдаёт минус это.
      const iout = -(x[k] || 0);
      const state = opampState(vd, t);

      branches[comp.id] = {
        type: 'opamp',
        u: clean(vout), i: clean(iout), p: clean(vout * iout),
        vd: clean(vd),
        region: state === 'lin' ? 'linear' : (state === 'hi' ? 'sat_hi' : 'sat_lo'),
      };
      pinCurrents[comp.id + '.out'] = clean(-iout);
      pinCurrents[comp.id + '.inv'] = 0;
      pinCurrents[comp.id + '.non'] = 0;
      continue;
    }

    // Оптопара: две гальванически развязанные стороны.
    if (comp.type === 'optocoupler') {
      const t = optoParams(comp);
      const na = idx(comp, 'a'), nk = idx(comp, 'k');
      const nc = idx(comp, 'c'), ne = idx(comp, 'e');
      const vled = (na >= 0 ? x[na] : 0) - (nk >= 0 ? x[nk] : 0);
      const vce  = (nc >= 0 ? x[nc] : 0) - (ne >= 0 ? x[ne] : 0);
      const ledOn = vled > t.vf;

      const iled = ledOn ? (vled - t.vf) / R_ON : vled * G_OPEN;
      const iSrc = ledOn ? t.ctr * iled : 0;
      // Ток ограничителя вычитается: в насыщении он забирает избыток.
      const iClamp = vce < t.vsat ? ((-vce) - (-t.vsat)) / R_ON : 0;
      const ic = iSrc - iClamp + vce * G_OPEN;
      const region = !ledOn ? 'cutoff' : (vce < t.vsat ? 'sat' : 'active');

      branches[comp.id] = {
        type: 'optocoupler',
        u: clean(vce), i: clean(ic), p: clean(vled * iled + vce * ic),
        iled: clean(iled), region,
        dir: ic >= 0 ? 'c->e' : 'e->c',
      };
      pinCurrents[comp.id + '.a'] = clean(iled);
      pinCurrents[comp.id + '.k'] = clean(-iled);
      pinCurrents[comp.id + '.c'] = clean(ic);
      pinCurrents[comp.id + '.e'] = clean(-ic);
      continue;
    }

    // Тиристорные приборы: состояние определилось в ходе итераций.
    if (comp.type === 'scr' || comp.type === 'triac' || comp.type === 'diac') {
      const t = thyristorParams(comp);
      const na = idx(comp, t.pins[0]), nk = idx(comp, t.pins[1]);
      const va = na >= 0 ? x[na] : 0, vk = nk >= 0 ? x[nk] : 0;
      const u = va - vk;
      const on = latched.has(comp.id);
      const conducts = on && (t.bidir ? Math.abs(u) > t.vt : u > t.vt);
      const sgn = t.bidir && u < 0 ? -1 : 1;
      const i = conducts ? (u - sgn * t.vt) / R_ON : u * G_OPEN;

      branches[comp.id] = {
        type: comp.type,
        u: clean(u), i: clean(i), p: clean(u * i),
        region: conducts ? 'thy_on' : 'thy_off',
        dir: i >= 0 ? 'a->k' : 'k->a',
      };
      pinCurrents[comp.id + '.' + t.pins[0]] = clean(i);
      pinCurrents[comp.id + '.' + t.pins[1]] = clean(-i);
      if (t.hasGate) {
        const ng = idx(comp, 'g');
        const vg = ng >= 0 ? x[ng] : 0;
        const ig = vg - vk > VGT_ON ? (vg - vk - VGT_ON) / R_ON : 0;
        branches[comp.id].ig = clean(ig);
        pinCurrents[comp.id + '.g'] = clean(ig);
      }
      continue;
    }

    // Контакт реле: замкнутый несёт ток ветви, разомкнутый — ноль.
    if (comp.type === 'contactNO' || comp.type === 'contactNC') {
      const a = idx(comp, 'a'), b = idx(comp, 'b');
      const va = a >= 0 ? x[a] : 0, vb = b >= 0 ? x[b] : 0;
      const picked = coilPicked(coilOf(comp), x);
      const closed = comp.type === 'contactNO' ? picked : !picked;
      const i = closed ? (x[ctOffset + contactBranches.indexOf(comp)] || 0) : 0;
      const u = va - vb;
      branches[comp.id] = {
        type: comp.type,
        u: clean(closed ? 0 : u), i: clean(i), p: 0,
        region: closed ? 'ct_closed' : 'ct_open',
        dir: i >= 0 ? 'a->b' : 'b->a',
      };
      pinCurrents[comp.id + '.a'] = clean(i);
      pinCurrents[comp.id + '.b'] = clean(-i);
      continue;
    }

    // Катушка реле или контактора: резистор плюс признак срабатывания.
    if (comp.type === 'relay' || comp.type === 'contactor') {
      const a = idx(comp, 'a'), b = idx(comp, 'b');
      const u = (a >= 0 ? x[a] : 0) - (b >= 0 ? x[b] : 0);
      const R = Math.abs(numOr(comp.value, 200)) || 1e-6;
      const i = u / R;
      branches[comp.id] = {
        type: comp.type,
        u: clean(u), i: clean(i), p: clean(u * i),
        region: coilPicked(comp, x) ? 'coil_on' : 'coil_off',
        dir: i >= 0 ? 'a->b' : 'b->a',
      };
      pinCurrents[comp.id + '.a'] = clean(i);
      pinCurrents[comp.id + '.b'] = clean(-i);
      continue;
    }

    // Транзистор трёхвыводной — общая двухполюсная схема расчёта к нему неприменима.
    if (comp.type === 'npn' || comp.type === 'pnp') {
      const t = bjtParams(comp);
      const q = bjtNodes(comp, idx);
      const vb = q.nb >= 0 ? x[q.nb] : 0;
      const vc = q.nc >= 0 ? x[q.nc] : 0;
      const ve = q.ne >= 0 ? x[q.ne] : 0;
      const vbe = t.s * (vb - ve);
      const vbc = t.s * (vb - vc);
      const vce = t.s * (vc - ve);

      const beOn = vbe > t.vf, bcOn = vbc > t.vfc;
      const ibe = beOn ? (vbe - t.vf) / R_ON : vbe * G_OPEN;
      const ibc = bcOn ? (vbc - t.vfc) / R_ON : vbc * G_OPEN;
      const region = !beOn ? 'cutoff' : (bcOn ? 'sat' : 'active');

      const ib = ibe + ibc;
      const ic = t.beta * ibe - (1 + BETA_R) * ibc;
      const ie = ib + ic;
      const p = vbe * ib + vce * ic;

      branches[comp.id] = {
        type: comp.type,
        u: clean(vce), i: clean(ic), p: clean(p),
        ib: clean(ib), ie: clean(ie), vbe: clean(vbe),
        region,
        dir: ic >= 0 ? 'c->e' : 'e->c',
      };
      // Ток, ВТЕКАЮЩИЙ в элемент; знак s разворачивает картину для p-n-p.
      pinCurrents[comp.id + '.b'] = clean(t.s * ib);
      pinCurrents[comp.id + '.c'] = clean(t.s * ic);
      pinCurrents[comp.id + '.e'] = clean(-t.s * ie);

      if (Math.abs(p) > P_WARN) {
        warnings.push({ level: 'warn', key: 'editor.warn_power', ref: comp.id, p: clean(Math.abs(p)) });
      }
      continue;
    }

    const def = COMPONENT_TYPES[comp.type];
    const a = idx(comp, def.pins[0]);
    const b = def.pins.length > 1 ? idx(comp, def.pins[1]) : -1;
    const va = a >= 0 ? x[a] : 0;
    const vb = b >= 0 ? x[b] : 0;
    const u = va - vb;
    let i = 0;

    switch (comp.type) {
      case 'resistor': case 'lamp':
        i = u / (Math.abs(numOr(comp.value, 1000)) || 1e-6);
        break;
      case 'capacitor':
        // В статике тока нет; во времени i = (C/h)·(v − v(t−h))
        i = (ctx && !ctx.ic)
          ? capGeq(comp, ctx.h) * (u - (ctx.capV.get(comp.id) || 0))
          : (ctx?.ic ? (x[branchIndex.get(comp.id)] || 0) : 0);
        break;
      case 'isource':
        i = numOr(comp.value, 0);
        break;
      case 'inductor':
        // В режиме начальных условий катушка описана источником тока, ветви нет
        i = ctx?.ic ? (ctx.indI.get(comp.id) || 0) : (x[branchIndex.get(comp.id)] || 0);
        break;
      case 'vsource':
        i = x[branchIndex.get(comp.id)] || 0;   // ток ветви — прямое решение системы
        break;
      case 'switch':
        i = isClosed(comp) ? (x[branchIndex.get(comp.id)] || 0) : u * G_OPEN;
        break;
      case 'diode': case 'led': case 'zener': {
        const vf = Math.abs(numOr(comp.value, comp.type === 'led' ? 2 : 0.7));
        const vz = comp.type === 'zener' ? Math.abs(numOr(comp.props?.vz ?? comp.value, 5.1)) : Infinity;
        if (u > vf) i = (u - vf) / R_ON;
        else if (comp.type === 'zener' && -u > vz) i = (u + vz) / R_ON;
        else i = u * G_OPEN;
        break;
      }
    }

    const p = u * i;
    branches[comp.id] = {
      type: comp.type,
      u: clean(u),
      i: clean(i),
      p: clean(p),
      dir: i >= 0 ? 'a->b' : 'b->a',
    };
    if (def.pins.length > 1) {
      pinCurrents[comp.id + '.' + def.pins[0]] = clean(i);
      pinCurrents[comp.id + '.' + def.pins[1]] = clean(-i);
    }

    if (Math.abs(p) > P_WARN && (comp.type === 'resistor' || comp.type === 'lamp')) {
      warnings.push({ level: 'warn', key: 'editor.warn_power', ref: comp.id, p: clean(Math.abs(p)) });
    }
  }

  /* ---------- токи проводов (для анимации направления) ---------- */
  const wireCurrents = computeWireCurrents(model, pinCurrents);

  // Состояние реактивных элементов для следующего шага по времени
  const state = { caps: new Map(), inds: new Map() };
  for (const comp of active) {
    if (comp.type === 'capacitor') {
      const a = idx(comp, 'a'), b = idx(comp, 'b');
      state.caps.set(comp.id, (a >= 0 ? x[a] : 0) - (b >= 0 ? x[b] : 0));
    } else if (comp.type === 'inductor') {
      const k = branchIndex.get(comp.id);
      state.inds.set(comp.id, k === undefined
        ? (ctx?.indI.get(comp.id) || 0)          // в режиме начальных условий ток задан
        : (x[k] || 0));
    }
  }

  return { ok: true, nodeVoltages, branches, pinCurrents, wireCurrents, warnings, state, nodeCoords: net.nodeCoords };
}

/**
 * Ток в каждом проводе: провод получает ток того вывода, который лежит на его конце.
 * dir = +1 — ток течёт по points от начала к концу, −1 — навстречу.
 */
function computeWireCurrents(model, pinCurrents) {
  // Координата вывода → 'REF.pin'
  const pinAt = new Map();
  for (const comp of model.components) {
    const def = COMPONENT_TYPES[comp.type];
    if (!def) continue;
    const pins = getComponentPins(comp, def);
    for (const [name, c] of Object.entries(pins)) {
      pinAt.set(c[0] + ',' + c[1], comp.id + '.' + name);
    }
  }

  const out = {};
  for (const wire of model.wires) {
    const first = wire.points[0];
    const last = wire.points[wire.points.length - 1];
    let i = 0, dir = 0;

    const k0 = pinAt.get(first[0] + ',' + first[1]);
    const k1 = pinAt.get(last[0] + ',' + last[1]);
    // Ток, ВЫТЕКАЮЩИЙ из элемента в провод, равен минусу втекающего в элемент.
    if (k0 !== undefined && pinCurrents[k0] !== undefined) {
      i = -pinCurrents[k0]; dir = i >= 0 ? 1 : -1;
    } else if (k1 !== undefined && pinCurrents[k1] !== undefined) {
      i = -pinCurrents[k1]; dir = i >= 0 ? -1 : 1;
    }
    out[wire.id] = { i: clean(Math.abs(i) < 1e-12 ? 0 : i), dir: Math.abs(i) < 1e-12 ? 0 : dir };
  }
  return out;
}

/* ===================== БИПОЛЯРНЫЙ ТРАНЗИСТОР ===================== */

/**
 * Параметры транзистора. s = +1 для n-p-n и −1 для p-n-p: умножение на s
 * приводит напряжения p-n-p к той же системе отсчёта, что и у n-p-n,
 * поэтому вся логика пишется один раз.
 *
 * vfc — порог перехода база-коллектор. Он намеренно ниже порога база-эмиттер
 * ровно на Uкэ.нас: в глубоком насыщении Uкэ = Uбэ − Uбк ≈ vf − vfc, то есть
 * заданное пользователем напряжение насыщения получается само собой.
 */
function bjtParams(comp) {
  const npn = comp.type === 'npn';
  const vf   = Math.abs(numOr(comp.props?.vbe,  VBE_ON));
  const vsat = Math.abs(numOr(comp.props?.vsat, VCE_SAT));
  return {
    npn, s: npn ? 1 : -1,
    beta: Math.max(1, Math.abs(numOr(comp.value, 100))),
    vf, vsat,
    vfc: Math.max(0.05, vf - vsat),
  };
}

/**
 * Узлы транзистора и полюса его переходов с учётом полярности.
 * Для n-p-n переходы «база → эмиттер» и «база → коллектор», ток коллектора
 * течёт из C в E; для p-n-p всё зеркально.
 */
function bjtNodes(comp, idx) {
  const npn = comp.type === 'npn';
  const nb = idx(comp, 'b'), nc = idx(comp, 'c'), ne = idx(comp, 'e');
  return {
    nb, nc, ne,
    bePos: npn ? nb : ne, beNeg: npn ? ne : nb,
    bcPos: npn ? nb : nc, bcNeg: npn ? nc : nb,
    ccOut: npn ? nc : ne, ccIn: npn ? ne : nc,
  };
}

/** Открытый p-n переход: Vf последовательно с проводимостью g. */
function stampDiode(G, rhs, pos, neg, g, vf) {
  stampG(G, pos, neg, g);
  if (pos >= 0) rhs[pos] += g * vf;
  if (neg >= 0) rhs[neg] -= g * vf;
}

/* ===================== ПЕРЕХОДНЫЙ ПРОЦЕСС ===================== */

/** Проводимость схемы замещения конденсатора на шаге h. */
function capGeq(comp, h) {
  const C = Math.abs(numOr(comp.value, 1e-6)) || 1e-15;
  return C / h;
}

/** Сопротивление схемы замещения катушки на шаге h. */
function indReq(comp, h) {
  const L = Math.abs(numOr(comp.value, 1e-3)) || 1e-15;
  return L / h;
}

/**
 * Расчёт переходного процесса неявным методом Эйлера.
 *
 * Реактивные элементы заменяются сопутствующими схемами: конденсатор —
 * проводимость C/h с источником тока по напряжению предыдущего шага, катушка —
 * сопротивление L/h с источником напряжения по её предыдущему току. Метод
 * неявный, поэтому устойчив при любом шаге: слишком крупный шаг огрубит фронт,
 * но не даст разболтки, как явные схемы.
 *
 * @param {object} model
 * @param {{tStop:number, tStep:number, maxPoints?:number}} opts
 * @returns {{ok:boolean, t?:number[], nodes?:Object, branches?:Object, ...}}
 */
export function solveTransient(model, opts = {}) {
  try {
    const tStop = Math.abs(numOr(opts.tStop, 0.01)) || 0.01;
    let h = Math.abs(numOr(opts.tStep, tStop / 200)) || tStop / 200;
    const maxPoints = Math.max(10, Math.min(20000, numOr(opts.maxPoints, 2000)));
    if (tStop / h > maxPoints) h = tStop / maxPoints;   // не даём раздуть расчёт

    const reactive = model.components.filter(c => c.type === 'capacitor' || c.type === 'inductor');
    if (!reactive.length) {
      return { ok: false, error: 'no-reactive', messageKey: 'editor.err_no_reactive' };
    }

    // Начальные условия: по умолчанию конденсаторы разряжены, катушки обесточены
    const capV = new Map(), indI = new Map();
    for (const c of reactive) {
      if (c.type === 'capacitor') capV.set(c.id, numOr(c.props?.v0, 0));
      else indI.set(c.id, numOr(c.props?.i0, 0));
    }

    const t = [], nodes = {}, branches = {};
    const push = (time, res) => {
      t.push(time);
      for (const [name, v] of Object.entries(res.nodeVoltages)) {
        (nodes[name] ||= []).push(v);
      }
      for (const [id, br] of Object.entries(res.branches)) {
        const dst = (branches[id] ||= { u: [], i: [] });
        dst.u.push(br.u); dst.i.push(br.i);
      }
    };

    // Точка t = 0 считается с зафиксированными начальными условиями
    const first = solveInternal(model, { ic: true, capV, indI });
    if (!first.ok) return first;
    push(0, first);

    let warnings = first.warnings || [];
    let last = first;
    const steps = Math.max(1, Math.round(tStop / h));
    for (let k = 1; k <= steps; k++) {
      const res = solveInternal(model, { h, capV, indI });
      if (!res.ok) return res;
      push(k * h, res);
      for (const [id, v] of res.state.caps) capV.set(id, v);
      for (const [id, i] of res.state.inds) indI.set(id, i);
      last = res;
    }
    if (last.warnings?.length) warnings = last.warnings;

    return { ok: true, t, nodes, branches, tStep: h, tStop: steps * h, warnings };
  } catch (err) {
    return { ok: false, error: 'exception', messageKey: 'editor.err_internal', detail: err.message };
  }
}

/* ===================== ОПТОПАРА ===================== */

/** Параметры оптопары: коэффициент передачи тока и пороги обеих сторон. */
function optoParams(comp) {
  return {
    ctr:  Math.max(0, numOr(comp.value, 0.5)),      // коэффициент передачи тока
    vf:   Math.abs(numOr(comp.props?.vf, 1.2)),     // отпирание светодиода
    vsat: Math.abs(numOr(comp.props?.vsat, 0.2)),   // насыщение фототранзистора
  };
}

/* ===================== ТИРИСТОРНОЕ СЕМЕЙСТВО ===================== */

/** Параметры и «форма» прибора: двунаправленный ли, есть ли управляющий электрод. */
function thyristorParams(comp) {
  const bidir = comp.type !== 'scr';
  const pins = bidir ? ['a1', 'a2'] : ['a', 'k'];
  if (comp.type === 'diac') {
    return { bidir, pins, hasGate: false,
      vt: Math.abs(numOr(comp.props?.vt, 1.5)),
      vbo: Math.abs(numOr(comp.value, 32)),
      igt: Infinity };
  }
  return { bidir, pins, hasGate: true,
    vt: Math.abs(numOr(comp.value, comp.type === 'triac' ? 1.2 : 1.0)),
    vbo: comp.type === 'triac' ? Math.abs(numOr(comp.props?.vbo, 400)) : Infinity,
    igt: Math.abs(numOr(comp.props?.igt, 0.005)) };
}

/**
 * Условие отпирания: принудительно свойством, током управляющего электрода
 * либо превышением напряжения включения.
 *
 * Запирание здесь не рассматривается: реальный прибор закрывается, когда ток
 * падает ниже тока удержания, а это событие во времени — нужен анализ
 * переходного процесса. В статике прибор, однажды открывшись, остаётся открыт.
 */
function thyristorTriggered(comp, t, u, x, idx, gateWasOn) {
  if (Number(comp.props?.on)) return true;
  if (Math.abs(u) >= t.vbo) return true;
  // Ток управления имеет смысл только если переход УЭ уже был открыт при
  // построении текущего приближения; иначе на нём стоит напряжение
  // разомкнутой цепи и формула дала бы фиктивные амперы.
  if (!t.hasGate || !gateWasOn) return false;
  const ng = idx(comp, 'g'), nk = idx(comp, t.pins[1]);
  const vg = ng >= 0 ? x[ng] : 0, vk = nk >= 0 ? x[nk] : 0;
  const ig = vg - vk > VGT_ON ? (vg - vk - VGT_ON) / R_ON : 0;
  return ig >= t.igt;
}

/* ===================== ОПЕРАЦИОННЫЙ УСИЛИТЕЛЬ ===================== */

/**
 * Параметры ОУ. Шины питания заданы свойствами, а не выводами: так модель
 * работает и при однополярном питании (например 0…5 В), не требуя рисовать
 * питание на схеме.
 */
function opampParams(comp) {
  const vcc = numOr(comp.props?.vcc, 15);
  const vee = numOr(comp.props?.vee, -15);
  return {
    gain: Math.max(1, Math.abs(numOr(comp.value, 1e5))),
    vcc: Math.max(vcc, vee),
    vee: Math.min(vcc, vee),
  };
}

/** Линейный режим или упор в шину: 'lin' | 'hi' | 'lo'. */
function opampState(vd, t) {
  const ideal = t.gain * vd;
  if (ideal >= t.vcc) return 'hi';
  if (ideal <= t.vee) return 'lo';
  return 'lin';
}

/* ===================== ЛИНЕЙНАЯ АЛГЕБРА ===================== */

/** Проводимость g между узлами a и b (индекс −1 = земля). */
function stampG(G, a, b, g) {
  if (a >= 0) G[a][a] += g;
  if (b >= 0) G[b][b] += g;
  if (a >= 0 && b >= 0) { G[a][b] -= g; G[b][a] -= g; }
}

/**
 * Источник тока, управляемый напряжением: ток gm·(V[cp] − V[cn]) − ieq
 * вытекает из узла outN и втекает в inN. Матрица становится несимметричной —
 * метод Гаусса с выбором ведущего элемента это выдерживает.
 */
function stampCCCS(G, rhs, outN, inN, cp, cn, gm, ieq) {
  if (outN >= 0) {
    if (cp >= 0) G[outN][cp] += gm;
    if (cn >= 0) G[outN][cn] -= gm;
    rhs[outN] += ieq;
  }
  if (inN >= 0) {
    if (cp >= 0) G[inN][cp] -= gm;
    if (cn >= 0) G[inN][cn] += gm;
    rhs[inN] -= ieq;
  }
}

/**
 * Решение G·x = rhs методом Гаусса с частичным выбором ведущего элемента.
 * @returns {Float64Array|null} null — матрица вырождена
 */
function gaussSolve(G, rhs, n) {
  const a = Array.from({ length: n }, (_, i) => {
    const row = new Float64Array(n + 1);
    row.set(G[i], 0);
    row[n] = rhs[i];
    return row;
  });

  for (let col = 0; col < n; col++) {
    let maxRow = col, maxVal = Math.abs(a[col][col]);
    for (let r = col + 1; r < n; r++) {
      const v = Math.abs(a[r][col]);
      if (v > maxVal) { maxVal = v; maxRow = r; }
    }
    if (maxVal < 1e-14) return null;
    if (maxRow !== col) { const t = a[col]; a[col] = a[maxRow]; a[maxRow] = t; }

    const pivot = a[col][col];
    for (let r = col + 1; r < n; r++) {
      const f = a[r][col] / pivot;
      if (f === 0) continue;
      for (let j = col; j <= n; j++) a[r][j] -= f * a[col][j];
    }
  }

  const x = new Float64Array(n);
  for (let i = n - 1; i >= 0; i--) {
    let s = a[i][n];
    for (let j = i + 1; j < n; j++) s -= a[i][j] * x[j];
    x[i] = s / a[i][i];
    if (!isFinite(x[i])) return null;
  }
  return x;
}

/* ===================== МЕЛОЧИ ===================== */
function numOr(v, fallback) { const n = Number(v); return Number.isFinite(n) ? n : fallback; }
function isClosed(comp) { return Number(comp.value) !== 0; }
/** Гасит шум решателя, чтобы 1e-18 не показывалось как «1 аА». */
function clean(v) {
  if (!isFinite(v)) return 0;
  if (Math.abs(v) < 1e-12) return 0;
  return Math.round(v * 1e9) / 1e9;
}
