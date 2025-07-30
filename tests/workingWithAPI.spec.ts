import { test, expect, request } from '@playwright/test';
import tags from '../test-data/tags.json'

test.beforeEach(async ({ page }) => {
    // intercept API request '*/**/api/tags'
    await page.route('*/**/api/tags', async route => {
        await route.fulfill({
            body: JSON.stringify(tags)
        })
    });

    await page.goto('https://conduit.bondaracademy.com/');
    // await page.getByText('Sign in').click();
    // await page.getByRole('textbox', {name: "Email"}).fill('ryan.d.shang@gmail.com');
    // await page.getByRole('textbox', {name: "Password"}).fill('123456789');
    // await page.getByRole('button', {name: "Sign in"}).click();
})

test('project setup', async ({ page }) => {
    // intercept API response '*/**/api/articles*'
    await page.route('*/**/api/articles*', async route => {
        const response = await route.fetch();
        const responseBody = await response.json()
        responseBody.articles[0].title = "This is a MOCK test title";
        responseBody.articles[0].description = "This is a MOCK description";
        await route.fulfill({
            body: JSON.stringify(responseBody)
        })
    })

    await page.getByText('Global Feed').click();
    await expect(page.locator('.navbar-brand')).toHaveText('conduit');

    // if I do not write assertion, the test would fail (the route would not take effect).
    await expect(page.locator('app-article-list h1').first()).toContainText("This is a MOCK test title");
    await expect(page.locator('app-article-list p').first()).toContainText("This is a MOCK description");

    // await page.waitForTimeout(1000);
})

// To test the delete article feature
test('delete article', async ({ page, request }) => {
    //  Step 1: User log in and get the token
    const response = await request.post('https://conduit-api.bondaracademy.com/api/users/login', {
        data: { "user": { "email": "ryan.d.shang@gmail.com", "password": "123456789" } }
    })
    const responseBody = await response.json()
    const accessToken = responseBody.user.token;
    console.log(accessToken); // 

    // Step 2: Publish the article
    const testTitle = "Test Title" + Date.now()
    const articleResponse = await request.post('https://conduit-api.bondaracademy.com/api/articles/', {
        data: { "article": { "title": testTitle, "description": "Test description", "body": "Test body", "tagList": [] } },
        headers: {
            Authorization: `Token ${accessToken}`
        }
    })
    // Assertion: expect the create API to working fine.
    expect(articleResponse.status()).toEqual(201)

    await page.getByText('Global Feed').click()
    await page.getByText(testTitle).click()
    await page.getByRole('button', {name: "Delete Article"}).first().click()
    await page.getByText('Global Feed').click()

    await expect(page.locator('app-article-list h1').first()).not.toContainText(testTitle);
})

test('create article', async ({page, request}) => {
    await page.getByText('New Article').click();
    await page.getByRole('textbox', {name: 'Article Title'}).fill('Playwright is awesome');
    await page.getByRole('textbox', {name: "What's this article about?"}).fill('About the Playwright');
    await page.getByRole('textbox', {name: "Write your article (in markdown)"}).fill('We like to use Playwright for automation');
    await page.getByRole('button', {name: 'Publish Article'}).click();
    const articleResponse = await page.waitForResponse('https://conduit-api.bondaracademy.com/api/articles/')
    const articleResponseBody = await articleResponse.json()
    console.log(`articleResponseBody is: ${articleResponseBody}`)
    const slugId = articleResponseBody.article.slug

    // await expect(page.locator('.article-page h1')).toContainText('Playwright is awesome');
    await page.getByText('Home').click()
    await page.getByText('Global Feed').click()
    await expect(page.locator('app-article-list h1').first()).toContainText('Playwright is awesome');


    const response = await request.post('https://conduit-api.bondaracademy.com/api/users/login', {
        data: { "user": { "email": "ryan.d.shang@gmail.com", "password": "123456789" } }
    })
    const responseBody = await response.json()
    const accessToken = responseBody.user.token;
    
    const deleteArticleResponse = await request.delete(`https://conduit-api.bondaracademy.com/api/articles/${slugId}`, {
        headers: {
            Authorization: `Token ${accessToken}`
        }
    })

    expect(deleteArticleResponse.status()).toEqual(204);
})