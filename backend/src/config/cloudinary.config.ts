import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export const uploadFromUrl = async (url: string, folder: string): Promise<string | null> => {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new Promise((resolve) => {
      cloudinary.uploader.upload_stream({ folder }, (error, result) => {
        if (error) {
          console.error('Cloudinary stream upload error:', JSON.stringify(error, null, 2));
          resolve(null);
        } else {
          resolve(result?.secure_url || null);
        }
      }).end(buffer);
    });
  } catch (error: any) {
    console.error('Error uploading from URL to Cloudinary:');
    console.error(error.message);
    return null;
  }
};

export default cloudinary;
