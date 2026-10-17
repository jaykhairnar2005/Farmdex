import multer from 'multer';

// In-memory storage avoids unvalidated temporary disk files
const storage = multer.memoryStorage();

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Invalid file format. Only JPEG, PNG, and WebP raster images are accepted.');
    error.statusCode = 400;
    cb(error, false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max file size
    files: 1, // Single image per upload request
  },
  fileFilter,
});

/**
 * Middleware wrapper to cleanly handle Multer upload errors
 */
export function singleImageUpload(fieldName = 'image') {
  const multerSingle = upload.single(fieldName);

  return (req, res, next) => {
    multerSingle(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'Image size exceeds the 5 MB limit.',
          });
        }
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`,
        });
      } else if (err) {
        return res.status(err.statusCode || 400).json({
          success: false,
          message: err.message || 'Error processing uploaded image.',
        });
      }
      next();
    });
  };
}
