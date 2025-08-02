
import TryCatch from '../utils/Trycatch.js';
import Report    from '../models/Report.js';
import { User }  from '../models/userModel.js';

// 1) Create report
export const createReport = TryCatch(async (req, res) => {
  const { itemName, category, description } = req.body;
  const file = req.file;
  const imageUrl = file ? `/uploads/${file.filename}` : '';

  const rpt = await Report.create({
    owner:       req.user._id,
    itemName,
    category,
    description,
    imageUrl,
    lat:   parseFloat(req.body.lat),
    lng:   parseFloat(req.body.lng)
  });

  res.status(201).json({ report: rpt });
});

// 2) Get all reports
export const getReports = TryCatch(async (req, res) => {
  const reports = await Report.find()
    .sort({ createdAt: -1 })
    .populate('owner','name');        
  res.json(reports);
});

// 3) Claim a report
export const claimReport = TryCatch(async (req, res) => {
  const rpt = await Report.findById(req.params.id);
  if (!rpt) return res.status(404).json({ error: 'Not found' });

  // LOST: only owner may claim
  if (rpt.category === 'lost'
    && rpt.owner.toString() !== req.user._id.toString()
  ) {
    return res.status(403).json({ error: 'Not allowed' });
  }

  // FOUND: award 10 tokens to the reporter
  if (rpt.category === 'found') {
    await User.findByIdAndUpdate(rpt.owner, { $inc: { tokens: 10 } });
  }

  await rpt.deleteOne();
  res.json({ message: 'Claimed' });
});
