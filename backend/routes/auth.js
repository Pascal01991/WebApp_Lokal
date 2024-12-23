const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Registrierung
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Überprüfe, ob der Benutzer bereits existiert
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'Benutzer existiert bereits' });
        }

        // Neues Benutzerkonto erstellen
        user = new User({ username, email, password });
        user.password = await bcrypt.hash(password, 10); // Passwort hashen
        await user.save();

        // JWT erstellen
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        res.status(201).json({ msg: 'Registrierung erfolgreich', token });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Serverfehler' });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Überprüfe, ob der Benutzer existiert
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Benutzer nicht gefunden' });
        }

        // Passwort prüfen
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Ungültiges Passwort' });
        }

        // JWT erstellen
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        res.cookie('token', token, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'Strict' 
          }).json({ msg: 'Login erfolgreich' });
          
    
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Serverfehler' });
    }
});

// GET-Endpunkt (z. B. für einfache Tests)
router.get('/login', (req, res) => {
    res.status(405).json({ msg: 'POST-Anfrage erforderlich für Login' });
});

module.exports = router;
