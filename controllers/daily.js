const yahooFinance = require('yahoo-finance2').default
const dailyRouter = require('express').Router()

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
        if(error.name && error.name === "FailedYahooValidationError") {
            if(error.result) {
                response.json(error.result); 
            }
        }else {
            response.status(500).json({ error: 'Failed to fetch data' });
        }
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

module.exports = dailyRouter