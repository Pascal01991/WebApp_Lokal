const express = require('express');
const router = express.Router();
const Settings = require('../models/AbsenceModel');

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
        const { from, to, description, resource, status } = req.body;

        if (!from || !to || !description) {
            return res.status(400).json({ error: 'Felder "from", "to" und "description" sind erforderlich.' });
        }

        const newHoliday = {
            from,
            to,
            description,
            resource: resource || 'Keine Ressource',
            status: status || 'Ausstehend'
        };

        let settings = await Settings.findOne();

        if (!settings) {
            settings = new Settings({ workingHours: {}, holidays: [] });
        }

        settings.holidays.push(newHoliday);
        await settings.save();

        res.status(201).json(settings.holidays);
    } catch (error) {
        console.error('Fehler beim Hinzufügen des Feiertags:', error);
        res.status(500).json({ error: 'Fehler beim Hinzufügen des Feiertags' });
    }
});


// Feiertag bearbeiten
router.put('/holidays/:index', async (req, res) => {
    try {
        console.log('PUT /holidays/:index aufgerufen');
        console.log('Index:', req.params.index);
        console.log('Request Body:', req.body);

        const index = parseInt(req.params.index, 10);
        console.log('Konvertierter Index:', index);

        const { from, to, description } = req.body;
        console.log(`Eingehende Daten - From: ${from}, To: ${to}, Description: ${description}`);

        let settings = await Settings.findOne();
        if (!settings) {
            console.error('Einstellungen nicht gefunden');
            return res.status(404).json({ error: 'Einstellungen nicht gefunden' });
        }

        if (!settings.holidays[index]) {
            console.error(`Feiertag an Index ${index} nicht gefunden`);
            return res.status(404).json({ error: 'Feiertag nicht gefunden' });
        }

        settings.holidays[index] = { from, to, description };
        await settings.save();

        console.log('Aktualisierte Feiertage:', settings.holidays);
        res.json(settings.holidays);
    } catch (error) {
        console.error('Fehler beim Bearbeiten des Feiertags:', error);
        res.status(500).json({ error: 'Fehler beim Bearbeiten des Feiertags' });
    }
});


// Feiertag löschen
router.delete('/holidays/:index', async (req, res) => {
    try {
        console.log('DELETE /holidays/:index aufgerufen');
        console.log('Index:', req.params.index);

        const index = parseInt(req.params.index, 10);
        let settings = await Settings.findOne();

        if (!settings) {
            console.error('Einstellungen nicht gefunden');
            return res.status(404).json({ error: 'Einstellungen nicht gefunden' });
        }

        if (!settings.holidays[index]) {
            console.error(`Feiertag an Index ${index} nicht gefunden`);
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
