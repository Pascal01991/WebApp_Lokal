require('dotenv').config();

const express = require('express');
const connectDB = require('./config/db');
const logger = require('./middleware/logger');
const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments'); // Routen für Termine
const auth = require('./middleware/authMiddleware');
const cors = require('cors');

const app = express();

// Verbindung zur Datenbank
connectDB();

// CORS-Einstellungen
app.use(cors({
    origin: 'http://localhost:3000',  // Deine Frontend-URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true  // Damit Cookies und Anmeldeinformationen gesendet werden können
}));

// Middleware (für JSON und Logger)
app.use(express.json());
app.use(logger);

// Einfache Route
app.get('/', (req, res) => res.send('API läuft'));

// Auth-Routen
app.use('/api/auth', authRoutes); // Authentifizierungsrouten

// Termin-Routen
app.use('/api/appointments', appointmentRoutes); // Terminrouten einbinden

// Geschützte Route
app.get('/api/protected', auth, (req, res) => {
    res.json({ msg: 'Dies ist eine geschützte Route', user: req.user });
});

// Starte den Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});


//server
//database


//mvc modules
//models
//middleware
//controller
//routes
