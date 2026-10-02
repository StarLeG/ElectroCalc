/* Офлайн-режим: сайт обещает работать без сети после первого посещения.
 *
 * Сценарий как у пользователя: открыть страницу при наличии сети, дождаться,
 * пока service worker заполнит кэш, отключить сеть, перезагрузить страницу
 * и посчитать. Здесь service worker, в отличие от остальных тестов, включён.
 */
import { test, expect } from '@playwright/test';
import { knownDefect } from './helpers.mjs';

test.use({ serviceWorkers: 'allow' });

/**
 * Дождаться, пока service worker возьмёт страницу под контроль и заполнит
 * прекэш: install кэширует файлы поштучно, поэтому ждём, когда число записей
 * перестанет расти.
 */
async function waitForPrecache(page) {
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.waitForFunction(async () => {
    const names = await caches.keys();
    if (!names.length) return false;
    const cache = await caches.open(names[0]);
    const count = (await cache.keys()).length;
    const prev = window.__precacheCount;
    window.__precacheCount = count;
    return count > 50 && prev === count;
  }, null, { polling: 500, timeout: 20_000 });
}

for (const pageId of ['power', 'protection']) {
  test(`/${pageId}/ открывается и считает без сети после первого визита`, async ({ page, context }) => {
    knownDefect('в STATIC_ASSETS нет /js/protection.js, /js/data/protection-data.js и /js/data/help-data.js: ' +
      'app.js импортирует их статически, и без сети падает загрузка всего приложения на любой странице');
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`/${pageId}/`);
    await waitForPrecache(page);

    await context.setOffline(true);
    await page.reload();
    await expect(page.locator(`#page-${pageId}`)).toBeVisible();

    if (pageId === 'power') {
      await page.locator('#p-power').fill('15');
      await page.locator('#btn-power-calc').click();
      await expect(page.locator('#power-result-val')).not.toHaveText('4.27');
    } else {
      await page.locator('#btn-prb-calc').click();
      await expect(page.locator('#prb-result-val')).not.toHaveText('—');
    }
    expect(errors).toEqual([]);
  });
}
