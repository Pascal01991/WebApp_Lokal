const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Überprüfe, ob der Benutzer bereits existiert
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: "Benutzer existiert bereits" });
    }

    // Neuen Benutzer erstellen
    user = new User({ username, email, password });
    await user.save();

    // JWT erstellen
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.status(201).json({ token });
  } catch (err) {
    res.status(500).json({ msg: "Serverfehler" });
  }
};

const login = async (req,res) => {
    const { email, password } = req.body;
  
  try {
    // Überprüfe, ob der Benutzer existiert
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Benutzer nicht gefunden' });
    }

    // Passwort überprüfen
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Ungültiges Passwort' });
    }

    // JWT erstellen
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ msg: 'Serverfehler' });
  }
}

//token

//access token
//refresh token

module.exports = { register, login };
