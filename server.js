require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const bcrypt = require('bcryptjs');
const { dbGet, dbAll, dbRun, initDb } = require('./data/database');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'hikehorizon_secret_key_2024',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'lax',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  }
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
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

app.get('/', (req, res) => {
  const featuredTrails = dbAll(`
    SELECT t.*, AVG(r.rating) as avg_rating, COUNT(r.id) as review_count
    FROM trails t
    LEFT JOIN reviews r ON t.id = r.trail_id
    GROUP BY t.id
    ORDER BY avg_rating DESC, review_count DESC
    LIMIT 6
  `);
  const stats = {
    totalTrails: dbGet('SELECT COUNT(*) as count FROM trails')?.count || 0,
    totalUsers: dbGet('SELECT COUNT(*) as count FROM users')?.count || 0,
    totalHikes: dbGet('SELECT COUNT(*) as count FROM hikes')?.count || 0
  };
  res.render('home', { featuredTrails, stats });
});

app.get('/map', (req, res) => {
  const trails = dbAll('SELECT * FROM trails');
  res.render('map', { trails });
});

app.get('/community', (req, res) => {
  const recentHikes = dbAll(`
    SELECT h.*, t.name as trail_name, u.username
    FROM hikes h
    JOIN trails t ON h.trail_id = t.id
    JOIN users u ON h.user_id = u.id
    ORDER BY h.created_at DESC
    LIMIT 20
  `);
  res.render('community', { recentHikes });
});

app.get('/emergency', (req, res) => {
  const contacts = dbAll('SELECT * FROM emergency_contacts');
  res.render('emergency', { contacts });
});

app.get('/checklist', (req, res) => {
  res.render('checklist');
});

app.get('/plan', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login?redirect=/plan');
  }
  const trails = dbAll('SELECT * FROM trails ORDER BY name');
  res.render('plan', { trails });
});

app.use((req, res) => {
  res.status(404).render('404');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { error: err });
});

initDb();

app.listen(PORT, () => {
  console.log(`Hike Horizon server running on http://localhost:${PORT}`);
});

module.exports = app;
