const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get user conversations
router.get('/conversations/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;

        const [conversations] = await db.query(
            `SELECT 
                CASE 
                    WHEN sender_id = ? THEN receiver_id 
                    ELSE sender_id 
                END as other_user_id,
                u.first_name, u.last_name,
                MAX(m.sent_at) as last_message_time,
                (SELECT message_text FROM messages m2 
                 WHERE (m2.sender_id = ? AND m2.receiver_id = other_user_id) 
                    OR (m2.sender_id = other_user_id AND m2.receiver_id = ?)
                 ORDER BY m2.sent_at DESC LIMIT 1) as last_message,
                COUNT(CASE WHEN m.receiver_id = ? AND m.read_status = 'unread' THEN 1 END) as unread_count
            FROM messages m
            JOIN users u ON u.user_id = CASE 
                WHEN m.sender_id = ? THEN m.receiver_id 
                ELSE m.sender_id 
            END
            WHERE m.sender_id = ? OR m.receiver_id = ?
            GROUP BY other_user_id, u.first_name, u.last_name
            ORDER BY last_message_time DESC`,
            [userId, userId, userId, userId, userId, userId, userId]
        );

        res.json({ conversations });
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
});

// Get messages between two users
router.get('/messages', authenticateToken, async (req, res) => {
    try {
        const { userId1, userId2 } = req.query;

        const [messages] = await db.query(
            `SELECT 
                m.*, 
                u1.first_name as sender_first_name, u1.last_name as sender_last_name,
                u2.first_name as receiver_first_name, u2.last_name as receiver_last_name
            FROM messages m
            JOIN users u1 ON m.sender_id = u1.user_id
            JOIN users u2 ON m.receiver_id = u2.user_id
            WHERE (m.sender_id = ? AND m.receiver_id = ?) 
               OR (m.sender_id = ? AND m.receiver_id = ?)
            ORDER BY m.sent_at ASC`,
            [userId1, userId2, userId2, userId1]
        );

        res.json({ messages });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Send message
router.post('/messages', authenticateToken, async (req, res) => {
    try {
        const { senderId, receiverId, messageText } = req.body;

        if (!messageText || messageText.trim().length === 0) {
            return res.status(400).json({ error: 'Message cannot be empty' });
        }

        const [result] = await db.query(
            `INSERT INTO messages (sender_id, receiver_id, message_text, sent_at, read_status)
            VALUES (?, ?, ?, NOW(), 'unread')`,
            [senderId, receiverId, messageText]
        );

        // Create notification for receiver
        await db.query(
            `INSERT INTO notifications (user_id, notification_type, content, related_id, created_at, is_read)
            VALUES (?, 'message', ?, ?, NOW(), 0)`,
            [receiverId, `New message from user ${senderId}`, result.insertId]
        );

        res.status(201).json({ 
            message: 'Message sent successfully',
            messageId: result.insertId
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Mark message as read
router.put('/messages/:messageId/read', authenticateToken, async (req, res) => {
    try {
        const { messageId } = req.params;

        await db.query(
            'UPDATE messages SET read_status = ?, read_at = NOW() WHERE message_id = ?',
            ['read', messageId]
        );

        res.json({ message: 'Message marked as read' });
    } catch (error) {
        console.error('Mark message read error:', error);
        res.status(500).json({ error: 'Failed to mark message as read' });
    }
});

// Mark all messages from a user as read
router.put('/conversations/:userId/read', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params; // other user
        const { currentUserId } = req.body; // logged in user

        await db.query(
            `UPDATE messages 
            SET read_status = 'read', read_at = NOW() 
            WHERE sender_id = ? AND receiver_id = ? AND read_status = 'unread'`,
            [userId, currentUserId]
        );

        res.json({ message: 'All messages marked as read' });
    } catch (error) {
        console.error('Mark all messages read error:', error);
        res.status(500).json({ error: 'Failed to mark messages as read' });
    }
});

// Delete message
router.delete('/messages/:messageId', authenticateToken, async (req, res) => {
    try {
        const { messageId } = req.params;

        await db.query('DELETE FROM messages WHERE message_id = ?', [messageId]);

        res.json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ error: 'Failed to delete message' });
    }
});

module.exports = router;
