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
            const rows = document.querySelectorAll('table tbody tr.row')

            for (let i = 0; i < count && i < rows.length; i++) {
                const row = rows[i];
                const cells = row.querySelectorAll('td');

                if (cells.length >= 9) {
                    const block0 = cells[0].textContent.trim().split(' ')
                    const symbol = block0[0]
                    const name = block0.slice(1).join(' ')

                    const block1 = cells[1].textContent.trim().split(' ')
                    const price = block1[0]
                    const change = block1[1]
                    const percentChange = block1[2].replace(/[()]/g, '')

                    const rowObj = {
                        symbol,
                        name,
                        price,
                        change,
                        percentChange,
                        volume: cells[4].textContent.trim(),
                        avgVol: cells[5].textContent.trim(),
                        marketCap: cells[6].textContent.trim(),
                        pe: cells[7].textContent.trim()
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
            const rows = document.querySelectorAll('table tbody tr.row')

            for (let i = 0; i < count && i < rows.length; i++) {
                const row = rows[i];
                const cells = row.querySelectorAll('td');

                if (cells.length >= 9) {
                    const block0 = cells[0].textContent.trim().split(' ')
                    const symbol = block0[0]
                    const name = block0.slice(1).join(' ')

                    const block1 = cells[1].textContent.trim().split(' ')
                    const price = block1[0]
                    const change = block1[1]
                    const percentChange = block1[2].replace(/[()]/g, '')

                    const rowObj = {
                        symbol,
                        name,
                        price,
                        change,
                        percentChange,
                        volume: cells[4].textContent.trim(),
                        avgVol: cells[5].textContent.trim(),
                        marketCap: cells[6].textContent.trim(),
                        pe: cells[7].textContent.trim()
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

dailyRouter.get('/most-shorted-stocks', async(request, response) => {
    const url = 'https://finance.yahoo.com/screener/predefined/most_shorted_stocks?offset=0&count=100'

    try {
        const browser = await puppeteer.launch()
        const page = await browser.newPage()

        await page.setViewport({ width: 1920, height: 1080 });
        await page.goto(url)
        await page.waitForSelector('#consent-page .con-wizard')
        let acceptButtonSelector = '.actions .accept-all';
        let acceptButton = await page.$(acceptButtonSelector);

        if (acceptButton) {
            await page.click(acceptButtonSelector);
        } else {
            console.log('ESG - Accept All button not found');
        }

        await page.waitForSelector('table')

        const data = await page.evaluate(() => {
            const table = document.querySelector('table tbody')
            const rows = Array.from(table.querySelectorAll('.simpTblRow'))
            return rows.map(row => {
                const cells = row.querySelectorAll('td')

                if (cells.length >= 9) {
                    const title = cells[0].innerText.trim() || ''
                    const name = cells[1].innerText.trim() || ''
                    const price = cells[2].innerText.trim() || ''
                    const change = cells[3].innerText.trim() || ''
                    const percentChange = cells[4].innerText.trim() || ''
                    const volume = cells[5].innerText.trim() || ''
                    const avgVolume = cells[6].innerText.trim() || ''
                    const marketCap = cells[7].innerText.trim() || ''
                    const pe = cells[8].innerText.trim() !== "N/A" ? cells[8].innerText.trim() : ''

                    return {
                        title, name, price, change, percentChange, volume, avgVolume, marketCap, pe
                    }
                }
            })
        });

        await browser.close();
        response.json(data)
    } catch (error) {
        console.error('Error:', error);
    }
})

module.exports = dailyRouter