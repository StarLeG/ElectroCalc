/* EngiCalc — статический сервер для браузерных тестов.
 *
 * Отдаёт каталог web/ так же, как хостинг: /power/ → web/power/index.html.
 * Зависимостей нет, чтобы тестовый стенд не тянул за собой ничего, кроме
 * самого Playwright. Страницы должны быть собраны заранее (npm run build) —
 * генератор кладёт их в web/<id>/index.html, а в репозитории их нет.
 *
 * Запуск вручную: node tests/web/server.mjs [порт]
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WEB_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'web');
const PORT = Number(process.argv[2] || process.env.ENGICALC_TEST_PORT || 4173);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

/**
 * Путь запроса → файл внутри web/. Выход за пределы корня запрещён.
 * @param {string} urlPath путь из запроса
 * @returns {Promise<string|null>} абсолютный путь к файлу либо null
 */
async function resolveFile(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  let filePath = path.normalize(path.join(WEB_ROOT, decoded));
  if (!filePath.startsWith(WEB_ROOT)) return null;
  try {
    const info = await stat(filePath);
    if (info.isDirectory()) filePath = path.join(filePath, 'index.html');
    await stat(filePath);
    return filePath;
  } catch {
    return null;
  }
}

const server = createServer(async (request, response) => {
  const filePath = await resolveFile(request.url || '/');
  if (!filePath) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('not found');
    return;
  }
  const body = await readFile(filePath);
  response.writeHead(200, {
    'Content-Type': MIME_TYPES[path.extname(filePath)] || 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  response.end(body);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`EngiCalc test server: http://127.0.0.1:${PORT}/`);
});
