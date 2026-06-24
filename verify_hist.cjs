const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('http://5.78.186.108:3001/login');
  await page.fill('input[type="email"]', 'ozie.adams@gmail.com');
  await page.fill('input[type="password"]', 'Oziea@1971');
  await page.click('button[type="submit"]');
  try { await page.waitForNavigation({ timeout: 8000 }); } catch(e) {}
  await page.waitForTimeout(2000);
  console.log('After login URL:', page.url());

  // Try direct navigation to historical page
  await page.goto('http://5.78.186.108:3001/earnings/history');
  await page.waitForTimeout(4000);
  console.log('Historical URL:', page.url());
  await page.screenshot({ path: 'C:/Users/oziea/verify_historical.png', fullPage: true });

  // Also get page text
  const bodyText = await page.locator('body').innerText();
  console.log('Page text (first 2000 chars):', bodyText.substring(0, 2000));

  await browser.close();
})();
