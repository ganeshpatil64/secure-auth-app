// middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // 1. Get the token from the HTTP Authorization header
    const authHeader = req.header('Authorization');
    
    // Check if the header exists and follows the 'Bearer <token>' format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access Denied. No token provided.' });
    }

    // Extract the actual token string
    const token = authHeader.split(' ')[1];

    try {
        // 2. Verify the token signature using your JWT_SECRET
        // If the token was tampered with, this will throw an error immediately
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        
        // 3. Attach the decrypted user data (id, role) to the request object
        req.user = verified;
        
        // Pass control to the next function (the actual protected route)
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid or expired token.' });
    }
};