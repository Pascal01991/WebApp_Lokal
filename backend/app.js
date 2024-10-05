require('dotenv').config();

const express = require('express');
const connectDB = require('./config/db');
const logger = require('./middleware/logger');
const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments'); // Routen für Termine
const auth = require('./middleware/authMiddleware');
const cors = require('cors');

// Für Google OAuth2
const { google } = require('googleapis');
const app = express();

// Verbindung zur Datenbank
connectDB();

// CORS-Einstellungen
app.use(cors({
    origin: 'http://localhost:8080',  // Deine Frontend-URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true  // Damit Cookies und Anmeldeinformationen gesendet werden können
}));

// Middleware (für JSON und Logger)
app.use(express.json());
app.use(logger);

// Google OAuth2 Konfiguration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,    // Um Umgebungsvariablen zu verwenden, die in der .env-Datei gesetzt sind
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:5000/callback' // Die Callback-URL für Google OAuth
);

// Route zur Authentifizierung mit Google
app.get('/auth', (req, res) => {
  const SCOPES = ['https://www.googleapis.com/auth/calendar'];
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  res.redirect(authUrl);  // Benutzer zur Google OAuth2-Anmeldeseite weiterleiten
});

// Callback-Route nach erfolgreicher Authentifizierung
app.get('/callback', async (req, res) => {
  const code = req.query.code;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    res.send('Authentication successful! Token gespeichert.');
  } catch (err) {
    console.error('Error retrieving access token', err);
    res.status(500).send('Authentication failed');
  }
});

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
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});
