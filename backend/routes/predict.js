const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const {
  predict,
  predictPublic,
  budgetCheck,
  seasonal,
  getHistory,
  getStats,
  getDetailedPrediction, 
} = require('../controller/predictionController');

router.post('/predict', authenticate, predict);
router.post('/budgetCheck', authenticate, budgetCheck);
router.post('/seasonal', authenticate, seasonal);
router.get('/history', authenticate, getHistory);
router.get('/stats', authenticate, getStats);
router.get('/history/:id', authenticate, getDetailedPrediction); 

router.post('/predictPublic', predictPublic);

module.exports = router;