// backend/models/Report.js
import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  itemName:    { type: String, required: true },
  category:    { type: String, enum: ["lost", "found"], required: true },
  description: { type: String, required: true },
  imageUrl:    { type: String },
  lat:         { type: Number, required: true },
  lng:         { type: Number, required: true },
  owner:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt:   { type: Date, default: Date.now }
});

export const Report = mongoose.model("Report", reportSchema);
