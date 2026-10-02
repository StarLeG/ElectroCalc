/* Офлайн-режим: service worker обязан заранее закэшировать всё, без чего
 * калькулятор не запустится.
 *
 * Пропущенный в STATIC_ASSETS модуль офлайн отдаётся как ошибка, и вместе с
 * ним падает весь граф импортов app.js — сайт перестаёт открываться без сети.
 * Поэтому граф обходится от точки входа так же, как это делает браузер.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGES } from '../../../web/js/data/pages-meta.js';
import { knownDefect } from './assert-helpers.mjs';

const WEB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'web');
const sw = readFileSync(path.join(WEB, 'sw.js'), 'utf8');
/**
 * Модули, которых на момент написания тестов нет в прекэше. app.js импортирует
 * их статически, поэтому без сети не работает ни одна страница — это
 * подтверждено и браузерным тестом tests/web/e2e/offline.spec.mjs.
 */
const KNOWN_MISSING = new Set(['/js/protection.js', '/js/data/protection-data.js', '/js/data/help-data.js']);

const precache = new Set([...sw.match(/const STATIC_ASSETS = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map(m => m[1]));

/**
 * Все модули, которые браузер загрузит, начиная с entry.
 * @param {string} entry путь от корня сайта, например /js/app.js
 * @returns {Set<string>} пути модулей от корня сайта
 */
function importGraph(entry) {
  const seen = new Set();
  const queue = [entry];
  while (queue.length) {
    const url = queue.pop();
    if (seen.has(url)) continue;
    seen.add(url);
    const source = readFileSync(path.join(WEB, url), 'utf8');
    for (const m of source.matchAll(/(?:from\s+|import\s*\(\s*|import\s+)['"](\.{1,2}\/[^'"]+)['"]/g)) {
      queue.push(path.posix.join(path.posix.dirname(url), m[1]));
    }
  }
  return seen;
}

describe('прекэш service worker', () => {
  const modules = importGraph('/js/app.js');

  test('граф импортов найден и не пуст', () => assert.ok(modules.size > 10, `модулей: ${modules.size}`));

  for (const url of [...modules].sort()) {
    const body = () => assert.ok(precache.has(url), `${url} нет в STATIC_ASSETS`);
    test(`модуль ${url} закэширован`, KNOWN_MISSING.has(url)
      ? knownDefect(`${url} не попал в STATIC_ASSETS — без сети приложение не загружается`, body)
      : body);
  }

  test('каждый раздел сайта закэширован', () => {
    for (const p of PAGES) assert.ok(precache.has(`/${p.id}/`), `/${p.id}/`);
  });

  test('подключённые в разметке стили и скрипты закэшированы', () => {
    const master = readFileSync(path.join(WEB, '_master.html'), 'utf8');
    // В мастере пути относительные и с меткой версии: css/base.css?v=3. Service worker
    // кэширует по пути без строки запроса, поэтому сравниваем так же.
    const refs = [...master.matchAll(/<(?:link[^>]+href|script[^>]+src)="\/?((?:css|js)\/[^"?]+)(?:\?[^"]*)?"/g)]
      .map(m => '/' + m[1]);
    assert.ok(refs.length > 0, 'в мастере не найдено ни одной ссылки на стили и скрипты');
    for (const ref of refs) assert.ok(precache.has(ref), `${ref} нет в STATIC_ASSETS`);
  });

  test('каждый файл прекэша существует на диске', () => {
    for (const url of precache) {
      if (url.endsWith('/')) continue; // страницы собирает генератор
      assert.ok(existsSync(path.join(WEB, url)), `${url} отсутствует`);
    }
  });

  test('имя кэша версионировано — иначе обновление не дойдёт до пользователя', () => {
    assert.match(sw, /const CACHE_NAME = 'engicalc-v\d+'/);
  });
});
