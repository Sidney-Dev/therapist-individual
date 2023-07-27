const express = require('express')

const adminController = require('./../controllers/adminUserController')

const router = express.Router()

router.post('/users', adminController.store)
router.get('/users', adminController.fetchAll)
// router.get('/user/:userId', adminController.fetch)



module.exports = router
