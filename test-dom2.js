import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 3000));
  const html = await page.evaluate(() => document.getElementById('root').innerHTML);
  console.log('ROOT HTML:', html);
  
  await browser.close();
  process.exit(0);
})();
