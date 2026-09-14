const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/authorizeRole');
const upload = require('../middleware/uploadMiddleware');

const { uploadReport } = require('../controllers/uploadController');
const { extractFromReport } = require('../controllers/extractController');
const { verifyRecords } = require('../controllers/verifyController');

router.post('/upload', protect, authorizeRole('patient', 'clinic'), uploadReport);
router.post('/extract', protect, authorizeRole('patient', 'clinic'), upload.single('report'), extractFromReport);
router.post('/verify', protect, authorizeRole('patient', 'clinic'), verifyRecords);

module.exports = router;