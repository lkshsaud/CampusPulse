// backend/controllers/reportControllers.js
import TryCatch from '../utils/Trycatch.js';
import { Report } from '../models/Report.js';
import { User } from '../models/userModel.js';
import imghash from 'imghash';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Helper functions
function textSimilarity(a = "", b = "") {
  const sa = a.toLowerCase().split(/\s+/).filter(Boolean);
  const sb = b.toLowerCase().split(/\s+/).filter(Boolean);
  if (!sa.length || !sb.length) return 0;
  const setA = new Set(sa);
  const setB = new Set(sb);
  const inter = [...setA].filter(x => setB.has(x)).length;
  const union = new Set([...sa, ...sb]).size;
  return union === 0 ? 0 : inter / union;
}

function hammingDistanceHex(hex1 = "", hex2 = "") {
  if (!hex1 || !hex2) return 64; // Max distance if one is missing
  
  const maxLen = Math.max(hex1.length, hex2.length);
  const h1 = hex1.padStart(maxLen, "0");
  const h2 = hex2.padStart(maxLen, "0");
  
  let distance = 0;
  for (let i = 0; i < h1.length; i++) {
    const n1 = parseInt(h1[i], 16);
    const n2 = parseInt(h2[i], 16);
    const xor = n1 ^ n2;
    // Count bits in xor
    distance += ((xor >> 3) & 1) + ((xor >> 2) & 1) + 
                ((xor >> 1) & 1) + (xor & 1);
  }
  
  return distance;
}

// Create report
export const createReport = TryCatch(async (req, res) => {
  console.log("Creating report...");
  const { itemName, category, description, lat, lng, contact } = req.body;
  const file = req.file;
  const imageUrl = file ? `/uploads/${file.filename}` : '';

  // Validate contact
  if (contact && !/^\d{10}$/.test(contact)) {
    return res.status(400).json({ error: "Contact must be 10 digits" });
  }

  let pHash = "";
  if (file) {
    try {
      console.log("Computing pHash for image...");
      const filepath = path.resolve(file.path);
      
      // Use sharp to process image first
      await sharp(filepath)
        .resize(32, 32, { fit: 'fill' })
        .grayscale()
        .toBuffer();
      
      // Compute pHash
      pHash = await imghash.hash(filepath, 16);
      console.log("Generated pHash:", pHash.substring(0, 16) + "...");
    } catch (err) {
      console.error("pHash computation error:", err);
      pHash = "";
    }
  }

  const location = {
    type: "Point",
    coordinates: [parseFloat(lng), parseFloat(lat)]
  };

  console.log("Saving report to database...");
  const rpt = await Report.create({
    owner: req.user._id,
    itemName,
    category,
    description,
    imageUrl,
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    contact: contact || "",
    location,
    pHash,
    status: "open"
  });

  console.log("Report saved successfully:", rpt._id);
  
  // Award tokens for found items
  if (category === "found") {
    await User.findByIdAndUpdate(req.user._id, { $inc: { tokens: 10 } });
  }

  res.status(201).json({ report: rpt });
});

// Get all reports with filters
export const getReports = TryCatch(async (req, res) => {
  const { category, search, status } = req.query;
  let query = {};
  
  if (category && category !== 'all') query.category = category;
  if (status && status !== 'all') query.status = status;
  if (search) {
    query.$or = [
      { itemName: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }
  
  const reports = await Report.find(query)
    .sort({ createdAt: -1 })
    .lean();
  
  // Update stats after fetching reports
  updateStatsCache();
  
  res.json(reports);
});

// Get nearby reports
export const getNearbyReports = TryCatch(async (req, res) => {
  const { lat, lng, radius = 500 } = req.query;
  
  if (!lat || !lng) {
    return res.status(400).json({ error: "lat and lng required" });
  }
  
  const reports = await Report.find({
    status: "open",
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [parseFloat(lng), parseFloat(lat)]
        },
        $maxDistance: parseInt(radius)
      }
    }
  }).limit(20).lean();
  
  // Calculate exact distance and score
  const results = reports.map(report => {
    const distance = calculateDistance(
      parseFloat(lat),
      parseFloat(lng),
      report.lat,
      report.lng
    );
    const roundedDistance = Math.round(distance);
    
    // Calculate a simple score based on distance and text similarity
    const distanceScore = Math.max(0, 1 - (roundedDistance / parseInt(radius)));
    let textScore = 0.3; // Base score
    
    // Add text similarity if query has text
    if (req.query.search) {
      const searchText = req.query.search.toLowerCase();
      const reportText = (report.itemName + " " + report.description).toLowerCase();
      if (reportText.includes(searchText)) {
        textScore = 0.7;
      }
    }
    
    const combinedScore = (distanceScore * 0.6 + textScore * 0.4);
    
    return { 
      ...report, 
      distance: roundedDistance,
      score: Math.min(1, combinedScore)
    };
  });
  
  // Sort by score
  results.sort((a, b) => b.score - a.score);
  
  console.log(`Found ${results.length} nearby reports`);
  res.json({ reports: results });
});

// Get matches for opposite category
export const getMatches = TryCatch(async (req, res) => {
  const { lat, lng, category, radius = 500, itemName = "", description = "" } = req.query;
  
  if (!lat || !lng || !category) {
    return res.status(400).json({ error: "lat, lng, category required" });
  }
  
  const opposite = category === "lost" ? "found" : "lost";
  
  const matches = await Report.find({
    category: opposite,
    status: "open",
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [parseFloat(lng), parseFloat(lat)]
        },
        $maxDistance: parseInt(radius)
      }
    }
  }).limit(20).lean();
  
  // Calculate scores
  const results = matches.map(match => {
    const distance = calculateDistance(
      parseFloat(lat),
      parseFloat(lng),
      match.lat,
      match.lng
    );
    const roundedDistance = Math.round(distance);
    
    // Distance score (closer is better)
    const distanceScore = Math.max(0, 1 - (roundedDistance / parseInt(radius)));
    
    // Text similarity score
    const queryText = (itemName + " " + description).toLowerCase();
    const matchText = (match.itemName + " " + match.description).toLowerCase();
    const textScore = textSimilarity(queryText, matchText);
    
    // Combined score
    const combinedScore = (distanceScore * 0.4 + textScore * 0.6);
    
    return {
      ...match,
      distance: roundedDistance,
      distanceScore,
      textScore,
      combinedScore: Math.min(1, combinedScore)
    };
  });
  
  // Sort by combined score
  results.sort((a, b) => b.combinedScore - a.combinedScore);
  
  console.log(`Found ${results.length} matches for ${category}`);
  res.json({ matches: results });
});

// Get image similarity recommendations
export const getImageRecommendations = TryCatch(async (req, res) => {
  const { reportId } = req.params;
  console.log("Getting image recommendations for report:", reportId);
  
  const currentReport = await Report.findById(reportId);
  if (!currentReport) {
    return res.status(404).json({ error: "Report not found" });
  }
  
  console.log("Current report:", {
    id: currentReport._id,
    itemName: currentReport.itemName,
    hasImage: !!currentReport.imageUrl,
    pHash: currentReport.pHash ? currentReport.pHash.substring(0, 16) + "..." : "No pHash"
  });
  
  const oppositeCategory = currentReport.category === "lost" ? "found" : "lost";
  
  // Get all reports of opposite category
  const candidates = await Report.find({
    _id: { $ne: reportId },
    category: oppositeCategory,
    status: "open",
    imageUrl: { $exists: true, $ne: "" } // Has an image
  }).lean();
  
  console.log(`Found ${candidates.length} candidates with images`);
  
  const recommendations = [];
  
  for (const candidate of candidates) {
    let similarity = 0;
    
    // Calculate image similarity if both have pHash
    if (currentReport.pHash && candidate.pHash) {
      const hamDist = hammingDistanceHex(currentReport.pHash, candidate.pHash);
      
      // Normalize to 0-1 (lower distance = higher similarity)
      // Max distance for 64-bit hash is 256 bits
      similarity = Math.max(0, 1 - (hamDist / 256));
      
      console.log(`Image similarity with ${candidate.itemName}: ${similarity.toFixed(2)} (distance: ${hamDist})`);
    }
    
    // Add text similarity as fallback
    const textSim = textSimilarity(
      currentReport.description || "",
      candidate.description || ""
    );
    
    // Combined similarity (prioritize image if available)
    const combinedSimilarity = currentReport.pHash && candidate.pHash
      ? (similarity * 0.7 + textSim * 0.3)
      : textSim * 0.5; // Lower confidence if no image
    
    if (combinedSimilarity > 0.1) { // Lower threshold
      recommendations.push({
        ...candidate,
        similarity: combinedSimilarity,
        textSimilarity: textSim,
        hasImage: !!candidate.imageUrl
      });
    }
  }
  
  // Sort by similarity
  recommendations.sort((a, b) => b.similarity - a.similarity);
  
  console.log(`Returning ${recommendations.length} recommendations`);
  res.json({ recommendations });
});

// Claim report
export const claimReport = TryCatch(async (req, res) => {
  const repId = req.params.id;
  const rep = await Report.findById(repId);
  if (!rep) return res.status(404).json({ error: "Not found" });
  
  if (rep.status !== "open") {
    return res.status(400).json({ error: "Report not open" });
  }
  
  // LOST: only owner can claim
  if (rep.category === "lost" && rep.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: "Not allowed to claim this lost report" });
  }
  
  rep.status = "claimed";
  rep.claimedBy = req.user._id;
  rep.claimedAt = new Date();
  await rep.save();
  
  // Update stats after claiming
  updateStatsCache();
  
  console.log("Report claimed:", repId);
  res.json({ message: "Report claimed successfully" });
});

// Cache for stats to avoid DB queries
let statsCache = {
  total: 0,
  resolved: 0,
  pending: 0,
  lastUpdated: null
};

// Update stats cache
async function updateStatsCache() {
  try {
    const totalReports = await Report.countDocuments();
    const resolvedReports = await Report.countDocuments({ status: "claimed" });
    const pendingReports = await Report.countDocuments({ status: "open" });
    
    statsCache = {
      total: totalReports,
      resolved: resolvedReports,
      pending: pendingReports,
      lastUpdated: new Date()
    };
    
    console.log("Stats cache updated:", statsCache);
  } catch (err) {
    console.error("Error updating stats cache:", err);
  }
}

// Get dashboard stats (from cache)
export const getDashboardStats = TryCatch(async (req, res) => {
  // Update cache if it's stale (older than 5 seconds)
  if (!statsCache.lastUpdated || (new Date() - statsCache.lastUpdated) > 5000) {
    await updateStatsCache();
  }
  
  console.log("Returning stats from cache:", statsCache);
  res.json(statsCache);
});

// Initialize stats cache
updateStatsCache();

// Helper function to calculate distance in meters
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c;
}