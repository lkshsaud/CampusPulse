import imghash from 'imghash';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

// Compute pHash for image similarity
export async function computeImageHash(imageBuffer) {
  try {
    // Resize and convert to grayscale for consistent hashing
    const processedBuffer = await sharp(imageBuffer)
      .resize(32, 32)
      .grayscale()
      .toBuffer();
    
    // Compute pHash (16 hex characters = 64 bits)
    const hash = await imghash.hash(processedBuffer, 16);
    return hash;
  } catch (error) {
    console.error('Error computing image hash:', error);
    return null;
  }
}

// Calculate similarity between two hashes
export function calculateSimilarity(hash1, hash2) {
  if (!hash1 || !hash2) return 0;
  
  // Hamming distance calculation
  let distance = 0;
  const maxLen = Math.max(hash1.length, hash2.length);
  
  // Pad shorter hash with zeros
  const h1 = hash1.padStart(maxLen, '0');
  const h2 = hash2.padStart(maxLen, '0');
  
  // Compare each character (each hex digit = 4 bits)
  for (let i = 0; i < h1.length; i++) {
    const bits1 = parseInt(h1[i], 16);
    const bits2 = parseInt(h2[i], 16);
    let xor = bits1 ^ bits2;
    
    // Count differing bits
    while (xor > 0) {
      distance += xor & 1;
      xor >>= 1;
    }
  }
  
  // Convert distance to similarity (0-1)
  const maxDistance = maxLen * 4; // Each hex digit = 4 bits
  const similarity = Math.max(0, 1 - (distance / maxDistance));
  
  return similarity;
}