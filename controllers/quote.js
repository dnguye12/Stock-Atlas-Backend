const yahooFinance = require('yahoo-finance2').default
const quoteRouter = require('express').Router()

quoteRouter.get('/:ticker', async( request, response) => {
    const {ticker} = request.params

    try {
        let result = await yahooFinance.quote(ticker)
        if(result) {
            response.json(result)
        }
    }catch(error) {
        response.status(500).json({ error: `Failed to get quote for ${ticker}` });
    }
})

module.exports = quoteRouter