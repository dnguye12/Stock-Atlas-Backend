const yahooFinance = require('yahoo-finance2').default
const axios = require('axios');

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
    const { ticker } = request.params

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

quoteRouter.get('/summary/:ticker/*', async(request, response) => {
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

module.exports = quoteRouter