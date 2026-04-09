const express = require('express');
const router = express.Router();
const profileController = require('../controller/profileController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', profileController.getProfile);
router.post('/create', profileController.createProfile);
router.put('/update', profileController.updateProfile);
router.post('/appliances', profileController.addAppliances);
router.get('/appliances', profileController.getAppliances);

module.exports = router;