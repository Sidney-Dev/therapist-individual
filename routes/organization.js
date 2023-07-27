const express = require('express')

// controllers
const orgController = require('./../controllers/orgController')
const orgValidator = require('./../validation/organization')

// middleware
const isAuth = require('../middleware/is-auth') // check if the user is authenticated
const isOrgOwner = require('../middleware/is-org-owner') // check if the user is allowed to perform operation

const router = express.Router()

// router.put('/:organization', orgController.update)



// Department routes
router.post('/:organization/department', isAuth, orgValidator.departmentExists, orgController.departmentCreate)
router.get('/:organization/departments', orgController.departmentList)
router.put('/:organization/department/:department', isAuth, orgController.departmentUpdate)
router.delete('/:organization/department/:department', isAuth, orgController.departmentDelete)

// Employee routes
router.post('/:organization/employee/create', isAuth, orgValidator.emailExists, orgController.employeeCreate)
router.post('/:organization/employee/upload', isAuth, orgController.employeeUpload)
router.put('/:organization/employee/:employee', isAuth, orgController.employeeUpdate)
router.get('/:organization/employee/:employee', isAuth, orgController.fetchEmployee)
router.delete('/:organization/employee/:employee', isAuth, orgController.employeeDelete)
router.get('/:organization/employees', orgController.employeeFetchAll)


router.get('/:organization', orgController.fetchOrg)
router.put('/:organization/update', isAuth, orgValidator.update, orgController.update)

module.exports = router
