const jwt = require('jsonwebtoken');
const getToken = require('./../helpers/getToken');
const Organization = require('../models/organization');
const User = require('../models/user');

module.exports = async (req, res, next) => {

    const user = await User.findById(getToken(req, res, next).userId)

    // check if the current user is the owner of the organization
    const organization = await Organization.findById(req.params.organization)

    if(organization.creator.toString() !== user._id.toString) {
        const error = new Error("You are not allowed to make this operation.")
        error.statusCode = 415
        throw error
    }
    return true
};
