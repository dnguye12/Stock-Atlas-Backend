const yahooFinance = require('yahoo-finance2').default
const chartRouter = require('express').Router()

chartRouter.get('/:ticker/div', async (request, response) => {
    const {ticker} = request.params
    const queryOptions = {period1: '1990-01-01', events: "div"}
    const result = await yahooFinance.chart(ticker, queryOptions)
    if(result) {
        response.json(result)
    }
})

chartRouter.get('/:ticker/:period1/:period2?/:intervals?', async (request, response) => {
    const { ticker, period1, period2, intervals } = request.params;
    const queryOptions = { period1: period1 }
    if(period2) {
        queryOptions.period2 = period2
    }
    if(intervals) {
        queryOptions.interval = intervals
    }

    const result = await yahooFinance.chart(ticker, queryOptions)
    if(result) {
        response.json(result)
    }
})

module.exports = chartRouter