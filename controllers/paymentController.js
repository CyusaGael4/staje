const { promisePool } = require('../config/database');

const createPayment = async (req, res) => {
    try {
        const { AmountPaid, PaymentDate, RecordNumber, PlateNumber } = req.body;

        const [result] = await promisePool.query(
            'INSERT INTO Payment (AmountPaid, PaymentDate, RecordNumber, PlateNumber) VALUES (?, ?, ?, ?)',
            [AmountPaid, PaymentDate, RecordNumber, PlateNumber]
        );

        res.status(201).json({ 
            message: 'Payment recorded successfully',
            PaymentNumber: result.insertId
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


const getAllPayments = async (req, res) => {
    try {
        const [payments] = await promisePool.query(`
            SELECT p.PaymentNumber, p.AmountPaid, p.PaymentDate,
                   sr.RecordNumber, sr.ServiceDate,
                   c.PlateNumber, c.type, c.Model, c.DriverPhone,
                   s.ServiceName, s.ServicePrice
            FROM Payment p
            LEFT JOIN ServiceRecord sr ON p.RecordNumber = sr.RecordNumber
            LEFT JOIN Car c ON p.PlateNumber = c.PlateNumber
            LEFT JOIN Services s ON sr.ServiceCode = s.ServiceCode
            ORDER BY p.PaymentDate DESC
        `);
        res.json(payments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getPaymentById = async (req, res) => {
    try {
        const { paymentNumber } = req.params;
        const [payments] = await promisePool.query(`
            SELECT p.PaymentNumber, p.AmountPaid, p.PaymentDate,
                   sr.RecordNumber, sr.ServiceDate,
                   c.PlateNumber, c.type, c.Model, c.DriverPhone, c.MechanicName,
                   s.ServiceName, s.ServicePrice
            FROM Payment p
            LEFT JOIN ServiceRecord sr ON p.RecordNumber = sr.RecordNumber
            LEFT JOIN Car c ON p.PlateNumber = c.PlateNumber
            LEFT JOIN Services s ON sr.ServiceCode = s.ServiceCode
            WHERE p.PaymentNumber = ?
        `, [paymentNumber]);

        if (payments.length === 0) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        res.json(payments[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updatePayment = async (req, res) => {
    try {
        const { paymentNumber } = req.params;
        const { AmountPaid, PaymentDate, RecordNumber, PlateNumber } = req.body;

        const [result] = await promisePool.query(
            'UPDATE Payment SET AmountPaid = ?, PaymentDate = ?, RecordNumber = ?, PlateNumber = ? WHERE PaymentNumber = ?',
            [AmountPaid, PaymentDate, RecordNumber, PlateNumber, paymentNumber]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        res.json({ message: 'Payment updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deletePayment = async (req, res) => {
    try {
        const { paymentNumber } = req.params;
        const [result] = await promisePool.query(
            'DELETE FROM Payment WHERE PaymentNumber = ?',
            [paymentNumber]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        res.json({ message: 'Payment deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


const generateBill = async (req, res) => {
    try {
        const { paymentNumber } = req.params;
        const [payments] = await promisePool.query(`
            SELECT p.PaymentNumber, p.AmountPaid, p.PaymentDate,
                   sr.RecordNumber, sr.ServiceDate,
                   c.PlateNumber, c.type, c.Model, c.ManufacturingYear, c.DriverPhone, c.MechanicName,
                   s.ServiceCode, s.ServiceName, s.ServicePrice
            FROM Payment p
            LEFT JOIN ServiceRecord sr ON p.RecordNumber = sr.RecordNumber
            LEFT JOIN Car c ON p.PlateNumber = c.PlateNumber
            LEFT JOIN Services s ON sr.ServiceCode = s.ServiceCode
            WHERE p.PaymentNumber = ?
        `, [paymentNumber]);

        if (payments.length === 0) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        const bill = payments[0];
        res.json(bill);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


const generateDailyReport = async (req, res) => {
    try {
        const { date } = req.params;
        
        const [report] = await promisePool.query(`
            SELECT 
                p.PaymentNumber,
                p.AmountPaid,
                p.PaymentDate,
                c.PlateNumber,
                c.type,
                c.Model,
                c.DriverPhone,
                s.ServiceName,
                s.ServicePrice,
                sr.ServiceDate
            FROM Payment p
            LEFT JOIN ServiceRecord sr ON p.RecordNumber = sr.RecordNumber
            LEFT JOIN Car c ON p.PlateNumber = c.PlateNumber
            LEFT JOIN Services s ON sr.ServiceCode = s.ServiceCode
            WHERE DATE(p.PaymentDate) = ?
            ORDER BY p.PaymentDate DESC
        `, [date]);

        const totalAmount = report.reduce((sum, item) => sum + parseFloat(item.AmountPaid), 0);

        res.json({
            date: date,
            totalPayments: report.length,
            totalAmount: totalAmount,
            transactions: report
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { 
    createPayment, 
    getAllPayments, 
    getPaymentById, 
    updatePayment, 
    deletePayment,
    generateBill,
    generateDailyReport
};
