// // backend/models/Report.js
// import mongoose from "mongoose";

// const reportSchema = new mongoose.Schema({
//   itemName:    { type: String, required: true },
//   category:    { type: String, enum: ["lost", "found"], required: true },
//   description: { type: String, required: true },
//   imageUrl:    { type: String },
//   lat:         { type: Number, required: true },
//   lng:         { type: Number, required: true },
//   owner:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   createdAt:   { type: Date, default: Date.now }
// });

// export const Report = mongoose.model("Report", reportSchema);


// backend/models/Report.js
import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  itemName:    { type: String, required: true },
  category:    { type: String, enum: ["lost", "found"], required: true },
  description: { type: String, required: true },
  imageUrl:    { type: String },
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

export const Report = mongoose.model("Report", reportSchema);
