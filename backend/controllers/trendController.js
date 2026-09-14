const AnalyteRecord = require('../models/AnalyteRecord');
const {
  calculateTrendSlope,
  projectThresholdCrossing,
  getEscalationTier
} = require('../utils/clinicalMath');

// har analyte ka reference threshold — source-cited
const THRESHOLDS = {
  creatinine: { value: 1.3, source: 'KDIGO (upper normal reference)' },
  bun: { value: 20, source: 'standard upper reference limit' },
  acr: { value: 30, source: 'KDIGO A1→A2 boundary' },
  hba1c: { value: 5.7, source: 'ADA (prediabetes threshold)' }
};

async function computeTrendForAnalyte(patientId, analyteKey) {
  const records = await AnalyteRecord.find({
    patient: patientId,
    analyteName: analyteKey,
    status: 'verified' // sirf verified — extraction ke fauran baad kabhi nahi
  }).sort('date');

  const points = records.map((r) => ({ date: r.date, value: r.value }));
  const trend = calculateTrendSlope(points);

  const threshold = THRESHOLDS[analyteKey] || null;
  const projection =
    trend.status === 'trend_available' && threshold
      ? projectThresholdCrossing({
          slopePerYear: trend.slopePerYear,
          latestValue: trend.latestValue,
          threshold: threshold.value
        })
      : null;

  const tier = getEscalationTier({ trend, projection, rSquared: trend.rSquared ?? null });

  return { analyteKey, trend, threshold, projection, tier };
}

exports.getTrendForAnalyte = async (req, res) => {
  try {
    const { analyteKey } = req.params;
    const result = await computeTrendForAnalyte(req.user._id, analyteKey);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Trend computation failed', error: err.message });
  }
};

module.exports.computeTrendForAnalyte = computeTrendForAnalyte;