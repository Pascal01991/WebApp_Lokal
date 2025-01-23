require('dotenv').config();

const express = require('express');
const connectDB = require('./config/db');
const logger = require('./middleware/logger');
const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments'); // Routen für Termine
const appointmentrequestRoutes = require('./routes/appointmentrequests'); // Routen für Termine
const cors = require('cors');
const clientRoutes = require('./routes/clients');

//User - Authentifiezierungsroute
const path = require('path');
const auth = require('./middleware/authMiddleware'); // Deine Auth-Middleware
const cookieParser = require('cookie-parser');

//Verfügbarkeiten der Slots
const availabilityRoutes = require('./routes/availability');

//Users
const usersRouter = require('./routes/users');

//Users
const servicesRoutes = require('./routes/services');

const app = express();


//Für User-Authentifizierung
app.use(cookieParser());

//Backend-Konfiguraiton
const corsOptions = require('./config/cors.config');

// CORS-Middleware
app.use(cors(corsOptions));

// Verbindung zur Datenbank
connectDB();




// Middleware (für JSON und Logger)
app.use(express.json());
app.use(logger);

//Statische Auslieferung der CSS und JS für dashboard auch wenn die dashboard.html im backend liegt. Diese Concfig ist lediglich damit die dateien auch lokal ausgeliefert werden. im ionos nicht nötig da Nginx:
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Einfache Route
app.get('/', (req, res) => res.send('API läuft'));

//Absence
const absenceRoutes = require('./routes/absence');
app.use('/api/absence', absenceRoutes);
    


// Auth-Routen
app.use('/api/auth', authRoutes); // Authentifizierungsrouten

//Verfügbarkeiten der Slots
app.use('/api/availability', availabilityRoutes);

//Users
app.use('/api/users', usersRouter);

//Services
app.use('/api/services', servicesRoutes);

// Termin-Routen
app.use('/api/appointments', appointmentRoutes); // Terminrouten einbinden
app.use('/api/appointmentrequests', appointmentrequestRoutes);// appointmentrequestRoutes einbinden

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



