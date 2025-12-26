import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { createHash } from 'crypto';

// Image similarity detection using perceptual hashing
export async function findSimilarImages(userImagePath, folderPath, threshold = 0.1) {
  try {
    // Generate hash for the user's image
    const userImageHash = await generateImageHash(userImagePath);
    
    // Read all files in the upload directory
    const files = await fs.readdir(folderPath);
    const similarImages = [];

    // Compare with each image in the folder
    for (const file of files) {
      const filePath = path.join(folderPath, file);
      
      // Skip if it's the same file or not an image
      if (filePath === userImagePath) continue;
      
      try {
        // Check if it's an image file
        const ext = path.extname(file).toLowerCase();
        if (!['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(ext)) {
          continue;
        }

        // Generate hash for the comparison image
        const imageHash = await generateImageHash(filePath);
        
        // Calculate similarity using Hamming distance
        const similarity = calculateHashSimilarity(userImageHash, imageHash);
        
        // Check if similarity meets threshold (inverted for Hamming distance)
        const normalizedSimilarity = 1 - (similarity / 64); // 64-bit hash
        
        if (normalizedSimilarity >= (1 - threshold)) {
          similarImages.push({ 
            file, 
            similarity: normalizedSimilarity,
            path: filePath
          });
        }
      } catch (err) {
        console.error(`Error processing ${file}: ${err.message}`);
        continue;
      }
    }

    // Sort by similarity (descending)
    return similarImages.sort((a, b) => b.similarity - a.similarity);
  } catch (err) {
    console.error(`Error in findSimilarImages: ${err.message}`);
    return [];
  }
}

// Generate perceptual hash for an image
async function generateImageHash(imagePath) {
  try {
    // Resize to 8x8 pixels (small size for perceptual hashing)
    const imageBuffer = await sharp(imagePath)
      .resize(8, 8, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer();
    
    const pixels = new Uint8Array(imageBuffer);
    
    // Calculate average pixel value
    let total = 0;
    for (const pixel of pixels) {
      total += pixel;
    }
    const average = total / pixels.length;
    
    // Create hash: 1 if pixel > average, 0 otherwise
    let hash = '';
    for (const pixel of pixels) {
      hash += pixel > average ? '1' : '0';
    }
    
    return hash;
  } catch (err) {
    console.error(`Error generating hash for ${imagePath}: ${err.message}`);
    throw err;
  }
}

// Calculate Hamming distance between two hashes
function calculateHashSimilarity(hash1, hash2) {
  let distance = 0;
  
  if (hash1.length !== hash2.length) {
    throw new Error('Hashes must be the same length');
  }
  
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) {
      distance++;
    }
  }
  
  return distance;
}

// Alternative: Calculate structural similarity using pixel data
export async function calculateImageSimilarity(imagePath1, imagePath2) {
  try {
    // Resize both images to same dimensions
    const size = 32;
    
    const image1 = await sharp(imagePath1)
      .resize(size, size, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer();
    
    const image2 = await sharp(imagePath2)
      .resize(size, size, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer();
    
    const pixels1 = new Uint8Array(image1);
    const pixels2 = new Uint8Array(image2);
    
    if (pixels1.length !== pixels2.length) {
      return 0;
    }
    
    // Calculate Mean Squared Error (MSE)
    let mse = 0;
    for (let i = 0; i < pixels1.length; i++) {
      const diff = pixels1[i] - pixels2[i];
      mse += diff * diff;
    }
    mse /= pixels1.length;
    
    // Convert MSE to similarity score (0-1)
    // Max possible MSE is 255*255 = 65025
    const maxMSE = 65025;
    const similarity = Math.max(0, 1 - (mse / maxMSE));
    
    return similarity;
  } catch (err) {
    console.error(`Error calculating similarity: ${err.message}`);
    return 0;
  }
}