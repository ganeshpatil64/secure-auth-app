require('dotenv').config(); 
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db'); 

// Only ONE of each middleware import here:
const authMiddleware = require('./middleware/Temporary');
const adminMiddleware = require('./middleware/admin');

const app = express();
// --- SECURITY SHIELD: Brute Force Protection ---
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes of memory
    max: 5, // Maximum 5 attempts allowed per IP
    message: { error: 'Security Alert: Too many failed login attempts. IP temporarily blocked for 15 minutes.' },
    standardHeaders: true, 
    legacyHeaders: false,
});
// --- SECURITY SHIELDS ---
// Block brute-force attacks on the login route
// ... rest of your code

// --- SECURITY MIDDLEWARE ---
app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173', 'https://your-frontend-project.vercel.app' }));
app.use(express.json({ limit: '10kb' }));

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    message: 'Too many requests from this IP.',
});
app.use('/api/', apiLimiter);


// --- REAL REGISTRATION ROUTE ---
app.post('/api/register', loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Check if user already exists
        const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // 2. Hash the password (Security Measure)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Save user to database (Parameterized Query = NO SQL Injection)
        const newUser = await db.query(
            'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
            [email, hashedPassword] 
        );

        res.status(201).json({ message: 'Registration successful!' });
    } catch (err) {
        console.error("Registration Error:", err.message);
        res.status(500).json({ error: 'Server error during registration' });
    }
});


// --- REAL LOGIN ROUTE ---
app.post('/api/login', loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Find the user in the database
        const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid Credentials' });
        }

        // 2. Compare the typed password with the hashed password in the database
        const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid Credentials' });
        }

        // 3. Generate a real JWT token
        const token = jwt.sign(
            { user_id: user.rows[0].id, role: user.rows[0].role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token });
    } catch (err) {
        console.error("Login Error:", err.message);
        res.status(500).json({ error: 'Server error during login' });
    }
});
// --- PROTECTED ROUTE (Requires Token) ---
app.get('/api/dashboard', authMiddleware, async (req, res) => {
    try {
        // The middleware already verified the token and attached the user's ID to "req.user"
        const userId = req.user.user_id;

        // Fetch their private profile from the database
        const user = await db.query('SELECT id, email, role, created_at FROM users WHERE id = $1', [userId]);
        
        if (user.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Send the private data back to React
        res.json({ 
            message: 'Welcome to your secure dashboard!', 
            profile: user.rows[0] 
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error fetching dashboard data' });
    }
});
// --- HIGH SECURITY ADMIN ROUTE ---
// Notice it uses TWO middlewares: first auth checks the token, then admin checks the role
app.get('/api/admin-vault', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        // Only admins can execute this code. 
        // Let's fetch ALL users from the database so the admin can see them.
        const allUsers = await db.query('SELECT id, email, role, created_at FROM users ORDER BY created_at DESC');
        
        res.json({
            message: 'Admin Vault Unlocked. Here is the classified system data.',
            users: allUsers.rows
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error in admin vault' });
    }
});


app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'Database-connected server is running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running securely on port ${PORT}`);
});