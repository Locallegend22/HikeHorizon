const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { dbGet, dbAll, dbRun } = require('../data/database');

const JWT_SECRET = process.env.JWT_SECRET || 'hikehorizon_jwt_secret_2024';

function requireAdmin(req, res, next) {
  if (!req.session.user || !req.session.user.is_admin) {
    return res.redirect('/login?redirect=/admin');
  }
  next();
}

router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('login', { error: null, redirect: req.query.redirect || '' });
});

router.get('/register', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('register', { error: null });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await dbGet('SELECT * FROM users WHERE email = $1', [email]);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.render('login', { error: 'Invalid email or password', redirect: req.body.redirect || '' });
  }

  const token = jwt.sign({
    id: user.id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    experience_level: user.experience_level,
    is_admin: user.is_admin
  }, JWT_SECRET, { expiresIn: '7d' });

  const redirect = req.body.redirect || (user.is_admin ? '/admin/dashboard' : '/');
  res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
  res.redirect(redirect);
});

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  const existingUser = await dbGet('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
  if (existingUser) {
    return res.render('register', { error: 'Email or username already exists' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  
  try {
    const result = await dbRun('INSERT INTO users (username, email, password, avatar, experience_level) VALUES ($1, $2, $3, $4, $5)', [username, email, hashedPassword, '/images/default-avatar.svg', 'beginner']);
    
    const token = jwt.sign({
      id: result.lastInsertRowid,
      username: username,
      email: email,
      avatar: '/images/default-avatar.svg',
      experience_level: 'beginner',
      is_admin: 0
    }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
    res.redirect('/');
  } catch (err) {
    res.render('register', { error: 'Registration failed. Please try again.' });
  }
});

router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});

module.exports = router;