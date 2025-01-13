const express = require('express');
const router = express.Router();
const Service = require('../models/services'); // Pfad anpassen, falls du den Dateinamen änderst

// Neuen Service erstellen (CREATE) mit automatischem Hochzählen von serviceID
router.post('/', async (req, res) => {
    try {
        // 1) Letztes Service-Dokument nach serviceID in absteigender Reihenfolge finden
        const lastService = await Service.findOne().sort({ serviceID: -1 });

        // 2) Nächste serviceID bestimmen
        let nextServiceID = 0;
        if (lastService && Number.isInteger(lastService.serviceID)) {
            nextServiceID = lastService.serviceID + 1;
        }

        // 3) Neues Service-Objekt mit serviceID erstellen
        const newService = new Service({
            ...req.body,
            serviceID: nextServiceID
        });

        // 4) Speichern
        await newService.save();
        res.status(201).json(newService);
    } catch (error) {
        console.error('Fehler beim Erstellen des Services:', error);
        res.status(500).json({ error: 'Fehler beim Erstellen des Services' });
    }
});

// Alle Services abrufen (READ - alle)
router.get('/', async (req, res) => {
    try {
        const services = await Service.find();
        res.json(services);
    } catch (error) {
        console.error('Fehler beim Abrufen der Services:', error);
        res.status(500).json({ error: 'Fehler beim Abrufen der Services' });
    }
});

// Einzelnen Service abrufen (READ - single)
router.get('/:id', async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            return res.status(404).json({ error: 'Service nicht gefunden' });
        }
        res.json(service);
    } catch (error) {
        console.error('Fehler beim Abrufen des Services:', error);
        res.status(500).json({ error: 'Fehler beim Abrufen des Services' });
    }
});

// Service aktualisieren (UPDATE)
router.put('/:id', async (req, res) => {
    try {
        const updatedService = await Service.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true } // Gibt das aktualisierte Dokument zurück
        );
        if (!updatedService) {
            return res.status(404).json({ error: 'Service nicht gefunden' });
        }
        res.json(updatedService);
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Services:', error);
        res.status(500).json({ error: 'Fehler beim Aktualisieren des Services' });
    }
});

// Service löschen (DELETE)
router.delete('/:id', async (req, res) => {
    try {
        const deletedService = await Service.findByIdAndDelete(req.params.id);
        if (!deletedService) {
            return res.status(404).json({ error: 'Service nicht gefunden' });
        }
        res.json({ message: 'Service gelöscht' });
    } catch (error) {
        console.error('Fehler beim Löschen des Services:', error);
        res.status(500).json({ error: 'Fehler beim Löschen des Services' });
    }
});

module.exports = router;
