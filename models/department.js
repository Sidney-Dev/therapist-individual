const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const departmentSchema = new Schema({

    name: {
        type: String,
        required: true
    },
    organization: {
        type: Schema.Types.ObjectId,
        ref: 'Organization'
    }
})

departmentSchema.set('timestamps', true);

module.exports = mongoose.model('Department', departmentSchema)