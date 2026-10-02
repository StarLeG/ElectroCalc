/* EngiCalc — конфигурация браузерных тестов калькуляторов.
 *
 * Перед запуском страницы собираются генератором (npm run build), затем
 * Playwright сам поднимает статический сервер tests/web/server.mjs.
 *
 * Service worker заблокирован: он кэширует модули, и тест мог бы проверить
 * не тот код, что лежит на диске.
 */
import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.ENGICALC_TEST_PORT || 4173);

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.mjs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Один повтор: под нагрузкой браузер изредка не укладывается в таймаут.
  // Такой тест помечается в отчёте как flaky и виден, а не прячется.
  retries: 1,
  workers: process.env.CI ? 2 : 4,
  timeout: 45_000,
  reporter: [['list'], ['html', { open: 'never', outputFolder: '../../playwright-report' }]],
  outputDir: '../../test-results',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    locale: 'ru-RU',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: `node server.mjs ${PORT}`,
    url: `http://127.0.0.1:${PORT}/power/`,
    reuseExistingServer: !process.env.CI,
    timeout: 15_000,
  },
});
