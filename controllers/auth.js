//libraries
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { validationResult } = require('express-validator')
const path = require('path')
const shortid = require('shortid');
const emailSend = require('./../helpers/email-send')

// 
const organizationPortalLink = process.env.ORG_PORTAL

// models
const User = require('./../models/user')
const Organization = require('../models/organization')

/**
 * User registration
 */
exports.orgRegister = (req, res, next) => {

    const { errors } = validationResult(req)

    if(errors.length > 0) return res.status(422).json({ error: errors })
    
    let { name, surname, email, number, password } = req.body
    let savedUser, savedOrg;

    bcrypt
    .hash(password, 12)
    .then(async hashedPassword => {

        const user = new User({ name, surname, email, number, password: hashedPassword, role: "organization" })
        savedUser = await user.save()

        const orgObject = {
            name: req.body.orgName,
            size: req.body.orgSize,
            creator: savedUser._id,
            industry: req.body.industry,
            logo: req.body.logo
        }

        if(savedUser) {

            savedOrg = await (new Organization(orgObject)).save()

            emailSend(user.email, `${savedOrg.name} - Your account confirmation`, 'email', {
                    id: savedUser._id,
                    name: savedUser.name,
                    url: `${req.protocol}://${req.hostname}/v1/user/${savedUser._id}/${savedUser.token}`                
            })
        }
        return res.status(201).json({ statusMessage: 'created and email sent' })
    })
    .catch(async err => {

        if(savedUser) {
            await User.deleteOne({ email: savedUser.email})
        }
        if(savedOrg) {
            await Organization.deleteOne({ _id: savedOrg._id})
        }
        next(err)
    })
}

/**
 * User registration
 * 
 */
exports.patientRegister = async (req, res, next) => {

    const { errors } = validationResult(req)

    if(errors.length > 0) return res.status(422).json({ error: errors })
    
    let { name, surname, email, password } = req.body
    let { feeling, dateOfBirth, gender, cellphone } = req.body
    let user, profile

    try {
        const hashedPassword = (await bcrypt.hash(password, 12)).toString()
        user = await (new User({ name, surname, email, password: hashedPassword, role: "patient" })).save()

        if(!user) throw new Error("Could not save user records")

        dateOfBirth = new Date(dateOfBirth)
        dateOfBirth = dateOfBirth.toDateString()

        profile = await (new profile({ feeling, dateOfBirth, gender, cellphone, user: user._id })).save()
        if(!profile) throw new Error("Could not save patient records")

        sendEmail(user.email, 'Cloud Therapist - Welcome notification', "email", {
            id: user._id,
            name: user.name,
            url: `${req.protocol}://${req.hostname}/v1/user/${user._id}/${user.token}`
        })

        res.status(201).json({ user, profile })

    } catch(error) {
        next(error)
    }
}

exports.validateToken = async (req, res, next) => {

    try {
        
        const user = await User.findById(req.params.userId)
        if(user.token === req.params.token) {

            user.token = ''
            user.status = 'active'
            await user.save()

            return res.redirect(`${organizationPortalLink}/login`)

        }
        res.status(422).json({
            error: "token mismatch"
        })

    } catch(error) {
        error.statusCode = 422
        next(error)
    }
}

// Business Portal - validate user account
exports.businessValidateUserToken = async (req, res, next) => {

    try {
        
        const user = await User.findById(req.params.userId)
        if(user.token === req.params.token) {

            user.token = ''
            user.status = 'active'
            updatedUser = await user.save()

            if(user.role == "patient") {
                return res.redirect('https://therapist-org-portal.vercel.app/onboarding/recover-account')
            } else if (user.role == 'organization') {
                return res.redirect('https://therapist-org-portal.vercel.app/onboarding/login')
            }

        }
        res.status(422).json({
            error: "token mismatch"
        })

    } catch(error) {
        error.statusCode = 422
        next(error)
    }
}

exports.login = async (req, res, next) => {

    const email = req.body.email
    const password = req.body.password
    let loadedUser;

    User.findOne({ email: email })
    .then(user => {
        if(!user) {
            const error = new Error("A user with this email could not be found")
            error.statusCode = 401
            throw error
        }
        loadedUser = user
        return bcrypt.compare(password, user.password)
    })
    .then(async isEqual => {
        if(!isEqual) {
            const error = new Error("Wrong password")
            error.statusCode = 401
            throw error 
        }
        const token = jwt.sign(
            {
                email: loadedUser.email,
                userId: loadedUser._id.toString(),
            },
            process.env.TOKEN_SECRET,
            { expiresIn: '168h'}
        )

        const loginResponse = {
            token:token,
            user: { email: loadedUser.email, name: loadedUser.name, surname: loadedUser.surname }
        }

        // load Organization details if the user is organization
        const organization = await Organization.findOne({ creator: loadedUser._id })

        if(loadedUser.role == 'organization') {
            loginResponse.organization = { 
                id: organization._id,
                name: organization.name,
                address: organization.address,
                logo: organization.logo
            }
        }

        res.status(200).json(loginResponse)
    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 422;
            err.message = "Error loading user data"
        }
        next(err);
    })
}

exports.sendEmail = async (req, res, next) => {

    try {
        const user = await User.findOne({ email: req.body.email })
        if(!user) throw new Error("Error loading user data")
        if(!user.token) throw new Error("Please contact the site administrator")

        sendEmail(user.email, 'Cloud Therapist Email Reconfirmation!', "email", {
            id: user._id,
            name: user.name,
            url: `${req.protocol}://${req.hostname}/v1/user/${user._id}/${user.token}`
        })

        res.status(200).json({
            message: `email to ${user.email} sent`
        })
        
    } catch(error) {
        error.statusCode = 404
        error.message = "error finding user"
        next(error)
    }

}

exports.passwordResetRequest = async (req, res, next) => {

    try {
        const user = await User.findOne({ email: req.body.email })
        if(!user) throw new Error("Your email address does not exist in our system")

        const token = shortid.generate().trim()
        user.token = token
        await user.save()

        sendEmail(user.email, 'Password reset', "password-reset", {
            name: user.name,
            url: `${process.env.ORG_PORTAL}/onboarding/reset-account/${user.email}/${token}`
        })

        res.status(200).json({
            message: `email to ${user.email} sent`
        })
        
    } catch(error) {
        error.statusCode = 404
        error.message = "error finding user"
        next(error)
    }

}

exports.passwordResetUpdate = async (req, res, next) => {

    const { errors } = validationResult(req)

    if(errors.length > 0) return res.status(422).json({ error: errors })
    
    let { email, password, secretToken } = req.body

    try {
        const hashedPassword = bcrypt.hash(password, 12)
        const user = await User.findOne({ email: email })

        if(!user) throw new Error("User email not found")
        if(secretToken !== user.token) throw new Error("Token mismatch")

        user.password = (await hashedPassword).toString()
        user.token = ''
        await user.save()

        res.status(201).json({ message: "Password updated"})

    } catch(error) {
        next(error)
    }
}
