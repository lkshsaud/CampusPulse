import TryCatch from '../utils/Trycatch.js';
import { Report } from '../models/Report.js';
import { calculateSimilarity } from '../utils/imageProcessor.js';

// Text similarity function
function textSimilarity(a = "", b = "") {
  if (!a || !b) return 0;
  
  const wordsA = a.toLowerCase().split(/\s+/).filter(Boolean);
  const wordsB = b.toLowerCase().split(/\s+/).filter(Boolean);
  
  if (wordsA.length === 0 || wordsB.length === 0) return 0;
  
  const setA = new Set(wordsA);
  const setB = new Set(wordsB);
  const intersection = [...setA].filter(x => setB.has(x)).length;
  const union = setA.size + setB.size - intersection;
  
  return union === 0 ? 0 : intersection / union;
}

// Get matches for opposite category
export const getMatches = TryCatch(async (req, res) => {
  const { lat, lng, category, radius = 500, itemName = "", description = "" } = req.query;
  
  if (!lat || !lng || !category) {
    return res.status(400).json({ error: "lat, lng, category required" });
  }
  
  const opposite = category === "lost" ? "found" : "lost";
  
  const matches = await Report.aggregate([
    {
      $geoNear: {
        near: { 
          type: "Point", 
          coordinates: [parseFloat(lng), parseFloat(lat)] 
        },
        distanceField: "distance",
        maxDistance: parseInt(radius),
        spherical: true,
        query: { 
          category: opposite,
          status: "open"
        }
      }
    },
    { $limit: 20 }
  ]);
  
  // Calculate scores for each match
  const results = matches.map(match => {
    const distance = match.distance || 0;
    const roundedDistance = Math.round(distance);
    
    // Calculate text similarity
    const queryText = (itemName + " " + description).toLowerCase();
    const matchText = (match.itemName + " " + match.description).toLowerCase();
    const textScore = textSimilarity(queryText, matchText);
    
    // Calculate distance score (closer = higher)
    const maxDistance = parseInt(radius);
    const distanceScore = Math.max(0, 1 - (roundedDistance / maxDistance));
    
    // Combined score
    const combinedScore = Math.min(1, (distanceScore * 0.4) + (textScore * 0.6));
    
    return {
      ...match,
      distance: roundedDistance,
      textScore,
      distanceScore,
      combinedScore: Math.round(combinedScore * 100) / 100
    };
  });
  
  // Sort by combined score
  results.sort((a, b) => b.combinedScore - a.combinedScore);
  
  console.log(`🎯 Found ${results.length} matches for ${category}`);
  res.json({ matches: results });
});

// Get image similarity recommendations
export const getImageRecommendations = TryCatch(async (req, res) => {
  const { reportId } = req.params;
  
  console.log('🔍 Getting image recommendations for:', reportId);
  
  const currentReport = await Report.findById(reportId);
  if (!currentReport) {
    return res.status(404).json({ error: "Report not found" });
  }
  
  const oppositeCategory = currentReport.category === "lost" ? "found" : "lost";
  
  // Get all reports of opposite category with images
  const candidates = await Report.find({
    _id: { $ne: reportId },
    category: oppositeCategory,
    status: "open",
    pHash: { $exists: true, $ne: "" }
  }).lean();
  
  console.log(`📸 Found ${candidates.length} candidates with images`);
  
  const recommendations = candidates.map(candidate => {
    // Calculate image similarity
    const imageSimilarity = calculateSimilarity(currentReport.pHash, candidate.pHash);
    
    // Calculate text similarity
    const textScore = textSimilarity(
      currentReport.description || "",
      candidate.description || ""
    );
    
    // Combined score (weighted towards image similarity)
    const combinedScore = (imageSimilarity * 0.7) + (textScore * 0.3);
    
    return {
      ...candidate,
      similarity: Math.round(combinedScore * 100) / 100,
      imageSimilarity: Math.round(imageSimilarity * 100) / 100,
      textSimilarity: Math.round(textScore * 100) / 100
    };
  });
  
  // Filter and sort recommendations
  const filteredRecommendations = recommendations
    .filter(rec => rec.similarity > 0.1)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 10);
  
  console.log(`💡 Returning ${filteredRecommendations.length} recommendations`);
  res.json({ recommendations: filteredRecommendations });
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
  
  // Update stats cache
  const updateStats = require('./reportController.js').updateStatsCache;
  await updateStats();
  
  console.log('✅ Report claimed:', repId);
  res.json({ message: "Report claimed successfully" });
});