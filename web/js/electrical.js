/* EngiCalc — Electrical calculations */
'use strict';
import { $, num, round, toast, validate, validateRange, T } from './core.js';

export function calcPower() {
  if(!validate('p-power','p-u','p-eta')||!validateRange('p-cos',0.01,1))return;
  const P=num('p-power'),U=num('p-u'),phase=num('p-phase'),cos=num('p-cos'),eta=num('p-eta');
  const I=phase===3?P*1000/(Math.sqrt(3)*U*cos*eta):P*1000/(U*cos*eta);
  const S=phase===3?Math.sqrt(3)*U*I/1000:U*I/1000;
  $('#power-result-val').textContent=round(I,2);
  $('#power-result-unit').textContent='Ампер';
  $('#power-result-desc').textContent=T('power.desc');
  $('#power-I').textContent=round(I,2)+' А';
  $('#power-S').textContent=round(S,2)+' кВА';
}

export function calcCable() {
  const I=num('c-I'),mat=$('#c-mat').value,L=num('c-L'),U=num('c-U');
  if(!I||!L||!U){toast(T('common.check_data'));return;}
  const j=mat==='Cu'?10:6,S=I/j,d=2*Math.sqrt(S/Math.PI);
  $('#cable-result-val').textContent=round(S,2);
  $('#cable-d').textContent=round(d,2)+' мм';
  const std=[0.5,0.75,1,1.5,2.5,4,6,10,16,25,35,50,70,95,120];
  const Sactual=std.find(s=>s>=S)||std[std.length-1];
  const jActual=I/Sactual;
  const jMax=mat==='Cu'?10:6;
  const heatOk=jActual<=jMax;
  $('#cable-heat').textContent=heatOk?'✓ Проходит':'✗ '+round(jActual,1)+' А/мм² > '+jMax;
  $('#cable-heat').className=heatOk?'check':'';
  if(!heatOk)$('#cable-heat').style.color='var(--error)';
  const densityOk=Sactual>=S;
  $('#cable-density').textContent=densityOk?'✓ Проходит':'✗ Малое сечение';
  $('#cable-density').className=densityOk?'check':'';
  if(!densityOk)$('#cable-density').style.color='var(--error)';
  const R=mat==='Cu'?0.0175:0.028;
  const dU=2*I*L*R/Sactual;
  const pct=dU/U*100;
  const lossOk=pct<=5;
  $('#cable-loss').textContent=lossOk?'✓ '+round(pct,1)+'%':'✗ '+round(pct,1)+'% > 5%';
  $('#cable-loss').className=lossOk?'check':'';
  if(!lossOk)$('#cable-loss').style.color='var(--error)';
}

export function calcVoltage() {
  if(!validate('v-I','v-L','v-R','v-X','v-U')||!validateRange('v-cos',0.01,1))return;
  const I=num('v-I'),L=num('v-L'),R=num('v-R'),X=num('v-X'),U=num('v-U'),cos=num('v-cos');
  const sin=Math.sqrt(1-cos*cos),dU=Math.sqrt(3)*I*L*(R*cos+X*sin)/1000,pct=dU/U*100;
  $('#voltage-result-val').textContent=round(pct,2);
  $('#voltage-pct').textContent=round(pct,2)+' %';
  $('#voltage-V').textContent=round(dU,1)+' В';
}

export function calcShortCircuit() {
  if(!validate('sc-U','sc-Z'))return;
  const U=num('sc-U'),Z=num('sc-Z');
  $('#sc-result-val').textContent=Math.round(U/(Math.sqrt(3)*Z));
  $('#sc-Z-val').textContent=Z.toFixed(3)+' Ом';
}

export function calcGrounding() {
  if(!validate('g-rho','g-L','g-d','g-Rreq'))return;
  const rho=num('g-rho'),L=num('g-L'),d=num('g-d'),Rreq=num('g-Rreq');
  const R1=rho/(2*Math.PI*L)*Math.log(4*L/d);
  $('#g-result-val').textContent=Math.ceil(R1/(Rreq*0.65));
}

export function calcProtection() {
  if(!validate('pr-leak'))return;
  const leak=num('pr-leak');
  const std=[10,30,100,300,500];
  $('#pr-result-val').textContent=std.find(v=>v>=leak*3)||std[std.length-1];
}
