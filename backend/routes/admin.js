const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateAdmin } = require('../middleware/auth');

// Get all users with filters
router.get('/users', authenticateAdmin, async (req, res) => {
    try {
        const { search, status, sortBy = 'date_joined', order = 'DESC' } = req.query;

        let query = `
            SELECT 
                u.user_id, u.first_name, u.last_name, u.email, u.date_joined, 
                u.last_login, u.is_suspended, u.role,
                (SELECT COUNT(*) FROM reviews WHERE user_id = u.user_id) as review_count,
                (SELECT COUNT(*) FROM watchlist WHERE user_id = u.user_id) as watchlist_count
            FROM users u
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            query += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (status === 'suspended') {
            query += ' AND u.is_suspended = 1';
        } else if (status === 'active') {
            query += ' AND u.is_suspended = 0';
        }

        query += ` ORDER BY u.${sortBy} ${order}`;

        const [users] = await db.query(query, params);
        res.json({ users });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Get user details by ID
router.get('/users/:userId', authenticateAdmin, async (req, res) => {
    try {
        const { userId } = req.params;

        const [users] = await db.query(
            `SELECT 
                u.*, 
                (SELECT COUNT(*) FROM reviews WHERE user_id = u.user_id) as review_count,
                (SELECT COUNT(*) FROM discussion_posts WHERE user_id = u.user_id) as post_count,
                (SELECT COUNT(*) FROM watchlist WHERE user_id = u.user_id) as watchlist_count,
                (SELECT COUNT(*) FROM events WHERE host_id = u.user_id) as events_hosted,
                (SELECT COUNT(*) FROM friendships WHERE (user_id_1 = u.user_id OR user_id_2 = u.user_id) AND status = 'accepted') as friends_count
            FROM users u
            WHERE u.user_id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: users[0] });
    } catch (error) {
        console.error('Get user details error:', error);
        res.status(500).json({ error: 'Failed to fetch user details' });
    }
});

// Suspend user
router.put('/users/:userId/suspend', authenticateAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason, adminId } = req.body;

        await db.query(
            'UPDATE users SET is_suspended = 1 WHERE user_id = ?',
            [userId]
        );

        // Log the action
        await db.query(
            `INSERT INTO audit_log (admin_id, action_type, table_name, record_id, details, timestamp)
            VALUES (?, 'suspend', 'users', ?, ?, NOW())`,
            [adminId, userId, reason || 'User suspended by admin']
        );

        res.json({ message: 'User suspended successfully' });
    } catch (error) {
        console.error('Suspend user error:', error);
        res.status(500).json({ error: 'Failed to suspend user' });
    }
});

// Unsuspend user
router.put('/users/:userId/unsuspend', authenticateAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const { adminId } = req.body;

        await db.query(
            'UPDATE users SET is_suspended = 0 WHERE user_id = ?',
            [userId]
        );

        // Log the action
        await db.query(
            `INSERT INTO audit_log (admin_id, action_type, table_name, record_id, details, timestamp)
            VALUES (?, 'unsuspend', 'users', ?, 'User unsuspended by admin', NOW())`,
            [adminId, userId]
        );

        res.json({ message: 'User unsuspended successfully' });
    } catch (error) {
        console.error('Unsuspend user error:', error);
        res.status(500).json({ error: 'Failed to unsuspend user' });
    }
});

// Delete user
router.delete('/users/:userId', authenticateAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const { adminId } = req.body;

        // Note: This will cascade delete related records if foreign keys are set with ON DELETE CASCADE
        await db.query('DELETE FROM users WHERE user_id = ?', [userId]);

        // Log the action
        await db.query(
            `INSERT INTO audit_log (admin_id, action_type, table_name, record_id, details, timestamp)
            VALUES (?, 'delete', 'users', ?, 'User deleted by admin', NOW())`,
            [adminId, userId]
        );

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Get system statistics
router.get('/stats/overview', authenticateAdmin, async (req, res) => {
    try {
        const [stats] = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM users WHERE role = 'user') as total_users,
                (SELECT COUNT(*) FROM users WHERE is_suspended = 1) as suspended_users,
                (SELECT COUNT(*) FROM movies) as total_movies,
                (SELECT COUNT(*) FROM reviews) as total_reviews,
                (SELECT COUNT(*) FROM discussion_posts) as total_posts,
                (SELECT COUNT(*) FROM events) as total_events,
                (SELECT COUNT(*) FROM users WHERE DATE(last_login) = CURDATE()) as active_today
            FROM dual
        `);

        res.json({ stats: stats[0] });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Get top movies report
router.get('/reports/top-movies', authenticateAdmin, async (req, res) => {
    try {
        const { limit = 10, orderBy = 'view_count' } = req.query;

        const [movies] = await db.query(
            `SELECT 
                m.movie_id, m.title, m.release_year, m.view_count, m.average_rating,
                (SELECT COUNT(*) FROM reviews WHERE movie_id = m.movie_id) as review_count,
                (SELECT COUNT(*) FROM watchlist WHERE movie_id = m.movie_id) as watchlist_count
            FROM movies m
            ORDER BY m.${orderBy} DESC
            LIMIT ?`,
            [parseInt(limit)]
        );

        res.json({ movies });
    } catch (error) {
        console.error('Get top movies report error:', error);
        res.status(500).json({ error: 'Failed to fetch top movies report' });
    }
});

// Get active users report
router.get('/reports/active-users', authenticateAdmin, async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const [users] = await db.query(
            `SELECT 
                u.user_id, u.first_name, u.last_name, u.email, u.last_login,
                (SELECT COUNT(*) FROM reviews WHERE user_id = u.user_id) as review_count,
                (SELECT COUNT(*) FROM discussion_posts WHERE user_id = u.user_id) as post_count,
                (SELECT COUNT(*) FROM events WHERE host_id = u.user_id) as events_hosted
            FROM users u
            WHERE u.role = 'user' AND u.is_suspended = 0
            ORDER BY u.last_login DESC
            LIMIT ?`,
            [parseInt(limit)]
        );

        res.json({ users });
    } catch (error) {
        console.error('Get active users report error:', error);
        res.status(500).json({ error: 'Failed to fetch active users report' });
    }
});

// Get genre popularity report
router.get('/reports/genre-popularity', authenticateAdmin, async (req, res) => {
    try {
        const [genres] = await db.query(
            `SELECT 
                g.genre_name,
                COUNT(DISTINCT mg.movie_id) as movie_count,
                COUNT(DISTINCT ugp.user_id) as user_preference_count,
                COUNT(DISTINCT w.user_id) as watchlist_count
            FROM genres g
            LEFT JOIN movie_genres mg ON g.genre_id = mg.genre_id
            LEFT JOIN user_genre_preferences ugp ON g.genre_id = ugp.genre_id
            LEFT JOIN watchlist w ON mg.movie_id = w.movie_id
            GROUP BY g.genre_id, g.genre_name
            ORDER BY watchlist_count DESC`
        );

        res.json({ genres });
    } catch (error) {
        console.error('Get genre popularity report error:', error);
        res.status(500).json({ error: 'Failed to fetch genre popularity report' });
    }
});

// Get moderation queue
router.get('/moderation/queue', authenticateAdmin, async (req, res) => {
    try {
        // Get recent reviews for moderation
        const [reviews] = await db.query(
            `SELECT 
                r.review_id, r.review_text, r.date_posted,
                u.first_name, u.last_name, u.email,
                m.title as movie_title
            FROM reviews r
            JOIN users u ON r.user_id = u.user_id
            JOIN movies m ON r.movie_id = m.movie_id
            ORDER BY r.date_posted DESC
            LIMIT 20`
        );

        // Get recent discussion posts
        const [posts] = await db.query(
            `SELECT 
                dp.post_id, dp.title, dp.content, dp.date_posted,
                u.first_name, u.last_name, u.email,
                m.title as movie_title
            FROM discussion_posts dp
            JOIN users u ON dp.user_id = u.user_id
            JOIN movies m ON dp.movie_id = m.movie_id
            ORDER BY dp.date_posted DESC
            LIMIT 20`
        );

        res.json({ reviews, posts });
    } catch (error) {
        console.error('Get moderation queue error:', error);
        res.status(500).json({ error: 'Failed to fetch moderation queue' });
    }
});

// Delete review (moderation)
router.delete('/moderation/reviews/:reviewId', authenticateAdmin, async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { adminId, reason } = req.body;

        await db.query('DELETE FROM reviews WHERE review_id = ?', [reviewId]);

        // Log the action
        await db.query(
            `INSERT INTO audit_log (admin_id, action_type, table_name, record_id, details, timestamp)
            VALUES (?, 'delete', 'reviews', ?, ?, NOW())`,
            [adminId, reviewId, reason || 'Review deleted by admin']
        );

        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({ error: 'Failed to delete review' });
    }
});

// Delete discussion post (moderation)
router.delete('/moderation/posts/:postId', authenticateAdmin, async (req, res) => {
    try {
        const { postId } = req.params;
        const { adminId, reason } = req.body;

        await db.query('DELETE FROM discussion_posts WHERE post_id = ?', [postId]);

        // Log the action
        await db.query(
            `INSERT INTO audit_log (admin_id, action_type, table_name, record_id, details, timestamp)
            VALUES (?, 'delete', 'discussion_posts', ?, ?, NOW())`,
            [adminId, postId, reason || 'Post deleted by admin']
        );

        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

// Get audit log
router.get('/audit-log', authenticateAdmin, async (req, res) => {
    try {
        const { limit = 50, actionType } = req.query;

        let query = `
            SELECT 
                al.*, u.first_name, u.last_name, u.email
            FROM audit_log al
            JOIN users u ON al.admin_id = u.user_id
            WHERE 1=1
        `;
        const params = [];

        if (actionType) {
            query += ' AND al.action_type = ?';
            params.push(actionType);
        }

        query += ' ORDER BY al.timestamp DESC LIMIT ?';
        params.push(parseInt(limit));

        const [logs] = await db.query(query, params);
        res.json({ logs });
    } catch (error) {
        console.error('Get audit log error:', error);
        res.status(500).json({ error: 'Failed to fetch audit log' });
    }
});

// Get restricted words
router.get('/moderation/restricted-words', authenticateAdmin, async (req, res) => {
    try {
        const [words] = await db.query('SELECT * FROM restricted_words ORDER BY word');
        res.json({ words });
    } catch (error) {
        console.error('Get restricted words error:', error);
        res.status(500).json({ error: 'Failed to fetch restricted words' });
    }
});

// Add restricted word
router.post('/moderation/restricted-words', authenticateAdmin, async (req, res) => {
    try {
        const { word } = req.body;

        await db.query(
            'INSERT INTO restricted_words (word) VALUES (?)',
            [word.toLowerCase()]
        );

        res.status(201).json({ message: 'Restricted word added successfully' });
    } catch (error) {
        console.error('Add restricted word error:', error);
        res.status(500).json({ error: 'Failed to add restricted word' });
    }
});

// Delete restricted word
router.delete('/moderation/restricted-words/:wordId', authenticateAdmin, async (req, res) => {
    try {
        const { wordId } = req.params;

        await db.query('DELETE FROM restricted_words WHERE word_id = ?', [wordId]);

        res.json({ message: 'Restricted word deleted successfully' });
    } catch (error) {
        console.error('Delete restricted word error:', error);
        res.status(500).json({ error: 'Failed to delete restricted word' });
    }
});

module.exports = router;
