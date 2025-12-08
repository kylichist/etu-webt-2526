const { test, expect } = require('@playwright/test');

test('Buy and sell stocks updates balance and profit', async ({ page }) => {
    await page.goto('http://localhost:8000/');
    await page.fill('input[name="name"]', 'Alice');
    await page.click('button[type="submit"]');

    await page.goto('http://localhost:8000/broker');

    await page.click('xpath=//table//td[text()="AAPL"]/following-sibling::td//button[text()="Купить"]');
    await page.fill('input[placeholder="Количество"]', '10');
    await page.click('button[text()="OK"]');

    const balance = await page.textContent('xpath=//p[contains(text(), "Баланс")]');
    expect(balance).toContain('9000');

    await page.click('xpath=//table//td[text()="AAPL"]/following-sibling::td//button[text()="Продать"]');
    await page.fill('input[placeholder="Количество"]', '5');
    await page.click('button[text()="OK"]');

    const profit = await page.textContent('xpath=//table[@class="portfolio"]//td[text()="AAPL"]/following-sibling::td[2]');
    expect(profit).toBe('0');
});
