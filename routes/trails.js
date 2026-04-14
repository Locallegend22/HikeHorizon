const express = require('express');
const router = express.Router();
const { dbGet, dbAll, dbRun } = require('../data/database');

router.get('/', (req, res) => {
  const { location, difficulty, search, sort } = req.query;
  
  let query = `
    SELECT t.*, AVG(r.rating) as avg_rating, COUNT(r.id) as review_count
    FROM trails t
    LEFT JOIN reviews r ON t.id = r.trail_id
    WHERE 1=1
  `;
  const params = [];

  if (location) {
    query += ` AND t.location LIKE ?`;
    params.push(`%${location}%`);
  }

  if (difficulty) {
    query += ` AND t.difficulty = ?`;
    params.push(difficulty);
  }

  if (search) {
    query += ` AND (t.name LIKE ? OR t.description LIKE ? OR t.location LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ` GROUP BY t.id`;

  if (sort === 'distance') {
    query += ` ORDER BY t.distance ASC`;
  } else if (sort === 'rating') {
    query += ` ORDER BY avg_rating DESC`;
  } else if (sort === 'elevation') {
    query += ` ORDER BY t.elevation_gain DESC`;
  } else {
    query += ` ORDER BY t.created_at DESC`;
  }

  const trails = dbAll(query, params);
  const locations = dbAll('SELECT DISTINCT location FROM trails ORDER BY location');
  
  res.render('trails', { trails, filters: { location, difficulty, search, sort }, locations });
});

router.get('/:id', (req, res) => {
  const trailId = req.params.id;
  
  const trail = dbGet(`
    SELECT t.*, AVG(r.rating) as avg_rating, COUNT(r.id) as review_count
    FROM trails t
    LEFT JOIN reviews r ON t.id = r.trail_id
    WHERE t.id = ?
    GROUP BY t.id
  `, [trailId]);

  if (!trail) {
    return res.status(404).render('404');
  }

  const reviews = dbAll(`
    SELECT r.*, u.username, u.avatar
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    WHERE r.trail_id = ?
    ORDER BY r.created_at DESC
    LIMIT 10
  `, [trailId]);

  let isFavorite = false;
  if (req.session.user) {
    const favorite = dbGet('SELECT id FROM favorites WHERE user_id = ? AND trail_id = ?', [req.session.user.id, trailId]);
    isFavorite = !!favorite;
  }

  const similarTrails = dbAll(`
    SELECT t.*, AVG(r.rating) as avg_rating
    FROM trails t
    LEFT JOIN reviews r ON t.id = r.trail_id
    WHERE t.location = ? AND t.id != ?
    GROUP BY t.id
    LIMIT 3
  `, [trail.location, trailId]);

  res.render('trail-detail', { trail, reviews, isFavorite, similarTrails });
});

module.exports = router;
