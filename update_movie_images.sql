-- Update movie poster URLs with local image paths
USE movie_community_db;

UPDATE movies SET poster_url = '/images/movies/the matrix.jpeg' WHERE title = 'The Matrix';
UPDATE movies SET poster_url = '/images/movies/inception.jpeg' WHERE title = 'Inception';
UPDATE movies SET poster_url = '/images/movies/shawshank.jpeg' WHERE title = 'The Shawshank Redemption';
UPDATE movies SET poster_url = '/images/movies/the dark night.jpeg' WHERE title = 'The Dark Knight';
UPDATE movies SET poster_url = '/images/movies/pulp fiction.jpeg' WHERE title = 'Pulp Fiction';
UPDATE movies SET poster_url = '/images/movies/forest grump.jpeg' WHERE title = 'Forrest Gump';
UPDATE movies SET poster_url = '/images/movies/the godfather.jpeg' WHERE title = 'The Godfather';
UPDATE movies SET poster_url = '/images/movies/intersteller.jpeg' WHERE title = 'Interstellar';
UPDATE movies SET poster_url = '/images/movies/the silence of the lambs.jpeg' WHERE title = 'The Silence of the Lambs';
UPDATE movies SET poster_url = '/images/movies/parasite.jpeg' WHERE title = 'Parasite';
UPDATE movies SET poster_url = '/images/movies/the lion king.jpeg' WHERE title = 'The Lion King';
UPDATE movies SET poster_url = '/images/movies/spirited away.jpeg' WHERE title = 'Spirited Away';

-- Verify the updates
SELECT movie_id, title, poster_url FROM movies WHERE poster_url LIKE '/images/movies/%';
