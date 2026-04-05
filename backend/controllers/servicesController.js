const { promisePool } = require('../config/database');

// Create Service
const createService = async (req, res) => {
    try {
        const { ServiceCode, ServiceName, ServicePrice } = req.body;

        // Check if service exists
        const [existing] = await promisePool.query(
            'SELECT ServiceCode FROM Services WHERE ServiceCode = ?',
            [ServiceCode]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Service code already exists' });
        }

        const [result] = await promisePool.query(
            'INSERT INTO Services (ServiceCode, ServiceName, ServicePrice) VALUES (?, ?, ?)',
            [ServiceCode, ServiceName, ServicePrice]
        );

        res.status(201).json({ 
            message: 'Service added successfully',
            ServiceCode: ServiceCode
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all Services
const getAllServices = async (req, res) => {
    try {
        const [services] = await promisePool.query('SELECT * FROM Services ORDER BY ServiceName');
        res.json(services);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get Service by Code
const getServiceByCode = async (req, res) => {
    try {
        const { serviceCode } = req.params;
        const [services] = await promisePool.query(
            'SELECT * FROM Services WHERE ServiceCode = ?',
            [serviceCode]
        );

        if (services.length === 0) {
            return res.status(404).json({ message: 'Service not found' });
        }

        res.json(services[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update Service
const updateService = async (req, res) => {
    try {
        const { serviceCode } = req.params;
        const { ServiceName, ServicePrice } = req.body;

        const [result] = await promisePool.query(
            'UPDATE Services SET ServiceName = ?, ServicePrice = ? WHERE ServiceCode = ?',
            [ServiceName, ServicePrice, serviceCode]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Service not found' });
        }

        res.json({ message: 'Service updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete Service
const deleteService = async (req, res) => {
    try {
        const { serviceCode } = req.params;
        const [result] = await promisePool.query(
            'DELETE FROM Services WHERE ServiceCode = ?',
            [serviceCode]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Service not found' });
        }

        res.json({ message: 'Service deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { createService, getAllServices, getServiceByCode, updateService, deleteService };