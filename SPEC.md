# Hike Horizon - Specification Document

## 1. Project Overview

**Project Name:** Hike Horizon  
**Project Type:** Full-stack Web Application  
**Core Functionality:** A hiking trail discovery platform that helps users find, explore, and log hiking trails with features for safety, community, and trip planning.  
**Target Users:** Hiking enthusiasts, outdoor adventurers, and beginners looking for trail information.

---

## 2. Tech Stack

- **Frontend:** Node.js + Express + EJS Templates
- **Styling:** Tailwind CSS
- **Database:** SQLite (file-based, Vercel-compatible)
- **Deployment:** Vercel
- **Maps:** Leaflet.js (OpenStreetMap - free, no API key needed)

---

## 3. UI/UX Specification

### Color Palette
- **Primary:** `#2D5A27` (Forest Green)
- **Primary Dark:** `#1E3D1A` (Dark Forest)
- **Secondary:** `#F4A460` (Sandy Brown - Mountain/Sunset)
- **Accent:** `#87CEEB` (Sky Blue)
- **Background:** `#F8F9F5` (Light Sage)
- **Dark Background:** `#1A1F1A` (Night Forest)
- **Text Primary:** `#2C3E2C` (Dark Green-Gray)
- **Text Light:** `#F8F9F5` (Off-white)
- **Success:** `#4CAF50`
- **Warning:** `#FF9800`
- **Danger:** `#E53935`

### Typography
- **Headings:** "Outfit" (Google Fonts) - Bold, Modern
- **Body:** "DM Sans" (Google Fonts) - Clean, Readable
- **Sizes:**
  - H1: 3rem (48px)
  - H2: 2.25rem (36px)
  - H3: 1.5rem (24px)
  - Body: 1rem (16px)
  - Small: 0.875rem (14px)

### Spacing System
- Base unit: 4px
- Common: 8px, 16px, 24px, 32px, 48px, 64px

### Layout
- **Header:** Fixed top navigation with logo, nav links, user menu
- **Hero:** Full-width banner with background image/gradient
- **Content:** Max-width 1280px, centered
- **Footer:** Dark themed with links and copyright
- **Responsive:** Mobile-first, breakpoints: 640px, 768px, 1024px, 1280px

### Visual Effects
- Card shadows: `0 4px 6px -1px rgba(0, 0, 0, 0.1)`
- Hover transitions: 200ms ease
- Button hover: scale(1.02), brightness increase
- Page load animations: fade-in with slight upward movement

---

## 4. Database Schema

### Users
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| username | TEXT | Unique |
| email | TEXT | Unique |
| password | TEXT | Hashed |
| avatar | TEXT | URL or default |
| bio | TEXT | User bio |
| experience_level | TEXT | beginner/intermediate/advanced |
| total_hikes | INTEGER | Count |
| total_distance | REAL | Kilometers |
| created_at | DATETIME | Registration date |

### Trails
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| name | TEXT | Trail name |
| location | TEXT | Region/province |
| description | TEXT | Full description |
| difficulty | TEXT | easy/moderate/hard |
| distance | REAL | Kilometers |
| elevation_gain | INTEGER | Meters |
| estimated_time | TEXT | e.g., "4-5 hours" |
| entry_fee | REAL | PHP amount |
| latitude | REAL | GPS coordinate |
| longitude | REAL | GPS coordinate |
| image_url | TEXT | Main image |
| gallery | TEXT | JSON array of images |
| permits_required | TEXT | JSON array |
| tips | TEXT | JSON array |
| highlights | TEXT | JSON array |
| created_at | DATETIME | |

### Reviews
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| user_id | INTEGER FK | |
| trail_id | INTEGER FK | |
| rating | INTEGER | 1-5 stars |
| comment | TEXT | |
| tips | TEXT | User tips |
| created_at | DATETIME | |

### Favorites
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | |
| user_id | INTEGER FK | |
| trail_id | INTEGER FK | |
| created_at | DATETIME | |

### Hikes (History)
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | |
| user_id | INTEGER FK | |
| trail_id | INTEGER FK | |
| date | DATE | |
| notes | TEXT | |
| duration | TEXT | |
| created_at | DATETIME | |

### Emergency Contacts
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | |
| name | TEXT | Contact name |
| phone | TEXT | Phone number |
| location | TEXT | Area served |
| type | TEXT | hospital/ranger/emergency |

---

## 5. Page Structure

### Pages to Build

1. **Home Page (`/`)**
   - Hero section with search
   - Featured trails carousel
   - Stats counter
   - Call to action

2. **Trail Finder (`/trails`)**
   - Search filters (location, difficulty, distance)
   - Grid of trail cards
   - Map toggle view

3. **Trail Details (`/trails/:id`)**
   - Trail hero image
   - Info cards (difficulty, distance, elevation, time)
   - Interactive map with pins
   - Weather widget
   - Reviews section
   - Safety info
   - Permit requirements

4. **Map View (`/map`)**
   - Full-screen interactive map
   - Trail markers
   - Filter controls
   - Trail info popup

5. **User Authentication (`/login`, `/register`)**
   - Login form
   - Registration form
   - Profile preview

6. **User Dashboard (`/dashboard`)**
   - Stats overview
   - Hiking history
   - Favorites list
   - Achievements
   - Upcoming trips

7. **Trip Planner (`/plan`)**
   - Create new trip
   - Date picker
   - Trail selection
   - Invite friends
   - Itinerary builder

8. **Checklist Generator (`/checklist`)**
   - Difficulty selector
   - Duration input
   - Generate gear list
   - Print/share option

9. **Community (`/community`)**
   - Photo gallery
   - Group finder
   - Recent hikes feed

10. **Emergency (`/emergency`)**
    - Emergency contacts list
    - Nearest hospital finder
    - Check-in feature
    - Safety tips

---

## 6. Core Features Implementation

### MVP Features (Phase 1)
1. Trail listing with search/filter
2. Trail details page with map
3. User registration/login
4. Reviews and ratings
5. Favorites system
6. Hiking history logging

### Phase 2 Features
7. Interactive map with trail pins
8. Trip planner
9. Checklist generator
10. Photo sharing
11. Weather integration

### Phase 3 Features
12. Emergency info page
13. Offline mode prep
14. Achievements/gamification
15. AI recommendations
16. Alerts/notifications

---

## 7. API Endpoints

### Auth
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Trails
- `GET /api/trails` - List trails (with filters)
- `GET /api/trails/:id` - Get trail details
- `GET /api/trails/search` - Search trails

### Reviews
- `GET /api/trails/:id/reviews` - Get reviews
- `POST /api/trails/:id/reviews` - Add review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

### User
- `GET /api/user/profile` - Get profile
- `PUT /api/user/profile` - Update profile
- `GET /api/user/favorites` - Get favorites
- `POST /api/user/favorites/:trailId` - Add favorite
- `DELETE /api/user/favorites/:trailId` - Remove favorite
- `GET /api/user/hikes` - Get hike history
- `POST /api/user/hikes` - Log hike

### Emergency
- `GET /api/emergency/contacts` - Get contacts

---

## 8. Acceptance Criteria

### Visual Checkpoints
- [ ] Home page loads with hero, featured trails, stats
- [ ] Navigation is responsive and works on mobile
- [ ] Trail cards display all required information
- [ ] Map shows trail markers correctly
- [ ] Forms have proper validation feedback
- [ ] Colors match the specified palette

### Functionality Checkpoints
- [ ] User can register and login
- [ ] User can search and filter trails
- [ ] User can view trail details
- [ ] User can leave reviews
- [ ] User can save favorites
- [ ] User can log hikes
- [ ] Dashboard shows correct stats

### Performance
- [ ] Pages load within 3 seconds
- [ ] No console errors on load
- [ ] Responsive on all breakpoints

---

## 9. Seed Data

Initial trails to include:
1. Mt. Batulao - Batangas (Easy-Mod, 12km)
2. Mt. Tagaytay - Cavite (Easy, 8km)
3. Mt. Pico de Loro - Batangas (Hard, 14km)
4. Mt. Samat - Bataan (Moderate, 10km)
5. Mt. Apo - Davao (Hard, 22km)
6. Mt. Pulag - Benguet (Hard, 18km)
7. Taal Volcano - Batangas (Easy, 6km)
8. Mt. Daguldul - Batangas (Moderate, 9km)
