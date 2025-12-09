const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, authorizeUser } = require('../middleware/auth');

// Get user's watchlist
router.get('/:userId', authenticateToken, authorizeUser, async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.query;

        console.log('Getting watchlist for user:', userId, 'status filter:', status);

        let query = `
            SELECT 
                w.*, m.title, m.release_year, m.duration, 
                m.poster_url, m.average_rating,
                GROUP_CONCAT(DISTINCT g.genre_name) as genres
            FROM watchlist w
            JOIN movies m ON w.movie_id = m.movie_id
            LEFT JOIN movie_genres mg ON m.movie_id = mg.movie_id
            LEFT JOIN genres g ON mg.genre_id = g.genre_id
            WHERE w.user_id = ?
        `;

        const params = [userId];

        if (status) {
            query += ' AND w.status = ?';
            params.push(status);
        }

        query += ' GROUP BY w.watchlist_id ORDER BY w.added_date DESC';

        const [watchlist] = await db.query(query, params);
        console.log('Watchlist found:', watchlist.length, 'items');
        res.json(watchlist);
    } catch (error) {
        console.error('Get watchlist error:', error);
        res.status(500).json({ error: 'Failed to fetch watchlist' });
    }
});

// Add movie to watchlist
router.post('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { movie_id, status = 'to-watch' } = req.body;

        // Check if already in watchlist
        const [existing] = await db.query(
            'SELECT watchlist_id FROM watchlist WHERE user_id = ? AND movie_id = ?',
            [userId, movie_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Movie already in watchlist' });
        }

        await db.query(
            'INSERT INTO watchlist (user_id, movie_id, status, added_date) VALUES (?, ?, ?, NOW())',
            [userId, movie_id, status]
        );

        res.status(201).json({ message: 'Movie added to watchlist' });
    } catch (error) {
        console.error('Add to watchlist error:', error);
        res.status(500).json({ error: 'Failed to add to watchlist' });
    }
});

// Update watchlist status
router.put('/:watchlistId', authenticateToken, async (req, res) => {
    try {
        const { watchlistId } = req.params;
        const { status } = req.body;

        await db.query(
            'UPDATE watchlist SET status = ? WHERE watchlist_id = ?',
            [status, watchlistId]
        );

        // If marked as completed, increment view count
        if (status === 'completed') {
            const [watchlist] = await db.query(
                'SELECT movie_id FROM watchlist WHERE watchlist_id = ?',
                [watchlistId]
            );
            if (watchlist.length > 0) {
                await db.query(
                    'UPDATE movies SET view_count = view_count + 1 WHERE movie_id = ?',
                    [watchlist[0].movie_id]
                );
            }
        }

        res.json({ message: 'Watchlist updated successfully' });
    } catch (error) {
        console.error('Update watchlist error:', error);
        res.status(500).json({ error: 'Failed to update watchlist' });
    }
});

// Remove from watchlist
router.delete('/:watchlistId', authenticateToken, async (req, res) => {
    try {
        const { watchlistId } = req.params;

        await db.query('DELETE FROM watchlist WHERE watchlist_id = ?', [watchlistId]);

        res.json({ message: 'Removed from watchlist' });
    } catch (error) {
        console.error('Remove from watchlist error:', error);
        res.status(500).json({ error: 'Failed to remove from watchlist' });
    }
});

module.exports = router;
