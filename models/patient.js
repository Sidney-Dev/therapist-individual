const mongoose = require('mongoose')
const Schema = mongoose.Schema;

/**
 * A user can make one or more appointment
 * A user may belong to an organisation
 */
const patientSchema = new Schema({

    profilePic: String,
    cellphone: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    dateOfBirth: {
      type: Date
    },
    feeling: {
        type: String,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
})

patientSchema.set('timestamps', true);

module.exports = mongoose.model('Patient', patientSchema)