const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get discussion posts for a movie
router.get('/movie/:movieId', async (req, res) => {
    try {
        const { movieId } = req.params;

        const [posts] = await db.query(
            `SELECT 
                dp.*, u.first_name, u.last_name,
                (SELECT COUNT(*) FROM discussion_likes WHERE post_id = dp.post_id) as like_count,
                (SELECT COUNT(*) FROM discussion_comments WHERE post_id = dp.post_id) as comment_count
            FROM discussion_posts dp
            JOIN users u ON dp.user_id = u.user_id
            WHERE dp.movie_id = ?
            ORDER BY dp.date_posted DESC`,
            [movieId]
        );

        res.json({ posts });
    } catch (error) {
        console.error('Get discussion posts error:', error);
        res.status(500).json({ error: 'Failed to fetch discussion posts' });
    }
});

// Get single post with comments
router.get('/posts/:postId', async (req, res) => {
    try {
        const { postId } = req.params;

        const [posts] = await db.query(
            `SELECT 
                dp.*, u.first_name, u.last_name, m.title as movie_title,
                (SELECT COUNT(*) FROM discussion_likes WHERE post_id = dp.post_id) as like_count
            FROM discussion_posts dp
            JOIN users u ON dp.user_id = u.user_id
            JOIN movies m ON dp.movie_id = m.movie_id
            WHERE dp.post_id = ?`,
            [postId]
        );

        if (posts.length === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const [comments] = await db.query(
            `SELECT 
                dc.*, u.first_name, u.last_name
            FROM discussion_comments dc
            JOIN users u ON dc.user_id = u.user_id
            WHERE dc.post_id = ?
            ORDER BY dc.date_commented ASC`,
            [postId]
        );

        res.json({ 
            post: posts[0],
            comments 
        });
    } catch (error) {
        console.error('Get post details error:', error);
        res.status(500).json({ error: 'Failed to fetch post details' });
    }
});

// Create discussion post
router.post('/posts', authenticateToken, async (req, res) => {
    try {
        const { userId, movieId, title, content } = req.body;

        if (!title || title.trim().length === 0) {
            return res.status(400).json({ error: 'Post title is required' });
        }

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Post content is required' });
        }

        const [result] = await db.query(
            `INSERT INTO discussion_posts (user_id, movie_id, title, content, date_posted)
            VALUES (?, ?, ?, ?, NOW())`,
            [userId, movieId, title, content]
        );

        res.status(201).json({ 
            message: 'Discussion post created successfully',
            postId: result.insertId
        });
    } catch (error) {
        console.error('Create discussion post error:', error);
        res.status(500).json({ error: 'Failed to create discussion post' });
    }
});

// Update discussion post
router.put('/posts/:postId', authenticateToken, async (req, res) => {
    try {
        const { postId } = req.params;
        const { title, content } = req.body;

        await db.query(
            'UPDATE discussion_posts SET title = ?, content = ?, last_modified = NOW() WHERE post_id = ?',
            [title, content, postId]
        );

        res.json({ message: 'Post updated successfully' });
    } catch (error) {
        console.error('Update post error:', error);
        res.status(500).json({ error: 'Failed to update post' });
    }
});

// Delete discussion post
router.delete('/posts/:postId', authenticateToken, async (req, res) => {
    try {
        const { postId } = req.params;

        // Delete comments first (foreign key)
        await db.query('DELETE FROM discussion_comments WHERE post_id = ?', [postId]);
        
        // Delete likes
        await db.query('DELETE FROM discussion_likes WHERE post_id = ?', [postId]);
        
        // Delete post
        await db.query('DELETE FROM discussion_posts WHERE post_id = ?', [postId]);

        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

// Like a post
router.post('/posts/:postId/like', authenticateToken, async (req, res) => {
    try {
        const { postId } = req.params;
        const { userId } = req.body;

        // Check if already liked
        const [existing] = await db.query(
            'SELECT * FROM discussion_likes WHERE user_id = ? AND post_id = ?',
            [userId, postId]
        );

        if (existing.length > 0) {
            // Unlike
            await db.query(
                'DELETE FROM discussion_likes WHERE user_id = ? AND post_id = ?',
                [userId, postId]
            );
            return res.json({ message: 'Post unliked' });
        }

        // Like
        await db.query(
            'INSERT INTO discussion_likes (user_id, post_id, date_liked) VALUES (?, ?, NOW())',
            [userId, postId]
        );

        // Create notification for post author
        const [post] = await db.query(
            'SELECT user_id FROM discussion_posts WHERE post_id = ?',
            [postId]
        );

        if (post.length > 0 && post[0].user_id !== userId) {
            await db.query(
                `INSERT INTO notifications (user_id, notification_type, content, related_id, created_at, is_read)
                VALUES (?, 'like', ?, ?, NOW(), 0)`,
                [post[0].user_id, `Someone liked your discussion post`, postId]
            );
        }

        res.json({ message: 'Post liked' });
    } catch (error) {
        console.error('Like post error:', error);
        res.status(500).json({ error: 'Failed to like post' });
    }
});

// Add comment to post
router.post('/posts/:postId/comments', authenticateToken, async (req, res) => {
    try {
        const { postId } = req.params;
        const { userId, commentText } = req.body;

        if (!commentText || commentText.trim().length === 0) {
            return res.status(400).json({ error: 'Comment cannot be empty' });
        }

        const [result] = await db.query(
            `INSERT INTO discussion_comments (post_id, user_id, comment_text, date_commented)
            VALUES (?, ?, ?, NOW())`,
            [postId, userId, commentText]
        );

        // Create notification for post author
        const [post] = await db.query(
            'SELECT user_id FROM discussion_posts WHERE post_id = ?',
            [postId]
        );

        if (post.length > 0 && post[0].user_id !== userId) {
            await db.query(
                `INSERT INTO notifications (user_id, notification_type, content, related_id, created_at, is_read)
                VALUES (?, 'comment', ?, ?, NOW(), 0)`,
                [post[0].user_id, `Someone commented on your discussion post`, result.insertId]
            );
        }

        res.status(201).json({ 
            message: 'Comment added successfully',
            commentId: result.insertId
        });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

// Update comment
router.put('/comments/:commentId', authenticateToken, async (req, res) => {
    try {
        const { commentId } = req.params;
        const { commentText } = req.body;

        await db.query(
            'UPDATE discussion_comments SET comment_text = ?, last_modified = NOW() WHERE comment_id = ?',
            [commentText, commentId]
        );

        res.json({ message: 'Comment updated successfully' });
    } catch (error) {
        console.error('Update comment error:', error);
        res.status(500).json({ error: 'Failed to update comment' });
    }
});

// Delete comment
router.delete('/comments/:commentId', authenticateToken, async (req, res) => {
    try {
        const { commentId } = req.params;

        await db.query('DELETE FROM discussion_comments WHERE comment_id = ?', [commentId]);

        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ error: 'Failed to delete comment' });
    }
});

module.exports = router;
