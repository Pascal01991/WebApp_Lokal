require('dotenv').config();

const express = require('express');
const connectDB = require('./config/db');
const logger = require('./middleware/logger');
const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments'); // Routen für Termine
const cors = require('cors');
const clientRoutes = require('./routes/clients');

//User - Authentifiezierungsroute
const path = require('path');
const auth = require('./middleware/authMiddleware'); // Deine Auth-Middleware
const cookieParser = require('cookie-parser');

const app = express();

//Für User-Authentifizierung
app.use(cookieParser());

// Verbindung zur Datenbank
connectDB();

// CORS-Einstellungen
const allowedOrigins = [
    'http://localhost:8080',  // Lokale Entwicklung
    'http://127.0.0.1:8080',  // Lokale Entwicklung (Alternative)
    'https://www.sapps.ch',    // Deine Produktionsdomain
    'https://sapps.ch'    // Deine Produktionsdomain
];

app.use(cors({
    origin: (origin, callback) => {
        // Wenn kein Origin (z. B. bei Tools wie Postman), erlaube es
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS policy violation'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
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

//User-Authentifiezierungsroute
app.get('/api/dashboard', auth, (req, res) => {
  // Nur wenn auth erfolgreich ist, wird diese Zeile erreicht
  console.log("Authentifizierter Benutzer:", req.user);
  res.sendFile(path.join(__dirname, 'secure', 'dashboard.html'));
});


// Starte den Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server läuft auf Port ${PORT}`);
});


//Errorhandler:
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ msg: 'Interner Serverfehler', error: err.message });
});

