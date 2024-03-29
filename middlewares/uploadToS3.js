const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');

// Configure AWS SDK
let s3 = new AWS.S3({
    accessKeyId: process.env.IAM_USER_KEY,
    secretAccessKey: process.env.IAM_USER_SECRET,
})
  
  // Configure multer middleware for file upload to S3
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.BUCKET_NAME,
        acl: 'public-read',
        key: function (req, file, cb) {
            cb(null, Date.now().toString() + '-' + file.originalname);
        }
    })
});

exports.uploadFile = upload.single('file');