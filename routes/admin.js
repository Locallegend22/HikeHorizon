const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { dbGet, dbAll, dbRun } = require('../data/database');

function requireAdmin(req, res, next) {
  if (!req.session.user || !req.session.user.is_admin) {
    return res.status(403).send('Access Denied');
  }
  next();
}

router.get('/dashboard', requireAdmin, async (req, res) => {
  const stats = {
    totalUsers: (await dbGet('SELECT COUNT(*) as count FROM users'))?.count || 0,
    totalTrails: (await dbGet('SELECT COUNT(*) as count FROM trails'))?.count || 0,
    totalHikes: (await dbGet('SELECT COUNT(*) as count FROM hikes'))?.count || 0,
    totalReviews: (await dbGet('SELECT COUNT(*) as count FROM reviews'))?.count || 0
  };
  
  const recentUsers = await dbAll('SELECT * FROM users ORDER BY created_at DESC LIMIT 10');
  const recentHikes = await dbAll(`
    SELECT h.*, t.name as trail_name, u.username
    FROM hikes h
    JOIN trails t ON h.trail_id = t.id
    JOIN users u ON h.user_id = u.id
    ORDER BY h.created_at DESC
    LIMIT 10
  `);
  
  res.render('admin-dashboard', { stats, recentUsers, recentHikes });
});

router.get('/users', requireAdmin, async (req, res) => {
  const users = await dbAll('SELECT * FROM users ORDER BY created_at DESC');
  res.render('admin-users', { users });
});

router.get('/trails', requireAdmin, async (req, res) => {
  const trails = await dbAll('SELECT * FROM trails ORDER BY name');
  res.render('admin-trails', { trails });
});

router.get('/trails/new', requireAdmin, (req, res) => {
  res.render('admin-trail-form', { trail: null });
});

router.get('/trails/:id', requireAdmin, async (req, res) => {
  const trail = await dbGet('SELECT * FROM trails WHERE id = $1', [req.params.id]);
  if (!trail) return res.redirect('/admin/trails');
  res.render('admin-trail-detail', { trail });
});

router.get('/trails/:id/edit', requireAdmin, async (req, res) => {
  const trail = await dbGet('SELECT * FROM trails WHERE id = $1', [req.params.id]);
  if (!trail) return res.redirect('/admin/trails');
  res.render('admin-trail-form', { trail });
});

router.post('/trails', requireAdmin, async (req, res) => {
  const { name, location, description, difficulty, distance, elevation_gain, estimated_time, entry_fee, latitude, longitude, image_url, best_season } = req.body;
  
  try {
    await dbRun(`INSERT INTO trails (name, location, description, difficulty, distance, elevation_gain, estimated_time, entry_fee, latitude, longitude, image_url, best_season) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`, 
      [name, location, description, difficulty, distance, elevation_gain, estimated_time, entry_fee, latitude, longitude, image_url, best_season]);
    res.redirect('/admin/trails?success=Trail added successfully');
  } catch (err) {
    res.redirect('/admin/trails?error=Failed to add trail');
  }
});

router.post('/trails/:id', requireAdmin, async (req, res) => {
  const { name, location, description, difficulty, distance, elevation_gain, estimated_time, entry_fee, latitude, longitude, image_url, best_season } = req.body;
  
  try {
    await dbRun(`UPDATE trails SET name = $1, location = $2, description = $3, difficulty = $4, distance = $5, elevation_gain = $6, estimated_time = $7, entry_fee = $8, latitude = $9, longitude = $10, image_url = $11, best_season = $12 WHERE id = $13`, 
      [name, location, description, difficulty, distance, elevation_gain, estimated_time, entry_fee, latitude, longitude, image_url, best_season, req.params.id]);
    res.redirect('/admin/trails?success=Trail updated successfully');
  } catch (err) {
    res.redirect('/admin/trails?error=Failed to update trail');
  }
});

router.post('/trails/:id/delete', requireAdmin, async (req, res) => {
  try {
    await dbRun('DELETE FROM trails WHERE id = $1', [req.params.id]);
    res.redirect('/admin/trails?success=Trail deleted successfully');
  } catch (err) {
    res.redirect('/admin/trails?error=Failed to delete trail');
  }
});

router.post('/users/:id/toggle-admin', requireAdmin, async (req, res) => {
  const user = await dbGet('SELECT is_admin FROM users WHERE id = $1', [req.params.id]);
  if (user) {
    const newStatus = user.is_admin ? 0 : 1;
    await dbRun('UPDATE users SET is_admin = $1 WHERE id = $2', [newStatus, req.params.id]);
  }
  res.redirect('/admin/users');
});

router.post('/users/:id/delete', requireAdmin, async (req, res) => {
  try {
    await dbRun('DELETE FROM reviews WHERE user_id = $1', [req.params.id]);
    await dbRun('DELETE FROM favorites WHERE user_id = $1', [req.params.id]);
    await dbRun('DELETE FROM hikes WHERE user_id = $1', [req.params.id]);
    await dbRun('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.redirect('/admin/users?success=User deleted successfully');
  } catch (err) {
    res.redirect('/admin/users?error=Failed to delete user');
  }
});

router.get('/hikes', requireAdmin, async (req, res) => {
  const hikes = await dbAll(`
    SELECT h.*, t.name as trail_name, u.username
    FROM hikes h
    JOIN trails t ON h.trail_id = t.id
    JOIN users u ON h.user_id = u.id
    ORDER BY h.date DESC
  `);
  res.render('admin-hikes', { hikes });
});

module.exports = router;