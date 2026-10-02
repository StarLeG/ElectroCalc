/* EngiCalc — общие приёмы браузерных тестов калькуляторов.
 *
 * Тест работает со страницей так же, как человек: заполняет поля, жмёт
 * «Рассчитать» и читает то, что показано. Поэтому сравнение идёт с
 * ОТОБРАЖЁННЫМ числом, уже округлённым страницей, и допуск складывается из
 * половины младшего показанного разряда и относительной погрешности 0.1 %.
 */
import { test, expect } from '@playwright/test';

/** Относительный допуск сверки с эталоном. */
export const REL_TOLERANCE = 1e-3;

/** Строки, которых не должно быть в результате ни при каком вводе. */
const GARBAGE = /NaN|Infinity|undefined|null/;

/**
 * Открыть страницу калькулятора и, если надо, его вкладку.
 *
 * Ошибки скриптов страницы копятся в page.pageErrors: любое необработанное
 * исключение — дефект, даже если на экране всё выглядит прилично.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} pageId раздел сайта, он же адрес /<pageId>/
 * @param {string} [subTab] имя вкладки (data-sub)
 */
export async function openCalc(page, pageId, subTab) {
  page.pageErrors = [];
  page.on('pageerror', err => page.pageErrors.push(err.message));
  await page.goto(`/${pageId}/`);
  await expect(page.locator(`#page-${pageId}`)).toBeVisible();
  if (subTab) await page.locator(`.sub-tab[data-sub="${subTab}"]`).click();
}

/**
 * Заполнить поля. Ключ — id элемента, значение — число, строка или
 * { select: 'value' } для выпадающего списка. Пустая строка очищает поле.
 * @param {import('@playwright/test').Page} page
 * @param {Record<string, number|string|{select:string}>} values
 */
export async function fillFields(page, values) {
  for (const [id, value] of Object.entries(values)) {
    const field = page.locator(`#${id}`);
    const raw = value && typeof value === 'object' && 'select' in value ? value.select : value;
    if (!(await field.isVisible())) {
      // Поле скрыто текущим режимом формы (например, мощность при расчёте по
      // току) — его значение всё равно должно оказаться там, где его прочитает код.
      await field.evaluate((el, v) => {
        el.value = v;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, String(raw));
    } else if (await field.evaluate(el => el.tagName === 'SELECT')) {
      await field.selectOption(String(raw));
    } else {
      await field.fill(String(raw));
    }
  }
}

/**
 * Ввести текст с клавиатуры, как это делает человек.
 * Нужен там, где fill() не годится: в числовое поле fill() не пропускает
 * ни запятую, ни буквы, а пользователь их набрать может.
 * @param {import('@playwright/test').Page} page
 * @param {string} id поле
 * @param {string} text набираемый текст
 */
export async function typeInto(page, id, text) {
  const field = page.locator(`#${id}`);
  await field.fill('');
  if (text) await field.pressSequentially(text);
}

/**
 * Заполнить таблицу строк (группы нагрузок, кабели в лотке и т.п.).
 * Число строк подгоняется кнопками «добавить» / «убрать».
 * @param {import('@playwright/test').Page} page
 * @param {{table:string, add:string, remove?:string, rows:Record<string, number|string>[]}} spec
 *   table — селектор таблицы; rows — для каждой строки: класс ячейки → значение
 */
export async function fillTable(page, { table, add, remove, rows }) {
  const body = page.locator(`${table} tbody tr`);
  while ((await body.count()) < rows.length) await page.locator(`#${add}`).click();
  if (remove) {
    let guard = 50;
    while ((await body.count()) > rows.length && guard-- > 0) await page.locator(`#${remove}`).click();
  }
  for (let i = 0; i < rows.length; i++) {
    for (const [cell, value] of Object.entries(rows[i])) {
      const field = body.nth(i).locator(cell);
      if (await field.evaluate(el => el.tagName === 'SELECT')) await field.selectOption(String(value));
      else await field.fill(String(value));
    }
  }
}

/** Нажать кнопку расчёта. */
export async function calculate(page, buttonId) {
  await page.locator(`#${buttonId}`).click();
}

/**
 * Число из текста элемента: первое число в строке, с учётом знака,
 * десятичной запятой и типографского минуса.
 * @param {import('@playwright/test').Page} page
 * @param {string} selector CSS-селектор
 * @returns {Promise<{value:number, decimals:number, text:string}>}
 */
export async function readNumber(page, selector) {
  const text = (await page.locator(selector).first().textContent()) ?? '';
  return { ...parseDisplayed(text), text };
}

/**
 * Разобрать показанное число.
 * @param {string} text текст элемента
 * @returns {{value:number, decimals:number}}
 */
export function parseDisplayed(text) {
  const normalized = text.replace(/−/g, '-').replace(/ /g, ' ');
  const match = normalized.match(/-?\d+(?:[.,]\d+)?(?:e[+-]?\d+)?/i);
  if (!match) return { value: NaN, decimals: 0 };
  const raw = match[0].replace(',', '.');
  const [mantissa, exponent = '0'] = raw.split(/e/i);
  const fraction = mantissa.split('.')[1];
  // В записи 1.00e-7 младший разряд — 10^(−7−2), а не 10^−2.
  return { value: Number(raw), decimals: (fraction ? fraction.length : 0) - Number(exponent) };
}

/**
 * Сверить показанное число с эталоном.
 *
 * Допуск — большее из двух: половина единицы младшего показанного разряда
 * (ровно столько вносит округление при выводе) и 0.1 % от эталона.
 * Полная единица разряда была бы слишком мягкой для штучных величин:
 * 221 бирка вместо 220 — ошибка, а не погрешность.
 * @param {{value:number, decimals:number, text:string}} shown результат readNumber
 * @param {number} expected эталон
 * @param {string} [what] что сверяется — для сообщения об ошибке
 */
export function expectClose(shown, expected, what = '') {
  const halfLsd = 0.5 * 10 ** -shown.decimals;
  const tolerance = Math.max(halfLsd, Math.abs(expected) * REL_TOLERANCE);
  const message = `${what}: показано «${shown.text}», эталон ${expected}, допуск ±${tolerance}`;
  expect(Number.isFinite(shown.value), message).toBe(true);
  expect(Math.abs(shown.value - expected), message).toBeLessThanOrEqual(tolerance + 1e-12);
}

/**
 * Сверить показанное число с эталоном в пределах заданного процента —
 * для сверки с нормативными таблицами, где расчётная модель заведомо
 * приближённая и точного совпадения не бывает.
 * @param {{value:number, text:string}} shown результат readNumber
 * @param {number} expected табличное значение
 * @param {number} percent допустимое отклонение, %
 * @param {string} [what] что сверяется
 */
export function expectWithinPercent(shown, expected, percent, what = '') {
  const deviation = (shown.value - expected) / expected * 100;
  const message = `${what}: показано «${shown.text}», норматив ${expected}, отклонение ${deviation.toFixed(1)} % (допуск ±${percent} %)`;
  expect(Number.isFinite(shown.value), message).toBe(true);
  expect(Math.abs(deviation), message).toBeLessThanOrEqual(percent);
}

/**
 * Прочитать и сверить сразу несколько полей результата.
 * @param {import('@playwright/test').Page} page
 * @param {Record<string, number>} expectations селектор → эталон
 */
export async function expectResults(page, expectations) {
  for (const [selector, expected] of Object.entries(expectations)) {
    expectClose(await readNumber(page, selector), expected, selector);
  }
}

/**
 * Текст в карточке результата не содержит NaN, Infinity и прочих следов
 * вычислений, ушедших в никуда.
 * @param {import('@playwright/test').Page} page
 * @param {string} scope селектор области, по умолчанию активная страница
 */
export async function expectNoGarbage(page, scope = '.page.active') {
  const text = await page.locator(scope).first().innerText();
  expect(text, 'в результате не должно быть NaN/Infinity/undefined').not.toMatch(GARBAGE);
  expect(page.pageErrors ?? [], 'ошибок JavaScript быть не должно').toEqual([]);
}

/**
 * Калькулятор отказал в расчёте: показал сообщение (всплывающее или
 * подсветкой поля) и не изменил результат.
 * @param {import('@playwright/test').Page} page
 * @param {{button:string, result:string, field?:string}} opts
 * @param {() => Promise<void>} breakInput действие, портящее ввод
 */
export async function expectRejected(page, { button, result, field }, breakInput) {
  // Сначала честный расчёт — чтобы было что «не испортить».
  await calculate(page, button);
  const before = await page.locator(result).first().textContent();

  await breakInput();
  await calculate(page, button);

  const toastShown = page.locator('.toast.show');
  const fieldMarked = field ? page.locator(`#${field}.err`) : null;
  const flagged = (await toastShown.count()) > 0 || (fieldMarked && (await fieldMarked.count()) > 0);
  expect(flagged, 'пользователь должен увидеть сообщение об ошибке ввода').toBe(true);
  await expect(page.locator(result).first(), 'результат не должен измениться').toHaveText(before ?? '');
  await expectNoGarbage(page);
}

/**
 * Типовой набор проверок ввода для одного калькулятора.
 *
 * Для каждого поля из required: пустое значение и буквы — отказ.
 * Для полей из nonNegative — отказ на отрицательном числе.
 * Для полей из positive — отказ на нуле и на отрицательном.
 * Запятая как десятичный разделитель даёт тот же результат, что и точка.
 * Очень большое значение не приводит к NaN/Infinity на экране.
 *
 * Известные дефекты задаются в knownDefects ключами вида 'zero:<id>',
 * 'negative:<id>', 'empty:<id>', 'letters:<id>', 'huge:<id>', 'comma'.
 * Такой тест помечен test.fail(): пока дефект есть, прогон зелёный, а когда
 * его исправят, тест «неожиданно пройдёт» и потребует снять пометку.
 *
 * @param {object} cfg
 * @param {string} cfg.pageId раздел
 * @param {string} [cfg.subTab] вкладка
 * @param {string} cfg.button кнопка расчёта
 * @param {string} cfg.result селектор основного результата
 * @param {string[]} [cfg.required] обязательные поля
 * @param {string[]} [cfg.nonNegative] поля, не допускающие отрицательных значений
 * @param {string[]} [cfg.positive] поля, требующие строго положительного значения
 * @param {{field:string, text:string, same:string}} [cfg.comma] поле и пара значений с запятой и точкой
 * @param {string[]} [cfg.huge] поля для проверки на очень большие числа
 * @param {Record<string,string>} [cfg.knownDefects] ключ → описание дефекта
 */
export function describeInputValidation(cfg) {
  const defects = cfg.knownDefects ?? {};
  const target = { button: cfg.button, result: cfg.result };

  /** Объявить тест, при необходимости помеченный как известный дефект. */
  const check = (key, title, body) => {
    test(title, async ({ page }) => {
      if (defects[key]) {
        test.info().annotations.push({ type: 'known-defect', description: defects[key] });
        test.fail();
      }
      await openCalc(page, cfg.pageId, cfg.subTab);
      await body(page);
    });
  };

  test.describe('корректность ввода', () => {
    for (const id of cfg.required ?? []) {
      check(`empty:${id}`, `пустое поле ${id} — расчёт не выполняется`, page =>
        expectRejected(page, { ...target, field: id }, () => fillFields(page, { [id]: '' })));

      check(`letters:${id}`, `буквы в поле ${id} — расчёт не выполняется`, page =>
        expectRejected(page, { ...target, field: id }, () => typeInto(page, id, 'abc')));
    }

    for (const id of cfg.nonNegative ?? []) {
      check(`negative:${id}`, `отрицательное значение ${id} — отказ`, page =>
        expectRejected(page, { ...target, field: id }, () => fillFields(page, { [id]: -5 })));
    }

    for (const id of cfg.positive ?? []) {
      check(`zero:${id}`, `нулевое значение ${id} — отказ (деление на ноль)`, page =>
        expectRejected(page, { ...target, field: id }, () => fillFields(page, { [id]: 0 })));
      check(`negative:${id}`, `отрицательное значение ${id} — отказ`, page =>
        expectRejected(page, { ...target, field: id }, () => fillFields(page, { [id]: -5 })));
    }

    if (cfg.comma) {
      const { field, text, same } = cfg.comma;
      check('comma', `десятичная запятая в ${field} равнозначна точке`, async page => {
        await typeInto(page, field, same);
        await calculate(page, cfg.button);
        const withDot = await page.locator(cfg.result).first().textContent();
        await typeInto(page, field, text);
        await calculate(page, cfg.button);
        await expect(page.locator(cfg.result).first()).toHaveText(withDot ?? '');
        await expectNoGarbage(page);
      });
    }

    for (const id of cfg.huge ?? []) {
      check(`huge:${id}`, `очень большое значение ${id} не даёт NaN/Infinity`, async page => {
        await fillFields(page, { [id]: '1e12' });
        await calculate(page, cfg.button);
        await expectNoGarbage(page);
      });
    }
  });
}

/**
 * Проверка панели «Формула и норматив»: показанная формула и ссылка на
 * норматив содержат ожидаемые фрагменты.
 * @param {import('@playwright/test').Page} page
 * @param {{formula?: (string|RegExp)[], ref?: (string|RegExp)[], scope?: string}} spec
 */
export async function expectFormulaPanel(page, { formula = [], ref = [], scope = '.page.active' }) {
  const panel = page.locator(`${scope} .formula-panel:visible`).first();
  for (const fragment of formula) await expect(panel.locator('.formula').first()).toContainText(fragment);
  for (const fragment of ref) await expect(panel.locator('.ref').first()).toContainText(fragment);
}

/**
 * Параметризованные сценарии расчёта: каждый сценарий — отдельный тест.
 *
 * Сценарий: { name, input, expected, setup?, defect? }.
 *   input    — поля для fillFields();
 *   expected — селектор → эталонное число (сверка через expectClose)
 *              или селектор → строка/RegExp (сверка текста);
 *   setup    — дополнительные действия до заполнения (добавить строку и т.п.);
 *   defect   — описание известного дефекта, тест помечается test.fail().
 *
 * @param {{pageId:string, subTab?:string, button:string, cases:object[]}} cfg
 */
export function describeCases({ pageId, subTab, button, cases }) {
  test.describe('достоверность расчёта', () => {
    for (const c of cases) {
      test(c.name, async ({ page }) => {
        if (c.defect) knownDefect(c.defect);
        await openCalc(page, pageId, subTab);
        if (c.setup) await c.setup(page);
        await fillFields(page, c.input ?? {});
        await calculate(page, button);
        for (const [selector, expected] of Object.entries(c.expected)) {
          if (typeof expected === 'number') {
            expectClose(await readNumber(page, selector), expected, selector);
          } else {
            await expect(page.locator(selector).first()).toContainText(expected);
          }
        }
        await expectNoGarbage(page);
      });
    }
  });
}

/**
 * Значение, показанное в разметке до первого расчёта, совпадает с тем, что
 * калькулятор выдаёт на тех же исходных данных. Иначе человек, открывший
 * страницу, видит число, которое ни из чего не следует.
 * @param {{pageId:string, subTab?:string, button:string, result:string, defect?:string}} cfg
 */
export function describePlaceholder({ pageId, subTab, button, result, defect }) {
  test('значение до расчёта совпадает с расчётом по исходным данным', async ({ page }) => {
    if (defect) knownDefect(defect);
    await openCalc(page, pageId, subTab);
    const placeholder = (await page.locator(result).first().textContent())?.trim() ?? '';
    await calculate(page, button);
    const computed = (await page.locator(result).first().textContent())?.trim() ?? '';
    // Числа сравниваются по значению: «-5.00» до расчёта и «-5» после — одно и то же.
    const before = parseDisplayed(placeholder);
    if (Number.isFinite(before.value)) {
      expectClose({ ...parseDisplayed(computed), text: computed }, before.value, `было «${placeholder}»`);
    } else {
      expect(computed).toBe(placeholder);
    }
  });
}

/**
 * Пометить тест как известный дефект.
 * @param {string} description что именно не так и почему ожидание верное
 */
export function knownDefect(description) {
  test.info().annotations.push({ type: 'known-defect', description });
  test.fail();
}
