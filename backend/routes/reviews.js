const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get reviews for a movie
router.get('/movie/:movieId', async (req, res) => {
    try {
        const { movieId } = req.params;

        const [reviews] = await db.query(
            `SELECT 
                r.*, u.first_name, u.last_name,
                (SELECT COUNT(*) FROM review_likes WHERE review_id = r.review_id) as like_count
            FROM reviews r
            JOIN users u ON r.user_id = u.user_id
            WHERE r.movie_id = ?
            ORDER BY r.date_posted DESC`,
            [movieId]
        );

        res.json({ reviews });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

// Add review
router.post('/', authenticateToken, async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { userId, movieId, rating, reviewText } = req.body;

        if (!rating || rating < 1 || rating > 10) {
            return res.status(400).json({ error: 'Rating must be between 1 and 10' });
        }

        // Check if user already reviewed this movie
        const [existing] = await connection.query(
            'SELECT review_id FROM reviews WHERE user_id = ? AND movie_id = ?',
            [userId, movieId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'You have already reviewed this movie' });
        }

        await connection.beginTransaction();

        // Insert review
        const [result] = await connection.query(
            'INSERT INTO reviews (user_id, movie_id, rating, review_text, date_posted) VALUES (?, ?, ?, ?, NOW())',
            [userId, movieId, rating, reviewText]
        );

        // Update movie average rating using stored procedure
        await connection.query('CALL update_movie_rating(?)', [movieId]);

        await connection.commit();

        res.status(201).json({ 
            message: 'Review added successfully',
            reviewId: result.insertId
        });
    } catch (error) {
        await connection.rollback();
        console.error('Add review error:', error);
        res.status(500).json({ error: 'Failed to add review' });
    } finally {
        connection.release();
    }
});

// Update review
router.put('/:reviewId', authenticateToken, async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { reviewId } = req.params;
        const { rating, reviewText } = req.body;

        await connection.beginTransaction();

        // Get movie_id for this review
        const [reviews] = await connection.query(
            'SELECT movie_id FROM reviews WHERE review_id = ?',
            [reviewId]
        );

        if (reviews.length === 0) {
            return res.status(404).json({ error: 'Review not found' });
        }

        await connection.query(
            'UPDATE reviews SET rating = ?, review_text = ?, last_modified = NOW() WHERE review_id = ?',
            [rating, reviewText, reviewId]
        );

        // Update movie rating
        await connection.query('CALL update_movie_rating(?)', [reviews[0].movie_id]);

        await connection.commit();

        res.json({ message: 'Review updated successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Update review error:', error);
        res.status(500).json({ error: 'Failed to update review' });
    } finally {
        connection.release();
    }
});

// Delete review
router.delete('/:reviewId', authenticateToken, async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { reviewId } = req.params;

        await connection.beginTransaction();

        const [reviews] = await connection.query(
            'SELECT movie_id FROM reviews WHERE review_id = ?',
            [reviewId]
        );

        if (reviews.length === 0) {
            return res.status(404).json({ error: 'Review not found' });
        }

        await connection.query('DELETE FROM reviews WHERE review_id = ?', [reviewId]);

        // Update movie rating
        await connection.query('CALL update_movie_rating(?)', [reviews[0].movie_id]);

        await connection.commit();

        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Delete review error:', error);
        res.status(500).json({ error: 'Failed to delete review' });
    } finally {
        connection.release();
    }
});

// Like a review
router.post('/:reviewId/like', authenticateToken, async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { userId } = req.body;

        // Check if already liked
        const [existing] = await db.query(
            'SELECT * FROM review_likes WHERE user_id = ? AND review_id = ?',
            [userId, reviewId]
        );

        if (existing.length > 0) {
            // Unlike
            await db.query(
                'DELETE FROM review_likes WHERE user_id = ? AND review_id = ?',
                [userId, reviewId]
            );
            return res.json({ message: 'Review unliked' });
        }

        // Like
        await db.query(
            'INSERT INTO review_likes (user_id, review_id, date_liked) VALUES (?, ?, NOW())',
            [userId, reviewId]
        );

        res.json({ message: 'Review liked' });
    } catch (error) {
        console.error('Like review error:', error);
        res.status(500).json({ error: 'Failed to like review' });
    }
});

module.exports = router;
