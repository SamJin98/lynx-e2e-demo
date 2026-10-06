import {test} from '@e2e-dev/web';
import {expect} from 'e2e';
test('Agent opens the three-level Lynx menu', async ({app, browser, agent}) => {
  await app.open('/');
  await expect(browser.locator('lynx-view x-text.title')).toHaveText('Lynx scroll and menu');
  await agent.act('Tap Account, then Settings, then Notifications.');
  await expect(browser.locator('#selected')).toHaveText('Selected: Notifications');
});
test('Agent scrolls the Lynx list to Item 60', async ({app, browser, agent}) => {
  await app.open('/');
  await expect(browser.locator('scroll-view#items')).toBeVisible();
  await agent.act('Scroll inside the list until Item 60 is fully visible, then tap Item 60.', {maxSteps: 16, maxModelCalls: 16});
  await expect(browser.locator('#selected')).toHaveText('Selected: Item 60');
});
