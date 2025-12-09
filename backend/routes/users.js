const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, authorizeUser } = require('../middleware/auth');

// Get user profile with statistics
router.get('/:userId/profile', async (req, res) => {
    try {
        const { userId } = req.params;

        const [users] = await db.query(
            `SELECT user_id, first_name, last_name, email, date_joined, bio, profile_picture
            FROM users WHERE user_id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get statistics
        const [stats] = await db.query(
            `SELECT 
                (SELECT COUNT(*) FROM watchlist WHERE user_id = ?) as movies_watched,
                (SELECT COUNT(*) FROM reviews WHERE user_id = ?) as reviews_count,
                (SELECT COUNT(*) FROM friendships WHERE (user_id_1 = ? OR user_id_2 = ?) AND status = 'accepted') as friends_count,
                (SELECT COUNT(*) FROM events WHERE host_id = ?) as events_hosted
            FROM dual`,
            [userId, userId, userId, userId, userId]
        );

        // Get favorite genres
        const [genres] = await db.query(
            `SELECT g.genre_name, COUNT(*) as count
            FROM user_genre_preferences ugp
            JOIN genres g ON ugp.genre_id = g.genre_id
            WHERE ugp.user_id = ?
            GROUP BY g.genre_name
            ORDER BY count DESC
            LIMIT 3`,
            [userId]
        );

        res.json({ 
            user: users[0],
            stats: stats[0],
            favoriteGenres: genres
        });
    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
});

// Update user profile
router.put('/:userId', authenticateToken, authorizeUser, async (req, res) => {
    try {
        const { userId } = req.params;
        const { firstName, lastName, bio, profilePicture } = req.body;

        await db.query(
            `UPDATE users 
            SET first_name = ?, last_name = ?, bio = ?, profile_picture = ?
            WHERE user_id = ?`,
            [firstName, lastName, bio, profilePicture, userId]
        );

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Update user password
router.put('/:userId/password', authenticateToken, authorizeUser, async (req, res) => {
    try {
        const { userId } = req.params;
        const { currentPassword, newPassword } = req.body;
        const bcrypt = require('bcrypt');

        // Get current password hash
        const [users] = await db.query(
            'SELECT password_hash FROM users WHERE user_id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify current password
        const validPassword = await bcrypt.compare(currentPassword, users[0].password_hash);
        if (!validPassword) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await db.query(
            'UPDATE users SET password_hash = ? WHERE user_id = ?',
            [hashedPassword, userId]
        );

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Update password error:', error);
        res.status(500).json({ error: 'Failed to update password' });
    }
});

// Get user activity feed
router.get('/:userId/activity', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 20 } = req.query;

        // Get recent reviews
        const [reviews] = await db.query(
            `SELECT 'review' as type, r.review_id as id, r.date_posted as date, 
                    m.title as movie_title, r.rating
            FROM reviews r
            JOIN movies m ON r.movie_id = m.movie_id
            WHERE r.user_id = ?
            ORDER BY r.date_posted DESC
            LIMIT ?`,
            [userId, parseInt(limit) / 4]
        );

        // Get recent discussion posts
        const [posts] = await db.query(
            `SELECT 'post' as type, dp.post_id as id, dp.date_posted as date,
                    m.title as movie_title, dp.title as post_title
            FROM discussion_posts dp
            JOIN movies m ON dp.movie_id = m.movie_id
            WHERE dp.user_id = ?
            ORDER BY dp.date_posted DESC
            LIMIT ?`,
            [userId, parseInt(limit) / 4]
        );

        // Get watchlist additions
        const [watchlist] = await db.query(
            `SELECT 'watchlist' as type, w.watchlist_id as id, w.added_date as date,
                    m.title as movie_title, w.status
            FROM watchlist w
            JOIN movies m ON w.movie_id = m.movie_id
            WHERE w.user_id = ?
            ORDER BY w.added_date DESC
            LIMIT ?`,
            [userId, parseInt(limit) / 4]
        );

        // Get events joined
        const [events] = await db.query(
            `SELECT 'event' as type, e.event_id as id, ep.joined_at as date,
                    m.title as movie_title, e.event_date
            FROM event_participants ep
            JOIN events e ON ep.event_id = e.event_id
            JOIN movies m ON e.movie_id = m.movie_id
            WHERE ep.user_id = ?
            ORDER BY ep.joined_at DESC
            LIMIT ?`,
            [userId, parseInt(limit) / 4]
        );

        // Combine and sort all activities
        const activities = [...reviews, ...posts, ...watchlist, ...events]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, parseInt(limit));

        res.json({ activities });
    } catch (error) {
        console.error('Get user activity error:', error);
        res.status(500).json({ error: 'Failed to fetch user activity' });
    }
});

// Get user notifications
router.get('/:userId/notifications', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;

        const [notifications] = await db.query(
            `SELECT * FROM notifications
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 50`,
            [userId]
        );

        res.json({ notifications });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// Mark notification as read
router.put('/notifications/:notificationId/read', authenticateToken, async (req, res) => {
    try {
        const { notificationId } = req.params;

        await db.query(
            'UPDATE notifications SET is_read = 1 WHERE notification_id = ?',
            [notificationId]
        );

        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

// Mark all notifications as read
router.put('/:userId/notifications/read-all', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;

        await db.query(
            'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
            [userId]
        );

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all notifications read error:', error);
        res.status(500).json({ error: 'Failed to mark notifications as read' });
    }
});

// Update user genre preferences
router.put('/:userId/genres', authenticateToken, authorizeUser, async (req, res) => {
    try {
        const { userId } = req.params;
        const { genreIds } = req.body; // Array of genre IDs

        // Delete existing preferences
        await db.query('DELETE FROM user_genre_preferences WHERE user_id = ?', [userId]);

        // Insert new preferences
        if (genreIds && genreIds.length > 0) {
            const values = genreIds.map(genreId => [userId, genreId]);
            await db.query(
                'INSERT INTO user_genre_preferences (user_id, genre_id) VALUES ?',
                [values]
            );
        }

        res.json({ message: 'Genre preferences updated successfully' });
    } catch (error) {
        console.error('Update genre preferences error:', error);
        res.status(500).json({ error: 'Failed to update genre preferences' });
    }
});

module.exports = router;
