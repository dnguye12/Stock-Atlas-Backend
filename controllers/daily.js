const yahooFinance = require('yahoo-finance2').default
const dailyRouter = require('express').Router()
const puppeteer = require('puppeteer');

dailyRouter.get('/gainers/:count?/:region?', async (request, response) => {
    const { count, region } = request.params
    const queryOptions = {}
    if (count) {
        if (isNaN(count)) {
            queryOptions.count = 5
            queryOptions.region = count
        }
        queryOptions.count = count
    } else {
        queryOptions.count = 5
    }

    if (count && region) {
        queryOptions.region = region
    }

    let result
    try {
        result = await yahooFinance.dailyGainers(queryOptions)
        if (result) {
            response.json(result)
        }
    } catch (error) {
        if (error.name && error.name === "FailedYahooValidationError") {
            if (error.result) {
                response.json(error.result);
            }
        } else {
            response.status(500).json({ error: 'Failed to fetch data' });
        }
    }
})

dailyRouter.get('/losers/:count?/', async (request, response) => {
    let { count } = request.params

    if (!count || isNaN(count)) {
        count = 5
    }

    const url = 'https://finance.yahoo.com/losers/'

    try {
        const browser = await puppeteer.launch()
        const page = await browser.newPage()

        await page.setViewport({ width: 1920, height: 1080 });
        await page.goto(url)
        await page.waitForSelector('#consent-page .con-wizard')

        const acceptButtonSelector = '.actions .accept-all';
        const acceptButton = await page.$(acceptButtonSelector);

        if (acceptButton) {
            await page.click(acceptButtonSelector);
            await page.waitForSelector('table')
        } else {
            console.log('daily/active API - Accept All button not found');
        }

        const content = await page.evaluate((count) => {
            const res = []
            const rows = document.querySelectorAll('table tbody tr.simpTblRow')

            for (let i = 0; i < count && i < rows.length; i++) {
                const row = rows[i];
                const cells = row.querySelectorAll('td');

                if (cells.length >= 9) {
                    const rowObj = {
                        symbol: cells[0].textContent.trim(),
                        name: cells[1].textContent.trim(),
                        price: cells[2].textContent.trim(),
                        change: cells[3].textContent.trim(),
                        percentChange: cells[4].textContent.trim(),
                        volume: cells[5].textContent.trim(),
                        avgVol: cells[6].textContent.trim(),
                        marketCap: cells[7].textContent.trim(),
                        pe: cells[8].textContent.trim()
                    };
                    res.push(rowObj);
                }

            }
            return res
        }, count)
        await browser.close()
        response.json(content)
    } catch (error) {
        console.error(error);
        throw error;
    }
})

dailyRouter.get('/trending/:count?/:region?', async (request, response) => {
    let { count, region } = request.params
    const queryOptions = {}
    if (count) {
        if (isNaN(count)) {
            queryOptions.count = 5
            region = count
        } else {
            queryOptions.count = count
        }
    } else {
        queryOptions.count = 5
    }

    if (!region) {
        region = 'US'
    }

    const result = await yahooFinance.trendingSymbols(region, queryOptions)
    if (result) {
        response.json(result)
    }
})

dailyRouter.get('/active/:count?', async (request, response) => {
    let { count } = request.params

    if (!count || isNaN(count)) {
        count = 5
    }

    const url = `https://finance.yahoo.com/most-active/`

    try {
        const browser = await puppeteer.launch()
        const page = await browser.newPage()

        await page.setViewport({ width: 1920, height: 1080 });
        await page.goto(url)
        await page.waitForSelector('#consent-page .con-wizard')

        const acceptButtonSelector = '.actions .accept-all';
        const acceptButton = await page.$(acceptButtonSelector);

        if (acceptButton) {
            await page.click(acceptButtonSelector);
            await page.waitForSelector('table')
        } else {
            console.log('daily/active API - Accept All button not found');
        }

        const content = await page.evaluate((count) => {
            const res = []
            const rows = document.querySelectorAll('table tbody tr.simpTblRow')

            for (let i = 0; i < count && i < rows.length; i++) {
                const row = rows[i];
                const cells = row.querySelectorAll('td');

                if (cells.length >= 9) {
                    const rowObj = {
                        symbol: cells[0].textContent.trim(),
                        name: cells[1].textContent.trim(),
                        price: cells[2].textContent.trim(),
                        change: cells[3].textContent.trim(),
                        percentChange: cells[4].textContent.trim(),
                        volume: cells[5].textContent.trim(),
                        avgVol: cells[6].textContent.trim(),
                        marketCap: cells[7].textContent.trim(),
                        pe: cells[8].textContent.trim()
                    };
                    res.push(rowObj);
                }

            }
            return res
        }, count)
        await browser.close()
        response.json(content)
    } catch (error) {
        console.error(error);
        throw error;
    }
})

module.exports = dailyRouter