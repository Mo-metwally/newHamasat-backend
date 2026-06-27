const express = require('express');
const { performAnalysis, getStorageAnalysis } = require('../controllers/storageController');
const authService = require('../services/authService');

const router = express.Router();

router.use(authService.protect);
router.use(authService.allowedTo("superAdmin", 'admin', 'manager'));

router.post('/analyze', performAnalysis);
router.get('/', getStorageAnalysis);

module.exports = router;
