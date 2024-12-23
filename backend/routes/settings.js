const express = require('express');
const router = express.Router();
const Settings = require('../models/settingsModel');

// Alle Einstellungen abrufen
router.get('/', async (req, res) => {
    try {
        const settings = await Settings.findOne();
        if (!settings) return res.status(404).json({ error: 'Einstellungen nicht gefunden' });
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Abrufen der Einstellungen' });
    }
});

// Feiertag hinzufügen
router.post('/holidays', async (req, res) => {
    try {
        console.log('Request Body:', req.body);
        const { from, to, description } = req.body;
        
        
        
        let settings = await Settings.findOne();

        if (!settings) {
            console.error('Fehlende Felder im Request Body');
            settings = new Settings({ workingHours: {}, holidays: [] });
        }

        settings.holidays.push({ from, to, description });
        await settings.save();

        console.log('Gespeicherte Feiertage:', settings.holidays); // Logging nach Speicherung

        res.status(201).json(settings.holidays);
    } catch (error) {
        console.error('Fehler beim Hinzufügen des Feiertags:', error);
        res.status(500).json({ error: 'Fehler beim Hinzufügen des Feiertags' });
    }
});

// Feiertag bearbeiten
router.put('/holidays/:index', async (req, res) => {
    try {
        const index = parseInt(req.params.index, 10);
        const { from, to, description } = req.body;
        let settings = await Settings.findOne();

        if (!settings || !settings.holidays[index]) {
            return res.status(404).json({ error: 'Feiertag nicht gefunden' });
        }

        // Feiertag aktualisieren
        settings.holidays[index] = { from, to, description };
        await settings.save();

        res.json(settings.holidays);
    } catch (error) {
        console.error('Fehler beim Bearbeiten des Feiertags:', error);
        res.status(500).json({ error: 'Fehler beim Bearbeiten des Feiertags' });
    }
});

// Feiertag löschen
router.delete('/holidays/:index', async (req, res) => {
    try {
        const index = parseInt(req.params.index, 10);
        let settings = await Settings.findOne();

        if (!settings || !settings.holidays[index]) {
            return res.status(404).json({ error: 'Feiertag nicht gefunden' });
        }

        // Feiertag entfernen
        settings.holidays.splice(index, 1);
        await settings.save();

        res.json(settings.holidays);
    } catch (error) {
        console.error('Fehler beim Löschen des Feiertags:', error);
        res.status(500).json({ error: 'Fehler beim Löschen des Feiertags' });
    }
});


module.exports = router;
