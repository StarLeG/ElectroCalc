/* EngiCalc — Cable networks: derating, diameter→section, converter */
'use strict';
import { $, num, round, toast, validate, T } from './core.js';
import {
  ALL_SECTIONS, K_TEMP_AIR, K_TEMP_GROUND, K_GROUP, K_LAYING,
  GROUND_LAYINGS, interpolateK
} from './data/cable-data.js';

export function calcDerating() {
  if(!validate('dr-I','dr-T','dr-N'))return;
  const Ibase=num('dr-I'),temp=num('dr-T'),N=num('dr-N');
  const method=$('#dr-method')?.value||'air';
  const inGround=GROUND_LAYINGS.includes(method);
  const kt=interpolateK(inGround?K_TEMP_GROUND:K_TEMP_AIR,temp);
  const kg=interpolateK(K_GROUP,N);
  const klay=K_LAYING[method]??1;
  const ktotal=kt*kg*klay,Iallow=Ibase*ktotal,reduction=(1-ktotal)*100;
  $('#dr-result-val').textContent=round(Iallow,1);
  $('#dr-kt').textContent=round(kt,2);
  $('#dr-kg').textContent=round(kg,2);
  $('#dr-ktotal').textContent=round(ktotal,2);
  $('#dr-red').textContent=round(reduction,1)+' %';
}

export function calcDiam2Sec() {
  if(!validate('ds-d'))return;
  const d=num('ds-d'),n=num('ds-n')||1;
  const S=Math.PI*d*d/4;
  const Stotal=S*n;
  const circ=Math.PI*d;
  const nearest=ALL_SECTIONS.reduce((a,b)=>Math.abs(b-Stotal)<Math.abs(a-Stotal)?b:a);
  $('#ds-result-val').textContent=round(Stotal,2);
  $('#ds-S').textContent=round(S,2)+' мм²';
  $('#ds-Circ').textContent=round(circ,2)+' мм';
  $('#ds-Stotal').textContent=round(Stotal,2)+' мм²';
  $('#ds-nearest').textContent=nearest+' мм²';
}

export function calcConverter() {
  const type=$('#conv-type').value,val=num('conv-val');
  if(isNaN(val)){toast(T('common.check_data'));return;}
  let result='',formula='';
  switch(type){
    // === Электрика ===
    case'mm2_awg':{const awg=Math.round(-39*Math.log2(val/0.162)/10+36);result=`${round(0.162*Math.pow(2,(36-awg)*10/39),2)} мм² = AWG ${awg}`;formula='AWG = −39 × log₂(S/0.162)/10 + 36';break;}
    case'a_ma':result=`${val} А = ${round(val*1000,2)} мА | ${val} мА = ${round(val/1000,6)} А`;formula='1 А = 1000 мА';break;
    case'v_mv':result=`${val} В = ${round(val*1000,2)} мВ | ${val} мВ = ${round(val/1000,6)} В`;formula='1 В = 1000 мВ';break;
    case'v_kv':result=`${val} В = ${round(val/1000,4)} кВ | ${val} кВ = ${round(val*1000,1)} В`;formula='1 кВ = 1000 В';break;
    case'ohm_kohm':result=`${val} Ом = ${round(val/1000,4)} кОм | ${val} кОм = ${round(val*1000,1)} Ом`;formula='1 кОм = 1000 Ом';break;
    case'ohm_mohm':result=`${val} Ом = ${round(val/1000000,6)} мОм | ${val} мОм = ${round(val*1000000,1)} Ом`;formula='1 мОм = 10⁶ Ом';break;
    case'w_kw':result=`${val} Вт = ${round(val/1000,4)} кВт | ${val} кВт = ${round(val*1000,1)} Вт`;formula='1 кВт = 1000 Вт';break;
    case'kva_kvar':{const cos=0.85,kw=val*cos;result=`${val} кВА = ${round(kw,1)} кВт (cos φ=0.85) = ${round(Math.sqrt(Math.max(0,val*val-kw*kw)),1)} квар`;formula='S² = P² + Q²';break;}
    case'ah_mah':result=`${val} А·ч = ${round(val*1000,1)} мА·ч | ${val} мА·ч = ${round(val/1000,4)} А·ч`;formula='1 А·ч = 1000 мА·ч';break;
    case'kw_hp':result=`${val} кВт = ${round(val*1.341,2)} л.с. | ${val} л.с. = ${round(val/1.341,2)} кВт`;formula='1 л.с. = 0.7457 кВт';break;

    // === Электроника ===
    case'hz_khz':result=`${val} Гц = ${round(val/1000,4)} кГц | ${val} кГц = ${round(val*1000,1)} Гц`;formula='1 кГц = 1000 Гц';break;
    case'hz_mhz':result=`${val} Гц = ${round(val/1000000,6)} МГц | ${val} МГц = ${round(val*1000000,1)} Гц`;formula='1 МГц = 10⁶ Гц';break;
    case'f_uf':result=`${val} Ф = ${round(val*1000000,1)} мкФ | ${val} мкФ = ${round(val/1000000,9)} Ф`;formula='1 Ф = 10⁶ мкФ';break;
    case'f_nf':result=`${val} Ф = ${round(val*1000000000,1)} нФ | ${val} нФ = ${round(val/1000000000,12)} Ф`;formula='1 Ф = 10⁹ нФ';break;
    case'uf_pf':result=`${val} мкФ = ${round(val*1000000,1)} пФ | ${val} пФ = ${round(val/1000000,9)} мкФ`;formula='1 мкФ = 10⁶ пФ';break;
    case'h_mh':result=`${val} Гн = ${round(val*1000,2)} мГн | ${val} мГн = ${round(val/1000,6)} Гн`;formula='1 Гн = 1000 мГн';break;
    case'h_uh':result=`${val} Гн = ${round(val*1000000,1)} мкГн | ${val} мкГн = ${round(val/1000000,9)} Гн`;formula='1 Гн = 10⁶ мкГн';break;
    case'w_dbm':result=`${val} Вт = ${round(10*Math.log10(Math.max(val,1e-15)/0.001),1)} дБм | ${val} дБм = ${round(0.001*Math.pow(10,val/10),6)} Вт`;formula='дБм = 10 × log₁₀(P/1мВт)';break;
    case'db_times':{const times=Math.pow(10,val/20);result=`${val} дБ = ×${round(times,3)} | ×${val} = ${round(20*Math.log10(Math.max(val,1e-15)),1)} дБ`;formula='дБ = 20 × log₁₀(коэф.)';break;}

    // === КИПиА ===
    case'ma_pct':{const pct=(val-4)/(20-4)*100;const ma=4+pct/100*(20-4);result=`${val} мА = ${round(pct,2)} % | ${val} % = ${round(ma,2)} мА`;formula='% = (мА−4)/(20−4) × 100';break;}
    case'bar_kpa':result=`${val} бар = ${round(val*100,1)} кПа | ${val} кПа = ${round(val/100,4)} бар`;formula='1 бар = 100 кПа';break;
    case'bar_mpa':result=`${val} бар = ${round(val*0.1,4)} МПа | ${val} МПа = ${round(val*10,1)} бар`;formula='1 бар = 0.1 МПа';break;
    case'bar_atm':result=`${val} бар = ${round(val*0.9869,4)} атм | ${val} атм = ${round(val/0.9869,4)} бар`;formula='1 бар = 0.9869 атм';break;
    case'bar_psi':result=`${val} бар = ${round(val*14.5038,2)} psi | ${val} psi = ${round(val/14.5038,4)} бар`;formula='1 бар = 14.504 psi';break;
    case'lmin_m3h':result=`${val} л/мин = ${round(val*0.06,3)} м³/ч | ${val} м³/ч = ${round(val/0.06,2)} л/мин`;formula='1 л/мин = 0.06 м³/ч';break;
    case'c_f':result=`${val}°C = ${round(val*9/5+32,1)}°F | ${val}°F = ${round((val-32)*5/9,1)}°C`;formula='°F = °C × 9/5 + 32';break;
    case'c_k':result=`${val}°C = ${round(val+273.15,2)} K | ${val} K = ${round(val-273.15,2)}°C`;formula='K = °C + 273.15';break;

    // === Общие ===
    case'inch_mm':result=`${val} дюйм = ${round(val*25.4,2)} мм | ${val} мм = ${round(val/25.4,4)} дюйм`;formula='1 дюйм = 25.4 мм';break;
    case'nm_kgsm':result=`${val} Н·м = ${round(val*0.10197,4)} кгс·м | ${val} кгс·м = ${round(val*9.8067,2)} Н·м`;formula='1 Н·м = 0.10197 кгс·м';break;
    case'ft_m':result=`${val} фут = ${round(val*0.3048,4)} м | ${val} м = ${round(val/0.3048,2)} фут`;formula='1 фут = 0.3048 м';break;
    case'yard_m':result=`${val} ярд = ${round(val*0.9144,4)} м | ${val} м = ${round(val/0.9144,2)} ярд`;formula='1 ярд = 0.9144 м';break;
  }
  $('#conv-result').value=result;
  // Show formula
  const formulaPanel=$('#conv-formula');
  const formulaText=$('#conv-formula-text');
  if(formula&&formulaPanel&&formulaText){
    formulaText.textContent=formula;
    formulaPanel.style.display='block';
  }
}
