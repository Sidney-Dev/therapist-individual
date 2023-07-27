const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const bookingSchema = new Schema({

    user: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }]

})

module.exports = mongoose.model('User', bookingSchema)