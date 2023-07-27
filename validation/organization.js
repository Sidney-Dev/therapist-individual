const { body } = require('express-validator');
const Department = require('../models/department');
const Organization = require('../models/organization');
const User = require('../models/user');

module.exports.general = [
    body('logo')
    .custom((value, { req }) => {
        if(!req.body.log) throw Error("Logo is required.")
        return true
    })
]

module.exports.update = [
    body('taxNum').trim().isNumeric(),
]

module.exports.createUser = [
    body('email', 'Email is a required field').isEmail().trim().custom(async value => {
        const user = await User.findOne({ email: value });
        if (user) {
          throw new Error('E-mail already in use');
        }
        return true
    })
]

/**
 * For the current organization check if a department with desired name already exists
 * 
 */
module.exports.departmentExists = [
    body('name')
    .custom(async (value, { req }) => {
        const deparments = await Department.find({ organization: req.params.organization })
        deparments.forEach(department => {
            if(department.name == req.body.name) throw new Error("Department already exists.")
        });
        return true
    })
]

module.exports.emailExists = [
    body('email')
    .custom(async (value, { req }) => {
        const user = await User.findOne({ email: value })
        if(!user) return true
        if(user.email == value) throw new Error("Email already exists.")
        
    })
]

module.exports.organizationExists = [
    body('orgName')
    .custom(async (value, { req }) => {
        const org = await Organization.findOne({ name: req.body.orgName })
        if(org) throw new Error("Organization name already taken.")
        return true
    })
]

module.exports.departmentUpdate = [
    body('name')
    .custom(async (value, { req }) => {
        const departments = await Department.find({ organization: req.params.organization })
        // check if there is another department with this same name
        departments.forEach(department => {
            if(department.name == value && department._id != req.params.department) throw new Error(`${value} already exists for this organization`)
        })
        return true
    })
]
