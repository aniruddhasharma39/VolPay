const playwright = require('playwright');
(async () => {
    const browser = await playwright.chromium.launch();
    const page = await browser.newPage();
    page.on('console', msg => console.log('LOG:', msg.text()));
    page.on('pageerror', err => console.log('ERR:', err.message));
    await page.goto('http://localhost:8000');
    await page.waitForTimeout(2000);
    await browser.close();
})();
