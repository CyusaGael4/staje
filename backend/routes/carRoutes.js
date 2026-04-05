const express = require('express');
const { 
    createCar, 
    getAllCars, 
    getCarByPlate, 
    updateCar, 
    deleteCar 
} = require('../controllers/carController');
const { authenticateToken } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/', authenticateToken, createCar);
router.get('/', authenticateToken, getAllCars);
router.get('/:plateNumber', authenticateToken, getCarByPlate);
router.put('/:plateNumber', authenticateToken, updateCar);
router.delete('/:plateNumber', authenticateToken, deleteCar);

module.exports = router;