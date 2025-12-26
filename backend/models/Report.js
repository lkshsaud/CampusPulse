import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  itemName:    { type: String, required: true },
  category:    { type: String, enum: ["lost", "found"], required: true },
  description: { type: String, required: true },
  imageUrl:    { type: String }, // Cloudinary URL
  cloudinaryId: { type: String }, // Cloudinary public_id
  // geo: use GeoJSON Point with [lng, lat]
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0, 0] } // [lng, lat]
  },
  lat:         { type: Number, required: true },
  lng:         { type: Number, required: true },
  owner:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  contact:     { type: String }, // 10-digit contact
  status:      { type: String, enum: ["open","claimed","closed"], default: "open" },
  pHash:       { type: String }, // image perceptual hash hex
  claimedBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  tokensAwarded:{ type: Number, default: 0 },
  createdAt:   { type: Date, default: Date.now }
});

// 2dsphere index for geo queries
reportSchema.index({ location: "2dsphere" });
// Index for faster status queries
reportSchema.index({ status: 1 });
// Index for category queries
reportSchema.index({ category: 1 });

export const Report = mongoose.model("Report", reportSchema);