const yahooFinance = require('yahoo-finance2').default
const optionsRouter = require('express').Router()

optionsRouter.get('/:ticker', async (request, response) => {
    const { ticker } = request.params

    let queryOptions = { lang: 'en-US', formatted: false, region: 'US' };
    let result = await yahooFinance.options(ticker, queryOptions);

    let dates;
    let data = []
    if (result && result.expirationDates) {
        dates = result.expirationDates
    }

    if (dates.length > 0) {
        for (let date of dates) {
            queryOptions.date = date
            result = await yahooFinance.options('NVDA', queryOptions)

            if (result) {
                data.push(result.options)
            }

            delete queryOptions.date
        }
    } 
        response.json(data)
    
})

module.exports = optionsRouter