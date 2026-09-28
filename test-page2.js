import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
     if (msg.type() === 'error') {
       console.log('PAGE ERROR LOG:', msg.text());
     }
  });
  page.on('pageerror', err => console.log('PAGE UNCAUGHT ERROR:', err.toString()));

  console.log("Navigating...");
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));
  console.log("Done!");
  await browser.close();
  process.exit(0);
})();
