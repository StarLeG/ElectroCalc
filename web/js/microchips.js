/* EngiCalc — Microchips: NE555, Op-Amp, 7-segment */
'use strict';
import { $, num, round, toast, validate, T } from './core.js';

export function calcAstable() {
  if(!validate('ast-R1','ast-R2','ast-C'))return;
  const R1=num('ast-R1'),R2=num('ast-R2'),C=num('ast-C')/1000000;
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

export function calcMonostable() {
  if(!validate('mono-R','mono-C'))return;
  const R=num('mono-R')*1000,C=num('mono-C')/1000000;
  const t=1.1*R*C;
  $('#mono-result-val').textContent=round(t*1000,1);
}

export function calcInvOpamp() {
  if(!validate('inv-R1','inv-Rf'))return;
  const R1=num('inv-R1'),Rf=num('inv-Rf'),Vin=num('inv-Vin')||0;
  const K=-Rf/R1;
  const Vout=K*Vin;
  $('#inv-result-val').textContent=round(Vout,2);
  $('#inv-K').textContent=round(K,1);
  $('#inv-Vout').textContent=round(Vout,2)+' В';
}

export function calcNonInvOpamp() {
  if(!validate('ninv-R1','ninv-Rf'))return;
  const R1=num('ninv-R1'),Rf=num('ninv-Rf'),Vin=num('ninv-Vin')||0;
  const K=1+Rf/R1;
  const Vout=K*Vin;
  $('#ninv-result-val').textContent=round(Vout,2);
  $('#ninv-K').textContent=round(K,1);
  $('#ninv-Vout').textContent=round(Vout,2)+' В';
}

export function calcSumOpamp() {
  if(!validate('sum-R1','sum-R2','sum-Rf'))return;
  const R1=num('sum-R1'),R2=num('sum-R2'),Rf=num('sum-Rf'),V1=num('sum-V1')||0,V2=num('sum-V2')||0;
  const Vout=-(Rf/R1*V1+Rf/R2*V2);
  $('#sum-result-val').textContent=round(Vout,2);
}

export function calcDiffOpamp() {
  if(!validate('diff-R1','diff-R2','diff-R3','diff-R4'))return;
  const R1=num('diff-R1'),R2=num('diff-R2'),R3=num('diff-R3'),R4=num('diff-R4'),V1=num('diff-V1')||0,V2=num('diff-V2')||0;
  if(!(R1>0)||!(R3+R4>0)){toast(T('common.check_data'));return;}
  // Полная формула: делитель R3/R4 на неинвертирующем входе и обратная связь
  // R2/R1 на инвертирующем. Упрощение (R2/R1)·(V1−V2) верно только при
  // R3/R4 = R1/R2 — раньше R3 и R4 читались, но в расчёт не входили вовсе.
  const Vout=V1*(R4/(R3+R4))*((R1+R2)/R1)-V2*(R2/R1);
  $('#diff-result-val').textContent=round(Vout,2);
}

export function calc7segRes() {
  if(!validate('s7r-V','s7r-Vf','s7r-I'))return;
  const V=num('s7r-V'),Vf=num('s7r-Vf'),I=num('s7r-I')/1000,N=num('s7r-N')||7,type=$('#s7r-type').value;
  const R=(V-Vf)/I;
  if(R<=0){toast('Напряжение питания меньше Vf!');return;}
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

export function calc7segDec() {
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
  const inv=type==='ca';
  // Для общего анода сегмент зажигается низким уровнем, поэтому и код на порт
  // инвертируется. Раньше таблица сегментов ниже инверсию учитывала, а HEX —
  // нет, и два вывода на одной странице противоречили друг другу.
  const bits=['a','b','c','d','e','f','g'].map(s=>inv?(seg[s]?0:1):seg[s]);
  const hexVal=bits.reduce((acc,v,i)=>acc|(v<<(6-i)),0);
  $('#s7d-display').textContent=ch;
  $('#s7d-hex').textContent='HEX: 0x'+hexVal.toString(16).toUpperCase().padStart(2,'0')+' (abcdefg, a — старший бит)';
  ['a','b','c','d','e','f','g'].forEach((s,i)=>{
    const v=bits[i];
    const el=$('#s7d-'+s);
    if(!el)return;
    el.textContent=v;
    el.style.color=v?'var(--result)':'var(--error)';
  });
}
