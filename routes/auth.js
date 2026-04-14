const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { dbGet, dbAll, dbRun } = require('../data/database');

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

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = dbGet('SELECT * FROM users WHERE email = ?', [email]);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.render('login', { error: 'Invalid email or password', redirect: req.body.redirect || '' });
  }

  req.session.user = {
    id: user.id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    experience_level: user.experience_level,
    is_admin: user.is_admin
  };

  const redirect = req.body.redirect || (user.is_admin ? '/admin/dashboard' : '/');
  res.redirect(redirect);
});

router.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  const existingUser = dbGet('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]);
  if (existingUser) {
    return res.render('register', { error: 'Email or username already exists' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  
  try {
    const result = dbRun('INSERT INTO users (username, email, password, avatar, experience_level) VALUES (?, ?, ?, ?, ?)', [username, email, hashedPassword, '/images/default-avatar.svg', 'beginner']);
    
    req.session.user = {
      id: result.lastInsertRowid,
      username: username,
      email: email,
      avatar: '/images/default-avatar.svg',
      experience_level: 'beginner',
      is_admin: 0
    };

    res.redirect('/');
  } catch (err) {
    res.render('register', { error: 'Registration failed. Please try again.' });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
