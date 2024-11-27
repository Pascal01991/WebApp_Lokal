const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Registrierung
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'Benutzer existiert bereits' });
        }

        const hashedPassword = await bcrypt.hash(password, 10); // Passwort hashen
        user = new User({ username, email, password: hashedPassword });
        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(201).json({ token });
    } catch (err) {
        res.status(500).json({ msg: 'Serverfehler' });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Benutzer nicht gefunden' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Ungültiges Passwort' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Token im HTTP-only-Cookie speichern
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Nur in HTTPS-Umgebungen aktiv
            maxAge: 3600000, // 1 Stunde
        });

        res.json({ msg: 'Login erfolgreich' });
    } catch (err) {
        res.status(500).json({ msg: 'Serverfehler' });
    }
});

module.exports = router;
