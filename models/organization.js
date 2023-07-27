const mongoose = require('mongoose')

const Schema = mongoose.Schema;

/**
 * An organization is attached to the user who created it - creator
 * An organization has many users
 */
const organizationSchema = new Schema({

    name: {
        type: String,
        required: true
    },
    size: {
        type: String,
        required: true
    },
    industry: {
        type: String,
        required: true
    },
    workspace: {
        type: String
    },
    logo: String,
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    user: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    address: {
        line1: String,
        line2: String,
        city: String,
        postalCode: Number,
        country: String,
        province: String,
    },
    taxNum: String,
    phone: String,
    website: String,
    department: [{
        type: Schema.Types.ObjectId,
        ref: 'Department'
    }]
})

module.exports = mongoose.model('Organization', organizationSchema)