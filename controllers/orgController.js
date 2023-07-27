const { validationResult } = require('express-validator')

const Organization = require('./../models/organization')
const Department = require('./../models/department')
const User = require('./../models/user')
const sendEmail = require('./../helpers/email-send')

module.exports.update = async (req, res, next) => {

    try {
        
        const { errors } = validationResult(req)
        if(errors.length > 0) return res.status(422).json({ message: errors })

        const updateFilter = { _id: req.params.organization };
        
        const updateObject = {
            address: {
                line1: req.body.address.line1,
                line2: req.body.address.line2,
                city: req.body.address.city,
                country: req.body.address.country,
                postalCode: req.body.address.postalCode,
                province: req.body.address.province
            },
            taxNum: req.body.taxNum,
            phone: req.body.phone,
            website: req.body.website,
            size: req.body.size,
            industry: req.body.industry,
            logo: req.body.logo,
        }
    
        const savedOrg = await Organization.findOneAndUpdate(updateFilter, updateObject)
        res.status(201).json({ response: savedOrg })

    } catch(error) {
        next(error)
    }

}

// fetch the records of one organization
module.exports.fetchOrg = async (req, res, next) => {

    try {
    
        const organization = await Organization
        .findById(req.params.organization).select('logo')
        .populate('user', 'name surname email cellphone gender dateOfBirth position')
        .populate('department', 'name')
        res.status(200).json({ organization })

    } catch(error) {

        next(error)
    }
}

module.exports.employeeCreate = async (req, res, next) => {

    let { name, surname, email, cellphone, gender, dateOfBirth, department, position, employeeId } = req.body
    let user, organization

    const { errors } = validationResult(req)
    if(errors.length > 0) return res.status(409).json({ message: errors[0].msg })

    dateOfBirth = new Date(dateOfBirth)
    dateOfBirth = dateOfBirth.toDateString()

    try {

        // Create a new employee/user
        user = await (new User({ name, surname, cellphone, gender, dateOfBirth, department, position, employeeId, email, role: "patient", organization: req.params.organization })).save()
        if(!user) throw new Error("Employee records could not be saved.")

        // add user to the organization
        organization = await Organization.findById(req.params.organization)
        if(!organization) throw new Error(`User with email ${user.email} could not be added to the organization`)
        organization.user.push(user)
        await organization.save()

        const emailSubject = "Cloud Therapist - Account notification"

        sendEmail(user.email, emailSubject, "account-notification", {
            id: user._id,
            name: user.name,
            subject: emailSubject,
            url: `${req.protocol}://${req.hostname}/v1/user/${user._id}/${user.token}`   
        })

        res.status(201).json({ employee: "Employee records created" })

    } catch(error) {

        // delete any created records
        if(user) await User.findByIdAndDelete(user._id)
        
        next(error)
    }
}

// list all the employees belonging to this organization
module.exports.employeeFetchAll = async (req, res, next) => {

    try {
        const organization = await User.find({ organization: req.params.organization })
        .select('name surname email dateOfBirth cellphone employeeId gender position')
        .populate('department', 'name')

        res.status(200).json({ employees: organization })

    } catch(error) {
        next(error)
    }
}

// fetch single  employee record
module.exports.fetchEmployee = async (req, res, next) => {

    try {
        const employee = await User.findOne({ _id: req.params.employee, organization: req.params.organization })
        .select('name surname email dateOfBirth cellphone employeeId gender position')
        .populate('department', 'name')

        res.status(200).json({ employee })

    } catch(error) {
        next(error)
    }
}

module.exports.employeeUpdate = async (req, res, next) => {

    let { name, surname, email, cellphone, gender, dateOfBirth, department, position, employeeId } = req.body

    const { errors } = validationResult(req)

    if(errors.length > 0) return res.status(422).json({ message: errors })

    dateOfBirth = new Date(dateOfBirth)
    dateOfBirth = dateOfBirth.toDateString()

    try {

        const user = await User.findByIdAndUpdate(req.params.employee, {
            name, surname, employeeId, email, cellphone, gender, dateOfBirth, department, position
        })
        if(!user) throw new Error(`Error updating user details.`)

        res.status(201).json({ message: `Employee with email ${user.email} successfully updated.` })
        
    } catch(error) {
        next(error)
    }
}

module.exports.employeeDelete = async (req, res, next) => {

    const userId = req.params.employee
    const orgId = req.params.organization
    try {

        // delete the user from users table
        const user = await User.findByIdAndDelete(userId)

        const organization = (await Organization.findById(orgId).select('user'))
        const existingUsers = organization.user
        const newUsers = []

        // filter our the deleted user
        existingUsers.forEach(user => {
            if(user.toString() !== userId){
                newUsers.push(user.toString())
            }
        })

        organization.user = newUsers
        const newOrgMembers = await organization.save()

        res.status(200).json({ organization: newOrgMembers })

    } catch(error) {
        next(error)
    }
}

// bulk upload employee
module.exports.employeeUpload = async (req, res, next) => {

    let users = req.body

    try {

        let existingEmails = await User.find({}, 'email')

        let newUsers = [] // Array to store new users without duplicate emails
        let rejected = [] // Array to store duplicate email addresses

        users.forEach(async user => {
            const userEmail = user.email;

            if (!existingEmails.some(existingUser => existingUser.email === userEmail)) {
                let dateOfBirth = new Date(user.dateOfBirth)
                dateOfBirth = dateOfBirth.toDateString()
                user.dateOfBirth = dateOfBirth
                user.role = "patient"
                user.organization = req.params.organization
                newUsers.push(user) // Add user to newUsers array if email is not a duplicate

            } else {
                rejected.push({
                    email: userEmail,
                    reason: `The email ${userEmail} is already taken.`
                })
            }
        });

        const insertedUsers = await User.insertMany(newUsers) // Insert only the new users into the database


        const message = `${insertedUsers.length} added out of ${users.length}`
        const emailSubject = "Cloud Therapist - Account notification"
        
        insertedUsers.forEach(async insertedUser => {

            let organization = await Organization.findById(req.params.organization)
            if(!organization) throw new Error(`User with email ${insertedUser.email} could not be added to the organization`)
            organization.user.push(insertedUser)
            await organization.save()

            sendEmail(insertedUser.email, emailSubject, "account-notification", {
                id: insertedUser._id,
                name: insertedUser.name,
                subject: emailSubject,
                url: `${req.protocol}://${req.hostname}/v1/org/patient/${insertedUser._id}/${insertedUser.token}`   
            })
        })

    res.status(201).json({ message, rejected })

    } catch(error) {
        next(error)
    }
}

/**
 * Create a department for the current organization
 * // TODO: When creating a department also add its id to the organization department model
 */
module.exports.departmentCreate = async (req, res, next) => {

    // get department create validation to avoid department duplication
    const { errors } = validationResult(req)
    if(errors.length > 0) return res.status(409).json({ message: errors[0].msg })

    try {

        const departmentData = {
            name: req.body.name,
            organization: req.params.organization
        }
        const department = await (new Department(departmentData)).save()
        const organization = await Organization.findById(req.params.organization)
        organization.department.push(department)
        await organization.save()

        if(!department) throw Error("Department not created")

        res.status(201).json({ department: `${department.name}  successfully created.`})

    } catch(error) {
        next(error)
    }
}

// List all departments of a given organization
module.exports.departmentList = async (req, res, next) => {

    const departments = await Department.find({ organization: req.params.organization }).select('name')

    res.status(200).json({ departments })
}

module.exports.departmentUpdate = async (req, res, next) => {

    const { errors } = validationResult(req)
    if(errors.length > 0) return res.status(409).json({ message: errors[0].msg })
    const orgID = req.params.organization
    const dptID = req.params.department
    
    const reqDptName = req.body.name

    try {

        // find the current department
        let currentDepartment = await Department.findById(dptID)

        // check if the department has not changed
        if(currentDepartment.name === reqDptName) {
            return res.status(200).json({ message: `${reqDptName} successfully updated.` })  
        }

        // check for any department that already has this name
        const departments = await Department.findOne({ organization: orgID, name: reqDptName })
        if(departments) {
            const error = new Error(`${reqDptName} is already being used.`)
            error.statusCode = 409
            throw error
        } else {
            currentDepartment.name = reqDptName
            await currentDepartment.save()
        }
        
        res.status(201).json({ message: `${reqDptName} successfully updated.` }) 

    } catch(error) {
        next(error)
    }
}

// delete organization department
// TODO: when deleting a department, also delete the entries in the organization
module.exports.departmentDelete = async (req, res, next) => {

    try {
        const department = await Department.findByIdAndDelete(req.params.department)
        res.status(201).json({ message: "Deleted" })
    } catch(error) {
        next(error)
    }
}

module.exports.departmentFetchOne = async (req, res, next) => {

    try {
    
        const department = await Department.findOne({ organization: req.params.department})
        res.status(200).json({ department })

    } catch(error) {

        next(error)
    }
}