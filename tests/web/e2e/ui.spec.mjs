/* Сквозные проверки интерфейса для всех страниц калькуляторов.
 *
 * — Ни одна подпись не показывает сырой ключ перевода (T() возвращает ключ,
 *   если перевода нет, и applyI18n() вставляет его в разметку как есть).
 * — У каждого поля ввода есть подпись: <label for>, обёртка <label> или aria-label.
 * — Переключение языка меняет и единицы в результате.
 * — Кнопка «Сбросить» возвращает исходные значения.
 * — Ни одна страница не падает с ошибкой JavaScript при загрузке.
 */
import { test, expect } from '@playwright/test';
import { PAGES } from '../../../web/js/data/pages-meta.js';
import { openCalc, fillFields, calculate, knownDefect } from './helpers.mjs';

/** Служебные страницы без калькуляторов. */
const NOT_CALCULATORS = new Set(['help', 'developer', 'donate', 'editor']);
const CALC_PAGES = PAGES.map(p => p.id).filter(id => !NOT_CALCULATORS.has(id));

/**
 * Страницы, где на момент написания тестов не хватает переводов.
 * Ключ — `${lang}:${pageId}`, значение — найденные ключи. Заполнено по
 * результатам прогона: каждая запись — подтверждённый дефект словаря.
 */
const MISSING_I18N = {
  'ru:grounding': 'grounding.formula', 'en:grounding': 'grounding.formula',
  'ru:transformer': 'transformer.cos_phi', 'en:transformer': 'transformer.cos_phi',
};

for (const lang of ['ru', 'en']) {
  test.describe(`переводы (${lang})`, () => {
    for (const id of CALC_PAGES) {
      test(`${id}: нет сырых ключей перевода`, async ({ page }) => {
        const known = MISSING_I18N[`${lang}:${id}`];
        if (known) knownDefect(`в словаре ${lang} нет ключей: ${known}`);
        await page.addInitScript(l => localStorage.setItem('lang', l), lang);
        await openCalc(page, id);
        const raw = await page.$$eval('[data-i18n]', els => els
          .filter(el => el.textContent.trim() === el.dataset.i18n)
          .map(el => el.dataset.i18n));
        expect(raw, 'ключи без перевода').toEqual([]);
        expect(page.pageErrors).toEqual([]);
      });
    }
  });
}

test.describe('подписи полей', () => {
  for (const id of CALC_PAGES) {
    test(`${id}: у каждого поля ввода есть подпись`, async ({ page }) => {
      await openCalc(page, id);
      const unlabeled = await page.$$eval(`#page-${id} input:not([type=hidden]):not([type=radio]), #page-${id} select`, els => els
        .filter(el => el.id && !el.closest('table'))
        .filter(el => !document.querySelector(`label[for="${el.id}"]`) && !el.closest('label') && !el.getAttribute('aria-label'))
        .map(el => el.id));
      expect(unlabeled, 'поля без подписи').toEqual([]);
    });
  }
});

test.describe('язык интерфейса', () => {
  test('в английской версии единицы результата тоже английские', async ({ page }) => {
    knownDefect('calcPower() пишет в результат «Ампер», «А», «кВА» строками в коде — после расчёта в английской версии остаются русские единицы');
    await page.addInitScript(() => localStorage.setItem('lang', 'en'));
    await openCalc(page, 'power');
    await calculate(page, 'btn-power-calc');
    await expect(page.locator('#power-result-unit')).not.toHaveText('Ампер');
    await expect(page.locator('#power-S')).not.toContainText('кВА');
  });

  test('кнопка языка переключает подписи на странице', async ({ page }) => {
    await openCalc(page, 'power');
    await expect(page.locator('label[for="p-power"]')).toContainText('Мощность');
    await page.locator('.btn-lang').click();
    await expect(page.locator('label[for="p-power"]')).not.toContainText('Мощность');
  });
});

test.describe('сброс', () => {
  test('«Сбросить» возвращает исходные значения полей', async ({ page }) => {
    await openCalc(page, 'voltage');
    await fillFields(page, { 'v-I': 99, 'v-L': 12, 'v-cos': 0.5 });
    await page.locator('#btn-voltage-reset').click();
    await expect(page.locator('#v-I')).toHaveValue('10');
    await expect(page.locator('#v-L')).toHaveValue('100');
    await expect(page.locator('#v-cos')).toHaveValue('0.85');
  });

  test('после сброса расчёт снова даёт исходный результат', async ({ page }) => {
    await openCalc(page, 'shortcircuit');
    await fillFields(page, { 'sc-Z': 1 });
    await page.locator('#btn-sc-reset').click();
    await calculate(page, 'btn-sc-calc');
    await expect(page.locator('#sc-result-val')).toHaveText('2194');
  });
});
