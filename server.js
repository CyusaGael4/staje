const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = 5000;


app.use(cors());
app.use(express.json());


const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'crpms',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const promisePool = pool.promise();

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, 'secretkey123');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid or expired token.' });
    }
};


async function testConnection() {
    try {
        const connection = await promisePool.getConnection();
        console.log('MySQL connected successfully');
        connection.release();
        return true;
    } catch (error) {
        console.error('MySQL connection failed:', error.message);
        return false;
    }
}


app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log('Login attempt:', username);

        const [users] = await promisePool.query(
            'SELECT * FROM User WHERE username = ?',
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.userId, username: user.username },
            'secretkey123',
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                userId: user.userId,
                username: user.username,
                fullName: user.fullName
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password, email, fullName } = req.body;
        
       
        const [existing] = await promisePool.query(
            'SELECT userId FROM User WHERE username = ?',
            [username]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Username already exists' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const [result] = await promisePool.query(
            'INSERT INTO User (username, password, email, fullName) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, email, fullName]
        );
        
        res.status(201).json({ message: 'User created', userId: result.insertId });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


app.post('/api/cars', authenticateToken, async (req, res) => {
    try {
        const { PlateNumber, type, Model, ManufacturingYear, DriverPhone, MechanicName } = req.body;

        const [existing] = await promisePool.query(
            'SELECT PlateNumber FROM Car WHERE PlateNumber = ?',
            [PlateNumber]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Car with this plate number already exists' });
        }

        await promisePool.query(
            'INSERT INTO Car (PlateNumber, type, Model, ManufacturingYear, DriverPhone, MechanicName) VALUES (?, ?, ?, ?, ?, ?)',
            [PlateNumber, type, Model, ManufacturingYear, DriverPhone, MechanicName]
        );

        res.status(201).json({ message: 'Car added successfully', PlateNumber });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

app.get('/api/cars', authenticateToken, async (req, res) => {
    try {
        const [cars] = await promisePool.query('SELECT * FROM Car ORDER BY PlateNumber');
        res.json(cars);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


app.get('/api/cars/:plateNumber', authenticateToken, async (req, res) => {
    try {
        const { plateNumber } = req.params;
        const [cars] = await promisePool.query('SELECT * FROM Car WHERE PlateNumber = ?', [plateNumber]);

        if (cars.length === 0) {
            return res.status(404).json({ message: 'Car not found' });
        }

        res.json(cars[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


app.put('/api/cars/:plateNumber', authenticateToken, async (req, res) => {
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
        res.status(500).json({ message: 'Server error' });
    }
});


app.delete('/api/cars/:plateNumber', authenticateToken, async (req, res) => {
    try {
        const { plateNumber } = req.params;
        const [result] = await promisePool.query('DELETE FROM Car WHERE PlateNumber = ?', [plateNumber]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Car not found' });
        }

        res.json({ message: 'Car deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


app.post('/api/services', authenticateToken, async (req, res) => {
    try {
        const { ServiceCode, ServiceName, ServicePrice } = req.body;

        const [existing] = await promisePool.query(
            'SELECT ServiceCode FROM Services WHERE ServiceCode = ?',
            [ServiceCode]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Service code already exists' });
        }

        await promisePool.query(
            'INSERT INTO Services (ServiceCode, ServiceName, ServicePrice) VALUES (?, ?, ?)',
            [ServiceCode, ServiceName, ServicePrice]
        );

        res.status(201).json({ message: 'Service added successfully', ServiceCode });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


app.get('/api/services', authenticateToken, async (req, res) => {
    try {
        const [services] = await promisePool.query('SELECT * FROM Services ORDER BY ServiceName');
        res.json(services);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


app.get('/api/services/:serviceCode', authenticateToken, async (req, res) => {
    try {
        const { serviceCode } = req.params;
        const [services] = await promisePool.query('SELECT * FROM Services WHERE ServiceCode = ?', [serviceCode]);

        if (services.length === 0) {
            return res.status(404).json({ message: 'Service not found' });
        }

        res.json(services[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.put('/api/services/:serviceCode', authenticateToken, async (req, res) => {
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
        res.status(500).json({ message: 'Server error' });
    }
});

app.delete('/api/services/:serviceCode', authenticateToken, async (req, res) => {
    try {
        const { serviceCode } = req.params;
        const [result] = await promisePool.query('DELETE FROM Services WHERE ServiceCode = ?', [serviceCode]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Service not found' });
        }

        res.json({ message: 'Service deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/service-records', authenticateToken, async (req, res) => {
    try {
        const { ServiceDate, PlateNumber, ServiceCode } = req.body;

      
        const [car] = await promisePool.query('SELECT PlateNumber FROM Car WHERE PlateNumber = ?', [PlateNumber]);
        if (car.length === 0) {
            return res.status(400).json({ message: 'Car not found' });
        }

        const [service] = await promisePool.query('SELECT ServiceCode FROM Services WHERE ServiceCode = ?', [ServiceCode]);
        if (service.length === 0) {
            return res.status(400).json({ message: 'Service not found' });
        }

        const [result] = await promisePool.query(
            'INSERT INTO ServiceRecord (ServiceDate, PlateNumber, ServiceCode) VALUES (?, ?, ?)',
            [ServiceDate, PlateNumber, ServiceCode]
        );

        res.status(201).json({ message: 'Service record created successfully', RecordNumber: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


app.get('/api/service-records', authenticateToken, async (req, res) => {
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
        res.status(500).json({ message: 'Server error' });
    }
});


app.get('/api/service-records/:recordNumber', authenticateToken, async (req, res) => {
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
        res.status(500).json({ message: 'Server error' });
    }
});


app.put('/api/service-records/:recordNumber', authenticateToken, async (req, res) => {
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
        res.status(500).json({ message: 'Server error' });
    }
});


app.delete('/api/service-records/:recordNumber', authenticateToken, async (req, res) => {
    try {
        const { recordNumber } = req.params;
        const [result] = await promisePool.query('DELETE FROM ServiceRecord WHERE RecordNumber = ?', [recordNumber]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Service record not found' });
        }

        res.json({ message: 'Service record deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


app.post('/api/payments', authenticateToken, async (req, res) => {
    try {
        const { AmountPaid, PaymentDate, RecordNumber, PlateNumber } = req.body;

        const [result] = await promisePool.query(
            'INSERT INTO Payment (AmountPaid, PaymentDate, RecordNumber, PlateNumber) VALUES (?, ?, ?, ?)',
            [AmountPaid, PaymentDate, RecordNumber, PlateNumber]
        );

        res.status(201).json({ message: 'Payment recorded successfully', PaymentNumber: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


app.get('/api/payments', authenticateToken, async (req, res) => {
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
        res.status(500).json({ message: 'Server error' });
    }
});


app.get('/api/payments/:paymentNumber', authenticateToken, async (req, res) => {
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
        res.status(500).json({ message: 'Server error' });
    }
});


app.get('/api/payments/bill/:paymentNumber', authenticateToken, async (req, res) => {
    try {
        const { paymentNumber } = req.params;
        const [bill] = await promisePool.query(`
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

        if (bill.length === 0) {
            return res.status(404).json({ message: 'Bill not found' });
        }

        res.json(bill[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


app.get('/api/payments/report/daily/:date', authenticateToken, async (req, res) => {
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
        res.status(500).json({ message: 'Server error' });
    }
});


app.put('/api/payments/:paymentNumber', authenticateToken, async (req, res) => {
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
        res.status(500).json({ message: 'Server error' });
    }
});


app.delete('/api/payments/:paymentNumber', authenticateToken, async (req, res) => {
    try {
        const { paymentNumber } = req.params;
        const [result] = await promisePool.query('DELETE FROM Payment WHERE PaymentNumber = ?', [paymentNumber]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        res.json({ message: 'Payment deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


app.get('/', (req, res) => {
    res.json({ message: 'CRPMS API is running' });
});


app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    await testConnection();
});
