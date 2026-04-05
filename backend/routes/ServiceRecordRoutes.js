const express = require('express');
const { 
    createServiceRecord, 
    getAllServiceRecords, 
    getServiceRecordById, 
    updateServiceRecord, 
    deleteServiceRecord 
} = require('../controllers/serviceRecordController');
const { authenticateToken } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/', authenticateToken, createServiceRecord);
router.get('/', authenticateToken, getAllServiceRecords);
router.get('/:recordNumber', authenticateToken, getServiceRecordById);
router.put('/:recordNumber', authenticateToken, updateServiceRecord);
router.delete('/:recordNumber', authenticateToken, deleteServiceRecord);

module.exports = router;