const mongoose = require('mongoose')
const shortid = require('shortid');

const Schema = mongoose.Schema;

/**
 * A user can make one or more appointment
 * A user may belong to an organisation
 */
const userSchema = new Schema({

    name: String,
    surname: String,
    email: {
        type: String,
        unique: true
    },
    password: {
        type: String
    },
    token: {
        type: String,
        default: shortid.generate
    },
    status: {
        type: String,
        default: 'inactive',
        enum: ['active', 'inactive']
    },
    role: {
        type: String,
        default: 'anonymous',
        enum: ['admin', 'therapist', 'patient', 'anonymous', 'organization']
    },
    organization: { // a user belongs to an organization
        type: Schema.Types.ObjectId,
        ref: 'Organization'
    },
    department: { // a user belongs to an organization
        type: Schema.Types.ObjectId,
        ref: 'Department'
    },
    profile: { // a user belongs to a department
        type: Schema.Types.ObjectId,
        ref: 'Profile'
    },
    position: String,
    employeeId: String,
    profilePic: String,
    cellphone: String,
    gender: String,
    dateOfBirth: {
      type: Date
    }
})

userSchema.set('timestamps', true);

module.exports = mongoose.model('User', userSchema)