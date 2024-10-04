require('dotenv').config();

const express = require('express');
const connectDB = require('./config/db');
const logger = require('./middleware/logger');
const authRoutes = require('./routes/auth');
const app = express();

const cors = require('cors');
app.use(cors({
origin: 'http://localhost:8080',  // Deine Frontend-URL
methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
allowedHeaders: ['Content-Type', 'Authorization'],
credentials: true  // Damit Cookies und Anmeldeinformationen gesendet werden können
}));


// Verbindung zur Datenbank
connectDB();

// Middleware (für JSON und Logger)
app.use(express.json());
app.use(logger);

// Einfache Route
app.get('/', (req, res) => res.send('API läuft'));

// Auth-Routen
app.use('/api/auth', authRoutes); // Authentifizierungsrouten

// Starte den Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});

const auth = require('./middleware/authMiddleware');

// Geschützte Route
app.get('/api/protected', auth, (req, res) => {
    res.json({ msg: 'Dies ist eine geschützte Route', user: req.user });
  });
  
  

  
