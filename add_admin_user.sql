-- Add new admin user to existing database
USE movie_community_db;

INSERT INTO users (first_name, last_name, email, password_hash, date_joined, role, admin_access_code, bio)
VALUES ('New', 'Admin', 'newadmin@email.com', '$2b$10$rN8JK/FKvqLZyOzKYzxLqe4p9YXxP3H5YJKbXxF5YJKbXxF5YJKbXe', NOW(), 'admin', 'NEWADMIN2025', 'Additional admin user');

-- Verify insertion
SELECT user_id, first_name, last_name, email, role, admin_access_code 
FROM users 
WHERE email = 'newadmin@email.com';
