const register = async (req, res) => {
    try {
        const { username, password, email, fullName } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        const [existing] = await promisePool.query(
            'SELECT userId FROM User WHERE username = ?',
            [username]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await promisePool.query(
            'INSERT INTO User (username, password, email, fullName) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, email || null, fullName || null]
        );

        res.status(201).json({ 
            message: 'User registered successfully',
            userId: result.insertId
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

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
            process.env.JWT_SECRET || 'crpms_secret_key_2025',
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                userId: user.userId,
                username: user.username,
                fullName: user.fullName,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
