const express = require('express');
const router = express.Router();
const Client = require('../models/clientModel');

// Erstelle einen neuen Client
router.post('/', async (req, res) => {
    try {
        console.log('Empfangene Daten:', req.body);  // Eingehende Daten anzeigen
        const newClient = new Client(req.body);
        await newClient.save();
        res.status(201).json(newClient);
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Erstellen des Clients' });
    }
});

// Alle Clients abrufen
router.get('/', async (req, res) => {
    try {
        const clients = await Client.find();
        res.json(clients);
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Abrufen der Clients' });
    }
});

// Einzelnen Client abrufen
router.get('/:id', async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) return res.status(404).json({ error: 'Client nicht gefunden' });
        res.json(client);
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Abrufen des Clients' });
    }
});

// Client aktualisieren
router.put('/:id', async (req, res) => {
    try {
        const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!client) return res.status(404).json({ error: 'Client nicht gefunden' });
        res.json(client);
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Aktualisieren des Clients' });
    }
});

// Client löschen
router.delete('/:id', async (req, res) => {
    try {
        const client = await Client.findByIdAndDelete(req.params.id);
        if (!client) return res.status(404).json({ error: 'Client nicht gefunden' });
        res.json({ message: 'Client gelöscht' });
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Löschen des Clients' });
    }
});

module.exports = router;
