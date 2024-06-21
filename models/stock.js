const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator');

const metaSchema = new mongoose.Schema({
    currency: String,
    symbol: {
        type: String,
        unique: true
    },
    exchangeName: String,
    instrumentType: String,
    firstTradeDate: Date,
    regularMarketTime: Date,
    gmtoffset: Number,
    timezone: String,
    exchangeTimezoneName: String,
    regularMarketPrice: Number,
    chartPreviousClose: Number,
    priceHint: Number,
    currentTradingPeriod: {},
    dataGranularity: String,
    range: String,
    validRanges: [String]
})

metaSchema.plugin(uniqueValidator)

const quoteSchema = new mongoose.Schema({
    date: Date,
    high: Number,
    volume: Number,
    open: Number,
    low: Number,
    close: Number,
    adjclose: Number
})

const stockSchema = new mongoose.Schema({
    meta: metaSchema,
    quotes: [quoteSchema],
    events: {},
    lastUpdate: Date,
})

stockSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
    }
})

module.exports = mongoose.model('Stock', stockSchema)