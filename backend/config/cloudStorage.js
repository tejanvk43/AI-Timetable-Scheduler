const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');

// Configure AWS
aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const s3 = new aws.S3();

// S3 Upload configuration
const s3Upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME || 'college-notice-board',
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileName = 'notices/' + uniqueSuffix + path.extname(file.originalname);
      cb(null, fileName);
    },
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: 'public-read' // Makes files publicly accessible
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check file type
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, JPG, PNG, GIF, WebP) are allowed'));
    }
  }
});

// Local storage fallback (if AWS is not configured)
const localStorage = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check file type
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, JPG, PNG, GIF, WebP) are allowed'));
    }
  }
});

// Function to delete file from S3
const deleteFromS3 = async (fileUrl) => {
  try {
    if (!fileUrl || !fileUrl.includes('amazonaws.com')) {
      return; // Not an S3 file
    }

    // Extract key from S3 URL
    const url = new URL(fileUrl);
    const key = url.pathname.substring(1); // Remove leading slash

    const params = {
      Bucket: process.env.S3_BUCKET_NAME || 'college-notice-board',
      Key: key
    };

    await s3.deleteObject(params).promise();
    console.log('File deleted from S3:', key);
  } catch (error) {
    console.error('Error deleting file from S3:', error);
  }
};

// Choose storage based on environment
const getUploadMiddleware = () => {
  const useCloudStorage = process.env.USE_CLOUD_STORAGE === 'true' && 
                         process.env.AWS_ACCESS_KEY_ID && 
                         process.env.AWS_SECRET_ACCESS_KEY;
  
  if (useCloudStorage) {
    console.log('Using AWS S3 for file storage');
    return s3Upload.array('images', 5); // Allow up to 5 images
  } else {
    console.log('Using local storage for files');
    return localStorage.array('images', 5); // Allow up to 5 images
  }
};

// Single image upload for backward compatibility
const getSingleUploadMiddleware = () => {
  const useCloudStorage = process.env.USE_CLOUD_STORAGE === 'true' && 
                         process.env.AWS_ACCESS_KEY_ID && 
                         process.env.AWS_SECRET_ACCESS_KEY;
  
  if (useCloudStorage) {
    return s3Upload.single('image');
  } else {
    return localStorage.single('image');
  }
};

module.exports = {
  uploadMiddleware: getUploadMiddleware(),
  singleUploadMiddleware: getSingleUploadMiddleware(),
  deleteFromS3,
  s3Upload,
  localStorage
};
