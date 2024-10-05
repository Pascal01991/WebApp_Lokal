const express = require('express');
const router = express.Router();
const Appointment = require('../models/appointmentModel');

// GET: Alle Termine abrufen
router.get('/', async (req, res) => {
    try {
        console.log("POST Request erhalten:", req.body);  // Logge die empfangenen Daten
        // Hier kannst du die Header ausgeben
        console.log(req.headers); // Diese Zeile zeigt den Authorization-Header und andere Header in der Konsole an

        const appointments = await Appointment.find();
        res.json(appointments);
    } catch (err) {
        res.status(500).json({ msg: 'Fehler beim Abrufen der Termine' });
    }
});

router.post('/', async (req, res) => {
    try {
        console.log("POST Request empfangen:", req.body);  // Prüfen, ob die Daten korrekt empfangen werden

        const { title, date, description } = req.body;

        // Überprüfen, ob die Felder vorhanden sind
        if (!title || !date || !description) {
            return res.status(400).json({ msg: "Fehlende Felder: Titel, Datum oder Beschreibung" });
        }

        const newAppointment = new Appointment({ title, date, description });
        await newAppointment.save();

        console.log("Neuer Termin gespeichert:", newAppointment);  // Prüfen, ob der Termin korrekt gespeichert wird

        res.status(201).json(newAppointment);
    } catch (err) {
        console.error("Fehler beim Speichern des Termins:", err.message);
        res.status(500).json({ msg: 'Fehler beim Hinzufügen des Termins', error: err.message });
    }
});


module.exports = router;


