/* EngiCalc — панель справки
 *
 * Тексты лежат в data/help-data.js: их читает ещё и генератор страниц,
 * поэтому они не должны зависеть от DOM. Здесь — только показ панели.
 */
'use strict';
import { $, lang } from './core.js';
import { HELP_RU, HELP_EN } from './data/help-data.js';

const HELP_CONTENT = { ru: HELP_RU, en: HELP_EN };

export function toggleHelp() {
  const panel = $('#help-panel');
  const overlay = $('#help-overlay');
  if (!panel) return;
  const isOpen = panel.classList.contains('open');
  if (isOpen) {
    panel.classList.remove('open');
    overlay?.classList.remove('show');
  } else {
    const page = $('.page.active')?.id?.replace('page-', '');
    const helpData = HELP_CONTENT[lang]?.[page] || HELP_CONTENT.ru[page];
    const content = $('#help-content');
    if (content && helpData) {
      content.innerHTML = '<h3>' + helpData.title + '</h3>' + helpData.body;
    } else if (content) {
      const msg = lang === 'en' ? 'Select a calculator to see help.' : 'Выберите калькулятор, чтобы увидеть справку.';
      content.innerHTML = '<p style="color:var(--text-muted)">' + msg + '</p>';
    }
    panel.classList.add('open');
    overlay?.classList.add('show');
  }
}
