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
  await page.screenshot({ path: 'C:/Users/oziea/verify_after_login.png' });

  // Navigate to Pre-Earnings Runners
  await page.goto('http://5.78.186.108:3001/earnings/summary');
  await page.waitForTimeout(3000);
  console.log('Summary URL:', page.url());
  await page.screenshot({ path: 'C:/Users/oziea/verify_summary.png' });

  // Click Historical Performance tab/link
  const histLink = page.locator('text=Historical').first();
  if (await histLink.count() > 0) {
    await histLink.click();
    await page.waitForTimeout(3000);
    console.log('Historical URL:', page.url());
    await page.screenshot({ path: 'C:/Users/oziea/verify_historical.png' });
  } else {
    // Try direct navigation
    await page.goto('http://5.78.186.108:3001/earnings/history');
    await page.waitForTimeout(3000);
    console.log('Direct hist URL:', page.url());
    await page.screenshot({ path: 'C:/Users/oziea/verify_historical.png' });
  }

  await browser.close();
})();
