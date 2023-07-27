const express = require('express');

const User = require('../models/user');
const authController = require('../controllers/auth');
const authValidation = require('./../validation/auth')
const orgValidation = require('./../validation/organization')

const router = express.Router();

router.get('/user/:userId/:token', authController.validateToken)

router.get('/org/patient/:userId/:token', authController.businessValidateUserToken)

router.post('/org/register', authValidation.user, orgValidation.organizationExists, orgValidation.general, authController.orgRegister)
router.post('/org/login', authController.login)

router.post('/register/resend-email', authController.sendEmail)

router.post('/patient/register', authValidation.user, authController.patientRegister)

router.post('/password-reset-request', authController.passwordResetRequest)
router.put('/password-reset-update', authValidation.passwordReset, authController.passwordResetUpdate)


module.exports = router
