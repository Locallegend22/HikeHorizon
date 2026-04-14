require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const { dbGet, dbAll, dbRun, initDb } = require('./data/database');

const app = express();
const PORT = 3001;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'test123',
  resave: false,
  saveUninitialized: false
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.path = req.path;
  next();
});

app.get('/admintest', (req, res) => {
  res.send('Admin route works!');
});

const server = app.listen(PORT, () => {
  console.log(`Test server on http://localhost:${PORT}`);
});
