const AnalyteRecord = require('../models/AnalyteRecord');
const Report = require('../models/Report');
const geminiService = require('../services/geminiService');
const { normalizeExtractedValue } = require('../services/analyteNormalizer');

exports.extractFromReport = async (req, res) => {
  try {
    console.log('--- Extraction Request Received ---');
    console.log('Body:', req.body);
    console.log('File:', req.file ? `File received: ${req.file.originalname}` : 'No file received');

    const { reportId } = req.body;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const report = await Report.findById(reportId);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    // Access Check: Patient must own it, OR Clinic must be linked to it
    const isPatient = report.patient.equals(req.user._id);
    const isClinic = report.clinic && report.clinic.equals(req.user._id);

    if (!isPatient && !isClinic) {
      return res.status(403).json({ message: 'Access denied to this report' });
    }

    const geminiResult = await geminiService.extractValues(req.file.buffer, req.file.mimetype);

    if (geminiResult.reportDate) {
      report.reportDate = geminiResult.reportDate;
      report.labName = geminiResult.labName;
      await report.save();
    }

    // Normalize Analytes (Kidney/Diabetes only)
    const normalized = (geminiResult.analytes || [])
      .map((a) => normalizeExtractedValue(a))
      .filter(Boolean);

    if (normalized.length === 0) {
      return res.status(200).json({ message: 'No relevant analytes found in this report', drafts: [] });
    }

    const drafts = await AnalyteRecord.insertMany(
      normalized.map((n) => ({
        patient: report.patient,
        report: report._id,
        analyteName: n.analyteKey,
        rawLabel: n.rawLabel,
        unit: n.unit,
        extractedValue: n.value,
        value: n.value,
        date: report.reportDate,
        status: 'pending_verification'
      }))
    );

    res.status(201).json({ message: 'Extracted — please verify these values', drafts });
  } catch (err) {
    res.status(500).json({ message: 'Extraction failed', error: err.message });
  }
};