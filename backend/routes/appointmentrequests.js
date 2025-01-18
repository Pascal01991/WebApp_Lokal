const express = require('express');
const router = express.Router();
const AppointmentRequests = require('../models/AppointmentRequestsModel');

// GET: Alle Termine abrufen
router.get('/', async (req, res) => {
    try {
        console.log("POST Request erhalten:", req.body);  // Logge die empfangenen Daten
        // Hier kannst du die Header ausgeben
        console.log(req.headers); // Diese Zeile zeigt den Authorization-Header und andere Header in der Konsole an

        const AppointmentRequestss = await AppointmentRequests.find();
        res.json(AppointmentRequestss);
    } catch (err) {
        res.status(500).json({ msg: 'Fehler beim Abrufen der Termine' });
    }
});

router.post('/', async (req, res) => {
    try {
        console.log("POST Request empfangen:", req.body);

        // Wir lesen jetzt startDateTime, optional endDateTime und duration etc.
        const {
            startDateTime,
            endDateTime,
            duration,
            description,
            KundennummerzumTermin,
            Preis,
            Abrechnungsstatus,
            MailAppointmentRequests,
            Dienstleistung,
            erfasstDurch,
            letzterBearbeiter,
            Ressource,
            projektId,
            verrechnungsTyp,
            erbringungsStatus,
            fakturaBemerkung,
            fakturaNummer,
    
            // Abweichender Rechnungsempfänger
            rechnungsEmpfaengerNummer
        } = req.body;

        // Validierung (Pflichtfelder)
        // Bisher stand dort "!duration || !dateTime || !description"
        // Jetzt prüfen wir "!startDateTime"
        if (!startDateTime || !duration || !description) {
            return res.status(400).json({
                msg: "Fehlende Felder: startDateTime, duration oder description"
            });
        }

        // Neues AppointmentRequests-Objekt anlegen
        const newAppointmentRequests = new AppointmentRequests({
            // Pflicht:
            startDateTime,
            duration,
            description,

            // Optionale Felder:
            endDateTime,
            KundennummerzumTermin,
            Preis,
            Abrechnungsstatus,
            MailAppointmentRequests,
            Dienstleistung,
    
            // Abwicklung
            erfasstDurch,
            letzterBearbeiter,
            Ressource,
            projektId,
            verrechnungsTyp,
            erbringungsStatus,
            fakturaBemerkung,
            fakturaNummer,
    
            // Abweichender Rechnungsempfänger
            rechnungsEmpfaengerNummer


        });

        // Speichern
        await newAppointmentRequests.save();

        console.log("Neuer Termin gespeichert:", newAppointmentRequests);
        console.log("POST Request empfangen:", req.body);
        console.log("Schema: ", AppointmentRequests.schema.paths);

        res.status(201).json(newAppointmentRequests);

    } catch (err) {
        console.error("Fehler beim Speichern des Termins:", err.message);
        console.error(err.stack);
        res.status(500).json({
            msg: 'Fehler beim Hinzufügen des Termins',
            error: err.message
        });
    }
});


//Route für Löschen Button
router.delete('/:id', async (req, res) => {
    try {
        console.log("Löschanfrage erhalten für ID: ", req.params.id);
        const AppointmentRequests = await AppointmentRequests.findByIdAndDelete(req.params.id);
        if (!AppointmentRequests) {
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
        const updatedAppointmentRequests = await AppointmentRequests.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedAppointmentRequests) {
            return res.status(404).json({ msg: 'Termin nicht gefunden' });
        }
        res.json(updatedAppointmentRequests);
    } catch (err) {
        res.status(500).json({ msg: 'Fehler beim Aktualisieren des Termins', error: err.message });
    }
});



module.exports = router;


