import {test,surfaceOf} from '@e2e-dev/web';
import {expect} from 'e2e';
import {engine} from '../engine.ts';

test('Place order and celebrate',{agent:'default'},async({app,browser,agent})=>{
 const page=surfaceOf(engine)!.page();
 const act=async(goal:string,verify:()=>Promise<void>)=>{
  try{await agent.act(goal,{maxSteps:8,maxModelCalls:8});}
  catch(error){
   if(process.env.E2E_DECISIONS!=='1'||!['AUTOMATION_UNSUPPORTED','MODEL_PROVIDER_FAILED'].includes((error as any).code))throw error;
   try{await verify();return;}catch{}
   await agent.act('Complete only the remaining requirements from the current page; do not repeat satisfied actions. Task: '+goal,{agent:'deepseek',maxSteps:8,maxModelCalls:8});
  }
  await verify();
 };
 await app.open('/');
 await expect(browser.locator('.title')).toHaveText('The Everyday Chair');
 await act('Select Sand finish, set quantity to 2, then Add to bag. Stop when Bag (2) and 2 × Sand added to bag are displayed.',async()=>{
  await expect(browser.locator('#bag-count')).toHaveText('Bag (2)');
  await expect(browser.locator('#confirmation')).toHaveText('2 × Sand added to bag');
 });
 await act('Open Shopping bag and set bag quantity to 3. Stop when Quantity: 3 and subtotal $720 are displayed.',async()=>{
  await expect(browser.locator('#cart-variant')).toHaveText('Sand / Oak');
  await expect(browser.locator('#cart-quantity')).toHaveText('Quantity: 3');
  await expect(browser.locator('#cart-total')).toHaveText('$720');
 });
 await act('Submit order. Stop when Order confirmed is displayed.',async()=>{
  await expect(browser.locator('#order-status')).toHaveText('Order confirmed');
 });
 await expect(browser.locator('#order-variant')).toHaveText('Sand / Oak');
 await expect(browser.locator('#order-quantity')).toHaveText('Quantity: 3');
 await expect(browser.locator('#order-total')).toHaveText('$720');
 await expect(browser.locator('#bag-count')).toHaveText('Bag (0)');
 await expect(browser.locator('#confetti')).toBeVisible();
 await expect(browser.locator('.confetti-piece')).toHaveCount(48);
 const particle=page.locator('.confetti-piece').first();
 const before=await particle.evaluate(e=>getComputedStyle(e).transform);
 await page.waitForTimeout(200);
 expect(await particle.evaluate(e=>getComputedStyle(e).transform)).not.toBe(before);
 await page.waitForTimeout(3000);
});
