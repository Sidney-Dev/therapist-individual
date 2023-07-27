const { body } = require('express-validator');
const User = require('../models/user');

module.exports.user = [
    body('email', 'Email is a required field').isEmail().trim().custom(async value => {
        const user = await User.findOne({ email: value });
        if (user) {
          throw new Error('E-mail already in use');
        }
        return true
    }),
    body('password', 'Enter a minimum acceptable password: 10 characters min, at least two lower case, 2 uppercase, 2 numbers, and one special character')
        .trim()
        .isStrongPassword({
            minLength: 10,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
        }),
    body('termsConditions').isBoolean(true)
    .custom(value => {
        if( value !== true) {
            throw new Error('Agree to terms and conditions')
        }
        return true
    }),
    body('confirmPassword')
    .custom((value, { req }) => {
        if( value !== req.body.password) {
            throw new Error('Passwords do not match')
        }
        return true
    })
]

module.exports.passwordReset = [
    body('password', 'Enter a minimum acceptable password: 10 characters min, at least two lower case, 2 uppercase, 2 numbers, and one special character')
    .trim()
    .isStrongPassword({
        minLength: 10,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
    }),
    body('confirmPassword')
    .custom((value, { req }) => {
        if( value !== req.body.password) {
            throw new Error('Passwords do not match')
        }
        return true
    })
]
