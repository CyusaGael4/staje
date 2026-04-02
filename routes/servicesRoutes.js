const express = require('express');
const { 
    createService, 
    getAllServices, 
    getServiceByCode, 
    updateService, 
    deleteService 
} = require('../controllers/servicesController');
const { authenticateToken } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/', authenticateToken, createService);
router.get('/', authenticateToken, getAllServices);
router.get('/:serviceCode', authenticateToken, getServiceByCode);
router.put('/:serviceCode', authenticateToken, updateService);
router.delete('/:serviceCode', authenticateToken, deleteService);

module.exports = router;