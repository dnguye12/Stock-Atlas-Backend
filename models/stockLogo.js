const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const stockLogoSchema = new mongoose.Schema({
    _id: {
        type: String
    },
    logo: {
        type: Buffer
    }
})

stockLogoSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
    }
})

module.exports = mongoose.model('StockLogo', stockLogoSchema)
