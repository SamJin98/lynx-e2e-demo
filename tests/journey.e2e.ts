import { test, surfaceOf } from '@e2e-dev/web';
import { expect, isAgentError } from 'e2e';
import { engine } from '../engine.ts';
import { mkdir, writeFile } from 'node:fs/promises';

test(
  'Agent complete product journey with continuous drag and nested scrolling',
  { timeout: 300000, agent: 'default' },
  async ({ app, browser, agent }) => {
    const decisions = process.env.E2E_DECISIONS === '1';
    const routing: { instruction: string; agent: string; reason?: string }[] =
      [];
    const act = async (
      instruction: string,
      limits: { maxSteps: number; maxModelCalls: number },
      deepseekOnly = false,
      verify?: () => Promise<void>,
    ) => {
      const selected = decisions && deepseekOnly ? 'deepseek' : 'default';
      routing.push({
        instruction,
        agent: decisions && selected === 'default' ? 'decisions' : 'deepseek',
        ...(deepseekOnly
          ? { reason: 'operation unavailable in decision executor' }
          : {}),
      });
      try {
        await agent.act(instruction, { ...limits, agent: selected });
      } catch (error) {
        if (
          !isAgentError(error) ||
          !decisions ||
          selected === 'deepseek' ||
          !['AUTOMATION_UNSUPPORTED', 'MODEL_PROVIDER_FAILED'].includes(
            error.code,
          )
        )
          throw error;
        if (verify) {
          try {
            await verify();
            routing.push({
              instruction,
              agent: 'assertion',
              reason: `${error.code}; exact postcondition is satisfied`,
            });
            return;
          } catch {}
        }
        routing.push({
          instruction,
          agent: 'deepseek',
          reason: `${error.code}; continue from current page`,
        });
        await agent.act(
          'Complete the remaining requirements of this task from the current page. If already satisfied, verify without repeating or undoing completed actions. Task: ' +
            instruction,
          { ...limits, agent: 'deepseek' },
        );
      }
    };
    const page = surfaceOf(engine)!.page();
    await page.addInitScript(() => {
      const audit = { drags: [] as number[], wheels: 0, paginationClicks: 0 };
      window.__gestureAudit = audit;
      let start: number | undefined;
      const inPhoto = (e: Event) =>
        e
          .composedPath()
          .some((n) => n instanceof Element && n.classList?.contains('photo'));
      document.addEventListener(
        'pointerdown',
        (e) => {
          if (e.pointerType === 'mouse' && inPhoto(e)) start = e.clientX;
        },
        true,
      );
      document.addEventListener(
        'pointerup',
        (e) => {
          if (start !== undefined) {
            audit.drags.push(e.clientX - start);
            start = undefined;
          }
        },
        true,
      );
      document.addEventListener(
        'wheel',
        (e) => {
          if (inPhoto(e)) audit.wheels++;
        },
        true,
      );
      document.addEventListener(
        'click',
        (e) => {
          if (
            e
              .composedPath()
              .some((n) => n instanceof Element && n.classList?.contains('dot'))
          )
            audit.paginationClicks++;
        },
        true,
      );
    });
    await app.open('/');
    await expect(browser.locator('.title')).toHaveText('The Everyday Chair');
    await act(
      'Drag the Right side of product image onto the Left side of product image to view image 2. Use the drag tool on these two named image regions. Do not scroll and do not tap pagination.',
      { maxSteps: 6, maxModelCalls: 6 },
      true,
    );
    await expect(browser.locator('#image-index')).toHaveText('2 / 3');
    const gestures = await page.evaluate(() => window.__gestureAudit);
    expect(gestures.drags.some((distance: number) => distance < -220)).toBe(
      true,
    );
    expect(gestures.wheels).toBe(0);
    expect(gestures.paginationClicks).toBe(0);
    await act(
      'Scroll down the product page to Details & materials and expand it.',
      { maxSteps: 6, maxModelCalls: 6 },
      false,
      async () => {
        await expect(browser.locator('#product-details')).toHaveText(
          'Solid wood frame. Upholstered seat. Width 54 cm · Depth 58 cm · Height 78 cm. Wipe clean with a soft, dry cloth.',
        );
        expect(
          await page.locator('#product-scroll').evaluate((e) => e.scrollTop),
        ).toBeGreaterThan(0);
      },
    );
    await expect(browser.locator('#product-details')).toHaveText(
      'Solid wood frame. Upholstered seat. Width 54 cm · Depth 58 cm · Height 78 cm. Wipe clean with a soft, dry cloth.',
    );
    await act(
      'Open Frame material (Choose frame). The task is complete when the Choose your frame panel with frame options is visible. Do not tap Choose frame again after the panel opens.',
      { maxSteps: 4, maxModelCalls: 4 },
      false,
      async () => {
        await expect(browser.locator('#frame-options')).toBeVisible();
      },
    );
    await expect(browser.locator('#frame-options')).toBeVisible();
    const outerBefore = await page
      .locator('#product-scroll')
      .evaluate((e) => e.scrollTop);
    await act(
      'Scroll down inside the frame options panel until Choose Walnut frame is visible. Use scroll_to for Walnut or scroll the panel. Do not select any frame yet.',
      { maxSteps: 6, maxModelCalls: 6 },
      true,
    );
    const innerTop = await page
      .locator('#frame-options')
      .evaluate((e) => e.scrollTop);
    const outerAfter = await page
      .locator('#product-scroll')
      .evaluate((e) => e.scrollTop);
    expect(innerTop).toBeGreaterThan(0);
    expect(outerAfter).toBe(outerBefore);
    await act(
      'Choose Walnut frame and leave the frame panel closed. Stop when Frame material shows Walnut and no Close panel control is present. Do not reopen Choose frame.',
      { maxSteps: 4, maxModelCalls: 4 },
      false,
      async () => {
        await expect(browser.locator('#selected-frame')).toHaveText('Walnut ›');
        await expect(
          browser.locator('[accessibility-label="Close panel"]'),
        ).toHaveCount(0);
      },
    );
    await expect(browser.locator('#selected-frame')).toHaveText('Walnut ›');
    await expect(
      browser.locator('[accessibility-label="Close panel"]'),
    ).toHaveCount(0);
    await act(
      'Select Sand finish, set quantity to 2, and Add to bag.',
      { maxSteps: 8, maxModelCalls: 8 },
      false,
      async () => {
        await expect(browser.locator('#bag-count')).toHaveText('Bag (2)');
        await expect(browser.locator('#confirmation')).toHaveText(
          '2 × Sand added to bag',
        );
      },
    );
    await expect(browser.locator('#bag-count')).toHaveText('Bag (2)');
    await expect(browser.locator('#confirmation')).toHaveText(
      '2 × Sand added to bag',
    );
    await act(
      'Open Shopping bag. Increase bag quantity once so it contains 3 chairs.',
      { maxSteps: 6, maxModelCalls: 6 },
      false,
      async () => {
        await expect(browser.locator('#cart-variant')).toHaveText(
          'Sand / Walnut',
        );
        await expect(browser.locator('#cart-quantity')).toHaveText(
          'Quantity: 3',
        );
        await expect(browser.locator('#cart-total')).toHaveText('$810');
      },
    );
    await expect(browser.locator('#cart-variant')).toHaveText('Sand / Walnut');
    await expect(browser.locator('#cart-quantity')).toHaveText('Quantity: 3');
    await expect(browser.locator('#cart-total')).toHaveText('$810');
    await mkdir('screenshots', { recursive: true });
    await page.screenshot({ path: 'screenshots/agent-journey-cart.png' });
    await act(
      'Remove the item from the shopping bag, then Close panel.',
      { maxSteps: 6, maxModelCalls: 6 },
      false,
      async () => {
        await expect(browser.locator('#bag-count')).toHaveText('Bag (0)');
        await expect(
          browser.locator('[accessibility-label="Close panel"]'),
        ).toHaveCount(0);
      },
    );
    await expect(browser.locator('#bag-count')).toHaveText('Bag (0)');
    await expect(
      browser.locator('[accessibility-label="Close panel"]'),
    ).toHaveCount(0);
    await act(
      'Add to bag again, open Shopping bag, and set bag quantity to 3.',
      { maxSteps: 8, maxModelCalls: 8 },
      false,
      async () => {
        await expect(browser.locator('#cart-quantity')).toHaveText(
          'Quantity: 3',
        );
        await expect(browser.locator('#cart-total')).toHaveText('$810');
      },
    );
    await expect(browser.locator('#cart-variant')).toHaveText('Sand / Walnut');
    await expect(browser.locator('#cart-quantity')).toHaveText('Quantity: 3');
    await expect(browser.locator('#cart-total')).toHaveText('$810');
    await act(
      'Submit order. Stop when Order confirmed is displayed.',
      { maxSteps: 6, maxModelCalls: 6 },
      false,
      async () => {
        await expect(browser.locator('#order-status')).toHaveText(
          'Order confirmed',
        );
      },
    );
    await expect(browser.locator('#order-status')).toHaveText(
      'Order confirmed',
    );
    await expect(browser.locator('#order-variant')).toHaveText('Sand / Walnut');
    await expect(browser.locator('#order-quantity')).toHaveText('Quantity: 3');
    await expect(browser.locator('#order-total')).toHaveText('$810');
    await expect(browser.locator('#bag-count')).toHaveText('Bag (0)');
    await expect(browser.locator('#confetti')).toBeVisible();
    await expect(browser.locator('.confetti-piece')).toHaveCount(48);
    const particle = page.locator('.confetti-piece').first();
    const before = await particle.evaluate(
      (e) => getComputedStyle(e).transform,
    );
    await page.waitForTimeout(200);
    expect(
      await particle.evaluate((e) => getComputedStyle(e).transform),
    ).not.toBe(before);
    await page.screenshot({ path: 'screenshots/agent-order-confetti.png' });
    await page.waitForTimeout(1500);
    await writeFile(
      'screenshots/agent-journey-routing.json',
      JSON.stringify(routing, null, 2),
    );
    await writeFile(
      'screenshots/agent-journey-gesture.json',
      JSON.stringify(
        { ...gestures, innerTop, outerBefore, outerAfter },
        null,
        2,
      ),
    );
  },
);
