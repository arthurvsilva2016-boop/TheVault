import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
     console.log('LOG:', msg.text());
  });
  page.on('pageerror', err => {
    console.log('PAGE UNCAUGHT ERROR:', err.toString());
  });

  await page.goto('http://localhost:3000');
  await new Promise(r => setTimeout(r, 2000));
  
  // Click "Sign In with Google" which might bypass actual google if it's mocked, or we can see what it does.
  // Wait, I can inject a script to force activeEmployeeId and authType!
  await page.evaluate(() => {
     // I can't easily force React state.
     // Let's click the login button!
     const btn = document.querySelector('button');
     if (btn) btn.click();
  });
  
  await new Promise(r => setTimeout(r, 4000));
  await browser.close();
  process.exit(0);
})();
