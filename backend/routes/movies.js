const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, authenticateAdmin } = require('../middleware/auth');

// Get all movies with filters and pagination
router.get('/', async (req, res) => {
    try {
        const { search, genre, year, page = 1, limit = 12 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT DISTINCT 
                m.movie_id, m.title, m.description, m.release_year, 
                m.duration, m.director, m.poster_url,
                m.average_rating, m.view_count,
                GROUP_CONCAT(DISTINCT g.genre_name) as genres
            FROM movies m
            LEFT JOIN movie_genres mg ON m.movie_id = mg.movie_id
            LEFT JOIN genres g ON mg.genre_id = g.genre_id
            WHERE 1=1
        `;

        const params = [];

        if (search) {
            query += ' AND (m.title LIKE ? OR m.description LIKE ? OR m.director LIKE ?)';
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam);
        }

        if (genre) {
            query += ' AND g.genre_id = ?';
            params.push(genre);
        }

        if (year) {
            query += ' AND m.release_year = ?';
            params.push(year);
        }

        query += ' GROUP BY m.movie_id ORDER BY m.average_rating DESC, m.view_count DESC';
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [movies] = await db.query(query, params);

        // Get total count for pagination
        let countQuery = 'SELECT COUNT(DISTINCT m.movie_id) as total FROM movies m';
        if (genre) {
            countQuery += ' JOIN movie_genres mg ON m.movie_id = mg.movie_id WHERE mg.genre_id = ?';
        }
        
        const [countResult] = await db.query(
            countQuery,
            genre ? [genre] : []
        );

        res.json({
            movies: movies,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult[0].total,
                pages: Math.ceil(countResult[0].total / limit)
            }
        });
    } catch (error) {
        console.error('Get movies error:', error);
        res.status(500).json({ error: 'Failed to fetch movies' });
    }
});

// Get single movie with details
router.get('/:movieId', async (req, res) => {
    try {
        const { movieId } = req.params;

        // Get movie details
        const [movies] = await db.query(
            `SELECT 
                m.*,
                GROUP_CONCAT(DISTINCT g.genre_name) as genres,
                GROUP_CONCAT(DISTINCT g.genre_id) as genre_ids
            FROM movies m
            LEFT JOIN movie_genres mg ON m.movie_id = mg.movie_id
            LEFT JOIN genres g ON mg.genre_id = g.genre_id
            WHERE m.movie_id = ?
            GROUP BY m.movie_id`,
            [movieId]
        );

        if (movies.length === 0) {
            return res.status(404).json({ error: 'Movie not found' });
        }

        // Get reviews for this movie
        const [reviews] = await db.query(
            `SELECT 
                r.review_id, r.rating, r.review_text, r.date_posted,
                u.user_id, u.first_name, u.last_name,
                (SELECT COUNT(*) FROM review_likes WHERE review_id = r.review_id) as like_count
            FROM reviews r
            JOIN users u ON r.user_id = u.user_id
            WHERE r.movie_id = ?
            ORDER BY r.date_posted DESC`,
            [movieId]
        );

        res.json({
            movie: movies[0],
            reviews: reviews
        });
    } catch (error) {
        console.error('Get movie error:', error);
        res.status(500).json({ error: 'Failed to fetch movie details' });
    }
});

// Get trending movies
router.get('/trending/top', async (req, res) => {
    try {
        const [movies] = await db.query(
            `SELECT 
                m.movie_id, m.title, m.release_year, m.view_count, m.average_rating, m.poster_url,
                GROUP_CONCAT(DISTINCT g.genre_name) as genres
            FROM movies m
            LEFT JOIN movie_genres mg ON m.movie_id = mg.movie_id
            LEFT JOIN genres g ON mg.genre_id = g.genre_id
            GROUP BY m.movie_id
            ORDER BY m.view_count DESC
            LIMIT 10`
        );

        res.json(movies);
    } catch (error) {
        console.error('Get trending movies error:', error);
        res.status(500).json({ error: 'Failed to fetch trending movies' });
    }
});

// Get recommended movies (top rated)
router.get('/recommendations/top', authenticateToken, async (req, res) => {
    try {
        const [movies] = await db.query(
            `SELECT 
                m.movie_id, m.title, m.release_year, m.average_rating, m.poster_url,
                GROUP_CONCAT(DISTINCT g.genre_name) as genres
            FROM movies m
            LEFT JOIN movie_genres mg ON m.movie_id = mg.movie_id
            LEFT JOIN genres g ON mg.genre_id = g.genre_id
            GROUP BY m.movie_id
            ORDER BY m.average_rating DESC
            LIMIT 10`
        );

        res.json(movies);
    } catch (error) {
        console.error('Get recommendations error:', error);
        res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
});

// Admin: Add new movie
router.post('/', authenticateAdmin, async (req, res) => {
    try {
        const { title, description, releaseYear, duration, director, posterUrl, genres } = req.body;

        if (!title || !description || !releaseYear || !director) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Insert movie
        const [result] = await db.query(
            `INSERT INTO movies 
            (title, description, release_year, duration, director, poster_url)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [title, description, releaseYear, duration, director, posterUrl]
        );

        const movieId = result.insertId;

        // Insert movie genres
        if (genres && Array.isArray(genres) && genres.length > 0) {
            const genreValues = genres.map(genreId => [movieId, genreId]);
            await db.query(
                'INSERT INTO movie_genres (movie_id, genre_id) VALUES ?',
                [genreValues]
            );
        }

        // Log admin action
        await db.query(
            `INSERT INTO audit_log 
            (admin_id, action_type, target_table, target_id, description, ip_address, timestamp)
            VALUES (?, 'INSERT', 'movies', ?, ?, ?, NOW())`,
            [req.user.adminId, movieId, `Added new movie: ${title}`, req.ip]
        );

        res.status(201).json({ 
            message: 'Movie added successfully',
            movieId: movieId
        });
    } catch (error) {
        console.error('Add movie error:', error);
        res.status(500).json({ error: 'Failed to add movie' });
    }
});

// Admin: Update movie
router.put('/:movieId', authenticateAdmin, async (req, res) => {
    try {
        const { movieId } = req.params;
        const { title, synopsis, releaseYear, duration, director, posterUrl, genres } = req.body;

        await db.query(
            `UPDATE movies SET 
            title = ?, synopsis = ?, release_year = ?, 
            duration_minutes = ?, director = ?, poster_url = ?
            WHERE movie_id = ?`,
            [title, synopsis, releaseYear, duration, director, posterUrl, movieId]
        );

        // Update genres
        if (genres && Array.isArray(genres)) {
            await db.query('DELETE FROM movie_genres WHERE movie_id = ?', [movieId]);
            if (genres.length > 0) {
                const genreValues = genres.map(genreId => [movieId, genreId]);
                await db.query(
                    'INSERT INTO movie_genres (movie_id, genre_id) VALUES ?',
                    [genreValues]
                );
            }
        }

        // Log admin action
        await db.query(
            `INSERT INTO audit_log 
            (admin_id, action_type, target_table, target_id, description, ip_address, timestamp)
            VALUES (?, 'UPDATE', 'movies', ?, ?, ?, NOW())`,
            [req.user.adminId, movieId, `Updated movie: ${title}`, req.ip]
        );

        res.json({ message: 'Movie updated successfully' });
    } catch (error) {
        console.error('Update movie error:', error);
        res.status(500).json({ error: 'Failed to update movie' });
    }
});

// Admin: Delete movie
router.delete('/:movieId', authenticateAdmin, async (req, res) => {
    try {
        const { movieId } = req.params;

        // Get movie title for logging
        const [movies] = await db.query('SELECT title FROM movies WHERE movie_id = ?', [movieId]);
        const movieTitle = movies[0]?.title || 'Unknown';

        await db.query('DELETE FROM movies WHERE movie_id = ?', [movieId]);

        // Log admin action
        await db.query(
            `INSERT INTO audit_log 
            (admin_id, action_type, target_table, target_id, description, ip_address, timestamp)
            VALUES (?, 'DELETE', 'movies', ?, ?, ?, NOW())`,
            [req.user.adminId, movieId, `Deleted movie: ${movieTitle}`, req.ip]
        );

        res.json({ message: 'Movie deleted successfully' });
    } catch (error) {
        console.error('Delete movie error:', error);
        res.status(500).json({ error: 'Failed to delete movie' });
    }
});

module.exports = router;
