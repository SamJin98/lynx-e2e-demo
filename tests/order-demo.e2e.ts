import {test,surfaceOf} from '@e2e-dev/web';
import {expect} from 'e2e';
import {engine} from '../engine.ts';
import {mkdir,writeFile} from 'node:fs/promises';

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
 await page.addInitScript(()=>{
  const audit={drags:[] as number[],durations:[] as number[],wheels:0,paginationClicks:0};
  (window as any).__orderGesture=audit;
  let start:number|undefined;let started=0;
  const inPhoto=(e:Event)=>e.composedPath().some((n:any)=>n.classList?.contains('photo'));
  document.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&inPhoto(e)){start=e.clientX;started=performance.now();}},true);
  document.addEventListener('pointerup',e=>{if(start!==undefined){audit.drags.push(e.clientX-start);audit.durations.push(performance.now()-started);start=undefined;}},true);
  document.addEventListener('wheel',e=>{if(inPhoto(e))audit.wheels++;},true);
  document.addEventListener('click',e=>{if(e.composedPath().some((n:any)=>n.classList?.contains('dot')))audit.paginationClicks++;},true);
 });
 await app.open('/');
 await expect(browser.locator('.title')).toHaveText('The Everyday Chair');
 const mouse=page.mouse;
 const originalMove=mouse.move.bind(mouse),originalDown=mouse.down.bind(mouse),originalUp=mouse.up.bind(mouse);
 let held=false,last={x:0,y:0};
 mouse.down=async(options)=>{await originalDown(options);held=true;};
 mouse.up=async(options)=>{try{await originalUp(options);}finally{held=false;}};
 mouse.move=async(x,y,options)=>{
  if(held){
   const from={...last},began=performance.now();
   for(let i=1;i<=60;i++){
    await new Promise(resolve=>setTimeout(resolve,Math.max(0,began+i*20-performance.now())));
    await originalMove(from.x+(x-from.x)*i/60,from.y+(y-from.y)*i/60);
   }
  }else await originalMove(x,y,options);
  last={x,y};
 };
 try{
 await agent.act('Drag the Right side of product image onto the Left side of product image to view image 2. Use the drag tool on the two named image regions. Do not scroll or tap pagination.',{agent:process.env.E2E_DECISIONS==='1'?'deepseek':'default',maxSteps:6,maxModelCalls:6});
 }finally{mouse.move=originalMove;mouse.down=originalDown;mouse.up=originalUp;}

 await expect(browser.locator('#image-index')).toHaveText('2 / 3');
 const gestures=await page.evaluate(()=>(window as any).__orderGesture);
 expect(gestures.drags.some((distance:number)=>distance < -220)).toBe(true);
 expect(gestures.durations.some((duration:number)=>duration>=1100)).toBe(true);
 expect(gestures.wheels).toBe(0);
 expect(gestures.paginationClicks).toBe(0);
 await mkdir('screenshots',{recursive:true});
 await writeFile(`screenshots/order-drag-${process.env.E2E_DECISIONS==='1'?'decisions':'deepseek'}.json`,JSON.stringify(gestures,null,2));
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
