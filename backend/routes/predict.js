const express = require('express');
const router = express.Router();
const authenticate  = require('../middleware/auth');

const {
  predict,
  predictPublic,
  budgetCheck,
  seasonal,
  getHistory,
  getStats,
} = require('../controller/predictionController');

router.post('/predict', authenticate, predict);
router.post('/predictPublic', predictPublic);
router.post('/budgetCheck', authenticate, budgetCheck);
router.post('/seasonal', authenticate, seasonal);
router.get('/history', authenticate, getHistory);
router.get('/stats', authenticate, getStats);

module.exports = router;