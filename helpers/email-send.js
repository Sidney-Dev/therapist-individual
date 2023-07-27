const path = require('path')

const nodemailer = require('nodemailer')
const sendGridTransport = require('nodemailer-sendgrid-transport')
const hbs = require('nodemailer-express-handlebars')

const transporter = nodemailer.createTransport(sendGridTransport({
    auth: {
        api_key: process.env.SENDGRID_KEY
    }
}))

// point to the template folder
const handlebarOptions = {
    viewEngine: {
        partialsDir: path.join(__dirname, '..', 'views'),
        defaultLayout: false,
    },
    viewPath: path.join(__dirname, '..', 'views')
}

// use a template file with nodemailer
transporter.use('compile', hbs(handlebarOptions))

module.exports = (to, subject, template, context) => {
    transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        template,
        context
    })
}
