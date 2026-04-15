require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');
const bcrypt = require('bcryptjs');
const { dbGet, dbAll, dbRun, initDb } = require('./data/database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'hikehorizon_jwt_secret_2024';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  req.session = {};
  const token = req.cookies.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.session.user = decoded;
      res.locals.user = decoded;
    } catch (e) {
      res.clearCookie('token');
      res.locals.user = null;
    }
  } else {
    res.locals.user = null;
  }
  res.locals.path = req.path;
  next();
});

// ==================== ADMIN ROUTES ====================
const adminRoutes = require('./routes/admin');
app.use('/admin', adminRoutes);

// ==================== OTHER ROUTES ====================
const authRoutes = require('./routes/auth');
const trailRoutes = require('./routes/trails');
const userRoutes = require('./routes/user');
const apiRoutes = require('./routes/api');

app.use('/', authRoutes);
app.use('/trails', trailRoutes);
app.use('/user', userRoutes);
app.use('/api', apiRoutes);

app.get('/', async (req, res) => {
  const featuredTrails = await dbAll(`
    SELECT t.*, AVG(r.rating) as avg_rating, COUNT(r.id) as review_count
    FROM trails t
    LEFT JOIN reviews r ON t.id = r.trail_id
    GROUP BY t.id
    ORDER BY avg_rating DESC, review_count DESC
    LIMIT 6
  `);
  const stats = {
    totalTrails: (await dbGet('SELECT COUNT(*) as count FROM trails'))?.count || 0,
    totalUsers: (await dbGet('SELECT COUNT(*) as count FROM users'))?.count || 0,
    totalHikes: (await dbGet('SELECT COUNT(*) as count FROM hikes'))?.count || 0
  };
  res.render('home', { featuredTrails, stats });
});

app.get('/map', async (req, res) => {
  const trails = await dbAll('SELECT * FROM trails');
  res.render('map', { trails });
});

app.get('/community', async (req, res) => {
  const recentHikes = await dbAll(`
    SELECT h.*, t.name as trail_name, u.username
    FROM hikes h
    JOIN trails t ON h.trail_id = t.id
    JOIN users u ON h.user_id = u.id
    ORDER BY h.created_at DESC
    LIMIT 20
  `);
  res.render('community', { recentHikes });
});

app.get('/emergency', async (req, res) => {
  const contacts = await dbAll('SELECT * FROM emergency_contacts');
  res.render('emergency', { contacts });
});

app.get('/checklist', (req, res) => {
  res.render('checklist');
});

app.get('/plan', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login?redirect=/plan');
  }
  const trails = await dbAll('SELECT * FROM trails ORDER BY name');
  res.render('plan', { trails });
});

app.use((req, res) => {
  res.status(404).render('404');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { error: err });
});

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Hike Horizon server running on http://localhost:${PORT}`);
  });
});

module.exports = app;
