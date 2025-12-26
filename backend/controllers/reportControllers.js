import TryCatch from '../utils/Trycatch.js';
import { Report } from '../models/Report.js';
import { User } from '../models/userModel.js';
import { computeImageHash } from '../utils/imageProcessor.js';

// Cache for stats
let statsCache = null;
let cacheTime = null;
const CACHE_DURATION = 30000; // 30 seconds

// Clear and update stats cache
export const updateStatsCache = async () => {
  try {
    const total = await Report.countDocuments();
    const resolved = await Report.countDocuments({ status: "claimed" });
    const pending = await Report.countDocuments({ status: "open" });
    
    statsCache = { total, resolved, pending };
    cacheTime = Date.now();
    
    console.log('📊 Stats cache updated:', statsCache);
    return statsCache;
  } catch (error) {
    console.error('Error updating stats cache:', error);
    return null;
  }
};

// Get dashboard stats
export const getDashboardStats = TryCatch(async (req, res) => {
  // Return cached stats if recent
  if (statsCache && cacheTime && (Date.now() - cacheTime) < CACHE_DURATION) {
    return res.json(statsCache);
  }
  
  // Otherwise, fetch fresh stats
  const stats = await updateStatsCache();
  res.json(stats || { total: 0, resolved: 0, pending: 0 });
});

// Create report
export const createReport = TryCatch(async (req, res) => {
  const { itemName, category, description, lat, lng, contact } = req.body;
  
  console.log('📝 Creating report:', { itemName, category });
  
  // Validate contact
  if (contact && !/^\d{10}$/.test(contact)) {
    return res.status(400).json({ error: "Contact must be 10 digits" });
  }
  
  let pHash = "";
  let cloudinaryId = "";
  
  // Compute image hash if image uploaded
  if (req.file) {
    try {
      console.log('🖼️ Processing image...');
      pHash = await computeImageHash(req.file.buffer);
      cloudinaryId = req.file.public_id;
      console.log('✅ Image processed, hash:', pHash?.substring(0, 16) + '...');
    } catch (error) {
      console.error('❌ Image processing error:', error);
    }
  }
  
  const location = {
    type: "Point",
    coordinates: [parseFloat(lng), parseFloat(lat)]
  };
  
  const report = await Report.create({
    owner: req.user._id,
    itemName,
    category,
    description,
    imageUrl: req.file?.path || '',
    cloudinaryId: cloudinaryId,
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    contact: contact || "",
    location,
    pHash,
    status: "open"
  });
  
  // Award tokens for found items
  if (category === "found") {
    await User.findByIdAndUpdate(req.user._id, { $inc: { tokens: 10 } });
  }
  
  // Update stats cache
  await updateStatsCache();
  
  console.log('✅ Report created:', report._id);
  res.status(201).json({ report });
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
  
  console.log(`📋 Fetched ${reports.length} reports`);
  res.json(reports);
});

// Get nearby reports
export const getNearbyReports = TryCatch(async (req, res) => {
  const { lat, lng, radius = 500 } = req.query;
  
  if (!lat || !lng) {
    return res.status(400).json({ error: "lat and lng required" });
  }
  
  const reports = await Report.aggregate([
    {
      $geoNear: {
        near: { 
          type: "Point", 
          coordinates: [parseFloat(lng), parseFloat(lat)] 
        },
        distanceField: "distance",
        maxDistance: parseInt(radius),
        spherical: true,
        query: { status: "open" }
      }
    },
    { $sort: { distance: 1 } },
    { $limit: 20 }
  ]);
  
  console.log(`📍 Found ${reports.length} nearby reports`);
  res.json({ reports });
});