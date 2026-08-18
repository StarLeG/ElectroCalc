/* EngiCalc — Electronics: dynamic R/C/L, dividers, RC/RL/LC, LED, zener, RLC, bridge */
'use strict';
import { $, $$, num, round, toast, validate, validatePositive, validateRange, T } from './core.js';

/* ===================== DYNAMIC LIST HELPERS ===================== */
function getDynValues(prefix) {
  const items = document.querySelectorAll(`#${prefix}-list .dynamic-val`);
  return Array.from(items).map(i => parseFloat(i.value)).filter(v => !isNaN(v) && v > 0);
}

export function addDynItem(prefix, label, unit) {
  const list = document.getElementById(`${prefix}-list`);
  if (!list) return;
  const count = list.children.length + 1;
  const div = document.createElement('div');
  div.className = 'dynamic-item';
  div.innerHTML = `<label>${label}${count} (${unit})</label><input type="number" class="dynamic-val">`;
  list.appendChild(div);
  div.querySelector('input').focus();
}

export function removeDynItem(prefix) {
  const list = document.getElementById(`${prefix}-list`);
  if (!list || list.children.length <= 2) return;
  list.removeChild(list.lastElementChild);
}

// Register global functions for inline onclick
window.addDynItem = addDynItem;
window.removeDynItem = removeDynItem;

/* ===================== RESISTOR SERIES ===================== */
export function calcResSeries() {
  const vals = getDynValues('rs');
  if (vals.length < 2) { toast('Минимум 2 резистора'); return; }
  const R = vals.reduce((a, b) => a + b, 0);
  $('#rs-result-val').textContent = round(R, 2);
  $('#rs-count').textContent = vals.length;
}

/* ===================== RESISTOR PARALLEL ===================== */
export function calcResParallel() {
  const vals = getDynValues('rp');
  if (vals.length < 2) { toast('Минимум 2 резистора'); return; }
  const inv = vals.reduce((a, b) => a + 1 / b, 0);
  $('#rp-result-val').textContent = round(1 / inv, 2);
}

/* ===================== CAPACITOR SERIES ===================== */
export function calcCapSeries() {
  const vals = getDynValues('cs');
  if (vals.length < 2) { toast('Минимум 2 конденсатора'); return; }
  const inv = vals.reduce((a, b) => a + 1 / b, 0);
  $('#cs-result-val').textContent = round(1 / inv, 2);
}

/* ===================== CAPACITOR PARALLEL ===================== */
export function calcCapParallel() {
  const vals = getDynValues('cp');
  if (vals.length < 2) { toast('Минимум 2 конденсатора'); return; }
  const C = vals.reduce((a, b) => a + b, 0);
  $('#cp-result-val').textContent = round(C, 2);
}

/* ===================== INDUCTOR SERIES ===================== */
export function calcIndSeries() {
  const vals = getDynValues('ls');
  if (vals.length < 2) { toast('Минимум 2 катушки'); return; }
  const L = vals.reduce((a, b) => a + b, 0);
  $('#ls-result-val').textContent = round(L, 2);
}

/* ===================== INDUCTOR PARALLEL ===================== */
export function calcIndParallel() {
  const vals = getDynValues('lp');
  if (vals.length < 2) { toast('Минимум 2 катушки'); return; }
  const inv = vals.reduce((a, b) => a + 1 / b, 0);
  $('#lp-result-val').textContent = round(1 / inv, 3);
}

/* ===================== VOLTAGE DIVIDER ===================== */
export function calcVoltageDivider() {
  if (!validate('vd-Vin') || !validatePositive('vd-R1', 'vd-R2')) return;
  const Vin = num('vd-Vin'), R1 = num('vd-R1'), R2 = num('vd-R2'), RL = num('vd-RL') || 0;
  const R2eff = RL > 0 ? (R2 * RL) / (R2 + RL) : R2;
  const Vout = Vin * R2eff / (R1 + R2eff);
  const k = R2eff / (R1 + R2eff);
  const I = Vin / (R1 + R2eff) * 1000;
  const P = Vout * Vout / R2eff * 1000;
  $('#vd-result-val').textContent = round(Vout, 2);
  $('#vd-Vout').textContent = round(Vout, 2) + ' В';
  $('#vd-k').textContent = round(k, 3);
  $('#vd-I').textContent = round(I, 2) + ' мА';
  $('#vd-P').textContent = round(P, 2) + ' мВт';
}

/* ===================== RC TIME CONSTANT ===================== */
export function calcRCTau() {
  if (!validatePositive('rc-R', 'rc-C')) return;
  const R = num('rc-R'), C = num('rc-C');
  const tau = R * C / 1000000;
  const fc = 1 / (2 * Math.PI * tau);
  $('#rc-result-val').textContent = round(tau, 3);
  $('#rc-tau').textContent = round(tau, 3) + ' с';
  $('#rc-5tau').textContent = round(tau * 5, 3) + ' с';
  $('#rc-fc').textContent = round(fc, 2) + ' Гц';
}

/* ===================== RL TIME CONSTANT ===================== */
export function calcRLTau() {
  if (!validatePositive('rl-R', 'rl-L')) return;
  const R = num('rl-R'), L = num('rl-L');
  const tau = L / R;
  $('#rl-tau-result-val').textContent = round(tau, 3);
  $('#rl-tau').textContent = round(tau, 3) + ' мс';
  $('#rl-5tau').textContent = round(tau * 5, 3) + ' мс';
}

/* ===================== LC RESONANCE ===================== */
export function calcLCResonance() {
  if (!validatePositive('lc-L', 'lc-C')) return;
  const L = num('lc-L') / 1000, C = num('lc-C') / 1000000;
  const f = 1 / (2 * Math.PI * Math.sqrt(L * C));
  const w = 2 * Math.PI * f;
  const T = 1 / f * 1000;
  $('#lc-result-val').textContent = Math.round(f);
  $('#lc-f').textContent = Math.round(f) + ' Гц';
  $('#lc-w').textContent = Math.round(w) + ' рад/с';
  $('#lc-T').textContent = round(T, 3) + ' мс';
}

export function calcMotorCap() {
  if(!validate('mc-P')||!validatePositive('mc-U','mc-f')||!validateRange('mc-cos',0.01,1)||!validateRange('mc-eta',0.01,1))return;
  const P=num('mc-P'),U=num('mc-U'),f=num('mc-f'),cos=num('mc-cos'),eta=num('mc-eta'),type=$('#mc-type').value;
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

export function calcCapCode() {
  const code=$('#cc-code').value.trim();
  if(!code){toast(T('common.check_data'));return;}
  let pF;
  if(/^\d{3}$/.test(code)){
    // Трёхзначный код: две значащие цифры и показатель степени.
    // Ограничение именно тремя знаками не случайно: раньше сюда проходил
    // любой код длиной от трёх цифр, и «1041» превращалось в 10·10⁴¹.
    pF=parseInt(code.substring(0,2))*Math.pow(10,parseInt(code.substring(2)));
  } else if(/^\d{1,2}$/.test(code)){
    pF=parseInt(code);
  } else {
    toast('Код должен быть из 1–3 цифр, например 104');return;
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

export function calcCapUnit() {
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

export function calcLED() {
  if(!validate('led-V','led-Vf')||!validatePositive('led-I'))return;
  const V=num('led-V'),Vf=num('led-Vf'),I=num('led-I'),N=num('led-N')||1,conn=$('#led-conn').value;
  const If=I/1000;
  let R,Itotal;
  if(conn==='series'){
    // Последовательно — один общий резистор на всю цепочку.
    R=(V-N*Vf)/If;
    if(R<=0){toast('Напряжение питания меньше суммы падений!');return;}
    Itotal=I;
  } else {
    // Параллельно — свой резистор на каждый светодиод.
    R=(V-Vf)/If;
    if(R<=0){toast('Напряжение питания меньше падения на светодиоде!');return;}
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

export function calcZener() {
  if(!validate('zen-Vin','zen-Vz','zen-IL')||!validatePositive('zen-Iz','zen-Pz'))return;
  const Vin=num('zen-Vin'),Vz=num('zen-Vz'),IL=num('zen-IL'),Iz=num('zen-Iz'),Pzmax=num('zen-Pz');
  if(Vin<=Vz){toast('Vin должен быть больше Vz!');return;}
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

export function calcRLC() {
  if(!validatePositive('rlc-R','rlc-L','rlc-C','rlc-f'))return;
  const R=num('rlc-R'),L=num('rlc-L'),C=num('rlc-C'),f=num('rlc-f'),type=$('#rlc-type').value;
  const XL=2*Math.PI*f*L/1000;
  const XC=1/(2*Math.PI*f*C/1000000);
  const X=XL-XC;
  const fres=1/(2*Math.PI*Math.sqrt(L/1000*C/1000000));
  let Z,phi,Q;
  if(type==='series'){
    Z=Math.sqrt(R*R+X*X);
    phi=Math.atan2(X,R)*180/Math.PI;
    Q=XL/R;
  } else {
    // Параллельный контур: складываются проводимости, а не сопротивления.
    // Реактивная проводимость B = 1/XC − 1/XL, добротность Q = R/XL —
    // раньше здесь брались φ и Q последовательной схемы, и оба были неверны.
    const B=1/XC-1/XL;
    Z=1/Math.sqrt(1/(R*R)+B*B);
    phi=Math.atan2(-B,1/R)*180/Math.PI;
    Q=R/XL;
  }
  $('#rlc-result-val').textContent=round(Z,1);
  $('#rlc-XL').textContent=round(XL,1)+' Ом';
  $('#rlc-XC').textContent=round(XC,1)+' Ом';
  $('#rlc-X').textContent=round(X,1)+' Ом';
  $('#rlc-phi').textContent=round(phi,1)+'°';
  $('#rlc-fres').textContent=Math.round(fres)+' Гц';
  $('#rlc-Q').textContent=round(Q,2);
}

export function calcBridge() {
  if(!validate('wb-R1','wb-R2','wb-R3','wb-R4','wb-V'))return;
  const R1=num('wb-R1'),R2=num('wb-R2'),R3=num('wb-R3'),R4=num('wb-R4'),V=num('wb-V');
  const Vout=V*(R3/(R3+R4)-R2/(R1+R2));
  // Vout обнуляется при R1·R3 = R2·R4 — именно это и есть условие баланса.
  // Прежняя проверка сравнивала R1·R4 с R2·R3 и противоречила самой формуле,
  // а абсолютный порог «< 1» на произведении сопротивлений для килоомных плеч
  // не срабатывал никогда. Сравниваем относительно.
  const p1=R1*R3, p2=R2*R4;
  const scale=Math.max(Math.abs(p1),Math.abs(p2),1e-9);
  const balanced=Math.abs(p1-p2)/scale<1e-6;
  $('#wb-result-val').textContent=round(Vout,3);
  $('#wb-Vout').textContent=round(Vout,3)+' В';
  $('#wb-status').innerHTML=balanced?'<span class="check">Сбалансирован</span>':'<span style="color:var(--warn);font-weight:600">Не сбалансирован</span>';
  $('#wb-prod1').textContent=Math.round(p1);
  $('#wb-prod2').textContent=Math.round(p2);
}
