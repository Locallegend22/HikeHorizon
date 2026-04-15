const express = require('express');
const router = express.Router();
const { dbGet, dbAll, dbRun } = require('../data/database');

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login?redirect=' + req.originalUrl);
  }
  next();
}

router.get('/dashboard', requireAuth, async (req, res) => {
  const userId = req.session.user.id;

  const user = await dbGet('SELECT * FROM users WHERE id = $1', [userId]);
  
  const recentHikes = await dbAll(`
    SELECT h.*, t.name as trail_name, t.location, t.image_url
    FROM hikes h
    JOIN trails t ON h.trail_id = t.id
    WHERE h.user_id = $1
    ORDER BY h.date DESC
    LIMIT 5
  `, [userId]);

  const favorites = await dbAll(`
    SELECT t.*, f.created_at as favorited_at
    FROM favorites f
    JOIN trails t ON f.trail_id = t.id
    WHERE f.user_id = $1
    ORDER BY f.created_at DESC
    LIMIT 5
  `, [userId]);

  const achievements = await dbAll('SELECT * FROM achievements');
  
  const userHikes = await dbGet('SELECT COUNT(*) as count, SUM(t.distance) as total_distance FROM hikes h JOIN trails t ON h.trail_id = t.id WHERE h.user_id = $1', [userId]);

  const stats = {
    totalHikes: userHikes?.count || 0,
    totalDistance: userHikes?.total_distance || 0,
    uniqueTrails: (await dbGet('SELECT COUNT(DISTINCT trail_id) as count FROM hikes WHERE user_id = $1', [userId]))?.count || 0
  };

  res.render('dashboard', { user, recentHikes, favorites, achievements, stats });
});

router.get('/profile', requireAuth, async (req, res) => {
  const user = await dbGet('SELECT * FROM users WHERE id = $1', [req.session.user.id]);
  res.render('profile', { user });
});

router.post('/profile', requireAuth, async (req, res) => {
  const { username, bio, experience_level } = req.body;
  
  try {
    await dbRun('UPDATE users SET username = $1, bio = $2, experience_level = $3 WHERE id = $4', [username, bio, experience_level, req.session.user.id]);
    
    req.session.user.username = username;
    req.session.user.experience_level = experience_level;
    
    res.redirect('/user/profile?success=Profile updated successfully');
  } catch (err) {
    res.redirect('/user/profile?error=Failed to update profile');
  }
});

router.get('/favorites', requireAuth, async (req, res) => {
  const favorites = await dbAll(`
    SELECT t.*, f.created_at as favorited_at
    FROM favorites f
    JOIN trails t ON f.trail_id = t.id
    WHERE f.user_id = $1
    ORDER BY f.created_at DESC
  `, [req.session.user.id]);
  
  res.render('favorites', { favorites });
});

router.post('/favorites/:trailId', requireAuth, async (req, res) => {
  const trailId = req.params.trailId;
  
  try {
    await dbRun('INSERT OR IGNORE INTO favorites (user_id, trail_id) VALUES ($1, $2)', [req.session.user.id, trailId]);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

router.delete('/favorites/:trailId', requireAuth, async (req, res) => {
  const trailId = req.params.trailId;
  
  try {
    await dbRun('DELETE FROM favorites WHERE user_id = $1 AND trail_id = $2', [req.session.user.id, trailId]);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

router.get('/hikes', requireAuth, async (req, res) => {
  const hikes = await dbAll(`
    SELECT h.*, t.name as trail_name, t.location, t.difficulty, t.distance, t.image_url
    FROM hikes h
    JOIN trails t ON h.trail_id = t.id
    WHERE h.user_id = $1
    ORDER BY h.date DESC
  `, [req.session.user.id]);
  
  res.render('hikes', { hikes });
});

router.post('/hikes', requireAuth, async (req, res) => {
  const { trail_id, date, notes, duration, completed } = req.body;
  
  try {
    await dbRun('INSERT INTO hikes (user_id, trail_id, date, notes, duration, completed) VALUES ($1, $2, $3, $4, $5, $6)', [req.session.user.id, trail_id, date, notes, duration, completed ? 1 : 0]);
    await dbRun('UPDATE users SET total_hikes = total_hikes + 1 WHERE id = $1', [req.session.user.id]);
    
    res.redirect('/user/hikes?success=Hike logged successfully');
  } catch (err) {
    res.redirect('/user/hikes?error=Failed to log hike');
  }
});

router.post('/checkin', requireAuth, (req, res) => {
  const { trailId, status } = req.body;
  console.log(`User ${req.session.user.id} checked in at trail ${trailId}, status: ${status}`);
  res.json({ success: true, message: 'Check-in recorded successfully' });
});

module.exports = router;