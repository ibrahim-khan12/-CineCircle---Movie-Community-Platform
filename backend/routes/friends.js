const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get user's friends
router.get('/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.query; // pending, accepted

        let query = `
            SELECT 
                f.friendship_id, f.status, f.created_at,
                CASE 
                    WHEN f.user_id_1 = ? THEN f.user_id_2 
                    ELSE f.user_id_1 
                END as friend_id,
                u.first_name, u.last_name, u.email
            FROM friendships f
            JOIN users u ON u.user_id = CASE 
                WHEN f.user_id_1 = ? THEN f.user_id_2 
                ELSE f.user_id_1 
            END
            WHERE (f.user_id_1 = ? OR f.user_id_2 = ?)
        `;
        const params = [userId, userId, userId, userId];

        if (status) {
            query += ' AND f.status = ?';
            params.push(status);
        }

        query += ' ORDER BY f.created_at DESC';

        const [friends] = await db.query(query, params);
        res.json({ friends });
    } catch (error) {
        console.error('Get friends error:', error);
        res.status(500).json({ error: 'Failed to fetch friends' });
    }
});

// Get pending friend requests for a user
router.get('/:userId/requests', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;

        // Get requests sent to this user
        const [requests] = await db.query(
            `SELECT 
                f.friendship_id, f.user_id_1 as requester_id, f.created_at,
                u.first_name, u.last_name, u.email
            FROM friendships f
            JOIN users u ON f.user_id_1 = u.user_id
            WHERE f.user_id_2 = ? AND f.status = 'pending'
            ORDER BY f.created_at DESC`,
            [userId]
        );

        res.json({ requests });
    } catch (error) {
        console.error('Get friend requests error:', error);
        res.status(500).json({ error: 'Failed to fetch friend requests' });
    }
});

// Send friend request
router.post('/request', authenticateToken, async (req, res) => {
    try {
        const { userId1, userId2 } = req.body;

        if (userId1 === userId2) {
            return res.status(400).json({ error: 'Cannot send friend request to yourself' });
        }

        // Check if friendship already exists
        const [existing] = await db.query(
            `SELECT * FROM friendships 
            WHERE (user_id_1 = ? AND user_id_2 = ?) 
               OR (user_id_1 = ? AND user_id_2 = ?)`,
            [userId1, userId2, userId2, userId1]
        );

        if (existing.length > 0) {
            if (existing[0].status === 'pending') {
                return res.status(400).json({ error: 'Friend request already sent' });
            }
            return res.status(400).json({ error: 'Already friends' });
        }

        const [result] = await db.query(
            'INSERT INTO friendships (user_id_1, user_id_2, status, created_at) VALUES (?, ?, ?, NOW())',
            [userId1, userId2, 'pending']
        );

        // Create notification for receiver
        await db.query(
            `INSERT INTO notifications (user_id, notification_type, content, related_id, created_at, is_read)
            VALUES (?, 'friend_request', ?, ?, NOW(), 0)`,
            [userId2, `New friend request from user ${userId1}`, result.insertId]
        );

        res.status(201).json({ 
            message: 'Friend request sent',
            friendshipId: result.insertId
        });
    } catch (error) {
        console.error('Send friend request error:', error);
        res.status(500).json({ error: 'Failed to send friend request' });
    }
});

// Accept friend request
router.put('/:friendshipId/accept', authenticateToken, async (req, res) => {
    try {
        const { friendshipId } = req.params;

        await db.query(
            'UPDATE friendships SET status = ? WHERE friendship_id = ?',
            ['accepted', friendshipId]
        );

        // Get the requester to send notification
        const [friendship] = await db.query(
            'SELECT user_id_1 FROM friendships WHERE friendship_id = ?',
            [friendshipId]
        );

        if (friendship.length > 0) {
            await db.query(
                `INSERT INTO notifications (user_id, notification_type, content, related_id, created_at, is_read)
                VALUES (?, 'friend_accept', ?, ?, NOW(), 0)`,
                [friendship[0].user_id_1, 'Your friend request was accepted', friendshipId]
            );
        }

        res.json({ message: 'Friend request accepted' });
    } catch (error) {
        console.error('Accept friend request error:', error);
        res.status(500).json({ error: 'Failed to accept friend request' });
    }
});

// Decline friend request
router.put('/:friendshipId/decline', authenticateToken, async (req, res) => {
    try {
        const { friendshipId } = req.params;

        await db.query('DELETE FROM friendships WHERE friendship_id = ?', [friendshipId]);

        res.json({ message: 'Friend request declined' });
    } catch (error) {
        console.error('Decline friend request error:', error);
        res.status(500).json({ error: 'Failed to decline friend request' });
    }
});

// Unfriend / Remove friend
router.delete('/:friendshipId', authenticateToken, async (req, res) => {
    try {
        const { friendshipId } = req.params;

        await db.query('DELETE FROM friendships WHERE friendship_id = ?', [friendshipId]);

        res.json({ message: 'Friend removed successfully' });
    } catch (error) {
        console.error('Unfriend error:', error);
        res.status(500).json({ error: 'Failed to remove friend' });
    }
});

// Search users (for finding friends)
router.get('/search/users', authenticateToken, async (req, res) => {
    try {
        const { query, currentUserId } = req.query;

        if (!query || query.trim().length === 0) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        const [users] = await db.query(
            `SELECT user_id, first_name, last_name, email
            FROM users
            WHERE user_id != ? 
              AND role = 'user'
              AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)
            LIMIT 20`,
            [currentUserId, `%${query}%`, `%${query}%`, `%${query}%`]
        );

        res.json({ users });
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ error: 'Failed to search users' });
    }
});

module.exports = router;
