const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests',
    projects: [
        {
            name: 'chromium',
            use: {
                browserName: 'chromium',
                headless: true,
            },
        },
    ],
    use: {
        baseURL: process.env.BASE_URL || 'http://localhost:8000',
        actionTimeout: 10000,
        navigationTimeout: 20000,
    },
});
