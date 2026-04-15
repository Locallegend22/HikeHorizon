const express = require('express');
const router = express.Router();
const { dbGet, dbAll, dbRun } = require('../data/database');

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

router.get('/trails', async (req, res) => {
  const trails = await dbAll('SELECT * FROM trails ORDER BY name');
  res.json(trails);
});

router.get('/trails/:id', async (req, res) => {
  const trail = await dbGet('SELECT * FROM trails WHERE id = $1', [req.params.id]);
  if (!trail) {
    return res.status(404).json({ error: 'Trail not found' });
  }
  res.json(trail);
});

router.get('/trails/:id/reviews', async (req, res) => {
  const reviews = await dbAll(`
    SELECT r.*, u.username, u.avatar
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    WHERE r.trail_id = $1
    ORDER BY r.created_at DESC
  `, [req.params.id]);
  res.json(reviews);
});

router.post('/trails/:id/reviews', requireAuth, async (req, res) => {
  const { rating, comment, tips } = req.body;
  
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    await dbRun('INSERT INTO reviews (user_id, trail_id, rating, comment, tips) VALUES ($1, $2, $3, $4, $5)', [req.session.user.id, req.params.id, rating, comment || '', tips || '']);
    
    res.json({ success: true, message: 'Review added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/weather/:lat/:lon', async (req, res) => {
  const { lat, lon } = req.params;
  
  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch weather' });
  }
});

router.get('/emergency/contacts', async (req, res) => {
  const contacts = await dbAll('SELECT * FROM emergency_contacts');
  res.json(contacts);
});

router.post('/trips', requireAuth, async (req, res) => {
  const { trail_id, title, trip_date, itinerary, notes } = req.body;
  
  try {
    const result = await dbRun('INSERT INTO trips (user_id, trail_id, title, trip_date, itinerary, notes) VALUES ($1, $2, $3, $4, $5, $6)', [req.session.user.id, trail_id, title, trip_date, itinerary || '', notes || '']);
    
    res.json({ success: true, tripId: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/user/trips', requireAuth, async (req, res) => {
  const trips = await dbAll(`
    SELECT tr.*, t.name as trail_name, t.location
    FROM trips tr
    JOIN trails t ON tr.trail_id = t.id
    WHERE tr.user_id = $1
    ORDER BY tr.trip_date ASC
  `, [req.session.user.id]);
  res.json(trips);
});

router.get('/leaderboard', async (req, res) => {
  const leaderboard = await dbAll(`
    SELECT username, total_hikes, total_distance, avatar
    FROM users
    ORDER BY total_hikes DESC
    LIMIT 10
  `);
  res.json(leaderboard);
});

module.exports = router;