/* EngiCalc — проверка собранных страниц.
 *
 * Запуск: node tools/check-pages.mjs
 *
 * Генератор собирает 57 файлов разом, и ошибка в нём тиражируется сразу на
 * весь сайт: одинаковые описания, потерянный заголовок, ссылка в никуда.
 * Здесь проверяется то, что видит поисковый робот, и то, от чего зависит
 * офлайн-режим. Скрипт завершается ненулевым кодом при первой же находке,
 * чтобы выкладка не ушла с браком.
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WEB = path.join(ROOT, 'web');
const IGNORE_DIRS = new Set(['css', 'js', 'assets']);

const { PAGES } = await import(
  new URL('file:///' + path.join(ROOT, 'web/js/data/pages-meta.js').replace(/\\/g, '/')).href);

const problems = [];
const fail = (where, what) => problems.push(`${where}: ${what}`);

/* ===================== СТРАНИЦЫ ===================== */

const seenTitles = new Map();
const seenDescs = new Map();
const files = [['/', path.join(WEB, 'index.html')],
  ...PAGES.map(p => [`/${p.id}/`, path.join(WEB, p.id, 'index.html')])];

for (const [route, file] of files) {
  if (!existsSync(file)) { fail(route, 'страница не собрана'); continue; }
  const html = await readFile(file, 'utf8');

  const h1 = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/g) || [];
  if (h1.length !== 1) fail(route, `заголовков h1: ${h1.length}, нужен ровно один`);

  const title = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1]?.trim();
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1]?.trim();

  if (!title) fail(route, 'пустой title');
  else if (seenTitles.has(title)) fail(route, `title повторяет ${seenTitles.get(title)}`);
  else seenTitles.set(title, route);

  if (!desc) fail(route, 'пустое описание');
  else if (desc.length < 80) fail(route, `описание короткое: ${desc.length} символов`);
  else if (seenDescs.has(desc)) fail(route, `описание повторяет ${seenDescs.get(desc)}`);
  else seenDescs.set(desc, route);

  const canonical = (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1];
  if (!canonical?.endsWith(route)) fail(route, `canonical ведёт на ${canonical}`);

  // Ссылки меню: каждая должна открываться на диске.
  for (const m of html.matchAll(/<a class="nav-item[^"]*" href="\/([\w-]+)\/"/g)) {
    if (!existsSync(path.join(WEB, m[1], 'index.html'))) {
      fail(route, `ссылка меню /${m[1]}/ ведёт на несобранную страницу`);
      break;
    }
  }

  // Относительные пути к статике из подкаталога ведут в никуда.
  if (route !== '/' && /(?:href|src)="(?:css|js|assets)\//.test(html)) {
    fail(route, 'остались относительные пути к css, js или assets');
  }

  if (route !== '/') {
    // Цепочка для сниппета: без неё в выдаче остаётся голый адрес.
    const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
      .map(m => { try { return JSON.parse(m[1]); } catch { return null; } });
    if (ld.includes(null)) fail(route, 'невалидный JSON-LD');
    if (!ld.some(d => d && d['@type'] === 'BreadcrumbList')) {
      fail(route, 'нет разметки BreadcrumbList');
    }

    // Перелинковка: ссылки должны вести на собранные страницы.
    const related = [...html.matchAll(/<a class="related-card" href="\/([\w-]+)\/"/g)].map(m => m[1]);
    const page = PAGES.find(p => `/${p.id}/` === route);
    if (page && (page.related || []).length && !related.length) {
      fail(route, 'блок «Смотрите также» не собрался');
    }
    for (const id of related) {
      if (id === page?.id) fail(route, 'раздел ссылается сам на себя');
      if (!existsSync(path.join(WEB, id, 'index.html'))) {
        fail(route, `«Смотрите также» ведёт на несобранный раздел /${id}/`);
      }
    }
  }
}

/* ===================== СТРАНИЦА 404 ===================== */

const notFound = path.join(WEB, '404.html');
if (!existsSync(notFound)) {
  fail('/404.html', 'страница не собрана');
} else {
  const html = await readFile(notFound, 'utf8');
  // Страница-заглушка не должна попадать в индекс и не должна назначать себе
  // канонический адрес: она отдаётся под любым несуществующим адресом.
  if (!/<meta name="robots" content="noindex">/.test(html)) fail('/404.html', 'нет noindex');
  if (/rel="canonical"/.test(html)) fail('/404.html', 'остался canonical');
  if (!/home-card/.test(html)) fail('/404.html', 'нет каталога разделов');
}

/* ===================== СООТВЕТСТВИЕ СПИСКУ ===================== */

for (const entry of await readdir(WEB, { withFileTypes: true })) {
  if (!entry.isDirectory() || IGNORE_DIRS.has(entry.name)) continue;
  if (!PAGES.some(p => p.id === entry.name)) {
    fail(`/${entry.name}/`, 'каталог есть, а записи в pages-meta.js нет');
  }
}

/* ===================== ПРЕКЭШ SERVICE WORKER ===================== */

const sw = await readFile(path.join(WEB, 'sw.js'), 'utf8');
const assets = [...(sw.match(/const STATIC_ASSETS = \[([\s\S]*?)\];/) || [])[1]
  .matchAll(/'([^']+)'/g)].map(m => m[1]);

for (const asset of assets) {
  const rel = asset === '/' ? 'index.html'
    : asset.endsWith('/') ? path.join(asset, 'index.html')
      : asset;
  if (!existsSync(path.join(WEB, rel))) fail('sw.js', `в прекэше нет файла ${asset}`);
}
for (const p of PAGES) {
  if (!assets.includes(`/${p.id}/`)) fail('sw.js', `раздел /${p.id}/ не попал в прекэш`);
}

/* ===================== СВЕЖЕСТЬ СБОРКИ ===================== */

const masterTime = (await stat(path.join(WEB, '_master.html'))).mtimeMs;
const homeTime = (await stat(path.join(WEB, 'index.html'))).mtimeMs;
if (masterTime > homeTime) {
  fail('сборка', 'мастер-файл новее собранных страниц — запустите build-pages.mjs');
}

/* ===================== ИТОГ ===================== */

if (problems.length) {
  console.error(`Найдено проблем: ${problems.length}`);
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log(`Проверено страниц: ${files.length}. Заголовки, описания, ссылки и прекэш в порядке.`);
