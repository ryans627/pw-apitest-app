import { test, expect } from '@playwright/test';
import tags from '../test-data/tags.json'

test.beforeEach(async ({ page }) => {
    // intercept API request '*/**/api/tags'
    await page.route('*/**/api/tags', async route => {
        await route.fulfill({
            body: JSON.stringify(tags)
        })
    });

    // intercept API response '*/**/api/articles*'
    await page.route('*/**/api/articles*', async route => {
        const response = await route.fetch();
        const responseBody = await response.json()
        responseBody.articles[0].title = "This is a test title";
        responseBody.articles[0].description = "This is a description";
        await route.fulfill({
            body: JSON.stringify(responseBody)
        })
    })

    await page.goto('https://conduit.bondaracademy.com/');
})

test('project setup', async ({ page }) => {
    await expect(page.locator('.navbar-brand')).toHaveText('conduit');

    // if I do not write assertion, the test would fail (the route would not take effect).
    await expect(page.locator('app-article-list h1').first()).toContainText("This is a test title");
    await expect(page.locator('app-article-list p').first()).toContainText("This is a description");
    
    // await page.waitForTimeout(1000);
})