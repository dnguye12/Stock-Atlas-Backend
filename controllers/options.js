const yahooFinance = require('yahoo-finance2').default
const optionsRouter = require('express').Router()

optionsRouter.get('/:ticker', async (request, response) => {
    const { ticker } = request.params

    let queryOptions = { lang: 'en-US', formatted: false, region: 'US' };
    let result = await yahooFinance.options(ticker, queryOptions);

    let dates;
    let res = {}
    let data = []
    if (result && result.expirationDates) {
        dates = result.expirationDates
    }

    if (dates.length > 0) {
        for (let date of dates) {
            queryOptions.date = date
            result = await yahooFinance.options(ticker, queryOptions)

            if (result) {
                data.push(
                    {
                        strikes: result.strikes,
                        options: result.options
                    }
                )
            }

            delete queryOptions.date
        }
    }

    res.expirationDates = dates
    res.data = data
    response.json(res)

})

module.exports = optionsRouter