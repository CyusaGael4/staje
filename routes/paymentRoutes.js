const express = require('express');
const { 
    createPayment, 
    getAllPayments, 
    getPaymentById, 
    updatePayment, 
    deletePayment,
    generateBill,
    generateDailyReport
} = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/', authenticateToken, createPayment);
router.get('/', authenticateToken, getAllPayments);
router.get('/:paymentNumber', authenticateToken, getPaymentById);
router.put('/:paymentNumber', authenticateToken, updatePayment);
router.delete('/:paymentNumber', authenticateToken, deletePayment);
router.get('/bill/:paymentNumber', authenticateToken, generateBill);
router.get('/report/daily/:date', authenticateToken, generateDailyReport);

module.exports = router;