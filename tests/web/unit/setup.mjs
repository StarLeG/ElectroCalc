/* EngiCalc — окружение для юнит-тестов в Node.
 *
 * Модули расчёта импортируют core.js, а тот при загрузке читает язык из
 * localStorage. Чистым функциям (selectCable, calcBreaker, calcSleeve, …)
 * браузер не нужен, поэтому достаточно заглушки хранилища: тест не зависит
 * от состояния, оставленного предыдущим тестом, — хранилище всегда пустое.
 *
 * Подключается флагом: node --test --import ./tests/web/unit/setup.mjs
 */
if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };
}
