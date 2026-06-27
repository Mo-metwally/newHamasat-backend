const express = require('express');
const searchController = require('../controllers/searchController');

const router = express.Router();

// GET /api/v1/search
router.get('/', searchController.globalSearch);

module.exports = router;
