/**
 * schematic-editor.js — интерактивный редактор принципиальных схем.
 *
 * Графическое ядро — gost-schematic.js (УГО по ЕСКД). Редактор пересобирает
 * SVG из модели при каждом изменении: схемы небольшие, это дешевле, чем
 * поддерживать инкрементальные патчи DOM.
 *
 * Три режима: «Редактирование» (правка модели), «Эмуляция» (solveDC, токи,
 * U/I/P и пробники напряжения) и «Переходный процесс» (solveTransient с
 * графиками). В обоих расчётных режимах канва работает только на чтение.
 */
'use strict';
import { $, T, toast, lang } from './core.js';
import {
  SchematicModel, COMPONENT_TYPES, PIN_OFFSETS, getComponentPins,
  formatSI, unitSymbol, setLocale, GROUND_LEAD, junctionPoints,
} from './schematic-model.js';
import { solveDC, solveTransient, emissionLevel, emissionColor } from './circuit-sim.js';
import { PRESETS, loadPreset } from './schematic-presets.js';
import { niceScale } from './chart.js';

/* ===================== КОНСТАНТЫ ===================== */
const GRID = 5;                 // шаг сетки, мм
const PIN_SNAP = 3.5;           // радиус прилипания провода к выводу, мм
const HIT_RADIUS = 11;          // радиус попадания по компоненту, мм
const WIRE_HIT = 3;             // допуск попадания по проводу, мм
const UNDO_LIMIT = 60;
const STORAGE_KEY = 'engicalc-editor';
const MIN_DASH_PERIOD = 0.35;   // с — самая быстрая анимация тока
const MAX_DASH_PERIOD = 3.0;    // с — самая медленная
const PAD = 10;                 // поля вокруг рабочего поля, мм
const PX_PER_MM = 3.8;          // экранный масштаб чертежа

/* ===================== СОСТОЯНИЕ ===================== */
let model = new SchematicModel();
let selection = null;           // { kind: 'comp'|'wire', id }
let tool = null;                // тип компонента для установки, либо 'wire'
let mode = 'edit';              // 'edit' | 'sim' | 'transient'
let simResult = null;
let trResult = null;            // результат расчёта переходного процесса
let trSelected = new Set();     // выбранные для графика сигналы
let probes = new Set();         // имена узлов с закреплённым пробником

let drag = null;                // перетаскивание компонента
let pending = null;             // начатый провод: { x, y, px, py }

let undoStack = [];
let redoStack = [];

let canvasEl = null;            // постоянный контейнер-хост
let rafId = 0;
let saveTimer = 0;
let lastBoxW = 0;              // ширина канвы на момент последней отрисовки

/* ===================== ИНИЦИАЛИЗАЦИЯ ===================== */
export function initEditor() {
  canvasEl = $('#editor-canvas');
  if (!canvasEl) return;

  setLocale(lang);
  buildPresetList();
  buildPalette();
  bindToolbar();
  bindCanvas();
  document.addEventListener('keydown', onKey);

  // Страница скрыта при старте — перерисовываем, когда её показывают,
  // иначе SVG строится при нулевых размерах контейнера.
  const page = $('#page-editor');
  if (page) {
    new MutationObserver(() => { if (page.classList.contains('active')) render(); })
      .observe(page, { attributes: true, attributeFilter: ['class'] });
  }

  // Ширина поля считается от ширины канвы, поэтому её изменение требует
  // перерисовки. Порог в 3 px гасит дребезг от округлений и от появления
  // полосы прокрутки страницы. Высоту не отслеживаем: её задаёт сам чертёж,
  // и реакция на неё замкнула бы наблюдатель сам на себя.
  const onResize = () => {
    if (!page?.classList.contains('active')) return;
    if (Math.abs(canvasEl.clientWidth - lastBoxW) < 3) return;
    render();
  };
  if (typeof ResizeObserver === 'function') new ResizeObserver(onResize).observe(canvasEl);
  else window.addEventListener('resize', onResize);

  restore();
  render();
  updateProperties();
}

/**
 * Перерисовать схему после смены темы. Цвет линий УГО библиотека зашивает
 * в SVG в момент построения, поэтому одной сменой CSS-токенов чертёж
 * не обновляется — его надо собрать заново.
 */
export function refreshEditorTheme() {
  render();
}

/** Перечитать подписи после смены языка приложения. */
export function refreshEditorLang() {
  setLocale(lang);
  buildPresetList();
  buildPalette();
  updateProperties();
  updateModeButton();
  if (mode === 'sim') renderSimReport();
  if (mode === 'transient') renderTransient();
  render();
}

function restore() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;
  try {
    model = SchematicModel.fromJSON(saved);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/* ===================== ПАЛИТРА И ПРЕСЕТЫ ===================== */
const PALETTE = [
  'resistor', 'capacitor', 'inductor', 'vsource', 'isource',
  'diode', 'led', 'zener', 'switch', 'lamp', 'ground',
  'npn', 'pnp', 'opamp',
  'optocoupler', 'scr', 'triac', 'diac',
  'relay', 'contactor', 'contactNO', 'contactNC',
];

function buildPalette() {
  const host = $('#editor-palette');
  if (!host) return;
  host.innerHTML = '';
  for (const type of PALETTE) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'palette-item';
    el.dataset.type = type;
    el.textContent = T('editor.c_' + type);
    el.addEventListener('click', () => selectTool(type));
    host.appendChild(el);
  }
  syncPaletteState();
}

function buildPresetList() {
  const sel = $('#editor-preset');
  if (!sel) return;
  const prev = sel.value;
  sel.innerHTML = '<option value="">' + T('editor.preset_placeholder') + '</option>';
  for (const p of PRESETS) {
    const o = document.createElement('option');
    o.value = p.id;
    o.textContent = T(p.nameKey);
    sel.appendChild(o);
  }
  sel.value = prev;
}

function selectTool(type) {
  // Канва только для чтения в ОБОИХ расчётных режимах, не только в 'sim':
  // раньше в режиме переходного процесса можно было ставить компоненты, и
  // каждая правка запускала полный пересчёт на тысячи шагов.
  if (mode !== 'edit') return;
  tool = (tool === type) ? null : type;
  pending = null;
  syncPaletteState();
}

function syncPaletteState() {
  document.querySelectorAll('#editor-palette .palette-item').forEach(el => {
    el.classList.toggle('active', el.dataset.type === tool);
  });
  $('#btn-editor-wire')?.classList.toggle('active', tool === 'wire');
}

/* ===================== ПАНЕЛЬ ИНСТРУМЕНТОВ ===================== */
function bindToolbar() {
  $('#btn-editor-load')?.addEventListener('click', () => {
    const id = $('#editor-preset')?.value;
    if (!id) return;
    const preset = loadPreset(id);
    if (!preset) return;
    commit(() => { model = preset; });
    selection = null;
    updateProperties();
  });

  $('#btn-editor-wire')?.addEventListener('click', () => selectTool('wire'));
  $('#btn-editor-undo')?.addEventListener('click', undo);
  $('#btn-editor-redo')?.addEventListener('click', redo);
  $('#btn-editor-clear')?.addEventListener('click', () => {
    if (!model.components.length && !model.wires.length) return;
    commit(() => { model = new SchematicModel(); });
    selection = null;
    updateProperties();
  });

  $('#btn-editor-mode')?.addEventListener('click', toggleMode);
  $('#btn-editor-transient')?.addEventListener('click', toggleTransient);
  $('#btn-tr-run')?.addEventListener('click', runTransient);
  for (const id of ['#tr-tstop', '#tr-tstep']) {
    $(id)?.addEventListener('change', () => { if (mode === 'transient') runTransient(); });
  }
  $('#btn-editor-save')?.addEventListener('click', exportJSON);
  $('#btn-editor-import')?.addEventListener('click', importJSON);
  $('#btn-editor-export-svg')?.addEventListener('click', exportSVG);
  $('#btn-editor-export-png')?.addEventListener('click', exportPNG);

  updateUndoButtons();
  updateModeButton();
}

/* ===================== ВВОД: УКАЗАТЕЛЬ ===================== */
function bindCanvas() {
  // Слушатели висят на постоянном контейнере, а не на <svg>, который
  // пересоздаётся при каждой перерисовке.
  canvasEl.addEventListener('pointerdown', onPointerDown);
  canvasEl.addEventListener('pointermove', onPointerMove);
  canvasEl.addEventListener('pointerup', onPointerUp);
  canvasEl.addEventListener('pointercancel', onPointerUp);
  canvasEl.addEventListener('contextmenu', e => { e.preventDefault(); cancelTool(); });
}

/** Экранные координаты → миллиметры модели (через матрицу SVG — точно при любом масштабе). */
function toModel(clientX, clientY) {
  const svg = canvasEl.querySelector('svg');
  if (!svg || !svg.getScreenCTM) return null;
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  const inv = ctm.inverse();
  const p = new DOMPoint(clientX, clientY).matrixTransform(inv);
  return { x: p.x, y: p.y };
}

function snapGrid(v) { return Math.round(v / GRID) * GRID; }

/** Точка привязки: ближайший вывод компонента, иначе узел сетки. */
function snapPoint(x, y) {
  let best = null, bestDist = PIN_SNAP;
  for (const comp of model.components) {
    const def = COMPONENT_TYPES[comp.type];
    if (!def) continue;
    for (const c of Object.values(getComponentPins(comp, def))) {
      const d = Math.hypot(c[0] - x, c[1] - y);
      if (d < bestDist) { bestDist = d; best = c; }
    }
  }
  return best ? { x: best[0], y: best[1] } : { x: snapGrid(x), y: snapGrid(y) };
}

function onPointerDown(e) {
  if (e.button !== undefined && e.button !== 0) return;
  const pt = toModel(e.clientX, e.clientY);
  if (!pt) return;
  e.preventDefault();

  // В эмуляции канва только для чтения — кроме ключей: их можно щёлкать
  // прямо на работающей схеме, расчёт тут же повторяется.
  if (mode === 'sim') {
    if (!toggleSwitchAt(pt.x, pt.y)) probeAt(pt.x, pt.y);
    return;
  }
  if (mode !== 'edit') return;              // переходный процесс — тоже только чтение

  // 1. Черчение провода
  if (tool === 'wire') {
    const s = snapPoint(pt.x, pt.y);
    if (!pending) pending = { x: s.x, y: s.y, px: s.x, py: s.y };
    else finishWire(s.x, s.y);
    render();
    return;
  }

  // 2. Установка компонента
  if (tool) {
    const gx = snapGrid(pt.x), gy = snapGrid(pt.y);
    commit(() => { model.addComponent(tool, gx, gy); });
    tool = null;
    syncPaletteState();
    return;
  }

  // 3. Выделение и перетаскивание
  const comp = componentAt(pt.x, pt.y);
  if (comp) {
    selection = { kind: 'comp', id: comp.id };
    drag = {
      id: comp.id, startX: pt.x, startY: pt.y,
      originX: comp.x, originY: comp.y, moved: false,
    };
    canvasEl.setPointerCapture?.(e.pointerId);
  } else {
    const wire = wireAt(pt.x, pt.y);
    selection = wire ? { kind: 'wire', id: wire.id } : null;
  }
  updateProperties();
  render();
}

function onPointerMove(e) {
  const pt = toModel(e.clientX, e.clientY);
  if (!pt) return;

  if (pending) {
    const s = snapPoint(pt.x, pt.y);
    pending.px = s.x; pending.py = s.y;
    render();
    return;
  }

  if (!drag) return;
  const dx = pt.x - drag.startX, dy = pt.y - drag.startY;
  if (!drag.moved) {
    if (Math.hypot(dx, dy) < 2) return;
    drag.moved = true;
    pushUndo();                       // снимок делаем один раз, в начале жеста
  }
  model.moveComponent(drag.id, drag.originX + dx, drag.originY + dy);
  render();
}

function onPointerUp(e) {
  if (!drag) return;
  canvasEl.releasePointerCapture?.(e.pointerId);
  const moved = drag.moved;
  drag = null;
  if (moved) { scheduleSave(); render(); }
}

function cancelTool() {
  pending = null;
  tool = null;
  syncPaletteState();
  render();
}

/* ===================== ПРОВОДА ===================== */
function finishWire(x, y) {
  const start = pending;
  pending = null;
  if (Math.hypot(x - start.x, y - start.y) < GRID / 2) return;

  // Ортогональная трасса: сначала по горизонтали, затем по вертикали.
  const pts = (x === start.x || y === start.y)
    ? [[start.x, start.y], [x, y]]
    : [[start.x, start.y], [x, start.y], [x, y]];
  commit(() => { model.addWire(pts); });
}

/* ===================== ПОИСК ПОД КУРСОРОМ ===================== */
function componentAt(x, y) {
  let best = null, bestDist = HIT_RADIUS;
  for (const comp of model.components) {
    const d = Math.hypot(comp.x - x, comp.y - y);
    if (d < bestDist) { bestDist = d; best = comp; }
  }
  return best;
}

function wireAt(x, y) {
  let best = null, bestDist = WIRE_HIT;
  for (const wire of model.wires) {
    for (let i = 1; i < wire.points.length; i++) {
      const d = distToSegment(x, y, wire.points[i - 1], wire.points[i]);
      if (d < bestDist) { bestDist = d; best = wire; }
    }
  }
  return best;
}

function distToSegment(px, py, [x1, y1], [x2, y2]) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = dx * dx + dy * dy;
  if (!len) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / len;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

/* ===================== КЛАВИАТУРА ===================== */
function onKey(e) {
  // Горячие клавиши действуют только на открытой странице редактора,
  // иначе они перехватывали бы Ctrl+Z во всех калькуляторах.
  if (!$('#page-editor')?.classList.contains('active')) return;
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;

  const ctrl = e.ctrlKey || e.metaKey;
  if (ctrl && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (ctrl && (e.key === 'y' || e.key === 'Y')) { e.preventDefault(); redo(); return; }
  if (ctrl) return;

  switch (e.key) {
    case 'r': case 'R': case 'к': case 'К':
      if (selection?.kind === 'comp') { e.preventDefault(); commit(() => model.rotateComponent(selection.id)); }
      break;
    case 'Delete': case 'Backspace':
      if (selection) { e.preventDefault(); deleteSelection(); }
      break;
    case 'w': case 'W': case 'ц': case 'Ц':
      e.preventDefault(); selectTool('wire');
      break;
    case 'Escape':
      e.preventDefault();
      cancelTool();
      selection = null;
      updateProperties();
      render();
      break;
  }
}

function deleteSelection() {
  if (!selection || mode !== 'edit') return;
  const sel = selection;
  commit(() => {
    if (sel.kind === 'comp') model.removeComponent(sel.id);
    else model.removeWire(sel.id);
  });
  selection = null;
  updateProperties();
}

/* ===================== UNDO / REDO ===================== */
/** Выполнить изменение модели со снимком для отмены и перерисовкой. */
function commit(mutator) {
  pushUndo();
  mutator();
  invalidateSim();
  scheduleSave();
  render();
}

function pushUndo() {
  undoStack.push(model.toJSON());
  if (undoStack.length > UNDO_LIMIT) undoStack.shift();
  redoStack.length = 0;
  updateUndoButtons();
}

function undo() {
  if (!undoStack.length) return;
  redoStack.push(model.toJSON());
  model = SchematicModel.fromJSON(undoStack.pop());
  afterHistory();
}

function redo() {
  if (!redoStack.length) return;
  undoStack.push(model.toJSON());
  model = SchematicModel.fromJSON(redoStack.pop());
  afterHistory();
}

function afterHistory() {
  selection = null;
  invalidateSim();
  updateProperties();
  updateUndoButtons();
  scheduleSave();
  render();
}

function updateUndoButtons() {
  const u = $('#btn-editor-undo'), r = $('#btn-editor-redo');
  if (u) u.disabled = !undoStack.length;
  if (r) r.disabled = !redoStack.length;
}

/* ===================== СОХРАНЕНИЕ ===================== */
function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(STORAGE_KEY, model.toJSON()); } catch { /* квота исчерпана */ }
  }, 400);
}

/* ===================== РЕЖИМЫ РАСЧЁТА ===================== */
function toggleMode() { setMode(mode === 'sim' ? 'edit' : 'sim'); }
function toggleTransient() { setMode(mode === 'transient' ? 'edit' : 'transient'); }

function setMode(next) {
  mode = next;
  tool = null; pending = null; drag = null;
  if (mode !== 'sim') { simResult = null; probes.clear(); }
  if (mode !== 'transient') trResult = null;
  if (mode === 'sim') simResult = solveDC(model);
  if (mode === 'transient') runTransient();
  syncPaletteState();
  updateModeButton();
  renderSimReport();
  render();
}

/** Результат расчёта устарел после правки схемы. */
function invalidateSim() {
  if (mode === 'sim') { simResult = solveDC(model); renderSimReport(); }
  else if (mode === 'transient') runTransient();
}

function updateModeButton() {
  const btn = $('#btn-editor-mode');
  if (btn) {
    btn.textContent = mode === 'sim' ? T('editor.stop') : T('editor.run');
    btn.classList.toggle('active', mode === 'sim');
  }
  $('#btn-editor-transient')?.classList.toggle('active', mode === 'transient');
  // Канва доступна только для чтения в обоих расчётных режимах
  $('#page-editor')?.classList.toggle('sim-mode', mode !== 'edit');
  const simPanel = $('#editor-sim-results');
  if (simPanel) simPanel.style.display = mode === 'sim' ? '' : 'none';
  const trPanel = $('#editor-transient');
  if (trPanel) trPanel.style.display = mode === 'transient' ? '' : 'none';
}

/* ===================== ПЕРЕХОДНЫЙ ПРОЦЕСС ===================== */
function runTransient() {
  const tStop = parseFloat($('#tr-tstop')?.value);
  const tStep = parseFloat($('#tr-tstep')?.value);
  trResult = solveTransient(model, {
    tStop: Number.isFinite(tStop) && tStop > 0 ? tStop : 0.5,
    tStep: Number.isFinite(tStep) && tStep > 0 ? tStep : undefined,
  });
  if (trResult.ok) pickDefaultSignals();
  renderTransient();
}

/** По умолчанию показываем то, ради чего процесс и считают: реактивные элементы. */
function pickDefaultSignals() {
  const keys = signalList().map(s => s.key);
  // сохраняем прежний выбор, если сигналы никуда не делись
  trSelected = new Set([...trSelected].filter(k => keys.includes(k)));
  if (trSelected.size) return;
  for (const s of signalList()) {
    if (s.reactive) trSelected.add(s.key);
  }
  if (!trSelected.size) trSelected = new Set(keys.slice(0, 3));
}

/** Все доступные для графика сигналы. */
function signalList() {
  if (!trResult?.ok) return [];
  const out = [];
  for (const name of Object.keys(trResult.nodes)) {
    if (name === 'GND') continue;
    out.push({ key: 'n:' + name, label: name, unit: 'volt', data: trResult.nodes[name] });
  }
  for (const [id, br] of Object.entries(trResult.branches)) {
    const type = model.getComponent(id)?.type;
    const reactive = type === 'capacitor' || type === 'inductor';
    out.push({ key: 'u:' + id, label: id + ' · U', unit: 'volt', data: br.u, reactive });
    out.push({ key: 'i:' + id, label: id + ' · I', unit: 'amp', data: br.i, reactive });
  }
  return out;
}

const TR_COLORS = ['--accent', '--accent-2', '--result', '--warn', '--error'];

function renderTransient() {
  const chart = $('#tr-chart');
  const legend = $('#tr-legend');
  if (!chart || !legend) return;

  if (!trResult) { chart.innerHTML = ''; legend.innerHTML = ''; return; }
  if (!trResult.ok) {
    chart.innerHTML = `<p class="sim-error">${escapeHtml(T(trResult.messageKey))}</p>`;
    legend.innerHTML = '';
    return;
  }

  const all = signalList();
  const shown = all.filter(s => trSelected.has(s.key));
  const css = getComputedStyle(document.documentElement);
  const colorOf = (i) => css.getPropertyValue(TR_COLORS[i % TR_COLORS.length]).trim() || '#FFB300';

  // Напряжения и токи разводим по отдельным графикам: на общей оси
  // величина в милливольтах рядом с амперами выродилась бы в прямую.
  const groups = [
    { unit: 'volt', titleKey: 'editor.tr_voltages', items: shown.filter(s => s.unit === 'volt') },
    { unit: 'amp',  titleKey: 'editor.tr_currents', items: shown.filter(s => s.unit === 'amp') },
  ].filter(g => g.items.length);

  chart.innerHTML = groups.length
    ? groups.map(g => plotGroup(g, all, colorOf)).join('')
    : `<p class="props-hint">${escapeHtml(T('editor.tr_pick'))}</p>`;

  legend.innerHTML = all.map((s, i) => {
    const on = trSelected.has(s.key);
    return `<button type="button" class="tr-sig${on ? ' on' : ''}" data-key="${escapeHtml(s.key)}">` +
      `<span class="tr-dot" style="background:${on ? colorOf(all.filter(x => trSelected.has(x.key)).indexOf(s)) : 'transparent'}"></span>` +
      escapeHtml(s.label) + `</button>`;
  }).join('');

  legend.querySelectorAll('.tr-sig').forEach(btn => {
    btn.addEventListener('click', () => {
      const k = btn.dataset.key;
      trSelected.has(k) ? trSelected.delete(k) : trSelected.add(k);
      renderTransient();
    });
  });
}

/** Один график: оси, подписи и ломаные выбранных сигналов. */
function plotGroup(group, all, colorOf) {
  const W = 600, H = 180, L = 58, R = 12, TOP = 12, B = 26;
  const t = trResult.t;
  const tMax = t[t.length - 1] || 1;

  let lo = Infinity, hi = -Infinity;
  for (const s of group.items) for (const v of s.data) { if (v < lo) lo = v; if (v > hi) hi = v; }
  if (!isFinite(lo)) { lo = 0; hi = 1; }
  if (hi - lo < 1e-12) { hi = lo + Math.max(Math.abs(lo) * 0.1, 1e-9); }
  // Деления округляем к «круглым» значениям — иначе на оси стоят числа
  // вроде «−794.5 мВ», по которым неудобно читать график.
  const sc = niceScale(lo, hi, 5);
  lo = sc.lo; hi = sc.hi;

  const px = (time) => L + (time / tMax) * (W - L - R);
  const py = (v) => TOP + (1 - (v - lo) / (hi - lo)) * (H - TOP - B);

  const ticksX = 5;
  let axes = '';
  const stepsY = Math.round((hi - lo) / sc.step);
  for (let i = 0; i <= stepsY; i++) {
    const v = lo + sc.step * i, y = py(v);
    axes += `<line class="tr-grid" x1="${L}" y1="${y.toFixed(1)}" x2="${W - R}" y2="${y.toFixed(1)}"/>` +
      `<text class="tr-tick" x="${L - 5}" y="${(y + 3).toFixed(1)}" text-anchor="end">${escapeHtml(formatSI(v, group.unit))}</text>`;
  }
  for (let i = 0; i <= ticksX; i++) {
    const time = tMax * i / ticksX, x = px(time);
    axes += `<line class="tr-grid" x1="${x.toFixed(1)}" y1="${TOP}" x2="${x.toFixed(1)}" y2="${H - B}"/>` +
      `<text class="tr-tick" x="${x.toFixed(1)}" y="${H - B + 14}" text-anchor="middle">${escapeHtml(formatSI(time, 'sec'))}</text>`;
  }

  // Индекс цвета берём по общему списку выбранных, чтобы он совпадал с легендой
  const chosen = all.filter(s => trSelected.has(s.key));
  const lines = group.items.map(s => {
    const idx = chosen.indexOf(s);
    const d = s.data.map((v, i) => `${i ? 'L' : 'M'}${px(t[i]).toFixed(1)} ${py(v).toFixed(1)}`).join(' ');
    return `<path class="tr-line" d="${d}" stroke="${colorOf(idx)}"/>`;
  }).join('');

  return `<figure class="tr-plot"><figcaption>${escapeHtml(T(group.titleKey))}</figcaption>` +
    `<svg viewBox="0 0 ${W} ${H}" class="tr-svg" preserveAspectRatio="xMidYMid meet">${axes}${lines}</svg></figure>`;
}

/**
 * Щелчок по ключу в режиме эмуляции меняет его положение.
 * @returns {boolean} попал ли щелчок по ключу
 */
function toggleSwitchAt(x, y) {
  const comp = componentAt(x, y);
  if (!comp || comp.type !== 'switch') return false;
  commit(() => model.toggleSwitch(comp.id));
  return true;
}

function probeAt(x, y) {
  if (!simResult?.ok) return;
  const net = model.buildNetlist();
  let bestNode = null, bestDist = GRID;
  for (const [name, coords] of Object.entries(simResult.nodeCoords || net.nodeCoords)) {
    for (const c of coords) {
      const d = Math.hypot(c[0] - x, c[1] - y);
      if (d < bestDist) { bestDist = d; bestNode = name; }
    }
  }
  if (!bestNode) return;
  probes.has(bestNode) ? probes.delete(bestNode) : probes.add(bestNode);
  render();
}

/* ===================== ОТРИСОВКА ===================== */
function render() {
  if (rafId) return;
  rafId = requestAnimationFrame(() => { rafId = 0; draw(); });
}

function draw() {
  if (!canvasEl) return;
  const lib = window.GostSchematic;
  if (!lib?.Schematic) {
    canvasEl.innerHTML = '<p class="editor-empty">' + T('editor.err_no_library') + '</p>';
    return;
  }

  const css = getComputedStyle(document.documentElement);
  const stroke = css.getPropertyValue('--text').trim() || '#E6EAF0';
  const bounds = modelBounds();

  const s = new lib.Schematic({
    width: bounds.w,
    height: bounds.h,
    pad: PAD,
    showGrid: false,          // сетку рисуем сами, чтобы она жила на токенах темы
    background: 'transparent',
    stroke,
    fontFamily: css.getPropertyValue('--font-mono').trim() || 'monospace',
  });

  for (const comp of model.components) drawComponent(s, comp);
  for (const wire of model.wires) if (wire.points.length >= 2) s.wire(wire.points);
  drawJunctions(s);

  if (pending) {
    s.wire([[pending.x, pending.y], [pending.px, pending.py]]);
    s.junction(pending.x, pending.y, { r: 1.2 });
  }

  canvasEl.innerHTML = s.toSVG();
  const svg = canvasEl.querySelector('svg');
  if (!svg) return;
  svg.setAttribute('class', 'editor-canvas-svg');
  svg.style.touchAction = 'none';
  // Библиотека отдаёт width="100%": на широком экране мелкая схема раздувалась
  // до нечитаемых пропорций. Держим постоянный масштаб мм→px, сжимаясь на узких.
  svg.removeAttribute('width');
  svg.style.width = ((bounds.w + 2 * PAD) * bounds.scale).toFixed(1) + 'px';

  drawGrid(svg, bounds);
  if (selection) drawSelection(svg);
  if (mode === 'sim' && simResult?.ok) drawSimOverlay(svg);
}

/**
 * Рабочее поле. По ширине — не уже видимой части канвы, иначе на широком экране
 * сетка занимала бы лишь часть окна. По высоте — строго по содержимому: канва
 * не прокручивается сама, её высоту задаёт чертёж, а длинную страницу листает
 * браузер. Оглядывайся мы здесь на высоту контейнера, получили бы обратную
 * связь: поле растит канву, канва растит поле.
 */
function modelBounds() {
  let maxX = 0, maxY = 0;
  const touch = (x, y) => { maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); };
  for (const c of model.components) touch(c.x + 25, c.y + 25);
  for (const w of model.wires) for (const p of w.points) touch(p[0] + 10, p[1] + 10);

  // Минимум, который обязан поместиться: габариты схемы, но не меньше листа
  // 120×120 — иначе под пустой схемой нет места, куда поставить первый элемент.
  const needW = Math.max(Math.ceil(maxX / GRID) * GRID, 120);
  const needH = Math.max(Math.ceil(maxY / GRID) * GRID, 120);

  lastBoxW = canvasEl.clientWidth || 0;
  if (lastBoxW < 20) {
    return { w: needW, h: needH, scale: PX_PER_MM };   // страница ещё скрыта
  }

  // Масштаб: обычно постоянный мм→px, но если схема не влезает по ширине —
  // уменьшаем. Увеличивать сверх номинала не даём, иначе мелкая схема раздувается.
  const scale = Math.min(PX_PER_MM, lastBoxW / (needW + 2 * PAD));

  // По ширине поле растягиваем ровно на контейнер, чтобы сетка доходила до краёв.
  // Запас в 0.3 мм не даёт появиться прокрутке из-за округления пикселей.
  return {
    w: Math.max(needW, lastBoxW / scale - 2 * PAD - 0.3),
    h: needH,
    scale,
  };
}

function drawComponent(s, comp) {
  const def = COMPONENT_TYPES[comp.type];
  const opts = { rotate: comp.rotate || 0, value: valueLabel(comp) };
  switch (comp.type) {
    case 'resistor':  s.resistor(comp.id, comp.x, comp.y, opts); break;
    case 'capacitor': s.capacitor(comp.id, comp.x, comp.y, opts); break;
    case 'inductor':  s.inductor(comp.id, comp.x, comp.y, opts); break;
    case 'vsource':   s.battery(comp.id, comp.x, comp.y, opts); break;
    case 'isource':   s.currentSource(comp.id, comp.x, comp.y, opts); break;
    case 'diode':     s.diode(comp.id, comp.x, comp.y, opts); break;
    case 'led':       s.led(comp.id, comp.x, comp.y, opts); break;
    case 'zener':     s.zener(comp.id, comp.x, comp.y, opts); break;
    case 'lamp':      s.lamp(comp.id, comp.x, comp.y, opts); break;
    case 'switch':
      Number(comp.value) !== 0
        ? s.switchNC(comp.id, comp.x, comp.y, opts)
        : s.switchNO(comp.id, comp.x, comp.y, opts);
      break;
    case 'optocoupler': s.optocoupler(comp.id, comp.x, comp.y, { ...opts, value: '' }); break;
    case 'scr':       s.thyristor(comp.id, comp.x, comp.y, opts); break;
    case 'triac':     s.triac(comp.id, comp.x, comp.y, opts); break;
    case 'diac':      s.diac(comp.id, comp.x, comp.y, opts); break;
    case 'relay':
    case 'contactor': s.relayCoil(comp.id, comp.x, comp.y, opts); break;
    case 'contactNO': s.switchNO(comp.id, comp.x, comp.y, { ...opts, value: '' }); break;
    case 'contactNC': s.switchNC(comp.id, comp.x, comp.y, { ...opts, value: '' }); break;
    // lead согласован с PIN_OFFSETS.ground, иначе вывод уходит с сетки.
    case 'ground':    s.ground(comp.x, comp.y, { rotate: comp.rotate || 0, lead: GROUND_LEAD }); break;
    case 'npn':       s.transistor(comp.id, comp.x, comp.y, { ...opts, type: 'npn', value: '' }); break;
    case 'pnp':       s.transistor(comp.id, comp.x, comp.y, { ...opts, type: 'pnp', value: '' }); break;
    case 'opamp':
      s.opamp(comp.id, comp.x, comp.y, {
        rotate: comp.rotate || 0,
        left: [{ name: 'inv', y: -5, label: '−' }, { name: 'non', y: 5, label: '+' }],
        right: [{ name: 'out', y: 0 }],
      });
      break;
    default:
      s.box(comp.id, comp.x, comp.y, { w: 20, h: 20, label: comp.type, rotate: comp.rotate || 0 });
  }
  void def;
}

function valueLabel(comp) {
  const def = COMPONENT_TYPES[comp.type];
  if (!def) return '';
  if (comp.type === 'switch') return T(Number(comp.value) !== 0 ? 'editor.sw_closed' : 'editor.sw_open');
  if (def.unitKey === 'none') return '';
  return formatSI(Number(comp.value), def.unitKey);
}

/**
 * Точка соединения ставится там, где сходятся три и более проводника,
 * а также где конец провода или вывод упирается в середину другого провода
 * (тройник). Простое пересечение вершины не имеет и точки не получает —
 * это и есть «крест без точки» по ЕСКД.
 */
function drawJunctions(s) {
  for (const [x, y] of junctionPoints(model)) s.junction(x, y);
}

const SVG_NS = 'http://www.w3.org/2000/svg';
function el(name, attrs) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

/** Сетка на весь viewBox, включая поля: иначе по краям остаётся неразмеченная кайма. */
function drawGrid(svg, bounds) {
  const g = el('g', { 'pointer-events': 'none', class: 'editor-grid' });
  // Тянем на клетку дальше края: лишнее обрежет граница SVG, зато у самого
  // края не остаётся полосы без линий.
  const left = -PAD - GRID, top = -PAD - GRID;
  const right = bounds.w + PAD + GRID, bottom = bounds.h + PAD + GRID;
  for (let x = left; x <= right; x += GRID) {
    g.appendChild(el('line', { x1: x, y1: top, x2: x, y2: bottom }));
  }
  for (let y = top; y <= bottom; y += GRID) {
    g.appendChild(el('line', { x1: left, y1: y, x2: right, y2: y }));
  }
  svg.insertBefore(g, svg.firstChild);
}

function drawSelection(svg) {
  if (selection.kind === 'comp') {
    const comp = model.getComponent(selection.id);
    if (!comp) return;
    const r = 13;
    svg.appendChild(el('rect', {
      x: comp.x - r, y: comp.y - r, width: r * 2, height: r * 2,
      rx: 2, class: 'editor-selection', 'pointer-events': 'none',
    }));
  } else {
    const wire = model.wires.find(w => w.id === selection.id);
    if (!wire) return;
    svg.appendChild(el('polyline', {
      points: wire.points.map(p => p.join(',')).join(' '),
      class: 'editor-selection-wire', 'pointer-events': 'none',
    }));
  }
}

/* ===================== ВИЗУАЛИЗАЦИЯ ЭМУЛЯЦИИ ===================== */
/**
 * Свечение индикаторов, через которые идёт ток. Ложится отдельным слоем сразу
 * за сеткой — под УГО и провода: свет исходит из-под символа, а линии чертежа
 * остаются чёткими поверх него.
 */
function drawGlow(svg) {
  const defs = el('defs', {});
  const glows = el('g', { class: 'editor-glow-layer', 'pointer-events': 'none' });
  let n = 0;

  for (const [id, br] of Object.entries(simResult.branches || {})) {
    const comp = model.getComponent(id);
    if (!comp) continue;
    const level = emissionLevel(comp.type, br);
    if (level <= 0) continue;

    const color = emissionColor(comp.type, comp.value);
    const gradId = 'editor-glow-' + (n++);
    const grad = el('radialGradient', { id: gradId });
    // Ядро ярче края: три остановки дают мягкий спад без видимой границы.
    for (const [offset, alpha] of [['0%', 0.6], ['45%', 0.26], ['100%', 0]]) {
      grad.appendChild(el('stop', {
        offset,
        'stop-color': color,
        'stop-opacity': (alpha * level).toFixed(3),
      }));
    }
    defs.appendChild(grad);
    glows.appendChild(el('circle', {
      cx: comp.x, cy: comp.y,
      r: comp.type === 'lamp' ? 10 : 11,
      fill: 'url(#' + gradId + ')',
    }));
  }

  if (!n) return;
  glows.insertBefore(defs, glows.firstChild);
  const grid = svg.querySelector('.editor-grid');
  svg.insertBefore(glows, grid ? grid.nextSibling : svg.firstChild);
}

function drawSimOverlay(svg) {
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const layer = el('g', { class: 'editor-sim', 'pointer-events': 'none' });

  drawGlow(svg);

  // --- ток по проводам ---
  const currents = Object.values(simResult.wireCurrents || {}).map(c => Math.abs(c.i));
  const maxI = Math.max(...currents, 0);

  for (const wire of model.wires) {
    const wc = simResult.wireCurrents?.[wire.id];
    if (!wc || !wc.dir || !wc.i) continue;
    const pts = wc.dir > 0 ? wire.points : [...wire.points].reverse();
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join(' ');

    if (!reduced) {
      const path = el('path', { d, class: 'editor-flow' });
      // Быстрее ток — короче период пробега штрихов.
      const ratio = maxI > 0 ? Math.abs(wc.i) / maxI : 0;
      const period = MAX_DASH_PERIOD - ratio * (MAX_DASH_PERIOD - MIN_DASH_PERIOD);
      path.style.animationDuration = period.toFixed(2) + 's';
      layer.appendChild(path);
    }
    layer.appendChild(arrowAt(pts));
  }

  // --- U / I / P на двухполюсниках ---
  for (const [id, br] of Object.entries(simResult.branches || {})) {
    const comp = model.getComponent(id);
    if (!comp) continue;
    const vertical = ((comp.rotate || 0) % 180) !== 0;
    // Библиотека ставит обозначение и номинал справа у вертикальных УГО и
    // сверху/снизу у горизонтальных. Характеристики выносим на свободную
    // сторону: слева для вертикальных, под номиналом для горизонтальных.
    const tx = vertical ? comp.x - 11 : comp.x;
    const ty = vertical ? comp.y - 3.5 : comp.y + 17;
    const anchor = vertical ? 'end' : 'middle';
    const lines = [
      formatSI(br.u, 'volt'),
      formatSI(Math.abs(br.i), 'amp'),
      formatSI(Math.abs(br.p), 'watt'),
    ];
    lines.forEach((text, i) => {
      const t = el('text', { x: tx, y: ty + i * 3.2, 'text-anchor': anchor, class: 'editor-sim-label' });
      t.textContent = text;
      layer.appendChild(t);
    });
  }

  // --- пробники напряжения в узлах ---
  for (const name of probes) {
    const coords = (simResult.nodeCoords || {})[name];
    if (!coords?.length) continue;
    const [x, y] = coords[0];
    layer.appendChild(el('circle', { cx: x, cy: y, r: 1.6, class: 'editor-probe-dot' }));
    const t = el('text', { x: x + 3, y: y - 2, class: 'editor-probe-label' });
    t.textContent = name + ' = ' + formatSI(simResult.nodeVoltages[name] ?? 0, 'volt');
    layer.appendChild(t);
  }

  svg.appendChild(layer);
}

/** Треугольная стрелка направления в середине самого длинного сегмента. */
function arrowAt(pts) {
  let best = 0, bestLen = -1;
  for (let i = 1; i < pts.length; i++) {
    const len = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (len > bestLen) { bestLen = len; best = i; }
  }
  const [x1, y1] = pts[best - 1], [x2, y2] = pts[best];
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const deg = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
  const arrow = el('path', { d: 'M -1.6 -1.4 L 1.8 0 L -1.6 1.4 Z', class: 'editor-flow-arrow' });
  arrow.setAttribute('transform', `translate(${mx} ${my}) rotate(${deg.toFixed(1)})`);
  return arrow;
}

/* ===================== ОТЧЁТ ЭМУЛЯЦИИ ===================== */
function renderSimReport() {
  const box = $('#editor-sim-content');
  if (!box) return;
  if (mode !== 'sim' || !simResult) { box.innerHTML = ''; return; }

  if (!simResult.ok) {
    box.innerHTML = `<p class="sim-error">${escapeHtml(T(simResult.messageKey))}</p>`;
    return;
  }

  const rows = [];
  rows.push(`<div class="sim-block"><h4>${escapeHtml(T('editor.node_voltages'))}</h4><table class="sim-table"><tbody>`);
  for (const [name, v] of Object.entries(simResult.nodeVoltages)) {
    rows.push(`<tr><th>${escapeHtml(name)}</th><td>${escapeHtml(formatSI(v, 'volt'))}</td></tr>`);
  }
  rows.push('</tbody></table></div>');

  rows.push(`<div class="sim-block"><h4>${escapeHtml(T('editor.branches'))}</h4>`);
  rows.push(`<table class="sim-table"><thead><tr><th>—</th><th>U</th><th>I</th><th>P</th></tr></thead><tbody>`);
  for (const [id, br] of Object.entries(simResult.branches)) {
    // У транзистора в столбцах Uкэ и Iк, а режим и ток базы — отдельной строкой.
    const note = br.region
      ? `<span class="sim-note">${escapeHtml(T('editor.reg_' + br.region))}</span>`
      : '';
    rows.push(
      `<tr><th>${escapeHtml(id)}${note}</th>` +
      `<td>${escapeHtml(formatSI(br.u, 'volt'))}</td>` +
      `<td>${escapeHtml(formatSI(br.i, 'amp'))}</td>` +
      `<td>${escapeHtml(formatSI(br.p, 'watt'))}</td></tr>`
    );
    if (br.ib !== undefined) {
      rows.push(
        `<tr class="sim-sub"><th>${escapeHtml(T('editor.base_current'))}</th>` +
        `<td>${escapeHtml(formatSI(br.vbe, 'volt'))}</td>` +
        `<td>${escapeHtml(formatSI(br.ib, 'amp'))}</td><td>—</td></tr>`
      );
    }
    if (br.iled !== undefined) {
      rows.push(
        `<tr class="sim-sub"><th>${escapeHtml(T('editor.led_current'))}</th>` +
        `<td>—</td><td>${escapeHtml(formatSI(br.iled, 'amp'))}</td><td>—</td></tr>`
      );
    }
    if (br.ig !== undefined) {
      rows.push(
        `<tr class="sim-sub"><th>${escapeHtml(T('editor.gate_current'))}</th>` +
        `<td>—</td><td>${escapeHtml(formatSI(br.ig, 'amp'))}</td><td>—</td></tr>`
      );
    }
    if (br.vd !== undefined) {
      rows.push(
        `<tr class="sim-sub"><th>${escapeHtml(T('editor.diff_input'))}</th>` +
        `<td>${escapeHtml(formatSI(br.vd, 'volt'))}</td><td>—</td><td>—</td></tr>`
      );
    }
  }
  rows.push('</tbody></table></div>');

  const warns = [...(simResult.warnings || []), ...model.validate()];
  if (warns.length) {
    rows.push(`<div class="sim-block"><h4>${escapeHtml(T('editor.warnings'))}</h4><ul class="sim-warn">`);
    for (const w of warns) rows.push(`<li>${escapeHtml(issueText(w))}</li>`);
    rows.push('</ul></div>');
  }
  box.innerHTML = rows.join('');
}

/** Текст проблемы: ключ i18n + подстановка обозначения элемента. */
function issueText(issue) {
  let text = T(issue.key);
  if (issue.ref) text = text.replace('{ref}', issue.ref);
  if (issue.pin) text = text.replace('{pin}', issue.pin);
  if (issue.p != null) text = text.replace('{p}', formatSI(issue.p, 'watt'));
  return text;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ===================== ПАНЕЛЬ СВОЙСТВ ===================== */
function updateProperties() {
  const box = $('#editor-props-content');
  if (!box) return;

  if (!selection) {
    box.innerHTML = `<p class="props-hint">${escapeHtml(T('editor.select_element'))}</p>`;
    return;
  }

  if (selection.kind === 'wire') {
    box.innerHTML =
      `<div class="props-head"><strong>${escapeHtml(selection.id)}</strong>` +
      `<span>${escapeHtml(T('editor.c_wire'))}</span></div>` +
      `<button type="button" class="btn btn-ghost btn-sm" id="prop-delete">${escapeHtml(T('editor.delete'))}</button>`;
    $('#prop-delete')?.addEventListener('click', deleteSelection);
    return;
  }

  const comp = model.getComponent(selection.id);
  if (!comp) { box.innerHTML = ''; return; }
  const def = COMPONENT_TYPES[comp.type];

  let field = '';
  if (comp.type === 'switch') {
    field =
      `<div class="field"><label for="prop-value">${escapeHtml(T('editor.state'))}</label>` +
      `<select id="prop-value" class="tbl-input">` +
      `<option value="1"${Number(comp.value) !== 0 ? ' selected' : ''}>${escapeHtml(T('editor.sw_closed'))}</option>` +
      `<option value="0"${Number(comp.value) === 0 ? ' selected' : ''}>${escapeHtml(T('editor.sw_open'))}</option>` +
      `</select></div>`;
  } else if (def.unitKey !== 'none' || def.valueLabelKey) {
    // valueLabelKey нужен безразмерным величинам вроде β: единицы нет, а поле нужно.
    const unit = def.unitKey !== 'none' ? ', ' + escapeHtml(unitSymbol(def.unitKey)) : '';
    const label = escapeHtml(T(def.valueLabelKey || 'editor.value'));
    field =
      `<div class="field"><label for="prop-value">${label}${unit}</label>` +
      `<input type="number" id="prop-value" class="tbl-input" step="any" inputmode="decimal" value="${comp.value}"></div>`;
  }

  // Дополнительные параметры модели (пороги отпирания, ссылка на катушку и т. п.)
  for (const p of (def.params || [])) {
    const label = escapeHtml(T(p.labelKey));
    const id = 'prop-p-' + p.key;

    if (p.kind === 'ref') {
      // Ссылка на другой элемент схемы — например контакт на «свою» катушку.
      const opts = model.components.filter(c => p.refTypes.includes(c.type));
      const cur = comp.props?.[p.key] || '';
      field +=
        `<div class="field"><label for="${id}">${label}</label>` +
        `<select id="${id}" class="tbl-input">` +
        `<option value="">${escapeHtml(T('editor.coil_auto'))}</option>` +
        opts.map(c => `<option value="${escapeHtml(c.id)}"${c.id === cur ? ' selected' : ''}>${escapeHtml(c.id)}</option>`).join('') +
        `</select></div>`;
    } else if (p.kind === 'bool') {
      const on = Number(comp.props?.[p.key] ?? p.def) !== 0;
      field +=
        `<div class="field"><label for="${id}">${label}</label>` +
        `<select id="${id}" class="tbl-input">` +
        `<option value="0"${on ? '' : ' selected'}>${escapeHtml(T('editor.no'))}</option>` +
        `<option value="1"${on ? ' selected' : ''}>${escapeHtml(T('editor.yes'))}</option>` +
        `</select></div>`;
    } else {
      const val = Number(comp.props?.[p.key] ?? p.def);
      const unit = p.unitKey && p.unitKey !== 'none' ? ', ' + escapeHtml(unitSymbol(p.unitKey)) : '';
      field +=
        `<div class="field"><label for="${id}">${label}${unit}</label>` +
        `<input type="number" id="${id}" class="tbl-input" step="any" inputmode="decimal" value="${val}"></div>`;
    }
  }

  box.innerHTML =
    `<div class="props-head"><strong>${escapeHtml(comp.id)}</strong>` +
    `<span>${escapeHtml(T('editor.c_' + comp.type))}</span></div>` +
    field +
    `<div class="props-actions">` +
    `<button type="button" class="btn btn-ghost btn-sm" id="prop-rot-ccw" title="${escapeHtml(T('editor.rotate'))}">&#8630;</button>` +
    `<button type="button" class="btn btn-ghost btn-sm" id="prop-rot-cw" title="${escapeHtml(T('editor.rotate'))}">&#8631;</button>` +
    `<button type="button" class="btn btn-ghost btn-sm" id="prop-delete">${escapeHtml(T('editor.delete'))}</button>` +
    `</div>` +
    `<p class="props-hint">${escapeHtml(T('editor.hint'))}</p>`;

  const input = $('#prop-value');
  input?.addEventListener('change', () => {
    const v = parseFloat(input.value);
    if (!Number.isFinite(v)) { input.classList.add('err'); return; }
    input.classList.remove('err');
    commit(() => model.updateValue(comp.id, v));
    updateProperties();
  });
  for (const p of (def.params || [])) {
    const inp = $('#prop-p-' + p.key);
    inp?.addEventListener('change', () => {
      let v;
      if (p.kind === 'ref') {
        v = inp.value || undefined;              // пусто = выбрать катушку автоматически
      } else {
        v = parseFloat(inp.value);
        if (!Number.isFinite(v)) { inp.classList.add('err'); return; }
        inp.classList.remove('err');
      }
      commit(() => {
        const c = model.getComponent(comp.id);
        if (!c) return;
        const props = { ...c.props };
        if (v === undefined) delete props[p.key]; else props[p.key] = v;
        c.props = props;
      });
      updateProperties();
    });
  }

  $('#prop-rot-ccw')?.addEventListener('click', () => { commit(() => model.rotateComponent(comp.id, -90)); });
  $('#prop-rot-cw')?.addEventListener('click', () => { commit(() => model.rotateComponent(comp.id, 90)); });
  $('#prop-delete')?.addEventListener('click', deleteSelection);
}

/* ===================== ЭКСПОРТ / ИМПОРТ ===================== */
function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportJSON() {
  download(new Blob([model.toJSON()], { type: 'application/json' }), 'engicalc-schematic.json');
}

function importJSON() {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = 'application/json,.json';
  inp.addEventListener('change', () => {
    const file = inp.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const next = SchematicModel.fromJSON(String(reader.result));
        commit(() => { model = next; });
        selection = null;
        updateProperties();
      } catch (err) {
        toast(T('editor.err_import'));
      }
    };
    reader.readAsText(file);
  });
  inp.click();
}

/** Автономный SVG: подставляем вычисленные цвета вместо переменных CSS. */
function buildStandaloneSVG() {
  const svg = canvasEl?.querySelector('svg');
  if (!svg) return null;
  const clone = svg.cloneNode(true);
  clone.querySelectorAll('.editor-grid, .editor-selection, .editor-selection-wire').forEach(n => n.remove());

  const css = getComputedStyle(document.documentElement);
  const accent = css.getPropertyValue('--accent').trim() || '#FFB300';
  const bg = css.getPropertyValue('--bg-input').trim() || '#fff';

  clone.querySelectorAll('.editor-flow, .editor-flow-arrow').forEach(n => {
    n.setAttribute('fill', n.tagName === 'path' && n.classList.contains('editor-flow') ? 'none' : accent);
    n.setAttribute('stroke', n.classList.contains('editor-flow') ? accent : 'none');
    if (n.classList.contains('editor-flow')) { n.setAttribute('stroke-width', '0.8'); n.setAttribute('stroke-dasharray', '2 2'); }
    n.style.animation = 'none';
  });
  clone.querySelectorAll('.editor-sim-label, .editor-probe-label').forEach(n => {
    n.setAttribute('fill', accent); n.setAttribute('font-size', '3');
  });
  clone.querySelectorAll('.editor-probe-dot').forEach(n => n.setAttribute('fill', accent));

  clone.setAttribute('xmlns', SVG_NS);
  clone.insertBefore(el('rect', {
    x: clone.viewBox.baseVal.x, y: clone.viewBox.baseVal.y,
    width: clone.viewBox.baseVal.width, height: clone.viewBox.baseVal.height, fill: bg,
  }), clone.firstChild);
  return clone;
}

function exportSVG() {
  const clone = buildStandaloneSVG();
  if (!clone) return;
  download(new Blob([clone.outerHTML], { type: 'image/svg+xml;charset=utf-8' }), 'engicalc-schematic.svg');
}

/** PNG получаем отрисовкой SVG на canvas — без внешних зависимостей. */
function exportPNG() {
  const clone = buildStandaloneSVG();
  if (!clone) return;
  const vb = clone.viewBox.baseVal;
  const scale = 4;                       // ~4 px на мм — читаемо при печати
  const w = Math.max(1, Math.round(vb.width * scale));
  const h = Math.max(1, Math.round(vb.height * scale));
  clone.setAttribute('width', w);
  clone.setAttribute('height', h);

  const svgText = new XMLSerializer().serializeToString(clone);
  const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgText);
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
    canvas.toBlob(blob => { if (blob) download(blob, 'engicalc-schematic.png'); }, 'image/png');
  };
  img.onerror = () => toast(T('editor.err_png'));
  img.src = url;
}
