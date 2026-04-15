const express = require('express');
const router = express.Router();
const { dbGet, dbAll, dbRun } = require('../data/database');

router.get('/', async (req, res) => {
  const { location, difficulty, search, sort } = req.query;
  
  let query = `
    SELECT t.*, AVG(r.rating) as avg_rating, COUNT(r.id) as review_count
    FROM trails t
    LEFT JOIN reviews r ON t.id = r.trail_id
    WHERE 1=1
  `;
  const params = [];

  if (location) {
    query += ` AND t.location LIKE $${params.length + 1}`;
    params.push(`%${location}%`);
  }

  if (difficulty) {
    query += ` AND t.difficulty = $${params.length + 1}`;
    params.push(difficulty);
  }

  if (search) {
    query += ` AND (t.name LIKE $${params.length + 1} OR t.description LIKE $${params.length + 1} OR t.location LIKE $${params.length + 1})`;
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

  const trails = await dbAll(query, params);
  const locations = await dbAll('SELECT DISTINCT location FROM trails ORDER BY location');
  
  res.render('trails', { trails, filters: { location, difficulty, search, sort }, locations });
});

router.get('/:id', async (req, res) => {
  const trailId = req.params.id;
  
  const trail = await dbGet(`
    SELECT t.*, AVG(r.rating) as avg_rating, COUNT(r.id) as review_count
    FROM trails t
    LEFT JOIN reviews r ON t.id = r.trail_id
    WHERE t.id = $1
    GROUP BY t.id
  `, [trailId]);

  if (!trail) {
    return res.status(404).render('404');
  }

  const reviews = await dbAll(`
    SELECT r.*, u.username, u.avatar
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    WHERE r.trail_id = $1
    ORDER BY r.created_at DESC
    LIMIT 10
  `, [trailId]);

  let isFavorite = false;
  if (req.session.user) {
    const favorite = await dbGet('SELECT id FROM favorites WHERE user_id = $1 AND trail_id = $2', [req.session.user.id, trailId]);
    isFavorite = !!favorite;
  }

  const similarTrails = await dbAll(`
    SELECT t.*, AVG(r.rating) as avg_rating
    FROM trails t
    LEFT JOIN reviews r ON t.id = r.trail_id
    WHERE t.location = $1 AND t.id != $2
    GROUP BY t.id
    LIMIT 3
  `, [trail.location, trailId]);

  res.render('trail-detail', { trail, reviews, isFavorite, similarTrails });
});

module.exports = router;