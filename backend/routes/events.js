const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get all events with filters
router.get('/', async (req, res) => {
    try {
        const { status, hostId, movieId } = req.query;

        let query = `
            SELECT 
                e.*, m.title as movie_title,
                u.first_name as host_first_name, u.last_name as host_last_name,
                (SELECT COUNT(*) FROM event_participants WHERE event_id = e.event_id) as participant_count
            FROM events e
            JOIN movies m ON e.movie_id = m.movie_id
            JOIN users u ON e.host_id = u.user_id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            query += ' AND e.status = ?';
            params.push(status);
        }

        if (hostId) {
            query += ' AND e.host_id = ?';
            params.push(hostId);
        }

        if (movieId) {
            query += ' AND e.movie_id = ?';
            params.push(movieId);
        }

        query += ' ORDER BY e.event_date DESC';

        const [events] = await db.query(query, params);
        res.json({ events });
    } catch (error) {
        console.error('Get events error:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// Get event details with participants
router.get('/:eventId', async (req, res) => {
    try {
        const { eventId } = req.params;

        const [events] = await db.query(
            `SELECT 
                e.*, m.title as movie_title, m.poster_url, m.duration,
                u.first_name as host_first_name, u.last_name as host_last_name
            FROM events e
            JOIN movies m ON e.movie_id = m.movie_id
            JOIN users u ON e.host_id = u.user_id
            WHERE e.event_id = ?`,
            [eventId]
        );

        if (events.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const [participants] = await db.query(
            `SELECT 
                ep.*, u.first_name, u.last_name
            FROM event_participants ep
            JOIN users u ON ep.user_id = u.user_id
            WHERE ep.event_id = ?
            ORDER BY ep.joined_at`,
            [eventId]
        );

        res.json({ 
            event: events[0],
            participants 
        });
    } catch (error) {
        console.error('Get event details error:', error);
        res.status(500).json({ error: 'Failed to fetch event details' });
    }
});

// Create event
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { hostId, movieId, eventDate, maxParticipants, location, description } = req.body;

        // Check if host already has an event at the same time
        const [overlap] = await db.query(
            `SELECT event_id FROM events 
            WHERE host_id = ? AND event_date = ? AND status = 'scheduled'`,
            [hostId, eventDate]
        );

        if (overlap.length > 0) {
            return res.status(400).json({ error: 'You already have an event scheduled at this time' });
        }

        const [result] = await db.query(
            `INSERT INTO events (host_id, movie_id, event_date, max_participants, location, description, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 'scheduled', NOW())`,
            [hostId, movieId, eventDate, maxParticipants, location, description]
        );

        // Automatically add host as participant
        await db.query(
            `INSERT INTO event_participants (event_id, user_id, joined_at, rsvp_status)
            VALUES (?, ?, NOW(), 'attending')`,
            [result.insertId, hostId]
        );

        res.status(201).json({ 
            message: 'Event created successfully',
            eventId: result.insertId
        });
    } catch (error) {
        console.error('Create event error:', error);
        res.status(500).json({ error: 'Failed to create event' });
    }
});

// Join event
router.post('/:eventId/join', authenticateToken, async (req, res) => {
    try {
        const { eventId } = req.params;
        const { userId } = req.body;

        // Check if user already joined
        const [existing] = await db.query(
            'SELECT * FROM event_participants WHERE event_id = ? AND user_id = ?',
            [eventId, userId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'You have already joined this event' });
        }

        // Check if event is full
        const [event] = await db.query(
            `SELECT max_participants,
                (SELECT COUNT(*) FROM event_participants WHERE event_id = ?) as current_count
            FROM events WHERE event_id = ?`,
            [eventId, eventId]
        );

        if (event.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        if (event[0].current_count >= event[0].max_participants) {
            return res.status(400).json({ error: 'Event is full' });
        }

        await db.query(
            `INSERT INTO event_participants (event_id, user_id, joined_at, rsvp_status)
            VALUES (?, ?, NOW(), 'attending')`,
            [eventId, userId]
        );

        res.json({ message: 'Successfully joined event' });
    } catch (error) {
        console.error('Join event error:', error);
        res.status(500).json({ error: 'Failed to join event' });
    }
});

// Update event
router.put('/:eventId', authenticateToken, async (req, res) => {
    try {
        const { eventId } = req.params;
        const { eventDate, maxParticipants, location, description, status } = req.body;

        await db.query(
            `UPDATE events 
            SET event_date = ?, max_participants = ?, location = ?, description = ?, status = ?
            WHERE event_id = ?`,
            [eventDate, maxParticipants, location, description, status, eventId]
        );

        res.json({ message: 'Event updated successfully' });
    } catch (error) {
        console.error('Update event error:', error);
        res.status(500).json({ error: 'Failed to update event' });
    }
});

// Cancel/Delete event
router.delete('/:eventId', authenticateToken, async (req, res) => {
    try {
        const { eventId } = req.params;

        // Delete participants first (foreign key constraint)
        await db.query('DELETE FROM event_participants WHERE event_id = ?', [eventId]);
        
        // Delete event
        await db.query('DELETE FROM events WHERE event_id = ?', [eventId]);

        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Delete event error:', error);
        res.status(500).json({ error: 'Failed to delete event' });
    }
});

// Leave event
router.delete('/:eventId/leave', authenticateToken, async (req, res) => {
    try {
        const { eventId } = req.params;
        const { userId } = req.body;

        // Check if user is the host
        const [event] = await db.query(
            'SELECT host_id FROM events WHERE event_id = ?',
            [eventId]
        );

        if (event.length > 0 && event[0].host_id === userId) {
            return res.status(400).json({ error: 'Host cannot leave the event. Cancel the event instead.' });
        }

        await db.query(
            'DELETE FROM event_participants WHERE event_id = ? AND user_id = ?',
            [eventId, userId]
        );

        res.json({ message: 'Left event successfully' });
    } catch (error) {
        console.error('Leave event error:', error);
        res.status(500).json({ error: 'Failed to leave event' });
    }
});

module.exports = router;
