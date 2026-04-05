const { promisePool } = require('../config/database');

// Create Car
const createCar = async (req, res) => {
    try {
        const { PlateNumber, type, Model, ManufacturingYear, DriverPhone, MechanicName } = req.body;

        // Check if car exists
        const [existing] = await promisePool.query(
            'SELECT PlateNumber FROM Car WHERE PlateNumber = ?',
            [PlateNumber]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Car with this plate number already exists' });
        }

        const [result] = await promisePool.query(
            'INSERT INTO Car (PlateNumber, type, Model, ManufacturingYear, DriverPhone, MechanicName) VALUES (?, ?, ?, ?, ?, ?)',
            [PlateNumber, type, Model, ManufacturingYear, DriverPhone, MechanicName]
        );

        res.status(201).json({ 
            message: 'Car added successfully',
            PlateNumber: PlateNumber
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all Cars
const getAllCars = async (req, res) => {
    try {
        const [cars] = await promisePool.query('SELECT * FROM Car ORDER BY PlateNumber');
        res.json(cars);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get Car by Plate Number
const getCarByPlate = async (req, res) => {
    try {
        const { plateNumber } = req.params;
        const [cars] = await promisePool.query(
            'SELECT * FROM Car WHERE PlateNumber = ?',
            [plateNumber]
        );

        if (cars.length === 0) {
            return res.status(404).json({ message: 'Car not found' });
        }

        res.json(cars[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update Car
const updateCar = async (req, res) => {
    try {
        const { plateNumber } = req.params;
        const { type, Model, ManufacturingYear, DriverPhone, MechanicName } = req.body;

        const [result] = await promisePool.query(
            'UPDATE Car SET type = ?, Model = ?, ManufacturingYear = ?, DriverPhone = ?, MechanicName = ? WHERE PlateNumber = ?',
            [type, Model, ManufacturingYear, DriverPhone, MechanicName, plateNumber]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Car not found' });
        }

        res.json({ message: 'Car updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete Car
const deleteCar = async (req, res) => {
    try {
        const { plateNumber } = req.params;
        const [result] = await promisePool.query(
            'DELETE FROM Car WHERE PlateNumber = ?',
            [plateNumber]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Car not found' });
        }

        res.json({ message: 'Car deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { createCar, getAllCars, getCarByPlate, updateCar, deleteCar };