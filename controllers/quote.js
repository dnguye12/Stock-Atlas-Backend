const yahooFinance = require('yahoo-finance2').default
const axios = require('axios');
const puppeteer = require('puppeteer');

const quoteRouter = require('express').Router()

const StockLogo = require('../models/stockLogo')

quoteRouter.get('/:ticker', async (request, response) => {
    const { ticker } = request.params

    try {
        let result = await yahooFinance.quote(ticker)
        if (result) {
            response.json(result)
        }
    } catch (error) {
        response.status(500).json({ error: `Failed to get quote for ${ticker}` });
    }
})

quoteRouter.get('/logo/:ticker', async (request, response) => {
    let { ticker } = request.params
    ticker = ticker.toUpperCase()

    try {
        let logo = await StockLogo.findById(ticker)
        let out
        if (logo) {
            out = logo
        } else {
            const url = `https://financialmodelingprep.com/image-stock/${ticker}.png?apikey=${process.env.FMP_API}`

            const result = await axios.get(url, { responseType: 'arraybuffer' })
            const imageBuffer = Buffer.from(result.data, 'binary');

            const newLogo = new StockLogo({
                _id: ticker,
                logo: imageBuffer
            })

            const savedLogo = await newLogo.save()
            out = savedLogo
        }
        const base64Logo = out.logo.toString('base64')
        response.json(base64Logo)

    } catch (error) {
        if (error.status && error.status === 404) {
            response.status(404).json({ message: 'Logo not found for the specified ticker.' });
        } else {
            console.log(error.toJSON())
            response.status(500).json({ message: 'An error occurred while fetching the logo.' });
        }
    }
})

quoteRouter.get('/summary/:ticker/*', async (request, response) => {
    const { ticker } = request.params
    const queryPart = request.params[0]
    const paramsList = queryPart.split('&')

    const queryOptions = {
        modules: paramsList
    }
    try {
        let result = await yahooFinance.quoteSummary(ticker, queryOptions)
        if (result) {
            response.json(result)
        }
    } catch (error) {
        response.status(500).json({ error: `Failed to get quote summary for ${ticker}` });
    }
})

quoteRouter.get('/recommendationsBySymbol/:ticker', async (request, response) => {
    const { ticker } = request.params

    try {
        let result = await yahooFinance.recommendationsBySymbol(ticker)
        if (result) {
            response.json(result)
        }
    } catch (error) {
        response.status(500).json({ error: `Failed to get recommendation by symbol for ${ticker}` });
    }
})

quoteRouter.get('/search/:query', async (request, response) => {
    const { query } = request.params

    const queryOptions = {
        quotesCount: 5,
        newsCount: 0
    }
    try {
        const result = await yahooFinance.search(query, queryOptions)

        if (result) {
            response.json(result)
        }
    } catch (error) {
        response.status(500).json({ error: `Failed to search result for ${query}` });
    }
})

quoteRouter.get('/news/:query/:count', async (request, response) => {
    const { query, count } = request.params

    const queryOptions = {
        quotesCount: 0,
        newsCount: count
    }
    try {
        const result = await yahooFinance.search(query, queryOptions)

        if (result) {
            response.json(result)
        }
    } catch (error) {
        response.status(500).json({ error: `Failed to search result for ${query}` });
    }
})

quoteRouter.get('/:ticker/esg', async (request, response) => {
    const { ticker } = request.params
    const url = `https://finance.yahoo.com/quote/${ticker}/sustainability/`

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
        } else {
            console.log('ESG - Accept All button not found');
        }

        await page.waitForSelector('section[data-testid="esg-cards"]');
        await page.waitForSelector('section[data-testid="esg-peer-risk-scores"]');

        const data = await page.evaluate(() => {
            const getCardData = (testid) => {
                const element = document.querySelector(`section[data-testid="${testid}"]`);
                if (!element) return null;

                const score = element.querySelector('h4')?.innerText || 'N/A';
                const percentile = element.querySelector('span')?.innerText || 'N/A';
                const performance = element.querySelector('.perf')?.innerText || 'N/A';

                return { score, percentile, performance };
            };

            const getPeerScores = () => {
                const peersTable = document.querySelector('section[data-testid="esg-peer-risk-scores"] table tbody')
                if (!peersTable) {
                    return []
                }

                const rows = Array.from(peersTable.querySelectorAll('tr'))
                return rows.map(row => {
                    const cells = row.querySelectorAll('td')
                    const nameCell = cells[0]?.innerText.trim() || 'N/A';
                    const [ticker, ...nameParts] = nameCell.split('\n');
                    const name = nameParts.join(' ').trim();
                    return {
                        ticker: ticker.trim(),
                        name: name,
                        totalESGScore: cells[1]?.innerText.trim() || 'N/A',
                        environmentalScore: cells[2]?.innerText.trim() || 'N/A',
                        socialScore: cells[3]?.innerText.trim() || 'N/A',
                        governanceScore: cells[4]?.innerText.trim() || 'N/A',
                    }
                })
            }

            const esgScore = [
                { type: 'Total ESG Risk Score', ...getCardData('TOTAL_ESG_SCORE') },
                { type: 'Environmental Risk Score', ...getCardData('ENVIRONMENTAL_SCORE') },
                { type: 'Social Risk Score', ...getCardData('SOCIAL_SCORE') },
                { type: 'Governance Risk Score', ...getCardData('GOVERNANCE_SCORE') }
            ];

            if (esgScore && !esgScore[0].score) {
                esgScore[0].score = (Number(esgScore[1].score) + Number(esgScore[2].score) + Number(esgScore[3].score)).toFixed(1)
            }

            return {
                esgScore: esgScore,
                peerScore: getPeerScores(),
            };
        });
        await browser.close();
        response.json(data)
    } catch (error) {
        console.error('Error:', error);
    }
})

quoteRouter.get('/:ticker/income-annual', async (request, response) => {
    const { ticker } = request.params

    const url = `https://finance.yahoo.com/quote/${ticker}/financials/`

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
        } else {
            console.log('Income Statement Annually - Accept All button not found');
        }

        await page.waitForSelector('.tableContainer .table .tableBody');

        const data = await page.evaluate(() => {
            const header = Array.from(document.querySelectorAll('.tableContainer .table .tableHeader .row')).map(row => {
                const cells = Array.from(row.querySelectorAll('.column'));
                return {
                    data: cells.map(cell => cell.innerText.trim())
                };
            });

            const table = document.querySelector('.tableContainer .table .tableBody')
            const rows = Array.from(table.querySelectorAll('.row'))
            const body = rows.map(row => {
                const cells = row.querySelectorAll('.column')
                const title = cells[0].querySelector('.rowTitle')?.innerText.trim() || ''

                let data = []
                Array.from(cells).slice(1).map(cell => {
                    data.push(cell.innerText.trim() || '')
                })

                return {
                    title,
                    data
                }
            })

            return {
                header,
                body
            }
        });
        await browser.close();
        response.json(data)
    } catch (error) {
        console.error('Error:', error);
    }
})

quoteRouter.get('/:ticker/income-quarterly', async (request, response) => {
    const { ticker } = request.params

    const url = `https://finance.yahoo.com/quote/${ticker}/financials/`

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

        await page.waitForSelector('.subToolbar')

        const quarterlyTabSelector = '#tab-quarterly';
        const quarterlyTab = await page.$(quarterlyTabSelector);

        if (quarterlyTab) {
            // Get the current data to compare later
            const initialData = await page.evaluate(() => {
                return document.querySelector('.tableContainer .table .tableBody')?.innerText;
            });

            await page.click(quarterlyTabSelector);

            // Wait for the aria-selected attribute to change to "true"
            await page.waitForFunction(
                selector => document.querySelector(selector).getAttribute('aria-selected') === 'true',
                {},
                quarterlyTabSelector
            );

            // Wait for the data to change after clicking the tab
            await page.waitForFunction(
                (initialData) => {
                    const newData = document.querySelector('.tableContainer .table .tableBody')?.innerText;
                    return newData && newData !== initialData;
                },
                {},
                initialData
            );

            await page.waitForSelector('.tableContainer .table .tableBody');
        } else {
            console.log('Change timeline button not found');
        }

        await page.waitForSelector('.tableContainer .table .tableBody');

        const data = await page.evaluate(() => {
            const header = Array.from(document.querySelectorAll('.tableContainer .table .tableHeader .row')).map(row => {
                const cells = Array.from(row.querySelectorAll('.column'));
                return {
                    data: cells.map(cell => cell.innerText.trim())
                };
            });

            const table = document.querySelector('.tableContainer .table .tableBody')
            const rows = Array.from(table.querySelectorAll('.row'))
            const body = rows.map(row => {
                const cells = row.querySelectorAll('.column')
                const title = cells[0].querySelector('.rowTitle')?.innerText.trim() || ''

                let data = []
                Array.from(cells).slice(1).map(cell => {
                    data.push(cell.innerText.trim() || '')
                })

                return {
                    title,
                    data
                }
            })

            return {
                header,
                body
            }
        });
        await browser.close();
        response.json(data)
    } catch (error) {
        console.error('Error:', error);
    }
})

quoteRouter.get('/:ticker/balance-sheet-annual', async (request, response) => {
    const { ticker } = request.params

    const url = `https://finance.yahoo.com/quote/${ticker}/balance-sheet/`

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

        await page.waitForSelector('.tableContainer .table .tableBody');
        const data = await page.evaluate(() => {
            const header = Array.from(document.querySelectorAll('.tableContainer .table .tableHeader .row')).map(row => {
                const cells = Array.from(row.querySelectorAll('.column'));
                return {
                    data: cells.map(cell => cell.innerText.trim())
                };
            });

            const table = document.querySelector('.tableContainer .table .tableBody')
            const rows = Array.from(table.querySelectorAll('.row'))
            const body = rows.map(row => {
                const cells = row.querySelectorAll('.column')
                const title = cells[0].querySelector('.rowTitle')?.innerText.trim() || ''

                let data = []
                Array.from(cells).slice(1).map(cell => {
                    data.push(cell.innerText.trim() || '')
                })

                return {
                    title,
                    data
                }
            })

            return {
                header,
                body
            }
        });

        await browser.close();
        response.json(data)
    } catch (error) {
        console.error('Error:', error);
    }
})

quoteRouter.get('/:ticker/balance-sheet-quarterly', async (request, response) => {
    const { ticker } = request.params

    const url = `https://finance.yahoo.com/quote/${ticker}/balance-sheet/`

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

        await page.waitForSelector('.subToolbar')

        const quarterlyTabSelector = '#tab-quarterly';
        const quarterlyTab = await page.$(quarterlyTabSelector);

        if (quarterlyTab) {
            // Get the current data to compare later
            const initialData = await page.evaluate(() => {
                return document.querySelector('.tableContainer .table .tableBody')?.innerText;
            });

            await page.click(quarterlyTabSelector);

            // Wait for the aria-selected attribute to change to "true"
            await page.waitForFunction(
                selector => document.querySelector(selector).getAttribute('aria-selected') === 'true',
                {},
                quarterlyTabSelector
            );

            // Wait for the data to change after clicking the tab
            await page.waitForFunction(
                (initialData) => {
                    const newData = document.querySelector('.tableContainer .table .tableBody')?.innerText;
                    return newData && newData !== initialData;
                },
                {},
                initialData
            );

            await page.waitForSelector('.tableContainer .table .tableBody');
        } else {
            console.log('Change timeline button not found');
        }

        const data = await page.evaluate(() => {
            const header = Array.from(document.querySelectorAll('.tableContainer .table .tableHeader .row')).map(row => {
                const cells = Array.from(row.querySelectorAll('.column'));
                return {
                    data: cells.map(cell => cell.innerText.trim())
                };
            });

            const table = document.querySelector('.tableContainer .table .tableBody')
            const rows = Array.from(table.querySelectorAll('.row'))
            const body = rows.map(row => {
                const cells = row.querySelectorAll('.column')
                const title = cells[0].querySelector('.rowTitle')?.innerText.trim() || ''

                let data = []
                Array.from(cells).slice(1).map(cell => {
                    data.push(cell.innerText.trim() || '')
                })

                return {
                    title,
                    data
                }
            })

            return {
                header,
                body
            }
        });

        await browser.close();
        response.json(data)
    } catch (error) {
        console.error('Error:', error);
    }
})

quoteRouter.get('/:ticker/cash-flow-annual', async (request, response) => {
    const { ticker } = request.params

    const url = `https://finance.yahoo.com/quote/${ticker}/cash-flow/`

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

        await page.waitForSelector('.tableContainer .table .tableBody');

        const data = await page.evaluate(() => {
            const header = Array.from(document.querySelectorAll('.tableContainer .table .tableHeader .row')).map(row => {
                const cells = Array.from(row.querySelectorAll('.column'));
                return {
                    data: cells.map(cell => cell.innerText.trim())
                };
            });

            const table = document.querySelector('.tableContainer .table .tableBody')
            const rows = Array.from(table.querySelectorAll('.row'))
            const body = rows.map(row => {
                const cells = row.querySelectorAll('.column')
                const title = cells[0].querySelector('.rowTitle')?.innerText.trim() || ''

                let data = []
                Array.from(cells).slice(1).map(cell => {
                    data.push(cell.innerText.trim() || '')
                })

                return {
                    title,
                    data
                }
            })

            return {
                header,
                body
            }
        });

        await browser.close();
        response.json(data)
    } catch (error) {
        console.error('Error:', error);
    }
})

quoteRouter.get('/:ticker/cash-flow-quarterly', async (request, response) => {
    const { ticker } = request.params

    const url = `https://finance.yahoo.com/quote/${ticker}/cash-flow/`

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

        await page.waitForSelector('.subToolbar')

        const quarterlyTabSelector = '#tab-quarterly';
        const quarterlyTab = await page.$(quarterlyTabSelector);

        if (quarterlyTab) {
            // Get the current data to compare later
            const initialData = await page.evaluate(() => {
                return document.querySelector('.tableContainer .table .tableBody')?.innerText;
            });

            await page.click(quarterlyTabSelector);

            // Wait for the aria-selected attribute to change to "true"
            await page.waitForFunction(
                selector => document.querySelector(selector).getAttribute('aria-selected') === 'true',
                {},
                quarterlyTabSelector
            );

            // Wait for the data to change after clicking the tab
            await page.waitForFunction(
                (initialData) => {
                    const newData = document.querySelector('.tableContainer .table .tableBody')?.innerText;
                    return newData && newData !== initialData;
                },
                {},
                initialData
            );

            await page.waitForSelector('.tableContainer .table .tableBody');
        } else {
            console.log('Change timeline button not found');
        }

        const data = await page.evaluate(() => {
            const header = Array.from(document.querySelectorAll('.tableContainer .table .tableHeader .row')).map(row => {
                const cells = Array.from(row.querySelectorAll('.column'));
                return {
                    data: cells.map(cell => cell.innerText.trim())
                };
            });

            const table = document.querySelector('.tableContainer .table .tableBody')
            const rows = Array.from(table.querySelectorAll('.row'))
            const body = rows.map(row => {
                const cells = row.querySelectorAll('.column')
                const title = cells[0].querySelector('.rowTitle')?.innerText.trim() || ''

                let data = []
                Array.from(cells).slice(1).map(cell => {
                    data.push(cell.innerText.trim() || '')
                })

                return {
                    title,
                    data
                }
            })

            return {
                header,
                body
            }
        });

        await browser.close();
        response.json(data)
    } catch (error) {
        console.error('Error:', error);
    }
})

quoteRouter.get('/:ticker/ratios-annual', async (request, response) => {
    const { ticker } = request.params
    const url = `https://stockanalysis.com/stocks/${ticker}/financials/ratios/`;

    try {
        const browser = await puppeteer.launch()
        const page = await browser.newPage()

        await page.setViewport({ width: 1920, height: 1080 });
        await page.goto(url)

        await page.waitForSelector('#main-table')

        const data = await page.evaluate(() => {
            const header = Array.from(document.querySelectorAll('#main-table thead tr th')).slice(0, -1).map((cell, idx) => {
                return cell.innerText.trim()
            })

            const rows = Array.from(document.querySelectorAll('#main-table tbody tr'))
            const body = rows.map(row => {
                let data = []
                Array.from(row.querySelectorAll('td')).slice(0, -1).map(c => {
                    if (c.innerText.trim() === '-') {
                        data.push('--')
                    }
                    data.push(c.innerText.trim() || '--')
                })
                return data
            })

            return {
                header,
                body
            }
        });

        await browser.close();
        response.json(data)
    } catch (error) {
        console.error(error);
        throw error;
    }
})

quoteRouter.get('/:ticker/ratios-quarterly', async (request, response) => {
    const { ticker } = request.params
    const url = `https://stockanalysis.com/stocks/${ticker}/financials/ratios/?p=quarterly`;

    try {
        const browser = await puppeteer.launch()
        const page = await browser.newPage()

        await page.setViewport({ width: 1920, height: 1080 });
        await page.goto(url)

        await page.waitForSelector('#main-table')

        const data = await page.evaluate(() => {
            const header = Array.from(document.querySelectorAll('#main-table thead tr th')).slice(0, -1).map((cell, idx) => {
                return cell.innerText.trim()
            })

            const rows = Array.from(document.querySelectorAll('#main-table tbody tr'))
            const body = rows.map(row => {
                let data = []
                Array.from(row.querySelectorAll('td')).slice(0, -1).map(c => {
                    if (c.innerText.trim() === '-') {
                        data.push('--')
                    }
                    data.push(c.innerText.trim() || '--')
                })
                return data
            })

            return {
                header,
                body
            }
        });

        await browser.close();
        response.json(data)
    } catch (error) {
        console.error(error);
        throw error;
    }
})

module.exports = quoteRouter