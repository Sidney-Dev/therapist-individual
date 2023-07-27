const path = require('path')
const AWS = require('aws-sdk')
const cors = require('cors')
const dotenv = require('dotenv').config();
const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const fileUpload = require('express-fileupload');
const s3Upload = require('./helpers/s3-upload');

const MONGODB_URI = process.env.MONGODB_URI
const PORT = process.env.PORT || 8080

// routes import
const adminRoutes = require('./routes/admin')
const authRoutes = require('./routes/auth')
const orgRoutes = require('./routes/organization')

// express initiation and handlers
const app = express()

app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
}));

// enabling CORS for some specific origins only.
let corsOptions = {
   origin : ['https://therapist-org-portal.vercel.app'],
}
  
app.use(cors(corsOptions))
  
app.use(bodyParser.json()) // body parser

// default headers setup
app.use((req, res, next) => {
    res.setHeader('Access-Controll-Allow-Origin', 'https://therapist-org-portal.vercel.app')
    res.setHeader('Access-Controll-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE')
    res.setHeader('Access-Controll-Allow-Header', 'Content-Type, Authorization')
    next()
})


// routes
app.use('/v1', authRoutes)
app.use('/v1', adminRoutes)
app.use('/v1/org', orgRoutes)

app.get('/file-upload', (req, res, next) => {

    res.send(`
    <h2>File Upload With <code>"Node.js"</code></h2>
    <img src="https://ctp-portal-dev.s3.eu-north-1.amazonaws.com/mtn_LOGO_yellow.png" /eeq>
    <form action="/api/upload" enctype="multipart/form-data" method="post">
      <div>Select a file: 
        <input name="file" type="file" />
      </div>
      <input type="submit" value="Upload" />
    </form>

  `);
})

//use by upload form
app.post('/api/upload', async (req, res, next) => {

    const fileName = req.files.file.name
    const fileContent = req.files.file.data
    const fileType = req.files.file.mimetype

    const upload = await s3Upload(fileName, fileContent)
    console.log(upload)
    if(!upload) throw new Error("file not uploaded")

    res.redirect('/file-upload')

});

// default error handler middleware
app.use((error, req, res, next) => {
    const status = error.statusCode || 500
    const message = error.message
    res.status(status).json({message})
})

mongoose.connect(MONGODB_URI)
.then(result => {
    app.listen(PORT);
})
.catch(err => console.log(err));
