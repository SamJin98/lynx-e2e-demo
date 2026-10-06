import { test, surfaceOf } from '@e2e-dev/web';
import { expect } from 'e2e';
import { engine } from '../engine.ts';
test('Product carousel responds to swipe and image selectors', async ({
  app,
  browser,
}) => {
  await app.open('/');
  await expect(browser.locator('.title')).toHaveText('The Everyday Chair');
  await expect(browser.locator('#image-index')).toHaveText('1 / 3');
  await browser
    .locator('.photo')
    .swipe({ direction: 'left', momentum: 'slow' });
  await expect(browser.locator('#image-index')).toHaveText('2 / 3');
  await browser.locator('[accessibility-label="View image 3"]').tap();
  await expect(browser.locator('#image-index')).toHaveText('3 / 3');
  const transform = await surfaceOf(engine)!
    .page()
    .locator('.photo-track')
    .evaluate((e) => e.getAttribute('style'));
  expect(transform).toContain('-880px');
  await browser.locator('[accessibility-label="View image 1"]').tap();
  await expect(browser.locator('#image-index')).toHaveText('1 / 3');
  const page = surfaceOf(engine)!.page();
  const box = await page.locator('.photo').boundingBox();
  const session = await page.context().newCDPSession(page);
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: box!.x + 380, y: box!.y + 170 }],
  });
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: box!.x + 40, y: box!.y + 170 }],
  });
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  await session.detach();
  await expect(browser.locator('#image-index')).toHaveText('2 / 3');
});
test('Product finish, quantity, bag and details update correctly', async ({
  app,
  browser,
}) => {
  await app.open('/');
  await browser.locator('[accessibility-label="Select Sand finish"]').tap();
  await expect(browser.locator('#selected-finish')).toHaveText('Sand');
  await browser.locator('[accessibility-label="Increase quantity"]').tap();
  await expect(browser.locator('#quantity')).toHaveText('2');
  await browser.locator('[accessibility-label="Add to bag"]').tap();
  await expect(browser.locator('#bag-count')).toHaveText('Bag (2)');
  await expect(browser.locator('#confirmation')).toHaveText(
    '2 × Sand added to bag',
  );
  const details = browser.locator('[accessibility-label="Product details"]');
  await browser
    .locator('#product-scroll')
    .scrollUntilVisible(details, { direction: 'down', timeout: 10000 });
  await details.tap();
  await expect(browser.locator('#product-details')).toHaveText(
    'Solid wood frame. Upholstered seat. Width 54 cm · Depth 58 cm · Height 78 cm. Wipe clean with a soft, dry cloth.',
  );
  await app.open('/');
  await expect(browser.locator('#bag-count')).toHaveText('Bag (0)');
});

test('Mouse dragging changes images and releases outside the carousel', async ({
  app,
  browser,
}) => {
  await app.open('/');
  await expect(browser.locator('#image-index')).toHaveText('1 / 3');
  const page = surfaceOf(engine)!.page();
  const box = await page.locator('.photo').boundingBox();
  const y = box!.y + 170;
  await page.mouse.move(box!.x + 380, y);
  await page.mouse.down();
  await page.mouse.move(box!.x + 40, y, { steps: 12 });
  await page.mouse.up();
  await expect(browser.locator('#image-index')).toHaveText('2 / 3');
  await page.mouse.move(box!.x + 40, y);
  await page.mouse.down();
  await page.mouse.move(box!.x + 380, y, { steps: 12 });
  await page.mouse.up();
  await expect(browser.locator('#image-index')).toHaveText('1 / 3');
  await page.mouse.move(box!.x + 380, y);
  await page.mouse.down();
  await page.mouse.move(box!.x - 40, y, { steps: 12 });
  await page.mouse.up();
  await expect(browser.locator('#image-index')).toHaveText('2 / 3');
  await page.locator('.photo-track').evaluate(async (e) => {
    for (let i = 0; i < 100; i++) {
      const value = getComputedStyle(e).transform;
      if (
        value !== 'none' &&
        Math.abs(new DOMMatrixReadOnly(value).m41 + 440) < 1
      )
        return;
      await new Promise((r) => setTimeout(r, 20));
    }
    throw new Error('Carousel did not settle');
  });
  await page.mouse.move(box!.x + 380, y);
  await page.mouse.move(box!.x + 40, y, { steps: 12 });
  await expect(browser.locator('#image-index')).toHaveText('2 / 3');
});

test('Horizontal drag moves continuously without clicking pagination', async ({
  app,
  browser,
}) => {
  await app.open('/');
  await expect(browser.locator('#image-index')).toHaveText('1 / 3');
  const page = surfaceOf(engine)!.page();
  await page
    .locator('x-image')
    .first()
    .evaluate(async (e) => {
      const img = e.shadowRoot!.querySelector('img')!;
      if (img.complete && img.naturalWidth > 0) return;
      await new Promise((resolve, reject) => {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', reject, { once: true });
      });
    });
  const box = (await page.locator('.photo').boundingBox())!;
  await page.mouse.move(box.x + 380, box.y + 170);
  await page.mouse.down();
  await page.mouse.move(box.x + 210, box.y + 170, { steps: 40 });
  const middle = await page
    .locator('.photo-track')
    .evaluate((e) => new DOMMatrixReadOnly(getComputedStyle(e).transform).m41);
  expect(middle).toBeLessThan(-100);
  expect(middle).toBeGreaterThan(-300);
  await page.mouse.move(box.x + 40, box.y + 170, { steps: 40 });
  await page.mouse.up();
  await expect(browser.locator('#image-index')).toHaveText('2 / 3');
});
