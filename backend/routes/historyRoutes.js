const express = require('express');
const router = express.Router();
const { createHistoryLog, getHistoryByUser, clearHistoryByUser } = require('../controller/historyController');

// Route: POST /api/history/add
router.post('/add', createHistoryLog);

// Route: GET /api/history/:userId
router.get('/:userId', getHistoryByUser);

// Route: DELETE /api/history/:userId
router.delete('/:userId', clearHistoryByUser);

module.exports = router;