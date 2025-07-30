import { test as setup, request } from '@playwright/test';
import user from '../.auth/user.json';
import fs from 'fs';

const authFile = '.auth/user.json'

setup('authentication', async ({ request }) => {
    // Use API call
    const response = await request.post('https://conduit-api.bondaracademy.com/api/users/login', {
        data: { "user": { "email": "ryan.d.shang@gmail.com", "password": "123456789" } }
    })
    const responseBody = await response.json();
    const accessToken = responseBody.user.token;
    user.origins[0].localStorage[0].value = accessToken;
    fs.writeFileSync(authFile, JSON.stringify(user))

    process.env['ACCESS_TOKEN'] = accessToken
})