const Report = require('../models/Report');
const User = require('../models/User');

exports.uploadReport = async (req, res) => {
  try {
    const { reportDate, clinicCode, patientId } = req.body;

    let clinicId = null;
    if (clinicCode) {
      const clinic = await User.findOne({ clinicCode, role: 'clinic' });
      if (!clinic) return res.status(400).json({ message: 'Invalid clinic code' });
      clinicId = clinic._id;
    } else if (req.user.role === 'clinic') {
      clinicId = req.user._id;
    }

    let patientIdToUse = req.user._id;
    if (req.user.role === 'clinic' && patientId) {
      // Verify patient exists
      const patient = await User.findById(patientId);
      if (!patient || patient.role !== 'patient') {
        return res.status(400).json({ message: 'Invalid patient ID provided' });
      }
      patientIdToUse = patient._id;
    } else if (req.user.role === 'clinic' && !patientId) {
      return res.status(400).json({ message: 'patientId is required when uploading as a clinic' });
    }

    const report = await Report.create({
      patient: patientIdToUse,
      clinic: clinicId,
      reportDate: reportDate || new Date()
    });

    res.status(201).json({ reportId: report._id, linkedClinic: clinicId ? 'Linked' : 'None' });
  } catch (err) {
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
};
