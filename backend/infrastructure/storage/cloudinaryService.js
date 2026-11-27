const cloudinary = require('cloudinary').v2;
const fs = require('fs/promises');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dujdjt4l7',
  api_key: process.env.CLOUDINARY_API_KEY || '687418671289766',
  api_secret: process.env.CLOUDINARY_API_SECRET || 's4a1Mr3L3AdOCjM2Cn7NalLUXx4'
});

async function uploadToCloudinary(filePath, folder = 'kaizensprint_avatars') {
  try {
    if (!filePath) return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';

    // Upload to Cloudinary with active user account credentials
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'image',
      transformation: [
        { width: 300, height: 300, crop: 'fill', gravity: 'face' }
      ]
    });

    // Remove local temp file after upload
    await fs.unlink(filePath).catch(() => {});

    return result.secure_url;
  } catch (err) {
    console.error('[Cloudinary Upload Error]', err.message);
    throw new Error(`Cloudinary upload failed: ${err.message}`);
  }
}

module.exports = { uploadToCloudinary, cloudinary };
