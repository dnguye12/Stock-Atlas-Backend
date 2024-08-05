const yahooFinance = require('yahoo-finance2').default
const insightsRouter = require('express').Router()

insightsRouter.get('/:ticker/:reportsCount', async (request, response) => {
    const { ticker, reportsCount } = request.params

    const queryOptions = { lang: 'en-US', reportsCount };
    const result = await yahooFinance.insights(ticker, queryOptions);

    if(result) {
        response.json(result)
    }
})