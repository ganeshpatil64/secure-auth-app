// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db'); 
const router = express.Router();

// REGISTER ROUTE
router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Hash the password (Security step)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 2. Insert into DB (Parameterized Query = NO SQL Injection)
        const newUser = await db.query(
            'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
            [email, hashedPassword] // $1 and $2 safely map to these variables
        );

        res.status(201).json({ user: newUser.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// LOGIN ROUTE
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Check if user exists
        const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid Credentials' });
        }

        // 2. Verify Password
        const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid Credentials' });
        }

        // 3. Generate JWT
        const token = jwt.sign(
            { user_id: user.rows[0].id, role: user.rows[0].role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;