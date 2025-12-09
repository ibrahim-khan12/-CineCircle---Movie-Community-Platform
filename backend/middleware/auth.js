const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Middleware to verify admin role
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        if (!user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        req.user = user;
        next();
    });
};

// Middleware to check if user is accessing their own data
const authorizeUser = (req, res, next) => {
    const userId = parseInt(req.params.userId || req.body.userId);
    
    console.log('Authorization check:', { 
        requestedUserId: userId, 
        tokenUserId: req.user.userId,
        match: req.user.userId === userId 
    });
    
    if (req.user.userId !== userId && !req.user.isAdmin) {
        return res.status(403).json({ error: 'Access denied' });
    }
    next();
};

module.exports = {
    authenticateToken,
    authenticateAdmin,
    authorizeUser
};
