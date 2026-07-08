// middleware/admin.js

module.exports = function (req, res, next) {
    // We assume this runs AFTER auth.js, so req.user already exists
    if (!req.user) {
        return res.status(401).json({ error: 'Access Denied. User not authenticated.' });
    }

    // Check the role payload from the decrypted JWT
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden. You do not have administrator privileges.' });
    }

    // If they are an admin, let them through the door
    next();
};