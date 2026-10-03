// Optional browser regression; see README for tool setup. Fixtures advance simulation time.
import { readFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const root = fileURLToPath(new URL('../', import.meta.url));
const artifacts = path.join(root, 'dist/browser-artifacts');
await mkdir(artifacts, { recursive: true });
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
let html=await readFile(path.join(root, 'dist/iron-front-demo.html'),'utf8');html=html.replace('</script>','\nwindow.__testingGame=()=>game;window.__testingCamera=()=>camera;\n</script>');
const p=await browser.newPage({viewport:{width:1440,height:960},deviceScaleFactor:2});const errors=[];let requests=0;p.on('pageerror',e=>errors.push(e.message));p.on('request',()=>requests++);await p.setContent(html);await p.waitForTimeout(600);assert.deepEqual(errors,[]);assert.equal(await p.locator('#lobby').isVisible(),true);await p.screenshot({path:path.join(artifacts, 'lobby.png')});
const clickWorld=async(x,y)=>{const c=await p.evaluate(()=>__testingCamera()),b=await p.locator('#battle').boundingBox();await p.mouse.click(b.x+x-c.x,b.y+y-c.y);};
const tick=async seconds=>{await p.evaluate(s=>{const g=__testingGame();for(let i=0;i<s*10;i++)g.update(.1);},seconds);await p.waitForTimeout(250);};
for(const [country,faction]of[['usa','alliance'],['germany','alliance'],['russia','iron'],['china','iron'],['japan','sky'],['korea','sky']]){
if(country!=='usa')await p.locator('#new-game').click();await p.locator(`[data-faction="${faction}"]`).click();await p.locator(`[data-country="${country}"]`).click();await p.locator('#enemy-country').selectOption(country==='russia'?'usa':'russia');await p.locator('#deploy').click();await p.waitForTimeout(200);assert.equal(await p.locator('#lobby').isVisible(),false);assert.equal(await p.evaluate(()=>__testingGame().country),country);assert.ok(Math.abs((await p.evaluate(()=>__testingCamera().y))-620)<.5,'视野应停留在新基地');
await p.evaluate(()=>{const g=__testingGame();g.credits=20000;g.waveAt=Infinity;});
const fogAlpha=await p.evaluate(()=>{const c=document.querySelector('#shroud').getContext('2d');return [c.getImageData(103,255,1,1).data[3],c.getImageData(455,87,1,1).data[3]];});assert.ok(fogAlpha[0]<5);assert.ok(fogAlpha[1]>180);
await p.waitForTimeout(200);assert.equal(await p.locator('[data-type="lab"]').isDisabled(),true);
await p.locator('[data-type="factory"]').click();await clickWorld(720,1050);await tick(17);assert.equal(await p.locator('[data-type="lab"]').isDisabled(),false);
await p.locator('[data-type="lab"]').click();await clickWorld(650,780);await tick(19);if(!await p.evaluate(()=>__testingGame().has('lab'))){console.log(JSON.stringify(await p.evaluate(()=>({queue:__testingGame().queue,power:__testingGame().power,camera:__testingCamera(),notice:document.querySelector('#notice').innerText,time:__testingGame().time,buildings:__testingGame().entities.filter(e=>e.team==='player'&&e.building).map(e=>({type:e.type,x:e.x,y:e.y}))}))));await p.screenshot({path:path.join(artifacts, 'lab-failure.png')});}assert.equal(await p.evaluate(()=>__testingGame().has('lab')),true);
await p.locator('[data-type="airfield"]').click();await clickWorld(200,1040);await tick(36);assert.equal(await p.evaluate(()=>__testingGame().has('airfield')),true);
await p.evaluate(()=>__testingGame().add('power','player',400,1250));await p.locator('#unit-tab').click();const types=await p.evaluate(()=>__testingGame().availableUnits());assert.equal(await p.locator('#catalog .card').count(),11);
for(const t of types){assert.equal(await p.locator(`[data-type="${t}"]`).isDisabled(),false);await p.locator(`[data-type="${t}"]`).click();}
await tick(110);const produced=await p.evaluate(()=>__testingGame().entities.filter(e=>e.team==='player').map(e=>e.type));for(const t of types)assert.ok(produced.includes(t),`${country} missing ${t}`);
if(country==='japan'){await p.locator('#ability').click();await p.waitForTimeout(220);assert.equal(await p.evaluate(()=>__testingGame().power.supply),350);}else if(country==='usa'){await p.locator('#ability').click();await clickWorld(530,930);await p.waitForTimeout(220);assert.equal(await p.evaluate(()=>__testingGame().abilityReadyAt>__testingGame().time),true);}
await p.locator('#catalog').evaluate(e=>e.scrollTop=0);await p.locator('.sidebar').evaluate(e=>e.scrollTop=0);await p.screenshot({path:path.join(artifacts, `game-${country}.png`)});console.log(`PASS ${country}: lobby, factory → tech/airfield, 11 available units produced, actual renders.`);
}
await p.locator('#new-game').click();const country=await p.evaluate(()=>__testingGame().country), time=await p.evaluate(()=>__testingGame().time);await p.waitForTimeout(600);assert.equal(await p.evaluate(()=>__testingGame().time),time);await p.locator('[data-faction="iron"]').click();await p.locator('#resume-game').click();assert.equal(await p.evaluate(()=>__testingGame().country),country);assert.ok(Math.abs((await p.evaluate(()=>__testingCamera().y))-620)<.5,'视野应停留在新基地');
await p.locator('#pause').click();const t=await p.evaluate(()=>__testingGame().time);await p.waitForTimeout(350);assert.equal(await p.evaluate(()=>__testingGame().time),t);await p.locator('#pause').click();
await p.mouse.move(500,500);await p.mouse.down({button:'middle'});await p.mouse.move(350,450,{steps:10});await p.mouse.up({button:'middle'});assert.ok((await p.evaluate(()=>__testingCamera().x))>100);
await p.setViewportSize({width:900,height:650});await p.locator('#new-game').click();await p.screenshot({path:path.join(artifacts, 'compact.png')});assert.ok((await p.locator('#deploy').boundingBox()).width>0);
assert.deepEqual(errors,[]);assert.equal(requests,0);console.log('PASS: return to ongoing game, pause, middle-drag, compact lobby. Browser errors: 0; external requests: 0.');
}finally{await browser.close();}
