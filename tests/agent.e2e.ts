import {test} from '@e2e-dev/web';
import {expect} from 'e2e';
test('Agent swipes the product image carousel',async({app,browser,agent})=>{
 await app.open('/');
 await expect(browser.locator('.title')).toHaveText('The Everyday Chair');
 await agent.act('Swipe left once on the product image carousel to show the second image.');
 await expect(browser.locator('#image-index')).toHaveText('2 / 3');
});
test('Agent selects finish and adds two chairs to bag',async({app,browser,agent})=>{
 await app.open('/');
 await expect(browser.locator('.title')).toHaveText('The Everyday Chair');
 await agent.act('Select the Sand finish, increase quantity to 2, then tap Add to bag.');
 await expect(browser.locator('#bag-count')).toHaveText('Bag (2)');
 await expect(browser.locator('#confirmation')).toHaveText('2 × Sand added to bag');
});
