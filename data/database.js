const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

async function dbGet(sql, params = []) {
  try {
    const result = await pool.query(sql, params);
    return result.rows[0] || null;
  } catch (e) {
    console.error('dbGet error:', e.message);
    return null;
  }
}

async function dbAll(sql, params = []) {
  try {
    const result = await pool.query(sql, params);
    return result.rows;
  } catch (e) {
    console.error('dbAll error:', e.message);
    return [];
  }
}

async function dbRun(sql, params = []) {
  try {
    const result = await pool.query(sql, params);
    return { lastInsertRowid: result.insertId, changes: result.rowCount };
  } catch (e) {
    console.error('dbRun error:', e.message);
    return { lastInsertRowid: 0, changes: 0 };
  }
}

async function initDb() {
  const client = await pool.connect();
  
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        avatar TEXT DEFAULT '/images/default-avatar.svg',
        bio TEXT DEFAULT '',
        experience_level TEXT DEFAULT 'beginner',
        total_hikes INTEGER DEFAULT 0,
        total_distance REAL DEFAULT 0,
        is_admin INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS trails (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        location TEXT NOT NULL,
        description TEXT,
        difficulty TEXT DEFAULT 'moderate',
        distance REAL DEFAULT 0,
        elevation_gain INTEGER DEFAULT 0,
        estimated_time TEXT,
        entry_fee REAL DEFAULT 0,
        latitude REAL,
        longitude REAL,
        image_url TEXT,
        gallery TEXT,
        permits_required TEXT,
        tips TEXT,
        highlights TEXT,
        features TEXT,
        best_season TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        trail_id INTEGER NOT NULL,
        rating INTEGER CHECK(rating >= 1 AND rating <= 5),
        comment TEXT,
        tips TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (trail_id) REFERENCES trails(id)
      );

      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        trail_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (trail_id) REFERENCES trails(id),
        UNIQUE(user_id, trail_id)
      );

      CREATE TABLE IF NOT EXISTS hikes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        trail_id INTEGER NOT NULL,
        date DATE NOT NULL,
        notes TEXT,
        duration TEXT,
        completed INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (trail_id) REFERENCES trails(id)
      );

      CREATE TABLE IF NOT EXISTS trips (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        trail_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        trip_date DATE NOT NULL,
        itinerary TEXT,
        invitees TEXT,
        notes TEXT,
        status TEXT DEFAULT 'planned',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (trail_id) REFERENCES trails(id)
      );

      CREATE TABLE IF NOT EXISTS achievements (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        requirement INTEGER,
        type TEXT
      );

      CREATE TABLE IF NOT EXISTS emergency_contacts (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        location TEXT,
        type TEXT
      );
    `);

    const trailCount = await client.query('SELECT COUNT(*) as count FROM trails');
    if (parseInt(trailCount.rows[0].count) === 0) {
      const trails = [
        ['Mt. Batulao', 'Batangas', 'Mt. Batulao is one of the most popular hiking destinations in the Philippines, known for its challenging yet rewarding trails.', 'moderate', 12.5, 700, '5-6 hours', 0, 14.0683, 120.8328, 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800', '[]', '["DENR Permit","Barangay Clearance"]', '["Start early to avoid the heat","Bring atleast 2L of water"]', '["Summit views","Pine tree forest"]', '[]', 'November-April'],
        ['Mt. Pico de Loro', 'Batangas', 'Mt. Pico de Loro is named after the parrot-shaped peak visible from the summit.', 'hard', 14, 850, '6-8 hours', 50, 14.1368, 120.7927, 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800', '[]', '["DENR Permit"]', '["Technical climb - bring gloves","Very steep trail"]', '["Parrot peak formation","Coastal views"]', '[]', 'November-March'],
        ['Mt. Tagaytay', 'Cavite', 'Mt. Tagaytay offers one of the most accessible hiking experiences near Metro Manila.', 'easy', 8, 250, '3-4 hours', 0, 14.0947, 120.9239, 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800', '[]', '[]', '["Paved road to summit","Family-friendly"]', '["Taal Volcano view","Picnic areas"]', '[]', 'November-May'],
        ['Mt. Samat', 'Bataan', 'Mt. Samat is a historical landmark known for its iconic cross at the summit.', 'moderate', 10, 500, '4-5 hours', 30, 14.8189, 120.5365, 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800', '[]', '["DENR Permit"]', '["Bring agua","Visit the memorial cross"]', '["Iconic cross at summit"]', '[]', 'November-April'],
        ['Mt. Apo', 'Davao del Sur', 'Mt. Apo is the highest peak in the Philippines at 2,956 meters.', 'hard', 22, 2200, '2-3 days', 150, 6.8814, 125.2625, 'https://images.unsplash.com/photo-1464278533981-50106e6176b1?w=800', '[]', '["DENR Permit"]', '["Multi-day trek - prepare supplies","Bring warm clothes"]', '["Highest peak in PH"]', '[]', 'March-May'],
        ['Mt. Pulag', 'Benguet', 'Mt. Pulag is the second highest peak in the Philippines, famous for its sea of clouds.', 'hard', 18, 1800, '2 days', 100, 16.5781, 120.7411, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', '[]', '["DENR Permit"]', '["Very cold at night","Bring warm layers"]', '["Sea of clouds"]', '[]', 'November-February'],
        ['Taal Volcano', 'Batangas', 'Taal Volcano is one of the smallest active volcanoes in the world.', 'moderate', 6, 350, '3-4 hours', 500, 14.0022, 120.9975, 'https://images.unsplash.com/photo-1548009859-e6b4f85708b5?w=800', '[]', '["Taal Volcano ticket"]', '["Wear sturdy shoes","Bring dust mask"]', '["Volcanic crater"]', '[]', 'November-May'],
        ['Mt. Daguldul', 'Batangas', 'Mt. Daguldul offers a scenic coastal hike with rewarding views.', 'moderate', 9, 600, '4-5 hours', 0, 13.9427, 120.8324, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', '[]', '["Barangay Permit"]', '["Sunrise hike recommended","Bring water"]', '["Beach views"]', '[]', 'November-April']
      ];

      for (const trail of trails) {
        await client.query(
          `INSERT INTO trails (name, location, description, difficulty, distance, elevation_gain, estimated_time, entry_fee, latitude, longitude, image_url, gallery, permits_required, tips, highlights, features, best_season) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
          trail
        );
      }
    }

    const emergencyCount = await client.query('SELECT COUNT(*) as count FROM emergency_contacts');
    if (parseInt(emergencyCount.rows[0].count) === 0) {
      await client.query('INSERT INTO emergency_contacts (name, phone, location, type) VALUES ($1, $2, $3, $4)', ['Philippine National Police', '911', 'Nationwide', 'emergency']);
      await client.query('INSERT INTO emergency_contacts (name, phone, location, type) VALUES ($1, $2, $3, $4)', ['Batangas Provincial Hospital', '(043) 723-0101', 'Batangas', 'hospital']);
      await client.query('INSERT INTO emergency_contacts (name, phone, location, type) VALUES ($1, $2, $3, $4)', ['Red Cross Philippines', '143', 'Nationwide', 'emergency']);
    }

    const achievementCount = await client.query('SELECT COUNT(*) as count FROM achievements');
    if (parseInt(achievementCount.rows[0].count) === 0) {
      await client.query('INSERT INTO achievements (name, description, icon, requirement, type) VALUES ($1, $2, $3, $4, $5)', ['First Steps', 'Complete your first hike', '🥾', 1, 'hikes']);
      await client.query('INSERT INTO achievements (name, description, icon, requirement, type) VALUES ($1, $2, $3, $4, $5)', ['Trail Blazer', 'Complete 5 hikes', '🌲', 5, 'hikes']);
      await client.query('INSERT INTO achievements (name, description, icon, requirement, type) VALUES ($1, $2, $3, $4, $5)', ['Mountain Master', 'Complete 25 hikes', '🏔️', 25, 'hikes']);
    }

    const adminCheck = await client.query('SELECT id FROM users WHERE is_admin = 1');
    if (adminCheck.rows.length === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      await client.query('INSERT INTO users (username, email, password, is_admin) VALUES ($1, $2, $3, $4)', ['admin', 'admin@hikehorizon.com', hashedPassword, 1]);
    }

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Init error:', err.message);
  } finally {
    client.release();
  }
}

module.exports = { pool, dbGet, dbAll, dbRun, initDb };