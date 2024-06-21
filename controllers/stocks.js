const stocksRouter = require('express').Router()
const Stock = require('../models/stock')

stocksRouter.get('/', async (request, response) => {
    const stocks = await Stock.find({})
    response.json(stocks)
})

stocksRouter.get('/:id', async (request, response) => {
    const stock = await Stock.findById(request.params.id)
    if (stock) {
        response.json(stock)
    } else {
        response.status(404).end()
    }
})

stocksRouter.post('/', async (request, response) => {
    const body = request.body

    const stock = new Stock({
        meta: body.meta,
        quotes: body.quotes,
        events: body.events,
        lastUpdate: Date.now(),
    })

    const savedStock = await stock.save()
    response.status(201).json(savedStock)
})

stocksRouter.delete('/:id', async (request, response) => {
	await Blog.findByIdAndRemove(request.params.id)
	response.status(204).end()
})


stocksRouter.put('/:id', async (request, response) => {
	const body = request.body
  
	const stock = {
        meta: body.meta,
        quotes: body.quotes,
        events: body.events,
        lastUpdate: Date.now(),
    }
  
	await Stock.findByIdAndUpdate(request.params.id, stock, { new: true })
	response.json(stock)
  })

module.exports = stocksRouter