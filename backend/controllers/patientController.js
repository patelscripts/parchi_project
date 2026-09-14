const { computeTrendForAnalyte } = require('./trendController');
const { ALLOWED_ANALYTES } = require('../models/AnalyteRecord');

// patient ka apna poora growth dashboard — sabhi kidney+diabetes analytes ek saath
exports.getGrowthOverview = async (req, res) => {
  try {
    const results = await Promise.all(
      ALLOWED_ANALYTES.map((key) => computeTrendForAnalyte(req.user._id, key))
    );

    // sirf wo analytes bhejo jinke koi records hai (khali cheezein UI me clutter na banaye)
    const withData = results.filter((r) => r.trend.reportsUploaded > 0);

    res.json({ patientId: req.user._id, analytes: withData });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load growth overview', error: err.message });
  }
};