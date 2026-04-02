const { promisePool } = require('../config/database');

// Create Service Record (INSERT)
const createServiceRecord = async (req, res) => {
    try {
        const { ServiceDate, PlateNumber, ServiceCode } = req.body;

        // Check if car exists
        const [car] = await promisePool.query(
            'SELECT PlateNumber FROM Car WHERE PlateNumber = ?',
            [PlateNumber]
        );

        if (car.length === 0) {
            return res.status(400).json({ message: 'Car not found' });
        }

        // Check if service exists
        const [service] = await promisePool.query(
            'SELECT ServiceCode FROM Services WHERE ServiceCode = ?',
            [ServiceCode]
        );

        if (service.length === 0) {
            return res.status(400).json({ message: 'Service not found' });
        }

        const [result] = await promisePool.query(
            'INSERT INTO ServiceRecord (ServiceDate, PlateNumber, ServiceCode) VALUES (?, ?, ?)',
            [ServiceDate, PlateNumber, ServiceCode]
        );

        res.status(201).json({ 
            message: 'Service record created successfully',
            RecordNumber: result.insertId
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all Service Records (RETRIEVE)
const getAllServiceRecords = async (req, res) => {
    try {
        const [records] = await promisePool.query(`
            SELECT sr.RecordNumber, sr.ServiceDate, 
                   c.PlateNumber, c.type, c.Model, c.DriverPhone,
                   s.ServiceCode, s.ServiceName, s.ServicePrice
            FROM ServiceRecord sr
            LEFT JOIN Car c ON sr.PlateNumber = c.PlateNumber
            LEFT JOIN Services s ON sr.ServiceCode = s.ServiceCode
            ORDER BY sr.ServiceDate DESC
        `);
        res.json(records);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get Service Record by Record Number
const getServiceRecordById = async (req, res) => {
    try {
        const { recordNumber } = req.params;
        const [records] = await promisePool.query(`
            SELECT sr.RecordNumber, sr.ServiceDate, 
                   c.PlateNumber, c.type, c.Model, c.ManufacturingYear, c.DriverPhone, c.MechanicName,
                   s.ServiceCode, s.ServiceName, s.ServicePrice
            FROM ServiceRecord sr
            LEFT JOIN Car c ON sr.PlateNumber = c.PlateNumber
            LEFT JOIN Services s ON sr.ServiceCode = s.ServiceCode
            WHERE sr.RecordNumber = ?
        `, [recordNumber]);

        if (records.length === 0) {
            return res.status(404).json({ message: 'Service record not found' });
        }

        res.json(records[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update Service Record (UPDATE)
const updateServiceRecord = async (req, res) => {
    try {
        const { recordNumber } = req.params;
        const { ServiceDate, PlateNumber, ServiceCode } = req.body;

        const [result] = await promisePool.query(
            'UPDATE ServiceRecord SET ServiceDate = ?, PlateNumber = ?, ServiceCode = ? WHERE RecordNumber = ?',
            [ServiceDate, PlateNumber, ServiceCode, recordNumber]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Service record not found' });
        }

        res.json({ message: 'Service record updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete Service Record (DELETE)
const deleteServiceRecord = async (req, res) => {
    try {
        const { recordNumber } = req.params;
        const [result] = await promisePool.query(
            'DELETE FROM ServiceRecord WHERE RecordNumber = ?',
            [recordNumber]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Service record not found' });
        }

        res.json({ message: 'Service record deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { 
    createServiceRecord, 
    getAllServiceRecords, 
    getServiceRecordById, 
    updateServiceRecord, 
    deleteServiceRecord 
};