/* EngiCalc — KIPIA, pneumatics, hydraulics */
'use strict';
import { $, num, round, toast, validate, T } from './core.js';
import { rtdR0, rtdResistance, rtdTemperature, RTD_RANGE } from './data/rtd.js';

export function calcCurrentLoop() {
  if(!validate('cl-V','cl-Vmin','cl-Rw','cl-Ri'))return;
  const V=num('cl-V'),Vmin=num('cl-Vmin'),Rw=num('cl-Rw'),Ri=num('cl-Ri'),Rb=num('cl-Rb')||0;
  const Rmax=(V-Vmin)/0.02,Rsum=Rw+Ri+Rb,ok=Rsum<=Rmax;
  // id намеренно отличается от cl-result-val: тот занят страницей «Потери в кабеле».
  const el=$('#cl-loop-result-val');
  el.textContent=ok?T('kipia.loop_valid'):T('kipia.loop_invalid');
  el.style.color=ok?'var(--result)':'var(--error)';
  $('#cl-Rmax').textContent=round(Rmax,0)+' Ом';
  $('#cl-Rsum').textContent=Rsum+' Ом';
  $('#cl-Vdrop').textContent=round(0.02*Rsum,2)+' В';
  $('#cl-status').innerHTML=ok?'<span class="check">OK</span>':'<span style="color:var(--error);font-weight:600">FAIL</span>';
}

export function calcScaling() {
  if(!validate('sc-signal','sc-Smin','sc-Smax','sc-LRV','sc-URV'))return;
  const sig=num('sc-signal'),Smin=num('sc-Smin'),Smax=num('sc-Smax'),LRV=num('sc-LRV'),URV=num('sc-URV');
  if(Smax===Smin){toast('Min и Max сигнал не могут быть равны!');return;}
  $('#sc-scale-val').textContent=round(LRV+(sig-Smin)/(Smax-Smin)*(URV-LRV),2);
  $('#sc-scale-pct').textContent=round((sig-Smin)/(Smax-Smin)*100,1)+' %';
}

export function calcRTD() {
  const mode=$('#rtd-mode').value,val=num('rtd-val'),type=$('#rtd-type').value;
  // Отрицательная температура для термосопротивления — штатный режим, поэтому
  // здесь нельзя требовать val > 0: ограничение остаётся только для Ом.
  if(isNaN(val)){toast(T('common.check_data'));return;}
  const R0=rtdR0(type);
  if(mode==='t2r'){
    if(val<RTD_RANGE[0]||val>RTD_RANGE[1]){toast(`Диапазон ${RTD_RANGE[0]}…${RTD_RANGE[1]} °C`);return;}
    $('#rtd-result-val').textContent=round(val,2)+' °C';
    $('#rtd-result-unit').textContent='→ '+round(rtdResistance(R0,val),3)+' Ом';
  } else {
    if(!(val>0)){toast(T('common.check_data'));return;}
    const t=rtdTemperature(R0,val);
    $('#rtd-result-val').textContent=round(val,3)+' Ом';
    $('#rtd-result-unit').textContent='→ '+round(t,2)+' °C';
  }
}

export function calcPID() {
  if(!validate('pid-Ku','pid-Tu'))return;
  const Ku=num('pid-Ku'),Tu=num('pid-Tu');
  const Kp=0.6*Ku,Ti=0.5*Tu,Td=0.125*Tu;
  $('#pid-result-val').textContent='Kp = '+round(Kp,3);
  $('#pid-Ti').textContent=round(Ti,2)+' с';
  $('#pid-Td').textContent=round(Td,2)+' с';
  $('#pid-Ki').textContent=round(Kp/Ti,4);
  $('#pid-Kd').textContent=round(Kp*Td,4);
}

export function calcAccuracy() {
  if(!validate('acc-cl','acc-range','acc-bits'))return;
  const cl=num('acc-cl'),range=num('acc-range'),bits=num('acc-bits');
  const abs=cl/100*range;
  $('#acc-result-val').textContent='±'+round(abs,3);
  $('#acc-abs').textContent=round(abs,3);
  $('#acc-lsb').textContent=round(range/Math.pow(2,bits),4);
}

export function calcPneumFlow() {
  if(!validate('pf-N','pf-q','pf-k'))return;
  const N=num('pf-N'),q=num('pf-q'),k=num('pf-k'),leak=num('pf-leak')||0;
  const Qavg=N*q*k,Qpeak=N*q,Qleaks=Qavg*(1+leak);
  $('#pf-result-val').textContent=round(Qavg,0);
  $('#pf-peak').textContent=round(Qpeak,0)+' л/мин';
  $('#pf-leaks').textContent=round(Qleaks,0)+' л/мин';
}

export function calcPneumCyl() {
  if(!validate('pc-D','pc-P'))return;
  const D=num('pc-D'),d=num('pc-d')||0,L=num('pc-L')||0,P=num('pc-P'),Q=num('pc-Q')||0;
  const A=Math.PI*D*D/400,Arod=Math.PI*d*d/400;
  const Ffwd=P*A*10*0.95,Fback=P*(A-Arod)*10*0.95;
  const speed=Q>0?Q*1000/(A*60)/100:0,time=speed>0?L/1000/speed:0,volume=A*L/10000;
  $('#pc-result-val').textContent=round(Ffwd,0);
  $('#pc-Fback').textContent=round(Fback,0)+' Н';
  $('#pc-speed').textContent=round(speed,2)+' м/с';
  $('#pc-time').textContent=round(time,2)+' с';
  $('#pc-V').textContent=round(volume,2)+' л';
}

export function calcPneumComp() {
  if(!validate('pcomp-Q','pcomp-P','pcomp-k'))return;
  const Q=num('pcomp-Q'),P=num('pcomp-P'),k=num('pcomp-k'),t=num('pcomp-t')||0;
  const Qcomp=Q*k,power=Qcomp*P/(600*0.7),tank=t>0?Qcomp*t/(P+1):0;
  $('#pcomp-result-val').textContent=round(Qcomp,0);
  $('#pcomp-power').textContent=round(power,1)+' кВт';
  $('#pcomp-tank').textContent=round(tank,0)+' л';
}

export function calcHydCyl() {
  if(!validate('hc-D','hc-P','hc-Q'))return;
  const D=num('hc-D'),d=num('hc-d')||0,L=num('hc-L')||0,P=num('hc-P'),Q=num('hc-Q'),eta=num('hc-eta')||0.9;
  const Api=Math.PI*D*D/4,Arod=Math.PI*d*d/4;
  const Fpush=P*Api*eta/10000,Fpull=P*(Api-Arod)*eta/10000;
  const speed=Q/(Api*60000/1e6),time=speed>0?L/1000/speed:0,power=P*Q/600;
  $('#hc-result-val').textContent=round(Fpush,1);
  $('#hc-Fpull').textContent=round(Fpull,1)+' кН';
  $('#hc-speed').textContent=round(speed,2)+' м/с';
  $('#hc-time').textContent=round(time,2)+' с';
  $('#hc-power').textContent=round(power,1)+' кВт';
}

export function calcHydPump() {
  if(!validate('hp-Q','hp-P'))return;
  const Q=num('hp-Q'),P=num('hp-P'),etaP=num('hp-eta')||0.8,etaM=num('hp-etaM')||0.9;
  const N=P*Q/(600*etaP*etaM),V=Q*1000/1450;
  const type=P<=100?'Шестерёнчатый':P<=250?'Аксиально-поршневой':'Радиально-поршневой';
  $('#hp-result-val').textContent=round(N,1);
  $('#hp-type').textContent=type;
  $('#hp-V').textContent=round(V,1)+' см³';
}

export function calcHydPipe() {
  if(!validate('hpp-L','hpp-D','hpp-Q'))return;
  const L=num('hpp-L'),D=num('hpp-D'),Q=num('hpp-Q'),nu=num('hpp-nu')||32;
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
