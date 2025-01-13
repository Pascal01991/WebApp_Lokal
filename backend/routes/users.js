const express = require('express');
const router = express.Router();
const User = require('../models/userModel'); // Pfad zum UserModel ggf. anpassen

// Neuen User erstellen
router.post('/', async (req, res) => {
    try {
        // OPTIONALE Logik für automatische userID o. Ä. könnte hier eingefügt werden.
        // Beispiel (sehr vereinfacht): userID hochzählen.
        // ACHTUNG: Das funktioniert nur, wenn userID numerisch ist oder 
        //          du eine String-Parsierung für das Hochzählen implementierst.
        
        // 1) Letzter User anhand userID in absteigender Reihenfolge
        const lastUser = await User.findOne().sort({ userID: -1 });
        
        // 2) Berechne die nächste userID
        let nextUserID = 0;
        if (lastUser && Number.isInteger(lastUser.userID)) {
            nextUserID = lastUser.userID + 1;
        }
        // 3) Neuen User erstellen, userID setzen
        const newUser = new User({
            ...req.body,
            userID: nextUserID
        });
        await newUser.save();

        res.status(201).json(newUser);
    } catch (error) {
        console.error('Fehler beim Erstellen des Users:', error);
        res.status(500).json({ error: 'Fehler beim Erstellen des Users' });
    }
});

// Alle User abrufen
router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        console.error('Fehler beim Abrufen der Users:', error);
        res.status(500).json({ error: 'Fehler beim Abrufen der Users' });
    }
});

// Einzelnen User abrufen
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User nicht gefunden' });
        res.json(user);
    } catch (error) {
        console.error('Fehler beim Abrufen des Users:', error);
        res.status(500).json({ error: 'Fehler beim Abrufen des Users' });
    }
});

// User aktualisieren
router.put('/:id', async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ error: 'User nicht gefunden' });
      
      // userID, username, email werden immer aktualisiert:
      if (req.body.userID !== undefined)    user.userID = req.body.userID;
      if (req.body.username !== undefined)  user.username = req.body.username;
      if (req.body.email !== undefined)     user.email = req.body.email;
      
      // Passwort nur updaten, wenn übergeben und nicht leer
      if (req.body.password && req.body.password.trim().length > 0) {
        user.password = req.body.password;
      }
      
      await user.save(); // Triggert .pre('save') (Hashing)
      res.json(user);
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Users:', error);
      res.status(500).json({ error: 'Fehler beim Aktualisieren des Users' });
    }
  });
  

// User löschen
router.delete('/:id', async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) return res.status(404).json({ error: 'User nicht gefunden' });
        res.json({ message: 'User gelöscht' });
    } catch (error) {
        console.error('Fehler beim Löschen des Users:', error);
        res.status(500).json({ error: 'Fehler beim Löschen des Users' });
    }
});

module.exports = router;
