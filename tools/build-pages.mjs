/* EngiCalc — сборка страниц разделов из мастер-файла.
 *
 * Запуск: node tools/build-pages.mjs
 *
 * Мастер-файл web/_master.html содержит разметку всех калькуляторов сразу —
 * его и правят руками. Отсюда получаются:
 *   web/<id>/index.html   страница раздела со своими title, description и h1
 *   web/index.html        витрина: вводный текст и каталог разделов
 *   web/sitemap.xml       карта сайта по тому же списку
 *   web/sw.js             список прекэша с адресами всех страниц
 *
 * Генератор ничего не додумывает: раздел без записи в PAGES или калькулятор
 * без справки останавливают сборку. Молча выпущенная страница без описания
 * хуже, чем упавшая сборка.
 */
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WEB = path.join(ROOT, 'web');
const SITE = 'https://engicalc.electroman.by';

const { PAGES, GROUP_ORDER } = await import(url('web/js/data/pages-meta.js'));
const { HELP_RU } = await import(url('web/js/data/help-data.js'));

function url(rel) {
  return new URL('file:///' + path.join(ROOT, rel).replace(/\\/g, '/')).href;
}

/* ===================== РАЗБОР МАСТЕР-ФАЙЛА ===================== */

/**
 * Мастер режется по трём границам: конец head, первый <main> и последний
 * </main>. Всё, что между body и первым main — общая обвязка (счётчик, меню,
 * шапка), всё после последнего main — подвал и скрипты.
 */
function splitMaster(html) {
  const headEnd = html.indexOf('</head>');
  const firstMain = html.indexOf('<main class="content page');
  const lastMain = html.lastIndexOf('</main>') + '</main>'.length;
  if (headEnd < 0 || firstMain < 0 || lastMain < 0) {
    throw new Error('мастер-файл не разбирается: не найдены head или блоки страниц');
  }

  const pageRe = /<main class="content page[^"]*"[^>]*id="page-([\w-]+)"[^>]*>[\s\S]*?<\/main>/g;
  const pages = {};
  for (const m of html.matchAll(pageRe)) {
    // Стартовая страница размечена как «content page active» — класс активности
    // расставляет генератор, поэтому здесь он снимается.
    pages[m[1]] = m[0].replace('class="content page active"', 'class="content page"');
  }

  return {
    head: html.slice(0, headEnd),
    prefix: html.slice(html.indexOf('<body>') + '<body>'.length, firstMain),
    suffix: html.slice(lastMain),
    pages,
  };
}

const GROUP_TITLES = {
  electrical: 'Электрика',
  equipment: 'Оборудование',
  lighting: 'Освещение',
  cablenet: 'Кабельные сети',
  cabinet: 'Монтаж шкафов',
  energy: 'Энергетика',
  safety: 'Безопасность',
  kipia: 'КИПиА',
  electronics: 'Электроника',
  chips: 'Микросхемы',
  editor: 'Редактор схем',
  system: 'О проекте',
};

/* ===================== ЧАСТИ СТРАНИЦЫ ===================== */

/** Пути к статике — абсолютные: из подкаталога /cable/ относительные ведут в никуда. */
function absolutePaths(html) {
  return html
    .replace(/(href|src)="(css|js|assets)\//g, '$1="/$2/')
    .replace(/href="manifest\.json"/g, 'href="/manifest.json"');
}

function escapeAttr(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/** head со своими мета-тегами вместо общих. */
function buildHead(head, page) {
  const title = `${page.titleRu} — EngiCalc`;
  const canonical = `${SITE}/${page.id}/`;
  return absolutePaths(head)
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeAttr(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/,
      `<meta name="description" content="${escapeAttr(page.descRu)}">`)
    .replace(/<link rel="canonical" href="[^"]*">/,
      `<link rel="canonical" href="${canonical}">`)
    .replace(/<meta property="og:url" content="[^"]*">/,
      `<meta property="og:url" content="${canonical}">`)
    .replace(/<meta property="og:title" content="[^"]*">/,
      `<meta property="og:title" content="${escapeAttr(title)}">`)
    .replace(/<meta property="og:description" content="[^"]*">/,
      `<meta property="og:description" content="${escapeAttr(page.descRu)}">`)
    .replace(/<meta name="twitter:title" content="[^"]*">/,
      `<meta name="twitter:title" content="${escapeAttr(title)}">`)
    .replace(/<meta name="twitter:description" content="[^"]*">/,
      `<meta name="twitter:description" content="${escapeAttr(page.descRu)}">`);
}

/**
 * Меню из ссылок.
 *
 * В мастере пункты — это div с data-page: их обрабатывал обработчик клика.
 * Здесь они становятся настоящими ссылками, иначе роботу нечего обходить,
 * а человеку нечего открыть в новой вкладке.
 */
function buildNav(prefix, activeId) {
  // Логотип был h1, пока приложение жило на одном адресе. Теперь у каждой
  // страницы свой заголовок первого уровня — название калькулятора.
  let out = prefix
    .replace('<h1 class="logo">', '<span class="logo">')
    .replace('</h1>', '</span>');
  out = out.replace(
    /<div class="nav-item(?: active)?" data-page="([\w-]+)">([\s\S]*?)<\/div>/g,
    (_all, id, inner) => {
      const active = id === activeId;
      return `<a class="nav-item${active ? ' active' : ''}" href="/${id}/"` +
        `${active ? ' aria-current="page"' : ''} data-page="${id}">${inner}</a>`;
    });
  out = absolutePaths(out);
  return out;
}

/**
 * Хлебные крошки в разметке.
 *
 * Раньше их проставлял JS при переключении раздела. На статической странице
 * это оставило бы всем страницам крошки стартовой — и роботу, и человеку
 * с медленным соединением.
 */
function setBreadcrumb(html, text) {
  return html.replace(
    /(<span class="breadcrumb" id="breadcrumb">)[^<]*(<\/span>)/,
    `$1${escapeAttr(text)}$2`);
}

/**
 * Справка под калькулятором.
 *
 * Тот же текст, что открывается кнопкой «?», но в разметке страницы: до этого
 * сорок с лишним килобайт пояснений существовали только внутри JavaScript и
 * ни поиску, ни человеку без клика не показывались.
 */
function buildHelp(page) {
  const help = HELP_RU[page.id];
  if (!help) return '';
  return `
      <details class="page-help">
        <summary>${escapeAttr(help.title)}: как считается</summary>
        <div class="page-help-body">${help.body}</div>
      </details>`;
}

/* ===================== СТРАНИЦА РАЗДЕЛА ===================== */

function buildPage(parts, page) {
  const main = parts.pages[page.id];
  if (!main) throw new Error(`в мастер-файле нет разметки для раздела «${page.id}»`);

  // Внутри разметки калькулятора тоже встречаются ссылки на статику — например,
  // QR-код на странице поддержки. Из подкаталога они вели бы в никуда.
  const withHelp = absolutePaths(main).replace(/<\/main>$/, buildHelp(page) + '\n  </main>');

  // Название калькулятора — заголовок первого уровня страницы.
  const withH1 = withHelp
    .replace('<h2 class="card-title"', '<h1 class="card-title"')
    .replace(/<\/h2>/, '</h1>');
  if (!withH1.includes('<h1')) {
    throw new Error(`у раздела «${page.id}» нет заголовка карточки — некому стать h1`);
  }

  // Крошка — короткое название из разметки, а не длинный поисковый заголовок:
  // в шапке нужен ориентир, а не вторая копия title.
  const shortName = (withH1.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || page.titleRu;
  const crumb = `${GROUP_TITLES[page.group] || page.group} / ${shortName.replace(/<[^>]+>/g, '').trim()}`;
  const body = `<body data-page="${page.id}">` +
    setBreadcrumb(buildNav(parts.prefix, page.id), crumb) +
    withH1.replace('class="content page"', 'class="content page active"') +
    absolutePaths(parts.suffix);

  return buildHead(parts.head, page) + '</head>\n' + body;
}

/* ===================== ВИТРИНА ===================== */


function buildHome(parts) {
  const groups = GROUP_ORDER.map(g => {
    const items = PAGES.filter(p => p.group === g);
    if (!items.length) return '';
    const cards = items.map(p => `
        <a class="home-card" href="/${p.id}/">
          <h3>${escapeAttr(p.titleRu)}</h3>
          <p>${escapeAttr(p.descRu)}</p>
        </a>`).join('');
    return `
      <section class="home-group">
        <h2>${GROUP_TITLES[g] || g}</h2>
        <div class="home-cards">${cards}
        </div>
      </section>`;
  }).join('');

  const title = 'EngiCalc — онлайн-калькуляторы для электриков и КИПиА';
  const desc = 'Более пятидесяти инженерных расчётов по ПУЭ, ГОСТ и IEC: ' +
    'кабель, ток, короткое замыкание, заземление, двигатели, освещение, КИПиА. ' +
    'Бесплатно и работает офлайн.';

  const head = absolutePaths(parts.head)
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeAttr(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/,
      `<meta name="description" content="${escapeAttr(desc)}">`)
    .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${SITE}/">`)
    .replace(/<meta property="og:url" content="[^"]*">/,
      `<meta property="og:url" content="${SITE}/">`)
    .replace(/<meta property="og:title" content="[^"]*">/,
      `<meta property="og:title" content="${escapeAttr(title)}">`);

  const main = `
  <main class="content page active" id="page-home">
    <div class="home">
      <h1 class="home-title">Онлайн-калькуляторы для электриков и КИПиА</h1>
      <p class="home-lead">Инженерные расчёты для электриков, наладчиков и проектировщиков.
        Расчёты идут по ПУЭ, ГОСТ и IEC: рядом с каждым результатом показаны формула
        и пункт норматива, чтобы число можно было проверить, а не принимать на веру.
        Сайт работает офлайн и ничего не берёт за использование.</p>
      ${groups}
    </div>
  </main>`;

  return head + '</head>\n<body data-page="home">' +
    setBreadcrumb(buildNav(parts.prefix, 'home'), 'EngiCalc / Все расчёты') +
    main + absolutePaths(parts.suffix);
}

/* ===================== КАРТА САЙТА И ПРЕКЭШ ===================== */

function buildSitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    `  <url>\n    <loc>${SITE}/</loc>\n    <lastmod>${today}</lastmod>\n` +
    `    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>`,
    ...PAGES.map(p =>
      `  <url>\n    <loc>${SITE}/${p.id}/</loc>\n    <lastmod>${today}</lastmod>\n` +
      `    <changefreq>monthly</changefreq>\n    <priority>${p.priority.toFixed(1)}</priority>\n  </url>`),
  ];
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<!-- Собирается tools/build-pages.mjs из web/js/data/pages-meta.js. Руками не править. -->\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.join('\n') + '\n</urlset>\n';
}

/** Адреса страниц в прекэше service worker — между маркерами. */
async function patchServiceWorker() {
  const file = path.join(WEB, 'sw.js');
  let sw = await readFile(file, 'utf8');
  const list = ['  /* PAGES:BEGIN — список собирает tools/build-pages.mjs */',
    "  '/',", ...PAGES.map(p => `  '/${p.id}/',`),
    '  /* PAGES:END */'].join('\n');

  if (sw.includes('/* PAGES:BEGIN')) {
    sw = sw.replace(/ {2}\/\* PAGES:BEGIN[\s\S]*?\/\* PAGES:END \*\//, list);
  } else {
    sw = sw.replace(/const STATIC_ASSETS = \[\n {2}'\/',\n/, 'const STATIC_ASSETS = [\n' + list + '\n');
  }
  await writeFile(file, sw);
  return PAGES.length + 1;
}

/* ===================== СБОРКА ===================== */

const master = await readFile(path.join(WEB, '_master.html'), 'utf8');
const parts = splitMaster(master);

const known = new Set(PAGES.map(p => p.id));
const orphans = Object.keys(parts.pages).filter(id => !known.has(id));
if (orphans.length) {
  throw new Error(`в мастер-файле есть разделы без записи в pages-meta.js: ${orphans.join(', ')}`);
}

let written = 0;
for (const page of PAGES) {
  const dir = path.join(WEB, page.id);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, 'index.html'), buildPage(parts, page));
  written++;
}

await writeFile(path.join(WEB, 'index.html'), buildHome(parts));
await writeFile(path.join(WEB, 'sitemap.xml'), buildSitemap());
const cached = await patchServiceWorker();

// Каталоги от переименованных разделов: без уборки на сервере остались бы
// страницы, на которые уже ничто не ссылается.
const stale = [];
for (const entry of await (await import('node:fs/promises')).readdir(WEB, { withFileTypes: true })) {
  if (!entry.isDirectory() || ['css', 'js', 'assets'].includes(entry.name)) continue;
  if (!known.has(entry.name)) stale.push(entry.name);
}
for (const dir of stale) {
  await rm(path.join(WEB, dir), { recursive: true, force: true });
}

console.log(`страниц собрано: ${written}`);
console.log(`витрина: web/index.html`);
console.log(`карта сайта: ${PAGES.length + 1} адресов`);
console.log(`прекэш service worker: ${cached} адресов страниц`);
if (stale.length) console.log(`удалены каталоги без раздела: ${stale.join(', ')}`);
if (!existsSync(path.join(WEB, 'index.html'))) throw new Error('витрина не записалась');
