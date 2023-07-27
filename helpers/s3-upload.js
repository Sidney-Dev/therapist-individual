const AWS = require('aws-sdk')

module.exports = async (fileName, fileContent) => {

    AWS.config.update({
        accessKeyId: process.env.AMAZON_ACCESS_KEY,
        secretAccessKey: process.env.AMAZON_ACCESS_SECRET,
    });
    
    const s3 = new AWS.S3();

    // Setting up S3 upload parameters
    const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: fileName,
        Body: fileContent,
        ACL: "public-read"
    };

    // Uploading files to the bucket
    return new Promise((resolve, reject) => {
        s3.upload(params, function(err, data) {
            if (err) {
                reject(err)
            } else {
                resolve(data.Location)
            }
        })
    })
}
