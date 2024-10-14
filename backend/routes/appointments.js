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

        const { title, date, description, Vorname, Nachname, Telefon, Mail, Dienstleistung } = req.body;

        // Überprüfen, ob die Felder vorhanden sind
        if (!title || !date || !description) {
            return res.status(400).json({ msg: "Fehlende Felder: Titel, Datum oder Beschreibung" });
        }

        const newAppointment = new Appointment({ title, date, description, Vorname, Nachname, Telefon, Mail, Dienstleistung });
        await newAppointment.save();

        console.log("Neuer Termin gespeichert:", newAppointment);  // Prüfen, ob der Termin korrekt gespeichert wird
        console.log("POST Request empfangen:", req.body);
        console.log("Schema: ", Appointment.schema.paths);  // Zeigt alle Felder im Schema an

        res.status(201).json(newAppointment);
    } catch (err) {
        console.error("Fehler beim Speichern des Termins:", err.message);
        res.status(500).json({ msg: 'Fehler beim Hinzufügen des Termins', error: err.message });
    }
});


//Route für Löschen Button
router.delete('/:id', async (req, res) => {
    try {
        console.log("Löschanfrage erhalten für ID: ", req.params.id);
        const appointment = await Appointment.findByIdAndDelete(req.params.id);
        if (!appointment) {
            console.log(`Kein Termin gefunden für ID: ${req.params.id}`);
            return res.status(404).json({ msg: 'Termin nicht gefunden' });
        }
        res.json({ msg: 'Termin gelöscht' });
    } catch (err) {
        console.error("Fehler beim Löschen des Termins:", err.message);
        console.error("Stack Trace:", err.stack); // Stacktrace für genauere Fehlerdetails
        console.error("Request Params:", req.params); // Zeige die Parameter des Requests
        console.error("Request Headers:", req.headers); // Zeige die Header des Requests
        res.status(500).json({ msg: 'Fehler beim Löschen des Termins', error: err.message });
    }
});

//Route für Bearbeiten Button
router.put('/:id', async (req, res) => {
    try {
        const updatedAppointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedAppointment) {
            return res.status(404).json({ msg: 'Termin nicht gefunden' });
        }
        res.json(updatedAppointment);
    } catch (err) {
        res.status(500).json({ msg: 'Fehler beim Aktualisieren des Termins', error: err.message });
    }
});



module.exports = router;


