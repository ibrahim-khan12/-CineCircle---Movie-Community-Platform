-- Movie Community Management System Database
-- Complete SQL Script with Schema, Triggers, Procedures, and Sample Data

-- Drop existing database if exists
DROP DATABASE IF EXISTS movie_community_db;
CREATE DATABASE movie_community_db;
USE movie_community_db;

-- ============================================
-- TABLE DEFINITIONS
-- ============================================

-- Users table
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    date_joined DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    bio TEXT,
    profile_picture VARCHAR(255),
    role ENUM('user', 'admin') DEFAULT 'user',
    is_suspended BOOLEAN DEFAULT FALSE,
    admin_access_code VARCHAR(50),
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB;

-- Movies table
CREATE TABLE movies (
    movie_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    release_year INT,
    description TEXT,
    director VARCHAR(100),
    duration INT,
    poster_url VARCHAR(255),
    trailer_url VARCHAR(255),
    view_count INT DEFAULT 0,
    average_rating DECIMAL(3,1) DEFAULT 0.0,
    INDEX idx_title (title),
    INDEX idx_year (release_year),
    INDEX idx_rating (average_rating)
) ENGINE=InnoDB;

-- Genres table
CREATE TABLE genres (
    genre_id INT AUTO_INCREMENT PRIMARY KEY,
    genre_name VARCHAR(50) UNIQUE NOT NULL
) ENGINE=InnoDB;

-- Movie-Genre relationship (Many-to-Many)
CREATE TABLE movie_genres (
    movie_id INT,
    genre_id INT,
    PRIMARY KEY (movie_id, genre_id),
    FOREIGN KEY (movie_id) REFERENCES movies(movie_id) ON DELETE CASCADE,
    FOREIGN KEY (genre_id) REFERENCES genres(genre_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- User Genre Preferences
CREATE TABLE user_genre_preferences (
    user_id INT,
    genre_id INT,
    PRIMARY KEY (user_id, genre_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (genre_id) REFERENCES genres(genre_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Watchlist table
CREATE TABLE watchlist (
    watchlist_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    movie_id INT NOT NULL,
    added_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('to-watch', 'watching', 'completed') DEFAULT 'to-watch',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (movie_id) REFERENCES movies(movie_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_movie (user_id, movie_id),
    INDEX idx_user (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- Reviews table
CREATE TABLE reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    movie_id INT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 10),
    review_text TEXT,
    date_posted DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_modified DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (movie_id) REFERENCES movies(movie_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_review (user_id, movie_id),
    INDEX idx_movie (movie_id),
    INDEX idx_rating (rating)
) ENGINE=InnoDB;

-- Review Likes table
CREATE TABLE review_likes (
    user_id INT,
    review_id INT,
    date_liked DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, review_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (review_id) REFERENCES reviews(review_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Discussion Posts table
CREATE TABLE discussion_posts (
    post_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    movie_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    date_posted DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_modified DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (movie_id) REFERENCES movies(movie_id) ON DELETE CASCADE,
    INDEX idx_movie (movie_id),
    INDEX idx_date (date_posted)
) ENGINE=InnoDB;

-- Discussion Comments table
CREATE TABLE discussion_comments (
    comment_id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    comment_text TEXT NOT NULL,
    date_commented DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_modified DATETIME,
    FOREIGN KEY (post_id) REFERENCES discussion_posts(post_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_post (post_id)
) ENGINE=InnoDB;

-- Discussion Likes table
CREATE TABLE discussion_likes (
    user_id INT,
    post_id INT,
    date_liked DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES discussion_posts(post_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Events (Watch Parties) table
CREATE TABLE events (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    host_id INT NOT NULL,
    movie_id INT NOT NULL,
    event_date DATETIME NOT NULL,
    location VARCHAR(255),
    max_participants INT DEFAULT 10,
    description TEXT,
    status ENUM('scheduled', 'ongoing', 'completed', 'cancelled') DEFAULT 'scheduled',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (host_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (movie_id) REFERENCES movies(movie_id) ON DELETE CASCADE,
    INDEX idx_host (host_id),
    INDEX idx_date (event_date),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- Event Participants table
CREATE TABLE event_participants (
    event_id INT,
    user_id INT,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    rsvp_status ENUM('attending', 'maybe', 'not-attending') DEFAULT 'attending',
    PRIMARY KEY (event_id, user_id),
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Friendships table
CREATE TABLE friendships (
    friendship_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id_1 INT NOT NULL,
    user_id_2 INT NOT NULL,
    status ENUM('pending', 'accepted', 'declined') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id_1) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id_2) REFERENCES users(user_id) ON DELETE CASCADE,
    CHECK (user_id_1 < user_id_2),
    INDEX idx_user1 (user_id_1),
    INDEX idx_user2 (user_id_2),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- Messages table
CREATE TABLE messages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    message_text TEXT NOT NULL,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_status ENUM('read', 'unread') DEFAULT 'unread',
    read_at DATETIME,
    FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_sender (sender_id),
    INDEX idx_receiver (receiver_id),
    INDEX idx_status (read_status)
) ENGINE=InnoDB;

-- Notifications table
CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    notification_type ENUM('like', 'comment', 'friend_request', 'friend_accept', 'message', 'event') NOT NULL,
    content TEXT NOT NULL,
    related_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_read (is_read)
) ENGINE=InnoDB;

-- Restricted Words table (for moderation)
CREATE TABLE restricted_words (
    word_id INT AUTO_INCREMENT PRIMARY KEY,
    word VARCHAR(50) UNIQUE NOT NULL
) ENGINE=InnoDB;

-- Audit Log table
CREATE TABLE audit_log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    action_type ENUM('insert', 'update', 'delete', 'suspend', 'unsuspend') NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id INT,
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_admin (admin_id),
    INDEX idx_action (action_type),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB;

-- ============================================
-- STORED PROCEDURES
-- ============================================

-- Procedure to update movie average rating
DELIMITER //
CREATE PROCEDURE update_movie_rating(IN p_movie_id INT)
BEGIN
    DECLARE avg_rating DECIMAL(3,1);
    
    SELECT AVG(rating) INTO avg_rating
    FROM reviews
    WHERE movie_id = p_movie_id;
    
    IF avg_rating IS NULL THEN
        SET avg_rating = 0.0;
    END IF;
    
    UPDATE movies
    SET average_rating = avg_rating
    WHERE movie_id = p_movie_id;
END //
DELIMITER ;

-- Procedure to get user statistics
DELIMITER //
CREATE PROCEDURE get_user_stats(IN p_user_id INT)
BEGIN
    SELECT 
        u.user_id,
        u.first_name,
        u.last_name,
        u.email,
        (SELECT COUNT(*) FROM watchlist WHERE user_id = p_user_id) as movies_in_watchlist,
        (SELECT COUNT(*) FROM watchlist WHERE user_id = p_user_id AND status = 'completed') as movies_watched,
        (SELECT COUNT(*) FROM reviews WHERE user_id = p_user_id) as reviews_written,
        (SELECT COUNT(*) FROM discussion_posts WHERE user_id = p_user_id) as posts_created,
        (SELECT COUNT(*) FROM friendships WHERE (user_id_1 = p_user_id OR user_id_2 = p_user_id) AND status = 'accepted') as friends_count,
        (SELECT COUNT(*) FROM events WHERE host_id = p_user_id) as events_hosted
    FROM users u
    WHERE u.user_id = p_user_id;
END //
DELIMITER ;

-- Procedure to get movie recommendations based on user preferences
DELIMITER //
CREATE PROCEDURE get_movie_recommendations(IN p_user_id INT, IN p_limit INT)
BEGIN
    SELECT DISTINCT m.movie_id, m.title, m.release_year, m.average_rating, m.poster_url
    FROM movies m
    INNER JOIN movie_genres mg ON m.movie_id = mg.movie_id
    INNER JOIN user_genre_preferences ugp ON mg.genre_id = ugp.genre_id
    WHERE ugp.user_id = p_user_id
    AND m.movie_id NOT IN (SELECT movie_id FROM watchlist WHERE user_id = p_user_id)
    ORDER BY m.average_rating DESC, m.view_count DESC
    LIMIT p_limit;
END //
DELIMITER ;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger to log movie additions by admin
DELIMITER //
CREATE TRIGGER after_movie_insert
AFTER INSERT ON movies
FOR EACH ROW
BEGIN
    -- Note: This assumes admin_id is available through application context
    -- In practice, you'd pass this through the INSERT statement or use session variables
    INSERT INTO audit_log (admin_id, action_type, table_name, record_id, details, timestamp)
    VALUES (1, 'insert', 'movies', NEW.movie_id, CONCAT('Movie added: ', NEW.title), NOW());
END //
DELIMITER ;

-- Trigger to log movie updates
DELIMITER //
CREATE TRIGGER after_movie_update
AFTER UPDATE ON movies
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (admin_id, action_type, table_name, record_id, details, timestamp)
    VALUES (1, 'update', 'movies', NEW.movie_id, CONCAT('Movie updated: ', NEW.title), NOW());
END //
DELIMITER ;

-- Trigger to increment view count when movie added to watchlist as completed
DELIMITER //
CREATE TRIGGER after_watchlist_update
AFTER UPDATE ON watchlist
FOR EACH ROW
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE movies SET view_count = view_count + 1 WHERE movie_id = NEW.movie_id;
    END IF;
END //
DELIMITER ;

-- Trigger to update movie rating after review insert
DELIMITER //
CREATE TRIGGER after_review_insert
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
    CALL update_movie_rating(NEW.movie_id);
END //
DELIMITER ;

-- Trigger to update movie rating after review update
DELIMITER //
CREATE TRIGGER after_review_update
AFTER UPDATE ON reviews
FOR EACH ROW
BEGIN
    CALL update_movie_rating(NEW.movie_id);
END //
DELIMITER ;

-- Trigger to update movie rating after review delete
DELIMITER //
CREATE TRIGGER after_review_delete
AFTER DELETE ON reviews
FOR EACH ROW
BEGIN
    CALL update_movie_rating(OLD.movie_id);
END //
DELIMITER ;

-- ============================================
-- VIEWS
-- ============================================

-- View for user statistics
CREATE VIEW user_statistics AS
SELECT 
    u.user_id,
    u.first_name,
    u.last_name,
    u.email,
    COUNT(DISTINCT w.watchlist_id) as total_watchlist,
    COUNT(DISTINCT CASE WHEN w.status = 'completed' THEN w.watchlist_id END) as completed_movies,
    COUNT(DISTINCT r.review_id) as total_reviews,
    AVG(r.rating) as avg_rating_given,
    COUNT(DISTINCT dp.post_id) as total_posts,
    COUNT(DISTINCT f.friendship_id) as total_friends
FROM users u
LEFT JOIN watchlist w ON u.user_id = w.user_id
LEFT JOIN reviews r ON u.user_id = r.user_id
LEFT JOIN discussion_posts dp ON u.user_id = dp.user_id
LEFT JOIN friendships f ON (u.user_id = f.user_id_1 OR u.user_id = f.user_id_2) AND f.status = 'accepted'
WHERE u.role = 'user'
GROUP BY u.user_id, u.first_name, u.last_name, u.email;

-- View for movie analytics
CREATE VIEW movie_analytics AS
SELECT 
    m.movie_id,
    m.title,
    m.release_year,
    m.view_count,
    m.average_rating,
    COUNT(DISTINCT r.review_id) as review_count,
    COUNT(DISTINCT w.watchlist_id) as watchlist_count,
    COUNT(DISTINCT dp.post_id) as discussion_count,
    COUNT(DISTINCT e.event_id) as event_count
FROM movies m
LEFT JOIN reviews r ON m.movie_id = r.movie_id
LEFT JOIN watchlist w ON m.movie_id = w.movie_id
LEFT JOIN discussion_posts dp ON m.movie_id = dp.movie_id
LEFT JOIN events e ON m.movie_id = e.movie_id
GROUP BY m.movie_id, m.title, m.release_year, m.view_count, m.average_rating;

-- View for trending movies
CREATE VIEW trending_movies AS
SELECT 
    m.movie_id,
    m.title,
    m.release_year,
    m.average_rating,
    m.view_count,
    m.poster_url,
    COUNT(DISTINCT r.review_id) as recent_reviews,
    COUNT(DISTINCT w.watchlist_id) as recent_additions
FROM movies m
LEFT JOIN reviews r ON m.movie_id = r.movie_id AND r.date_posted >= DATE_SUB(NOW(), INTERVAL 30 DAY)
LEFT JOIN watchlist w ON m.movie_id = w.movie_id AND w.added_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY m.movie_id, m.title, m.release_year, m.average_rating, m.view_count, m.poster_url
HAVING recent_reviews > 0 OR recent_additions > 0
ORDER BY (recent_reviews * 2 + recent_additions) DESC, m.average_rating DESC;

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Insert Genres
INSERT INTO genres (genre_name) VALUES
('Action'), ('Comedy'), ('Drama'), ('Horror'), ('Science Fiction'),
('Romance'), ('Thriller'), ('Fantasy'), ('Mystery'), ('Adventure'),
('Animation'), ('Crime'), ('Documentary'), ('Family'), ('Musical'),
('War'), ('Western'), ('Biography');

-- Insert Users (passwords are hashed - 'password123')
INSERT INTO users (first_name, last_name, email, password_hash, date_joined, role, admin_access_code, bio) VALUES
('John', 'Doe', 'john.doe@email.com', '$2b$10$rN8JK/FKvqLZyOzKYzxLqe4p9YXxP3H5YJKbXxF5YJKbXxF5YJKbXe', '2024-01-15 10:30:00', 'user', NULL, 'Movie enthusiast and sci-fi lover'),
('Jane', 'Smith', 'jane.smith@email.com', '$2b$10$rN8JK/FKvqLZyOzKYzxLqe4p9YXxP3H5YJKbXxF5YJKbXxF5YJKbXe', '2024-02-20 14:45:00', 'user', NULL, 'Horror fan and film critic'),
('Mike', 'Johnson', 'mike.j@email.com', '$2b$10$rN8JK/FKvqLZyOzKYzxLqe4p9YXxP3H5YJKbXxF5YJKbXxF5YJKbXe', '2024-03-10 09:15:00', 'user', NULL, 'Action movies are my passion'),
('Sarah', 'Williams', 'sarah.w@email.com', '$2b$10$rN8JK/FKvqLZyOzKYzxLqe4p9YXxP3H5YJKbXxF5YJKbXxF5YJKbXe', '2024-04-05 16:20:00', 'user', NULL, 'Rom-com addict'),
('David', 'Brown', 'david.b@email.com', '$2b$10$rN8JK/FKvqLZyOzKYzxLqe4p9YXxP3H5YJKbXxF5YJKbXxF5YJKbXe', '2024-05-12 11:00:00', 'user', NULL, 'Animation and family films'),
('Emily', 'Davis', 'emily.d@email.com', '$2b$10$rN8JK/FKvqLZyOzKYzxLqe4p9YXxP3H5YJKbXxF5YJKbXxF5YJKbXe', '2024-06-18 13:30:00', 'user', NULL, 'Mystery and thriller enthusiast'),
('Chris', 'Martinez', 'chris.m@email.com', '$2b$10$rN8JK/FKvqLZyOzKYzxLqe4p9YXxP3H5YJKbXxF5YJKbXxF5YJKbXe', '2024-07-22 10:45:00', 'user', NULL, 'Classic film buff'),
('Lisa', 'Garcia', 'lisa.g@email.com', '$2b$10$rN8JK/FKvqLZyOzKYzxLqe4p9YXxP3H5YJKbXxF5YJKbXxF5YJKbXe', '2024-08-30 15:10:00', 'user', NULL, 'Documentary lover'),
('Tom', 'Wilson', 'tom.w@email.com', '$2b$10$rN8JK/FKvqLZyOzKYzxLqe4p9YXxP3H5YJKbXxF5YJKbXxF5YJKbXe', '2024-09-14 12:00:00', 'user', NULL, 'Fantasy world explorer'),
('Anna', 'Moore', 'anna.m@email.com', '$2b$10$rN8JK/FKvqLZyOzKYzxLqe4p9YXxP3H5YJKbXxF5YJKbXxF5YJKbXe', '2024-10-08 14:25:00', 'user', NULL, 'Crime drama fanatic'),
('Admin', 'User', 'dmin@amoviecom.com', '$2b$10$rN8JK/FKvqLZyOzKYzxLqe4p9YXxP3H5YJKbXxF5YJKbXxF5YJKbXe', '2024-01-01 08:00:00', 'admin', 'ADMIN2024', 'System Administrator'),
('Moderator', 'Staff', 'mod@moviecom.com', '$2b$10$rN8JK/FKvqLZyOzKYzxLqe4p9YXxP3H5YJKbXxF5YJKbXxF5YJKbXe', '2024-01-01 08:00:00', 'admin', 'MOD2024', 'Content Moderator');
('New', 'Admin', 'newadmin@email.com', '$2b$10$rN8JK/FKvqLZyOzKYzxLqe4p9YXxP3H5YJKbXxF5YJKbXxF5YJKbXe', NOW(), 'admin', 'NEWADMIN2025', 'Additional admin user');
-- Insert Movies
INSERT INTO movies (title, release_year, description, director, duration, poster_url, view_count, average_rating) VALUES
('The Matrix', 1999, 'A computer hacker learns about the true nature of reality and his role in the war against its controllers.', 'Lana Wachowski, Lilly Wachowski', 136, '/posters/matrix.jpg', 1543, 9.2),
('Inception', 2010, 'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea.', 'Christopher Nolan', 148, '/posters/inception.jpg', 2156, 9.0),
('The Shawshank Redemption', 1994, 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.', 'Frank Darabont', 142, '/posters/shawshank.jpg', 3421, 9.3),
('The Dark Knight', 2008, 'When the menace known as the Joker wreaks havoc on Gotham, Batman must accept one of the greatest tests.', 'Christopher Nolan', 152, '/posters/darkknight.jpg', 2987, 9.1),
('Pulp Fiction', 1994, 'The lives of two mob hitmen, a boxer, and a pair of diner bandits intertwine in four tales of violence and redemption.', 'Quentin Tarantino', 154, '/posters/pulpfiction.jpg', 2134, 8.9),
('Forrest Gump', 1994, 'The presidencies of Kennedy and Johnson unfold through the perspective of an Alabama man with an IQ of 75.', 'Robert Zemeckis', 142, '/posters/forrestgump.jpg', 1876, 8.8),
('The Godfather', 1972, 'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.', 'Francis Ford Coppola', 175, '/posters/godfather.jpg', 2543, 9.2),
('Interstellar', 2014, 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity survival.', 'Christopher Nolan', 169, '/posters/interstellar.jpg', 1987, 8.7),
('The Silence of the Lambs', 1991, 'A young FBI cadet must receive the help of an incarcerated cannibal killer to catch another serial killer.', 'Jonathan Demme', 118, '/posters/silencelambs.jpg', 1654, 8.6),
('Parasite', 2019, 'Greed and class discrimination threaten the newly formed symbiotic relationship between the Park family and the Kim clan.', 'Bong Joon-ho', 132, '/posters/parasite.jpg', 1432, 8.5),
('The Lion King', 1994, 'Lion prince Simba flees his kingdom after the murder of his father, only to learn the true meaning of responsibility.', 'Roger Allers, Rob Minkoff', 88, '/posters/lionking.jpg', 2234, 8.5),
('Spirited Away', 2001, 'During her family move, a sullen girl wanders into a world ruled by gods, witches, and spirits.', 'Hayao Miyazaki', 125, '/posters/spiritedaway.jpg', 1765, 8.6),
('Get Out', 2017, 'A young African-American visits his white girlfriend family estate, where his simmering uneasiness leads to shocking discoveries.', 'Jordan Peele', 104, '/posters/getout.jpg', 1543, 8.0),
('La La Land', 2016, 'While navigating their careers in Los Angeles, a pianist and an actress fall in love while attempting to reconcile their aspirations.', 'Damien Chazelle', 128, '/posters/lalaland.jpg', 1321, 8.0),
('Mad Max: Fury Road', 2015, 'In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler in search of her homeland.', 'George Miller', 120, '/posters/madmax.jpg', 1876, 8.1);

-- Insert Movie Genres
INSERT INTO movie_genres (movie_id, genre_id) VALUES
(1, 1), (1, 5), -- The Matrix: Action, Sci-Fi
(2, 1), (2, 5), (2, 7), -- Inception: Action, Sci-Fi, Thriller
(3, 3), -- The Shawshank Redemption: Drama
(4, 1), (4, 3), (4, 7), -- The Dark Knight: Action, Drama, Thriller
(5, 3), (5, 12), -- Pulp Fiction: Drama, Crime
(6, 3), (6, 6), -- Forrest Gump: Drama, Romance
(7, 3), (7, 12), -- The Godfather: Drama, Crime
(8, 3), (8, 5), (8, 10), -- Interstellar: Drama, Sci-Fi, Adventure
(9, 3), (9, 7), (9, 12), -- The Silence of the Lambs: Drama, Thriller, Crime
(10, 3), (10, 7), -- Parasite: Drama, Thriller
(11, 11), (11, 10), (11, 14), -- The Lion King: Animation, Adventure, Family
(12, 11), (12, 8), (12, 14), -- Spirited Away: Animation, Fantasy, Family
(13, 4), (13, 7), (13, 9), -- Get Out: Horror, Thriller, Mystery
(14, 3), (14, 6), (14, 15), -- La La Land: Drama, Romance, Musical
(15, 1), (15, 10), (15, 5); -- Mad Max: Action, Adventure, Sci-Fi

-- Insert User Genre Preferences
INSERT INTO user_genre_preferences (user_id, genre_id) VALUES
(1, 1), (1, 5), (1, 7), -- John: Action, Sci-Fi, Thriller
(2, 4), (2, 7), (2, 9), -- Jane: Horror, Thriller, Mystery
(3, 1), (3, 10), (3, 12), -- Mike: Action, Adventure, Crime
(4, 2), (4, 6), (4, 15), -- Sarah: Comedy, Romance, Musical
(5, 11), (5, 14), (5, 8), -- David: Animation, Family, Fantasy
(6, 7), (6, 9), (6, 12), -- Emily: Thriller, Mystery, Crime
(7, 3), (7, 16), (7, 18), -- Chris: Drama, War, Biography
(8, 13), (8, 18), -- Lisa: Documentary, Biography
(9, 8), (9, 10), (9, 5), -- Tom: Fantasy, Adventure, Sci-Fi
(10, 12), (10, 3), (10, 7); -- Anna: Crime, Drama, Thriller

-- Insert Watchlist entries
INSERT INTO watchlist (user_id, movie_id, added_date, status) VALUES
(1, 1, '2024-11-01 10:00:00', 'completed'),
(1, 2, '2024-11-02 11:30:00', 'completed'),
(1, 8, '2024-11-15 14:20:00', 'watching'),
(2, 9, '2024-11-03 09:15:00', 'completed'),
(2, 13, '2024-11-10 16:45:00', 'completed'),
(3, 4, '2024-11-05 12:00:00', 'completed'),
(3, 15, '2024-11-12 13:30:00', 'to-watch'),
(4, 6, '2024-11-07 10:30:00', 'completed'),
(4, 14, '2024-11-14 15:00:00', 'watching'),
(5, 11, '2024-11-08 11:45:00', 'completed'),
(5, 12, '2024-11-16 14:15:00', 'completed'),
(6, 9, '2024-11-09 13:00:00', 'watching'),
(7, 3, '2024-11-11 10:15:00', 'completed'),
(7, 7, '2024-11-13 12:45:00', 'to-watch'),
(8, 10, '2024-11-14 09:30:00', 'watching'),
(9, 8, '2024-11-15 11:00:00', 'to-watch'),
(10, 5, '2024-11-16 14:30:00', 'completed');

-- Insert Reviews
INSERT INTO reviews (user_id, movie_id, rating, review_text, date_posted) VALUES
(1, 1, 10, 'Mind-blowing movie! The concept of reality vs simulation is executed perfectly. A must-watch for any sci-fi fan.', '2024-11-05 14:30:00'),
(1, 2, 9, 'Christopher Nolan at his finest. The dream sequences are beautifully crafted and the ending leaves you thinking.', '2024-11-08 16:20:00'),
(2, 9, 9, 'Absolutely terrifying and brilliant. Anthony Hopkins performance is unforgettable.', '2024-11-10 11:45:00'),
(2, 13, 8, 'A fresh take on horror with social commentary. Jordan Peele is a master storyteller.', '2024-11-12 13:15:00'),
(3, 4, 10, 'Heath Ledger Joker is iconic. This movie redefined superhero films. Pure perfection.', '2024-11-07 15:30:00'),
(3, 15, 8, 'Non-stop action from start to finish. The practical effects are incredible!', '2024-11-14 10:20:00'),
(4, 6, 9, 'Such a beautiful and emotional journey. Tom Hanks delivers an amazing performance.', '2024-11-09 12:00:00'),
(4, 14, 8, 'Stunning visuals and music. A love letter to dreamers and artists everywhere.', '2024-11-16 14:45:00'),
(5, 11, 9, 'A timeless classic that still makes me cry. Perfect for all ages.', '2024-11-11 11:30:00'),
(5, 12, 10, 'Miyazaki masterpiece. The animation and storytelling are absolutely magical.', '2024-11-17 13:00:00'),
(7, 3, 10, 'The greatest movie ever made. Every scene is perfect. A true cinematic achievement.', '2024-11-13 15:15:00'),
(7, 7, 10, 'An offer you can\'t refuse. Marlon Brando performance is legendary.', '2024-11-15 16:30:00'),
(10, 5, 9, 'Tarantino genius on full display. The dialogue and non-linear storytelling are brilliant.', '2024-11-18 10:45:00');

-- Insert Discussion Posts
INSERT INTO discussion_posts (user_id, movie_id, title, content, date_posted) VALUES
(1, 1, 'The Matrix Theory: Is Neo still in the Matrix?', 'I just rewatched The Matrix and I have a theory that Neo never actually left the Matrix. What if everything after he takes the red pill is just another layer? Discuss!', '2024-11-20 10:30:00'),
(2, 13, 'Get Out: Hidden Details You Might Have Missed', 'On my third viewing, I noticed so many subtle hints throughout the movie. The way Chris interacts with objects, the background conversations... Jordan Peele is a genius!', '2024-11-21 14:15:00'),
(3, 4, 'Why The Dark Knight is Still Relevant Today', 'Watching this in 2024 and the themes of chaos, morality, and sacrifice are still so powerful. Heath Ledger\'s Joker remains unmatched.', '2024-11-22 11:45:00'),
(4, 14, 'La La Land Ending: Happy or Sad?', 'I keep going back and forth on whether the ending is bittersweet or just sad. They achieved their dreams but lost each other. What do you think?', '2024-11-23 13:20:00'),
(5, 12, 'Studio Ghibli Appreciation Post', 'Can we talk about how Spirited Away changed animation forever? The attention to detail, the themes of growing up... masterpiece!', '2024-11-24 15:00:00'),
(6, 9, 'Silence of the Lambs: Best Thriller Ever?', 'The psychological tension in this movie is unmatched. Hannibal Lecter is terrifying without being physically threatening. Thoughts?', '2024-11-25 10:15:00'),
(7, 3, 'Shawshank Redemption: Hope Never Dies', 'This movie taught me so much about perseverance and friendship. Andy Dufresne\'s patience and planning is inspiring.', '2024-11-26 12:30:00'),
(9, 8, 'Interstellar Science: Fact or Fiction?', 'As a physics enthusiast, I love how Interstellar tries to stay scientifically accurate. The time dilation scene gives me chills every time!', '2024-11-27 14:45:00');

-- Insert Discussion Comments
INSERT INTO discussion_comments (post_id, user_id, comment_text, date_commented) VALUES
(1, 3, 'Interesting theory! I think the Architect scene in the sequels kind of confirms there are multiple layers.', '2024-11-20 12:15:00'),
(1, 5, 'Mind = blown. Never thought about it that way. Need to rewatch now!', '2024-11-20 14:30:00'),
(2, 4, 'YES! The deer head in the beginning is such a great foreshadow!', '2024-11-21 16:00:00'),
(3, 1, 'Completely agree. The Joker social experiments still hit hard today.', '2024-11-22 13:20:00'),
(4, 6, 'I think it is bittersweet. They both got what they wanted in a way.', '2024-11-23 15:45:00'),
(5, 7, 'Studio Ghibli films are in a league of their own. Pure art!', '2024-11-24 16:30:00'),
(6, 2, 'Absolutely! The "quid pro quo" scenes are masterfully done.', '2024-11-25 11:45:00'),
(8, 1, 'They worked with physicist Kip Thorne to get the black hole visuals accurate. Amazing!', '2024-11-27 16:00:00');

-- Insert Discussion Likes
INSERT INTO discussion_likes (user_id, post_id, date_liked) VALUES
(2, 1, '2024-11-20 11:00:00'),
(3, 1, '2024-11-20 13:00:00'),
(4, 1, '2024-11-20 15:00:00'),
(1, 2, '2024-11-21 15:30:00'),
(5, 2, '2024-11-21 17:00:00'),
(2, 3, '2024-11-22 12:00:00'),
(4, 3, '2024-11-22 14:30:00'),
(5, 4, '2024-11-23 14:00:00'),
(1, 4, '2024-11-23 16:15:00'),
(6, 5, '2024-11-24 15:45:00'),
(8, 5, '2024-11-24 17:00:00'),
(5, 6, '2024-11-25 11:00:00'),
(7, 6, '2024-11-25 13:30:00'),
(8, 7, '2024-11-26 13:15:00'),
(10, 7, '2024-11-26 15:00:00'),
(1, 8, '2024-11-27 15:30:00'),
(5, 8, '2024-11-27 17:15:00');

-- Insert Events (Watch Parties)
INSERT INTO events (host_id, movie_id, event_date, location, max_participants, description, status, created_at) VALUES
(1, 2, '2024-12-10 19:00:00', 'Central Park Outdoor Cinema', 20, 'Join us for an outdoor screening of Inception! Bring blankets and snacks.', 'scheduled', '2024-11-18 10:00:00'),
(2, 13, '2024-12-12 20:00:00', 'Horror Night Cinema Hall', 15, 'Get Out screening with Q&A discussion afterwards. Horror fans welcome!', 'scheduled', '2024-11-19 11:30:00'),
(3, 4, '2024-12-15 18:30:00', 'Downtown Movie Theater', 25, 'The Dark Knight marathon - all three films! Be prepared for an epic night.', 'scheduled', '2024-11-20 14:15:00'),
(5, 11, '2024-12-08 15:00:00', 'Family Entertainment Center', 30, 'The Lion King sing-along for families! Kids are welcome.', 'scheduled', '2024-11-21 09:45:00'),
(7, 7, '2024-11-28 19:30:00', 'Classic Cinema Club', 20, 'The Godfather screening - a true masterpiece!', 'completed', '2024-11-15 16:00:00'),
(9, 8, '2024-11-25 18:00:00', 'IMAX Theater Downtown', 15, 'Interstellar on the biggest screen! Experience the vastness of space.', 'completed', '2024-11-10 12:30:00');

-- Insert Event Participants
INSERT INTO event_participants (event_id, user_id, joined_at, rsvp_status) VALUES
(1, 1, '2024-11-18 10:00:00', 'attending'),
(1, 3, '2024-11-18 12:30:00', 'attending'),
(1, 4, '2024-11-18 15:45:00', 'attending'),
(1, 6, '2024-11-19 09:15:00', 'attending'),
(1, 8, '2024-11-19 14:20:00', 'maybe'),
(2, 2, '2024-11-19 11:30:00', 'attending'),
(2, 6, '2024-11-19 13:45:00', 'attending'),
(2, 10, '2024-11-19 16:00:00', 'attending'),
(3, 3, '2024-11-20 14:15:00', 'attending'),
(3, 1, '2024-11-20 16:30:00', 'attending'),
(3, 7, '2024-11-21 10:00:00', 'attending'),
(3, 9, '2024-11-21 12:15:00', 'attending'),
(3, 10, '2024-11-21 14:30:00', 'maybe'),
(4, 5, '2024-11-21 09:45:00', 'attending'),
(4, 4, '2024-11-21 11:00:00', 'attending'),
(4, 8, '2024-11-21 13:15:00', 'attending'),
(4, 6, '2024-11-22 10:30:00', 'attending'),
(5, 7, '2024-11-15 16:00:00', 'attending'),
(5, 1, '2024-11-16 09:30:00', 'attending'),
(5, 3, '2024-11-16 11:45:00', 'attending'),
(5, 10, '2024-11-17 14:00:00', 'attending'),
(6, 9, '2024-11-10 12:30:00', 'attending'),
(6, 1, '2024-11-11 10:15:00', 'attending'),
(6, 2, '2024-11-12 13:45:00', 'attending'),
(6, 5, '2024-11-13 15:00:00', 'attending'),
(6, 8, '2024-11-14 11:30:00', 'attending'),
(6, 3, '2024-11-15 16:45:00', 'attending');

-- Insert Friendships
INSERT INTO friendships (user_id_1, user_id_2, status, created_at) VALUES
(1, 2, 'accepted', '2024-10-15 10:00:00'),
(1, 3, 'accepted', '2024-10-20 11:30:00'),
(1, 5, 'accepted', '2024-11-01 14:15:00'),
(2, 6, 'accepted', '2024-10-25 09:45:00'),
(2, 10, 'accepted', '2024-11-05 13:20:00'),
(3, 4, 'pending', '2024-11-18 10:30:00'),
(3, 7, 'accepted', '2024-11-08 15:00:00'),
(3, 9, 'accepted', '2024-11-12 12:45:00'),
(4, 5, 'accepted', '2024-11-10 11:15:00'),
(5, 8, 'accepted', '2024-11-15 14:30:00'),
(6, 7, 'pending', '2024-11-20 09:00:00'),
(7, 10, 'accepted', '2024-11-14 16:45:00'),
(8, 9, 'accepted', '2024-11-17 13:00:00');

-- Insert Messages
INSERT INTO messages (sender_id, receiver_id, message_text, sent_at, read_status, read_at) VALUES
(1, 2, 'Hey! Did you watch the new thriller that just came out?', '2024-11-20 10:15:00', 'read', '2024-11-20 10:30:00'),
(2, 1, 'Yes! It was amazing. We should organize a watch party!', '2024-11-20 10:35:00', 'read', '2024-11-20 10:40:00'),
(3, 7, 'The Godfather screening was incredible. Thanks for the recommendation!', '2024-11-29 09:00:00', 'read', '2024-11-29 09:15:00'),
(4, 5, 'Want to join the Lion King sing-along next week?', '2024-11-22 14:30:00', 'read', '2024-11-22 15:00:00'),
(5, 4, 'Absolutely! My kids would love it too.', '2024-11-22 15:10:00', 'read', '2024-11-22 15:15:00'),
(6, 2, 'Your review of Get Out was spot on! So many hidden details.', '2024-11-23 11:45:00', 'read', '2024-11-23 12:00:00'),
(7, 10, 'Have you seen Parasite yet? You would love it!', '2024-11-24 16:20:00', 'unread', NULL),
(9, 1, 'The Interstellar IMAX experience was mind-blowing! Thanks for coming.', '2024-11-26 09:30:00', 'read', '2024-11-26 10:00:00'),
(10, 3, 'Dark Knight marathon next week - you in?', '2024-11-27 13:15:00', 'read', '2024-11-27 13:30:00'),
(8, 5, 'Studio Ghibli film festival this weekend! Interested?', '2024-11-28 10:00:00', 'unread', NULL);

-- Insert Notifications
INSERT INTO notifications (user_id, notification_type, content, related_id, created_at, is_read) VALUES
(1, 'friend_request', 'You have a new friend request from Mike Johnson', 3, '2024-11-18 10:30:00', 1),
(2, 'like', 'John Doe liked your discussion post', 2, '2024-11-21 15:30:00', 1),
(3, 'comment', 'Someone commented on your discussion post', 3, '2024-11-22 13:20:00', 1),
(4, 'friend_accept', 'Sarah Williams accepted your friend request', 9, '2024-11-10 11:15:00', 1),
(5, 'event', 'Reminder: Lion King sing-along tomorrow at 3 PM', 4, '2024-12-07 09:00:00', 0),
(6, 'message', 'New message from Jane Smith', 6, '2024-11-23 11:45:00', 1),
(7, 'like', 'Your review received 5 new likes', 12, '2024-11-16 14:00:00', 1),
(9, 'event', 'Mike Johnson joined your Interstellar watch party', 6, '2024-11-21 12:15:00', 1);

-- Insert Restricted Words for moderation
INSERT INTO restricted_words (word) VALUES
('spam'), ('offensive1'), ('offensive2'), ('offensive3'), ('offensive4'),
('inappropriate1'), ('inappropriate2'), ('inappropriate3'), ('inappropriate4'), ('inappropriate5'),
('banned1'), ('banned2'), ('banned3'), ('banned4'), ('banned5');

-- Insert Audit Log entries
INSERT INTO audit_log (admin_id, action_type, table_name, record_id, details, timestamp) VALUES
(11, 'insert', 'movies', 1, 'Movie added: The Matrix', '2024-11-01 09:00:00'),
(11, 'insert', 'movies', 2, 'Movie added: Inception', '2024-11-01 09:15:00'),
(11, 'insert', 'movies', 3, 'Movie added: The Shawshank Redemption', '2024-11-01 09:30:00'),
(11, 'update', 'movies', 1, 'Movie updated: The Matrix - poster URL changed', '2024-11-05 14:20:00'),
(12, 'delete', 'reviews', 999, 'Review deleted: Inappropriate content', '2024-11-10 11:30:00'),
(12, 'delete', 'discussion_posts', 888, 'Post deleted: Spam content', '2024-11-12 15:45:00'),
(11, 'suspend', 'users', 999, 'User suspended: Multiple violations', '2024-11-15 10:00:00'),
(11, 'unsuspend', 'users', 999, 'User unsuspended: Appeal accepted', '2024-11-20 13:30:00'),
(12, 'insert', 'restricted_words', 1, 'Added restricted word: spam', '2024-11-03 16:00:00'),
(11, 'update', 'users', 5, 'User profile updated: David Brown', '2024-11-18 12:15:00');

-- Update last_login for some users
UPDATE users SET last_login = '2024-12-06 09:30:00' WHERE user_id = 1;
UPDATE users SET last_login = '2024-12-06 10:15:00' WHERE user_id = 2;
UPDATE users SET last_login = '2024-12-05 16:45:00' WHERE user_id = 3;
UPDATE users SET last_login = '2024-12-06 08:20:00' WHERE user_id = 4;
UPDATE users SET last_login = '2024-12-05 14:30:00' WHERE user_id = 5;

-- ============================================
-- END OF DATABASE SCRIPT
-- ============================================

-- Display success message
SELECT 'Database created successfully!' as Status;
SELECT COUNT(*) as Total_Users FROM users WHERE role = 'user';
SELECT COUNT(*) as Total_Movies FROM movies;
SELECT COUNT(*) as Total_Reviews FROM reviews;
SELECT COUNT(*) as Total_Events FROM events;
