/* EngiCalc — Entry point */
'use strict';

import { $, $$, lang, loadLang, showPage, showSubTab, toggleTheme, printPage, copyText } from './core.js';
import { calcPower, calcVoltage, calcShortCircuit, calcGrounding, calcProtection } from './electrical.js';
import { calcCable, initCableForm } from './cable-select.js';
import { calcLedStrip, initStripForm, addStripRow, removeStripRow } from './led-strip.js';
import { calcCompensation, calcMotor, calcTransformer, calcLighting, calcUPS, calcLoadPanel, addLoadRow, removeLoadRow } from './equipment.js';
import { calcDerating, calcDiam2Sec, calcConverter } from './cable-networks.js';
import { calcResSeries, calcResParallel, calcCapSeries, calcCapParallel, calcIndSeries, calcIndParallel, calcVoltageDivider, calcRCTau, calcRLTau, calcLCResonance, calcMotorCap, calcCapCode, calcCapUnit, calcLED, calcZener, calcRLC, calcBridge } from './electronics.js';
import { calcAstable, calcMonostable, calcInvOpamp, calcNonInvOpamp, calcSumOpamp, calcDiffOpamp, calc7segRes, calc7segDec } from './microchips.js';
import { calcCurrentLoop, calcScaling, calcRTD, calcPID, calcAccuracy, calcPneumFlow, calcPneumCyl, calcPneumComp, calcHydCyl, calcHydPump, calcHydPipe } from './kipia.js';
import { toggleHelp } from './help.js';
import { initWirecab, calcWirecabQuick, calcWirecabAdvanced, addWirecabGroup, removeWirecabGroup, downloadWirecabCSV, resetWirecabQuick, resetWirecabAdvanced } from './wirecab.js';
import { initEditor, refreshEditorLang, refreshEditorTheme } from './schematic-editor.js';
import { calcGroundCircuit, calcKZCableCheck, calcBusbar, calcDemandFactor, addDemandRow, removeDemandRow } from './electrical2.js';
import { calcFuse, calc420Cable, calcRTDTable, calcThermocouple, calcPneumLine, calcEnergyAudit, addEnergyRow, removeEnergyRow, calcCableTray, addCableRow, removeCableRow } from './industry.js';
import { calc3PhasePower, calcDCVoltageDrop, calcConduitFill, addConduitRow, removeConduitRow, calcMotorStart, calcNeutralCurrent, calcCableLoss, calcEmergencyLight, calcSolarPanel, calcArcFlash, calcTHD, addTHDRow, removeTHDRow } from './electrical3.js';
import { CIRCUITS, renderCircuit, refreshCircuits } from './circuits.js';

/* ===================== BIND ALL ===================== */
function bindAll() {
  // Navigation
  $$('.nav-item[data-page]').forEach(el => el.addEventListener('click', () => showPage(el.dataset.page)));

  // Sub-tabs (event delegation)
  document.addEventListener('click', e => {
    const tab = e.target.closest('.sub-tab[data-sub]');
    if (tab) showSubTab(tab.dataset.sub);
  });

  // Theme & lang
  $('.btn-theme')?.addEventListener('click', () => {
    toggleTheme();
    // Цвета УГО зашиты в SVG при построении — схемы надо собрать заново.
    refreshCircuits();
    refreshEditorTheme();
  });
  $('.btn-lang')?.addEventListener('click', () => {
    loadLang(lang === 'ru' ? 'en' : 'ru');
    // Редактор строит подписи в SVG сам — data-i18n его не покрывает.
    refreshEditorLang();
  });

  // Mobile nav
  $('.nav-toggle')?.addEventListener('click', () => {
    $('.sidebar')?.classList.toggle('open');
    $('.nav-overlay')?.classList.toggle('show');
  });
  $('.nav-overlay')?.addEventListener('click', () => {
    $('.sidebar')?.classList.remove('open');
    $('.nav-overlay')?.classList.remove('show');
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      $('.sidebar')?.classList.remove('open');
      $('.nav-overlay')?.classList.remove('show');
    }
  });

  // Help
  $('.btn-help')?.addEventListener('click', toggleHelp);
  $('#help-overlay')?.addEventListener('click', toggleHelp);
  $('.help-close')?.addEventListener('click', toggleHelp);

  // Print
  $('.btn-print')?.addEventListener('click', printPage);

  // Calculator buttons
  const binds = [
    ['btn-power-calc', calcPower], ['btn-cable-calc', calcCable], ['btn-voltage-calc', calcVoltage],
    ['btn-lst-calc', calcLedStrip], ['btn-lst-add', addStripRow], ['btn-lst-remove', removeStripRow],
    ['btn-sc-calc', calcShortCircuit], ['btn-g-calc', calcGrounding], ['btn-pr-calc', calcProtection],
    ['btn-comp-calc', calcCompensation], ['btn-m-calc', calcMotor], ['btn-t-calc', calcTransformer],
    ['btn-l-calc', calcLighting], ['btn-u-calc', calcUPS], ['btn-conv-calc', calcConverter],
    ['btn-cl-calc', calcCurrentLoop], ['btn-sc-scale-calc', calcScaling], ['btn-rtd-calc', calcRTD],
    ['btn-pid-calc', calcPID], ['btn-acc-calc', calcAccuracy],
    ['btn-dr-calc', calcDerating], ['btn-lp-calc', calcLoadPanel], ['btn-lp-add', addLoadRow],
    ['btn-lp-remove', removeLoadRow],
    ['btn-pf-calc', calcPneumFlow], ['btn-pc-calc', calcPneumCyl], ['btn-pcomp-calc', calcPneumComp],
    ['btn-hc-calc', calcHydCyl], ['btn-hp-calc', calcHydPump], ['btn-hpp-calc', calcHydPipe],
    ['btn-rs-calc', calcResSeries], ['btn-rp-calc', calcResParallel],
    ['btn-cs-calc', calcCapSeries], ['btn-cp-calc', calcCapParallel],
    ['btn-ls-calc', calcIndSeries], ['btn-lp-elec-calc', calcIndParallel],
    ['btn-vd-calc', calcVoltageDivider], ['btn-rc-calc', calcRCTau],
    ['btn-rl-tau-calc', calcRLTau], ['btn-lc-calc', calcLCResonance],
    ['btn-mc-calc', calcMotorCap], ['btn-ds-calc', calcDiam2Sec],
    ['btn-wb-calc', calcBridge], ['btn-led-calc', calcLED],
    ['btn-rlc-calc', calcRLC], ['btn-cc-calc', calcCapCode], ['btn-cu-calc', calcCapUnit],
    ['btn-zen-calc', calcZener], ['btn-ast-calc', calcAstable], ['btn-mono-calc', calcMonostable],
    ['btn-inv-calc', calcInvOpamp], ['btn-ninv-calc', calcNonInvOpamp],
    ['btn-sum-calc', calcSumOpamp], ['btn-diff-calc', calcDiffOpamp],
    ['btn-s7r-calc', calc7segRes], ['btn-s7d-calc', calc7segDec],
    // Wire cabinet
    ['btn-wc-calc', calcWirecabQuick], ['btn-wc-adv-calc', calcWirecabAdvanced],
    ['btn-wc-add', addWirecabGroup], ['btn-wc-remove', removeWirecabGroup],
    ['btn-wc-csv', downloadWirecabCSV], ['btn-wc-adv-csv', downloadWirecabCSV],
    ['btn-wc-print', printPage], ['btn-wc-adv-print', printPage],
    ['btn-wc-reset', resetWirecabQuick], ['btn-wc-adv-reset', resetWirecabAdvanced],
    // New electrical
    ['btn-gc-calc', calcGroundCircuit], ['btn-kz-calc', calcKZCableCheck],
    ['btn-bb-calc', calcBusbar], ['btn-df-calc', calcDemandFactor],
    ['btn-df-add', addDemandRow], ['btn-df-remove', removeDemandRow],
    // New KIPIA/industrial
    ['btn-fu-calc', calcFuse], ['btn-cl2-calc', calc420Cable],
    ['btn-rt-calc', calcRTDTable], ['btn-tc-calc', calcThermocouple],
    ['btn-pl-calc', calcPneumLine],
    // Energy & cable tray
    ['btn-ea-calc', calcEnergyAudit], ['btn-ea-add', addEnergyRow], ['btn-ea-remove', removeEnergyRow],
    ['btn-ct-calc', calcCableTray], ['btn-ct-add', addCableRow], ['btn-ct-remove', removeCableRow],
    // Electrical installation
    ['btn-tp-calc', calc3PhasePower], ['btn-dc-calc', calcDCVoltageDrop],
    ['btn-cf-calc', calcConduitFill], ['btn-cf-add', addConduitRow], ['btn-cf-remove', removeConduitRow],
    ['btn-ms-calc', calcMotorStart], ['btn-nc-calc', calcNeutralCurrent],
    ['btn-cl-loss-calc', calcCableLoss], ['btn-el-calc', calcEmergencyLight],
    ['btn-sp-calc', calcSolarPanel], ['btn-af-calc', calcArcFlash],
    ['btn-thd-calc', calcTHD], ['btn-thd-add', addTHDRow], ['btn-thd-remove', removeTHDRow],
  ];
  binds.forEach(([id, fn]) => document.getElementById(id)?.addEventListener('click', fn));

  // Кнопки со своим обработчиком из binds не должны попадать ещё и под общий
  // сброс ниже: btn-wc-reset и btn-wc-adv-reset подходят под [id$="-reset"],
  // и на один клик отрабатывали оба обработчика.
  const boundIds = new Set(binds.map(([id]) => id));

  // Circuit buttons (SVG circuit renderer)
  $$('.circuit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.circuit;
      const display = btn.closest('.card')?.querySelector('[id^="circuit-display"]');
      if (display && CIRCUITS[id]) {
        display.dataset.circuit = id;   // чтобы схему можно было перерисовать при смене темы
        display.innerHTML = renderCircuit(id);
      }
    });
  });

  // Reset buttons
  $$('[id$="-reset"]').forEach(btn => {
    if (boundIds.has(btn.id)) return;
    btn.addEventListener('click', () => {
      const page = btn.closest('.page');
      if (!page) return;
      // Текстовые поля тоже возвращаем к исходному: раньше сбрасывались только
      // числовые, и названия групп в таблицах оставались от прошлого расчёта.
      page.querySelectorAll('input[type="number"], input[type="text"]').forEach(inp => {
        inp.value = inp.defaultValue;
        inp.classList.remove('err');
      });
      page.querySelectorAll('select').forEach(sel => sel.selectedIndex = 0);
    });
  });

  // Power page export
  $('#btn-power-pdf')?.addEventListener('click', printPage);
  $('#btn-power-copy')?.addEventListener('click', () => {
    copyText(`Ток: ${$('#power-result-val')?.textContent} ${$('#power-result-unit')?.textContent}`);
  });

  // Restore theme
  if (localStorage.getItem('theme') === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  }

  // Init wire cabinet calculator
  initCableForm();
  initStripForm();

  initWirecab();

  // Init schematic editor
  initEditor();

  // Hash routing
  const hash = location.hash.slice(1);
  showPage((hash && $(`#page-${hash}`)) ? hash : 'power');
  showSubTab('currentloop');
}

/* ===================== INIT ===================== */
document.addEventListener('DOMContentLoaded', () => {
  loadLang(lang);
  bindAll();
});
