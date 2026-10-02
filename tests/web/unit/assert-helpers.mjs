/* EngiCalc — общие проверки для юнит-тестов. */
import assert from 'node:assert/strict';

/**
 * Число совпадает с эталоном в пределах допуска.
 * @param {number} actual полученное значение
 * @param {number} expected эталон
 * @param {{abs?:number, rel?:number}} [tol] абсолютный и/или относительный допуск;
 *   по умолчанию 0.1 % — тот же, что и в браузерных тестах
 * @param {string} [what] что сверяется
 */
export function assertClose(actual, expected, { abs = 0, rel = 1e-3 } = {}, what = '') {
  const tolerance = Math.max(abs, Math.abs(expected) * rel);
  assert.ok(Number.isFinite(actual), `${what}: получено ${actual}, ожидалось число`);
  assert.ok(Math.abs(actual - expected) <= tolerance + 1e-12,
    `${what}: получено ${actual}, эталон ${expected}, допуск ±${tolerance}`);
}

/**
 * Обернуть тело теста, которое воспроизводит известный дефект.
 *
 * Пока дефект есть, тело падает — и тест считается пройденным. Когда дефект
 * исправят, тело пройдёт, и тест упадёт с просьбой снять пометку: иначе
 * исправленная ошибка так и числилась бы неисправленной.
 *
 * @param {string} description что именно не так
 * @param {() => (void|Promise<void>)} body проверка правильного поведения
 * @returns {(t: import('node:test').TestContext) => Promise<void>}
 */
export function knownDefect(description, body) {
  return async t => {
    t.diagnostic(`известный дефект: ${description}`);
    try {
      await body();
    } catch {
      return;
    }
    assert.fail(`дефект больше не воспроизводится — снимите пометку knownDefect: ${description}`);
  };
}
