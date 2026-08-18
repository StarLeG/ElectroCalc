/* EngiCalc — Equipment calculations */
'use strict';
import { $, $$, num, round, toast, validate, validatePositive, validateRange, T } from './core.js';
import { BREAKER_RATINGS, nextStandard } from './data/cable-data.js';

export function calcCompensation() {
  if(!validatePositive('comp-P','comp-step')||!validateRange('comp-cos1',0.01,1)||!validateRange('comp-cos2',0.01,1))return;
  const P=num('comp-P'),cos1=num('comp-cos1'),cos2=num('comp-cos2'),step=num('comp-step');
  const tg1=Math.sqrt(1-cos1*cos1)/cos1,tg2=Math.sqrt(1-cos2*cos2)/cos2;
  const Qc=P*(tg1-tg2),Q1=P*tg1,Q2=P*tg2;
  $('#comp-result-val').textContent=round(Qc,1);
  $('#comp-steps').textContent=Math.ceil(Qc/step);
  $('#comp-Q1').textContent=round(Q1,1);
  $('#comp-Q2').textContent=round(Q2,1);
  // При cos φ = 1 реактивной мощности изначально нет — делить не на что.
  $('#comp-save').textContent=Q1>0?round((1-Q2/Q1)*100,1)+' %':'—';
}

export function calcMotor() {
  if(!validate('m-P','m-k')||!validatePositive('m-U')||!validateRange('m-cos',0.01,1)||!validateRange('m-eta',0.01,1))return;
  const P=num('m-P'),U=num('m-U'),cos=num('m-cos'),eta=num('m-eta'),k=num('m-k');
  const I=P*1000/(Math.sqrt(3)*U*cos*eta);
  $('#m-result-val').textContent=round(I,1)+' А';
  $('#m-Istart').textContent=Math.round(I*k)+' А';
  $('#m-breaker').textContent=(nextStandard(BREAKER_RATINGS,I*1.25)??'—')+' А';
  $('#m-section').textContent=round(I/6,1)+' мм²';
}

export function calcTransformer() {
  if(!validate('t-P')||!validatePositive('t-Uvn','t-unn','t-uk')||!validateRange('t-cos',0.01,1))return;
  const P=num('t-P'),cos=num('t-cos'),Uvn=num('t-Uvn'),unn=num('t-unn'),uk=num('t-uk');
  const S=P/cos;
  $('#t-result-val').textContent=round(S,0)+' кВА';
  $('#t-Ivn').textContent=round(S/(Math.sqrt(3)*Uvn),1)+' А';
  $('#t-Inn').textContent=round(S/(Math.sqrt(3)*unn),1)+' А';
  $('#t-Ikz').textContent=Math.round(S/(Math.sqrt(3)*unn)*100/uk)+' А';
  $('#t-load').textContent=round(P/S,2);
}

export function calcLighting() {
  if(!validate('l-S','l-E','l-W')||!validatePositive('l-phi','l-eta'))return;
  const S=num('l-S'),E=num('l-E'),phi=num('l-phi'),W=num('l-W'),eta=num('l-eta');
  const N=Math.ceil(E*S/(phi*eta));
  $('#l-result-val').textContent=N;
  $('#l-P').textContent=N*W+' Вт';
  $('#l-ud').textContent=round(N*W/S,1)+' Вт/м²';
}

export function calcUPS() {
  if(!validate('u-P','u-t')||!validatePositive('u-U','u-eta'))return;
  const P=num('u-P'),t=num('u-t'),U=num('u-U'),eta=num('u-eta');
  const Ah=P*1000*t/(60*U*eta*0.8);
  $('#u-result-val').textContent=Math.round(Ah);
  $('#u-Ah').textContent=Math.round(Ah)+' А·ч';
  $('#u-gen').textContent=round(P/0.8/eta,2)+' кВА';
}

export function calcLoadPanel() {
  const rows=document.querySelectorAll('#load-table tbody tr');
  const U=num('lp-U')||380;
  let Ptotal=0;
  const phaseP={1:0,2:0,3:0};
  const phaseCos={1:[],2:[],3:[]};
  rows.forEach(row=>{
    const P=parseFloat(row.querySelector('.tbl-p')?.value)||0;
    const cos=parseFloat(row.querySelector('.tbl-cos')?.value)||0.85;
    const ks=parseFloat(row.querySelector('.tbl-ks')?.value)||1;
    const phase=parseInt(row.querySelector('.tbl-phase')?.value)||1;
    const Prated=P*ks;
    Ptotal+=Prated;
    phaseP[phase]+=Prated;
    if(cos>0)phaseCos[phase].push({p:Prated,cos});
  });
  function avgCos(arr){
    if(!arr.length)return 0.85;
    let pSum=0,pcSum=0;
    arr.forEach(({p,cos})=>{pSum+=p;pcSum+=p/cos;});
    return pSum/pcSum;
  }
  const cos1=avgCos(phaseCos[1]),cos2=avgCos(phaseCos[2]),cos3=avgCos(phaseCos[3]);
  // Группа висит между фазой и нулём, поэтому ток считается по ФАЗНОМУ напряжению.
  // В поле вводится линейное (380 В), фазное меньше в √3 — раньше делили на
  // линейное и занижали все три тока в 1.73 раза.
  const Uph=U/Math.sqrt(3);
  const IL1=phaseP[1]/(Uph/1000*cos1),IL2=phaseP[2]/(Uph/1000*cos2),IL3=phaseP[3]/(Uph/1000*cos3);
  const Imax=Math.max(IL1,IL2,IL3),Imin=Math.min(IL1,IL2,IL3);
  const imbalance=Imax>0?((Imax-Imin)/Imax*100):0;
  $('#lp-Ptotal').textContent=round(Ptotal,1)+' кВт';
  $('#lp-Pcalc').textContent=round(Ptotal*0.9,1)+' кВт';
  $('#lp-IL1').textContent=round(IL1,1)+' А';
  $('#lp-IL2').textContent=round(IL2,1)+' А';
  $('#lp-IL3').textContent=round(IL3,1)+' А';
  $('#lp-imb').textContent=round(imbalance,1)+' %';
}

export function addLoadRow() {
  const tbody=document.querySelector('#load-table tbody');
  if(!tbody)return;
  const tr=document.createElement('tr');
  tr.innerHTML='<td><input type="text" value="Новая группа" class="tbl-input"></td><td><input type="number" value="1.0" step="0.1" class="tbl-input tbl-p"></td><td><input type="number" value="0.85" step="0.01" class="tbl-input tbl-cos"></td><td><input type="number" value="0.8" step="0.1" class="tbl-input tbl-ks"></td><td><select class="tbl-input tbl-phase"><option value="1">L1</option><option value="2">L2</option><option value="3">L3</option></select></td>';
  tbody.appendChild(tr);
}

/** Убирает последнюю группу, не давая опустошить таблицу. */
export function removeLoadRow() {
  const tbody=document.querySelector('#load-table tbody');
  if(tbody&&tbody.children.length>1)tbody.removeChild(tbody.lastElementChild);
}
