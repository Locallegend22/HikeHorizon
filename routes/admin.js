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

router.get('/dashboard', requireAdmin, (req, res) => {
  const stats = {
    totalUsers: dbGet('SELECT COUNT(*) as count FROM users')?.count || 0,
    totalTrails: dbGet('SELECT COUNT(*) as count FROM trails')?.count || 0,
    totalHikes: dbGet('SELECT COUNT(*) as count FROM hikes')?.count || 0,
    totalReviews: dbGet('SELECT COUNT(*) as count FROM reviews')?.count || 0
  };
  
  const recentUsers = dbAll('SELECT * FROM users ORDER BY created_at DESC LIMIT 10');
  const recentHikes = dbAll(`
    SELECT h.*, t.name as trail_name, u.username
    FROM hikes h
    JOIN trails t ON h.trail_id = t.id
    JOIN users u ON h.user_id = u.id
    ORDER BY h.created_at DESC
    LIMIT 10
  `);
  
  res.render('admin-dashboard', { stats, recentUsers, recentHikes });
});

router.get('/users', requireAdmin, (req, res) => {
  const users = dbAll('SELECT * FROM users ORDER BY created_at DESC');
  res.render('admin-users', { users });
});

router.get('/trails', requireAdmin, (req, res) => {
  const trails = dbAll('SELECT * FROM trails ORDER BY name');
  res.render('admin-trails', { trails });
});

router.get('/trails/new', requireAdmin, (req, res) => {
  res.render('admin-trail-form', { trail: null });
});

router.get('/trails/:id', requireAdmin, (req, res) => {
  const trail = dbGet('SELECT * FROM trails WHERE id = ?', [req.params.id]);
  if (!trail) return res.redirect('/admin/trails');
  res.render('admin-trail-detail', { trail });
});

router.get('/trails/:id/edit', requireAdmin, (req, res) => {
  const trail = dbGet('SELECT * FROM trails WHERE id = ?', [req.params.id]);
  if (!trail) return res.redirect('/admin/trails');
  res.render('admin-trail-form', { trail });
});

router.post('/trails', requireAdmin, (req, res) => {
  const { name, location, description, difficulty, distance, elevation_gain, estimated_time, entry_fee, latitude, longitude, image_url, best_season } = req.body;
  
  try {
    dbRun(`INSERT INTO trails (name, location, description, difficulty, distance, elevation_gain, estimated_time, entry_fee, latitude, longitude, image_url, best_season) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
      [name, location, description, difficulty, distance, elevation_gain, estimated_time, entry_fee, latitude, longitude, image_url, best_season]);
    res.redirect('/admin/trails?success=Trail added successfully');
  } catch (err) {
    res.redirect('/admin/trails?error=Failed to add trail');
  }
});

router.post('/trails/:id', requireAdmin, (req, res) => {
  const { name, location, description, difficulty, distance, elevation_gain, estimated_time, entry_fee, latitude, longitude, image_url, best_season } = req.body;
  
  try {
    dbRun(`UPDATE trails SET name = ?, location = ?, description = ?, difficulty = ?, distance = ?, elevation_gain = ?, estimated_time = ?, entry_fee = ?, latitude = ?, longitude = ?, image_url = ?, best_season = ? WHERE id = ?`, 
      [name, location, description, difficulty, distance, elevation_gain, estimated_time, entry_fee, latitude, longitude, image_url, best_season, req.params.id]);
    res.redirect('/admin/trails?success=Trail updated successfully');
  } catch (err) {
    res.redirect('/admin/trails?error=Failed to update trail');
  }
});

router.post('/trails/:id/delete', requireAdmin, (req, res) => {
  try {
    dbRun('DELETE FROM trails WHERE id = ?', [req.params.id]);
    res.redirect('/admin/trails?success=Trail deleted successfully');
  } catch (err) {
    res.redirect('/admin/trails?error=Failed to delete trail');
  }
});

router.post('/users/:id/toggle-admin', requireAdmin, (req, res) => {
  const user = dbGet('SELECT is_admin FROM users WHERE id = ?', [req.params.id]);
  if (user) {
    const newStatus = user.is_admin ? 0 : 1;
    dbRun('UPDATE users SET is_admin = ? WHERE id = ?', [newStatus, req.params.id]);
  }
  res.redirect('/admin/users');
});

router.post('/users/:id/delete', requireAdmin, (req, res) => {
  try {
    dbRun('DELETE FROM reviews WHERE user_id = ?', [req.params.id]);
    dbRun('DELETE FROM favorites WHERE user_id = ?', [req.params.id]);
    dbRun('DELETE FROM hikes WHERE user_id = ?', [req.params.id]);
    dbRun('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.redirect('/admin/users?success=User deleted successfully');
  } catch (err) {
    res.redirect('/admin/users?error=Failed to delete user');
  }
});

router.get('/hikes', requireAdmin, (req, res) => {
  const hikes = dbAll(`
    SELECT h.*, t.name as trail_name, u.username
    FROM hikes h
    JOIN trails t ON h.trail_id = t.id
    JOIN users u ON h.user_id = u.id
    ORDER BY h.date DESC
  `);
  res.render('admin-hikes', { hikes });
});

module.exports = router;
