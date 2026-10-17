import { v2 as cloudinary } from 'cloudinary';

/**
 * Check if all required Cloudinary credentials are present in server environment
 */
export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

// Initialize Cloudinary if credentials are provided
if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/**
 * Upload an image buffer directly to Cloudinary
 * @param {Buffer} buffer - File buffer from Multer
 * @param {string} folder - Destination Cloudinary directory
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
export async function uploadToCloudinary(buffer, folder = 'farmdex/crop-listings') {
  if (!isCloudinaryConfigured()) {
    const error = new Error('Cloudinary image storage is not configured on the server. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
    error.statusCode = 503;
    throw error;
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) {
          const uploadErr = new Error(`Image upload failed: ${error.message}`);
          uploadErr.statusCode = 502;
          return reject(uploadErr);
        }
        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Safe Cloudinary asset deletion
 * @param {string} publicId - Cloudinary public identifier
 */
export async function deleteFromCloudinary(publicId) {
  if (!isCloudinaryConfigured() || !publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error(`[Cloudinary] Warning: Failed to destroy remote asset ${publicId}:`, err.message);
  }
}

export default cloudinary;
