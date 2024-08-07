const yahooFinance = require('yahoo-finance2').default
const optionsRouter = require('express').Router()

optionsRouter.get('/:ticker', async (request, response) => {
    const { ticker } = request.params

    const queryOptions = { lang: 'en-US', formatted: false, region: 'US' };
    const result = await yahooFinance.options(ticker, queryOptions)

    if (result) {
        response.json(result)
    }
})

module.exports = optionsRouter