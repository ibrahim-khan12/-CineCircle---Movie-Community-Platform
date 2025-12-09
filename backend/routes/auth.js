const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// User Registration
router.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password, favoriteGenres } = req.body;

        // Validate input
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if user already exists
        const [existingUsers] = await db.query(
            'SELECT user_id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert user
        const [result] = await db.query(
            'INSERT INTO users (first_name, last_name, email, password_hash, date_joined) VALUES (?, ?, ?, ?, NOW())',
            [firstName, lastName, email, passwordHash]
        );

        const userId = result.insertId;

        // Insert favorite genres if provided
        if (favoriteGenres && Array.isArray(favoriteGenres) && favoriteGenres.length > 0) {
            const genreValues = favoriteGenres.map(genreId => [userId, genreId]);
            await db.query(
                'INSERT INTO user_favorite_genres (user_id, genre_id) VALUES ?',
                [genreValues]
            );
        }

        res.status(201).json({ 
            message: 'Registration successful',
            userId: userId
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// User Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        // Get user from database
        const [users] = await db.query(
            'SELECT user_id, first_name, last_name, email, password_hash, role FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = users[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Update last login
        await db.query(
            'UPDATE users SET last_login = NOW() WHERE user_id = ?',
            [user.user_id]
        );

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user.user_id,
                email: user.email,
                isAdmin: user.role === 'admin'
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            message: 'Login successful',
            token: token,
            user: {
                user_id: user.user_id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Admin Login
router.post('/admin/login', async (req, res) => {
    try {
        const { email, password, accessCode } = req.body;

        if (!email || !password || !accessCode) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Get admin from database
        const [admins] = await db.query(
            'SELECT user_id, first_name, last_name, email, password_hash, role, admin_access_code FROM users WHERE email = ? AND role = \'admin\'',
            [email]
        );

        if (admins.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials or not an admin' });
        }

        const admin = admins[0];

        // Verify access code
        if (accessCode !== admin.admin_access_code) {
            return res.status(401).json({ error: 'Invalid access code' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, admin.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        await db.query(
            'UPDATE users SET last_login = NOW() WHERE user_id = ?',
            [admin.user_id]
        );

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: admin.user_id,
                email: admin.email,
                isAdmin: true
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            message: 'Admin login successful',
            token: token,
            user: {
                user_id: admin.user_id,
                first_name: admin.first_name,
                last_name: admin.last_name,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Logout (client-side token removal, but we can log the event)
router.post('/logout', (req, res) => {
    res.json({ message: 'Logout successful' });
});

module.exports = router;
