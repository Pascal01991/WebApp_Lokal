const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ msg: 'Benutzer existiert bereits' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({ username, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ token });
  } catch (err) {
    res.status(500).json({ msg: 'Serverfehler' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password, rememberMe } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ msg: 'Benutzer nicht gefunden' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Ungültiges Passwort' });
    }

    const expiresIn = rememberMe ? '7d' : '1h';
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      // Je nach expiresIn (1h vs. 7 Tage) → maxAge in ms
      maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000
    });

    res.json({ msg: 'Login erfolgreich' });
  } catch (err) {
    res.status(500).json({ msg: 'Serverfehler' + err});
  }
});

module.exports = router;
