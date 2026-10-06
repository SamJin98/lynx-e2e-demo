import {test,surfaceOf} from '@e2e-dev/web';
import {expect} from 'e2e';
import {mkdir} from 'node:fs/promises';
import {engine} from '../engine.ts';
test('Agent swipes the product image carousel',async({app,browser,agent})=>{
 await app.open('/');
 await expect(browser.locator('.title')).toHaveText('The Everyday Chair');
 const page=surfaceOf(engine)!.page();
 await mkdir('screenshots',{recursive:true});
 await page.locator('x-image').first().evaluate(async e=>{const img=e.shadowRoot?.querySelector('img');if(!img)throw new Error('Product image missing');if(img.complete&&img.naturalWidth>0)return;await new Promise((resolve,reject)=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',reject,{once:true});});});
 await page.screenshot({path:'screenshots/agent-swipe-before.png'});
 await agent.act('Swipe left once on the product image carousel to show the second image.');
 await expect(browser.locator('#image-index')).toHaveText('2 / 3');
 await page.locator('.photo-track').evaluate(async e=>{for(let i=0;i<100;i++){const value=getComputedStyle(e).transform;if(value!=='none'&&Math.abs(new DOMMatrixReadOnly(value).m41+440)<1)return;await new Promise(r=>setTimeout(r,20));}throw new Error('Carousel did not settle on image 2');});
 await page.screenshot({path:'screenshots/agent-swipe-after.png'});
});
test('Agent selects finish and adds two chairs to bag',async({app,browser,agent})=>{
 await app.open('/');
 await expect(browser.locator('.title')).toHaveText('The Everyday Chair');
 await agent.act('Select the Sand finish, increase quantity to 2, then tap Add to bag.');
 await expect(browser.locator('#bag-count')).toHaveText('Bag (2)');
 await expect(browser.locator('#confirmation')).toHaveText('2 × Sand added to bag');
});
