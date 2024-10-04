const express = require('express');
const router = express.Router();
const Appointment = require('../models/appointmentModel');

// GET: Alle Termine abrufen
router.get('/', async (req, res) => {
    try {
        // Hier kannst du die Header ausgeben
        console.log(req.headers); // Diese Zeile zeigt den Authorization-Header und andere Header in der Konsole an

        const appointments = await Appointment.find();
        res.json(appointments);
    } catch (err) {
        res.status(500).json({ msg: 'Fehler beim Abrufen der Termine' });
    }
});

// POST: Neuen Termin hinzufügen
router.post('/', async (req, res) => {
    try {
        const { date, description } = req.body;
        const newAppointment = new Appointment({ date, description });
        
        await newAppointment.save();
        res.status(201).json(newAppointment);
    } catch (err) {
        res.status(500).json({ msg: 'Fehler beim Hinzufügen des Termins' });
    }
});


module.exports = router;


