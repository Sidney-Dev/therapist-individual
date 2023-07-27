const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const profileSchema = new Schema({

    name: String,
    surname: String,
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
        ref: 'User',
        unique: true
    },
    position: String,
    department: String,
    employeeId: String
})

profileSchema.set('timestamps', true);

module.exports = mongoose.model('Profile', profileSchema)