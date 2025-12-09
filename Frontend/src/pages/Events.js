import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { eventService } from '../services';
import './Events.css';

const Events = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await eventService.getEvents({ status: 'scheduled' });
      console.log('Events data:', data);
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error loading events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinEvent = async (eventId) => {
    if (!user) {
      alert('Please login to join events');
      return;
    }
    
    try {
      await eventService.joinEvent(eventId);
      alert('Successfully joined the event!');
      loadEvents();
    } catch (error) {
      console.error('Error joining event:', error);
      const errorMsg = error.response?.data?.error || 'Failed to join event';
      alert(errorMsg);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="events-page">
      <div className="container">
        <h1>Movie Events & Watch Parties</h1>

        <div className="events-header">
          <p>Join community watch parties and movie events</p>
        </div>

        {loading ? (
          <div className="loading">Loading events...</div>
        ) : events.length > 0 ? (
          <div className="events-grid">
            {events.map(event => (
              <div key={event.event_id} className="event-card">
                <div className="event-movie-title">
                  <span className="movie-icon">🎬</span>
                  <h3>{event.movie_title}</h3>
                </div>
                <div className="event-details">
                  <p className="event-date">
                    <strong>📅 Date:</strong> {formatDate(event.event_date)}
                  </p>
                  <p className="event-location">
                    <strong>📍 Location:</strong> {event.location}
                  </p>
                  <p className="event-host">
                    <strong>👤 Host:</strong> {event.host_first_name} {event.host_last_name}
                  </p>
                  <p className="event-participants">
                    <strong>👥 Participants:</strong> {event.participant_count} / {event.max_participants}
                  </p>
                </div>
                <p className="event-description">{event.description}</p>
                <button 
                  className="btn-join"
                  onClick={() => handleJoinEvent(event.event_id)}
                  disabled={!user || event.participant_count >= event.max_participants}
                >
                  {!user ? 'Login to Join' : event.participant_count >= event.max_participants ? 'Event Full' : 'Join Event'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No upcoming events</p>
            <p className="subtitle">Check back later for new watch parties!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
