// backend/routes/reportRoutes.js
import express from "express";
import multer  from "multer";
import path    from "path";
import { isAuth } from "../middlewares/isAuth.js";
import { Report } from "../models/Report.js";
import { User }   from "../models/userModel.js";

const router = express.Router();

// Multer: store uploads under <project-root>/uploads
const storage = multer.diskStorage({
  destination: path.resolve("uploads"),
  filename:  (req, file, cb) =>
    cb(null, `${Date.now()}_${file.originalname}`)
});
const upload = multer({ storage });

/**
 * POST /api/reports
 * Create a lost or found report.
 * If category==="found", award 10 tokens to the reporter immediately.
 */
router.post(
  "/",
  isAuth,
  upload.single("image"),
  async (req, res) => {
    const { itemName, category, description, lat, lng } = req.body;
    try {
      const imageUrl = req.file ? `/uploads/${req.file.filename}` : "";
      const report = await Report.create({
        itemName,
        category,
        description,
        imageUrl,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        owner: req.user._id
      });

      // Award 10 tokens to reporter if this is a "found" report
      if (category === "found") {
        await User.findByIdAndUpdate(req.user._id, {
          $inc: { tokens: 10 }
        });
      }

      res.status(201).json({ report });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error saving report" });
    }
  }
);

/**
 * GET /api/reports
 * Return all reports, newest first.
 */
router.get(
  "/",
  isAuth,
  async (req, res) => {
    try {
      const reports = await Report.find()
        .sort({ createdAt: -1 })
        .lean();
      res.json(reports);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error fetching reports" });
    }
  }
);

router.delete(
  "/:id",
  isAuth,
  async (req, res) => {
    try {
      const rep = await Report.findById(req.params.id);
      if (!rep) {
        return res.status(404).json({ error: "Report not found" });
      }

      // If this was a lost report, only its owner may claim (delete) it:
      if (rep.category === "lost"
          && rep.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: "Not allowed to claim this lost report" });
      }

      // Award tokens to the owner on claiming a lost report:
      if (rep.category === "lost") {
        await User.findByIdAndUpdate(rep.owner, {
          $inc: { tokens: 10 }
        });
      }

      await rep.deleteOne();
      res.json({ message: "Report claimed and deleted" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error deleting report" });
    }
  }
);

export default router;
