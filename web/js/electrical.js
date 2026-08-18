/* EngiCalc — Electrical calculations */
'use strict';
import { $, num, round, toast, validate, validateRange, T } from './core.js';
import { RCD_RATINGS, nextStandard } from './data/cable-data.js';

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
  $('#pr-result-val').textContent=nextStandard(RCD_RATINGS,leak*3)||RCD_RATINGS[RCD_RATINGS.length-1];
}
