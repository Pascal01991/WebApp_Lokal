require('dotenv').config();

const express = require('express');
const connectDB = require('./config/db');
const logger = require('./middleware/logger');
const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments'); // Routen für Termine
const auth = require('./middleware/authMiddleware');
const cors = require('cors');
const clientRoutes = require('./routes/clients');


const app = express();

// Verbindung zur Datenbank
connectDB();

// CORS-Einstellungen
app.use(cors({
    origin: ['http://localhost:8080', 'http://127.0.0.1:8080'],  // Deine Frontend-URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,  // Damit Cookies und Anmeldeinformationen gesendet werden können
    preflightContinue: false,
    optionsSuccessStatus: 204  // Erfolgreiche OPTIONS-Anfrage wird mit 204 beantwortet (keine Inhalte)
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

// Client-Routen hinzufügen
app.use('/api/clients', clientRoutes);

// Geschützte Route
app.get('/api/protected', auth, (req, res) => {
    res.json({ msg: 'Dies ist eine geschützte Route', user: req.user });
});

// Starte den Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});
