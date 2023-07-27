const bcrypt = require('bcryptjs')

const User = require('./../models/user')

/**
 * 
 * Encrypt password
 * Check if a picture was uploaded
 * Dependency: Third-Party service. AWS to send images
 * 
 */
module.exports.store = async (req, res) => {

    let { fullName, email, password, profilePic } = req.body
    let encPassword;
    let picture;

    if(password) {
        password = await bcrypt.hash(password, 12);
    }

    if(profilePic){
        // send to AWS
    }

    const user = new User({
        fullName, email, password, profilePic
    })
    
    const createdUser = await user.save()

    if(!createdUser) {
        return res.status(400).json({
            statusCode: 400,
            statusMessage: 'something went wrong',
        })
    }

    const accountSid = process.env.TWILIO_AUTH_ID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const client = require('twilio')(accountSid, authToken);

    res.status(201).json({
        statusCode: 201,
        statusMessage: 'user created',
        data: createdUser
    })
}

// list all users
module.exports.fetchAll = async (req, res, next) => {

    console.log(req.protocol)

    const users = await User.find()

    try {
        if(!users) throw new Error("No user data")
        res.status(200).json({
            data: users
        })
    } catch (error) {

    }

    // User.findById(req.params.userId)
    // .then(user => { res.status(200).json({ user: user })})
    // .catch(err => {
    //     res.status(400).json({ message: 'found'})
    // })
}
